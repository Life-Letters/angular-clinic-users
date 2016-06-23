'use strict';

/**
 */
angular.module('life.users')
  .factory('userInterceptor', function ($q, $injector) {
    
    return {
      // request: function(config) {},
      // requestError: function(config) {},
      // response: function() {}
      responseError: function(response) {

        // Was it permission error
        if (response.status === 401) {
          var defer = $q.defer();

          // Avoid circular dependencies
          var $location = $injector.get('$location'),
              users = $injector.get('users');

          // Redirect to the login screen
          $location.path( users.loginPath );
        }

        return $q.reject(response);
      },
    };
  });