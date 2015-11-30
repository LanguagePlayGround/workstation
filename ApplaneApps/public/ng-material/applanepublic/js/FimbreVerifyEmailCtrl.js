/**
 * Created with IntelliJ IDEA.
 * User: rajit
 * Date: 12/8/14
 * Time: 3:12 PM
 * To change this template use File | Settings | File Templates.
 */

var app = angular.module('app', [], function () {
    /*$locationProvider.html5Mode(true);*/
});


app.controller('FimbreVerifyEmailCtrl', function ($scope, $compile, $timeout, $http) {
    $scope.verifyEmail = function () {
        var url = window.location.search;
        url = url.split('=');
        var vc = url[1].substring(0, url[1].indexOf("&"))
        var userid = url[2].substring(0, url[2].indexOf("&"))
        var dbName = url[3]
        if (!url || !userid || !vc || !dbName) {
            throw new Error("Either User-id or Verification Code or Database name not found>>>>>");
        }
        var domain = window.location.href;
        var index = domain.lastIndexOf("/")
        domain = domain.substring(0, index)
        $scope.processingImage = true;
        return ApplaneDB.callRemoveService(domain + "/rest/fimbre/verify", { "vc": vc, "user": userid, "dbName": dbName}, "POST", "JSON").then(function (result) {
            $scope.processingImage = false;
            if (result && result.response && result.response.MESSAGE) {
                $scope.successMessage = result.response.MESSAGE;
                $scope.loginLink = true;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }
        }).fail(function (err) {
                $scope.processingImage = false;
                $scope.errorMessage = err.message;
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            })
    }
    $scope.verifyEmail();

})