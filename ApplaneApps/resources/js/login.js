var BAAS_SERVER = "/rest";

var app = angular.module('applane', [ ], function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
});

app.controller('login', function ($scope, $location, $timeout) {
    $scope.showLoginScreen = false;
    $scope.loginData = {
        "invalidUser":false,
        "processingImage":false,
        "failedMessage":""
    };
    $(document).keypress(function (e) {
        if (e.keyCode === 13) {
            $scope.userLogin();
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }
    });
    $scope.showLoginScreen = true;
//    $appService.currentUser(function(data){  // Current user call for checking, login screen will have to show or redirect to /task
//        if(data == null){
//            alert("Data is null");
//        }
//
//        var response = data.response;
//        var username = response.username;
//
//        if(username != null){
//            $scope.showLoginScreen = false;
//            window.location.href = "/tasks";
//        }else{
//            $scope.showLoginScreen = true;
//        }
//    });

    $scope.userLogin = function () {    // Calls from the HTML from Sign In Button
        $('#password-error').remove();
        $('#username-error').remove();
        $('#response-error').remove();
        var userName = $scope.username;
        var password = $scope.password;
        if (userName == null || userName.trim().length == 0) {
            var html = "<span class='error-message' id='username-error'>Enter your Username</span>";
            $(html).insertAfter('#username');
            $scope.loginData.invalidUser = false;
            return false;
        }
        if (password == null || password.trim().length == 0) {
            var html = "<span class='error-message' id='password-error'>Enter your Password</span>";
            $(html).insertAfter('#password');
            $scope.loginData.invalidUser = false;
            return false;
        }
        $scope.login(userName, password, function (data) {
            var usk = data.usk;
            var response = data.response;
            if (usk) {
                if (typeof(Storage) !== "undefined") {
                    localStorage.usk = usk;
                }
                else {
                    alert("Sorry, your browser does not support web storage...");
                }
                var callback = "/";
                var userGroup = "ug";
                if ($location && $location.search() && $location.search().callback) {
                    callback = $location.search().callback;
                }
                if($location && $location.search() && $location.search()[userGroup]){
                    callback += '?ug=' + $location.search()[userGroup];
                }
                window.location.href = callback;
            } else if (status == "error") {
                var html = "<span class='error-message' id='response-error'>" + response + "</span>";
                $(html).insertAfter('#password');
                return false;
            }
        });
    };
    $scope.login = function (username, password, callback) {
        var params = {};
        params.username = username;
        params.password = password;
//        params.usergroup = 'baas';
        $scope.loginData.processingImage = true;
        $scope.loginData.invalidUser = false;
        if ($location && $location.search() && $location.search().ug) {
            params.usergroup = $location.search().ug;
        }
        $scope.getDataFromJQuery(BAAS_SERVER + "/login", params, "GET", "JSON", "Loading...", function (callBackData) {
            callback(callBackData);
            $scope.loginData.processingImage = false;
        }, function (jqxhr, error) {
            /*** Display Error Message When login Failed 10/10/ 2013 Bharat*/
            var obj = JSON.parse(jqxhr.responseText);
            $scope.loginData.invalidUser = true;
            $scope.loginData.processingImage = false;
            $scope.loginData.failedMessage = obj.response;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });
    };
    $scope.getDataFromJQuery = function (url, requestBody, callType, dataType, pBusyMessage, callback, errcallback) {
        $.ajax({
            type:callType,
            url:url,
            data:requestBody,
            crossDomain:true,
            success:function (returnData, status, xhr) {
                callback(returnData.response ? returnData.response : returnData);
            },
            error:function (jqXHR, exception) {
                if (errcallback) {
                    errcallback(jqXHR, exception);
                } else {
                    alert("exception in making [" + url + "] :[" + exception + "]");
                }
            },
            timeout:1200000,
            dataType:dataType,
            async:true
        });
    }
});

