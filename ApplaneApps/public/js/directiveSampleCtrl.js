/*************************************Controller********************************************************************/
var app = angular.module('applane', []);
var counter = 0;
app.controller('appCtrl', function ($scope, $compile, $timeout) {
    $scope.bttn1 = {label:"Rohit"};
    $scope.bttn2 = {label:"Ashish"};

});

app.controller('bttn1Ctrl', function ($scope, $compile, $timeout) {

});


/*************************************END Controller********************************************************************/

app.directive('plButton', ["$compile", function ($compile) {
    return {
        restrict:"A",
        replace:true,
        scope:{bttn:"=bttn"},
        compile:function () {
            return {
                pre:function ($scope, iElement, attrs) {


                    alert(">>>buttonOptions>>>>" + JSON.stringify($scope.bttn));

                },
                post:function ($scope, iElement) {

                }
            };
        }
    }
}]);