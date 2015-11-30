/***** move to app-models.js to generate minified version for before commit*******/
var pl = (pl === undefined) ? angular.module('pl', [ 'ngRoute', 'ngCookies', 'ngAnimate', 'ngSanitize', 'mgcrea.ngStrap']) : pl;


pl.directive("plDashboard", ["$compile", function ($compile) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    var unwatcher = {};
                    if (!$scope.dashboardOptions.warningOptions) {
                        $scope.dashboardOptions.warningOptions = {};
                        unwatcher.warningOptions = $scope.$watch("dashboardOptions.warningOptions.warnings", function (newMess) {
                            if ($scope.dashboardOptions.warningOptions && $scope.dashboardOptions.warningOptions.warnings && $scope.dashboardOptions.warningOptions.warnings.length > 0) {
                                //open a popup here
                                alert($scope.dashboardOptions.warningOptions.title + "\n" + JSON.stringify($scope.dashboardOptions.warningOptions.warnings));
                            }
                        })
                    }
                    var views = $scope.dashboardOptions.views;
                    if (views) {
                        var ps = undefined;    //required for linking two dashboard
                        var parentAlias = undefined;
                        for (var j = 0; j < views.length; j++) {
                            if (views[j].parent) {
                                parentAlias = views[j].parent;
                                ps = {};
                                break;
                            }
                        }
                        for (var i = 0; i < views.length; i++) {
                            if (parentAlias) {//required for linking two dashboard
                                if (views[i].alias === parentAlias) {
                                    views[i].view.viewOptions.sharedOptions = ps;
                                } else if (views[i].parent && views[i].parent === parentAlias) {
                                    views[i].view.viewOptions.parentSharedOptions = ps;
                                    views[i].view.viewOptions.watchParent = true;
                                }
                            }
                            views[i].view.viewOptions.viewIndex = i;
                            views[i].view.viewOptions.openV = "openDashBoradV";
                            views[i].view.viewOptions.closeV = "closeDashBoradV";
                            views[i].view.viewOptions.getV = "getDashBoradV";
                        }
                    }
                    $scope.getDashBoradV = function (index) {
                        var views = $scope.dashboardOptions.views;
                        var viewCount = views ? views.length : 0
                        if (index >= viewCount) {
                            return undefined;
                        } else {
                            return views[index];
                        }
                    }

                    $scope.setKpiCellMetaData = function (viewOptions) {
                        try {
                            viewOptions.checkboxSelection = (viewOptions.checkboxSelection != undefined) ? viewOptions.checkboxSelection : false;
                            viewOptions.toolbar = false;
                            viewOptions.hyperlinkEnabled = false;
                            viewOptions.dashboardCellToolbar = true;
                            viewOptions.headerTemplate = "";
                            viewOptions.openV = "openV";
                            viewOptions.closeV = "closeView";
                            viewOptions.resizeV = "resizeView";
                            viewOptions.popUpV = "openPopUpView";
                            viewOptions.getV = "getWorkbenchView";
                            viewOptions.onViewControl = 'onViewControl';
                            viewOptions.active = true;
                            viewOptions.fieldResize = false;
                            viewOptions.fieldDragable = false;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }

                    }

                    $scope.openDashBoradV = function (v) {
                        try {
                            $scope.openV(v, function (view) {
                                var childView = {};
                                childView.view = view;
                                childView.view.viewOptions.viewIndex = $scope.dashboardOptions.views.length;
                                childView.view.viewOptions.openV = "openDashBoradV";
                                childView.view.viewOptions.closeV = "closeDashBoradV";
                                childView.view.viewOptions.getV = "getDashBoradV";

                                childView.left = $scope.dashboardOptions.views[view.viewOptions.parentViewIndex].left;
                                childView.right = $scope.dashboardOptions.views[view.viewOptions.parentViewIndex].right;
                                childView.top = $scope.dashboardOptions.views[view.viewOptions.parentViewIndex].top;
                                childView.bottom = $scope.dashboardOptions.views[view.viewOptions.parentViewIndex].bottom;
                                $scope.dashboardOptions.views.push(childView);
                                if ($scope.workbenchOptions.busyMessageOptions) {
                                    delete $scope.workbenchOptions.busyMessageOptions.msg;
                                }
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            });
//                        $scope.dashboardOptions.views.push(v)
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.dashboardOptions.dashboardType = $scope.dashboardOptions.dashboardType || "AutoHeight";
                    var dashboardOptions = $scope.dashboardOptions;
                    //toolbar handling
                    $scope.$watch('dashboardOptions.userPreferenceOptions.reload', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue) && angular.isDefined(oldValue)) {
                            $scope.populateUserPreferene($scope.dashboardOptions.userPreferenceOptions, true);
                        }
                    });

                    $scope.resize = function (direction) {
                        try {
                            $scope[$scope.dashboardOptions.resizeV]($scope.dashboardOptions.viewIndex, direction);
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.close = function () {
                        try {
                            if ($scope.dashboardOptions.parentSharedOptions && $scope.dashboardOptions.parentSharedOptions.insertInfo) {
                                delete $scope.dashboardOptions.parentSharedOptions.insertInfo.insert;
                            }
                            $scope.dashboardOptions.sharedOptions.closed = true;
                        } catch (e) {
                            var title = "close in pl-dashboard";
                            var message = "Error in close of pl-dashboard" + e + "\n" + e.stack;
                            $scope.dashboardOptions.warningOptions.error = new Error(message + "-" + title);
                        }

                    }
                    $scope.closeChildView = function (v) {
                        try {
                            if (v && v.viewOptions) {
                                for (var i = 0; i < $scope.dashboardOptions.views.length; i++) {
                                    var view = $scope.dashboardOptions.views[i];
                                    if (view.view.viewOptions._id == v.viewOptions._id) {
                                        var parentSharedOptions = view.view.viewOptions.parentSharedOptions;
                                        if (parentSharedOptions) {
                                            delete parentSharedOptions.resizable;
                                            delete parentSharedOptions.referredView;
                                        }
                                        $scope.dashboardOptions.views.splice(i, 1);
                                    }
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    if ($scope.dashboardOptions.parentSharedOptions && $scope.dashboardOptions.sharedOptions.viewPosition != "right") {
                        $scope.dashboardOptions.parentSharedOptions.resizable = true;
                        $scope.resize('left');
                    }
                    $scope.toolBarOptions = {};

                    $scope.dashboardOptions.userPreferenceOptions = $scope.dashboardOptions.userPreferenceOptions || {};
                    $scope.dashboardOptions.userPreferenceOptions.reload = false;
                    if ($scope.dashboardOptions.filterColumns && $scope.dashboardOptions.filterColumns.length > 0) {
                        $scope.dashboardOptions.userPreferenceOptions.filterColumns = $scope.dashboardOptions.filterColumns;
                        $scope.dashboardOptions.userPreferenceOptions.filterInfo = $scope.dashboardOptions.filterInfo || [];
                    }

                    if ($scope.dashboardOptions.filterInfo && $scope.dashboardOptions.filterInfo.length > 0) {
                        $scope.dashboardOptions.userPreferenceOptions.selectedType = "Filter";
                    }

                    $scope.toolBarOptions.header = {left: {}, center: [], right: []};
                    $scope.toolBarOptions.bottom = {left: [], center: [], right: []};
                    if ($scope.dashboardOptions.close) {
                        $scope.toolBarOptions.header.right.push({template: '<div ng-click="close()" class="pl-cancel-btn app-cursor-pointer">Cancel</div>'});
                    }
                    var showResizeControl = $scope.dashboardOptions.resize !== undefined ? $scope.dashboardOptions.resize : true;

                    if (showResizeControl && $scope.dashboardOptions.parentSharedOptions) {
//                        $scope.toolBarOptions.header.center.push({template:"<div ng-click=\"resize('left')\" pl-resize ng-class='{\"pl-transform-180\":dashboardOptions.resized}' class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-left\"></i></div>"});
                    }
                    if ($scope.dashboardOptions.showLabel && $scope.dashboardOptions.parentSharedOptions) {
                        $scope.toolBarOptions.header.center.push({
                            template: '<span class="app-float-left pl-panel-label  app-padding-five-px app-font-size-sixteen-px app-font-weight-bold menu-align-margin">' +
                                '   <span  ng-bind="dashboardOptions.label"></span>' +
                                '   <span ng-if="dashboardOptions.primaryFieldInfo && dashboardOptions.primaryFieldInfo.label">' +
                                '       <span>(<span ng-bind="dashboardOptions.primaryFieldInfo.label"></span>)</span>' +
                                '   </span>' +
                                '</span>'
                        });
                    }
                    if ($scope.dashboardOptions.quickViewMenuGroup && $scope.dashboardOptions.quickViewMenuGroup.menus.length > 0) {
                        $scope.toolBarOptions.header.center.push({template: "<div pl-menu-group='dashboardOptions.quickViewMenuGroup' ></div>"});
                        $scope.toolBarOptions.header.left = $scope.dashboardOptions.quickViewMenuGroup;
                    }
                    if ($scope.dashboardOptions.viewControl) {
                        $scope.toolBarOptions.header.center.push({
                            template: "<div pl-menu-group='dashboardOptions.viewControlOptions' ></div>" +
                                ""
                        });
                    }

                    if ($scope.dashboardOptions.addUserPreference) {
                        $scope.toolBarOptions.bottom.center.push({template: "<div ng-class='{\"pl-filter-background\":dashboardOptions.userPreferenceOptions.filterColumns}' pl-user-preference='dashboardOptions.userPreferenceOptions'></div>"});
                    }
                    if ($scope.dashboardOptions.headerActions) {
                        var template = "<div ng-repeat='action in dashboardOptions.headerActions' class='inline' ng-click='viewHeaderAction(action)' >" +
                            "               <span ng-if='!action.showLabel' ng-show='{{action.when}}' ng-class='action.class' class='inline' title='{{action.label}}' ></span>" +
                            "               <span ng-if='action.showLabel' ng-show='{{action.when}}' class='pl-cancel-btn tlbr-action-label text-overflow' title='{{action.label}}' ng-bind='action.label'></span>" +
                            "           </div>";
                        $scope.toolBarOptions.bottom.right.push({template: template});
                    }

                    if (dashboardOptions.dashboardType == "FixedHeight") {
                        $scope.dashboardColumns = dashboardOptions.views;
                        for (var i = 0; i < $scope.dashboardColumns.length; i++) {
                            var dashboardColumn = $scope.dashboardColumns[i];
                            if (dashboardColumn.left.indexOf("px") == -1 && dashboardColumn.left.indexOf("%") == -1) {
                                dashboardColumn.left += "%";
                            }
                            if (dashboardColumn.right.indexOf("px") == -1 && dashboardColumn.right.indexOf("%") == -1) {
                                dashboardColumn.right += "%";
                            }
                            if (dashboardColumn.top.indexOf("px") == -1 && dashboardColumn.top.indexOf("%") == -1) {
                                dashboardColumn.top += "%";
                            }
                            if (dashboardColumn.bottom.indexOf("px") == -1 && dashboardColumn.bottom.indexOf("%") == -1) {
                                dashboardColumn.bottom += "%";
                            }
                        }
                    }
                    else {
                        if (dashboardOptions.views && dashboardOptions.views.length > 0) {
                            $scope.dashboardColumns = [];
                            for (var i = 0; i < dashboardOptions.views.length; i++) {
                                var row = dashboardOptions.views[i];
                                var left = row.left ? row.left : 0;
                                var right = row.right ? row.right : 0;
                                var top = row.top ? row.top : 0;
                                var bottom = row.bottom ? row.bottom : 0;
                                var requiredCell = undefined;
                                for (var j = 0; j < $scope.dashboardColumns.length; j++) {
                                    if ($scope.dashboardColumns[j].left == left) {
                                        requiredCell = $scope.dashboardColumns[j];
                                        break;
                                    }
                                }
                                if (!requiredCell) {
                                    requiredCell = {left: left, right: right, top: top, bottom: bottom, cells: []};
                                    if ($scope.dashboardColumns.length > 0) {
                                        $scope.dashboardColumns[$scope.dashboardColumns.length - 1].right = 100 - left;
                                    }
                                    $scope.dashboardColumns.push(requiredCell);
                                }
                                requiredCell.cells.push(row);
                            }
                        }
                    }
                    $scope.$on('$destroy', function ($event) {
                        for (var key in unwatcher) {
                            unwatcher[key]();
                        }
                    });
                },
                post: function ($scope, iElement) {
                    var template = "";
                    if ($scope.dashboardOptions.dashboardType == "FixedHeight") {
                        template = "<div>" +
                            "                <div style='position: relative;width: 100%;'>" +
                            "                       <div class='pl-header-toolbar' >" +
                            "                           <pl-tool-bar-header></pl-tool-bar-header>" +
                            "                       </div>" +
                            "                    <div class='pl-toolbar' pl-tool-bar></div>" +
                            "                </div>" +
                            "           </div>" +
                            "           <div class='pl-dashboard-views' ng-class='{\"top-with-toolbar\": toolBarOptions.bottom.center.length > 0 }'>" +
                            "               <div>" +
                            "                   <div ng-repeat='cell in dashboardColumns' style='position: absolute;overflow-y: hidden; overflow-x: hidden;left:{{cell.left}}; right:{{cell.right}}; top:{{cell.top}}; bottom:{{cell.bottom}};'>" +
                            "<div style='position: relative;height: 100%;width:100%'>" +
                            "                       <div pl-dashboard-cell  style='position:absolute;left: 0px; right: 10px; top:0px;bottom: 10px;border:1px solid #dcdcdc;'>" +
                            " </div>   " +
                            "                   </div>" +
                            "</div>" +
                            "               </div>" +
                            "           </div>";
                    } else if ($scope.dashboardOptions.dashboardType == "AdvanceDashboard") {
                        template = "<pl-advance-dash-board></pl-advance-dash-board>";
                    } else {
                        template = "<div>" +
                            "                <div style='position: relative;width: 100%;'>" +
                            "                       <div class='pl-header-toolbar' >" +
                            "                           <pl-tool-bar-header></pl-tool-bar-header>" +
                            "                       </div>" +
                            "                    <div class='pl-toolbar' pl-tool-bar></div>" +
                            "                </div>" +
                            "           </div>" +
                            "           <div class='pl-dashboard-views'><div class=''>" +
                            "               <div ng-repeat='dashboardColumn in dashboardColumns' style='position: absolute;overflow-y: auto; overflow-x: hidden;margin-bottom: 4px;left:{{dashboardColumn.left}}%; right:{{dashboardColumn.right}}%; top:{{dashboardColumn.top}}%; bottom:{{dashboardColumn.bottom}}%;'}'>" +
                            "                   <div pl-dashboard-cell class='pl-dashboard-content' ng-repeat='cell in dashboardColumn.cells' ></div>   " +
                            "               </div>" +
                            "           </div></div>";
                    }

                    iElement.append($compile(template)($scope));

                    $scope.onViewControlOptionClick = function (option) {
                        try {
                            if ($scope.dashboardOptions.onViewControl) {
                                $scope[$scope.dashboardOptions.onViewControl](option)
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

pl.directive('plAdvanceDashBoard', ['$compile', function ($compile) {
    return {
        restrict: "EA",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement) {
                    var template = "<div class='adv-wrapper' ng-controller='plAdCtrl' pl-ad></div>";
                    $scope.dashboardOptions.addUserPreference = true;
                    $scope.dashboardOptions.openV = "openV";
                    $scope.dashboardOptions.closeV = "closeView";
                    $scope.dashboardOptions.popUpV = "openPopUpView";
                    $scope.dashboardOptions.getV = "getWorkbenchView";
                    $scope.dashboardOptions.onViewControl = 'onViewControl';
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.directive("plDashboardCell", ["$compile", function ($compile) {
    return {
        restrict: "A",
        replace: true,
        scope: true,
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    var dashboardCellView = $scope.cell.view;
                    var viewToBind = undefined;
                    if (dashboardCellView.viewOptions.ui == "grid") {
                        viewToBind = "gridOptions";
                    } else if (dashboardCellView.viewOptions.ui == "form") {
                        viewToBind = "formOptions";
                    }
                    dashboardCellView.viewOptions.toolbar = false;
                    dashboardCellView.viewOptions.hyperlinkEnabled = false;
                    dashboardCellView.viewOptions.showSelectionCheckbox = false;
                    if (dashboardCellView.viewOptions.autoWidthColumn === undefined) {
                        dashboardCellView.viewOptions.autoWidthColumn = true;
                    }
                    dashboardCellView.viewOptions.parentSharedOptions = dashboardCellView.viewOptions.parentSharedOptions || $scope.dashboardOptions.sharedOptions;
                    var navigation = '<div ng-if="!view.viewOptions.$recursion && view.viewOptions.navigation" class="app-font-weight-bold app-text-align-center pl-horizontal-gap">' +
                        '<div class="app-float-left app-width-twenty-px app-cursor-pointer" ng-click="previous()" ng-show="' + viewToBind + '.sharedOptions.pageOptions.hasPrevious"><i class="icon-chevron-left"></i></div>' +
                        '<div ng-bind="' + viewToBind + '.sharedOptions.pageOptions.label" class="app-float-left"></div>' +
                        '<div ng-show="' + viewToBind + '.sharedOptions.pageOptions.fetchCount" class="app-float-left">{{"&nbsp;of&nbsp;"+' + viewToBind + '.sharedOptions.pageOptions.count}}</div>' +
                        '<div class="app-float-left app-width-twenty-px app-cursor-pointer" ng-click="next()" ng-show="' + viewToBind + '.sharedOptions.pageOptions.hasNext" ><i class="icon-chevron-right"></i></div>' +
                        '</div>';
                    dashboardCellView.viewOptions.headerTemplate = "<div pl-accordion class='app-background-grey dashboard-header'>" +
                        "                                               <span  class='text-overflow app-float-left flex-1' style='margin-left:10px;'>" +
                        '                                                   <span class="app-padding-five-px app-font-size-sixteen-px text-overflow">' +
                        '                                                      <span title="{{' + viewToBind + '.label}}" ng-bind="' + viewToBind + '.label"></span>' +
                        '                                                      <span title="{{' + viewToBind + '.primaryFieldInfo.label}}" ng-if="' + viewToBind + '.primaryFieldInfo && ' + viewToBind + '.primaryFieldInfo.label">' +
                        '                                                          <span>(<span ng-bind="' + viewToBind + '.primaryFieldInfo.label"></span>)</span>' +
                        '                                                      </span>' +
                        '                                                   </span>' +
                        "                                               </span>" +

                        "                                                   <span class='app-float-right ' style='display: inline-flex; margin-right: 10px;'>" +
                        navigation +
                        "                                                   <span ng-click='closeChildView(cell.view)' class='pl-cancel-btn app-cursor-pointer' ng-if='cell.view.viewOptions.parentViewIndex != undefined' style='margin: 0; padding: 3px 6px; height: 18px;'>Cancel</span>" +
                        "                                                   <span ng-if='dashboardOptions.dashboardType !== \"FixedHeight\"' class='app-float-left' ng-click='toggleChild()'>" +
                        "                                                       <i class=\"pl-accordion icon-chevron-up\" ></i>" +
                        "                                                   </span>" +
                        "                                               </span> " +
                        "                                           </div>";
                    if ($scope.dashboardOptions.dashboardType !== "FixedHeight") {
                        dashboardCellView.viewOptions.headerFreeze = false;
                        dashboardCellView.viewOptions.nested = true;
                    }

                    $scope.view = dashboardCellView;
                    var template = undefined;
                    if ($scope.dashboardOptions.dashboardType === "FixedHeight") {
                        template = "    <div>" +
                            "                       <div class='app-busy-message-container-true' ng-show='view.viewOptions.busyMessageOptions.msg'>" +
                            "                       <div class='app-busy-message' ng-bind='view.viewOptions.busyMessageOptions.msg'></div>" +
                            "                           </div>" +

                            "                   <div style='width: 100%;height: 100%; overflow-x: hidden; overflow-y: hidden;' pl-view ng-controller='ViewCtrl' class='app-position-absolute' ng-style='view.viewOptions.style'></div>" +
                            "           </div>";

                    } else {
                        template = "<div style='position:relative;float: left;width: 100%'>" +
                            "                   <div class='app-busy-message-container-true' ng-show='view.viewOptions.busyMessageOptions.msg'>" +
                            "                       <div class='app-busy-message' ng-bind='view.viewOptions.busyMessageOptions.msg'></div>" +
                            "                           </div>" +
                            "               <div pl-view  ng-controller='ViewCtrl' class='app-float-left app-width-full pl-dashboard-content-children' ng-style='view.viewOptions.style'>" +

                            "               </div>" +
                            "           </div>";
                    }


                    iElement.append($compile(template)($scope));
                }
            }
        }
    };
}]);

pl.controller('plAdCtrl', function ($scope) {

    function populateGroups(views, groups, defaultGroup, dashboardGroups) {
        for (var i = 0; i < views.length; i++) {
            var cell = views[i];
            cell.style = cell.style || {};
            if ($scope.dashboardOptions.dashboardLayout) {
                var dashboardColumns = Number($scope.dashboardOptions.dashboardLayout.substring(0, 1));
                if (dashboardColumns) {
                    $scope.dashboardOptions.availabelColSpan = dashboardColumns;
                    cell.style.width = (100 / dashboardColumns);
                }
                if (cell.colSpan) {
                    cell.style.width *= cell.colSpan;
                }
                if (cell.style.width) {
                    cell.style.width = cell.style.width + '%';
                }
            }
            if (cell.groupName && dashboardGroups && dashboardGroups.length > 0) {
                for (var j = 0; j < dashboardGroups.length; j++) {
                    var group = dashboardGroups[j];
                    if (cell.groupName == group.name) {
                        var adGroup = {
                            name: group.name,
                            cells: [],
                            noOfCellsPerRow: group.noOfCellsPerRow,
                            showName: group.showName,
                            height: group.height
                        }
                        var alreadyInGroup = false;
                        for (var k = 0; k < groups.length; k++) {
                            var adGroupCell = groups[k];

                            if (groups[k].name == group.name) {
                                alreadyInGroup = true;
                                adGroupCell.cells.push(cell);
                                break;
                            }
                        }
                        if (!alreadyInGroup) {
                            groups.push(adGroup);
                            adGroup.cells.push(cell);
                        }
                    }
                }
            } else {
                defaultGroup.cells.push(cell);
            }
        }

    }

    function populateAggregateColumns(aggGroups, aggCols) {
        for (var i = 0; i < aggGroups.length; i++) {
            var aggGroup = aggGroups[i];
            if (aggGroup.column === undefined) {
                aggGroup.column = 1;
            }
            if (aggGroup.column == 1) {
                aggCols[0].columns.push(aggGroup);
            } else if (aggGroup.column == 2) {
                aggCols[1].columns.push(aggGroup);
            } else if (aggGroup.column >= 3) {
                aggCols[2].columns.push(aggGroup);
            }

        }
    }

    $scope.dashboardOptions.aggregates = $scope.dashboardOptions.aggregates || [];
    var defaultGroup = {name: 'Default', cells: [], showName: false, height: '170px'};
    if ($scope.dashboardOptions.views && $scope.dashboardOptions.views.length > 0) {
        for (var i = $scope.dashboardOptions.views.length - 1; i >= 0; i--) {
            /*move primary views to aggregates to show seperate view in left side 33%*/
            var view = $scope.dashboardOptions.views[i];
            if ($scope.dashboardOptions.views[i].primary) {
                $scope.dashboardOptions.aggregates.push($scope.dashboardOptions.views[i]);
                $scope.dashboardOptions.views.splice(i, 1);
            }
        }

        var noOfCellsPerRows = $scope.dashboardOptions.views.length < 3 ? $scope.dashboardOptions.views.length : 3;
        $scope.dashboardOptions.adGroups = $scope.dashboardOptions.adGroups || [];
        populateGroups($scope.dashboardOptions.views, $scope.dashboardOptions.adGroups, defaultGroup, $scope.dashboardOptions.dashboardGroups);
        $scope.dashboardOptions.adGroups.push(defaultGroup);
    }
    if ($scope.dashboardOptions.aggregates && $scope.dashboardOptions.aggregates.length > 0) {
        if ($scope.dashboardOptions.views && $scope.dashboardOptions.views.length > 0) {
            $scope.dashboardOptions.groupStyle = {'float': 'right', 'width': '67%', 'left': '33%'};
        }

        $scope.dashboardOptions.aggregateGroups = $scope.dashboardOptions.aggregateGroups || [];

        $scope.dashboardOptions.aggregateColumnViews = $scope.dashboardOptions.aggregateColumnViews || [];
        for (var i = 0; i < 3; i++) {
            $scope.dashboardOptions.aggregateColumnViews.push({columns: []});
            $scope.dashboardOptions.aggregateGroups.push({views: []});
        }

        populateAggregateColumns($scope.dashboardOptions.aggregates, $scope.dashboardOptions.aggregateColumnViews);
        for (var i = 0; i < $scope.dashboardOptions.aggregateColumnViews.length; i++) {
            if ($scope.dashboardOptions.aggregateColumnViews[i].columns.length > 0) {
                $scope.dashboardOptions.totalViewColumns = i + 1;
            }
        }
        if ($scope.dashboardOptions.totalViewColumns > 1) {
            $scope.dashboardOptions.groupStyle = {};
            $scope.dashboardOptions.groupStyle.display = 'none';
            if ($scope.dashboardOptions.views && $scope.dashboardOptions.views.length > 0) {
                $scope.dashboardOptions.warningOptions.error = new Error("View can't be defined if aggregate is coming in more than one columns.");
            }
        }
        for (var i = 0; i < $scope.dashboardOptions.aggregateColumnViews.length; i++) {
            defaultGroup = {name: 'Default', cells: [], showName: false, height: '170px'};
            if ($scope.dashboardOptions.aggregateColumnViews[i].columns.length > 0) {
                populateGroups($scope.dashboardOptions.aggregateColumnViews[i].columns, $scope.dashboardOptions.aggregateGroups[i].views, defaultGroup, $scope.dashboardOptions.dashboardGroups);

            }
            if (defaultGroup && defaultGroup.cells && defaultGroup.cells.length > 0) {
                $scope.dashboardOptions.aggregateGroups[i].views.push(defaultGroup);

            }
            defaultGroup = undefined;
            $scope.dashboardOptions.aggregateGroups[i].style = {};

            if ($scope.dashboardOptions.totalViewColumns == 2) {
                $scope.dashboardOptions.aggregateGroups[i].style.width = '50%';
                $scope.dashboardOptions.aggregateGroups[i].style.left = (50 * i) + '%';
            } else {
                $scope.dashboardOptions.aggregateGroups[i].style.width = '33%';
                $scope.dashboardOptions.aggregateGroups[i].style.left = (33 * i) + '%';
            }
            $scope.dashboardOptions.aggregateGroups[i].style["z-index"] = '1';
        }
    }


    $scope.toolBarOptions = {};
    $scope.toolBarOptions.bottom = {left: [], center: [], right: []};
    $scope.toolBarOptions.top = {left: [], center: [], right: []};
    $scope.toolBarOptions.header = {left: {}, center: [], right: []};
    $scope.dashboardOptions.style = $scope.dashboardOptions.style || {top: '38px;'};

    if ($scope.dashboardOptions.showLabel && $scope.dashboardOptions.parentSharedOptions) {
        $scope.toolBarOptions.header.center.push({template: '<span ng-class=\'{"menu-align-margin":dashboardOptions.sharedOptions.viewPosition != "right"}\' class="app-float-left pl-panel-label  app-padding-five-px app-font-size-sixteen-px app-font-weight-bold">' +
            '   <span  ng-bind="dashboardOptions.label"></span>' +
            '   <span ng-if="dashboardOptions.primaryFieldInfo && dashboardOptions.primaryFieldInfo.label">' +
            '       <span>(<span ng-bind="dashboardOptions.primaryFieldInfo.label"></span>)</span>' +
            '   </span>' +
            '</span>'
        });
    }

    if ($scope.dashboardOptions.quickViewMenuGroup && $scope.dashboardOptions.quickViewMenuGroup.menus.length > 0) {
        $scope.toolBarOptions.header.left = $scope.dashboardOptions.quickViewMenuGroup;
    }
    if ($scope.dashboardOptions.viewControl && $scope.dashboardOptions.viewControlOptions) {
        var template = "<div pl-menu-group='dashboardOptions.viewControlOptions' ></div>";
        $scope.toolBarOptions.header.center.push({template: template});
    }
    $scope.dashboardOptions.userPreferenceOptions = $scope.dashboardOptions.userPreferenceOptions || {};
    $scope.dashboardOptions.userPreferenceOptions.reload = false;
    if ($scope.dashboardOptions.filterColumns && $scope.dashboardOptions.filterColumns.length > 0) {
        $scope.dashboardOptions.userPreferenceOptions.filterColumns = $scope.dashboardOptions.filterColumns;
        $scope.dashboardOptions.userPreferenceOptions.filterInfo = $scope.dashboardOptions.filterInfo || [];
    }

    if ($scope.dashboardOptions.filterInfo && $scope.dashboardOptions.filterInfo.length > 0) {
        $scope.dashboardOptions.userPreferenceOptions.selectedType = "Filter";
    }
    if ($scope.dashboardOptions.addUserPreference) {
        $scope.dashboardOptions.style.top = '92px';
        $scope.toolBarOptions.bottom.center.push({template: "<div ng-class='{\"pl-filter-background\":dashboardOptions.userPreferenceOptions.filterColumns}' pl-user-preference='dashboardOptions.userPreferenceOptions'></div>"});
    }
    if ($scope.dashboardOptions.close) {
        $scope.toolBarOptions.header.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
    }

    if ($scope.dashboardOptions.headerActions) {
        var template = "<div ng-repeat='action in dashboardOptions.headerActions' class='inline' ng-click='viewHeaderAction(action)' >" +
            "               <span ng-if='!action.showLabel' ng-show='{{action.when}}' ng-class='action.class' class='inline' title='{{action.label}}' ></span>" +
            "               <span ng-if='action.showLabel' ng-show='{{action.when}}' class='pl-cancel-btn tlbr-action-label text-overflow' title='{{action.label}}' ng-bind='action.label'></span>" +
            "           </div>";
        $scope.toolBarOptions.bottom.right.push({template: template});
    }


    $scope.onViewControlOptionClick = function (option) {
        try {
            if ($scope.dashboardOptions.onViewControl) {
                $scope[$scope.dashboardOptions.onViewControl](option)
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }

    }

    $scope.close = function () {
        try {
            if ($scope.dashboardOptions.parentSharedOptions && $scope.dashboardOptions.parentSharedOptions.insertInfo) {
                delete $scope.dashboardOptions.parentSharedOptions.insertInfo.insert;
            }
            $scope.dashboardOptions.sharedOptions.closed = true;
        } catch (e) {
            var title = "close in pl-dashboard";
            var message = "Error in close of pl-dashboard" + e + "\n" + e.stack;
            $scope.dashboardOptions.warningOptions.error = new Error(message + "-" + title);
        }

    }
});

pl.directive("plAd", ["$compile", function ($compile) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                },
                post: function ($scope, iElement) {
                    var template = "<div>" +
                        "               <div style='position: relative;width: 100%;'>" +
                        "                   <div class='pl-header-toolbar' >" +
                        "                       <pl-tool-bar-header></pl-tool-bar-header>" +
                        "                   </div>" +
                        "                   <div class='pl-toolbar' pl-tool-bar></div>" +
                        "               </div>" +
                        "           </div>" +
                        "           <div class='adv-wrapper advanced-cell' style='top:" + $scope.dashboardOptions.style.top + "; margin-left: 8px;' pl-dashboard-body></div>";
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    };
}]);

pl.directive('plDashboardBody', ['$compile', '$timeout', function ($compile, $timeout) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement) {
                    $timeout(function () {
                        var template = "    <div class=' pl-clear'>" +
                            "                   <div class='app-float-left absolute-wrapper' ng-repeat='aggGroupContainer in dashboardOptions.aggregateGroups' ng-if='aggGroupContainer.views.length > 0' ng-style='aggGroupContainer.style'>" +
                            "                       <div class='absolute-wrapper app-overflow-auto'>" +
                            "                           <div pl-agg-group ng-repeat='aggGroup in aggGroupContainer.views'></div>" +
                            "                       </div>" +
                            "                   </div>" +
                            "                   <div ng-if='dashboardOptions.adGroups.length > 0' ng-style='dashboardOptions.groupStyle' class='absolute-wrapper app-overflow-auto'>" +
                            "                   <div ng-repeat='kGroup in dashboardOptions.adGroups' class='adv-group-wrapper'>" +
                            "                       <div ng-style='kGroup.style'>" +
                            "                           <div class='adv-gp-header' ng-if='kGroup.showName' >" +
                            "                               <div class='adv-header' ng-bind='kGroup.name'></div>" +
                            "                           </div>" +
                            "                       </div>" +
                            "                       <div pl-ad-group class='app-overflow-hiiden' ></div>" +
                            "                   </div>" +
                            "                   </div>" +
                            "               </div>";
                        iElement.append(($compile)(template)($scope));
                    }, 0);

                },
                post: function ($scope, iElement) {
                }
            }
        }
    }
}]);

pl.directive('plAggGroup', ['$compile', function ($compile) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope) {
                    if ($scope.aggGroup && $scope.aggGroup.cells && $scope.aggGroup.cells.length > 0) {
                        $scope.aggGroup.agHeaders = $scope.aggGroup.agHeaders || [];
                        $scope.aggGroup.agHeaders.push({label: $scope.aggGroup.name});
                        var agGroup = $scope.aggGroup;
                        $scope.kGroup = {cells: []};            /* populate kGroup here based on primary value in cells to show view in aggregate area*/
                        for (var i = $scope.aggGroup.cells.length - 1; i >= 0; i--) {
                            var cell = $scope.aggGroup.cells[i];
                            if (cell.primary) {
                                $scope.kGroup.cells.push(cell);
                                $scope.aggGroup.cells.splice(i, 1);
                            }
                        }
                        if (agGroup.cells[0] && agGroup.cells[0].view && agGroup.cells[0].view.viewOptions && agGroup.cells[0].view.viewOptions.aggregateSpan) {
                            var aggregateSpan = agGroup.cells[0].view.viewOptions.aggregateSpan;
                            aggregateSpan.month == true ? $scope.aggGroup.agHeaders.push({label: aggregateSpan.monthLabel, style: {width: '90px'}}) : '';
                            aggregateSpan.quarter == true ? $scope.aggGroup.agHeaders.push({label: aggregateSpan.quarterLabel, style: {width: '90px'}}) : '';
                            aggregateSpan.fy == true ? $scope.aggGroup.agHeaders.push({label: aggregateSpan.fyLabel, style: {width: '90px'}}) : '';
                        }
                    }
                },
                post: function ($scope, iElement, attrs) {
                    var template = "<div class='adv-group-wrapper adv-cell' style='padding: 0; border-left: 1px solid #d5d5d5; box-shadow: none; margin: 8px 8px 0 0 '>" +
                        "               <table class='app-width-full'>" +
                        "                   <tr class='agHeader' style='border-right: 1px solid #d5d5d5;'>" +
                        "                       <td class='agHeader-cell app-text-align-center' ng-repeat='agHeader in aggGroup.agHeaders' ng-style='agHeader.style' style='padding: 10px 0; font-weight: bold;' ng-bind='agHeader.label' ng-class={\"flex-1\":agHeader.fullWidth}></td>" +
                        "                   </tr>" +
                        "               </table>" +
                        "               <table class='app-width-full' style='margin-top: -1px;' ng-repeat='cell in aggGroup.cells' pl-agg-row-data>" +
                        "               </table>" +
                        "           </div>";
                    if ($scope.kGroup.cells && $scope.kGroup.cells.length > 0) {
                      /*add view in template if any primary view comes, we dont show aggregate if we have the simple views to show*/
                        template = " <div pl-ad-group class='app-overflow-hiiden' ></div>";
                    }
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.directive('plAggRowData', ['$compile', function ($compile) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope) {
                    if ($scope.cell && $scope.cell.view && $scope.cell.view.data && $scope.cell.view.data.result) {
                        if ($scope.cell.view.viewOptions.value) {
                            $scope.cell.valueExpression = $scope.cell.view.viewOptions.value;
                            $scope.cell.percentageExpression = $scope.cell.view.viewOptions.value + '__percentage';
                            if ($scope.cell.view.viewOptions.valueui == 'currency') {
                                $scope.cell.valueExpression += '.amount | number:0 | zero';
                            }
                        }
                        $scope.setKpiCellMetaData($scope.cell.view.viewOptions);
                    }

                    $scope.openDrilDownView = function (viewInfo, timePeriod) {
                        try {
                            var referredView = viewInfo;
                            var referredViewParameters = angular.copy(referredView.parameters);
                            var mainParameters = angular.copy($scope.cell.view.viewOptions.parameters);
                            mainParameters.__selectedSpanDate = mainParameters[timePeriod];
                            referredView.skipUserState = true;
                            if (mainParameters && referredViewParameters) {
                                var newParameters = angular.copy(mainParameters);
                                $scope.resolveParameters(referredViewParameters, mainParameters, newParameters);
                                referredView.$parameters = newParameters;
                            }
                            referredView.parentSharedOptions = viewInfo.parentSharedOptions || {};
                            referredView.fullMode = true;
                            referredView.dashboardLayout = $scope.dashboardOptions.dashboardLayout;
                            referredView.close = true;
                            referredView.showLabel = true;
                            referredView.parentSharedOptions.primaryFieldValue = {label: $scope.cell.name};
                            $scope[$scope.cell.view.viewOptions.openV](referredView);
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                },
                post: function ($scope, iElement) {
                    var template = "<tr ng-show='cell.view.viewOptions.busyMessageOptions.msg' style='height: 40px;' class='app-right-border'>" +
                        "           <td colspan='4' class='app-position-relative'>" +
                        "               <span class='adv app-border-none' style='box-shadow: none;'>" +
                        "                   <div class='app-busy-message-container-true' style='left: 50%; top:30%;' ng-show='cell.view.viewOptions.busyMessageOptions.msg'>" +
                        "                       <div class='app-background-message app-zero-margin' >" +
                        "                           <img ng-src='{{cell.view.viewOptions.busyMessageOptions.msg}}' style='padding: 0 5px; width: 15px;' class='pl-grid-refresh-box' />" +
                        "                       </div>" +
                        "                   </div>" +
                        "               </span>" +
                        "           </td></tr>" +
                        "  <tr ng-repeat='row in cell.view.data.result' style='border-right: 1px solid #d5d5d5; background: #ffffff; height: 56px;'> " +
                        "              <td class='agHeader-cell app-position-relative app-padding-left-five-px'>" +
                        "                   <span ng-bind='cell.name' ng-show='!cell.view.viewOptions.groupColumns'></span>" +
                        "                   <span ng-bind='row.aggregateLabel' ng-show='cell.view.viewOptions.groupColumns'></span>" +
                        "               </td>" +
                        "              <td class='agHeader-cell' style='line-height: 10px; width: 90px;' >" +
                        "                   <span '>" +
                        "                       <pl-indicator bind-to='month'></pl-indicator>" +
                        "                 </span>" +
                        "               </td>" +
                        "              <td class='agHeader-cell' style='line-height: 10px;  width: 90px;'>" +
                        "                   <span >" +
                        "                       <pl-indicator bind-to='quarter'></pl-indicator>" +
                        "                   </span>" +
                        "               </td>" +
                        "              <td class='agHeader-cell' style='line-height: 10px;  width: 90px;'>" +
                        "                   <span >" +
                        "                       <pl-indicator bind-to='fy'></pl-indicator>" +
                        "                   </span>" +
                        "               </td>" +
                        "          </tr>";
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.directive('plIndicator', ['$compile', function ($compile) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    var arrowClass = undefined;
                    var textClass = undefined;
                    if ($scope.row[attrs.bindTo] && $scope.row[attrs.bindTo][$scope.cell.percentageExpression] >= 0) {
                        if ($scope.cell.view.viewOptions.indicator == 'decreasing') {
                            arrowClass = 'up red';
                            textClass = 'red';
                        } else {
                            arrowClass = 'up green';
                            textClass = 'green';
                        }
                    } else {
                        if ($scope.cell.view.viewOptions.indicator == 'decreasing') {
                            arrowClass = 'down green';
                            textClass = 'green';
                        } else {
                            arrowClass = 'down red';
                            textClass = 'red';
                        }
                    }
                    var template = " <span style='white-space: normal;'>" +
                        "               <a ng-if='cell.drildownView' class='block app-text-align-center' ng-click='openDrilDownView(cell.drildownView, \"" + attrs.bindTo + "\")' ng-bind='row." + attrs.bindTo + "." + $scope.cell.valueExpression + "'></a>" +
                        "               <span ng-if='!cell.drildownView' class='block app-text-align-center' ng-bind='row." + attrs.bindTo + "." + $scope.cell.valueExpression + "'></span>" +
                        "           </span>" +
                        "           <span class='right-text block app-text-align-center' style='padding: 0;' ng-if='row." + attrs.bindTo + "." + $scope.cell.percentageExpression + "'>" +
                        "               <span ng-bind='row." + attrs.bindTo + "." + $scope.cell.percentageExpression + " | zero | percentage' class='" + textClass + "'></span>" +
                        "               <span class='" + arrowClass + "'></span>" +
                        "           </span>" +
                        "           <span class='right-text block app-text-align-center' style='padding: 0;' ng-if='!row." + attrs.bindTo + "." + $scope.cell.percentageExpression + "'>-</span>";
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}])

pl.directive("plAdGroup", ["$compile", function ($compile) {
    return {
        restrict: "EAC",
        replace: true,
        scope: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.kGroup.style = $scope.kGroup.style || {};
                    if (!$scope.dashboardOptions.availabelColSpan) {
                        $scope.dashboardOptions.availabelColSpan = 1
                    }
                    var availabelColSpan = $scope.dashboardOptions.availabelColSpan;
                    $scope.viewRowGroup = [];
                    var viewRowCells = [];
                    for (var i = 0; i < $scope.kGroup.cells.length; i++) {
                        var cell = $scope.kGroup.cells[i];
                        viewRowCells.push(cell);
                        if (!cell.colSpan) {
                            cell.colSpan = 1;
                        }
                        if (cell.colSpan) {
                            availabelColSpan = availabelColSpan - cell.colSpan;
                        }
                        if (availabelColSpan <= 0 || (i == $scope.kGroup.cells.length - 1)) {
                            $scope.viewRowGroup.push(viewRowCells);
                            viewRowCells = [];
                            availabelColSpan = $scope.dashboardOptions.availabelColSpan;
                        }
                    }
                },
                post: function ($scope, iElement) {
                    var template = "<div ng-repeat='viewRow in viewRowGroup' class='flex' >" +
                        "               <div ng-repeat='cell in viewRow' class='flex app-width-full inline app-vertical-align-top' ng-style='cell.style'>" +
                        "                   <div pl-arrange-cell class='adv app-width-full' ng-style='cell.childStyle'></div>" +
                        "               </div>" +
                        "           </div>";
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    };
}]);

pl.directive('plArrangeCell', ['$compile', '$timeout', function ($compile, $timeout) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    if ($scope.cell.ui == 'form') {
                        $scope.cell.childStyle = $scope.cell.childStyle || {};
                        $scope.cell.childStyle.background = "url('../images/panel_bg.png')";
                    }
                    $scope.cell.viewControl = $scope.dashboardOptions.viewControl;
                    var template = "<div class='adv-cell'>" +
                        "                   <pl-ad-cell ng-controller='plAdCellCtrl'></pl-ad-cell>" +
                        "           </div>" +
                        "<div></div>";
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.controller('plAdCellCtrl', function ($scope) {
    if ($scope.cell && $scope.cell.view && $scope.cell.view.viewOptions) {
        $scope.setKpiCellMetaData($scope.cell.view.viewOptions);
        $scope.cell.views = [$scope.cell.view];
    }

    $scope.cell.viewControlOptions = {
        menus: [

            {
                label: AppViews.__selfquickviewcustomization__.viewOptions.label,
                viewid: AppViews.__selfquickviewcustomization__.viewOptions.id
            },
            {
                label: AppViews.__editaction__.viewOptions.label,
                viewid: AppViews.__editaction__.viewOptions.id
            },
            {
                label: AppViews.__editfield__.viewOptions.label,
                viewid: AppViews.__editfield__.viewOptions.id
            }
        ],
        class: "app-bar-button app-menu-setting",
        displayField: "label",
        hideOnClick: true,
        onClick: 'onViewControlOptionClick',
        menuClass: 'pl-default-popup-label'
    };
    $scope.onHeaderActionClick = function (action, openViewType, viewIndex) {
        try {
            if ($scope.cell.views[viewIndex] && $scope.cell.views[viewIndex].viewOptions[openViewType]) {
                var referredView = angular.copy($scope.cell.views[viewIndex].viewOptions[openViewType]);
                var mainUI = $scope.cell.views[viewIndex].viewOptions.ui;
                var referredViewParameters = referredView.parameters;
                var mainParameters = undefined;
                if (mainUI == "aggregate") {
                    mainParameters = $scope.cell.views[viewIndex].viewOptions.parameters;
                }
                referredView.skipUserState = true;
                if (mainParameters && referredViewParameters) {
                    var newParameters = angular.copy(mainParameters);
                    $scope.resolveParameters(referredViewParameters, mainParameters, newParameters);
                    referredView.$parameters = newParameters;
                }
                if (referredView.viewMode == 'popup') {
                    referredView.popupResize = true;
                    $scope[$scope.cell.views[viewIndex].viewOptions.popUpV](referredView);

                } else if (referredView.viewMode == 'overlay') {
                    $scope[$scope.cell.views[viewIndex].viewOptions.openV](referredView, function (overlayView) {
                        if (overlayView) {
                            $scope.setKpiCellMetaData(overlayView.viewOptions);
                            for (var i = 0; i < $scope.cell.views.length; i++) {
                                var view = $scope.cell.views[i];
                                if (view.viewOptions) {
                                    view.viewOptions.active = false;
                                }
                            }
                            overlayView.viewOptions.close = true;
                            $scope.cell.views.push(overlayView);
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        }
                    });

                } else if (referredView.viewMode == 'aside') {
                    referredView.close = true;
                    referredView.fullMode = true;
                    $scope[$scope.cell.views[viewIndex].viewOptions.openV](referredView);

                } else {
                    $scope.expendedView(referredView);
                }
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    };

    $scope.closeCell = function (viewIndex) {
        try {
            if (viewIndex && $scope.cell.views.length > viewIndex) {
                $scope.cell.views.splice(viewIndex, 1);
                if ($scope.cell.views.length > 0) {
                    $scope.cell.views[$scope.cell.views.length - 1].viewOptions.active = true;
                }
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    };
    $scope.expendedView = function (viewInfo) {
        try {
            if (viewInfo) {
                viewInfo.parentSharedOptions = viewInfo.parentSharedOptions || {};
                viewInfo.fullMode = true;
                viewInfo.close = true;
                viewInfo.showLabel = true;
                viewInfo.parentSharedOptions.primaryFieldValue = {label: $scope.cell.name};
                $scope[$scope.view.viewOptions.openV](viewInfo);
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    };

});

pl.directive('plAdCell', ['$compile', function ($compile) {
    return{
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement) {
                    var template = "<div ng-style='childStyle' class='app-position-relative app-white-backgroud-color'>" +
                        "               <div class='app-busy-message-container-true' ng-show='cell.view.viewOptions.busyMessageOptions.msg'>" +
                        "                   <img src='images/loadinfo.gif' class='app-background-message pl-grid-refresh-box'/>" +
                        "               </div>" +
                        "               <div ng-repeat='view in cell.views' ng-mousedown='bindmouseMove()' ng-mouseup='unbindmouseMove()' ng-show='view.viewOptions.active' pl-view ng-controller='ViewCtrl' ng-style='view.viewOptions.style' ></div>" +
                        "           </div>";
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);

pl.controller('plAggregateCtrl', function ($scope) {
    if (!$scope.aggregateOptions) {
        $scope.aggregateOptions = {};
    }
    if ($scope.view && $scope.view.data && $scope.view.data.result) {
        $scope.aggregateOptions.cellData = $scope.view.data.result;
    }
    if ($scope.aggregateOptions.valueui == 'currency') {
        $scope.aggregateOptions.valueExpression = $scope.aggregateOptions.value + '.amount | number:0 | zero';
        $scope.aggregateOptions.percentageExpression = $scope.aggregateOptions.value + '__percentage';
    } else if ($scope.aggregateOptions.valueui == 'number') {
        $scope.aggregateOptions.valueExpression = $scope.aggregateOptions.value + ' | number | zero';
        $scope.aggregateOptions.percentageExpression = $scope.aggregateOptions.value + '__percentage';
    }
});

pl.directive('plAggregateView', ['$compile', function ($compile) {
    return {
        restrict: 'EA',
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement) {

                },
                post: function ($scope, iElement) {
                    var template = "<div>";
                    if ($scope.aggregateOptions.headerTemplate) {
                        template += $scope.aggregateOptions.headerTemplate;
                    }
                    template += "   <div class='adv-body'>" +
                        "               <div ng-repeat='row in aggregateOptions.cellData' class='app-width-full'>" +
                        "                   <div class='adb-cell app-text-align-right' >" +
                        "                       <div class='top-layer'>" +
                        "                           <div title='Month' style='margin-right: 0;' class='app-width-full'>" +
                        "                               <i ng-class='{\"icon-rupee\":row.month." + $scope.aggregateOptions.value + ".type.currency == \"INR\", \"icon-dollar\":row.month." + $scope.aggregateOptions.value + ".type.currency == \"USD\"}' style='padding-left: 5px;'></i>" +
                        "                               <span ng-bind='row.month." + $scope.aggregateOptions.valueExpression + "'></span>" +
                        "                               <span class='right-text' style='padding: 0;' ng-if='row.month." + $scope.aggregateOptions.percentageExpression + "'>" +
                        "                                   <span ng-bind='row.month." + $scope.aggregateOptions.percentageExpression + " | zero | percentage' ng-class='{\"green\":row.month." + $scope.aggregateOptions.percentageExpression + " >=0 , \"red\":row.month." + $scope.aggregateOptions.percentageExpression + " < 0}'></span>" +
                        "                                   <span ng-class='{\"up\":row.month." + $scope.aggregateOptions.percentageExpression + " >=0 , \"down\":row.month." + $scope.aggregateOptions.percentageExpression + " < 0}'></span>" +
                        "                               </span>" +
                        "                               <div style='line-height: 15px;' class='block tailer-txt' >{{aggregateOptions.aggregateSpan.monthLabel}}</div>" +
                        "                           </div>" +
                        "                       </div>" +
                        "                       <div class='mid-layer flex' style='line-height: normal;'>" +
                        "                           <div class='flex-1 app-text-align-center' ng-if='row.quarter'>" +
                        "                               <i ng-class='{\"icon-rupee\":row.quarter." + $scope.aggregateOptions.value + ".type.currency == \"INR\", \"icon-dollar\":row.quarter." + $scope.aggregateOptions.value + ".type.currency == \"USD\"}'></i>" +
                        "                               <span class='txt' ng-bind='row.quarter." + $scope.aggregateOptions.valueExpression + "'></span>" +
                        "                               <span  ng-if='row.quarter." + $scope.aggregateOptions.percentageExpression + "'>" +
                        "                                   <span class='per-box' ng-class='{\"green\":row.quarter." + $scope.aggregateOptions.percentageExpression + " >=0, \"red\":row.quarter." + $scope.aggregateOptions.percentageExpression + "< 0 }'>{{row.quarter." + $scope.aggregateOptions.percentageExpression + " | zero | percentage}}</span>" +
                        "                                   <span class='small' ng-class='{\"up\":row.quarter." + $scope.aggregateOptions.percentageExpression + " >=0, \"down\":row.quarter." + $scope.aggregateOptions.percentageExpression + "< 0 }'></span>" +
                        "                               </span>" +
                        "                               <div class='center tailer-txt'>{{aggregateOptions.aggregateSpan.quarterLabel}}</div>" +
                        "                           </div>" +
                        "                           <div class='flex-1 app-text-align-center' ng-if='row.fy'>" +
                        "                               <i ng-class='{\"icon-rupee\":row.fy." + $scope.aggregateOptions.value + ".type.currency == \"INR\", \"icon-dollar\":row.fy." + $scope.aggregateOptions.value + ".type.currency == \"USD\"}'></i>" +
                        "                               <span class='txt'>{{row.fy." + $scope.aggregateOptions.valueExpression + "}}</span>" +
                        "                               <span ng-if='row.fy." + $scope.aggregateOptions.percentageExpression + "'>" +
                        "                                   <span class='per-box' ng-class='{\"green\":row.fy." + $scope.aggregateOptions.percentageExpression + " >=0, \"red\":row.fy." + $scope.aggregateOptions.percentageExpression + "< 0 }'>{{row.fy." + $scope.aggregateOptions.percentageExpression + " | zero | percentage}}</span>" +
                        "                                   <span class='small' ng-class='{\"up\":row.fy." + $scope.aggregateOptions.percentageExpression + " >=0, \"down\":row.fy." + $scope.aggregateOptions.percentageExpression + "< 0 }'></span>" +
                        "                               </span>" +
                        "                               <div class='center tailer-txt'>{{aggregateOptions.aggregateSpan.fyLabel}}</div>" +
                        "                           </div>" +
                        "                       </div>" +
                        "                   </div>" +
                        "               </div>" +
                        "       </div>";
                    iElement.append(($compile)(template)($scope));
                }
            }
        }
    }
}]);
