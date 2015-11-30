/*************************************Controller********************************************************************/
var app = angular.module('applane', []);
var counter = 0;
app.controller('AppCtrl', function ($scope, $compile, $timeout) {
    $scope.userInput = "";
    $scope.result = "";

    $scope.query = function () {
        var query = JSON.parse($scope.userInput);
        $scope.db.query(query, function (err, result) {
            $scope.result = err || JSON.stringify(result);
            if (!$scope.$$phase) {
                $scope.$apply();
            }

        })
    }

    $scope.update = function () {
        var batchUpdate = JSON.parse($scope.userInput);
        $scope.db.batchUpdate(batchUpdate, function (err, result) {
            $scope.result = err || JSON.stringify(result);
            if (!$scope.$$phase) {
                $scope.$apply();
            }

        })
    }


    ApplaneDB.connect("http://127.0.0.1:5100", "applane", function (err, db) {
        $scope.db = db;
    })

});
/*************************************END Controller********************************************************************/

app.directive('applaneGrid', ["$compile", function ($compile) {
    return {
        restrict:"E",
        replace:true,
        scope:true,
        template:"<table>" +
            "</table>",
        compile:function () {
            return {
                pre:function ($scope, iElement) {

                },
                post:function ($scope, iElement) {

                }
            };
        }
    }
}]);