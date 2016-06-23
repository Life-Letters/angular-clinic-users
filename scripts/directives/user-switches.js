'use strict';

/**
 * Checks if the logged in user is of the type specified via the attribute.
 */
angular.module('life.users')
  .directive('showUser', function ($rootScope) {
    return {
      link: function postLink(scope, element, attrs) {
        // ''         = user logged in
        // 'String'   = match user type
        $rootScope.$watch('loggedInUser.userType', function() {

          var loggedIn = $rootScope.loggedInUser,
              userType = loggedIn ? $rootScope.loggedInUser.userType : '',
              expected = attrs.showUser ? attrs.showUser : '';

          if ( loggedIn && (!expected.length || userType === expected)) {
            element.attr('style', (element.attr('style')+'').replace('display:none;', ''));
          } else {
            element.attr('style', 'display:none;');
          }
        });
      }
    };
  })
  .directive('showAnonymous', function ($rootScope) {
    return {
      link: function postLink(scope, element, attrs) {
        $rootScope.$watch('loggedInUser.userType', function() {
          if ( $rootScope.loggedInUser ) {
            element.attr('style', 'display:none;');
          } else {
            element.attr('style', (element.attr('style')+'').replace('display:none;', ''));
          }
        });
      }
    };
  });