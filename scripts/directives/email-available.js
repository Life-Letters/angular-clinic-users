'use strict';

/**
 * Check if a specified email address is available.
 * 
 * @ngdoc directive
 * @name lifelettersApp.directive:emailAvailable
 * @description
 * # emailAvailable
 */
angular.module('life.users')
  .directive('emailAvailable', function (users) {
    return {
      restrict: 'A',
      require: 'ngModel',
      link: function postLink(scope, element, attrs, ctrl) {
        ctrl.$asyncValidators.emailAvailable = function(modelValue) {
	        return users.isEmailAvailable(modelValue);
	      };
      }
    };
  });