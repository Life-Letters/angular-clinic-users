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
        listDoctorsPath = '/doctors',
        appointmentsPath = '/appointments',
        behaviours = {},
        doctorCookieName = 'lifeLetterCurrentDoctor'+(window.cookies ? '-'+window.cookies:''),
        patientCookieName = 'lifeLetterCurrentPatient'+(window.cookies ? '-'+window.cookies:''),
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
      $rootScope.currentDoctor = null;
      $rootScope.currentPatient = null;

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
          return user.id === $rootScope.currentDoctor.clinicianCode; 
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

      function setCurrentDoctor(doctor) {
        // Ensure the doctor has the madatory details
        var minimum = [
              'clinicianCode'
            ];

        if ( lodash.intersection(minimum, lodash.keys(doctor)).length !== minimum.length ) {
          $log.warn('missing details', minimum, lodash.keys(doctor));
          return false;
        }

        // initUser(doctor);
        // $http.defaults.headers.common.Authorization = doctor.authToken;
        $cookies.putObject(doctorCookieName, doctor);

        return $rootScope.currentDoctor = doctor;
      }

      function setCurrentPatient(patient) {
        // Ensure the patient has the madatory details
        var minimum = [
              'userid'
            ];

        if ( lodash.intersection(minimum, lodash.keys(patient)).length !== minimum.length ) {
          $log.warn('missing details', minimum, lodash.keys(patient));
          return false;
        }

        // initUser(patient);
        // $http.defaults.headers.common.Authorization = user.authToken;
        $cookies.putObject(patientCookieName, patient);
        return $rootScope.currentPatient = patient;
      }

      function clearCurrentUser() {
        $http.defaults.headers.common.Authorization = '';
        $rootScope.currentPatient = null
        $rootScope.currentDoctor = null;
        $cookies.remove(doctorCookieName);
        $cookies.remove(patientCookieName);
      }

      // Restore the user from previous session
      if ( _.isObject( $cookies.getObject(doctorCookieName) ) ) {
        setCurrentDoctor( $cookies.getObject(doctorCookieName) );
      }

      // Restore patient too
      if ( _.isObject( $cookies.getObject(patientCookieName) ) ) {
        setCurrentPatient( $cookies.getObject(patientCookieName) );
      }
      
      return {
        loginPath: loginPath,
        userTypes: userTypes,

        // TODO: make it actually login
        setCurrentDoctor: function(doctor) {
          setCurrentDoctor(doctor);
        },

        setCurrentPatient: function(patient){
          setCurrentPatient(patient)
        },

        logOut: function() {
          clearCurrentUser();
        },

        listDoctors: function(clinicID){
          var path = rootUrl+clinicID+listDoctorsPath
          return $http.get(path)
            .then(function(response) {
              return response.data;
            }, function(e) {
              $log.warn(e);
              return $q.reject(e);
            });
        },

        listPatientForCurrentUser: function(){
          // Get appontment list
          var path = 'https://private-e81a7-lifelettersclinicapp.apiary-mock.com/appointments'

          // var path = rootUrl+appointmentsPath

          return $http.get(path)
            .then(function(response) {

              // Filter by doctor
              var patientList = lodash.filter(response.data, function(appointment){
                return true
                // return appointment.doctor.clinicianCode == $rootScope.currentDoctor.clinicianCode
              })

              // Filter down to patient objects only
              patientList = lodash.map(patientList, function(appointment){
                // Build a mock patient object for now
                var patient = {
                  "name": appointment.firstName+" "+appointment.lastName,
                  "userid": appointment.id,
                  "photo": appointment.pic,
                  "dob": appointment.dob,
                  "time": appointment.time,
                  "interests": ["eating","blogging","selfies"],
                  "reason": "Suffering from lower-back pain after playing soccer on the weekend"
                }

                return patient
                // return appointment.patient
              })

              return patientList;
            }, function(e) {
              $log.warn(e);
              return $q.reject(e);
            });
        }
        
      };
    };
  });
