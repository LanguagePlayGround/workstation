/**
 * Created with IntelliJ IDEA.
 * User: rajit
 * Date: 12/8/14
 * Time: 3:12 PM
 * To change this template use File | Settings | File Templates.
 */

var app = angular.module('applane', [], function () {
    /*$locationProvider.html5Mode(true);*/
});


app.controller('ForgotPasswordCtrl', function ($scope, $compile, $timeout, $http) {
    $scope.email = "";
    $scope.database = "";
    var cURL = window.location;
    if (cURL) {
        cURL = cURL.toString();
        var httpString = "http://";
        cURL = cURL.toString().substring(httpString.length);
        var indexOfDot = cURL.indexOf(".");
        if (indexOfDot > 0) {
            var firstPart = cURL.substring(0, indexOfDot);
            if (firstPart === "127" || firstPart === "porting" || firstPart === "beta") {
                $scope.showDB = true;
            } else if (firstPart === "sandbox") {
                cURL = cURL.substring(indexOfDot + 1)
                indexOfDot = cURL.indexOf(".");
                var secondpart = cURL.substring(0, indexOfDot);
                $scope.database = secondpart + "_sb";
            } else {
                $scope.database = firstPart;
            }
        }
    }

    $scope.sendPasswordResetMail = function () {
        var email = $scope.email;
        var database = $scope.database;
        if (email == null || email.trim().length == 0) {
            $scope.errorMessage = 'Enter your Email Id';
            return false;
        }
        var reEmail = /^(?:[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+\.)*[\w\!\#\$\%\&\'\*\+\-\/\=\?\^\`\{\|\}\~]+@(?:(?:(?:[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!\.)){0,61}[a-zA-Z0-9]?\.)+[a-zA-Z0-9](?:[a-zA-Z0-9\-](?!$)){0,61}[a-zA-Z0-9]?)|(?:\[(?:(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\.){3}(?:[01]?\d{1,2}|2[0-4]\d|25[0-5])\]))$/;

        if(!email.match(reEmail)) {
            $scope.errorMessage = "Invalid email address.";
            return false;
        }
        if ($scope.showDB && (database == null || database.trim().length == 0)) {
            $scope.errorMessage = 'Database is mandatory.';
            return false;
        }

        var domain = window.location.href;
        var index = domain.lastIndexOf("/")
        domain = domain.substring(0, index)
        $scope.processingImage = true;
        return ApplaneDB.callRemoveService(domain + "/rest/forgotPassword", {email: email, database: database}, "POST", "JSON").then(function () {
            $scope.processingImage = false;
            $scope.successMessage = 'You will receive an email with instructions about how to reset your ' +
                'password in a few minutes.';
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }).fail(function (err) {
                $scope.processingImage = false;
                $scope.errorMessage = err.message;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            })


    }
})