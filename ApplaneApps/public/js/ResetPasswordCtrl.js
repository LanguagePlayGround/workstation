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


app.controller('ResetPasswordCtrl', function ($scope, $compile, $timeout, $http) {
    $scope.password = "";
    $scope.confirmPassword = "";
    $scope.resetPassword = function () {
        var url = window.location.search;
        url = url.split('=');
        if(!url || !url[1]){
            throw new Error("Token not found.")
        }
        var password = $scope.password;
        var confirmPassword = $scope.confirmPassword;
        if (password == null || password.trim().length == 0) {
            $scope.errorMessage = 'Password cannot be empty.';
            return false;
        }
        if (password.trim().length < 8) {
            $scope.errorMessage = 'Password is too short (we need a minimum of 8 characters here.)';
            return false;
        }
        if (confirmPassword == null || confirmPassword.trim().length == 0) {
            $scope.errorMessage = "Password doesn't match confirmation.";
            return false;
        }
        if (confirmPassword.trim().length < 8) {
            $scope.errorMessage = "Password doesn't match confirmation.";
            return false;
        }
        if (password !== confirmPassword) {
            $scope.errorMessage = "Password doesn't match confirmation.";
            return false;
        }
        if (password === confirmPassword) {
            var domain = window.location.href;
            var index = domain.lastIndexOf("/")
            domain = domain.substring(0,index)
            $scope.processingImage = true;
            return ApplaneDB.callRemoveService(domain+"/rest/invoke", {"user_access_token": url[1], "function": "User.changePassword", "parameters": [
                {"password": password}
            ]}, "POST", "JSON").then(function (result) {
                    $scope.processingImage = false;
                    if(result && result.response && result.response.MESSAGE){
                        $scope.successMessage = result.response.MESSAGE;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }
                    setTimeout(function () {
                        window.location.href = domain+"/login";
                    }, 500);

                }).fail(function (err) {
                    $scope.processingImage = false;
                    $scope.errorMessage = err.message;
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                })
        }
    }
})