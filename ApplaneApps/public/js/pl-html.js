/***** move to app-models.js to generate minified version for before commit*******/
var pl = (pl === undefined) ? angular.module('pl', [ 'ngRoute', 'ngCookies', 'ngAnimate', 'ngSanitize', 'mgcrea.ngStrap']) : pl;

pl.directive("plHtml", ["$compile", function ($compile) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    var htmlOptions = $scope.htmlOptions;
                    $scope.toolBarOptions = {};
                    $scope.handleAction = function (actionId, param1, param2, param3, param4) {
                        try {
                            var action = undefined;
                            if ($scope.htmlOptions.headerActions) {
                                for (var i = 0; i < $scope.htmlOptions.headerActions.length; i++) {
                                    if ($scope.htmlOptions.headerActions[i].id == actionId) {
                                        action = $scope.htmlOptions.headerActions[i];
                                        break;
                                    }
                                }
                            }
                            if (!action) {
                                throw new Error('Action not found with id [' + actionId + ']');
                            }
                            $scope.htmlOptions.sharedOptions = $scope.htmlOptions.sharedOptions || {};
                            $scope.htmlOptions.sharedOptions.currentRow = {};
                            $scope.htmlOptions.sharedOptions.currentRow.param1 = param1;
                            $scope.htmlOptions.sharedOptions.currentRow.param2 = param2;
                            $scope.htmlOptions.sharedOptions.currentRow.param3 = param3;
                            $scope.htmlOptions.sharedOptions.currentRow.param4 = param4;
                            $scope.viewRowAction(action);
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    };
                    $scope.toolBarOptions.top = {left: [], center: [], right: []};
                    $scope.toolBarOptions.header = {left: {}, center: [], right: []};
                    $scope.printHTML = function () {
                        try {
                            $scope.print($scope.$eval($scope.htmlOptions.data));
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    var showResizeControl = $scope.htmlOptions.resize !== undefined ? $scope.htmlOptions.resize : false;
                    if (showResizeControl) {
                        $scope.toolBarOptions.header.center.push({template: "<div ng-click=\"resize('left')\" ng-hide='htmlOptions.fullMode' pl-resize class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-left\"></i></div>"});
                    }

                    if ($scope.htmlOptions.parentSharedOptions) {
                        $scope.htmlOptions.parentSharedOptions.resizable = true;
                    }

                    if ($scope.htmlOptions.quickViewMenuGroup && $scope.htmlOptions.quickViewMenuGroup.menus.length > 0) {
                        $scope.toolBarOptions.top.left.push({template: "<div pl-menu-group='htmlOptions.quickViewMenuGroup' ></div>"});
                        $scope.toolBarOptions.header.left = $scope.htmlOptions.quickViewMenuGroup;
                    } else {
                        $scope.toolBarOptions.header.center.push({label: $scope.htmlOptions.label, showLabel: true, actionClass: 'app-float-left app-padding-five-px pl-quick-menu app-font-weight-bold'});
                    }

                    if ($scope.htmlOptions.viewControl) {
                        $scope.toolBarOptions.header.center.push({template: "<div pl-menu-group='htmlOptions.viewControlOptions' ></div>"});
                    }

                    if ($scope.htmlOptions.close) {
                        $scope.toolBarOptions.header.right.push({template: '<div ng-click="close()" class="pl-cancel-btn app-cursor-pointer">Cancel</div>'});
                    }

                    if ($scope.htmlOptions.headerActions) {
                        for (var i = 0; i < $scope.htmlOptions.headerActions.length; i++) {
                            $scope.toolBarOptions.header.center.push($scope.htmlOptions.headerActions[i]);
                        }
                    }
                    $scope.resize = function (direction) {
                        try {
                            if ($scope.htmlOptions.resizeV && $scope.htmlOptions.sharedOptions && $scope.htmlOptions.sharedOptions.resizable != false) {
                                $scope[$scope.htmlOptions.resizeV]($scope.htmlOptions.viewIndex, direction);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    if ($scope.htmlOptions.parentSharedOptions && $scope.htmlOptions.sharedOptions.viewPosition != "right") {
                        $scope.resize('left');
                    }
                },
                post: function ($scope, iElement) {
                    var template = "<div>" +
                        "                <div style='position: relative;width: 100%;'>" +
                        "                           <div class='pl-header-toolbar' >" +
                        "                               <pl-tool-bar-header></pl-tool-bar-header>" +
                        "                           </div>" +
                        "                    <div class='pl-toolbar' pl-tool-bar></div>" +
                        "                </div>" +
                        "           </div>" +
                        "           <div class='pl-html-content'>" +
                        //"           <div style='padding: 5px;margin: 4px;overflow-x: auto;overflow-y: auto;bottom: 0px;position: absolute;top: 61px;left: 0px;right: 0px;'> " + "<b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                    <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                        <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                            <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                    <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                        <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                            <b>HTML</b> is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend <b>HTML</b> vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                                HTML is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend HTML vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                                    HTML is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend HTML vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                                        HTML is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend HTML vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                                            HTML is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend HTML vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                                                HTML is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend HTML vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>                                                                    HTML is great for declaring static documents,<br> but it falters when we try to use it for declaring dynamic views in web-applications.<br> AngularJS lets you extend HTML vocabulary for your application.<br> The resulting environment is extraordinarily expressive, readable, and quick to develop.<br>" +                        "           </div>"
                        $scope.$eval($scope.htmlOptions.data) +
                        "</div>";
                    iElement.append($compile(template)($scope));

                    $scope.onViewControlOptionClick = function (option) {
                        try {
                            if ($scope.htmlOptions.onViewControl) {
                                $scope[$scope.htmlOptions.onViewControl](option)
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }

                    }
                }
            }
        }
    };
}]);


