/***** move to app-component.js to generate minified version for before commit*******/
var pl = (pl === undefined) ? angular.module('pl', [ 'ngRoute', 'ngCookies', 'ngAnimate', 'ngSanitize', 'mgcrea.ngStrap']) : pl;

var INDEX_OFFSET = 100;
/*************************************Controller********************************************************************/

pl.controller('pl-grid-controller', function ($scope, $compile, $timeout, $parse) {
    var gridUnwatcher = {};


    var gridStartTime = new Date();
    $timeout(function () {
        var gridEndTime = new Date();
        $scope.workbenchOptions.gridRenderTime = "Grid : " + (gridEndTime - gridStartTime);
    }, 0);


    if (!$scope.gridOptions.alertMessageOptions) {
        $scope.gridOptions.alertMessageOptions = {};
        gridUnwatcher.alertMessageOptions = $scope.$watch("gridOptions.alertMessageOptions.message", function (newMess) {
            if ($scope.gridOptions.alertMessageOptions && $scope.gridOptions.alertMessageOptions.message) {
                //open a popup here
                alert($scope.gridOptions.alertMessageOptions.title + "\n" + $scope.gridOptions.alertMessageOptions.message);
            }
        })
    }

    if (!$scope.gridOptions.warningOptions) {
        $scope.gridOptions.warningOptions = {};
        gridUnwatcher.warningOptions = $scope.$watch("gridOptions.warningOptions.warnings", function (newWarnings) {
            if ($scope.gridOptions.warningOptions && $scope.gridOptions.warningOptions.warnings && $scope.gridOptions.warningOptions.warnings.length > 0) {
                //open a popup here
                alert($scope.gridOptions.warningOptions.title + "\n" + JSON.stringify($scope.gridOptions.warningOptions.warnings));
            }
        })
    }
    gridUnwatcher.validations = $scope.$watch("gridOptions.sharedOptions.validations", function (validations) {
        if (angular.isDefined(validations)) {
            var renderedRows = $scope.gridOptions.renderedRows;
            for (var j = 0; j < renderedRows.length; j++) {
                var row = renderedRows[j];
                var validationIndex = Utility.isExists(validations, row.entity, "_id");
                if (validationIndex === undefined) {
                    delete row.validations;
                } else {
                    row.validations = validations[validationIndex];
                }
            }
        }
    })

    $scope.dragDivVisibility = false;
    $scope.close = function () {
        $scope.gridOptions.sharedOptions.closed = true;
    };
    $scope.getDataMappingKey = function (entity, dataModel) {
        if (entity === undefined || dataModel === undefined) {
            return;
        }

        if (entity._id && dataModel.getKeyMapping()) {
            return Utility.getDataMappingKey(entity, dataModel.getKeyMapping());
        }
    };
    $scope.delete = function () {
        try {


            var rowsToDelete = [];
            for (var i = $scope.gridOptions.renderedRows.length - 1; i >= 0; i--) {
                if ($scope.gridOptions.renderedRows[i].__selected__) {
                    var dataRowIndex = $scope.getDataMappingKey($scope.gridOptions.renderedRows[i].entity, $scope.gridOptions.dataModel);
                    rowsToDelete.push(dataRowIndex);
                    $scope.gridOptions.renderedRows.splice(i, 1);
                }
            }
            if (rowsToDelete.length == 0) {
                $scope.gridOptions.shortMessageOptions.msg = "No row found for delete.";
                return;
            }
            $scope.gridOptions.sharedOptions.saveOptions.editMode = true;
            $scope.gridOptions.dataModel.delete(rowsToDelete).then(
                function () {
                    if ($scope.gridOptions.sharedOptions.pageOptions) {
                        if ($scope.gridOptions.sharedOptions.pageOptions.fetchCount) {
                            $scope.gridOptions.sharedOptions.pageOptions.count = $scope.gridOptions.sharedOptions.pageOptions.count - rowsToDelete.length;
                        }
                        if ($scope.gridOptions.renderedRows.length > 0) {
                            $scope.gridOptions.sharedOptions.pageOptions.label = '1-' + $scope.gridOptions.renderedRows.length;
                        } else {
                            $scope.gridOptions.sharedOptions.pageOptions.label = '0-0';
                        }
                    }
                    $scope.gridOptions.shortMessageOptions.msg = rowsToDelete.length + " row(s) deleted. Press Save to persist or Cancel to discard the changes";
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }).fail(function (err) {
                    var title = "delete in pl.grid";
                    var message = "Error in delete>>>" + err + "\n" + err.stack;
                    $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                });
        } catch (e) {
            var title = "delete in pl.grid";
            var message = "Error in delete >>>" + e + "\n" + e.stack;
            $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
        }
    }
    $scope.insert = function ($event, insertMode) {
        try {
            if ($event) {
                $event.preventDefault();
                $event.stopPropagation();
            }
            if ((!insertMode) && $scope.gridOptions.sharedOptions.insertInfo) {
                insertMode = $scope.gridOptions.sharedOptions.insertInfo.insertMode;
            }

            if ((!insertMode || insertMode == "form" )) {
                $scope.gridOptions.sharedOptions.insertInfo.insert = {saveOptions: {editMode: true}, addNewRow: true, deAttached: true};
                return;
            }

            if ($scope.view.viewOptions.busyMessageOptions) {
                $scope.view.viewOptions.busyMessageOptions.msg = "Loading...";
            }
            $timeout(function () {
                $scope.gridOptions.dataModel.insert().then(
                    function (insertInfo) {
                        if (insertMode == "nestedForm") {
                            if ($scope.gridOptions.rowActions && $scope.gridOptions.rowActions.length > 0 && $scope.gridOptions.rowActions[0].type == "detail") {
                                $scope.gridOptions.sharedOptions.saveOptions.editMode = true;
                                $scope.gridOptions.rowActions[0].nestedForm = true;
                                $scope.rowActionOptionClick(0);
                            }
                        }
                        if ($scope.view.viewOptions.busyMessageOptions) {
                            delete $scope.view.viewOptions.busyMessageOptions.msg;
                        }
                        $scope.gridOptions.sharedOptions.saveOptions.editMode = true;
                        if ($scope.gridOptions.parentSharedOptions) {
                            $scope.gridOptions.parentSharedOptions.editMode = true;
                        }
                        $scope.setCurrentRow(insertInfo.entity);
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }

                    }).fail(function (err) {
                        $scope.gridOptions.save = false;
                        var title = "insert in pl.grid";
                        var message = "Error in insert>>>>" + err + "\n" + err.stack;
                        $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    });
            }, 0)
        } catch (err) {
            $scope.gridOptions.save = false;
            var title = "Insert in pl.grid";
            var message = "Error: >>>>> " + err + "\n" + err.stack;
            $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }

    }

    $scope.ftsSearch = function (val) {
        try {
            $scope.gridOptions.dataModel.setFts(val);
            $scope.refresh();
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.nestedTablelabelClick = function (row, col) {
        try {
            if (col) {
                $scope.setCurrentRow(row.entity);
                var view = $scope.getNestedView(col, $scope.gridOptions.sharedOptions);
                view.viewOptions.closeViewIndex = $scope.view.viewOptions.viewIndex + 1;
                view.viewOptions.close = true;
                view.viewOptions.viewResize = true;
                view.viewOptions.hideAccordion = true;
                $scope[$scope.view.viewOptions.openV](view)
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.next = function () {
        $scope.gridOptions.sharedOptions.pageOptions.cursor = $scope.gridOptions.sharedOptions.pageOptions.cursor + $scope.gridOptions.sharedOptions.pageOptions.pageSize;
    }
    $scope.previous = function () {
        $scope.gridOptions.sharedOptions.pageOptions.cursor = $scope.gridOptions.sharedOptions.pageOptions.cursor - $scope.gridOptions.sharedOptions.pageOptions.pageSize;
    }
    $scope.onSelectionChange = function (row) {
        try {
            if ($scope.gridOptions.dataModel.setSelectedRow) {
                $scope.gridOptions.dataModel.setSelectedRow(row.entity, row.__selected__);
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.refresh = function () {
        if ($scope.gridOptions.onRefresh) {
            return $scope[$scope.gridOptions.onRefresh]();
        }
    }
    $scope.rowActionOptionClick = function (newRownActionIndex, rowAction) {
        try {
            if (rowAction) {
                if (rowAction.type == 'update') {
                    $scope.update();
                    return;
                } else if (rowAction.type == 'delete') {
                    $scope.delete();
                    return;
                }
            }
            $scope.gridOptions.sharedOptions.selectedRowAction = newRownActionIndex;
            $scope.gridOptions.sharedOptions.currentRowChanged = undefined;  //for the first time when child view or detail open, currentRowChanged watch should not fire
            $scope.gridOptions.sharedOptions.selectedRowActionChanged = !$scope.gridOptions.sharedOptions.selectedRowActionChanged;
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.multiRowActionOptionClick = function (newRownActionIndex, $event) {
        try {
            var multiRowAction = $scope.gridOptions.multiRowActions[newRownActionIndex];
            var clone = angular.copy(multiRowAction);
            clone.sharedOptions = $scope.gridOptions.sharedOptions;
            if (clone.onClick) {
                $scope[clone.onClick](clone, $event);
            } else {
                var title = "multiRowActionOptionClick in pl.grid";
                var message = "No onclick defined in " + JSON.stringify(multiRowAction);
                $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.setPrimaryFieldValue = function (rowData) {
        try {
            if (rowData && $scope.gridOptions.sharedOptions && $scope.gridOptions.sharedOptions.primaryField) {
                var field = $scope.gridOptions.sharedOptions.primaryField;
                $scope.gridOptions.sharedOptions.primaryFieldValue = $scope.gridOptions.sharedOptions.primaryFieldValue || {};
                $scope.gridOptions.sharedOptions.primaryFieldValue.label = rowData[field];
                for (var i = 0; i < $scope.gridOptions.gridColumns.length; i++) {
                    var col = $scope.gridOptions.gridColumns[i];
                    if (col.field == $scope.gridOptions.sharedOptions.primaryField && col.displayField && $scope.gridOptions.sharedOptions.primaryFieldValue.label) {
                        $scope.gridOptions.sharedOptions.primaryFieldValue.label = $scope.gridOptions.sharedOptions.primaryFieldValue.label[col.displayField];
                        break;
                    }
                }
            }
        }
        catch (e) {
            var title = "plGrid in pl.grid";
            var message = 'Error in setPrimaryFieldValue >>> ' + e + '\n' + e.stack;
            $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
        }
    }

    //in case of saving confirm we get warning options error, which display proceed to save , on click of this we are calling this call back function, which recall the same saving method -- Rajit garg 27-mar-15
    var confirmFunction = function () {
        var options = {"confirmUserWarning": true};
        if ($scope.view.viewOptions.saveType === "save") {
            $scope.save(options);
        }
    };

    $scope.view.viewOptions.confirmFunction = confirmFunction;

    $scope.save = function (options) {
        try {
            $scope.view.viewOptions.saveType = "save";
            options = options || {};
            options.savingSource = "grid";
            options.$parse = $parse;
            $scope.gridOptions.dataModel.save(options).then(
                function () {
                    $scope.refresh();
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                })
        } catch (e) {
            var title = "save in pl.grid";
            var message = e + "\n" + e.stack;
            $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
        }
    }

    $scope.onFkClick = function (row, column) {
        try {
            if (row && row.entity && column && column.referredView && column.referredWhen) {
                var needToResolve = true;
                var resolvedValue = false;
                if (column.referredWhen == true || column.referredWhen == "true") {
                    needToResolve = false;
                    resolvedValue = true;
                }
                if (needToResolve) {
                    var getter = $parse(column.referredWhen);
                    var context = {row: row};
                    resolvedValue = getter(context);
                }
                if (!resolvedValue) {
                    return;
                }
                var field = column.field;
                $scope.setCurrentRow(row.entity);
                $scope.setPrimaryFieldValue(row.entity);
                $scope.gridOptions.sharedOptions.referredView = {field: field, referredView: column.referredView, currentRow: row.entity};
                if (column._id) {
                    $scope.gridOptions.sharedOptions.referredView.sourceid = column._id;
                }
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

    $scope.openFieldActionPopup = function ($event, row, col) {
        /*code to open fieldAction popup if fieldActions is more 1 else call onFieldActionPopupClick method*/
        try {
            if (!col || !$scope.gridOptions.fieldActions || !$scope.gridOptions.fieldActions[col.field] || $scope.gridOptions.fieldActions[col.field].length == 0) {
                return;
            }
            if ($scope.gridOptions.fieldActions[col.field].length == 1) {
                $scope.onFieldActionPopupClick(row, col, 0);
            } else {
                var editHeaderOptionsTemplate = '<div>' +
                    '                               <div ng-repeat="fieldAction in gridOptions.fieldActions[col.field]" class="app-row-action app-cursor-pointer app-padding-five-px app-white-space-nowrap" ng-click="onFieldActionPopupClick(row, col, $index)">' +
                    '                                   <span class="app-padding-ten-px" ng-bind="fieldAction.label"></span>' +
                    '                               </div>' +
                    '                           </div>';
                var popupScope = $scope.$new();
                popupScope.col = col;
                popupScope.row = row;
                var p = new Popup({
                    autoHide: true,
                    deffered: true,
                    escEnabled: true,
                    hideOnClick: true,
                    html: $compile(editHeaderOptionsTemplate)(popupScope),
                    scope: popupScope,
                    element: $event.target
                });
                p.showPopup();
            }

        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    };

    $scope.onFieldActionPopupClick = function (row, col, index) {
        /*code to handle fieldActions click*/
        try {
            if (!$scope.gridOptions.fieldActions || !$scope.gridOptions.fieldActions[col.field] || !$scope.gridOptions.fieldActions[col.field][index]) {
                return;
            }
            var needToResolve = true;
            var resolvedValue = false;
            if (col.actionWhen == true || col.actionWhen == "true") {
                needToResolve = false;
                resolvedValue = true;
            }
            if (needToResolve) {
                var getter = $parse(col.actionWhen);
                var context = {row: row};
                resolvedValue = getter(context);
            }
            if (!resolvedValue) {
                return;
            }
            $scope.setCurrentRow(row.entity);
            $scope.gridOptions.sharedOptions.selectedFieldAction = $scope.gridOptions.fieldActions[col.field][index];
            $scope.gridOptions.sharedOptions.selectedFieldActionChanged = !$scope.gridOptions.sharedOptions.selectedFieldActionChanged;
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    };

    $scope.update = function () {
        $scope.gridOptions.openUpdateView = !$scope.gridOptions.openUpdateView;
    }

    $scope.resize = function (direction) {
        try {
            if ($scope.gridOptions.resizeV && $scope.gridOptions.sharedOptions && $scope.gridOptions.sharedOptions.resizable != false) {
                $scope[$scope.gridOptions.resizeV]($scope.gridOptions.viewIndex, direction);
            }
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }
    if (!$scope.gridOptions.popup && $scope.gridOptions.parentSharedOptions && ($scope.gridOptions.sharedOptions.viewPosition == 'left' || $scope.gridOptions.sharedOptions.viewPosition == 'full')) {
        $scope.resize('left');
    }

    $scope.$on('$destroy', function () {
        if (gridUnwatcher) {
            for (var key in gridUnwatcher) {
                gridUnwatcher[key]();
            }
        }
    });
});

pl.directive("plGrid", ["$compile", "$timeout", function ($compile, $timeout) {
    'use strict';
    return {
        restrict: "A",
        scope: false,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    var gridUnwatcher = {};

                    function dataWatcher(data) {
//                        $scope.populateRenderedRows(data);
                        if ($scope.gridOptions.dataModel.populateKeyMapping) {
                            $scope.gridOptions.dataModel.populateKeyMapping();
                        }

                        $scope.repopulateRenderedRows(data);
                    }

                    $scope.columnReOrdering = function (srcIndex, targetIndex) {
                        var srcColumn = $scope.gridOptions.gridColumns[srcIndex];
                        var targetColumn = $scope.gridOptions.gridColumns[targetIndex];
                        var changes = Util.changeIndex($scope.gridOptions.gridColumns, $scope.gridOptions.colSequenceField, srcIndex, targetIndex)
                        $scope.gridOptions.gridColumns.splice(srcIndex, 1);
                        $scope.gridOptions.gridColumns.splice(targetIndex, 0, srcColumn);
                        return changes;

                    };

                    $scope.changeCurrentRow = function (row, renderedRowIndex) {
                        try {
                            if (row.groupData || row.aggregateRow) {
                                return;
                            }
                            if ($scope.gridOptions.renderedRows[renderedRowIndex]) {
                                $scope.gridOptions.renderedRowIndex = renderedRowIndex;
                                $scope.setPrimaryFieldValue($scope.gridOptions.renderedRows[renderedRowIndex].entity);
                                $scope.gridOptions.currentRow = row.entity;
                                $scope.gridOptions.currentRowChanged = !$scope.gridOptions.currentRowChanged;
                            } else if ($scope.gridOptions.provideParentParameter) {//this work is done when there is no rendered rows in left dashboard view and we have to load right dashboard view---case for notifying other dashboard view on click of one dashboard view--Ritesh Bansal
                                $scope.gridOptions.currentRowChanged = !$scope.gridOptions.currentRowChanged;
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.editRowHeaderAction = function ($event) {
                        try {
                            var editHeaderOptionsTemplate = '<div class="pl-header-actions-popup" >' +
                                '                               <div ng-repeat="col in gridOptions.gridColumns" class="app-row-action app-cursor-pointer app-padding-five-px" ng-if="col.label" >' +
                                '                               <input checked type="checkbox" /><span class="app-padding-ten-px" ng-bind="col.label"></span>' +
                                '                           </div>';
                            var popupScope = $scope.$new();
                            var p = new Popup({
                                autoHide: true,
                                deffered: true,
                                escEnabled: true,
                                hideOnClick: false,
                                html: $compile(editHeaderOptionsTemplate)(popupScope),
                                scope: popupScope,
                                element: $event.target
                            });
                            p.showPopup();
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.editRowAction = function (row) {
                        try {
                            row.editMode = !row.editMode;
                            $scope.gridOptions.sharedOptions.saveOptions.editMode = true;
                            if ($scope.gridOptions.parentSharedOptions) {
                                $scope.gridOptions.parentSharedOptions.editMode = true;
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.getSrcRowIndex = function () {
                        return $scope.srcRowIndex;
                    };
                    $scope.getRowDragable = function () {
                        return $scope.isRowDragable;
                    }
                    $scope.groupTemplate = function (data, renderedRow, parentGroup) {

                        try {
                            var groupLevel = 0;
                            var nextLevel = 0;
                            if (angular.isDefined(parentGroup)) {
                                groupLevel = parentGroup + 1;
                                nextLevel = groupLevel;
                            } else {
                                nextLevel = 1;
                            }

                            for (var i = 0; i < data.length; i++) {
                                var depth = groupLevel;
                                if (data[i] && angular.isDefined(data[i].__groupLevel)) {
                                    groupLevel = data[i].__groupLevel;
                                    if (angular.isDefined(data[i].__depth)) {
                                        nextLevel = data[i].__depth + 1;
                                        depth = data[i].__depth;
                                    }
                                }
                                var obj = {};
                                obj.__hidden__ = true;
                                obj.entity = data[i];

                                obj.level = nextLevel;

                                if ($scope.gridOptions.groupInfo && $scope.gridOptions.groupInfo[groupLevel]) {
                                    obj.__group__ = depth;
                                    if (angular.isDefined(data[i])) {
                                        var groupColumn = $scope.gridOptions.groupInfo[groupLevel];
                                        var groupCellTemplate = "";
                                        var colField = undefined;
//                                    for (var key in $scope.gridOptions.userPreferenceOptions.queryGroups) {
//                                        if (key == "_id") {
//                                            continue;
//                                        }
//                                        for (var j = 0; j < $scope.gridOptions.columns.length; j++) {
//                                            if (key == $scope.gridOptions.columns[j].field) {
//                                                colField = $scope.gridOptions.columns[j].label || '';
//                                            }
//
//                                        }
//                                        groupCellTemplate += "<span ng-show='row.entity." + key + "'>" + colField + ":&nbsp;<span>{{row.entity." + key + "}}</span>&nbsp;</span>"
//                                    }

                                        var fieldToBind = "row.entity." + groupColumn.field;
                                        if (groupColumn.displayField) {
                                            fieldToBind += "." + groupColumn.displayField;
                                        }
                                        groupCellTemplate += "<span style='font-weight: normal; '>" + groupColumn.label + "</span>: <span >{{" + fieldToBind + "}}</span> ("
                                        if ($scope.gridOptions.aggregateColumns) {
                                            for (var j = 0; j < $scope.gridOptions.aggregateColumns.length; j++) {
                                                var aggColumn = $scope.gridOptions.aggregateColumns[j];
                                                if (aggColumn.cellTemplate) {
                                                    groupCellTemplate += "<span style='font-weight: normal; '> " + aggColumn.label + ": </span>" + aggColumn.cellTemplate;
                                                }

                                            }
                                        }
                                        groupCellTemplate += ' )';

                                        obj.groupData = "<div ng-style='{\"margin-left\":row.__group__ * 32+\"px\"}' class='icon-plus pl-group-toggle-box' pl-grid-group style='padding-right: 3px;'  ng-click='toggleTree(row,$parent.$index," + groupLevel + " )' ></div>" +
                                            "<div class='app-white-space-nowrap group-template' ng-class='{\"app-font-weight-bold\": row.__group__ == 0}' >" +
                                            groupCellTemplate +
                                            "</div>";
                                        renderedRow.push(obj);
                                    }
                                } else if (data[i].children && data[i].children.length > 0) {
                                    obj.__hidden__ = false;
//                                obj.groupData = '<div ng-click="toggleTreeForChild(row, $parent.$index)" ng-show="row.entity.children" ><div pl-grid-group class="icon-plus pl-group-toggle-box">&nbsp;</div></div>';
                                    renderedRow.push(obj);
                                } else {
                                    renderedRow.push(obj);
                                }

                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.onViewControlOptionClick = function (option) {
                        try {
                            if ($scope.gridOptions.onViewControl) {
                                $scope[$scope.gridOptions.onViewControl](option)
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    var checkChildrenDataForRecursive = function (data, renderedRow, alias) {
                        if (data && data.length > 0) {
                            for (var i = 0; i < data.length; i++) {
                                if (data[i] === renderedRow) {
                                    return true;
                                }
                                if (data[i][alias]) {
                                    var found = checkChildrenDataForRecursive(data[i][alias], renderedRow, alias);
                                    if (found) {
                                        return true;
                                    }
                                }
                            }
                        }
                    }

                    var checkDataForDeleteRow = function (data, renderedRows) {
                        if (!renderedRows) {
                            return;
                        }
                        var dataCount = data ? data.length : 0;
                        var checkRecursive = false;
                        var alias = undefined;
                        if ($scope.gridOptions.dataModel && $scope.gridOptions.dataModel.metadata && $scope.gridOptions.dataModel.metadata.transformRecursionToLinear && $scope.gridOptions.dataModel.keyMapping) {
                            checkRecursive = true;
                            alias = "children";
                            if ($scope.gridOptions.dataModel.query && $scope.gridOptions.dataModel.query.$recursion && $scope.gridOptions.dataModel.query.$recursion.$alias) {
                                alias = $scope.gridOptions.dataModel.query.$recursion.$alias;
                            }
                        }
                        for (var i = renderedRows.length - 1; i >= 0; i--) {
                            var rowInData = false;

                            if (checkRecursive) {
                                rowInData = checkChildrenDataForRecursive(data, renderedRows[i].entity, alias)
                            } else {
                                for (var j = 0; j < dataCount; j++) {
                                    if (renderedRows[i].entity === data[j]) {
                                        rowInData = true;
                                        break;
                                    }
                                }
                            }

                            if (!rowInData) {
//                                renderedRows.splice(i, 1);    // comment this line as we repopulateRenderedRows incase of delete.
                                return true;                    //return true and repopulateRenderedRows to keep dataModel index and dataRowIndex sync.
                            }
                        }
                    }

                    var checkDataForInsertRow = function (data, renderedRows) {
                        if (!data) {
                            return;
                        }
                        var dataRowIndex = undefined;
                        for (var i = 0; i < data.length; i++) {
                            var dataInRows = false;
                            for (var j = 0; j < renderedRows.length; j++) {
                                if (data[i] === renderedRows[j].entity) {
                                    dataInRows = true;
                                    break;
                                }
                            }
                            if (!dataInRows) {

                                if (data[i].__insert__) {
                                    renderedRows.splice(0, 0, {entity: data[i], editMode: true});
                                } else {
                                    renderedRows.push({entity: data[i]});
                                }
                            }
                        }
                    }

                    $scope.repopulateRenderedRows = function (data) {
                        try {
                            $scope.gridOptions.renderedRows = $scope.gridOptions.renderedRows || [];
                            var renderedRows = $scope.gridOptions.renderedRows;
                            var isRenderedRowRequired = checkDataForDeleteRow(data, renderedRows);
                            if (isRenderedRowRequired) {
                                $scope.populateRenderedRows(data);
                            } else {
                                checkDataForInsertRow(data, renderedRows);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    // it is used for showing columns in nested table on the basis of when value and value of gridOptions.reConfigureColumns is changed form pl-view.js
                    gridUnwatcher.reConfigureColumns = $scope.$watch("gridOptions.reConfigureColumns", function (newValue, oldValue) {
                        if (angular.isDefined(newValue)) {
                            $scope.populateColumns();
                        }
                    })

                    $scope.populateRenderedRows = function (data) {
                        try {
                            if ($scope.gridOptions.repopulateColumn) {
                                $scope.populateColumns();
                                $scope.gridOptions.repopulateColumn = false;
                            }
                            $scope.gridOptions.renderedRows = [];
                            var dataRowIndex = undefined;
                            if (data && data.length > 0) {
                                if ($scope.gridOptions.groupInfo && $scope.gridOptions.groupInfo.length > 0) {
                                    if (!angular.isDefined($scope.gridOptions.userPreferenceOptions.queryGroups)) {
                                        $scope.gridOptions.userPreferenceOptions.queryGroups = $scope.gridOptions.groupInfo[0];
                                    }
                                    $scope.groupTemplate(data, $scope.gridOptions.renderedRows, undefined);
                                } else {
                                    for (var i = 0; i < data.length; i++) {

                                        if (data[i].__insert__) {
                                            $scope.gridOptions.renderedRows.splice(0, 0, {entity: data[i], editMode: true});
                                        } else {
                                            $scope.gridOptions.renderedRows.push({entity: data[i], style: $scope.gridOptions.qViewStyle});
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.openRowActionPopUp = function ($event, row) {
                        try {
                            var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' >" +
                                "   <div ng-repeat='rowAction in gridOptions.rowActions' >" +
                                "       <div ng-if='!rowAction.when' ng-bind='rowAction.label' class='app-row-action app-cursor-pointer app-padding-five-px' ng-click='rowActionOptionClick($index, rowAction)'></div>" +
                                "       <div ng-if='rowAction.when' ng-show='{{rowAction.when}} && {{!rowAction.hide}}' ng-bind='rowAction.label' class='app-row-action app-cursor-pointer app-padding-five-px' ng-click='rowActionOptionClick($index, rowAction)'></div>" +
                                "   </div>" +
                                "</div>";
                            var popupScope = $scope.$new();
                            popupScope.row = row;
                            var p = new Popup({
                                autoHide: true,
                                deffered: true,
                                escEnabled: true,
                                hideOnClick: true,
                                html: $compile(optionsHtml)(popupScope),
                                position: 'onPageClick',
                                scope: popupScope,
                                element: $event.target,
                                event: $event
                            });
                            p.showPopup();
                        } catch (err) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(err);
                            }
                        }
                    };

                    $scope.rowActionPopUp = function ($event, row) {
                        try {
                            if ($scope.gridOptions.resolveActionWithRow) {
                                row.loadingImage = true;
                                return $scope.resolveActions(row.entity, $scope.gridOptions.rowActions).then(function () {
                                    row.loadingImage = false;
                                    $scope.openRowActionPopUp($event, row);
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }).fail(function (err) {
                                    row.loadingImage = false;
                                    throw err;
                                })
                            } else {
                                $scope.openRowActionPopUp($event, row);
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    };

                    $scope.multiRowActionPopUp = function ($event) {
                        try {
                            var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' >" +
                                "<div ng-repeat='action in gridOptions.multiRowActions' class='app-row-action app-cursor-pointer' ng-show='{{action.when}}'>" +
                                "   <div ng-if='action.href' class='app-padding-five-px' ><a href='{{action.href}}' target='_blank' ng-bind='action.label' style='text-decoration: none; color: #58595b;'></a></div>" +
                                "   <div ng-if='!action.href' class='app-padding-five-px' ng-click='multiRowActionOptionClick($index, $event)' ng-bind='action.label'></div>" +
                                "</div>" +
                                "</div>";
                            var popupScope = $scope.$new();
                            var p = new Popup({
                                autoHide: true,
                                deffered: true,
                                escEnabled: true,
                                hideOnClick: true,
                                html: $compile(optionsHtml)(popupScope),
                                scope: popupScope,
                                element: $event.target
                            });
                            p.showPopup();
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.setEditMode = function (editMode) {
                        $scope.gridOptions.sharedOptions.saveOptions.editMode = editMode;
                    };
                    $scope.populateColumns = function () {
                        try {
                            var columns = $scope.gridOptions.columns;
                            var gridColumns = [];
                            var showSelectionCheckBox = $scope.gridOptions.showSelectionCheckbox;
                            //when groupby is applied to data than we don't populate row actions
//                            if ($scope.gridOptions.groupInfo && $scope.gridOptions.groupInfo.length > 0) {
//                                showSelectionCheckBox = false;
                            //                            }
                            if ($scope.gridOptions.checkboxSelection == false) {
                                showSelectionCheckBox = false;
                            }
                            if (($scope.gridOptions.groupInfo && $scope.gridOptions.groupInfo.length > 0) || ($scope.gridOptions.$recursion)) {
                                if ($scope.gridOptions.$recursion) {
//                                groupInfo.cellTemplate = '<div ng-click="toggleTreeForChild(row, $parent.$index)" ng-show="row.entity.children" ><div pl-grid-group class="icon-plus pl-group-toggle-box">&nbsp;</div></div>';
                                }
                                for (var i = 0; i < $scope.gridOptions.groupInfo.length; i++) {
                                    var groupInfo = {visibilityGrid: true, style: {width: "20px", height: "28px"}, __systemcolumn__: true};
                                    if (i == 0) {
                                        groupInfo.$group = true
                                    }
                                    gridColumns.push(groupInfo);
                                }
                            }
                            if (showSelectionCheckBox) {
                                var selectionCheckboxDef = {"style": {"width": "88px", height: "39px", padding: '3px 20px'}, __systemcolumn__: true};
                                var cellTemplate = "<div >" +
                                    "                  <div class='pl-row-action-wrapper'>";
                                if ($scope.gridOptions.multiRowActions) {
                                    cellTemplate += "<div class='pl-row-action-left'>" +
                                        "               <input class='app-margin-left-3px' tabindex='-1' type='checkbox' ng-model='row.__selected__' ";
                                    if ($scope.gridOptions.onSelectionChange) {
                                        cellTemplate += " ng-change='" + $scope.gridOptions.onSelectionChange + "(row)' ";
                                    }
                                    cellTemplate += " /></div>" +
                                        "                   <div ng-click='rowActionPopUp($event,row)' class='app-cursor-pointer pl-row-action-right'>" +
                                        "                       <i class='icon-caret-down'></i> " +
                                        '                       <img src="../images/loading.gif" class="pl-loading-image" style="height: 16px;width:16px;right:34px;" ng-show="row.loadingImage">' +
                                        "                   </div>";
                                    if ($scope.gridOptions.edit) {
                                        cellTemplate += "<div ng-click='editRowAction(row)' ng-class='{\"pl-box-shadow\":row.editMode == true}  ' class='app-cursor-pointer pl-edit-row'>" +
                                            "                <span class='edit-row-icon'></span>" +
                                            "            </div>";
                                    }
                                    cellTemplate += "</div>" +
                                        "           </div>" +
                                        "          </div>";
                                } else {
                                    cellTemplate += "<input style='margin-left:3px;' tabindex='-1' type='checkbox' ng-model='row.__selected__' ";
                                    if ($scope.gridOptions.onSelectionChange) {
                                        cellTemplate += " ng-change='" + $scope.gridOptions.onSelectionChange + "(row)' ";
                                    }
                                    cellTemplate += " /></div></div>";
                                }

                                selectionCheckboxDef.cellTemplate = cellTemplate;
                                selectionCheckboxDef.headerCellTemplate = "<div class='pl-grid-composite-header'>" +
                                    "                                       <div class='pl-grid-composite-container'>" +
                                    "                                           <div class='pl-grid-composite-header-left'><input tabindex='-1' type='checkbox' style=' margin: 7px 8px;' ng-model='gridOptions.__selected__' /></div>" +
                                    '                                           <div class="pl-grid-composite-header-middle" ng-click="multiRowActionPopUp($event)">' +
                                    '                                               <i class="icon-caret-down" style="height: 13px;"></i>' +
                                    '                                           </div>';
                                if ($scope.gridOptions.quickInsert) {
                                    selectionCheckboxDef.headerCellTemplate += "<div ng-click='insert($event, \"grid\")' title='Insert' class='pl-edit-row-header'>" +
                                        "                                          <span style='padding-left: 9px; display: block;'>" +
                                        "                                               <i class='icon-plus app-float-left' style='line-height: 28px'></i>" +
                                        "                                          </span>" +
                                        "                                      </div>";
                                }
                                selectionCheckboxDef.headerCellTemplate += "</div></div>";
                                gridColumns.push(selectionCheckboxDef);
                            }

                            if ($scope.gridOptions.rowDragable) {
                                var rowDragableDef = {__systemcolumn__: true};
                                rowDragableDef.style = {"width": "20px", height: "20px"};
                                rowDragableDef.dragRow = true;
                                rowDragableDef.cellTemplate = "<div class='pl-row-drag app-serial-number' ng-bind='$parent.$index+1'></div>";
                                gridColumns.push(rowDragableDef);
                            }

                            if ($scope.gridOptions.rowActions && $scope.gridOptions.rowActions.length > 0 && !$scope.gridOptions.multiRowActions) {
                                var rowActionDef = {__systemcolumn__: true};
                                rowActionDef.style = {"width": "20px", height: "20px"};
                                rowActionDef.cellTemplate = "<div style='width:20px;height:20px;' ng-click='rowActionPopUp($event,row)' class='app-row-action-arrow app-cursor-pointer'></div>";
                                gridColumns.push(rowActionDef);       //TODO: need to add this on conditional base
                            }
                            var colCount = columns ? columns.length : 0;


                            var autoWidthColumnEnabledAtFieldLevel = false;
                            for (var i = 0; i < colCount; i++) {
                                if (columns[i].autoWidthColumn) {
                                    delete columns[i].width;
                                    $scope.gridOptions.autoWidthColumn = autoWidthColumnEnabledAtFieldLevel = true;
                                }
                            }

                            var colCount = columns ? columns.length : 0;
                            if ($scope.gridOptions.autoWidthColumn) {
                                $scope.gridOptions.autoWidthColumn = false;
                                for (var i = 0; i < colCount; i++) {
                                    if (!columns[i].width || columns[i].width == 0 || columns[i].width == "0px" || columns[i].width == undefined || (columns[i].style && columns[i].style.width == undefined)) {
                                        delete columns[i].width;
                                        if (columns[i].style) {
                                            delete columns[i].style.width;
                                        }
                                        $scope.gridOptions.autoWidthColumn = true;
                                        break;
                                    }
                                }
                            }
                            for (var i = 0; i < colCount; i++) {
                                var column = columns[i];
                                if (column.visibilityGrid === false && column.visibility === false) {     //for handling of when condition
                                    continue;
                                }
                                if (column.when && column.when == 'false') {
                                    continue;
                                }
                                column.headerCellTemplate = column.headerCellTemplate || "<div ng-bind='col.label' title='{{col.label}}' class='text-overflow' ng-class='{\"app-margin-right-20px\":col.sortable}'></div>";
                                column.editableCellTemplate = column.editableCellTemplate || "<input ng-model='row." + column.field + "' type='text'/>";
                                column.style = column.style || {};
                                column.tabindex = 0;
                                column.style.width = column.style.width || column.width;
                                var autoWidthEnable = autoWidthColumnEnabledAtFieldLevel ? column.autoWidthColumn : $scope.gridOptions.autoWidthColumn;
                                if (autoWidthEnable) {
                                    column.style.flex = '1';
                                    column.flexible = true;
                                } else if (column.style.width == undefined) {
                                    column.style.width = "200px";
                                }
                                column.style['padding-left'] = '10px';
                                column.style['max-width'] = column.style.width;
                                column.style['min-width'] = column.style.width;
                                column.style['white-space'] = column.style.wordWrap ? column.style.wordWrap : column.wordWrap ? 'normal' : 'nowrap';
                                column.freeze = false;
                                if (column.freeze) {
                                    if (typeof column.style.width == 'string') {
                                        $scope.gridOptions.freezeStyle.width += parseInt(column.style.width.substr(0, column.style.width.length - 2)) + 11;
                                    } else {
                                        $scope.gridOptions.freezeStyle.width += column.style.width + 11;
                                    }
                                    $scope.gridOptions.freezeCol.push(column);
                                }
                                gridColumns.push(column);
                                if ($scope.gridOptions.sortInfo && $scope.gridOptions.sortInfo.length > 0) {
                                    for (var j = 0; j < $scope.gridOptions.sortInfo.length; j++) {
                                        var sortInfo = $scope.gridOptions.sortInfo[j];
                                        if (sortInfo.field === column.field) {
                                            column.value = sortInfo.value;
                                        }
                                    }
                                }
                            }
                            if ($scope.gridOptions.freezeCol) {
                                $scope.gridOptions.freezeHeaderStyle = {
                                    'width': $scope.gridOptions.freezeStyle.width + 'px'
                                }
                                $scope.gridOptions.freezeStyle.width += 5;
                                $scope.gridOptions.freezeStyle.width += 'px';
                            }
                            if (!$scope.gridOptions.autoWidthColumn) {
                                var zeroWidthColumn = {"tabindex": -1, style: {"padding": "0px", "border-right": "none"}, __systemcolumn__: true};
                                gridColumns.push(zeroWidthColumn);
                            }
                            $scope.gridOptions.gridColumns = gridColumns;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.populateToolbar = function () {

                        try {
                            $scope.toolBarOptions = {};

                            $scope.gridOptions.userPreferenceOptions = $scope.gridOptions.userPreferenceOptions || {};
                            $scope.gridOptions.userPreferenceOptions.reload = false;
                            if ($scope.gridOptions.filterColumns && $scope.gridOptions.filterColumns.length > 0) {
                                $scope.gridOptions.userPreferenceOptions.filterColumns = $scope.gridOptions.filterColumns;
                                $scope.gridOptions.userPreferenceOptions.filterInfo = $scope.gridOptions.filterInfo;
                            }

                            if ($scope.gridOptions.sortColumns && $scope.gridOptions.sortColumns.length > 0) {
                                $scope.gridOptions.userPreferenceOptions.sortColumns = $scope.gridOptions.sortColumns;
                                $scope.gridOptions.userPreferenceOptions.sortInfo = $scope.gridOptions.sortInfo;
                            }

                            if ($scope.gridOptions.groupColumns && $scope.gridOptions.groupColumns.length > 0) {
                                $scope.gridOptions.userPreferenceOptions.groupColumns = $scope.gridOptions.groupColumns;
                                $scope.gridOptions.userPreferenceOptions.aggregateColumns = $scope.gridOptions.aggregateColumns;
                                $scope.gridOptions.userPreferenceOptions.groupInfo = $scope.gridOptions.groupInfo;
                            }
                            if ($scope.gridOptions.recursiveColumns && $scope.gridOptions.recursiveColumns.length > 0) {
                                $scope.gridOptions.userPreferenceOptions.recursiveColumns = $scope.gridOptions.recursiveColumns;
                                $scope.gridOptions.userPreferenceOptions.recursionInfo = $scope.gridOptions.recursionInfo;
                            }

                            if ($scope.gridOptions.lastSelectedInfo) {
                                $scope.gridOptions.userPreferenceOptions.selectedType = $scope.gridOptions.lastSelectedInfo;
                            } else if ($scope.gridOptions.filterInfo && $scope.gridOptions.filterInfo.length > 0) {    // TODO: need to change with gridOptions
                                $scope.gridOptions.userPreferenceOptions.selectedType = "Filter";
                            } else if ($scope.gridOptions.sortInfo && $scope.gridOptions.sortInfo.length > 0) {
                                $scope.gridOptions.userPreferenceOptions.selectedType = 'Sort';
                            } else if ($scope.gridOptions.groupInfo && $scope.gridOptions.groupInfo.length > 0) {
                                $scope.gridOptions.userPreferenceOptions.selectedType = 'Group';
                            }


                            $scope.toolBarOptions.bottom = {left: [], center: [], right: []};
                            $scope.toolBarOptions.top = {left: [], center: [], right: []};
                            $scope.toolBarOptions.header = {left: {}, center: [], right: []};
                            var showResizeControl = $scope.gridOptions.viewResize !== undefined ? $scope.gridOptions.viewResize : true;

                            if (showResizeControl && $scope.gridOptions.parentSharedOptions) {
                                $scope.toolBarOptions.header.center.push({template: "<div ng-click=\"resize('left')\" ng-hide='gridOptions.sharedOptions.viewPosition == \"full\" || gridOptions.sharedOptions.resizable' ng-class='{\"pl-transform-180\":gridOptions.sharedOptions.viewPosition != \"right\"}' class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-left\"></i></div>"});
                            }
                            if (!$scope.gridOptions.userPreferenceOptions.sortInfo && !$scope.gridOptions.userPreferenceOptions.filterInfo && !$scope.gridOptions.userPreferenceOptions.groupInfo) {
//                                $scope.gridOptions.addUserPreference = false;  /*dont set false as filter bar visible by default*/
                            }
                            if ($scope.gridOptions.addUserPreference) {
                                $scope.toolBarOptions.bottom.center.push({template: "<div ng-class='{\"pl-filter-background\":gridOptions.userPreferenceOptions.sortColumns || gridOptions.userPreferenceOptions.groupColumns  || gridOptions.userPreferenceOptions.filterColumns}' pl-user-preference='gridOptions.userPreferenceOptions'></div>"});
                            }

                            if ($scope.gridOptions.quickViewMenuGroup && $scope.gridOptions.quickViewMenuGroup.menus.length > 0) {
                                $scope.toolBarOptions.top.left.push({template: "<div pl-menu-group='gridOptions.quickViewMenuGroup' ></div>"});
                                $scope.toolBarOptions.header.left = $scope.gridOptions.quickViewMenuGroup;
                            }

                            if ($scope.gridOptions.showLabel) {
                                $scope.toolBarOptions.header.center.push({template: '<span ng-class=\'{"menu-align-margin":gridOptions.sharedOptions.viewPosition == \"full\" || gridOptions.sharedOptions.resizable}\' class="app-float-left pl-panel-label  app-padding-five-px app-font-size-sixteen-px app-font-weight-bold">' +
                                    '   <span  ng-bind="gridOptions.label"></span>' +
                                    '   <span ng-if="gridOptions.primaryFieldInfo && gridOptions.primaryFieldInfo.label">' +
                                    '       <span>(<span ng-bind="gridOptions.primaryFieldInfo.label"></span>)</span>' +
                                    '   </span>' +
                                    '</span>'});
                            }


                            if ($scope.gridOptions.ftsColumns && $scope.gridOptions.ftsColumns.length > 0) {
                                if ($scope.gridOptions.clientSearch) {
                                    $scope.gridOptions.clientSearchInfo = {};
                                }
                                $scope.gridOptions.ftsInfo = {columns: $scope.gridOptions.ftsColumns, onClick: "ftsSearch", clientSearchInfo: $scope.gridOptions.clientSearchInfo};
                                $scope.toolBarOptions.bottom.right.push({
                                    template: "<pl-fts data-info='gridOptions.ftsInfo' class='pl-sub-fts' ></pl-fts>"
                                });
                            }


                            $scope.saveCustomizationOptions = function ($event, template) {
                                try {
                                    if ($scope.gridOptions.admin) {
                                        var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' >" +
                                            "               <div  class='app-row-action app-cursor-pointer pl-popup-label app-float-left' ng-click='saveAdminCustomization(\"view\")' >View</div>" +
                                            "               <div  class='app-row-action app-cursor-pointer pl-popup-label app-float-left' ng-click='saveAdminCustomization(\"qview\")' >Qview</div>" +
                                            "               <div  class='app-row-action app-cursor-pointer pl-popup-label app-float-left' ng-click='saveAdminCustomization(\"collection\")' >For all view</div>" +
                                            "               <div  class='app-row-action app-cursor-pointer pl-popup-label app-float-left' ng-click='saveCustomization()' >Self</div>" +
                                            "           </div>";
                                        var popupScope = $scope.$new();
                                        var p = new Popup({
                                            autoHide: true,
                                            deffered: true,
                                            escEnabled: true,
                                            hideOnClick: true,
                                            html: $compile(optionsHtml)(popupScope),
                                            scope: popupScope,
                                            element: $event.target
                                        });
                                        p.showPopup();
                                    } else {
                                        $scope.saveCustomization();
                                    }
                                } catch (e) {
                                    var title = "saveCustomization in pl.grid";
                                    var message = 'Error in plGrid saveCustomization >>>>' + e + '\n' + e.stack;
                                    $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
                                }
                            }


                            if ($scope.gridOptions.navigation && (!$scope.gridOptions.$recursion)) {
                                $scope.toolBarOptions.header.right.push({template: '<div class="flex-box app-font-weight-bold app-navigation app-text-align-center">' +
                                    '   <div class="app-height-thirty-px app-float-left app-width-twenty-px app-cursor-pointer" ng-click="previous()" ng-show="gridOptions.sharedOptions.pageOptions.hasPrevious"><i class="icon-chevron-left"></i></div>' +
                                    '<div ng-bind="gridOptions.sharedOptions.pageOptions.label" class="app-float-left"></div>' +
                                    '   <div ng-show="gridOptions.sharedOptions.pageOptions.fetchCount" class="app-float-left">{{"&nbsp;of&nbsp;"+gridOptions.sharedOptions.pageOptions.count}}</div>' +
                                    '   <div class="app-height-thirty-px app-float-left app-width-twenty-px app-cursor-pointer" ng-click="next()" ng-show="gridOptions.sharedOptions.pageOptions.hasNext" ><i class="icon-chevron-right"></i></div>' +
                                    '</div>'});
//                            $scope.toolBarOptions.header.left.lHeaderClass = 'flex-1';

                            }

                            if ($scope.gridOptions.insert) {
                                $scope.toolBarOptions.top.right.push({template: '<div  ng-click="insert()" ng-show="!gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="btn-blue app-cursor-pointer responsive">Create</div>'});
                                $scope.toolBarOptions.header.right.push({template: '<div  ng-click="insert()" ng-show="!gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="btn-blue app-cursor-pointer">Create</div>'});
                            }

                            if ($scope.gridOptions.save) {
                                $scope.toolBarOptions.top.right.push({template: '<div ng-click="refresh()" ng-show="gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="pl-cancel-btn app-cursor-pointer ng-scope responsive">Cancel</div>'});
                                $scope.toolBarOptions.top.right.push({template: '<div ng-click="save()" ng-show="gridOptions.save && gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="btn-blue app-cursor-pointer responsive">Save</div>'});
                                $scope.toolBarOptions.header.right.push({template: '<div ng-click="refresh()" ng-show="gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="pl-cancel-btn app-cursor-pointer ng-scope">Cancel</div>'});
                                $scope.toolBarOptions.header.right.push({template: '<div ng-click="save()" ng-show="gridOptions.save && gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="btn-blue app-cursor-pointer">Save</div>'});
                            }

                            $scope.gridOptions.multiRowActions = [];
                            if ($scope.gridOptions.delete) {
//                            $scope.gridOptions.rowActions.push({label:"Delete", title:"Delete", type:'delete', rowActionIndex:$scope.gridOptions.rowActions.length});
                                $scope.gridOptions.multiRowActions.push({label: "Delete", title: "Delete", onClick: 'delete', when: true});
                            }

                            if ($scope.gridOptions.refresh) {
                                $scope.toolBarOptions.top.right.push({label: "Refresh", title: "Refresh", onClick: 'refresh()', image: '', actionClass: 'app-refresh-button app-bar-button'});
                            }


                            if ($scope.gridOptions.updateColumns && $scope.gridOptions.updateColumns.length > 0) {
//                            $scope.gridOptions.rowActions.push({label:"Update", title:"Update", type:'update', rowActionIndex:$scope.gridOptions.rowActions.length});
                                $scope.gridOptions.multiRowActions.push({label: "Update", title: "Update", onClick: 'update', when: true});
                            }

                            if ($scope.gridOptions.headerActions && $scope.gridOptions.headerActions.length > 0) {
                                for (var i = 0; i < $scope.gridOptions.headerActions.length; i++) {
//                                $scope.gridOptions.rowActions.push($scope.gridOptions.headerActions[i]);
//                                $scope.gridOptions.rowActions[$scope.gridOptions.rowActions.length - 1].rowActionIndex = $scope.gridOptions.rowActions.length;
                                    $scope.gridOptions.multiRowActions.push($scope.gridOptions.headerActions[i]);
                                }
                            }
//                        if ($scope.gridOptions.setFieldsVisibility && $scope.gridOptions.setFieldsVisibilityOptions) {
//                            var template = "<div pl-menu-group='gridOptions.setFieldsVisibilityOptions' ></div>";
//                            $scope.toolBarOptions.bottom.right.push({template:template});
//                        }

//                        if ($scope.gridOptions.ftsColumns && $scope.gridOptions.ftsColumns.length > 0) {
//                            $scope.gridOptions.ftsInfo = {columns:$scope.gridOptions.ftsColumns, onClick:"ftsSearch"};
//                            $scope.toolBarOptions.bottom.right.push({
//                                template:"<pl-fts data-info='gridOptions.ftsInfo' ></pl-fts>"
//                            });
//                        }

                            if ($scope.gridOptions.toolbarActions) {
                                var template = "<div pl-menu-group='gridOptions.toolbarActions' ></div>";
                                $scope.toolBarOptions.header.right.push({template: template});
                                var template = "<div ng-repeat='action in gridOptions.toolbarActions' class='inline' ng-click='viewHeaderAction(action)' >" +
                                    "               <span ng-if='!action.showLabel' ng-show='{{action.when}}' ng-class='action.class' class='inline' title='{{action.label}}' ></span>" +
                                    "               <span ng-if='action.showLabel' ng-show='{{action.when}}' class='pl-cancel-btn tlbr-action-label text-overflow' title='{{action.label}}' ng-bind='action.label'></span>" +
                                    "           </div>";
                                $scope.toolBarOptions.bottom.right.push({template: template});
                            }
                            if ($scope.gridOptions.saveCustomization) {
                                $scope.toolBarOptions.bottom.right.push({template: '<div title="Save Customization" ng-show="gridOptions.sharedOptions.saveCustomizationEnable" class="app-cursor-pointer pl-letter-spacing flex samll-gap">' +
                                    '<span ng-click="saveCustomizationOptions($event)" class="pl-header-actions save-icon"></span>' +
                                    '</span>' +
                                    '</div>'});
                                if ($scope.gridOptions.fieldCustomization) {
                                    $scope.toolBarOptions.bottom.right.push({template: "<div title='Show/hide columns' class='manage-cols app-float-right' ng-click='showColumns($event)'><i class='dot'></i><i class='dot'></i><i class='dot'></i></div>"});
                                }
                            }

                            if ($scope.gridOptions.viewControl && $scope.gridOptions.viewControlOptions) {
                                var template = "<div pl-menu-group='gridOptions.viewControlOptions' ></div>";
                                $scope.toolBarOptions.header.center.push({template: template});
                            }
                            if ($scope.gridOptions.popupResize) {
                                $scope.popupResize();
//                            $scope.toolBarOptions.header.right.push({template:'<div  ng-click="popupResize()" pl-toggle title="Resize" ng-show="!gridOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="btn-blue app-cursor-pointer popup-resize"></div>'});
                            }
                            if ($scope.gridOptions.close) {
                                $scope.toolBarOptions.top.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
                                $scope.toolBarOptions.header.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
                            }
                            if (showResizeControl) {
                                $scope.toolBarOptions.header.right.push({template: "<div ng-click=\"resize('right')\" pl-resize  ng-show=\"gridOptions.sharedOptions.resizable\" class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-right\"></i></div>"});
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $scope.populateHeader = function () {
                        try {
                            var isFieldGroup = false;
                            for (var i = 0; i < $scope.gridOptions.gridColumns.length; i++) {
                                if ($scope.gridOptions.gridColumns[i].fieldGroup) {
                                    isFieldGroup = true;
                                    break;
                                }
                            }
                            if (!isFieldGroup) {
                                return;
                            }
                            $scope.gridOptions.headerColumns = [];                                                          // to contains top headers in grid column header
                            $scope.gridOptions.subHeaderColumns = [];                                                       // to contains sub-headers in grid column header
                            for (var i = 0; i < $scope.gridOptions.gridColumns.length; i++) {
                                var cloneColumn = angular.copy($scope.gridOptions.gridColumns[i]);
                                cloneColumn.colIndex = i;
                                if ($scope.gridOptions.gridColumns[i].fieldGroup) {
                                    var headerColumn = undefined;
                                    for (var j = 0; j < $scope.gridOptions.headerColumns.length; j++) {
                                        if (($scope.gridOptions.gridColumns[i].fieldGroup == $scope.gridOptions.headerColumns[j].label) && ($scope.gridOptions.headerColumns[j].headerColumn)) {
                                            headerColumn = $scope.gridOptions.headerColumns[j];
                                            break;
                                        }
                                    }
                                    if (headerColumn === undefined) {
                                        headerColumn = {};
                                        headerColumn.headerColumn = true;
                                        headerColumn.label = cloneColumn.fieldGroup;
                                        headerColumn.rowSpan = 1;
                                        headerColumn.colSpan = 0;
                                        headerColumn.headerCellTemplate = cloneColumn.headerCellTemplate;
                                        headerColumn.style = angular.copy(cloneColumn.style) || {};
                                        headerColumn.style.width = "0px";
                                        headerColumn.style.margin = "0px auto";
                                        headerColumn.subColumns = [];
                                        headerColumn.width = "0px";
                                        $scope.gridOptions.headerColumns.push(headerColumn);

                                    }
                                    headerColumn.subColumns.push(cloneColumn);
                                    headerColumn.colSpan++;
                                    if (headerColumn.style.width && cloneColumn.style && cloneColumn.style.width) {
                                        var preWidth = parseInt(headerColumn.style.width.substr(0, headerColumn.style.width.length - 2));
                                        var curWidth = parseInt(cloneColumn.style.width.substr(0, cloneColumn.style.width.length - 2));
                                        curWidth += preWidth;
                                        if (preWidth != 0) {
                                            curWidth += 11;
                                        }
                                        headerColumn.style.width = curWidth + "px";
                                    }

                                } else {
                                    cloneColumn.rowSpan = 2;
                                    cloneColumn.colSpan = 1;
                                    $scope.gridOptions.headerColumns.push(cloneColumn);
                                }

                            }
                            var newGridColumns = [];                                                                        // to maintain the order of gridColumns with fieldGroup headers
                            for (var i = 0; i < $scope.gridOptions.headerColumns.length; i++) {
                                if ($scope.gridOptions.headerColumns[i].subColumns) {
                                    for (var j = 0; j < $scope.gridOptions.headerColumns[i].subColumns.length; j++) {
                                        if ($scope.gridOptions.headerColumns[i].style) {
                                            var headerColWidth = parseInt($scope.gridOptions.headerColumns[i].style.width.substr(0, $scope.gridOptions.headerColumns[i].style.width.length - 2));
                                            headerColWidth += 16;
                                        }
                                        var totalChildCol = $scope.gridOptions.headerColumns[i].subColumns.length;
                                        var childWidth = Math.round(headerColWidth / totalChildCol) - 16;
                                        if (totalChildCol > 1 && totalChildCol < 3) {
                                            childWidth -= 1;     // NOTE: as every cell contains its own padding, so we have to align it to its parent field group
                                        } else if (totalChildCol >= 3) {
                                            childWidth -= 2;     // NOTE: as every cell contains its own padding, so we have to align it to its parent field group
                                        }
                                        $scope.gridOptions.gridColumns[$scope.gridOptions.headerColumns[i].subColumns[j].colIndex].width = childWidth + 'px';
                                        $scope.gridOptions.gridColumns[$scope.gridOptions.headerColumns[i].subColumns[j].colIndex].style = $scope.gridOptions.gridColumns[$scope.gridOptions.headerColumns[i].subColumns[j].colIndex].style || {};
                                        $scope.gridOptions.gridColumns[$scope.gridOptions.headerColumns[i].subColumns[j].colIndex].style.width = childWidth + 'px';
                                        $scope.gridOptions.headerColumns[i].subColumns[j].style = $scope.gridOptions.headerColumns[i].subColumns[j].style || {};
                                        $scope.gridOptions.headerColumns[i].subColumns[j].style.width = childWidth + 'px';
                                        $scope.gridOptions.subHeaderColumns.push($scope.gridOptions.headerColumns[i].subColumns[j]);
                                        newGridColumns.push($scope.gridOptions.gridColumns[$scope.gridOptions.headerColumns[i].subColumns[j].colIndex]);
                                    }
                                } else {
                                    newGridColumns.push($scope.gridOptions.gridColumns[$scope.gridOptions.headerColumns[i].colIndex]);
                                }
                            }
                            $scope.gridOptions.gridColumns = newGridColumns;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }


                    $scope.getCellTemplate = function (field) {
                        if ($scope.gridOptions.columns && $scope.gridOptions.columns.length > 0) {
                            for (var i = 0; i < $scope.gridOptions.columns.length; i++) {
                                if ($scope.gridOptions.columns[i].field == field) {
                                    return $scope.gridOptions.columns[i].cellTemplate;
                                }

                            }
                        }
                    }
                    $scope.getCurrentHeaderCell = function () {
                        return $scope.headerCell;
                    };
                    $scope.rowReOrdering = function (srcIndex, targetIndex) {
                        try {
                            var srcRow = $scope.gridOptions.renderedRows[srcIndex];
                            var targetRow = $scope.gridOptions.renderedRows[targetIndex];

                            var srcRowIndex = srcRow[$scope.gridOptions.sequenceField];
                            var targetRowIndex = targetRow[$scope.gridOptions.sequenceField];
                            if (srcRowIndex > targetRowIndex) {
                                var preTargetRow = $scope.gridOptions.gridColumns[targetIndex - 1];
                                if (angular.isUndefined(preTargetRow[$scope.gridOptions.sequenceField])) {
                                    srcRowIndex = (targetRowIndex - INDEX_OFFSET);
                                } else {
                                    var preTargetRowIndex = preTargetRow[$scope.gridOptions.sequenceField] || 0;
                                    srcRowIndex = (preTargetRowIndex + targetRowIndex ) / 2;
                                }
                            } else if (srcRowIndex < targetRowIndex) {
                                var nextTargetRow = $scope.gridOptions.gridColumns[targetIndex + 1];
                                if (angular.isUndefined(nextTargetRow[$scope.gridOptions.sequenceField])) {
                                    srcRowIndex = (targetRowIndex + INDEX_OFFSET);
                                } else {
                                    var nextTargetRowIndex = nextTargetRow[$scope.gridOptions.sequenceField] || 0;
                                    srcRowIndex = (nextTargetRowIndex + targetRowIndex ) / 2;
                                }
                            }
                            for (var i = 0; i < $scope.gridOptions.renderedRows.length; i++) {
                                var row = $scope.gridOptions.renderedRows[i];
                                if (row.entity._id == srcRow.entity._id) {
                                    row[$scope.gridOptions.sequenceField] = srcRowIndex;
                                    break;
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    };
                    $scope.setCurrentHeaderCell = function (headerCell) {
                        $scope.headerCell = headerCell;
                    };
                    $scope.setRowDragable = function (rowFlag) {
                        $scope.isRowDragable = rowFlag;
                    }
                    $scope.setSrcRowIndex = function (index) {
                        $scope.srcRowIndex = index;
                    };
                    $scope.setCurrentRow = function (entity) {
                        try {
                            var dataRowIndex = $scope.getDataMappingKey(entity, $scope.gridOptions.dataModel);
                            $scope.gridOptions.currentRow = entity;
                            $scope.gridOptions.sharedOptions.currentRow = entity;
                            $scope.gridOptions.sharedOptions.currentRowIndex = dataRowIndex;
                            $scope.gridOptions.sharedOptions.currentRowChanged = !$scope.gridOptions.sharedOptions.currentRowChanged;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    var addChildrenToRenderRow = function (index, childrens, parentLevel) {
                        var renderedRows = [];
                        if (childrens && childrens.length > 0) {
                            $scope.groupTemplate(childrens, renderedRows, parentLevel);
                        }
                        if (renderedRows && renderedRows.length > 0) {
                            for (var i = renderedRows.length - 1; i >= 0; i--) {
                                if ($scope.gridOptions.qViewStyle) {
                                    renderedRows[i].style = $scope.gridOptions.qViewStyle;
                                }
                                $scope.gridOptions.renderedRows.splice(index + 1, 0, renderedRows[i]);
                            }
                        }
                    }

                    $scope.toggleTree = function (row, index, parentLevel) {
                        try {
                            var childrens = row.entity.children;
                            if (row.__hidden__) {
                                addChildrenToRenderRow(index, childrens, parentLevel);
                            } else {
                                var data = $scope.gridOptions.renderedRows;
                                var curGroup = data[index].__group__;
                                var targetIndex = undefined;
                                for (var i = index + 1; i < data.length; i++) {
                                    if (curGroup >= data[i].__group__) {
                                        break;
                                    }
                                    targetIndex = i;
                                }
                                if (targetIndex && targetIndex > 0) {
                                    $scope.gridOptions.renderedRows.splice(index + 1, targetIndex - index);
                                }
                            }
                            row.__hidden__ = !row.__hidden__;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    };

                    $scope.toggleTreeForChild = function (row, index) {
                        try {
                            var childrens = row.entity.children;
                            if (!row.__hidden__) {
                                var parentLevel = undefined;
                                if ($scope.gridOptions.$recursion && $scope.gridOptions.$recursion.$primaryColumn) {
                                    parentLevel = row.level || 0;
                                }
                                addChildrenToRenderRow(index, childrens, parentLevel);
                            } else {
                                var data = $scope.gridOptions.renderedRows;
                                var curGroup = data[index].__group__;
                                var targetIndex = undefined;
                                if (row.entity.children && row.entity.children.length > 0) {
                                    var childToRemove = 0;
                                    for (var i = index + 1; i < data.length; i++) {
                                        var rowLevel = row.level || 0;
                                        if (rowLevel < data[i].level) {
                                            childToRemove++;
                                            continue;
                                        }
                                        break;
                                    }
                                    $scope.gridOptions.renderedRows.splice(index + 1, childToRemove);
                                }

                            }
                            row.__hidden__ = !row.__hidden__;
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    $timeout(function () {
                        // to open first level children in recusrion view
                        if ($scope.gridOptions && (!$scope.gridOptions.childrenAutoExpanded) && $scope.gridOptions.$recursion && $scope.gridOptions.$recursion.$expandLevel && $scope.gridOptions.renderedRows.length > 0) {
                            $scope.toggleTreeForChild($scope.gridOptions.renderedRows[0], 0);   // to open first level children in recursion view
                            $scope.gridOptions.childrenAutoExpanded = true;
                        }
                    }, 0);

                    $scope.watchData = function () {
                        try {
                            // watch view data  is set when dealing with cross tab view
                            if ($scope.gridOptions.watchViewData) {
                                gridUnwatcher.parentViewDataChanged = $scope.$parent.$watch("viewDataChanged", function (value) {
                                    if (angular.isDefined(value)) {
                                        if ($scope.gridOptions.repopulateColumn) {
                                            $scope.populateColumns();
                                            $scope.gridOptions.repopulateColumn = false;
                                        }
                                        $scope.repopulateRenderedRows($scope.viewData);
                                    }
                                });
                            } else {
                                $scope.populateRenderedRows(data);
                                gridUnwatcher.deepGridOptionsData = $scope.$parent.$watch($scope.gridOptions.data, dataWatcher, true);
                                gridUnwatcher.gridOptionsData = $scope.$parent.$watch($scope.gridOptions.data, dataWatcher);                                        // we need to add two data watcher due to references issues has been found during  insert/delete/update in $scope.gridOptions.data
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    try {
                        gridUnwatcher.insertFromPanel = $scope.$watch("gridOptions.sharedOptions.insertFromPanel", function (newValue, oldValue) {
                            if (!angular.equals(newValue, oldValue)) {
                                $scope.insert(undefined, 'nestedForm');
                            }
                        }, true);
                        gridUnwatcher.userPreferenceOptionsReload = $scope.$watch("gridOptions.userPreferenceOptions.reload", function (newValue, oldValue) {
                            if (!angular.equals(newValue, oldValue) && angular.isDefined(oldValue)) {
                                $scope.populateUserPreferene($scope.gridOptions.userPreferenceOptions, true);

                            }
                        });
                        gridUnwatcher.parentUserPreferenceOptionsReload = $scope.$watch("gridOptions.parentSharedOptions.userPreferenceOptions.reload", function (newValue, oldValue) {
                            if (!angular.equals(newValue, oldValue) && angular.isDefined(newValue)) {
                                $scope.populateUserPreferene($scope.gridOptions.parentSharedOptions.userPreferenceOptions, false);
                            }
                        });
                        gridUnwatcher.currentRowChanged = $scope.$watch("gridOptions.currentRowChanged", function (newValue, oldValue) {
                            if (angular.isDefined(newValue)) {
//                                var renderedRows = $scope.gridOptions.renderedRows || [];
//                                var renderedRow = undefined;
//                                var dataRowIndex = undefined;
//                                for (var i = 0; i < renderedRows.length; i++) {
//                                    dataRowIndex = $scope.getDataMappingKey(renderedRows[i], $scope.gridOptions.dataModel);
//                                    if (dataRowIndex === $scope.gridOptions.currentRow) {
//                                        renderedRow = renderedRows[i];
//                                        break;
//                                    }
//                                }
                                $scope.setCurrentRow($scope.gridOptions.currentRow);
                            }

                        });
                        gridUnwatcher.__selected__ = $scope.$watch("gridOptions.__selected__", function (newSelectedValue, oldSelectedValue) {
                            if (!angular.equals(newSelectedValue, oldSelectedValue)) {
                                for (var i = 0; i < $scope.gridOptions.renderedRows.length; i++) {
                                    $scope.gridOptions.renderedRows[i].__selected__ = newSelectedValue;
                                    if (angular.isDefined($scope.gridOptions.onSelectionChange)) {
                                        $scope[$scope.gridOptions.onSelectionChange]($scope.gridOptions.renderedRows[i]);
                                    }
                                }
                                if ($scope.gridOptions.sharedOptions && $scope.gridOptions.sharedOptions.pageOptions && $scope.gridOptions.sharedOptions.pageOptions.hasNext && $scope.gridOptions.sharedOptions.pageOptions.count) {
                                    $scope.gridOptions.sharedOptions.pageOptions.pageSelected = newSelectedValue;
                                    if (!$scope.gridOptions.sharedOptions.pageSelected) {
                                        $scope.gridOptions.sharedOptions.pageOptions.allRowSeleceted = false;
                                    }
                                }
                            }
                        });

                        $scope.gridOptions.sharedOptions = $scope.gridOptions.sharedOptions || {};
                        $scope.gridOptions.activeCellOptions = {};
                        $scope.gridOptions.resizeEnable = undefined;
                        $scope.gridOptions.leftDownKeyPress = undefined;
                        $scope.populateToolbar();
                        $scope.populateColumns();
                        $scope.countWatch = 0;

                        var toolBarTemplate = "<div style='overflow: hidden;display: table-row;'>" +
                            "                       <div style='position: relative;width: 100%;'>" +
                            "                       <div class='pl-row-drag-wrapper' ng-show='gridOptions.rowDragging' ng-bind='gridOptions.rowDraggingLabel'></div>" +
                            "                           <div class='pl-header-toolbar' >" +
                            "                               <pl-tool-bar-header></pl-tool-bar-header>" +
                            "                           </div>" +
                            "                           <div class='pl-toolbar' pl-tool-bar></div>" +
                            "                           <div class='app-text-align-center pl-clear light-theme app-color-black msg-row' ng-show='gridOptions.sharedOptions.pageOptions.pageSelected'>" +
                            "                               <span ng-if='!gridOptions.sharedOptions.pageOptions.allRowSeleceted'>" +
                            "                                   <span>All <b ng-bind='gridOptions.sharedOptions.pageOptions.endCursor'></b> records on this page are selected. </span>" +
                            "                                   <u class='app-cursor-pointer' ng-click='gridOptions.sharedOptions.pageOptions.allRowSeleceted = true;'>Select all <b ng-bind='gridOptions.sharedOptions.pageOptions.count | number'></b> records in {{gridOptions.label}}</u>" +
                            "                               </span>" +
                            "                               <span ng-if='gridOptions.sharedOptions.pageOptions.allRowSeleceted'>" +
                            "                                   All <b ng-bind='gridOptions.sharedOptions.pageOptions.count | number'></b> records in {{gridOptions.label}} are selected. <u class='app-cursor-pointer' ng-click='gridOptions.__selected__ = false;'>Clear selection</u>" +
                            "                               </span>" +
                            "                           </div>" +
                            "                       </div>" +
                            "                  </div>";
                        var template = '';
                        var data = $scope.$eval($scope.gridOptions.data);
                        if ($scope.gridOptions.aggregateData) {
                            var aggData = $scope.$eval($scope.gridOptions.aggregateData);
                            if (aggData) {
                                $scope.gridOptions.aggregateRenderedData = {entity: aggData, aggregateRow: true};
                            }
                        }
                        $scope.populateHeader();                                                                            // method to populate headerColumns in composite view if any fieldGroup found
                        if ($scope.gridOptions.headerFreeze) {
                            template = "<div class='app-grid'>" +
                                "               <div class='app-container'>" +
                                "                   <div class='app-wrapper'>" +
                                "                       <div class='app-wrapper-child'>" +
                                "                           <div style='display: table;table-layout:fixed;width: 100%;height: 100%;'>";

                            if ($scope.gridOptions.headerTemplate) {
                                template += $scope.gridOptions.headerTemplate;
                            }
                            if ($scope.gridOptions.toolbar) {
                                template += toolBarTemplate;
                            }

                            template += "                               <div style='overflow: hidden;display: table-row;'>" +
                                "                                   <div style='position: relative;width: 100%;'>";
                            if ($scope.gridOptions.freezeCol) {
                                template += "<div class='pl-freeze-header-area' ng-style='gridOptions.freezeHeaderStyle' ng-class='{\"pl-composite-header-height\":gridOptions.headerColumns}' pl-Freeze-header></div>";
                            }
                            template += "                                       <div style='overflow-x: hidden;left: 0px;right: 0px;' pl-grid-header></div>" +
                                "                                           </div>" +
                                "                                   </div>" +

                                "                              <div  style='display: table-row;height: 100%;'>" +
                                "                                  <div style='position: relative;height: 100%;'>" +
                                "                                       <div pl-grid-body class='grid-scroll pl-grid-body main-grid'></div>";

                            if ($scope.gridOptions.freezeCol) {
                                template += "<div pl-Freeze-column></div>";
                            }
                            template += "                                   </div>" +
                                "                              </div>" +

                                "                            </div>" +
                                "                         </div>" +
                                "                      </div>" +
                                "                   </div>" +
                                "             </div>";
                        } else {
                            template = "<div style='display: table;table-layout:fixed;width: 100%;height: 100%;'>";
                            if ($scope.gridOptions.headerTemplate) {
                                template += $scope.gridOptions.headerTemplate;
                            }
                            if ($scope.gridOptions.toolbar) {
                                template += toolBarTemplate;
                            }

                            template += "       <div style='display: table-row;height: 100%;'>" +
                                "           <div style='position: relative;height: 100%;'>";
                            if ($scope.gridOptions.freezeCol) {
                                template += "<pl-nested-freeze-grid></pl-nested-freeze-grid>";
                            }

                            template += "               <div style='  left: 0;overflow: auto;right: 0;top: 0;' class='main-grid' pl-handle-scroll >" +
                                "                   <table class='app-width-full' cellpadding='0' cellspacing='0'>" +
                                "                       <thead class='pl-static-col applane-grid-header' >" +
                                "                           <th pl-grid-header-cell ng-repeat='col in gridOptions.gridColumns' ng-style='col.style' ></th>" +
                                "                       </thead>" +
                                "                       <tbody class='applane-grid-body'>" +
                                "                           <tr ng-repeat='row in gridOptions.renderedRows'>" +
                                "                               <td class='pl-static-col applane-grid-cell' ng-repeat='col in gridOptions.gridColumns' pl-grid-cell tabindex='{{col.tabindex}}' ng-style='col.style' ng-click='changeCurrentRow(row,$parent.$index)'></td>" +
                                "                               <td class='pl-responsive-col' >" +
                                "                                    <a ng-click='changeCurrentRow(row, $index); rowActionPopUp($event,row)' ng-class='{\"row-sptr\":!gridOptions.responsiveColumns}' class='pl-responsive-link  flex flex-1'>" +
                                "                                       <pl-responsive-cell></pl-responsive-cell>" +
                                "                                    </a>" +
                                "                               </td>" +
                                "                           </tr>";
                            if ($scope.gridOptions.aggregateRenderedData) {
                                template += "<tr ng-init='row=gridOptions.aggregateRenderedData' >" +
                                    "<td pl-grid-footer-cell class='pl-static-col applane-grid-cell' style='border-right: none;' ng-repeat='col in gridOptions.gridColumns'  ng-style='col.style' tabindex='{{col.tabindex}}' ng-click='changeCurrentRow(row, $parent.$index)'>" +
                                    "</td>" +
                                    "</tr>";
                            }
                            template += "                       </tbody>" +
                                "                   </table>" +
                                "               </div>" +
                                "           </div>" +
                                "       </div>" +
                                "</div>";

                        }

                        template += "<div id='{{gridOptions.uniqueViewId}}-rowDrag' class='pl-row-drag-popup app-display-none' ></div>";

                        if ($scope.gridOptions.parentSharedOptions) {
                            $scope.gridOptions.parentSharedOptions.resizable = true;
                        }
                        $scope.watchData();

                        $scope.changeFilter = function (row, renderedRowIndex) { //these is for applying filter to other dashboard view on click of row of one dashboard view---case on click of project dashboard,task should change--Ritesh Bansal
                            if (row && row.entity) {
                                $scope.gridOptions.selectedValue = row.entity._id;
                            }
                            $scope.gridOptions.sharedOptions.onRecursiveIconClick = false;
                            $scope.changeCurrentRow(row, renderedRowIndex);
                        };
                        $scope.changeRecursiveFilter = function (row, renderedRowIndex) {//these is for applying recursive filter to other dashboard view on click of row of one dashboard view---case on click of project dashboard,task should change--Ritesh Bansal
                            $scope.gridOptions.selectedValue = row.entity._id;
                            $scope.gridOptions.sharedOptions.onRecursiveIconClick = true;
                            $scope.changeCurrentRow(row, renderedRowIndex);
                        };

                        $scope.openSelectedRecordHierarchy = function (record, level) {
                            $scope.toggleTreeForChild($scope.gridOptions.renderedRows[level], level);
                            if (record.children && record.children.level != undefined) {
                                $scope.openSelectedRecordHierarchy(record.children, (level + 1 + record.children.level));
                            }
                        };

                        $scope.getSelectedRecord = function (data, id, alias) {
                            if (!data || data.length === 0) {
                                return;
                            }
                            for (var i = 0; i < data.length; i++) {
                                var record = data[i];
                                if (Utility.deepEqual(record._id, id)) {
                                    return {record: record};
                                }
                                if (record[alias] && record[alias].length > 0) {
                                    var innerRecord = $scope.getSelectedRecord(record[alias], id, alias);
                                    if (innerRecord && innerRecord.record) {
                                        var hierarchyLevel = {level: i};
                                        if (innerRecord.hierarchyLevel) {
                                            hierarchyLevel.children = innerRecord.hierarchyLevel;
                                        }
                                        return {record: innerRecord.record, hierarchyLevel: hierarchyLevel};
                                    }
                                }
                            }
                        };

                        if ($scope.gridOptions.provideParentParameter) {//this work is done for selecting first record of left dashboard view as filter for second dashboard view---case for notifying other dashboard view on click of one dashboard view--Ritesh Bansal
                            var selectedRecord = {entity: data[0]};
                            if ($scope.gridOptions.$parameters && $scope.gridOptions.$parameters[$scope.gridOptions.provideParentParameter]) {
                                var alias = ($scope.gridOptions.$recursion && $scope.gridOptions.$recursion.$alias) ? $scope.gridOptions.$recursion.$alias : "children";
                                var id = $scope.gridOptions.$parameters[$scope.gridOptions.provideParentParameter];
                                var recordWithLevel = $scope.getSelectedRecord(data, id, alias);
                                var record = recordWithLevel ? recordWithLevel.record : undefined;
                                var openHierarchyLevel = recordWithLevel ? recordWithLevel.hierarchyLevel : undefined;
                                if (record) {
                                    selectedRecord.entity = record;
                                }
                                $timeout(function () {
                                    if (openHierarchyLevel && openHierarchyLevel.level) {
                                        $scope.openSelectedRecordHierarchy(openHierarchyLevel, openHierarchyLevel.level);
                                    }
                                }, 0);
                            }
                            $scope.changeFilter(selectedRecord, 0);
                        }
                        iElement.append(($compile)(template)($scope));
                        $scope.$on('$destroy', function () {
                            if (gridUnwatcher) {
                                for (var key in gridUnwatcher) {
                                    gridUnwatcher[key]();
                                }
                            }
                        });
                    }
                    catch (e) {
                        if ($scope.handleClientError) {
                            $scope.handleClientError(e);
                        }
                    }
                },
                post: function ($scope, iElement) {

                }
            }
        }
    };
}]);

pl.directive('plHandleScroll', [function () {
    return{
        restrict: 'A',
        link: function ($scope, iElement) {
            $scope.$watch('gridOptions.bodyScrollLeft', function () {
                $(iElement).scrollLeft($scope.gridOptions.bodyScrollLeft);
            });
        }
    }
}]);

pl.directive('plNestedFreezeGrid', ['$compile', function ($compile) {
    return{
        restrict: 'EAC',
        scope: false,
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    var template = "<div class='pl-nested-freeze-area'>" +
                        "           <table class='app-width-full' style='box-shadow: 0px 0px 5px #ddd;' cellpadding='0' cellspacing='0'>" +
                        "                       <thead class='applane-grid-header' >" +
                        "                           <th style='border-right: 1px solid #ddd;' pl-grid-header-cell ng-repeat='col in gridOptions.freezeCol' ng-style='col.style' ></th>" +
                        "                       </thead>" +
                        "                       <tbody class='applane-grid-body'>" +
                        "                           <tr ng-repeat='row in gridOptions.renderedRows'>" +
                        "                               <td class='applane-grid-cell' ng-repeat='col in gridOptions.freezeCol' pl-grid-cell tabindex='{{col.tabindex}}' ng-style='col.style' ng-click='changeCurrentRow(row, $parent.$index)'></td>" +
                        "                               <td class='pl-responsive-col' > <a ng-click='changeCurrentRow(row, $index); rowActionPopUp($event,row)' ng-class='{\"row-sptr\":!gridOptions.responsiveColumns}' class='pl-responsive-link flex flex-1'><pl-responsive-cell class='flex flex-1'></pl-responsive-cell></a></td>" +
                        "                           </tr>" +
                        "                       </tbody>" +
                        "                   </table>" +
                        "               </div>";
                    iElement.append($compile(template)($scope));
                }
            }
        }
    }
}]);

pl.directive('plFreezeColumn', ['$compile', function ($compile) {
    return{
        restrict: 'EAC',
        scope: false,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    var template = "<div class='pl-freeze-area' ng-style='gridOptions.freezeStyle'>" +
                        "               <div  class='pl-fixed-row'>" +
                        "                  <table style='table-layout: fixed;width: 100%;box-shadow: 0px 0px 5px #ddd;' cellpadding='0' cellspacing='0' class='applane-grid-body'>" +
                        "                      <tbody>" +
                        "                          <tr ng-repeat='row in gridOptions.renderedRows' ng-style='{{row.style}}' ng-class='{\"selected\":$index== gridOptions.renderedRowIndex}' >" +
                        "                              <td pl-grid-cell class='applane-grid-cell' ng-repeat='col in gridOptions.freezeCol'  ng-style='col.style' tabindex='{{col.tabindex}}' ng-click='changeCurrentRow(row, $parent.$index)'>" +
                        "                              </td>" +
                        "                              <td class='pl-responsive-col' ><a ng-click='changeCurrentRow(row, $index); rowActionPopUp($event,row)' ng-class='{\"row-sptr\":!gridOptions.responsiveColumns}' class='pl-responsive-link flex flex-1'><pl-responsive-cell></pl-responsive-cell></a> </td>" +
                        "                          </tr>" +
                        "                       </tbody>" +
                        "                  </table>" +
                        "               </div>" +
                        "           </div>";
                    iElement.append($compile(template)($scope));
                    $scope.$watch('gridOptions.scrollTop', function () {
                        $($(iElement).find('.pl-freeze-area')).scrollTop($scope.gridOptions.scrollTop);
                    });
                }
            }
        }
    }
}]);

pl.directive('plFreezeHeader', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: 'A',
        scope: false,
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    var template = "<table class='applane-grid-header pl-table-header' cellpadding='0' cellspacing='0'>" +
                        "       <tr>" +
                        "           <th pl-grid-header-cell class='pl-fixed-heading' ng-repeat='col in gridOptions.freezeCol' ng-style='col.style'  rowspan='{{col.rowSpan}}' colspan='{{col.colSpan}}'></th>" +
                        "       </tr>" +
                        "</table>";
                    iElement.append($compile(template)($scope));

                    if ($scope.gridOptions.headerFreeze) {
                        $scope.$watch('gridOptions.scrollLeft', function () {
                            $(iElement).scrollLeft($scope.gridOptions.scrollLeft);
                        });
                    }
                }
            }
        }
    };
}]);

pl.directive('plGridBody', [
    '$compile', '$timeout', function ($compile, $timeout) {
        'use strict';
        return {
            restrict: 'A',
            scope: false,
            compile: function () {
                return {
                    pre: function ($scope, iElement, attrs) {
                        var template = "<table style='table-layout: fixed;width: 100%;' cellpadding='0' cellspacing='0' class='applane-grid-body'>" +
                            "               <tbody>" +
                            "                   <tr ng-if='(gridOptions.aggregatePosition == \"header\" || gridOptions.aggregatePosition == \"both\") && gridOptions.aggregateRenderedData' class='agg-row'  ng-init='row=gridOptions.aggregateRenderedData' >" +
                            "                       <td pl-grid-footer-cell class='pl-static-col applane-grid-cell' ng-repeat='col in gridOptions.gridColumns' ng-style='col.style' tabindex='{{col.tabindex}}' ng-click='changeCurrentRow(row, $parent.$index)'>" +
                            "                       </td>" +
                            "                  </tr>" +
                            "                   <tr ng-repeat='row in gridOptions.renderedRows";
                        if ($scope.gridOptions.clientSearch) {
                            template += " | filter:gridOptions.clientSearchInfo.value ";
                        }
                        template += "' ng-style='{{row.style}}' ng-class='{\"selected\":$index== gridOptions.renderedRowIndex}' ";
//                        if ($scope.gridOptions.groupInfo && $scope.gridOptions.groupInfo.length > 0) {                 // due to __hidden__ is no longer part of row/data
//                            template += " ng-show='!row.__hidden__' ";
//                        }
                        template += " >" +
                            "                       <td pl-grid-cell class='pl-static-col applane-grid-cell' ng-repeat='col in gridOptions.gridColumns'  ng-style='col.style' tabindex='{{col.tabindex}}' ng-click='changeCurrentRow(row, $parent.$index)'>" +
                            "                       </td>" +
                            "                       <td class='pl-responsive-col flex flex-1' >";
                        if ($scope.gridOptions.$recursion || $scope.gridOptions.provideParentParameter) {
                            template += "<a ng-class='{\"row-sptr\":!gridOptions.responsiveColumns}' class='pl-responsive-link flex flex-1'>";
                        } else {
                            template += "<a ng-click='changeCurrentRow(row, $index); rowActionPopUp($event,row)' ng-class='{\"row-sptr\":!gridOptions.responsiveColumns}' class='pl-responsive-link flex flex-1'>";
                        }

                        template += "<pl-responsive-cell class='flex flex-1'></pl-responsive-cell>" +
                            "     </a>" +
                            "     </td>" +
                            "     </tr>";
                        if ($scope.gridOptions.aggregateRenderedData) {
                            template += "<tr ng-init='row=gridOptions.aggregateRenderedData' ng-if='(gridOptions.aggregatePosition == \"footer\" || gridOptions.aggregatePosition == \"both\" || gridOptions.aggregatePosition == undefined)'>" +
                                "<td pl-grid-footer-cell class='pl-static-col applane-grid-cell' style='border-right: none;' ng-repeat='col in gridOptions.gridColumns'  ng-style='col.style' tabindex='{{col.tabindex}}' ng-click='changeCurrentRow(row, $parent.$index)'>" +
                                "</td>" +
                                "</tr>";
                        }

                        template += "               </tbody>" +
                            "           </table>";

                        iElement.append($compile(template)($scope));
                    },
                    post: function ($scope, iElement) {
                        if ($scope.gridOptions.headerFreeze) {
                            $(iElement).scroll(function () {
                                $scope.gridOptions.scrollLeft = $(iElement).scrollLeft();
                                $scope.gridOptions.scrollTop = $(iElement).scrollTop();
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            });
                        }

                        $scope.$watch('gridOptions.renderedRows', function (newValue, oldValue) {
                            $timeout(function () {
                                var grid = $(iElement).find('.applane-grid-body');
                                var gHeight = $(grid).height();
                                if ($scope.gridOptions) {
                                    if (gHeight > $(iElement).height()) {
                                        $scope.gridOptions.overflow = true;
                                    } else {
                                        $scope.gridOptions.overflow = false;
                                    }
                                }

                            }, 0);
                        }, true);
                        $scope.$watch('gridOptions.bodyScrollLeft', function () {
                            $(iElement).scrollLeft($scope.gridOptions.bodyScrollLeft);
                        });
                    }
                }
            }
        };
    }
]);

pl.directive('plResponsiveCell', ['$compile', '$document', '$timeout', function ($compile, $document, $timeout) {
    'use strict';
    return{
        restrict: 'EA',
        scope: false,
        compile: function () {
            return{
                post: function ($scope, iElement) {
                    var template = "";
                    if ($scope.gridOptions.provideParentParameter) { //this work is highlighting selected row and accordingly applying padding---case for notifying other dashboard view on click of one dashboard view--Ritesh Bansal
                        template += '<div class="flex flex-1" ng-class="{\'selected-Recursive-filter\':gridOptions.selectedValue===row.entity._id}" style="border-left:1px solid transparent;overflow:hidden;text-overflow: ellipsis;">';
                    } else {
                        template += '<div style="padding-left:20px;border-left:1px solid transparent;overflow:hidden;text-overflow: ellipsis;">';
                    }
                    $scope.getResponsiveTemplate = function (responsiveCol) {
                        try {
                            if (Utility.isJSONObject(responsiveCol)) {
                                if (responsiveCol.html) {
                                    responsiveCol.html = (responsiveCol.html).replace(/\$/g, "row.entity.").replace(/\'/g, "\"");
                                    template += responsiveCol.html;
                                } else if (responsiveCol.label) {
                                    for (var i = 0; i < $scope.gridOptions.gridColumns.length; i++) {
                                        var col = $scope.gridOptions.gridColumns[i];
                                        if (col.field == responsiveCol.field) {
                                            template += col.cellTemplate;
                                        }
                                    }
                                }
                            } else {
                                for (var i = 0; i < $scope.gridOptions.gridColumns.length; i++) {
                                    var col = $scope.gridOptions.gridColumns[i];
                                    if (col.field == responsiveCol) {
                                        if ($scope.gridOptions.$recursion && $scope.gridOptions.$recursion.$primaryColumn == col.field) { //this work is done for showing hierarchy in for dashboard view as responsive
                                            template += '<div  style="display:flex">' +
                                                '           <div style=\'padding-left:' + $scope.row.level * 20 + 'px;\' class="app-float-left">&nbsp;</div>' +
                                                '           <div ng-if="!(row.entity.children) || (row.entity.children.length == 0) " style=\'padding-left:18px;\' class="app-float-left">&nbsp;</div>' +
                                                '           <div ng-click="toggleTreeForChild(row, $index)" ng-if="row.entity.children && (row.entity.children.length > 0)" ng-class="{\'icon-minus\':row.__hidden__,\'icon-plus\':row.__hidden__!=true}" pl-grid-group style="min-width: 6px;max-height:9px" class="pl-group-toggle-box app-float-left">&nbsp;</div>' +
                                                '           <span style="min-width:14px;" ng-click="changeRecursiveFilter(row,$index)">' +
                                                '               <i ng-if="(row.entity.children) && (row.entity.children.length > 0) && gridOptions.provideParentParameter && gridOptions.sharedOptions.onRecursiveIconClick && gridOptions.selectedValue===row.entity._id" style="font-size: 12px; font-family: FontAwesome;" class="pl-shared icon-repeat"></i>' +
                                                '               <i ng-if="(row.entity.children) && (row.entity.children.length > 0) && gridOptions.provideParentParameter && (!gridOptions.sharedOptions.onRecursiveIconClick || gridOptions.selectedValue!=row.entity._id)" style="font-size: 12px; color: rgb(161, 161, 161);font-family: FontAwesome;" class="pl-shared icon-repeat"></i>' +
                                                '           </span>' +
                                                '           <span ng-click="changeFilter(row,$index)" style="overflow: hidden;text-overflow: ellipsis;">' +
                                                col.cellTemplate +
                                                '           </span>' +
                                                '       </div>';
                                        } else {
                                            if ($scope.gridOptions.provideParentParameter) {
                                                template += '<span ng-click="changeFilter(row,$index)" style="overflow: hidden;text-overflow: ellipsis;">' +
                                                    col.cellTemplate +
                                                    '           </span>'
                                            } else {
                                                template += col.cellTemplate;
                                            }
                                        }
                                    }
                                }
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    if ($scope.gridOptions.responsiveColumns) {
                        var seperator = $scope.gridOptions.responsiveColumns.seperator || '|';
                        var responsiveCol = undefined;
                        var userDB = ApplaneDB.connection("userdb");
                        var token = userDB.token;
                        template += '<div class="responsive-row">';
                        if ($scope.gridOptions.responsiveColumns.$image) {
                            template += "           <div class='left-icon'>" +
                                "               <div class='inner'> " +
                                "                   <img alt='Image' ng-if='row.entity." + $scope.gridOptions.responsiveColumns.$image + ".key' class='icon-image' ng-src='/rest/file/download?token=" + token + "&filekey={{row.entity." + $scope.gridOptions.responsiveColumns.$image + ".key}}' />" +
                                "                   <img alt='Image' ng-if='!row.entity." + $scope.gridOptions.responsiveColumns.$image + ".key' class='icon-image' src='../images/user.ico' />" +
                                "               </div>" +
                                "           </div>";
                        }
                        template += '           <div class="rs-row-right" ng-class=\'{"rs-row":!gridOptions.responsiveColumns.$image && !gridOptions.$recursion}\'>' +
                            '               <div class="app-overflow-hiiden app-width-full rs-data">';
                        if ($scope.gridOptions.responsiveColumns.$title) {
                            template += "<div class='title-text'>";
                            responsiveCol = $scope.gridOptions.responsiveColumns.$title;
                            $scope.getResponsiveTemplate(responsiveCol);
                            template += '</div>';
                        }
                        if ($scope.gridOptions.responsiveColumns.$otherFields) {
                            template += "<div class='child-text'>";
                            responsiveCol = $scope.gridOptions.responsiveColumns.$otherFields;
                            if (Array.isArray(responsiveCol)) {
                                for (var j = 0; j < responsiveCol.length; j++) {
                                    $scope.getResponsiveTemplate(responsiveCol[j]);
                                    if (j < responsiveCol.length - 1) {
                                        template += "<i> " + seperator + " </i>";
                                    }
                                }
                            } else {
                                responsiveCol = $scope.gridOptions.responsiveColumns.$otherFields
                                $scope.getResponsiveTemplate(responsiveCol);
                            }
                            template += '</div>';
                        }
                        template += '</div>';
                        if ($scope.gridOptions.responsiveColumns.$rightField) {
                            template += "<div class='right-icon'>";
                            responsiveCol = $scope.gridOptions.responsiveColumns.$rightField;
                            $scope.getResponsiveTemplate(responsiveCol);
                            template += '</div>';
                        }
                        template += '</div>';
                    } else {
                        var primaryField = undefined;
                        var stringField = undefined;
                        for (var i = 0; i < $scope.gridOptions.gridColumns.length - 1; i++) {
                            var col = $scope.gridOptions.gridColumns[i];
                            if (col.primary) {
                                primaryField = true;
                                template += $scope.gridOptions.provideParentParameter ? ('<span ng-click="changeFilter(row,$index)">' + col.cellTemplate + '</span>') : ('<div><b>' + col.label + '</b>: ' + col.cellTemplate + '</div>'); //if we provideParentParameter , we do not want to see label---case on click of row of project dashboard,we have to notify other dashboard--Ritesh Bansal
                            } else if (col.ui == 'text' && stringField == undefined) {
                                stringField = $scope.gridOptions.provideParentParameter ? ('<span ng-click="changeFilter(row,$index)">' + col.cellTemplate + '</span>') : ('<b>' + col.label + '</b>: ' + col.cellTemplate);//if we provideParentParameter , we do not want to see label---case on click of row of project dashboard,we have to notify other dashboard-Ritesh Bansal
                                break;
                            } else if ((i == $scope.gridOptions.gridColumns.length - 2) && stringField == undefined && $scope.gridOptions.columns && $scope.gridOptions.columns.length > 0) {
                                stringField = $scope.gridOptions.columns[0].cellTemplate;
                            }
                        }
                        if (!primaryField && angular.isDefined(stringField)) {
                            template += '<div>' + stringField + '&nbsp;</div>';
                        }
                    }
                    template += '</div></div>';
                    iElement.append($compile(template)($scope));
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                }
            }
        }
    }
}]);

pl.directive('plGridFooterCell', ['$compile', '$document', '$timeout', function ($compile, $document, $timeout) {
    'use strict';
    return {
        link: function ($scope, iElement) {
            $scope.renderCell = function () {
                try {
                    if ($scope.col.cellTemplate && $scope.col.aggregate) {
                        var cellTemplate = "<div class='applane-grid-cell-inner app-overflow-hiiden app-white-space-nowrap'>" +
                            ($scope.col.footerCellTemplate || $scope.col.cellTemplate) +
                            "</div>";
                        iElement.html($compile(cellTemplate)($scope));

                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    }

                } catch (e) {
                    if ($scope.handleClientError) {
                        $scope.handleClientError(e);
                    }
                }
            }
            $scope.renderCell();
        }
    }
}]);

pl.directive('plGridCell', ['$compile', '$document', '$timeout', function ($compile, $document, $timeout) {
    'use strict';
    return {
        restrict: 'EA',
        replace: true,
        compile: function () {
            return{
                pre: function ($scope, iElement) {
                    $scope.$watch("row.editMode", function (newValue, oldValue) {
                        if (angular.isDefined(newValue)) {
                            /*here we have set tr height due to the flactuation, because of tr height increase in edit mode, during image upload--Rajit*/
                            var tr = iElement.closest('td').parent('tr');
                            tr.css({'height': tr.height() + 'px'});
                            if (newValue == true) {
                                $scope.editCell();
                            } else {
                                $scope.renderCell();
                            }
                        }
                    })
                    if (angular.isDefined($scope.row.entity) && angular.isDefined($scope.row.__group__) && $scope.row.entity.children) {
                        iElement.css({"border-right": "none", "outline": "none"});
                        iElement.removeClass('applane-grid-cell');
                        iElement.addClass('pl-parent-row-level-' + $scope.row.__group__);
                    }

                    if ($scope.gridOptions.userSorting) {
                        var flyingRow = $('.pl-row-drag-wrapper');
                        flyingRow.bind('mouseover', function (e) {
                            flyingRow.css({top: (e.pageY - 30)});
                        });
                        $scope.gridOptions.messageMap = {};
                        iElement.bind('mousedown', function (e) {
                            $scope.col.enableRowDrag = true;
                            $(iElement).addClass('pl-row-dragging');
                            $scope.gridOptions.sourceRowIndex = $scope.$parent.$index;
                        });
                        iElement.bind('mousemove', function (e) {
                            if ($scope.col.enableRowDrag) {
                                $(iElement).addClass('pl-row-dragging');
                                $('body').addClass('pl-no-select');
                                flyingRow.css({top: (e.pageY - 30)});
                                $scope.gridOptions.rowDraggingLabel = $scope.gridOptions.sourceRowIndex + 1;
                                $scope.gridOptions.rowDragging = true;
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                        })
                        iElement.bind('mouseup', function (e) {
                            if ($scope.col.enableRowDrag) {
                                $scope.gridOptions.targetRowIndex = $scope.$parent.$index;
                                $scope.reorderRows($scope.gridOptions.sourceRowIndex, $scope.gridOptions.targetRowIndex);
                                $scope.col.enableRowDrag = false;
                                $scope.gridOptions.rowDragging = false;
                                $('body').removeClass('pl-no-select');
                                $(iElement).removeClass('pl-row-dragging');
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                        });
                        $scope.reorderRows = function (srcIndex, targetIndex) {
                            try {
                                if (srcIndex !== targetIndex) {
                                    var srcRow = $scope.gridOptions.renderedRows[srcIndex];
                                    var targetRow = $scope.gridOptions.renderedRows[targetIndex];
                                    if ($scope.gridOptions.dataModel.query.$sort) {
                                        var sort = $scope.gridOptions.dataModel.query.$sort
                                        var keys = Object.keys(sort);
                                        var lastSortValue = undefined;
                                        var lastSortKey = undefined;
                                        if (keys && keys.length > 0) {
                                            lastSortKey = keys[keys.length - 1];
                                            lastSortValue = sort[lastSortKey];
                                        }
                                        var previousRow = $scope.gridOptions.renderedRows[targetIndex - 1];
                                        var nextRow = $scope.gridOptions.renderedRows[targetIndex + 1];
                                        var userSortingField = $scope.gridOptions.userSorting
                                        var targetValue = targetRow.entity[userSortingField];
                                        if (previousRow === undefined) {
                                            if (lastSortValue === -1) { // desc order
                                                srcRow.entity[userSortingField] = new Date().getTime();
                                            } else { // asc order
                                                srcRow.entity[userSortingField] = targetValue - 100;
                                            }
                                        } else if (nextRow === undefined) {
                                            if (lastSortValue === -1) {
                                                srcRow.entity[userSortingField] = targetValue - 100;
                                            } else {
                                                srcRow.entity[userSortingField] = new Date().getTime();
                                            }
                                        } else {
                                            if (srcIndex < targetIndex) {
                                                if (matchSortingFieldValues(nextRow, targetRow, sort)) {
                                                    var nextValue = nextRow.entity[userSortingField];
                                                    srcRow.entity[userSortingField] = (nextValue + targetValue) / 2;
                                                } else {
                                                    if (lastSortValue === -1) {
                                                        srcRow.entity[userSortingField] = targetValue - 100;
                                                    } else {
                                                        srcRow.entity[userSortingField] = targetValue + 100;
                                                    }
                                                }
                                            } else {
                                                if (matchSortingFieldValues(previousRow, targetRow, sort)) {
                                                    var previousValue = previousRow.entity[userSortingField];
                                                    srcRow.entity[userSortingField] = (previousValue + targetValue) / 2;
                                                } else {
                                                    if (lastSortValue === -1) {
                                                        srcRow.entity[userSortingField] = targetValue + 100;
                                                    } else {
                                                        srcRow.entity[userSortingField] = targetValue - 100;
                                                    }
                                                }
                                            }
                                        }
                                        // change the data corresponding to sorting fields

                                        var message = "";
                                        var sortingKeys = "";
                                        for (var i = 0; i < keys.length; i++) {
                                            var key = keys[i];
                                            sortingKeys += key + "-";
                                            var dotIndex = key.indexOf(".");
                                            var firstPart = key;
                                            if (dotIndex >= 0) {
                                                firstPart = key.substr(0, dotIndex);
                                            }
                                            var fieldDef = Utility.getField(firstPart, $scope.gridOptions.dataModel.metadata.fields);
                                            if (fieldDef) {
                                                if (!Utility.deepEqual(srcRow.entity[fieldDef.field], targetRow.entity[fieldDef.field])) {
                                                    var previousValue = Utility.resolveDot(srcRow.entity, key);
                                                    var newValue = Utility.resolveDot(targetRow.entity, key);
                                                    message += fieldDef.label + " - from  " + previousValue + " to " + newValue;
                                                    srcRow.entity[fieldDef.field] = targetRow.entity[fieldDef.field];
                                                }
                                            }
                                        }
                                        $scope.gridOptions.sharedOptions.saveOptions.editMode = true;
                                        if ($scope.gridOptions.messageMap[sortingKeys] === undefined && message.length > 0) {
                                            $scope.gridOptions.messageMap[sortingKeys] = true;
                                            var message = "Following values are getting changed of column " + message + ", Press Cancel to discard or Save to persist.";
                                            $scope.gridOptions.warningOptions.error = new Error(message);
                                        }
                                    }
                                    $scope.gridOptions.renderedRows.splice(srcIndex, 1);
                                    $scope.gridOptions.renderedRows.splice(targetIndex, 0, srcRow);
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                            } catch (e) {
                                if ($scope.handleClientError) {
                                    $scope.handleClientError(e);
                                }
                            }
                        }


                    }

                    $scope.renderCell = function () {
                        try {
                            if ($scope.col.$group && angular.isDefined($scope.row.__group__)) {
                                var groupIndex = $scope.row.__group__;

                                iElement.html($compile($scope.row.groupData)($scope));
                                iElement.attr("tabIndex", $scope.col.tabindex);
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }

                            } else {
                                //check, if row is groupby or not , if so, than we don't need to render the cellTemplate
                                if ($scope.col.cellTemplate && (!angular.isDefined($scope.row.__group__) || !$scope.row.entity.children)) {
                                    var cellTemplate = "<div class='applane-grid-cell-inner app-overflow-hiiden app-white-space-initial' ng-style='{{col.colStyle}}' ";
                                    if (angular.isDefined($scope.col.editableWhen)) {
                                        cellTemplate += " ng-show= '!row.editMode || !(" + $scope.col.editableWhen + ")' ";
                                    }
//                        if ($scope.gridOptions.$recursion && $scope.gridOptions.$recursion.$primaryColumn == $scope.col.field) {
                                    //when groupby and recursion apply together on data we add some padding to the parimaryColumn
//                            cellTemplate += "  ";
//                        }
                                    cellTemplate += ' >';
                                    if ($scope.gridOptions.$recursion && $scope.gridOptions.$recursion.$primaryColumn == $scope.col.field) {
                                        cellTemplate += '<div style=\'padding-left:' + $scope.row.level * 20 + 'px\;\' class="app-float-left">&nbsp;</div>' +
                                            '<div ng-if="!(row.entity.children) || (row.entity.children.length == 0) " style=\'padding-left:18px\;\' class="app-float-left">&nbsp;</div>' +
                                            ' <div ng-click="toggleTreeForChild(row, $parent.$parent.$index)" ng-if="row.entity.children && (row.entity.children.length > 0)" ng-class="{\'icon-minus\':gridOptions.$recursion.$expandLevel && !row.level}" pl-grid-group class="icon-plus pl-group-toggle-box app-float-left">&nbsp;</div>' +
                                            '<span class="primary-col"></span>';
                                    }

                                    cellTemplate += $scope.col.cellTemplate +
                                        "</div>";
                                    iElement.html($compile(cellTemplate)($scope));
                                    iElement.attr("tabIndex", $scope.col.tabindex);
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                            }

                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    iElement.bind('mouseover', function () {
                        $scope.col.mouseIn = true;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    });
                    iElement.bind('mouseout', function () {
                        $scope.col.mouseIn = false;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    });

                    var watch = undefined;
                    $scope.editCell = function (e) {
                        try {
                            if (angular.isDefined($scope.row.__group__)) {
                                return;
                            }
                            if ($scope.col.editableCellTemplate) {

                                var template = '';
                                if (angular.isDefined($scope.col.editableWhen) && $scope.col.editableWhen.length > 0) {
                                    template = "<div class='grid-edit-cell-template app-position-relative' ng-show='" + $scope.col.editableWhen + "'>" +
                                        $scope.col.editableCellTemplate +
                                        "</div>";
                                    iElement.append($compile(template)($scope));
                                } else {
                                    template = '<div class="grid-edit-cell-template app-position-relative">' +
                                        $scope.col.editableCellTemplate +
                                        '</div>';
                                    iElement.html($compile(template)($scope));

                                }
                                iElement.attr("tabIndex", "-1");
                                var inputElm = iElement.find('input')[0];
                                if (inputElm) {
                                    angular.element(inputElm).bind('focus', function ($event) {
                                        var mainGrid = '.main-grid';
                                        if ($scope.gridOptions.nested) {
                                            mainGrid = '.pl-form-wrapper .main-grid';
                                        }
                                        var gridElm = angular.element(mainGrid);
                                        var elmOffset = iElement.offset();
                                        var gridWidth = gridElm.width();
                                        if (elmOffset && gridWidth) {
                                            var elmLeft = iElement.offset().left;
                                            var gridSCrollLeft = gridElm.scrollLeft();
                                            if (elmLeft > (gridWidth)) {
                                                $scope.gridOptions.bodyScrollLeft = gridSCrollLeft + 200;
                                            } else if (elmLeft < 0) {
                                                gridSCrollLeft -= 200;
                                                gridSCrollLeft < 0 ? gridSCrollLeft = 0 : '';
                                                $scope.gridOptions.bodyScrollLeft = gridSCrollLeft;
                                            }
                                            if (!$scope.$$phase) {
                                                $scope.$apply();
                                            }
                                        }
                                    });
                                }

                                $scope.$on('$destroy', function ($event) {
                                    angular.element(inputElm).unbind('focus');
                                });
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    function matchSortingFieldValues(nextRow, targetRow, sort) {
                        var keys = Object.keys(sort);
                        var equal = true;
                        for (var i = 0; i < keys.length; i++) {
                            var key = keys[i];
                            if (key !== "_id") {
                                var dotIndex = key.indexOf(".");
                                if (dotIndex >= 0) {
                                    key = key.substr(0, dotIndex);
                                }
                                if (!Utility.deepEqual(nextRow.entity[key], targetRow.entity[key])) {
                                    equal = false;
                                    break;
                                }
                            }
                        }
                        return equal;
                    }


                    $scope.renderCell();

                    $scope.$on('$destroy', function ($event) {
                        iElement.unbind('mouseover');
                        iElement.unbind('mouseout');
                        iElement.unbind('mousedown');
                        iElement.unbind('mousemove');
                        iElement.unbind('mouseup');
                    });

                }
            }
        }
    }
}]);

pl.directive('plGridEditCellTemplate', [
    '$compile', '$timeout', function ($compile, $timeout) {
        return {
            restrict: 'E',
            compile: function () {
                return {
                    pre: function ($scope, iElement, attrs) {
                        var template = '<div class="grid-edit-cell-template app-position-relative">' +
                            $scope.col.editableCellTemplate +
                            '</div>';
                        iElement.html($compile(template)($scope));
//                        $scope.setEditMode(true);
//                        if (!$scope.$$phase) {
//                            $scope.$apply();
//                        }
                    },
                    post: function ($scope, iElement) {
                    }
                }
            }
        };
    }
]);

pl.directive('plGridHeader', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: 'A',
        scope: false,
        compile: function () {
            return {
                post: function ($scope, iElement) {
                    var template = "<table class='applane-grid-header pl-table-header' cellpadding='0' cellspacing='0'>" +
                        "       <tr>" +
                        "           <th ng-if='!gridOptions.headerColumns' pl-grid-header-cell ng-repeat='col in gridOptions.gridColumns' ng-style='col.style' rowspan='{{col.rowSpan}}' colspan='{{col.colSpan}}'></th>" +
                        "           <th ng-if='gridOptions.headerColumns' pl-grid-header-cell ng-repeat='col in gridOptions.headerColumns' ng-style='col.style'  rowspan='{{col.rowSpan}}' colspan='{{col.colSpan}}'></th>" +
                        "           <th ng-if='gridOptions.overflow' style='width:9px;border:none; min-width: 9px; padding:0;'>&nbsp;</th>" +
                        "       </tr>" +
                        "       <tr ng-if='gridOptions.subHeaderColumns'>" +
                        "           <th pl-grid-header-cell ng-repeat='col in gridOptions.subHeaderColumns'  ng-style='col.style' rowspan='{{col.rowSpan}}' colspan='{{col.colSpan}}' ></th>" +
                        "           <th ng-if='gridOptions.overflow' style='width:9px;border:none; min-width: 9px; padding:0;'>&nbsp;</th>" +
                        "       </tr>" +
                        "</table>" +
                        "<div id='{{gridOptions.uniqueViewId}}-col-resize' class='app-col-resize app-cursor-col-resize draggable' ></div>" +
                        "<div id='drag-{{gridOptions.uniqueViewId}}' ng-bind='gridOptions.dragLabel' ng-show='gridOptions.dragVisibility' class='drag'></div>";
                    iElement.append($compile(template)($scope));

                    if ($scope.gridOptions.headerFreeze) {
                        $scope.$watch('gridOptions.scrollLeft', function () {
                            $(iElement).scrollLeft($scope.gridOptions.scrollLeft);
                        });
                    }
                }
            }
        }
    };
}]);

pl.directive('plGridHeaderCell', [
    '$compile', '$timeout', function ($compile, $timeout) {
        'use strict';
        return {
            restrict: 'A',
            replace: true,
            compile: function () {
                return {
                    pre: function ($scope, iElement) {
                        var template = $scope.col.headerCellTemplate;
                        if ($scope.col.sortable) {
                            for (var i = 0; i < $scope.gridOptions.userPreferenceOptions.sortInfo.length; i++) {
                                var sortCol = $scope.gridOptions.userPreferenceOptions.sortInfo[i];
                                if (sortCol.field == $scope.col.field) {
                                    break;
                                }
                            }
                            var sortOptions = [
                                {label: 'Asc', onClick: 'onHeaderSort', value: 'Asc', when: true},
                                {label: 'Desc', onClick: 'onHeaderSort', value: 'Dsc', when: true},
                                {label: 'Reset', onClick: 'onHeaderSort', value: 'reset', when: 'col.value == "Asc" || col.value =="Dsc"  '}
                            ]
                            $scope.col.headerOptions = sortOptions;
                        }
                        if ($scope.col.headerCellTemplate) {
                            template = '<div class="flex-box app-position-relative block">' + $scope.col.headerCellTemplate + "<div ng-if='col.sortable' ng-mouseover='mousemoveOnHeader()' class='pl-col-options'><div ng-click='onHeaderSort(\"Asc\")' ng-class='{\"app-color-black\":col.value ==\"Asc\"}'><i class='icon-caret-up'></i></div><div ng-click='onHeaderSort(\"Dsc\")' ng-class='{\"app-color-black\":col.value ==\"Dsc\"}'><i class='icon-caret-down'></i></div></div></div>"
                        }
                        if (!template) {
                            template = "<div ng-style='col.style'>&nbsp;</div>";
                        }
                        var headerCell = $compile(template)($scope);
                        iElement.append(headerCell);
                    },
                    post: function ($scope, iElement) {
                        $scope.mousemoveOnHeader = function () {
                            $scope.col.mouseIn = true;
                        }
                        $timeout(function () {
                            var offset = iElement.offset();
                            var headerWidth = offset.left + iElement.outerWidth();
                            if (headerWidth >= $(window).width()) {
                                for (var i = 0; i < $scope.gridOptions.gridColumns.length; i++) {
                                    var col = $scope.gridOptions.gridColumns[i];
                                    if (col.flexible) {
                                        col.style = col.style || {};
                                        col.style.width = '100px';
                                    }
                                }
                            }
                        }, 0);
                        var id = $scope.gridOptions.uniqueViewId + '-col-resize';
                        iElement.bind('mousemove', function (e) {
                            if ($scope.col.sortable) {
                                $scope.mousemoveOnHeader();
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                            if ($scope.col.freeze) {
                                return;
                            }
                            var mousePosition = e.pageX;
                            var left = iElement.offset().left;
                            var width = iElement.outerWidth();
                            var totalWidth = (left + width);

                            if (angular.isUndefined($scope.col[$scope.gridOptions.colSequenceField])) {
                                $scope.checkMouseOnHeader();
                                return;
                            }


                            if ($scope.gridOptions.fieldResize && !$scope.gridOptions.autoWidthColumn) {
//                                $scope.resizeCol(e, left, mousePosition, totalWidth, width, $scope.col);
                                if ((mousePosition >= (totalWidth - 5)) && (mousePosition <= (totalWidth + 5))) {
                                    $('#' + id).css({'left': (totalWidth - 10) + 'px', 'top': iElement.offset().top + 'px', 'height': iElement.height(), width: '30px'});
                                    $scope.setCurrentHeaderCell({element: iElement, col: $scope.col});
                                    $('#' + id).bind("mousedown", function () {
                                        $scope.gridOptions.resizeEnable = true;
                                        $scope.resizeCol(e, left, mousePosition, totalWidth, width, $scope.col);
                                        $('#' + id).bind("mouseup", function (e) {
                                            $scope.gridOptions.resizeEnable = false;
                                            if ($scope.gridOptions.handleFieldDragChanges) {
                                                $scope[$scope.gridOptions.handleFieldDragChanges]($scope.col, 'resize');
                                            }
                                            if (!$scope.$$phase) {
                                                $scope.$apply();
                                            }
                                        });
                                    });
                                } else {
                                    $scope.gridOptions.resize = false;
                                }
                            }
                            if ($scope.gridOptions.leftDownKeyPress) {
                                $scope.col.dragging = true;
                                left = (mousePosition + 5) + "px"; // because padding of 5px on th
                                var outerHeight = iElement.outerHeight() + "px";
                                var divElement = $("#drag-" + $scope.gridOptions.uniqueViewId);
                                divElement.css({left: left, height: outerHeight});
                                $scope.gridOptions.dragVisibility = true;
                                divElement.bind("mousemove", function (e) {
                                    var coOrdinates = e.pageX;
                                    var left = (coOrdinates + 25) + "px";
                                    divElement.css({left: left});
                                });
                                if (!$scope.$$phase) {
                                    $scope.$apply();
                                }
                            }
                        });

                        iElement.bind('mousedown', function () {
                            if (angular.isUndefined($scope.col[$scope.gridOptions.colSequenceField]) || !$scope.gridOptions.fieldDragable || $scope.col.freeze) {
                                return;
                            }
                            $scope.gridOptions.leftDownKeyPress = true;
                            $scope.gridOptions.resizeEnable = false;
                            $scope.gridOptions.dragLabel = $scope.col.label;
                            $scope.gridOptions.srcIndex = $scope.$index;
                            var outerWidth = iElement.outerWidth() + "px";
                            var divElement = $("#drag-" + $scope.gridOptions.uniqueViewId);
                            divElement.css({width: outerWidth});
                        });

                        $scope.colOptions = function (e) {
                            try {
                                if (!$scope.col.dragging && !($scope.gridOptions.resizeEnable) && $scope.col.sortable) {
                                    var editHeaderOptionsTemplate = '<div class="app-white-space-nowrap" >' +
                                        '                               <div class="pl-menu-group-label pl-overflow-y-scroll app-max-height-two-hundred" style="text-align: left" >' +
                                        "                                   <span style='display: block;' class='app-row-action app-padding-five-px' ng-repeat='headerOption in col.headerOptions' ng-show='{{headerOption.when}}' ng-click='onColumnOptionsClick(headerOption)'>" +
                                        "                                       <label class='app-cursor-pointer' ng-bind='headerOption.label' style='margin: 0;'></label>" +
                                        "                                   </span>" +
                                        '                               </div>' +
                                        '                           </div>';
                                    var popupScope = $scope.$new();
                                    var p = new Popup({
                                        autoHide: true,
                                        deffered: true,
                                        escEnabled: true,
                                        hideOnClick: true,
                                        addInElement: true,
                                        html: $compile(editHeaderOptionsTemplate)(popupScope),
                                        scope: popupScope,
                                        element: e.target
                                    });
                                    p.showPopup();
                                    $scope.onColumnOptionsClick = function (header) {
                                        try {
                                            if (header.onClick) {
                                                $scope[header.onClick](header.value);
                                            }
                                        } catch (e) {
                                            if ($scope.handleClientError) {
                                                $scope.handleClientError(e);
                                            }
                                        }
                                    }
                                }
                            } catch (e) {
                                if ($scope.handleClientError) {
                                    $scope.handleClientError(e);
                                }
                            }
                        }

                        $scope.onHeaderSort = function (sortOrder) {
                            try {
                                $scope.col.value = sortOrder;
                                $scope.gridOptions.userPreferenceOptions.sortInfo = [];
                                if (($scope.col.value == 'reset')) {
                                    $scope.gridOptions.userPreferenceOptions.removeSortInfo = $scope.gridOptions.userPreferenceOptions.removeSortInfo || [];
                                    $scope.gridOptions.userPreferenceOptions.removeSortInfo.push($scope.col);
                                } else {
                                    $scope.gridOptions.userPreferenceOptions.lastSelectedInfo = 'Sort';
                                    $scope.gridOptions.userPreferenceOptions.sortInfo.push($scope.col);
                                    $scope.gridOptions.userPreferenceOptions.selectedType = 'Sort';
                                    if ($scope.gridOptions.userPreferenceOptions.typeMenuGroupOptions) {
                                        $scope.gridOptions.userPreferenceOptions.typeMenuGroupOptions.label = 'Sort';
                                    }
                                }
                                $scope.gridOptions.userPreferenceOptions.apply = !$scope.gridOptions.userPreferenceOptions.apply;
                            } catch (e) {
                                if ($scope.handleClientError) {
                                    $scope.handleClientError(e);
                                }
                            }
                        }

                        iElement.bind('mouseup', function (e) {
                            if ($scope.col.__systemcolumn__ || angular.isUndefined($scope.col[$scope.gridOptions.colSequenceField]) || !$scope.gridOptions.fieldDragable || $scope.col.freeze || $scope.gridOptions.resizeEnable) {
                                return;
                            }
                            $scope.col.dragging = undefined;
                            $scope.gridOptions.dragVisibility = false;
                            $scope.gridOptions.leftDownKeyPress = false
                            $scope.gridOptions.targetIndex = $scope.$index;
                            var columnChanges = $scope.columnReOrdering($scope.gridOptions.srcIndex, $scope.gridOptions.targetIndex);
                            if ($scope.gridOptions.handleFieldDragChanges && columnChanges) {
                                for (var i = 0; i < columnChanges.length; i++) {
                                    var colChange = columnChanges[i];
                                    $scope[$scope.gridOptions.handleFieldDragChanges](colChange, 'drag');

                                }

                            }
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        });

                        iElement.bind('mouseout', function () {
                            $scope.col.mouseIn = false;
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                        });

                        $scope.checkMouseOnHeader = function () {
                            try {
                                if ($scope.gridOptions.dragVisibility) {
                                    $scope.gridOptions.dragVisibility = false;
                                    $scope.gridOptions.leftDownKeyPress = false;
                                    $('body').unbind('mouseup');
                                    if (!$scope.$$phase) {
                                        $scope.$apply();
                                    }
                                }
                            } catch (e) {
                                if ($scope.handleClientError) {
                                    $scope.handleClientError(e);
                                }
                            }
                        }
                        $scope.resizeCol = function (e, left, mousePosition, totalWidth, width, col) {
                            try {
                                if ($scope.gridOptions.leftDownKeyPress) {
                                    return;
                                }
                                if ((mousePosition >= (totalWidth - 5)) && (mousePosition <= (totalWidth + 5))) {
                                    $('#' + id).css({'left': (totalWidth - 10) + 'px', 'top': iElement.offset().top + 'px', 'height': iElement.height()});
                                    $scope.setCurrentHeaderCell({element: iElement, col: $scope.col});
                                    $('body').bind('mousemove', function (e) {
                                        var headerCell = $scope.getCurrentHeaderCell();
                                        if ($scope.gridOptions && headerCell && $scope.gridOptions.resizeEnable == true) {
                                            var elementLeft = headerCell.element.offset().left;
                                            var width = e.pageX - elementLeft;
                                            if (width > 50) {
                                                headerCell.element.width(width);
                                                headerCell.col.style.width = width + 'px';
                                                $('#' + id).css({'left': (elementLeft + width - 10) + 'px'});
                                                if (!$scope.$$phase) {
                                                    $scope.$apply();
                                                }
                                            }
                                        }
                                    });
                                    $('body').bind('mouseup', function () {
                                        if (!$scope.gridOptions || !$scope.gridOptions.resizeEnable) {
                                            return;
                                        }
                                        $scope.gridOptions.resizeEnable = false;
                                        if ($scope.gridOptions.handleFieldDragChanges) {
                                            $scope[$scope.gridOptions.handleFieldDragChanges](col, 'resize');
                                        }
                                        if (!$scope.$$phase) {
                                            $scope.$apply();
                                        }
                                        $('body').unbind("mousemove");
                                        $('body').unbind('mouseup');
                                    });


                                } else {
                                    $scope.gridOptions.resize = false;
                                }
                            } catch (e) {
                                if ($scope.handleClientError) {
                                    $scope.handleClientError(e);
                                }
                            }
                        }
                        $scope.$on('$destroy', function ($event) {
                            iElement.unbind('mouseover');
                            iElement.unbind('mouseout');
                            iElement.unbind('mousedown');
                            iElement.unbind('mousemove');
                            iElement.unbind('mouseup');
                        });

                    }
                };
            }
        };
    }
]);

pl.directive('plGridGroup', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: 'A',
        link: function (scope, elm, attr, ngModelCtrl) {
            elm.bind('click', function () {
                if (elm.hasClass('icon-minus')) {
                    elm.removeClass('icon-minus');
                    elm.addClass('icon-plus');
                } else {
                    elm.removeClass('icon-plus');
                    elm.addClass('icon-minus');
                }

            });
        }
    };
}]);

pl.directive("plGridSetFieldVisibility", ["$compile", function ($compile) {
    'use strict';
    return {
        restrict: "E",
        replace: true,
        template: "<div class='pl-set-grid-visibility'>" +
            "          <div ng-repeat='col in gridOptions.columns'>" +
            "              <span><input type='checkbox' ng-model='col.visibilityForm' ng-change='selectField(col)'></span>" +
            "              <span ng-bind='col.label'></span>" +
            "          </div>" +
            "      </div>",
        compile: function () {
            return {

                post: function ($scope, iElement) {
                    $scope.selectField = function (field) {
                        var title = "plGridSetFieldVisibility in pl.grid";
                        var message = JSON.stringify(field);
                        $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
                    }
                }
            };
        }
    };
}]);

pl.directive('plResize', ['$compile', function ($compile) {
    return{
        restrict: 'A',
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    iElement.bind('click', function () {
                        var isimageToggle = iElement.hasClass('pl-transform-180')
                        if (isimageToggle) {
                            iElement.removeClass('pl-transform-180');
                        } else {
                            iElement.addClass('pl-transform-180')
                        }
                    });
                }
            }
        }
    }
}]);
