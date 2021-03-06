'use strict';

/**
 * @ngdoc service
 * @name lifelettersApp.userService
 * @description
 * # userService
 * Service in the lifelettersApp.
 */
angular.module('life.users')
    .provider('users', function() {

        var rootUrl = null,
            loginPath = '/login',
            doctorsPath = 'doctors/',
            patientsPath = 'patients/',
            appointmentsPath = 'appointments',
            behaviours = {},
            doctorCookieName = 'lifeLetterCurrentDoctor' + (window.cookies ? '-' + window.cookies : ''),
            appointmentCookieName = 'lifeLetterCurrentAppointment' + (window.cookies ? '-' + window.cookies : ''),
            tokenCookieName = 'lifeLetterToken' + (window.cookies ? '-' + window.cookies : ''),
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

        this.$get = function($rootScope, $http, $location, $cookies, $timeout, $q, $log, lodash) {
            if (!rootUrl) {
                $log.warn('please set the user service URL via the usersProvider');
                return;
            }

            // Expose the user to the view
            $rootScope.currentDoctor = null;
            $rootScope.currentAppointment = null;

            function setCurrentDoctor(doctor) {
                // Ensure the doctor has the madatory details
                var minimum = [
                    'doctorId'
                ];

                if (lodash.intersection(minimum, lodash.keys(doctor)).length !== minimum.length) {
                    $log.warn('missing details', minimum, lodash.keys(doctor));
                    return false;
                }

                // initUser(doctor);
                // $http.defaults.headers.common.Authorization = doctor.authToken;
                $cookies.putObject(doctorCookieName, doctor, {
                    expires: moment().add(2, "days").toDate()
                });

                return $rootScope.currentDoctor = doctor;
            }

            function setToken(token) {
                $http.defaults.headers.common.Authorization = token;
            }

            function setCurrentAppointment(appointment) {
                // Ensure the patient has the madatory details
                var minimum = [
                    'id'
                ];

                if (lodash.intersection(minimum, lodash.keys(appointment)).length !== minimum.length) {
                    $log.warn('missing details', minimum, lodash.keys(appointment));
                    return false;
                }

                $cookies.putObject(appointmentCookieName, appointment);
                return $rootScope.currentAppointment = appointment;
            }

            function clearCurrentUser(fullLogOut) {
                $http.defaults.headers.common.Authorization = '';
                $rootScope.currentAppointment = null
                $rootScope.currentDoctor = null;
                $cookies.remove(doctorCookieName);
                $cookies.remove(appointmentCookieName);
                if (fullLogOut) $cookies.remove(tokenCookieName);
            }

            // Get a doctor by ID
            function fetchDoctorById(id) {
                var path = rootUrl + doctorsPath + id;

                var data = "";
                var deferred = $q.defer();

                $http.get(path)
                    .success(function(response, status, headers, config) {
                        deferred.resolve(response);
                    })
                    .error(function(errResp) {
                        deferred.reject({ message: "Really bad" });
                    });
                return deferred.promise;

                // return $http.get(path)
                //     .then(function(response) {
                //         return response.data;
                //     }, function(e) {
                //         $log.warn(e);
                //         return $q.reject(e);
                //     });
            }


            function fetchPatientById(id) {
                var path = rootUrl + patientsPath + id;

                return $http.get(path)
                    .then(function(response) {
                        return response.data;
                    }, function(e) {
                        $log.warn(e);
                        return $q.reject(e);
                    });
            }

            function fetchAppointments(){
                    // Get appontment list
                    var path = rootUrl + appointmentsPath;

                    return $http.get(path)
                        .then(function(response) {

                            if (!response.data.success) {
                                return [];
                            }

                            return response.data.consults;

                        }, function(e) {
                            $log.warn(e);
                            return $q.reject(e);
                        });
            }

            // Restore the user from previous session
            if (_.isObject($cookies.getObject(doctorCookieName))) {
                setCurrentDoctor($cookies.getObject(doctorCookieName));
            }

            // Restore appointment too
            if (_.isObject($cookies.getObject(appointmentCookieName))) {
                setCurrentAppointment($cookies.getObject(appointmentCookieName));
            }

            // Restore Authorization cookie
            if (_.isString($cookies.getObject(tokenCookieName))) {
                setToken($cookies.getObject(tokenCookieName));
            }

            return {
                loginPath: loginPath,
                userTypes: userTypes,

                // TODO: make it actually login
                setCurrentDoctor: function(doctor) {
                    setCurrentDoctor(doctor);
                },

                setCurrentAppointment: function(apt) {
                    setCurrentAppointment(apt)
                },

                isLoggedIn: function() {
                    return $http.defaults.headers.common.Authorization;
                },

                logIn: function(username, password) {
                    // Try to log in
                    var path = "https://auth.lifeletters.xyz/login"

                    return $http.post(path, { username: username, password: password }).then(function(response) {
                        //success
                        $http.defaults.headers.common.Authorization = response.data.access_token;
                        $cookies.putObject(tokenCookieName, response.data.access_token);
                        return response.data.access_token
                    }, function(error) {
                        //error, display validation error
                        console.log("login error");
                    });

                },

                logOut: function(fullLogOut) {
                    clearCurrentUser(fullLogOut);
                },

                fetchAppointments: function() {
                  return fetchAppointments();
                },

                getDoctors: function(appointments){
                    var doctors = _.map(appointments, function(a){
                        return a.doctor
                    })
                    return _.uniqBy(doctors,'doctorId');
                }
            };
        };
    });
