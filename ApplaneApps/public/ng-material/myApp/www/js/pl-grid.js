/***** move to app-component.js to generate minified version for before commit*******/
var pl = (pl === undefined) ? angular.module('starter.controllers', ['ngMaterial', 'ngMessages']) : pl;

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
                var title = "delete in pl.grid";
                var message = "No row found for delete";
                $scope.gridOptions.warningOptions.error = new Error(message + "-" + title);
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
            if ($scope.gridOptions.resizeV) {
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

                    $scope.rowActionPopUp = function ($event, row) {
                        try {
                            var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' >" +
                                "   <div ng-repeat='rowAction in gridOptions.rowActions' >" +
                                "       <div ng-if='!rowAction.when' ng-bind='rowAction.label' class='app-row-action app-cursor-pointer app-padding-five-px' ng-click='rowActionOptionClick($index, rowAction)'></div>" +
                                "       <div ng-if='rowAction.when' ng-show='{{rowAction.when}}' ng-bind='rowAction.label' class='app-row-action app-cursor-pointer app-padding-five-px' ng-click='rowActionOptionClick($index, rowAction)'></div>" +
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
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
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


                            for (var i = 0; i < colCount; i++) {
                                if (columns[i].autoWidthColumn) {
                                    delete columns[i].width;
                                    $scope.gridOptions.autoWidthColumn = true;
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
                                if ($scope.gridOptions.autoWidthColumn) {
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
                                            headerColWidth += 9;
                                        }
                                        var totalChildCol = $scope.gridOptions.headerColumns[i].subColumns.length;
                                        var childWidth = Math.round(headerColWidth / totalChildCol) - 9;
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
                    $scope.setCurrentRow = function (entity, fireDetail) {
                        try {
                            var dataRowIndex = $scope.getDataMappingKey(entity, $scope.gridOptions.dataModel);
                            $scope.gridOptions.currentRow = entity;
                            $scope.gridOptions.sharedOptions.currentRow = entity;
                            $scope.gridOptions.sharedOptions.currentRowIndex = dataRowIndex;
                            $scope.gridOptions.sharedOptions.currentRowChanged = !$scope.gridOptions.sharedOptions.currentRowChanged;
                             if(fireDetail){
                                 $scope.rowActionOptionClick(0);
                             }
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
                        if ((!$scope.gridOptions.childrenAutoExpanded) && $scope.gridOptions.$recursion && $scope.gridOptions.$recursion.$expandLevel && $scope.gridOptions.renderedRows.length > 0) {
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
                    function getResponsiveCellTemplate(gridColumns, responsiveCol) {
                        if (!gridColumns) {
                            return;
                        }
                        for (var i = 0; i < gridColumns.length; i++) {
                            var gridCol = gridColumns[i];
                            var dislpayRenderer = gridColumns[i].field;
                            if (responsiveCol == gridCol.field) {
                                if (gridCol.type == 'fk' && gridCol.displayField) {
                                    dislpayRenderer += '.' + gridCol.displayField;
                                } else if(gridCol.type == 'date'){
                                    dislpayRenderer +=' | date ';
                                }
                                return dislpayRenderer;
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
                        if ($scope.gridOptions.gridColumns && $scope.gridOptions.gridColumns.length > 0) {

                            $scope.gridOptions.responsiveCellTemplate = $scope.gridOptions.responsiveCellTemplate || [];
                            $scope.gridOptions.responsiveCellTemplate = '';
                            if ($scope.gridOptions.responsiveColumns) {
                                var userDB = ApplaneDB.connection("userdb");
                                var token = userDB.token;
                                var seperator = $scope.gridOptions.responsiveColumns.seperator || '|';
                                var responsiveCol = undefined;
                                if($scope.gridOptions.responsiveColumns.$image){
                                    $scope.gridOptions.avatarEnable = true;
                                    $scope.gridOptions.responsiveCellTemplate += "<img ng-src='/rest/file/download?token=" + token + "&filekey={{row.entity." + $scope.gridOptions.responsiveColumns.$image + ".key}}' />";
                                }
                                if ($scope.gridOptions.responsiveColumns.$title) {
                                    responsiveCol = $scope.gridOptions.responsiveColumns.$title;
                                    if (responsiveCol.html) {
                                        responsiveCol.html = (responsiveCol.html).replace(/\$/g, "row.entity.").replace(/\'/g, "\"");
                                        $scope.gridOptions.responsiveCellTemplate += responsiveCol.html;
                                    } else {
                                        $scope.gridOptions.responsiveCellTemplate += '<h2 style="float:left;" ng-bind="row.entity.' + getResponsiveCellTemplate($scope.gridOptions.gridColumns, responsiveCol) + '"></h2>';
                                    }
                                }
                                if ($scope.gridOptions.responsiveColumns.$otherFields) {
                                    responsiveCol = $scope.gridOptions.responsiveColumns.$otherFields;
                                    $scope.gridOptions.responsiveCellTemplate += '<p style="clear:both;">';
                                    if (Array.isArray(responsiveCol)) {
                                        for (var j = 0; j < responsiveCol.length; j++) {
                                            $scope.gridOptions.responsiveCellTemplate += '<span ng-bind="row.entity.' + getResponsiveCellTemplate($scope.gridOptions.gridColumns, responsiveCol) + '"></span>';
                                            if (j < responsiveCol.length - 1) {
                                                template += "<i> " + seperator + " </i>";
                                            }
                                        }

                                    } else {
                                        $scope.gridOptions.responsiveCellTemplate += '<span ng-bind="row.entity.' + getResponsiveCellTemplate($scope.gridOptions.gridColumns, responsiveCol) + '"></span>';
                                    }
                                    $scope.gridOptions.responsiveCellTemplate += '</p>';
                                }
                                if ($scope.gridOptions.responsiveColumns.$rightField) {
                                    $scope.gridOptions.responsiveCellTemplate += '<p style="position:absolute; right:10px;max-width:100px; top:15px;" ng-bind="row.entity.' + getResponsiveCellTemplate($scope.gridOptions.gridColumns, $scope.gridOptions.responsiveColumns.$rightField) + '"></p>';
                                }
                            } else {
                                var primaryColIndex = 0;
                                for (var i = 0; i < $scope.gridOptions.columns.length; i++) {
                                    if ($scope.gridOptions.columns[i].primary) {
                                        primaryColIndex = i;
                                    }
                                }
                                $scope.gridOptions.responsiveCellTemplate = '<h2 style="float:left;" ng-bind="row.entity.' + getResponsiveCellTemplate($scope.gridOptions.columns, $scope.gridOptions.columns[primaryColIndex].field)+'"></h2>';
                            }


                        }
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
                                "                               <td class='pl-responsive-col' > <a ng-click='changeCurrentRow(row, $index); rowActionPopUp($event,row)' ng-class='{\"row-sptr\":!gridOptions.responsiveColumns}' class='pl-responsive-link'><pl-responsive-cell></pl-responsive-cell></a></td>" +
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
//                        iElement.append(($compile)(template)($scope));
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
                    var template = '<ion-list show-delete="false" show-reorder="false" can-swipe="false">' +
                        '    <ion-item ng-repeat="row in gridOptions.renderedRows" ng-click="setCurrentRow(row.entity, true)" ng-class="{\'item-thumbnail-left\':gridOptions.avatarEnable}"  class="">' +
                                $scope.gridOptions.responsiveCellTemplate +
                        '        <ion-option-button class="button-positive" ng-click="share(row)">' +
                        '        Delete' +
                        '        </ion-option-button>' +
                        '        <ion-option-button class="button-info" ng-click="edit(row)">' +
                        '        Edit' +
                        '        </ion-option-button>' +
                        '        <ion-delete-button class="ion-minus-circled" ng-click="menu.splice($index, 1)">' +
                        '        </ion-delete-button>' +
                        '        <ion-reorder-button class="ion-navicon" on-reorder="reorderItem(row, $fromIndex, $toIndex)">' +
                        '        </ion-reorder-button>' +
                        '    </ion-item>' +
                        '</ion-list>';

                    iElement.append($compile(template)($scope));
                }
            }
        }
    };
}]);

