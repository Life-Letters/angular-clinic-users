'use strict';

/**
 * @ngdoc service
 * @name lifelettersApp.userService
 * @description
 * # userService
 * Service in the lifelettersApp.
 */
angular.module('life.users')
  .provider('users', function () {
    
    var rootUrl = null,
        loginPath = '/login',
        behaviours = {},
        userCookieName = 'lifeletteruser'+(window.cookies ? '-'+window.cookies:''),
        userTypes = [
          'Clinician',
          'Patient',
        ];;

    this.setUrl = function(url) { 
      rootUrl = url; 
    };
    this.setLoginPath = function(url) { 
      logingUrl = url; 
    };
    this.addBehaviour = function(name, func) { 
      behaviours[name] = func; 
    };

    this.$get = function ($rootScope, $http, $location, $cookies, $timeout, $q, $log, lodash) {
      if ( !rootUrl ) {
        $log.warn('please set the user service URL via the usersProvider');
        return;
      }

      // Expose the user to the view
      $rootScope.loggedInUser = null;

      // Adds instance specific methods to the user object
      function initUser(user) {
        // Avoid repeating
        if ( user.sync ) { 
          return user; 
        }

        user.name = function() { 
          return lodash.concat(user.title?[user.title]:[], [user.firstName, user.lastName]).join(' ');
        };

        // Add helper methods for type, e.g. isPatient
        user.is = function(type) {
          return user.userType === type; // simple match for speed reasons
        }; 
        angular.forEach(userTypes, function(type) {
          user['is'+type] = function() { return user.is(type); }
        });

        user.fetch = function(type, id) {
          var path = rootUrl+'users/'+user.id+'/'+type+(id ? '/'+id : '');

          return $http.get(path)
            .then(function(response) {
              return response.data;
            }, function(e) {
              $log.warn(e);
              return $q.reject(e);
            });
        }

        user.create = function(type, body) {
          var path = rootUrl+'users/'+user.id+'/'+type;
          return $http.post(path, body)
            .then(function(response) {
              return response.data;
            }, function(e) {
              $log.warn(e);
              return $q.reject(e);
            });
        }

        user.isLoggedInUser = function() { 
          return user.id === $rootScope.loggedInUser.id; 
        }

        user.sync = function() {
          var path = rootUrl+'users/'+user.id;

          return $http.put(path, user)
            .then(function(response) {
              return response.data;
            }, function(e) {
              $log.error(e);
              return $q.reject();
            });
        };

        // Add custom behaviour to the user
        angular.forEach(behaviours, function(func, name) {
          user[name] = function() { return func(user, arguments); };
        });

        return user;
      }

      function fetchUserData(id) {
        var path = rootUrl+'users/'+id;

        return $http.get(path)
          .then(function(response) {
            return response.data;
          }, function(e) {
            $log.error(e);
            return $q.reject();
          });
      }

      function setCurrentUser(user) {
        // Ensure the user has the madatory details
        var minimum = [
              'id', 
              'authToken',
              'title',
              'firstName',
              'lastName',
              'userType',
            ];

        if ( lodash.intersection(minimum, lodash.keys(user)).length !== minimum.length ) {
          $log.warn('missing details', minimum, lodash.keys(user));
          return false;
        }

        initUser(user);
        $http.defaults.headers.common.Authorization = user.authToken;
        $cookies.putObject(userCookieName, _.pick(user, minimum));

        return $rootScope.loggedInUser = user;
      }

      function clearCurrentUser() {
        $http.defaults.headers.common.Authorization = '';
        $rootScope.loggedInUser = null;
        $cookies.remove(userCookieName);
      }

      // Restore the user from previous session
      if ( _.isObject( $cookies.getObject(userCookieName) ) ) {
        setCurrentUser( $cookies.getObject(userCookieName) );

        if ( $rootScope.loggedInUser ) {
          // Flesh out the user. This also lets us check the session is still valid.
          fetchUserData( $rootScope.loggedInUser.id )
            .then(function(user) {
              // Copy the rest of the values across
              lodash.extend($rootScope.loggedInUser, user);
            }, function(err) {
              // Session has expired
              clearCurrentUser();
            });        
        }
      }
      
      return {
        loginPath: loginPath,
        userTypes: userTypes,
        createUser: function(details) {
          if( !details.type ) {
            $log.error('missing type');
            return $q.reject();
          }
          var url = rootUrl+details.type+'s';

          return $http.post(url, details)
            .then(function(response) {
              return setCurrentUser(response.data);
            }, function(error) {
              return $q.reject(error);
            });
        },
        logIn: function(email, password) {
          var url = rootUrl+'users/login',
              body = {
                email: email,
                password: password,
              };

          return $http.post(url, body)
            .then(function(response) {
              return setCurrentUser(response.data);
            }, function(error) {
              return $q.reject(error);
            });
        },
        logOut: function() {
          clearCurrentUser();
        },
        getLoggedInUser: function() {
          return $rootScope.loggedInUser;
        },
        isEmailAvailable: function(email) {
          var url = rootUrl+'users/email-available',
              body = {
                email: email,
              };

          return $http.post(url, body)
            .then(function(response) {
              return response.data;
            }, function(error) {
              return $q.reject(error);
            });
        },
        /** 
         * Finds the clinician via their:
         *  - Life Letters shortcode
         *  - APHRA number
         *  - email 
         */
        findClinician: function(code) {
          var url = rootUrl+'users/exists',
              body = {
                referralCode: code,
                email: code,
                ahpraNumber: code,
              };

          return $http.post(url, body)
            .then(function(response) {
              return response.data;
            }, function(error) {
              return $q.reject(error);
            });
        },
        // TODO
        requestPasswordChange: function(/* email */) {
          var defer = $q.defer();
          $timeout(function() { defer.resolve(); });
          return defer.promise;
        },
        // TODO
        setPassword: function(/* password, authToken */) {
          var defer = $q.defer();
          $timeout(function() { defer.resolve(); });
          return defer.promise;
        },
        // TODO
        isValidPasswordChangeToken: function(/* authToken */) {
          var defer = $q.defer();
          $timeout(function() { defer.resolve(); });
          return defer.promise;
        },
        /**
         * Get the complete user including address and health information.
         * @return {[type]} [description]
         */
        fetchUser: function(id) {
          return fetchUserData(id)
            .then(function(user) {
              return initUser(user);
            }, function() {
              return $q.reject();
            });
        },
      };
    };
  });
