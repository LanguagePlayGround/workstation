/***** move to app-component.js to generate minified version for before commit*******/
var pl = (pl === undefined) ? angular.module('pl', [ 'ngRoute', 'ngCookies', 'ngAnimate', 'ngSanitize', 'mgcrea.ngStrap']) : pl;

pl.controller('plUserPreferenceController', function ($scope, $compile, $timeout) {
    $scope.dragElement = function (scope, iElement, info, type) {
        iElement.bind('mousedown', function (e) {
            var offset = e.pageX;
            $('#drag-element').css({
                left: offset
            });
            $scope.userPreferenceOptions.srcIndex = $scope.$index;
            $scope.userPreferenceOptions.dragLabel = info.label;
            $scope.userPreferenceOptions.dragVisibility = true;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        });

        iElement.bind('mousemove', function (e) {
            if ($scope.userPreferenceOptions.dragVisibility) {
                $('body').bind('mousemove', function (e) {
                    var offset = e.pageX;
                    $('#drag-element').css({
                        left: offset
                    });
                });
            }
            $('body').bind('mouseup', function (e) {
                $scope.checkMouseElement();
            });
        });

        iElement.bind('mouseup', function (e) {
            $('body').unbind('mousemove');
            $scope.userPreferenceOptions.targetIndex = $scope.$index;
            $scope.userPreferenceOptions.dragVisibility = false;
            if (!$scope.$$phase) {
                $scope.$apply();
            }
            $scope.reOrderingElements($scope.userPreferenceOptions.srcIndex, $scope.userPreferenceOptions.targetIndex, type);
        });


    };
    $scope.checkMouseElement = function () {
        if ($scope.userPreferenceOptions.dragVisibility) {
            $scope.userPreferenceOptions.dragVisibility = false;
            $timeout(function () {
                $('body').unbind('mouseup');
                if (!$scope.$$phase) {
                    $scope.$apply();
                }
            }, 0)

        }
    }
    $scope.reOrderingElements = function (srcIndex, trgIndex, type) {
        var srcCol = $scope.userPreferenceOptions[type][srcIndex];
        $scope.userPreferenceOptions[type].splice(srcIndex, 1);
        $scope.userPreferenceOptions[type].splice(trgIndex, 0, srcCol);
        $scope.userPreferenceOptions.__apply__ = true;
        if (!$scope.$$phase) {
            $scope.$apply();
        }
    };
});

pl.directive('plUserPreference', [ "$compile", function ($compile) {
    return {
        restrict: 'EAC',
        template: "<div class='pl-select-type'>" +
            "       <span title='Filter' ng-click='userPreferenceOptions.selectedType = \"Filter\"' ng-class='{\"active\":userPreferenceOptions.selectedType == \"Filter\"}' class='user-preference-action filter'></span><span class='seperator'></span>" +
            "       <span title='Sort' ng-click='userPreferenceOptions.selectedType = \"Sort\"' ng-class='{\"active\":userPreferenceOptions.selectedType == \"Sort\"}' class='user-preference-action sort'></span><span class='seperator'></span>" +
            "       <span title='Group' ng-click='userPreferenceOptions.selectedType = \"Group\"' ng-class='{\"active\":userPreferenceOptions.selectedType == \"Group\"}' class='user-preference-action group'></span>" +
            "   </div>" +
//            "<div pl-menu-group='userPreferenceOptions.typeMenuGroupOptions' class='pl-select-type fltr-margin app-populate-default-filter'  ng-show='userPreferenceOptions.typeMenuGroupOptions.menus.length >0'></div>" +
            "<pl-group-info></pl-group-info>" +
            "<pl-sort-info></pl-sort-info>" +
            "<pl-filter-info></pl-filter-info>" +
            "<div class='pl-plus-button fltr-margin app-populate-default-filter ft' pl-menu-group='userPreferenceOptions.filterMenuGroupOptions' ng-show='userPreferenceOptions.selectedType == \"Filter\" '></div>" +
            "<div class='pl-plus-button fltr-margin app-populate-default-filter st' pl-menu-group='userPreferenceOptions.sortMenuGroupOptions' ng-show='userPreferenceOptions.selectedType == \"Sort\" '></div>" +
            "<div class='pl-plus-button fltr-margin app-populate-default-filter gp' pl-menu-group='userPreferenceOptions.groupsMenuGroupOptions' ng-show='userPreferenceOptions.selectedType == \"Group\" '></div>" +
            "<div class='pl-user-preference-apply' ng-click='apply()' ng-show='userPreferenceOptions.__apply__' >" +
            "   <div class='pl-apply-button'><i class=\"icon-ok\"></i></div>" +
            "</div>" +
            "<div class='app-position-relative'><div id='drag-element' ng-bind='userPreferenceOptions.dragLabel' ng-show='userPreferenceOptions.dragVisibility' class='pl-grag-group'></div></div>" +
            "<div id='drag-group' ng-bind='userPreferenceOptions.groupLabel' ng-show='userPreferenceOptions.dragGroupVisibility' class='pl-grag-group'></div>" +
            "<pl-fts data-info='gridOptions.ftsInfo' class='pl-sub-fts' ></pl-fts>",
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.userPreferenceOptions = $scope.$eval(attrs.plUserPreference);
                    var userPreferenceOptions = $scope.userPreferenceOptions;
                    var filterOption = ['Filter', 'Sort', 'Group'];
                    userPreferenceOptions.typeMenuGroupOptions = {menus: [], displayField: "label", label: "Select Type", hideOnClick: true};
                    if (userPreferenceOptions.filterColumns && userPreferenceOptions.filterColumns.length > 0) {
                        userPreferenceOptions.typeMenuGroupOptions.menus.push({label: "Filter", onClick: 'showFiltersColumns', menuClass: "pl-type-options-parent"});
                    }
                    if (userPreferenceOptions.sortColumns && userPreferenceOptions.sortColumns.length > 0) {
                        userPreferenceOptions.typeMenuGroupOptions.menus.push({label: "Sort", onClick: 'showSortColumns'});
                    }

                    if (userPreferenceOptions.groupColumns && userPreferenceOptions.groupColumns.length > 0) {
                        userPreferenceOptions.typeMenuGroupOptions.menus.push({label: "Group", onClick: 'showGroupColumns'});
                    }

                    if (userPreferenceOptions.typeMenuGroupOptions.menus.length > 0) {
                        if (angular.isDefined(userPreferenceOptions.selectedType)) {
                            userPreferenceOptions.typeMenuGroupOptions.label = userPreferenceOptions.selectedType;
                        } else {
                            userPreferenceOptions.typeMenuGroupOptions.label = userPreferenceOptions.typeMenuGroupOptions.menus[0].label;
                            userPreferenceOptions.selectedType = userPreferenceOptions.typeMenuGroupOptions.label;
                        }
                    }


                    userPreferenceOptions.filterMenuGroupOptions = {template: "<div pl-filter class='pl-overflow-y-scroll app-max-height-two-hundred'></div>", iconClass: 'icon-plus app-font-size-14px mediumn-line-height', isDropdown: true, title: "Select filter columns"};
                    userPreferenceOptions.sortMenuGroupOptions = {template: "<div pl-sort class='pl-overflow-y-scroll app-max-height-two-hundred'></div>", iconClass: 'icon-plus app-font-size-14px mediumn-line-height', isDropdown: true, title: "Select sort columns"};
                    userPreferenceOptions.groupsMenuGroupOptions = {template: "<div pl-groups class='pl-overflow-y-scroll app-max-height-two-hundred'></div>", iconClass: 'icon-plus app-font-size-14px mediumn-line-height', isDropdown: true, title: "Select group columns"};
                },
                post: function ($scope) {
                    $scope.showFiltersColumns = function (menu) {
                        $scope.userPreferenceOptions.lastSelectedInfo = 'Filter';
                        $scope.userPreferenceOptions.selectedType = 'Filter';

                    }
                    $scope.showSortColumns = function (menu) {
                        $scope.userPreferenceOptions.lastSelectedInfo = 'Sort';
                        $scope.userPreferenceOptions.selectedType = 'Sort';
                    }
                    $scope.showGroupColumns = function (menu) {
                        $scope.userPreferenceOptions.lastSelectedInfo = 'Group';
                        $scope.userPreferenceOptions.selectedType = 'Group';
                    }

                    $scope.recursionSettingChange = function (index) {
                        $scope.userPreferenceOptions.groupInfo[index].recursion.$selected = !$scope.userPreferenceOptions.groupInfo[index].recursion.$selected;
                        $scope.showApplyButton();
                    }

                    $scope.apply = function () {
                        try {
                            // To clear row-selection/clear selection message when applying filter Rajit garg- 23/Mar/2015
                            if ($scope.gridOptions && $scope.gridOptions.__selected__) {
                                $scope.gridOptions.__selected__ = false;
                            }
                            var queryGroupInfo = undefined;
                            var querySorts = undefined;
                            var queryFilters = undefined;
                            var queryParameters = undefined;
                            var reloadViewOnRefresh = false;
                            if ($scope.userPreferenceOptions.removeGroupInfo) {
                                $scope.userPreferenceOptions.removeGroupInfo = undefined;
                                queryGroupInfo = null;
                            }
                            if ($scope.userPreferenceOptions.groupInfo && $scope.userPreferenceOptions.groupInfo.length > 0) {
                                queryGroupInfo = {_id: []};

                                for (var i = 0; i < $scope.userPreferenceOptions.groupInfo.length; i++) {
                                    var grpInfo = $scope.userPreferenceOptions.groupInfo[i];
                                    var grpField = grpInfo.field;
                                    var group_IdField = {};
                                    group_IdField[grpField] = "$" + grpField;
                                    queryGroupInfo._id.push(group_IdField);

                                    var grpQueryField = grpField;
                                    if (grpInfo.recursion && grpInfo.recursion.$selected) {
                                        var groupRecursion = angular.copy(grpInfo.recursion);
                                        groupRecursion.$removeRollupHierarchy = true;
                                        groupRecursion.$rollupHierarchyField = "self";
                                        groupRecursion.$childrenAsRow = true;
                                        groupRecursion.$selfAsChildren = true;
                                        groupRecursion.$primaryColumn = grpField;
                                        if (!groupRecursion.$childrenAlias) {
                                            groupRecursion.$childrenAlias = "Team";
                                        }
                                        if (!groupRecursion.$alias) {
                                            groupRecursion.$alias = "recursiveChildren";
                                        }
                                        groupRecursion.$rollup = [];
                                        queryGroupInfo.$recursion = groupRecursion;
                                    }
                                    queryGroupInfo[grpField] = {"$first": "$" + grpQueryField}
                                }
                                if ($scope.userPreferenceOptions.aggregateColumns) {
                                    for (var i = 0; i < $scope.userPreferenceOptions.aggregateColumns.length; i++) {
                                        var gc = $scope.userPreferenceOptions.aggregateColumns[i];
                                        var ViewUtility = require("ApplaneDB/public/js/ViewUtility.js");
                                        ViewUtility.populateSortInGroup(queryGroupInfo, gc);
                                        if (gc.aggregate == "count") {
                                            queryGroupInfo[gc.field] = {$sum: 1};
                                            if (queryGroupInfo.$recursion && queryGroupInfo.$recursion.$rollup) {
                                                queryGroupInfo.$recursion.$rollup.push(gc.field);
                                            }
                                        } else if (gc.aggregate == "sum") {
                                            queryGroupInfo[gc.field] = {$sum: "$" + gc.field};
                                            if (queryGroupInfo.$recursion && queryGroupInfo.$recursion.$rollup) {
                                                if (gc.type === "currency" || gc.ui === "currency") {
                                                    var rollUpColumn = {};
                                                    rollUpColumn[gc.field] = {"amount": {"$sum": "$amount"}, "type": {"$first": "$type"}};
                                                    queryGroupInfo.$recursion.$rollup.push(rollUpColumn);
                                                } else if (gc.type === "duration" || gc.ui === "duration") {
                                                    var rollUpColumn = {};
                                                    rollUpColumn[gc.field] = {"time": {"$sum": "$time"}, "unit": {"$first": "$unit"}};
                                                    queryGroupInfo.$recursion.$rollup.push(rollUpColumn);
                                                }
                                            }
                                        }
                                    }
                                }

                            }
                            if ($scope.userPreferenceOptions.removeSortInfo) {
                                $scope.userPreferenceOptions.removeSortInfo = undefined;
                                querySorts = null;
                            }
                            if ($scope.userPreferenceOptions.sortInfo && $scope.userPreferenceOptions.sortInfo.length > 0) {
                                querySorts = {};
                                for (var i = 0; i < $scope.userPreferenceOptions.sortInfo.length; i++) {
                                    var sortColumn = $scope.userPreferenceOptions.sortInfo[i];
                                    var sortValue = sortColumn.value;
                                    var sortField = sortColumn.field;
                                    if (sortColumn.displayField) {
                                        sortField += "." + sortColumn.displayField;
                                    }
                                    if (sortValue) {
                                        querySorts[sortField] = sortValue == "Dsc" ? -1 : 1;
                                    } else {
                                        querySorts[sortField] = 1;
                                        sortColumn.value = "Asc";

                                    }
                                    sortColumn.activeMode = false;
                                }
                            }


                            if ($scope.userPreferenceOptions.removeFilterInfo) {
                                queryFilters = queryFilters || {};
                                queryParameters = queryParameters || {};
                                for (var i = 0; i < $scope.userPreferenceOptions.removeFilterInfo.length; i++) {
                                    var removeFilter = $scope.userPreferenceOptions.removeFilterInfo[i];
                                    queryParameters[removeFilter.field] = undefined;
                                    queryFilters[removeFilter.field] = undefined;

                                }
                                $scope.userPreferenceOptions.removeFilterInfo = undefined;
                            }
                            if ($scope.userPreferenceOptions.filterInfo && $scope.userPreferenceOptions.filterInfo.length > 0) {
                                queryFilters = queryFilters || {};
                                queryParameters = queryParameters || {};
                                for (var i = 0; i < $scope.userPreferenceOptions.filterInfo.length; i++) {
                                    var filterColumn = $scope.userPreferenceOptions.filterInfo[i];
                                    var filterField = filterColumn.field;
                                    var filterOperators = filterColumn.filterOperators;
                                    var filterValue = Util.resolveDot(filterColumn, filterField);
                                    var previousFilter = undefined;
                                    if (filterColumn.filter && filterColumn.filter[filterField]) {
                                        previousFilter = filterColumn.filter[filterField];
                                    }
                                    var valueToSet = undefined;
                                    /*if (filterColumn.reloadViewOnFilterChange) {
                                     reloadViewOnRefresh = filterColumn.reloadViewOnFilterChange;
                                     }*/

                                    if (filterColumn.ui == "number") {
                                        var index = filterValue ? filterValue.toString().indexOf('-') : -1;
                                        if (index > 0) {
                                            var splitValue = filterValue.split('-');
                                            if (splitValue && splitValue.length == 2) {
                                                valueToSet = {$gte: Number(splitValue[0]), $lt: Number(splitValue[1])};
                                            }
                                        } else {
                                            if ((typeof filterValue !== 'number')) {
                                                if (isNaN(Number(filterValue))) {
                                                    throw new Error("Error while casting for expression [" + filterColumn.field + "] with value [" + filterValue + "]");
                                                } else {
                                                    filterValue =  Number(filterValue);
                                                }
                                            }
                                            var label = filterOperators.label;
                                            if (label == ">=") {
                                                valueToSet = {$gte: filterValue};
                                            } else if (label == "<") {
                                                valueToSet = {$lt: filterValue};
                                            } else if (label == "<=") {
                                                valueToSet = {$lte: filterValue};
                                            } else if (label == "!=") {
                                                valueToSet = {$ne: filterValue};
                                            } else {
                                                valueToSet = filterValue;
                                            }
                                        }
                                    } else if (filterColumn.ui == "text") {
                                        var label = filterOperators.label;
                                        valueToSet = filterValue;
                                    } else if (filterColumn.ui == "checkbox" && filterColumn.options) {
                                        var booleanFilterIndex = undefined;
                                        for (var j = 0; j < filterColumn.options.length; j++) {
                                            if (filterColumn[filterColumn.field] == filterColumn.options[j]) {
                                                booleanFilterIndex = j;
                                                break;
                                            }
                                        }
                                        if (booleanFilterIndex == 0) {
                                            valueToSet = true;
                                        } else if (booleanFilterIndex == 1) {
                                            valueToSet = {$in: [null, false]};
                                        }
                                    } else if (filterColumn.ui == "autocomplete" && filterOperators) {
                                        var label = filterOperators.label;
                                        if (filterValue) {
                                            if (filterColumn.type == 'string' && filterColumn.displayField) {
                                                filterValue = Util.resolveDot(filterValue, filterColumn.displayField);
                                            } else if (filterValue._id === "__idNone") {
                                                filterValue = {$exists: false};
                                            } else if (filterColumn.valueAsObject) {
                                                filterValue = filterValue;
                                            } else if (filterValue._id) {
                                                filterValue = filterValue._id
                                            }
                                        }


                                        if (filterColumn.multiple) {
                                            if (label == "==" || label == "!=" || label == "&&") {
                                                if (filterValue && angular.isArray(filterValue) && filterValue.length > 0) {
                                                    var keys = [];
                                                    for (var j = 0; j < filterValue.length; j++) {
                                                        if (filterValue[j]._id) {
                                                            keys.push(filterValue[j]._id);
                                                        } else if (typeof filterValue[j] == "string") {
                                                            keys.push(filterValue[j]);
                                                        }
                                                    }
                                                    if (keys.length > 0) {
                                                        valueToSet = {};
                                                        if (label == "==") {
                                                            valueToSet["$in"] = keys;
                                                        } else if (label == "!=") {
                                                            valueToSet["$nin"] = keys;
                                                        } else if (label == "&&") {
                                                            valueToSet["$all"] = keys;
                                                        }
                                                    }
                                                }
                                            }
                                        } else if (!filterColumn.multiple) {
                                            if (label == "==") {
                                                valueToSet = filterValue;
                                            } else if (label == "!=") {
                                                valueToSet = {$ne: filterValue};
                                            }
                                        }

                                    } else if (filterColumn.ui == "date") {
                                        var filter = filterColumn.filter;

                                        if (filter) {
                                            if (angular.isString(filter)) {
                                                filter = JSON.parse(filter);
                                            }
                                            if (filter[filterField]) {
                                                filter = filter[filterField];
                                            }
                                            if (filter) {
                                                valueToSet = filter;
                                            }
                                        }


                                    }
                                    //incase of role, filterOptions will contain asParameter instaed of field level, in this case only selected role should be gone as parameter where as selected employee shold gone as filter
                                    if (filterColumn.asParameter || (valueToSet && valueToSet.asParameter)) {
                                        queryParameters[filterField] = valueToSet;
                                    } else {
                                        queryFilters[filterField] = valueToSet;
                                    }
                                    if (previousFilter && valueToSet) {
                                        //For role case, if role selected then it should be pass as parameter and previous filter should be removed and on the other hand if some value is selected in assign_to then previously selected role(eg.SELF) will be removed from parameters
                                        var previousFilteAsParameter = previousFilter.asParameter || false;
                                        var currentFilterAsParameter = valueToSet.asParameter || false;
                                        if (previousFilteAsParameter !== currentFilterAsParameter) {
                                            if (currentFilterAsParameter) {
                                                queryFilters[filterField] = undefined;
                                            } else {
                                                queryParameters[filterField] = undefined;
                                            }
                                        }


                                    }
                                    filterColumn.activeMode = false;

                                }
                            }
//                            $scope.userPreferenceOptions.reloadViewOnFilterChange = reloadViewOnRefresh;
                            $scope.userPreferenceOptions.queryGroups = queryGroupInfo;
                            $scope.userPreferenceOptions.querySorts = querySorts;
                            $scope.userPreferenceOptions.queryFilters = queryFilters;
                            $scope.userPreferenceOptions.queryParameters = queryParameters;
                            $scope.hideApplyButton();
                            $scope.userPreferenceOptions.reload = !$scope.userPreferenceOptions.reload;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.$watch('userPreferenceOptions.apply', function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue)) {
                            $scope.apply();
                        }
                    });
                    $scope.showApplyButton = function () {
                        $scope.userPreferenceOptions.__apply__ = true;
                    }

                    $scope.hideApplyButton = function () {
                        $scope.userPreferenceOptions.__apply__ = false;
                    }


                    $scope.removeGroupColumnFromGroupInfos = function (groupColumn, rePopulateInfo) {
                        for (var i = 0; i < $scope.userPreferenceOptions.groupInfo.length; i++) {
                            var groupInfo = $scope.userPreferenceOptions.groupInfo[i];
                            if (groupInfo.field && groupInfo.field == groupColumn.field) {
                                groupColumn.__selected__ = false;
                                if (rePopulateInfo) {
                                    $scope.populateGroupInfo([groupInfo], $scope.userPreferenceOptions.groupColumns);
                                }
                                $scope.userPreferenceOptions.removeGroupInfo = $scope.userPreferenceOptions.removeGroupInfo || [];
                                $scope.userPreferenceOptions.removeGroupInfo.push(groupColumn);
                                $scope.userPreferenceOptions.groupInfo.splice(i, 1);
                                $scope.showApplyButton();
                                break;
                            }
                        }
                        ($scope.userPreferenceOptions.groupInfo.length == 0) ? $scope.userPreferenceOptions.lastSelectedInfo = undefined : $scope.userPreferenceOptions.lastSelectedInfo = 'Group';
                    }

                    $scope.removeGroupColumnFromSortInfo = function (sortColumn, rePopulateInfo) {
                        for (var i = 0; i < $scope.userPreferenceOptions.sortInfo.length; i++) {
                            var sortInfo = $scope.userPreferenceOptions.sortInfo[i];
                            if (sortInfo.field && sortInfo.field == sortColumn.field) {
                                sortColumn.__selected__ = false;
                                if (rePopulateInfo) {
                                    $scope.populateSortInfo([sortInfo], $scope.userPreferenceOptions.sortColumns);
                                }
                                $scope.userPreferenceOptions.removeSortInfo = $scope.userPreferenceOptions.removeSortInfo || [];
                                $scope.userPreferenceOptions.removeSortInfo.push(sortInfo);
                                $scope.userPreferenceOptions.sortInfo.splice(i, 1);
                                $scope.showApplyButton();
                                break;
                            }
                        }
                        ($scope.userPreferenceOptions.sortInfo.length == 0) ? $scope.userPreferenceOptions.lastSelectedInfo = undefined : $scope.userPreferenceOptions.lastSelectedInfo = 'Sort';
                    }

                    $scope.removeFilterColumnFromFilterInfo = function (filterColumn, rePopulateInfo) {
                        for (var i = 0; i < $scope.userPreferenceOptions.filterInfo.length; i++) {
                            var filterInfo = $scope.userPreferenceOptions.filterInfo[i];
                            if (filterInfo.field && filterInfo.field == filterColumn.field) {
                                filterColumn.__selected__ = false;
                                if (rePopulateInfo) {
                                    $scope.populateFilterInfo([filterInfo], $scope.userPreferenceOptions.filterColumns);
                                }
                                $scope.userPreferenceOptions.removeFilterInfo = $scope.userPreferenceOptions.removeFilterInfo || [];
                                $scope.userPreferenceOptions.removeFilterInfo.push(filterColumn);
                                if (filterInfo && filterInfo[filterInfo.field]) {
                                    delete filterInfo[filterInfo.field];
                                }
                                $scope.userPreferenceOptions.filterInfo.splice(i, 1);
                                $scope.showApplyButton();
                                break;
                            }
                        }
                        ($scope.userPreferenceOptions.filterInfo.length == 0) ? $scope.userPreferenceOptions.lastSelectedInfo = undefined : $scope.userPreferenceOptions.lastSelectedInfo = 'Filter';
                    }
                }
            }
        }
    };
}]);

pl.directive('plGroups', [ "$compile", function ($compile) {
    return {
        restrict: 'A',
        template: "<div ng-repeat='groupColumn in userPreferenceOptions.groupColumns' class='pl-groups-options-parent '>" +
            "       <div class='app-white-space-nowrap app-width-full' style='margin-right: 5px;'>" +
            "           <span><input type='checkbox' ng-model='groupColumn.__selected__' ng-change='selectGroupColumn(groupColumn)'></span>" +
            "           <span ng-bind='groupColumn.label'  ng-class='{\"selected\":groupColumn.__selected__}'></span>" +
            "       </div>" +
            "       <div ng-if='groupColumn.options' ng-repeat='option in groupColumn.options' class='app-float-left app-width-full' style='margin-right: 5px;'>" +
            "           <span><input type='checkbox' ng-model='groupColumn[option.field]'/></span>" +
            "           <span ng-bind='option.label'></span>" +
            "       </div>" +
            "    </div>",

        compile: function () {
            return {

                pre: function ($scope, iElement, attrs) {
                    $scope.selectGroupColumn = function (groupColumn) {
                        $scope.userPreferenceOptions.lastSelectedInfo = 'Group';
                        $scope.showApplyButton();
                        if (groupColumn.__selected__) {
                            $scope.userPreferenceOptions.groupInfo.push(groupColumn);
                        } else {
                            $scope.removeGroupColumnFromGroupInfos(groupColumn);
                        }

                    }
                }
            }
        }
    };
}
]);

pl.directive('plGroupInfo', [ "$compile", function ($compile) {
    return {
        restrict: 'E',
        template: "<div ng-show='userPreferenceOptions.groupInfo.length > 0 && userPreferenceOptions.selectedType == \"Group\"' class=' app-float-left'>" +
            "       <div class='applied-filter-parent app-float-left pl-group-parent fltr-applied' ng-repeat='gInfo in userPreferenceOptions.groupInfo' >" +
            "           <div ng-bind='gInfo.label' ng-controller='plUserPreferenceController' pl-group-drag class='app-float-left pl-user-preference-widget filter-max-width' style='color: #525252;'></div>" +
            "               <span class='recursion-image app-cursor-pointer  pl-theme-background pl-cross-filter ' ng-show='gInfo.recursion ' title='Recursive' ng-class='{\"active\":gInfo.recursion.$selected }' ng-click='recursionSettingChange($index)'></span>" +
            "           <div class='app-float-right app-cursor-pointer  pl-theme-background pl-cross-filter' ng-click='removeGroupColumnFromGroupInfos(gInfo, true)'>" +
            "               <div class='pl-remove-filter'><i class=\"icon-remove\"></i></div>" +
            "           </div>" +
            "       </div>" +
            "</div>"
    };
}
]);

pl.directive('plGroupDrag', ["$compile", function ($compile) {
    return{
        restrict: 'A',
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    $scope.dragElement($scope, iElement, $scope.gInfo, 'groupInfo');
                }
            }
        }
    }
}]);

pl.directive('plFilter', [ "$compile", function ($compile) {
    return {
        restrict: 'A',
        template: "<div ng-repeat='filterColumn in userPreferenceOptions.filterColumns' class='pl-filter-options-parent'>" +
            "           <span><input type='checkbox' ng-model='filterColumn.__selected__' ng-change='selectFilterColumn(filterColumn)' ></span>" +
            "           <span ng-bind='filterColumn.label' ng-class='{\"selected\":filterColumn.__selected__}'></span>" +
            "    </div>",
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.selectFilterColumn = function (filterColumn) {
                        $scope.userPreferenceOptions.lastSelectedInfo = 'Filter';
                        filterColumn.activeMode = true;
                        if (filterColumn.__selected__) {
                            $scope.userPreferenceOptions.filterInfo.push(filterColumn);
                        } else {
                            $scope.removeFilterColumnFromFilterInfo(filterColumn);
                        }
                        $scope.showApplyButton();
                    }
                }
            }
        }
    };
}]);

pl.directive('plFilterInfo', [ "$compile", "$filter", function ($compile, $filter) {
    return {
        restrict: 'E',
        template: "<div pl-group-info ng-show='userPreferenceOptions.filterInfo.length > 0 && userPreferenceOptions.selectedType == \"Filter\"' >" +
            "       <div class='applied-filter-parent app-float-left pl-group-parent pl-border-radius-3px fltr-applied' ng-repeat='filter in userPreferenceOptions.filterInfo'>" +
            "           <div pl-filter-template ng-show='!filter.activeMode' ng-click='filter.activeMode=true;userPreferenceOptions.__apply__=true;showCustomPopUp = undefined; showNDaysPopUp = undefined;' class='app-float-left filter-max-width  text-overflow'></div>" +
            "           <div pl-filter-editable-cell-template class='app-float-left pl-filter-edit-template' ng-show='filter.activeMode'></div>" +
            "           <div class='app-float-right app-cursor-pointe pl-theme-background pl-cross-filter ' ng-class='{\"show-on-hover\":!filter.activeMode}' ng-hide='filter.mandatory'>" +
            "               <div class='pl-remove-filter' ng-click='removeFilterColumnFromFilterInfo(filter, true)'><i class=\"icon-remove\" ></i></div>" +
            "           </div>" +
            "       </div>" +
            "</div>",

        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    var filterInfoLength = $scope.userPreferenceOptions.filterInfo ? $scope.userPreferenceOptions.filterInfo.length : 0;
                    for (var i = 0; i < filterInfoLength; i++) {
                        var filter = $scope.userPreferenceOptions.filterInfo[i];
                        if (filter.filter) {
                            if (Utility.isJSONObject(filter.filter[filter.field])) {
                                for (var key in filter.filter[filter.field]) {
                                    if (key == '$function') {
                                        var currentDate = new Date();
                                        if (filter.filter[filter.field][key] == 'Functions.CurrentDateFilter') {
                                            filter.value = $filter('date')(currentDate, "dd/MM/yyyy");
                                        } else if (filter.filter[filter.field][key] == 'Functions.CurrentWeekFilter') {
                                            var weekFirstDay = new Date(currentDate);
                                            weekFirstDay.setDate(currentDate.getDate() - currentDate.getDay());
                                            var weekLastDay = new Date(currentDate);
                                            weekLastDay.setDate((currentDate.getDate() - currentDate.getDay()) + 6);
                                            filter.value = $filter('date')(weekFirstDay, "dd/MM/yyyy") + " - " + $filter('date')(weekLastDay, "dd/MM/yyyy");
                                        } else if (filter.filter[filter.field][key] == 'Functions.CurrentMonthFilter') {
                                            filter.value = $filter('date')(currentDate, "MMMM-yyyy");
                                        } else if (filter.filter[filter.field][key] == 'Functions.CurrentYearFilter') {
                                            filter.value = $filter('date')(new Date(), "yyyy");
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    };
}
]);

pl.directive('plFilterEditableCellTemplate', ['$compile', '$timeout', function ($compile, $timeout) {
    'use strict';
    return {
        restrict: 'A',
        link: function ($scope, iElement) {
            var template = $scope.filter.editableCellTemplate;

            if (angular.isUndefined(template) && $scope.userPreferenceOptions.filterColumns && $scope.userPreferenceOptions.filterColumns.length > 0) {
                for (var i = 0; i < $scope.userPreferenceOptions.filterColumns.length; i++) {
                    var filterColumn = $scope.userPreferenceOptions.filterColumns[i];
                    if (filterColumn.field == $scope.filter.field) {
                        template = filterColumn.editableCellTemplate;
                        var label = $scope.filter.filterOperators && $scope.filter.filterOperators.label ? $scope.filter.filterOperators.label : undefined;
                        if (label && filterColumn.filterOperators) {
                            $scope.filter.filterOperators = filterColumn.filterOperators;
                            $scope.filter.filterOperators.label = label;

                        }
                        break;
                    }
                }
            }
            iElement.append($compile(template)($scope));
            $scope.$watch('filter.activeMode', function (newValue) {
                if (newValue) {
                    $timeout(function () {
                        iElement.find('input.form-control').focus().select();
                    }, 0);
                }
            });

        }
    };
}]);

pl.directive('plFilterTemplate', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: 'A',
        link: function ($scope, iElement) {
            var template = $scope.filter.cellTemplate;
            if (angular.isUndefined(template) && $scope.userPreferenceOptions.filterColumns && $scope.userPreferenceOptions.filterColumns.length > 0) {
                for (var i = 0; i < $scope.userPreferenceOptions.filterColumns.length; i++) {
                    var filterColumn = $scope.userPreferenceOptions.filterColumns[i];
                    if (filterColumn.field == $scope.filter.field) {
                        template = filterColumn.cellTemplate;
                        break;
                    }
                }
            }


            iElement.append($compile(template)($scope));

        }
    };
}]);

pl.directive('plSort', [ "$compile", function ($compile) {
    return {
        restrict: 'A',
        template: "<div ng-repeat='sortColumn in userPreferenceOptions.sortColumns' class='pl-sort-options-parent'>" +
            "       <div class='app-float-left' style='margin-right:5px;'>" +
            "           <span><input type='checkbox' ng-model='sortColumn.__selected__' ng-change='selectSortColumn(sortColumn)'></span>" +
            "           <span ng-bind='sortColumn.label'  ng-class='{\"selected\":sortColumn.__selected__}'></span>" +
            "       </div>" +
            "    </div>",
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    $scope.selectSortColumn = function (sortColumn) {
                        $scope.userPreferenceOptions.lastSelectedInfo = 'Sort';
                        sortColumn.activeMode = true;
                        if (sortColumn.__selected__) {
                            $scope.userPreferenceOptions.sortInfo.push(sortColumn);
                        } else {
                            $scope.removeGroupColumnFromSortInfo(sortColumn);
                        }
                        $scope.showApplyButton();
                    }
                }
            }
        }
    };
}]);

pl.directive('plSortInfo', [ "$compile", function ($compile) {
    return {
        restrict: 'E',
        template: "<div ng-show='userPreferenceOptions.sortInfo.length > 0 && userPreferenceOptions.selectedType == \"Sort\"' class=' app-float-left'>" +
            "       <div class='applied-filter-parent app-float-left pl-group-parent fltr-applied' ng-repeat='sInfo in userPreferenceOptions.sortInfo'>" +

            "           <div ng-show='!sInfo.activeMode' ng-click='sInfo.activeMode=true;userPreferenceOptions.__apply__=true' class='app-float-left pl-user-preference-widget filter-max-width'>" +
            "               <span ng-bind='sInfo.label' title='{{sInfo.label}}' pl-sort-drag ng-controller='plUserPreferenceController'></span>" +
            "               <span ng-show='sInfo.value==\"Asc\"' class='icon-caret-up'></span>" +
            "               <span ng-show='sInfo.value==\"Dsc\"' class='icon-caret-right-down'></span>" +
            "           </div>" +

            "           <div ng-show='sInfo.activeMode' class='app-float-left pl-sort-template'>" +
            "               <span class='app-float-left app-padding-right-five-px' ng-bind-template='{{sInfo.label}} : '></span>" +
            "               <span class='app-float-left'>" +
            "                   <input type='radio' value='Asc' ng-model='sInfo.value' style='margin:6px 5px 0 0;'/>" +
            "               </span>" +
            "               <span class='app-float-left app-padding-right-five-px'>Asc</span>" +
            "               <span class='app-float-left '>" +
            "                   <input type='radio' value='Dsc' ng-model='sInfo.value' style='margin:6px 5px 0 0'/>" +
            "               </span>" +
            "               <span class='app-float-left app-padding-right-five-px'>Dsc</span>" +
            "           </div>" +
            "           <div class='app-float-right app-cursor-pointer pl-theme-background pl-cross-filter show-on-hover' ng-click='removeGroupColumnFromSortInfo(sInfo, true)'>" +
            "               <div class='pl-remove-filter' ><i class=\"icon-remove\"></i></div>" +
            "           </div>" +
            "           <div class='app-float-right app-cursor-pointer pl-theme-background pl-cross-filter' ng-if='sInfo.activeMode' ng-click='removeGroupColumnFromSortInfo(sInfo, true)'>" +
            "               <div class='pl-remove-filter' ><i class=\"icon-remove\"></i></div>" +
            "           </div>" +
            "       </div>" +
            "</div>"
    };
}
]);

pl.directive('plSortDrag', ["$compile" , function ($compile) {
    return{
        restrict: 'A',
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    $scope.dragElement($scope, iElement, $scope.sInfo, 'sortInfo');
                }
            }
        }
    }
}]);


