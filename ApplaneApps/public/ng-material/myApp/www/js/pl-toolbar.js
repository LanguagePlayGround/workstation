var pl = (pl === undefined) ? angular.module('pl', ['ngCookies', 'ngAnimate', 'ngSanitize', 'mgcrea.ngStrap']) : pl;


pl.directive('plToolBar', [ "$compile", function ($compile) {
    return {
        restrict:'A',
        scope:false,
        compile:function () {
            return {
                post:function ($scope, iElement) {
                    var html = "";
                    if ($scope.toolBarOptions.top) {
                        html += "<div class='pl-top-toolbar' pl-tool-bar-row='top'></div>";
                    }
                    if ($scope.toolBarOptions.bottom && ($scope.toolBarOptions.bottom.left.length > 0 || $scope.toolBarOptions.bottom.center.length > 0 || $scope.toolBarOptions.bottom.right.length > 0 )) {
                        html += "<div class='pl-bottom-toolbar' ng-show='toolBarOptions.bottom.left.length > 0 || toolBarOptions.bottom.center.length > 0  || (toolBarOptions.bottom.right.length > 0 && gridOptions.sharedOptions.saveCustomizationEnable!= undefined) || gridOptions.sharedOptions.saveCustomizationEnable || toolBarOptions.bottom.right.length > 1'  pl-tool-bar-row='bottom'></div>";
                    }
                    iElement.append($compile(html)($scope));
                }
            }
        }
    };
}
]);


pl.directive('plToolBarRow', [ "$compile", function ($compile) {
    return {
        restrict:'A',
        scope:true,
        compile:function () {
            return {
                post:function ($scope, iElement, attrs) {
                    if (attrs.plToolBarRow == "top") {
                        $scope.toolbarRowOptions = $scope.toolBarOptions.top;
                    } else if (attrs.plToolBarRow == "bottom") {
                        $scope.toolbarRowOptions = $scope.toolBarOptions.bottom;
                    } else {
                        alert("Not supported plToolBarRow>>>>[" + attrs.plToolBarRow + "]");
                    }

                    var html = "";
                    html += "<pl-left-tool-bar></pl-left-tool-bar>";
                    html += "<pl-center-tool-bar class='pl-top-middle-tollbar' ng-if='toolbarRowOptions.center'></pl-center-tool-bar>";
                    html += "<pl-right-tool-bar></pl-right-tool-bar>";
                    iElement.append($compile(html)($scope));
                }
            }
        }
    };
}
]);


pl.directive('plToolBarHeader', [ "$compile", function ($compile) {
    return {
        restrict:'E',
        replace:true,
        compile:function () {
            return{
                pre:function ($scope, iElement, attrs) {
                    if ($scope.toolBarOptions.header) {
                        $scope.toolbarHeaders = $scope.toolBarOptions.header.left;
                        $scope.toolbarCenterHeaders = $scope.toolBarOptions.header.center;
                        $scope.toolbarRightHeadersActions = $scope.toolBarOptions.header.right;
                    }
                    var template = '<div class="flex" style="min-height: 38px;">' +
                        '       <div class="app-float-left header-l-bar app-overflow-hiiden" ng-class="toolbarHeaders.lHeaderClass" >' +
                        "           <div>" +
                        "               <ul ng-if='toolbarHeaders.menus' style='padding-left: 44px; ' id='toolBarHeader'>" +
                        "                   <li ng-repeat='qMenu in toolbarHeaders.menus' ng-hide='qMenu.hide' ng-class='{\"qview-selecetd\":toolbarHeaders.selectedMenu == $index || (qMenu.mores && toolbarHeaders.selectedMenu >= toolbarHeaders.breakingIndex-1)}'>" +
                        "                       <span class='app-cursor-pointer' ng-click='qViewHeaderClick(qMenu, $event)' ng-bind='qMenu.label'></span> " +
                        "                   </li>" +
                        "               </ul>" +
                        "           </div>" +
                        '       </div>' +
                        '       <div class="app-bar-basic flex-1 header-r-bar">' +
                        '           <div pl-button ng-repeat="action in toolbarCenterHeaders" title="{{action.title}}" class="app-float-left"></div>' +
                        '     </div>' +
                        '       <div class="app-float-right header-r-bar" ng-class="toolbarHeaders.rHeaderClass">' +
                        '           <div pl-button ng-repeat="action in toolbarRightHeadersActions" ng-class="action.class" title="{{action.title}}" class="app-float-left"></div>' +
                        '       </div>' +
                        '    </div>';
                    iElement.append(($compile)(template)($scope));

                },
                post:function ($scope) {
                    $scope.qViewHeaderClick = function (qMenu, $event) {
                        if (qMenu.onClick) {
                            $scope[qMenu.onClick](qMenu, $event);
                        } else {
                            $scope.onQuickViewSelection(qMenu);
                        }
                    }
                    $scope.qViewHeaderPopup = function (qMenu, $event) {
                        var html = "<div class='pl-overflow-y-scroll app-max-height-two-hundred'>" +
                            "           <div ng-repeat='moreMenu in toolbarHeaders.menus' class='app-white-space-nowrap app-cursor-pointer' ng-if='!(!moreMenu.hide || moreMenu._id ==\"__more\")'>" +
                            "               <div  ng-click='onQuickViewSelection(moreMenu)' ng-class='{\"pl-selected-menu\":toolbarHeaders.selectedMenu == $index}' class='app-row-action pl-popup-label'>{{moreMenu.label}}" +
                            "               </div>" +
                            "           </div>" +
                            "       </div>";
                        var popupScope = $scope.$new();
                        var p = new Popup({
                            autoHide:true,
                            deffered:true,
                            escEnabled:true,
                            hideOnClick:true,
                            html:$compile(html)(popupScope),
                            scope:popupScope,
                            element:$event.target,
                            event:$event
                        });
                        p.showPopup();
                    }
                }
            }
        }
    };
}]);

pl.directive('plLeftToolBar', function () {
    return {
        restrict:'E',
        replace:true,
        template:'<div class="app-bar-basic">' +
            '           <div pl-button ng-repeat="action in toolbarRowOptions.left" title="{{action.title}}" class="app-float-left"></div>' +
            '     </div>'
    };
});

pl.directive('plRightToolBar', function () {
    return {
        restrict:'E',
        replace:true,
        template:'<div class="app-float-right flex r-bar">' +
            '           <div pl-button ng-repeat="action in toolbarRowOptions.right" title="{{action.title}}" class="app-float-left app-white-space-nowrap flex-box"></div>' +
            '     </div>'
    };
});

pl.directive('plCenterToolBar', function () {
    return {
        restrict:'E',
        replace:true,
        template:'<div class="app-float-left">' +
            '           <div pl-button ng-repeat="action in toolbarRowOptions.center" title="{{action.title}}" class="app-float-left pl-middle-toolbar"></div>' +
            '     </div>'
    };
});


pl.directive('plButton', [
    '$compile', function ($compile) {
        return {
            restrict:'A',
            scope:false,
            compile:function () {
                return {
                    pre:function ($scope, iElement) {
                        var template = $scope.action.template;
                        if (!template) {
                            template = "<div ";
                            if ($scope.action.onClick) {
                                template += " ng-click='" + $scope.action.onClick + "'";
                            }
                            if ($scope.action.actionClass) {
                                template += " ng-class = 'action.actionClass'";
                            }
                            if ($scope.action.showLabel) {
                                template += " ng-bind='action.label'";
                            }
                            template += " ></div>";
                        }
                        iElement.append($compile(template)($scope));

                    }

                }
            }
        };
    }]);




