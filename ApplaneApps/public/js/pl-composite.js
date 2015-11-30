/***** move to app-models.js to generate minified version for before commit*******/
pl.controller('pl-composite-ctrl', function ($scope, $compile, $parse, $timeout, $http, $q) {

        var unwatcher = {};

        $scope.compositeView = [];

        Util.sort($scope.compositeViewOptions.views, "asc", "index");
        $scope.populateToolbar = function () {

            try {
                $scope.toolBarOptions = {};
                $scope.compositeViewOptions.busyMessageOptions = $scope.compositeViewOptions.busyMessageOptions || {};

                $scope.compositeViewOptions.userPreferenceOptions = $scope.compositeViewOptions.userPreferenceOptions || {};
                $scope.compositeViewOptions.userPreferenceOptions.reload = false;
                if ($scope.compositeViewOptions.filterColumns && $scope.compositeViewOptions.filterColumns.length > 0) {
                    $scope.compositeViewOptions.userPreferenceOptions.filterColumns = $scope.compositeViewOptions.filterColumns;
                    $scope.compositeViewOptions.userPreferenceOptions.filterInfo = $scope.compositeViewOptions.filterInfo;
                }
                if ($scope.compositeViewOptions.sortColumns && $scope.compositeViewOptions.sortColumns.length > 0) {
                    $scope.compositeViewOptions.userPreferenceOptions.sortColumns = $scope.compositeViewOptions.sortColumns;
                    $scope.compositeViewOptions.userPreferenceOptions.sortInfo = $scope.compositeViewOptions.sortInfo;
                }

                if ($scope.compositeViewOptions.groupColumns && $scope.compositeViewOptions.groupColumns.length > 0) {
                    $scope.compositeViewOptions.userPreferenceOptions.groupColumns = $scope.compositeViewOptions.groupColumns;
                    $scope.compositeViewOptions.userPreferenceOptions.aggregateColumns = $scope.compositeViewOptions.aggregateColumns;
                    $scope.compositeViewOptions.userPreferenceOptions.groupInfo = $scope.compositeViewOptions.groupInfo;
                }

                if ($scope.compositeViewOptions.lastSelectedInfo) {
                    $scope.compositeViewOptions.userPreferenceOptions.selectedType = $scope.compositeViewOptions.lastSelectedInfo;
                } else if ($scope.compositeViewOptions.filterInfo && $scope.compositeViewOptions.filterInfo.length > 0) {    // TODO: need to change with compositeViewOptions
                    $scope.compositeViewOptions.userPreferenceOptions.selectedType = "Filter";
                } else if ($scope.compositeViewOptions.sortInfo && $scope.compositeViewOptions.sortInfo.length > 0) {
                    $scope.compositeViewOptions.userPreferenceOptions.selectedType = 'Sort';
                } else if ($scope.compositeViewOptions.groupInfo && $scope.compositeViewOptions.groupInfo.length > 0) {
                    $scope.compositeViewOptions.userPreferenceOptions.selectedType = 'Group';
                }


                $scope.toolBarOptions.bottom = {left: [], center: [], right: []};
                $scope.toolBarOptions.top = {left: [], center: [], right: []};
                $scope.toolBarOptions.header = {left: {}, center: [], right: []};
                var showResizeControl = $scope.compositeViewOptions.viewResize !== undefined ? $scope.compositeViewOptions.viewResize : true;


                if (showResizeControl && $scope.compositeViewOptions.parentSharedOptions) {
                    $scope.toolBarOptions.header.center.push({template: "<div ng-click=\"resize('left')\" ng-hide='compositeViewOptions.sharedOptions.viewPosition == \"full\" || compositeViewOptions.sharedOptions.resizable' ng-class='{\"pl-transform-180\":compositeViewOptions.sharedOptions.viewPosition != \"right\"}' class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-left\"></i></div>"});
                }
                if (!$scope.compositeViewOptions.userPreferenceOptions.sortInfo && !$scope.compositeViewOptions.userPreferenceOptions.filterInfo && !$scope.compositeViewOptions.userPreferenceOptions.groupInfo) {
                    $scope.compositeViewOptions.addUserPreference = false;
                    /*dont set false as filter bar visible by default*/
                }
                if ($scope.compositeViewOptions.addUserPreference) {
                    $scope.toolBarOptions.bottom.center.push({template: "<div ng-class='{\"pl-filter-background\":compositeViewOptions.userPreferenceOptions.sortColumns || compositeViewOptions.userPreferenceOptions.groupColumns  || compositeViewOptions.userPreferenceOptions.filterColumns}' pl-user-preference='compositeViewOptions.userPreferenceOptions'></div>"});
                }

                if ($scope.compositeViewOptions.quickViewMenuGroup && $scope.compositeViewOptions.quickViewMenuGroup.menus.length > 0) {
                    $scope.toolBarOptions.top.left.push({template: "<div pl-menu-group='compositeViewOptions.quickViewMenuGroup' ></div>"});
                    $scope.toolBarOptions.header.left = $scope.compositeViewOptions.quickViewMenuGroup;
                }

                if ($scope.compositeViewOptions.showLabel) {
                    $scope.toolBarOptions.header.center.push({template: '<span ng-class=\'{"menu-align-margin":compositeViewOptions.sharedOptions.viewPosition == \"full\" || compositeViewOptions.sharedOptions.resizable}\' class="app-float-left pl-panel-label  app-padding-five-px app-font-size-sixteen-px app-font-weight-bold">' +
                        '   <span  ng-bind="compositeViewOptions.label"></span>' +
                        '   <span ng-if="compositeViewOptions.primaryFieldInfo && compositeViewOptions.primaryFieldInfo.label">' +
                        '       <span>(<span ng-bind="compositeViewOptions.primaryFieldInfo.label"></span>)</span>' +
                        '   </span>' +
                        '</span>'});
                }


                if ($scope.compositeViewOptions.viewControl && $scope.compositeViewOptions.viewControlOptions) {
                    var template = "<div pl-menu-group='compositeViewOptions.viewControlOptions' ></div>";
                    $scope.toolBarOptions.header.center.push({template: template});
                }
                if (showResizeControl) {
                    $scope.toolBarOptions.header.right.push({template: "<div ng-click=\"resize('right')\" pl-resize  ng-show=\"compositeViewOptions.sharedOptions.resizable\" class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-right\"></i></div>"});
                }
                if ($scope.compositeViewOptions.close) {
                    $scope.toolBarOptions.top.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
                    $scope.toolBarOptions.header.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
                }

            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }

        $scope.onViewControlOptionClick = function (option) {
            try {
                if ($scope.compositeViewOptions.onViewControl) {
                    $scope[$scope.compositeViewOptions.onViewControl](option)
                }
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }

        $scope.populateToolbar();

        $scope.openVComposite = function () {
            $scope.loadTabView($scope.compositeViewOptions.selectedTabIndex, false);
        }


        $scope.loadTabData = function (view, index, reloadUserPreference) {
            if (reloadUserPreference || $scope.compositeViewOptions.selectedTabIndex !== index) {
                $scope.compositeViewOptions.filterStateChanged = !$scope.compositeViewOptions.filterStateChanged;
            }
            $scope.compositeViewOptions.selectedTabIndex = index;
            view.viewOptions.toolbar = false;

            if ($scope.compositeViewOptions.$parameters) {
                view.viewOptions.$parameters = $scope.compositeViewOptions.$parameters;
            }
            if ($scope.compositeViewOptions.getV) {
                view.viewOptions.getV = $scope.compositeViewOptions.getV;
            }
            if ($scope.compositeViewOptions.openV) {
                view.viewOptions.openV = $scope.compositeViewOptions.openV;
            }
            if ($scope.compositeViewOptions.busyMessageOptions) {
                view.viewOptions.busyMessageOptions = $scope.compositeViewOptions.busyMessageOptions;
            }
            if ($scope.compositeViewOptions.backgroundOptions) {
                view.viewOptions.backgroundOptions = $scope.compositeViewOptions.backgroundOptions;
            }
            if ($scope.compositeViewOptions.shortMessageOptions) {
                view.viewOptions.shortMessageOptions = $scope.compositeViewOptions.shortMessageOptions;
            }
            if ($scope.compositeViewOptions.confirmMessageOptions) {
                view.viewOptions.confirmMessageOptions = $scope.compositeViewOptions.confirmMessageOptions;
            }
            if ($scope.compositeViewOptions.warningOptions) {
                view.viewOptions.warningOptions = $scope.compositeViewOptions.warningOptions;
            }
            if ($scope.compositeViewOptions.provideParentParameter) {
                view.viewOptions.provideParentParameter = $scope.compositeViewOptions.provideParentParameter;
            }
            if ($scope.compositeViewOptions.watchParentParameter) {
                view.viewOptions.watchParentParameter = $scope.compositeViewOptions.watchParentParameter;
            }
            if ($scope.compositeViewOptions.parentParameters) {
                view.viewOptions.parentParameters = $scope.compositeViewOptions.parentParameters;
            }
            if ($scope.compositeViewOptions.close != undefined) {
                view.viewOptions.close = $scope.compositeViewOptions.close;
            }
//            if ($scope.compositeViewOptions.edit != undefined) {                      //commented as edit was coming false in task dashboard due to this--TODO
//                view.viewOptions.edit = $scope.compositeViewOptions.edit;
//            }

            view.viewOptions.openVComposite = "openVComposite"; //after saving customizations, view was opening in right side. Now we have reloaded the currently loaded tab view.
            var headerTemplate = "";
            if ($scope.compositeViewOptions.headerTemplate) {
                headerTemplate += $scope.compositeViewOptions.headerTemplate;
            }
            if ($scope.compositeViewOptions.views && $scope.compositeViewOptions.views.length > 1) {
                headerTemplate += "<pl-composite-tabs></pl-composite-tabs>";
            }
            view.viewOptions.headerTemplate = headerTemplate;
            $scope.compositeView.splice(0, $scope.compositeView.length);
            $scope.compositeView.push(view);
        }

        $scope.close = function () {
            $scope.compositeViewOptions.sharedOptions.closed = true;
        };


        $scope.resize = function (direction) {
            try {
                if ($scope.compositeViewOptions.resizeV && $scope.compositeViewOptions.sharedOptions && $scope.compositeViewOptions.sharedOptions.resizable != false) {
                    $scope[$scope.compositeViewOptions.resizeV]($scope.compositeViewOptions.viewIndex, direction);
                }
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }
        if ($scope.compositeViewOptions.parentSharedOptions && $scope.compositeViewOptions.sharedOptions.viewPosition != "right") {
            $scope.resize('left');
        }

        $scope.loadTabView = function (index, reloadUserPreference) {

            var views = $scope.compositeViewOptions.views;
            var view = views[index];
            var parameters = $scope.compositeViewOptions.$parameters;
            var fullTextSearchValue = undefined;
            if (parameters != undefined) {
                if (parameters.__fulltext__) {  // to apply fts in composite
                    fullTextSearchValue = parameters.__fulltext__;
                    delete parameters.__fulltext__;
                }
                var filterColumns = $scope.compositeViewOptions.filterColumns;
                var viewFilter = undefined;
                var viewParameters = undefined;
                var selectedFilterIds = undefined;
                for (var i = 0; i < filterColumns.length; i++) {
                    var filterColumn = filterColumns[i];
                    var filterValue = parameters[filterColumn.field];
                    if (filterValue) {
                        var filterField = filterColumn.field;
                        var asParameter = filterColumn.asParameter;
                        var actionView = getActionViewInfo(filterColumn.views, view.alias);
                        if (actionView) {
                            asParameter = actionView.asParameter;
                            filterField = actionView.filterField || filterField;
                        }
                        if (asParameter) {
                            viewParameters = viewParameters || {};
                            viewParameters[filterField] = filterValue;
                        } else {
                            viewFilter = viewFilter || {};
                            viewFilter[filterField] = filterValue;
                        }
                        selectedFilterIds = selectedFilterIds || {};
                        selectedFilterIds[filterColumn.field] = filterValue;
                    }
                }

                $scope.compositeViewOptions.selectedFilterIds = selectedFilterIds;
                view.$filter = viewFilter;
                view.$parameters = viewParameters;
                if (fullTextSearchValue) { // to apply fts in composite view
                    view.$filter = view.$filter || {};
                    view.$filter.$text = {$search: fullTextSearchValue};
                }
                if ($scope.compositeViewOptions.parentParameters) { //parentParameters must be passed in $parameters of right view--case for notifying other dashboard on click of one dashboard view--Ritesh bansal
                    view.$parameters = view.$parameters || {};
                    for (var key in parameters) {
                        view.$parameters[key] = parameters[key];
                    }
                }
            }

            $scope[$scope.compositeViewOptions.openV](view, function (view) {
                $scope.loadTabData(view, index, reloadUserPreference);
            });
        }

        function getQuery(action, recursion) {
            var viewQuery = angular.copy($scope.compositeView[0].viewOptions.queryGrid);
            var groupField = action.field;
            var actionView = getActionViewInfo(action.views, $scope.compositeView[0].viewOptions.alias);
            if (actionView && actionView.filterField) {
                groupField = actionView.filterField;
            }
            delete viewQuery.$fields;
            if (viewQuery.$filter) {
                delete viewQuery.$filter[groupField];
            }
            viewQuery.$group = {_id: null, count: {$sum: 1}, $fields: false};
            var query = {};
            query.$collection = action.collection;
            query.$fields = {};
            query.$fields[action.displayField] = 1;
            var countQuery = {};
            countQuery.$type = {scalar: "count"};
            countQuery.$query = viewQuery;
            countQuery.$fk = groupField;
            query.$fields.count = countQuery;
            query.$recursion = recursion;
            if (action.filter) {
                var filter = action.filter;
                if (typeof filter === "string") {
                    filter = JSON.parse(filter);
                }
                query.$filter = filter;
            }
            return query;
        }

        function loadFilterViews(action, callback) {
            if (action.filterViews) {
                callback();
                return;
            }
            $scope[$scope.compositeViewOptions.openV]({id: action.view}, function (view) {
                action.showPlusButton = view.viewOptions.insert;
                action.filterViews = view.viewOptions.views;
                callback();
            });
        }


        function ensureActionView(action) {
            var D = require("q").defer();
            if (action.view) {
                loadFilterViews(action, function () {
                    if (action.filterTabIndex === undefined) {
                        action.filterTabIndex = 0;
                    }
                    if (action.oldFilterTabIndex === action.filterTabIndex && action.loadedFilterTabView) {
                        D.resolve(action.loadedFilterTabView.viewOptions.queryGrid);
                        return;
                    }
                    $scope[$scope.compositeViewOptions.openV](action.filterViews[action.filterTabIndex], function (nesView) {
                        action.loadedFilterTabView = nesView;
                        D.resolve(nesView.viewOptions.queryGrid);
                    })
                });
            } else {
                D.resolve();
            }
            return D.promise;
        }


        $scope.populateFilters = function (action, recursion, callback) {
            var userDB = ApplaneDB.connection("userdb");
            return ensureActionView(action).then(function (loadedFilterViewQueryGrid) {
                var queryToExecute = undefined;
                var query = getQuery(action, recursion);
                if (loadedFilterViewQueryGrid) {
                    queryToExecute = loadedFilterViewQueryGrid;
                    queryToExecute.$fields = query.$fields;
                    if (queryToExecute.$recursion) {
                        queryToExecute.$recursion = query.$recursion;
                    }
                } else {
                    queryToExecute = query;
                }
                return userDB.query(queryToExecute);
            }).then(function (result) {
                result = result.response.result;
                callback(result);
            }).fail(function (err) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(err);
                }
            })
        };

        $scope.compositeViewOptions.changeCurrentFilter = function (row, field, displayField) {
            $scope.compositeViewOptions.currentFilter = {currentRow: row, field: field, displayField: displayField};
            $scope.compositeViewOptions.filterValueChanged = !$scope.compositeViewOptions.filterValueChanged;
        }

        function getActionViewInfo(actionViews, loadedViewAlias) {
            if (actionViews && actionViews.length > 0) {
                for (var j = 0; j < actionViews.length; j++) {
                    var actionView = actionViews[j];
                    if (actionView.alias === loadedViewAlias) {
                        return actionView;
                    }
                }
            }
        }

        function populateFilterInfo(field, fieldValue, parameters) {
            $scope.compositeViewOptions.userPreferenceOptions.queryParameters = $scope.compositeViewOptions.userPreferenceOptions.queryParameters || {};
            for (var key in parameters) {
                $scope.compositeViewOptions.userPreferenceOptions.queryParameters[key] = parameters[key];
            }
            $scope.compositeViewOptions.userPreferenceOptions.filterInfo = $scope.compositeViewOptions.userPreferenceOptions.filterInfo || [];
            var filterColumns = $scope.compositeViewOptions.filterColumns;
            for (var i = 0; i < filterColumns.length; i++) {
                var filterColumn = filterColumns[i];
                if (filterColumn.field === field) {
                    var index = Util.isExists($scope.compositeViewOptions.userPreferenceOptions.filterInfo, filterColumn, "field");
                    if (index === undefined) {
                        filterColumn[field] = fieldValue;
                        $scope.compositeViewOptions.userPreferenceOptions.filterInfo.push(filterColumn);
                    } else {
                        $scope.compositeViewOptions.userPreferenceOptions.filterInfo[index][field] = fieldValue;
                    }
                    break;
                }
            }
        }

        function populateCompositeViewParameters(parameters) {
            $scope.compositeViewOptions.$parameters = $scope.compositeViewOptions.$parameters || {}; //to add $parameter to loaded tab view...
            for (var key in parameters) {
                if (key === "__changed") { //__changed property need not to be passed as parameters---case for notifying one dashboard view on click of other dashboard view..--Ritesh Bansal
                    continue;
                }
                $scope.compositeViewOptions.$parameters[key] = parameters[key];
            }
        }

        function saveUserStateAndLoadView(parameters, reloadUserPreference) {
            $scope.populateUserPreferene($scope.compositeViewOptions.userPreferenceOptions, true);
            populateCompositeViewParameters(parameters);
            $scope.loadTabView($scope.compositeViewOptions.selectedTabIndex, reloadUserPreference);
        }

        unwatcher.reload = $scope.$watch('compositeViewOptions.userPreferenceOptions.reload', function (newValue, oldValue) {
            if (!angular.equals(newValue, oldValue)) {
                var parameters = $scope.compositeViewOptions.userPreferenceOptions.queryParameters;
                saveUserStateAndLoadView(parameters, true);
            }
        });
        if ($scope.compositeViewOptions.watchParentParameter && $scope.compositeViewOptions.parentSharedOptions) { //reloadViewOnFilterChange was set true hardcoded for advance dashboard, whole view was reloading on filter applied and that was removing filter applied from left dashboard view on right view.--case on row click of project dashboard,filter of that project should be applied on the tasks dashboard
            unwatcher.parentUserPreferenceOptionsReload = $scope.$watch("compositeViewOptions.parentSharedOptions.userPreferenceOptions.reload", function (newValue, oldValue) {
                if (!angular.equals(newValue, oldValue) && angular.isDefined(newValue)) {
                    var parameters = $scope.compositeViewOptions.parentSharedOptions.userPreferenceOptions.queryParameters;
                    populateCompositeViewParameters(parameters);
                    $scope.loadTabView($scope.compositeViewOptions.selectedTabIndex, false);

                }
            });
        }

        if ($scope.compositeViewOptions.watchParentParameter) { //this work is required for passing parameters to composite view's $parameters--case for notifying one dashboard view on click of other dashboard view..--RItesh Bansal
            unwatcher.childViewParameters = $scope.$watch('compositeViewOptions.parentParameters', function (newValue, oldValue) {
                if (angular.equals(newValue, oldValue)) {
                    return;
                }
                var parameters = $scope.compositeViewOptions.parentParameters;
                populateCompositeViewParameters(parameters);
                $scope.loadTabView($scope.compositeViewOptions.selectedTabIndex || 0, false);
            }, true);
        }

        unwatcher.filterValueChanged = $scope.$watch('compositeViewOptions.filterValueChanged', function (newValue, oldValue) {
            if (!angular.equals(newValue, oldValue)) {
                var currentRowInfo = $scope.compositeViewOptions.currentFilter;
                var currentRow = currentRowInfo.currentRow;
                var field = currentRowInfo.field;
                var displayField = currentRowInfo.displayField;

                var parameters = {};
                parameters[field] = currentRow._id;
                var filterValue = {_id: currentRow._id};
                filterValue[displayField] = currentRow[displayField];

                populateFilterInfo(field, filterValue, parameters);
                saveUserStateAndLoadView(parameters, false);
            }
        });

        $scope.$on('$destroy', function () {
            for (var key in unwatcher) {
                unwatcher[key]();
            }
        });

    }
)

pl.directive('plCompositeView', ["$compile", function ($compile) {
    return {
        restrict: "A",
        compile: function () {
            return {

                post: function ($scope, iElement) {
                    var views = $scope.compositeViewOptions.views;
                    var template = "<div ng-show='compositeViewOptions.toolbar'>" +
                        "               <div class='pl-header-toolbar'>" +
                        "                   <pl-tool-bar-header></pl-tool-bar-header>" +
                        "               </div>" +
                        "               <div class='pl-toolbar' pl-tool-bar ></div>" +
                        "           </div>" +
                        "            <div class='pl-clear pl-composite-wrapper flex' ng-class='{\"app-padding-top-four-px\":!compositeViewOptions.provideParentParameter && !compositeViewOptions.watchParentParameter}' style='top:90px;'>" +
                        "               <div style='width: 20%;overflow: auto;overflow-x: hidden' ng-show='compositeViewOptions.showFilterInLeft'>" +
                        "                   <div ng-repeat='action in compositeViewOptions.filterColumns'>" +
                        "                       <div class='pl-filter-columns-tab medium' pl-filter-columns></div>" +
                        "                   </div>" +
                        "               </div>" +
                        "               <div ng-class='{\"app-position-relative\":!compositeViewOptions.watchParentParameter}' class='flex-1'>" +
                        "                   <div ng-repeat='view in compositeView'>" +
                        '                       <div pl-view ng-class="compositeViewOptions.viewClass" ng-controller="ViewCtrl" class="pl-grid-body" ></div>' +
                        "                   </div>" +
                        "               </div>" +
                        "           </div>";
                    iElement.append($compile(template)($scope));

                    if (views && views.length > 0 && !$scope.compositeViewOptions.watchParentParameter) {
                        $scope.loadTabView(0);
                    }

                }
            };
        }
    }
}]);


function mergeFilterData(oldData, data, alias) {
    if (!oldData) {
        return;
    }

    for (var i = 0; i < oldData.length; i++) {
        var row = oldData[i];
        var index = Util.isExists(data, row, "_id");
        var newDataValue = index != undefined ? data[index] : undefined;
        row.count = newDataValue ? newDataValue.count : 0;
        mergeFilterData(row[alias], (newDataValue ? newDataValue[alias] : undefined), alias);
    }
}


pl.directive('plFilterColumns', ['$compile', function ($compile) {
    return{
        restrict: "A",
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    var unwatcher = {};
                    if (!$scope.action.showFilterInLeft) {
                        return;
                    }
                    var recursion = $scope.action.recursion;
                    if (recursion) {
                        if (typeof recursion === "string") {
                            recursion = JSON.parse(recursion);
                        }
                        $scope.alias = recursion.$alias || "children";
                    }
                    $scope.showLoadedFilters = function (data) {
                        $scope.hideLoadingImage = true;
                        if ($scope.action.filterTabIndex == $scope.action.oldFilterTabIndex && $scope.loadedData && $scope.loadedData[0] && $scope.loadedData[0].length > 0) {
                            mergeFilterData($scope.loadedData[0], data, $scope.alias);
                        } else {
                            $scope.loadedData = [data];
                        }
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }

                    $scope.loadFilterTabView = function (index) {
                        $scope.action.oldFilterTabIndex = $scope.action.filterTabIndex;
                        $scope.action.filterTabIndex = index;
                        $scope.hideLoadingImage = false;
                        $scope.populateFilters($scope.action, recursion, $scope.showLoadedFilters);
                    }

                    unwatcher.filterStateChanged = $scope.$watch('compositeViewOptions.filterStateChanged', function (newValue, oldValue) {
                        if (angular.isDefined(newValue)) {
                            if ($scope.action.view) {
                                $scope.action.oldFilterTabIndex = $scope.action.filterTabIndex;
                            }
                            $scope.populateFilters($scope.action, recursion, $scope.showLoadedFilters);
                        }
                    });

                    $scope.openPopUp = function () {
                        $scope[$scope.compositeViewOptions.openV]({id: $scope.action.collection, popup: true, ui: "form", $limit: 0});
                    };

                    var template = "" +
                        '               <div class="app-text-align-center app-position-relative app-padding-five-px pl-header-toolbar">' +
                        '                    <span class="absolute-wrapper" style="top:13px;" ng-class="{\'ng-hide\':hideLoadingImage}" >' +
                        '                       <img src="../images/loadinfo.gif" width="20px" />' +
                        '                    </span>' +
                        '                    <span class="tab-filter" >{{action.label}}</span>' +
                        '                    <span ng-click="openPopUp()" style="color:#f2994b;" title="Create {{action.label}}" ng-show="action.showPlusButton"><i class="icon-plus"></i></span>' +
                        '                </div>';
                    if ($scope.action.view) {
                        template += '<div ng-if="action.view" pl-filter-tabs style="padding: 0px;font-size: 13px;background: rgb(248,248,248);float: left;border-bottom: 1px solid #fff;box-shadow: inset 0px 3px 6px rgb(239,239,239);white-space: nowrap;width: 100%;height: 44px;" ></div>';
                    }
                    template += '<div class="app-padding-five-px pl-clear" ng-repeat="data in loadedData">';
                    if (recursion) {
                        template += '<div pl-tab-filter-recursive options="compositeViewOptions" field="{{action.field}}" alias="{{alias}}" displayfield="{{action.displayField}}" info="data" visible="true"></div>';
                    } else {
                        template += '<div  style="overflow: auto;overflow-x: hidden" pl-tab-filter-without-recursion filterdata="data"></div>';
                    }
                    template += '</div>';

                    iElement.append($compile(template)($scope));

                    $scope.$on('$destroy', function () {
                        for (var key in unwatcher) {
                            unwatcher[key]();
                        }
                    });
                }
            }
        }
    }
}])

pl.directive('plFilterTabs', ["$compile", function ($compile) {
    return {
        restrict: "A",
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    var template = '<div style="min-height: 48px" class="flex">' +
                        '               <ul style="padding-left: 0px">' +
                        '                   <li class="pl-filter-tabs" ng-class="{\'qview-selecetd\':action.filterTabIndex== $index}"  ng-repeat="view in action.filterViews"> ' +
                        '                       <span style="display: inline-block;line-height: 20px;" class="app-cursor-pointer" ng-click="loadFilterTabView($index)">{{view.alias}}</span>' +
                        '                   </li>' +
                        '               </ul>' +
                        '           </div>';
                    iElement.append($compile(template)($scope));
                }
            };
        }
    }
}]);

pl.directive('plTabFilterRecursive', ["$compile", function ($compile) {
    return {
        restrict: "A",
        replace: true,
        scope: {recursiveFilterData: '=info', options: '=options', visible: '=visible'},
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    if (!$scope.recursiveFilterData) {
                        return;
                    }

                    $scope.field = attrs.field;
                    $scope.alias = attrs.alias;
                    $scope.displayField = attrs.displayfield;

                    $scope.toggleTree = function (filter) {
                        filter.visible = !filter.visible;
                        if (!filter.visible) {
                            removeVisibilityFromData(filter[$scope.alias], $scope.alias);
                        }
                    }

                    var template =
                        '           <div style="white-space: nowrap" ng-repeat="filter in recursiveFilterData">' +
                        '               <span ng-show="visible" >' +
                        '                   <div class="flex">' +
                        '                      <div class="flex-1" style="overflow: hidden;text-overflow: ellipsis"> ' +
                        '                          <span class="icon-plus pl-group-toggle-box" style="padding-right: 3px" ng-show="filter[alias] && filter[alias].length > 0 " pl-grid-group ng-click="toggleTree(filter)"></span>' +
                        '                          <span  ng-class="{\'tab-filter-selected\':options.selectedFilterIds[field] == filter._id,\'pl-recursive-filter-label\':!filter[alias] || (filter[alias] && filter[alias].length===0)}"  class="app-cursor-pointer" ng-click="options.changeCurrentFilter(filter,field,displayField)">{{filter[displayField]}}</span>' +
                        '                      </div> ' +
                        '                      <span ng-class="{\'tab-filter-selected\':options.selectedFilterIds[field] == filter._id}" >( {{filter.count || 0}} )</span>' +
                        "                   </div>" +
                        "                   <div ng-if='filter.visible' style='margin-left:10px ' pl-tab-filter-recursive options='options' field='{{field}}' alias='{{alias}}' displayfield='{{displayField}}' visible='filter.visible' info='filter[alias]'></div>" +
                        "               </span>" +
                        '           </div>';

                    iElement.append($compile(template)($scope));
                }
            }
        }
    }
}
])

function removeVisibilityFromData(data, alias) {
    if (!data || data.length === 0) {
        return;
    }
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        var visible = row.visible;
        if (visible) {
            row.visible = false;
            removeVisibilityFromData(row[alias], alias);
        }
    }
}


pl.directive('plTabFilterWithoutRecursion', ["$compile", function ($compile) {
    return {
        restrict: "A",
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    $scope.filter = $scope.$eval(attrs.filterdata);

                    var template = "" +
                        '               <div>' +
                        '                    <div class="flex" ng-repeat="value in filter">' +
                        '                        <span style="text-overflow: ellipsis;overflow: hidden" ng-class="{\'tab-filter-selected\':compositeViewOptions.selectedFilterIds[action.field] == value._id}" class="app-cursor-pointer flex-1" ng-click="compositeViewOptions.changeCurrentFilter(value,action.field,action.displayField)">{{value[action.displayField]}}</span>' +
                        '                        <span ng-class="{\'tab-filter-selected\':compositeViewOptions.selectedFilterIds[action.field] == value._id}" >( {{value.count || 0}} )</span>' +
                        '                    </div>' +
                        '               </div>'
                    iElement.append($compile(template)($scope));

                }
            }
        }
    }
}
])

pl.directive('plCompositeTabs', ["$compile", "$timeout", function ($compile, $timeout) {
    return {
        restrict: "E",
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    if ($scope.toolBarOptions.header) {
                        $scope.toolbarHeaders = $scope.toolBarOptions.header.left;
                        $scope.toolbarCenterHeaders = $scope.toolBarOptions.header.center;
                        $scope.toolbarRightHeadersActions = $scope.toolBarOptions.header.right;

                    }
                    $scope.toolbarRowOptions = $scope.toolBarOptions.bottom;

                    $scope.loadView = function (view, index, $event) {
                        if (view._id == "__more") {
                            qViewHeaderPopup($event);
                        } else {
                            $scope.loadTabView(index);
                        }
                    };
                    function qViewHeaderPopup($event) {
                        try {
                            var html = "<div class='pl-overflow-y-scroll app-max-height-two-hundred'>" +
                                "           <div ng-repeat='view in compositeViewOptions.views' class='app-white-space-nowrap app-cursor-pointer'>" +
                                "               <div ng-show='view.hide' ng-click='loadView(view,$index,$event)' ng-class='{\"selected-Recursive-filter\":compositeViewOptions.selectedTabIndex== $index}' class='app-row-action pl-popup-label'>{{view.alias}}" +
                                "               </div>" +
                                "           </div>" +
                                "       </div>";
                            var popupScope = $scope.$new();
                            var p = new Popup({
                                autoHide: true,
                                deffered: true,
                                escEnabled: true,
                                hideOnClick: true,
                                html: $compile(html)(popupScope),
                                scope: popupScope,
                                element: $event.target,
                                event: $event
                            });
                            p.showPopup();
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.createRecordPopUp = function () {
                        $scope[$scope.compositeViewOptions.openV]({id: $scope.compositeView[0].viewOptions.collection, popup: true, ui: "form", $limit: 0});
                    };

                    var template = '<div id="plCompositeTabs' + $scope.compositeViewOptions.viewIndex + '" class="pl-header-toolbar" >' +
                        '           <div class="flex" style="min-height: 48px;">' +
                        '               <div  style="display: block" class="app-float-left header-l-bar app-overflow-hiiden" ng-class="toolbarHeaders.lHeaderClass" >' +
                        "                   <div>" +
                        "                       <ul style='padding-left: 0px;' id='tabs" + $scope.compositeViewOptions.viewIndex + "'>" +
                        "                           <li ng-if='compositeViewOptions.views' ng-repeat='view in compositeViewOptions.views'  ng-hide='view.hide' ng-class='{\"qview-selecetd\":(compositeViewOptions.selectedTabIndex== $index) || (view._id===\"__more\" && compositeViewOptions.selectedTabIndex >= compositeViewOptions.splitIndex-1)}'>" +
                        "                               <span class='app-cursor-pointer' ng-click='loadView(view,$index,$event)' >{{view.alias}}</span> " +
                        "                           </li>" +
                        "                       </ul>" +
                        "                   </div>" +
                        '               </div>' +
                        '               <div class="app-bar-basic flex-1 header-r-bar">' +
                        '                   <div pl-button ng-repeat="action in toolbarCenterHeaders" title="{{action.title}}" class="app-float-left"></div>' +
                        '               </div>';
                    if ($scope.compositeViewOptions.provideParentParameter) {// this is required to show plus button for creating record--case for notifying one dashboard view on click of other dashboard view.--Ritesh Bansal
                        if ($scope.compositeView.length > 0 && $scope.compositeView[0].viewOptions.insert) {
                            template += '<div class="app-float-right header-r-bar" ng-class="toolbarHeaders.rHeaderClass">' +
                                '           <span ng-click="createRecordPopUp()" style="color:#f2994b;display:inline-block;line-height: 44px;font-size: 15px" title="Create {{action.label}}"><i class="icon-plus"></i></span>' +
                                '        </div>';
                        }
                    } else {
                        template += '<div class="app-float-right header-r-bar" ng-class="toolbarHeaders.rHeaderClass">' +
                            '              <div pl-button ng-repeat="action in toolbarRightHeadersActions" ng-class="action.class" title="{{action.title}}" class="app-float-left"></div>' +
                            '        </div>' +
                            '        <pl-right-tool-bar style="margin: 6px 2px 2px 5px;"></pl-right-tool-bar>';
                    }
                    template += '</div>' +
                        '       </div>';

                    $timeout(function () {
                        if ($scope.compositeViewOptions.views && $scope.compositeViewOptions.views.length > 0) {
                            var compositeTabsWidth = angular.element('#plCompositeTabs' + $scope.compositeViewOptions.viewIndex).width();
                            var tabsUlElement = angular.element('#tabs' + $scope.compositeViewOptions.viewIndex);
                            $(tabsUlElement).find("li").each(function (index) {
                                if (index === 0) {
                                    compositeTabsWidth += $(this).offset().left;
                                }
                                var tabPosition = $(this).offset().left + $(this).width();
                                if (tabPosition > (compositeTabsWidth - 100) && $scope.compositeViewOptions.splitIndex === undefined) {
                                    $scope.compositeViewOptions.splitIndex = index;
                                }
                            });

                            if ($scope.compositeViewOptions.splitIndex != undefined && $scope.compositeViewOptions.splitted === undefined) {
                                var views = $scope.compositeViewOptions.views;
                                for (var i = 0; i < views.length; i++) {
                                    views[i].hide = (i >= $scope.compositeViewOptions.splitIndex - 1);
                                }
                                var otherMenu = {
                                    alias: "More..",
                                    _id: '__more'
                                };
                                views.push(otherMenu);
                                $scope.compositeViewOptions.splitted = true;
                            }
                        }
                    }, 0);
                    iElement.append($compile(template)($scope));
                }
            };
        }
    }
}]);
