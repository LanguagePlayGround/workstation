/*************************************Controller********************************************************************/
var app = angular.module('applane', ['$appstrap.directives', '$appstrap.services'], function ($routeProvider, $locationProvider) {
$locationProvider.html5Mode(true);
});
app.controller('AppCtrl', function ($scope, $compile, $location, $viewStack, $rootScope, $timeout, $userDataSource, $userModel, $metaDataSource, $metaDataModel, $appShortMessage) {
AppUtil.$rootScope = $scope;
$scope.appData = {viewGroups:{label:"", "display":["label"], options:[]}, organizations:{label:"", "display":["label"], options:[]}};
$scope.$watch('appData.userLogin', function (newValue, oldValue) {
if (newValue === false) {
delete localStorage.usk;
var href = "/login.html";
var search = $location.search();
if ($location && $location.search() && $location.search().ug) {
href += '?ug=' + $location.search().ug;
}
window.location.href = href;
}
}, true);
$scope.appData.warning = {"warnings":[]};
$metaDataModel.init($scope, $metaDataSource);
$userModel.init($scope, $userDataSource);
$appShortMessage.init($scope);
$scope.logOut = function () {
$userDataSource.logOut(function (data) {
//destroy usk here
$scope.appData.userLogin = false;
if (!$scope.$$phase) {
$scope.$apply();
}
})
}

});
/*************************************END Controller********************************************************************/