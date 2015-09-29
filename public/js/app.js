'use strict';

angular.module("JwtApp", ['btford.socket-io', 'angular-jwt'])
    .run(["$rootScope", function($rootScope) {
        $rootScope.sockets = [];
    }])

    .config(["$httpProvider", "jwtInterceptorProvider", function Config($httpProvider, jwtInterceptorProvider) {
        jwtInterceptorProvider.tokenGetter = [function() {
            return localStorage.getItem('jwt');
        }];
        $httpProvider.interceptors.push('jwtInterceptor');
    }])

    .factory("mySocket", ["$rootScope", "socketFactory", function ($rootScope, socketFactory) {
        return {
            init: function() {
                $rootScope.sockets.forEach(function(s) {
                    s.disconnect();
                });
                $rootScope.sockets = [];
                var ioSocket = io('', {
                    path: '/socket.io-client',
                    query: 'token=' + localStorage.getItem('jwt'),
                    forceNew: true
                });

                return socketFactory({
                    ioSocket: ioSocket
                });
            }
        }
    }])

    .controller("MainController", ["$scope", "AuthService", function($scope, AuthService) {
        $scope.submitForm = function() {
            AuthService.auth($scope.username, $scope.password).then(function(data) {
                    var token = data.token;
                    localStorage.setItem('jwt', token);
                    AuthService.reAuth();
            },
            function(err) {
                console.log(err);
            })
        };

        $scope.testRequest = function() {
            AuthService.test().then(function(data){
                $scope.lastRequestedData = data;
            }, function(err) {
                $scope.lastRequestedData = err;
            }  )
        }
    }])

    .service("AuthService", ["$http", "$q", "mySocket", "$rootScope", function($http, $q, mySocket, $rootScope) {
        this.auth = function(login, password) {
            var deferred = $q.defer();
            var credentials = {
                username: login,
                password: password
            };
            var settings = { skipAuthorization: true};

            $http.post('/auth', credentials, settings).success(function(data){
                deferred.resolve(data);
            }).error(function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        };

        this.test = function() {
            var deferred = $q.defer();
            $http.get('/test').success(function(data){
                deferred.resolve(data);
            }).error(function(error) {
                deferred.reject(error);
            });
            return deferred.promise;
        };

        this.reAuth = function() {
            var socket = mySocket.init();
            $rootScope.sockets.push(socket);

            // these two listeners - in case we're using authorization via socket-jwt plugin
            // to use this kind of authorization, just uncomment two following listeners.
            // and pass process.env.SOCKET_AUTH_TYPE variable set to "socketjwt".

            /*

            socket.on('connect', function (message) {
                console.log(message);
                console.log("reauthenticate, ",{status: "OK"} );
            });

            socket.on("error", function(error) {
                console.log("reauthenticate, ",{status: "error"} );
            });

            */

            // these two - for our custom authorization process.

            socket.on('authed', function (message, data) {
                console.log(message, ", ",  data);
            });

            socket.on("unauthed", function(message, data) {
                console.log(message, ", ",  data);
            });
        };

    }]);

