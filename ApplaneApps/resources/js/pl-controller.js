var appStrapDirectives = angular.module('$appstrap.directives', []);
var DISPLAY_CELL_TEMPLATE = /DISPLAY_CELL_TEMPLATE/g;
var COLUMN_FIELD = /COLUMN_FIELD/g;
var UI_TYPE_SELECTION = 'selection';

/*************************************Controller********************************************************************/
var app = angular.module('applane', ['$appstrap.directives'], function ($routeProvider, $locationProvider) {
    $locationProvider.html5Mode(true);
});
app.controller('plController', function ($scope, $compile, $location, $rootScope, $timeout) {
    $scope.gridOptions = {columns:[
        {field:"name", cellTemplate:"COLUMN_FIELD", displayName:"Name", style:{width:200}, editableCellTemplate:"<pl-text ngbind='row[col.field]'></app-text>", checkEnable:true},
        {field:"class", cellTemplate:"COLUMN_FIELD", displayName:"Class", style:{width:150}, editableCellTemplate:"<pl-text ngbind='row[col.field]'></app-text>",}
    ], rowActions:[
        {template:""}
    ], actions:[
        {template:""}
    ], data:{data:[
        {name:"Naveen", class:10},
        {name:"Ashish", class:9},
        {name:"Manjeet", class:8},
        {name:"Sachin", class:7}
    ]}
    };


});
/*************************************END Controller********************************************************************/



appStrapDirectives.directive("plGrid", ["$compile", function ($compile) {
    return {
        restrict:"A",
        scope:true,
        compile:function () {
            return {
                pre:function ($scope, iElement, attrs) {
                    $scope.toggleSelectAll = function (checkAll, byPass) {
                        if (byPass) {
                            var rows = $scope.gridOptions.data.data;
                            for (var i = 0; i < rows.length; i++) {
                                rows[i].selected = checkAll;
                                if (rows[i].clone) {
                                    rows[i].clone.selected = checkAll;
                                }
                            }
                        }
                        else{
                             $scope.allSelected = false;
                        }

                    }


                    $scope.__selectall__ = false;
//                    var options = $scope.$eval(attrs.plGrid);
                    var plGridHeaderTemplate = "<table class='applane-grid-body' cellpadding='5' border='1' style='border-collapse: collapse;'>" +
                        "<tr style='background-color: #117BD4;'>" +
                        "<th><input  type=\"checkbox\"  ng-model=\"allSelected\" ng-change=\"toggleSelectAll(allSelected,true)\"/></th>" +
                        "<th ng-repeat='col in gridOptions.columns' ng-style='col.style' ng-bind='col.displayName'>" +
                        "</th>" +
                        "</tr>" +
                        "</table>";
                    var plGridBodyTemplate = "<table class='applane-grid-body' cellpadding='5' border='1' style='border-collapse: collapse;'>" +
                        "<tr style='background-color: #B1B4B6;' ng-repeat='row in gridOptions.data.data'>" +
                        "<td><div ><input tabindex=\"-1\" type=\"checkbox\"  ng-model=\"row.selected\" ng-change=\"toggleSelectAll(row.selected,flase)\" ng-checked=\"row.selected\" /></div></td>" +
                        "<td  ng-repeat='col in gridOptions.columns' pl-grid-cell ng-style='col.style'  ></td>" +
                        "</tr>" +
                        "</table>";

                    var plGridTemplate = plGridHeaderTemplate + plGridBodyTemplate;
                    iElement.append(($compile)(plGridTemplate)($scope));
                },
                post:function ($scope, iElement) {

                }
            }
        }
    };
}]);

appStrapDirectives.directive("plGridCell", ["$compile", function ($compile) {
    return {
        restrict:"A",
        scope:true,
        template:"<div ng-click='editCell()' ng-bind='row[col.field]'></div>",
        compile:function () {
            return {
                pre:function ($scope, iElement, attrs) {
                },
                post:function ($scope, iElement) {
                    $scope.editCell = function () {
                        var editableCellTemplate = $scope.col.editableCellTemplate;
                        iElement.html(($compile)(editableCellTemplate)($scope));
                        iElement.find('input').focus();
                    }
                }
            }
        }
    };
}]);

appStrapDirectives.directive("plText", ["$compile", function ($compile) {
    return {
        restrict:"E",
        scope:true,
        replace:true,
        compile:function () {
            return {
                pre:function ($scope, iElement, attrs) {
                    var toBind = attrs.ngbind;
                    var template = "<div style='bottom: 0; box-shadow: 0 3px 7px rgba(0, 0, 0, 0.3); left: 0;  right: 0; top: 0; z-index: 9998;'>" +
                        "<input ng-blur='showAlter()' style=' width: 100%;height: 100%; border: none;' type='text' ng-model='" + toBind + "'/> </div>";
                    iElement.html(($compile)(template)($scope));


                },
                post:function ($scope, iElement) {
                    $scope.showAlter = function () {
                        var defaultCellTemplate = "<div ng-click='editCell()' ng-bind='row[col.field]'></div>";
                        iElement.html(($compile)(defaultCellTemplate)($scope));
                        iElement.focus();
                    }
                }
            }
        }
    };
}]);



appStrapDirectives.directive('ngBlur', ['$parse', function($parse) {
    return function(scope, iElement, attr) {
        var fn = $parse(attr['ngBlur']);
        iElement.bind('blur', function(event) {
            scope.$apply(function() {
                fn(scope, {$event:event});
            });
        });
    }
}]);

appStrapDirectives.directive('ngFocus', ['$parse', function($parse) {
    return function(scope, iElement, attr) {
        var fn = $parse(attr['ngFocus']);
        iElement.bind('focus', function(event) {
            scope.$apply(function() {
                fn(scope, {$event:event});
            });
        });
    }
}]);










