/***** move to app-models.js to generate minified version for before commit*******/
var pl = (pl === undefined) ? angular.module('pl', [ 'ngRoute', 'ngCookies', 'ngAnimate', 'ngSanitize', 'mgcrea.ngStrap']) : pl;

/*************************************Controller********************************************************************/

pl.controller('pl-form-controller', function ($scope, $compile, $parse) {
    try {
        if (!$scope.formOptions.alertMessageOptions) {
            $scope.formOptions.alertMessageOptions = {};
            $scope.$watch("formOptions.alertMessageOptions.message", function (newMess) {
                if ($scope.formOptions.alertMessageOptions && $scope.formOptions.alertMessageOptions.message) {
                    //open a popup here
                    alert($scope.formOptions.alertMessageOptions.title + "\n" + $scope.formOptions.alertMessageOptions.message);
                }
            })
        }

        if (!$scope.formOptions.warningOptions) {
            $scope.formOptions.warningOptions = {};
            $scope.$watch("formOptions.warningOptions.warnings", function (newWarnings) {
                if ($scope.formOptions.warningOptions && $scope.formOptions.warningOptions.warnings && $scope.formOptions.warningOptions.warnings.length > 0) {
                    //open a popup here
                    alert($scope.formOptions.warningOptions.title + "\n" + JSON.stringify($scope.formOptions.warningOptions.warnings));
                }
            })
        }

        $scope.toolBarOptions = {};
        $scope.toolBarOptions.bottom = {left: [], center: [], right: []};
        $scope.toolBarOptions.top = {left: [], center: [], right: []};
        $scope.toolBarOptions.header = {left: {}, center: [], right: []};
        $scope.toolBarOptions.header.left.rHeaderClass = 'flex-1 app-min-width-220px';
        var showResizeControl = $scope.formOptions.viewResize !== undefined ? $scope.formOptions.viewResize : true;
        if (showResizeControl && $scope.formOptions.parentSharedOptions) {
            $scope.toolBarOptions.header.center.push({template: "<div ng-click=\"resize('left')\" ng-hide='formOptions.sharedOptions.viewPosition == \"full\"' ng-class='{\"pl-transform-180\":formOptions.sharedOptions.viewPosition != \"right\"}'  class=\"pl-resize-view app-cursor-pointer\"><i class=\"icon-double-angle-left\"></i></div>"});
        }

        if ($scope.formOptions.showLabel) {
            $scope.toolBarOptions.header.center.push({template: '<span ng-class=\'{"menu-align-margin":formOptions.sharedOptions.viewPosition == \"full\"}\' class="app-float-left pl-panel-label  app-padding-five-px app-font-size-sixteen-px app-font-weight-bold">' +
                '   <span  ng-bind="formOptions.label"></span>' +
                '   <span ng-if="formOptions.primaryFieldInfo && formOptions.primaryFieldInfo.label">' +
                '       <span>(<span ng-bind="formOptions.primaryFieldInfo.label"></span>)</span>' +
                '   </span>' +
                '</span>'});
        }

        if ($scope.formOptions.navigation) {
            $scope.toolBarOptions.top.right.push({template: '<div class="flex-box app-font-weight-bold app-navigation app-border-right-white app-padding-left-five-px app-padding-right-five-px app-text-align-center">' +
                '<div class="app-height-thirty-px app-float-left app-width-twenty-px app-cursor-pointer" ng-click="previous()" ng-show="formOptions.sharedOptions.pageOptions.hasPrevious"><i class="icon-chevron-left"></i></div>' +
                '<div ng-bind="formOptions.sharedOptions.pageOptions.label" class="app-float-left"></div>' +
                '<div class="app-height-thirty-px app-float-left app-width-twenty-px app-cursor-pointer" ng-click="next()" ng-show="formOptions.sharedOptions.pageOptions.hasNext" ><i class="icon-chevron-right"></i></div>' +
                '</div>'});
        }
        if ($scope.formOptions.close) {
            $scope.toolBarOptions.top.right.push({template: '<div ng-click="close()" class="pl-cancel-btn app-cursor-pointer responsive" title="Close">Cancel</div>'});
        }
        $scope.toolBarOptions.header.right.push({template: '<div ng-click="close()" ng-show="formOptions.close || formOptions.sharedOptions.saveOptions.editMode" class="pl-cancel-btn app-cursor-pointer" title="Close">Cancel</div>', class: "flex-1 app-text-align-right"});
        if ($scope.formOptions.saveAndClose) {
            $scope.toolBarOptions.top.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text responsive" ng-click="close()"><i class="icon-remove"></i></div>'});
            $scope.toolBarOptions.header.right.push({template: '<div class="app-float-left pl-close-btn pl-top-label-text" ng-click="close()"><i class="icon-remove"></i></div>'});
        }
        if ($scope.formOptions.save) {
            $scope.formOptions.saveActions = [
                {onClick: 'saveAndNew', template: "<span class='app-float-left' >Save and new</span>", title: "Save and new", isShow: 'formOptions.insert'},
                {onClick: 'saveAndClose', template: "<span class='app-float-left'>Save and close</span>", title: "Save and close", isShow: true}
            ];
            if ($scope.formOptions.saveLabel) {
                $scope.toolBarOptions.top.right.push({template: '<div ng-show="formOptions.sharedOptions.saveOptions.editMode && formOptions.save" class="app-cursor-pointer pl-letter-spacing ng-scope responsive">' +
                    '<span ng-click="saveAndRefresh()" class="btn-blue default-save" ng-bind="formOptions.saveLabel" style="border-radius: 3px;"></span>' +
                    '</div>'});
                $scope.toolBarOptions.header.right.push({template: '<div ng-show="formOptions.sharedOptions.saveOptions.editMode && formOptions.save" class="app-cursor-pointer pl-letter-spacing ng-scope">' +
                    '<span ng-click="saveAndRefresh()" class="btn-blue default-save" ng-bind="formOptions.saveLabel" style="border-radius: 3px;"></span>' +
                    '</div>'});
            } else {
                $scope.toolBarOptions.top.right.push({template: '<div ng-show="formOptions.sharedOptions.saveOptions.editMode && formOptions.save" class="app-cursor-pointer pl-letter-spacing ng-scope responsive">' +
                    '<span ng-click="saveAndRefresh()" class="btn-blue default-save">Save</span>' +
                    '<span class="btn-blue custom-save" ng-click="saveAndEditActionPopup($event, \'formOptions.saveActions\')">' +
                    '<i class="icon-caret-down"> </i>' +
                    '</span>' +
                    '</div>'});
                $scope.toolBarOptions.header.right.push({template: '<div ng-show="formOptions.sharedOptions.saveOptions.editMode && formOptions.save" class="app-cursor-pointer pl-letter-spacing ng-scope">' +
                    '<span ng-click="saveAndRefresh()" class="btn-blue default-save">Save</span>' +
                    '<span class="btn-blue custom-save" ng-click="saveAndEditActionPopup($event, \'formOptions.saveActions\')">' +
                    '<i class="icon-caret-down"> </i>' +
                    '</span>' +
                    '</div>'});
            }
        }
        if ($scope.formOptions.edit) {
            $scope.toolBarOptions.top.right.push({template: '<div ng-click="edit()" title="Edit" ng-show="!formOptions.sharedOptions.saveOptions.editMode" class="btn-blue app-cursor-pointer pl-letter-spacing responsive">Edit</div>'});
            $scope.toolBarOptions.header.right.push({template: '<div ng-click="edit()" title="Edit" ng-show="!formOptions.sharedOptions.saveOptions.editMode" class="btn-blue app-cursor-pointer pl-letter-spacing">Edit</div>'});
        }

        if ($scope.formOptions.headerActions && $scope.formOptions.headerActions.length > 0) {
            $scope.toolBarOptions.header.right.push({template: '<div ng-click="parentHeaderActionPopUp($event)" class="pl-cancel-btn app-cursor-pointer" title="Actions"><span><i class="icon-reorder"></i><i class="icon-caret-down" style="padding-left: 3px;"> </i></div>', class: "app-text-align-right"});
        }


        $scope.parentHeaderActionPopUp = function ($event) {
            try {
                var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' >" +
                    "<div ng-repeat='action in formOptions.headerActions' class='app-row-action app-cursor-pointer' ng-show='{{action.when}}'>" +
                    "   <div ng-if='action.href' class='app-padding-five-px'><a href='{{action.href}}' target='_blank' ng-bind='action.label' style='text-decoration: none; color: #58595b;'></a></div>" +
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
        };
        $scope.multiRowActionOptionClick = function (newRownActionIndex, $event) {
            try {
                var multiRowAction = $scope.formOptions.headerActions[newRownActionIndex];
                var clone = angular.copy(multiRowAction);
                clone.sharedOptions = $scope.formOptions.sharedOptions;
                if (clone.onClick) {
                    $scope[clone.onClick](clone, $event);
                } else {
                    var title = "multiRowActionOptionClick in pl.grid";
                    var message = "No onclick defined in " + JSON.stringify(multiRowAction);
                    $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                }
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        };

        $scope.closeAndNew = function () {
            try {
                $scope.close();
                $scope.formOptions.parentSharedOptions.insertFromPanel = !$scope.formOptions.parentSharedOptions.insertFromPanel;
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }

        $scope.moveToNew = function () {
            if ($scope.formOptions.parentSharedOptions && $scope.formOptions.parentSharedOptions.insertInfo && (!$scope.formOptions.selfInsertView)) {
                $scope.formOptions.parentSharedOptions.insertInfo.insert = {saveOptions: {editMode: true}, addNewRow: true, deAttached: true};
            } else {
                $scope.formOptions.sharedOptions.insertInfo.insert = {editMode: true, addNewRow: true, deAttached: true};
            }
            if (!$scope.$$phase) {
                $scope.$apply();
            }
        }

        //in case of saving confirm we get warning options error, which display proceed to save , on click of this we are calling this call back function, which recall the same saving method -- Rajit garg 27-mar-15
        var confirmFunction = function () {
            var options = {"confirmUserWarning": true};
            if ($scope.view.viewOptions.saveType === "saveAndNew") {
                $scope.saveAndNew(options);
            }
            if ($scope.view.viewOptions.saveType === "saveAndClose") {
                $scope.saveAndClose(options);
            }
            if ($scope.view.viewOptions.saveType === "saveAndRefresh") {
                $scope.saveAndRefresh(options);
            }
        };
        $scope.view.viewOptions.confirmFunction = confirmFunction;

        $scope.saveAndNew = function (options) {
            try {
                options = options || {};
                options["$fields"] = 1;
                //defining saveType require in case of saving confirm using warning options , so that we call the same saving method again  -- Rajit garg 27-mar-15
                $scope.view.viewOptions.saveType = "saveAndNew";
                $scope.save(options).then(function () {
                    $scope.moveToNew();
                })
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }
        $scope.saveAndClose = function (options) {
            try {
                $scope.view.viewOptions.saveType = "saveAndClose";
                var savePromise = $scope.save(options);
                if (!savePromise) {
                    return;
                }
                savePromise.then(function () {
                    if ($scope.formOptions.parentSharedOptions && $scope.formOptions.parentSharedOptions.insertInfo) {
                        delete $scope.formOptions.parentSharedOptions.insertInfo.insert;
                    }
                    $scope.close();
                    if (!$scope.$$phase) {
                        $scope.$apply();
                    }
                })
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }

        $scope.saveAndRefresh = function (options) {
            try {
                options = options || {};
                options["$fields"] = 1;
                $scope.view.viewOptions.saveType = "saveAndRefresh";
                var p = $scope.save(options);
                if (!p) {
                    return;
                }
                p.then(function (result) {
                    try {
                        var dataToShow = undefined;
                        if (result && result.$insert && result.$insert.length == 1) {
                            dataToShow = result.$insert[0];
                        } else if (result && result.$update && result.$update.length > 0) {
                            dataToShow = result.$update[result.$update.length - 1];
                        } else if (result && result.$upsert && result.$upsert.length > 0) {
                            dataToShow = result.$upsert[result.$upsert.length - 1];
                        }
                        if (!dataToShow) {
                            $scope.moveToNew();
                            return;
                        }
                        //NOTE: if form view is referredView than we dont refresh its parent, for this we check refreshParentInBackground.
                        if ($scope.formOptions.parentSharedOptions && $scope.formOptions.parentSharedOptions.insertInfo && !($scope.formOptions.refreshParentInBackground == false) && (!$scope.formOptions.selfInsertView)) {
                            $scope.formOptions.parentSharedOptions.insertInfo.insert = {editMode: false, data: [dataToShow], deAttached: true, watchParent: true, refreshDataOnLoad: false};
                            $scope.formOptions.sharedOptions.saveOptions.editMode = false;
                        } else {
                            $scope.formOptions.sharedOptions.saveOptions.editMode = false;
                            $scope.formOptions.sharedOptions.insertInfo.insert = {data: [dataToShow], refreshDataOnLoad: false};
                        }


                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    } catch (e) {
                        if ($scope.handleClientError) {
                            $scope.handleClientError(e);
                        }
                    }
                })
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }

        $scope.$watch("formOptions.sharedOptions.validations", function (validations) {
            if (angular.isDefined(validations)) {
                var row = $scope.row;
                for (var i = 0; i < validations.length; i++) {
                    var validation = validations[i];
                    if (Utility.deepEqual(validation._id, row.entity._id)) {
                        row.validations = validation;
                        break;
                    }
                }
            }
        });

        $scope.next = function () {
            $scope.formOptions.sharedOptions.pageOptions.cursor = $scope.formOptions.sharedOptions.pageOptions.cursor + $scope.formOptions.sharedOptions.pageOptions.pageSize;
        }

        $scope.previous = function () {
            $scope.formOptions.sharedOptions.pageOptions.cursor = $scope.formOptions.sharedOptions.pageOptions.cursor - $scope.formOptions.sharedOptions.pageOptions.pageSize;
        }

        $scope.save = function (options) {
            try {
                if ($scope.formOptions.saveFn) {
                    $scope.formOptions.dataModel.getUpdatedData().then(function (updatedData) {
                        $scope.formOptions.saveFn(updatedData);

                    }).fail(function (err) {
                        $scope.formOptions.warningOptions.error = err;
                        if (!$scope.$$phase) {
                            $scope.$apply();
                        }
                    })
                } else {
                    options = options || {};
                    options.savingSource = "form";
                    options.$parse = $parse;
                    return $scope.formOptions.dataModel.save(options).then(
                        function (response) {
                            if ($scope.formOptions.afterSaveFn) {
                                $scope.formOptions.afterSaveFn();
                            } else {
                                if ($scope.formOptions.parentSharedOptions && !($scope.formOptions.refreshParentInBackground == false)) {
                                    var refereshInBackground = $scope.formOptions.parentSharedOptions.refereshInBackground || 0;
                                    refereshInBackground = refereshInBackground + 1;
                                    $scope.formOptions.parentSharedOptions.refereshInBackground = refereshInBackground;
                                }
                                return response;
                            }
                        }).fail(function (err) {
                            if (err.message == Util.NOT_CONNECTED_MESSAGE) {
                                $scope.formOptions.save = false;
                            }
                            if (!$scope.$$phase) {
                                $scope.$apply();
                            }
                            throw err;
                        })
                }
            } catch (e) {
                var title = "save in pl.form";
                var message = e + "\n" + e.stack;
                $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
            }
        }
        $scope.edit = function () {
            $scope.formOptions.sharedOptions.saveOptions.editMode = !$scope.formOptions.sharedOptions.saveOptions.editMode;
        }

        $scope.close = function () {
            try {
                if ($scope.formOptions.parentSharedOptions) {
                    if ($scope.formOptions.parentSharedOptions.insertInfo) {
                        delete $scope.formOptions.parentSharedOptions.insertInfo.insert;
                    }
                }
                /*else {        // pop up view was not closing case-form view opened from invoke action--Ritesh bansal
                 $scope.formOptions.sharedOptions.saveOptions.editMode = false;
                 }*/
                $scope.formOptions.sharedOptions.closed = true;
            } catch (e) {
                var title = "close in pl.form";
                var message = "Error in close of pl.form" + e + "\n" + e.stack;
                $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
            }

        }

        $scope.resize = function (direction) {
            try {
                if ($scope.formOptions.resizeV && $scope.formOptions.sharedOptions && $scope.formOptions.sharedOptions.resizable != false) {
                    $scope[$scope.formOptions.resizeV]($scope.formOptions.viewIndex, direction);
                }
            } catch (e) {
                if ($scope.handleClientError) {
                    $scope.handleClientError(e);
                }
            }
        }

        if ($scope.formOptions.sharedOptions.viewPosition == "full") {
            $scope.resize('left');
        }
        $scope.formOptions.tabs = $scope.formOptions.tabs || [];
        $scope.formOptions.defaultActive = true;
        for (var i = $scope.formOptions.groups.length - 1; i >= 0; i--) {
            var group = $scope.formOptions.groups[i];

            if (group.views && group.views.length > 0) {
                for (var j = 0; j < group.views.length; j++) {
                    var view = group.views[j];
                    if (view.viewOptions && view.viewOptions.headerFreeze) {
                        if (group.views.length > 1) {
                            throw new Error('Only one view can be there if header is freezed in group >>>> but found ' + group.views.length);
                        } else {
                            group.tabLabel = group.tabLabel || group.title || view.viewOptions.label || 'Detail';
                        }
                    }
                }
            }

            if (angular.isDefined(group.tabLabel) && group.tabLabel != '') {
                var alreadyInList = false;
                for (var j = 0; j < $scope.formOptions.tabs.length; j++) {
                    var tab = $scope.formOptions.tabs[j];
                    if (tab.label == group.tabLabel) {
                        alreadyInList = true;
                        break;
                    }
                }
                if (alreadyInList) {
                    $scope.formOptions.tabs.groups.push(group);
                } else {
                    $scope.formOptions.tabs.push({label: group.tabLabel, groups: [group]});
                }
                $scope.formOptions.groups.splice(i, 1);
            }
        }
        if ($scope.formOptions.groups && $scope.formOptions.groups.length == 0 && $scope.formOptions.tabs.length > 0) {
            $scope.formOptions.tabs[0].active = true;
        }
    } catch (e) {
        var title = "Error in pl-form";
        var message = "Error in form >>>" + "\n" + e.stack;
        $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
    }
});

pl.controller('pl-form-group-controller', function ($scope) {
    var views = $scope.group.views;
    if (views) {
        for (var i = 0; i < views.length; i++) {
            views[i].viewOptions.viewIndex = i;
            views[i].viewOptions.openV = "openFormV";
            views[i].viewOptions.closeV = "closeFormV";
            views[i].viewOptions.getV = "getFormV";
        }
    }
    $scope.getFormV = function (index) {

        var views = $scope.group.views.views;
        var viewCount = views ? views.length : 0
        if (index >= viewCount) {
            return undefined;
        } else {
            return views[index]
        }
    }
    $scope.openFormV = function (view) {
        try {
            if (view.popup || view.viewOptions.popup) {
                $scope.openPopUpView(view);
                return;
            }

            view.viewOptions.openV = "openFormV";
            view.viewOptions.closeV = "closeFormV";
            view.viewOptions.getV = "getFormV";
            view.viewOptions.viewIndex = $scope.group.views.length;

            var viewCount = $scope.group.views.length;
            if (viewCount == 1) {
                $scope.group.views[0].viewOptions.style.display = "none"
            }

            view.viewOptions.style = view.viewOptions.style || {};
            $scope.group.views.push(view);
        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }
    $scope.closeFormV = function (index) {
        try {
            var views = $scope.group.views;
            var viewCount = views ? views.length : 0;
            if (viewCount == 0) {
                var title = "closeFormV in pl.form";
                var message = "Error: No view found for close in formGroup with index[" + index + "]";
                $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }
            if (index === undefined) {
                index = viewCount - 1;
            }
            if (index >= viewCount) {
                var title = "closeFormV in pl.form";
                var message = "Error: View index found for close in formGroup is [" + index + "], but total view count[" + viewCount + "]";
                $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                return;
            }
            views.splice(index, 1);
            viewCount = views.length;
            if (viewCount > 0) {
                var v = views[viewCount - 1];
                delete v.viewOptions.style.display;
            }

        } catch (e) {
            if ($scope.handleClientError) {
                $scope.handleClientError(e);
            }
        }
    }

});
/************************************EndController*****************************************************************/

pl.directive("plForm", ["$compile", "$timeout", function ($compile, $timeout) {
    'use strict';
    return {
        restrict: "A",
        scope: false,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {


                    if ($scope.formOptions.saveCustomization) {
                        $scope.toolBarOptions.header.right.push({template: '<div title="Save Customization" ng-show="formOptions.sharedOptions.saveCustomizationEnable" class="app-cursor-pointer pl-letter-spacing ng-scope ">' +
                            '<span ng-click="saveCustomizationOptions($event)" class="pl-header-actions save-icon"></span>' +
                            '</div>'});
                        if ($scope.formOptions.fieldCustomization) {
                            $scope.toolBarOptions.header.right.push({template: "<div title='Show/hide columns' ng-hide='formOptions.sharedOptions.saveOptions.editMode' class='manage-cols app-float-right' ng-click='showColumns($event)'><i class='dot'></i><i class='dot'></i><i class='dot'></i></div>"});
                        }

                    }

                    if ($scope.formOptions.popupResize) {
                        $scope.popupResize();
//                        $scope.toolBarOptions.header.right.push({template:'<div  ng-click="popupResize()" pl-toggle title="Resize" ng-show="!formOptions.sharedOptions.saveOptions.editMode && !view.viewOptions.insertInfo.insert" class="btn-blue app-cursor-pointer popup-resize"></div>'});
                    }
                    if ($scope.formOptions.viewControl && $scope.formOptions.viewControlOptions) {
                        var template = "<div pl-menu-group='formOptions.viewControlOptions' ></div>";
                        $scope.toolBarOptions.header.center.push({template: template});
                    }
                    $scope.onViewControlOptionClick = function (option) {
                        try {
                            if ($scope.formOptions.onViewControl) {
                                $scope[$scope.formOptions.onViewControl](option)
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }
                    $scope.saveCustomizationOptions = function ($event, template) {
                        try {
                            if ($scope.formOptions.admin) {
                                var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' >" +
                                    "               <div  class='app-row-action app-cursor-pointer pl-popup-label app-float-left' ng-click='saveCustomization()' >Self</div>" +
                                    "   <div  class='app-row-action app-cursor-pointer pl-popup-label app-float-left' ng-click='saveAdminCustomization(true)' >Organization</div>" +
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
                            } else {
                                $scope.saveCustomization();
                            }
                        } catch (e) {
                            var title = "saveCustomization in pl.form";
                            var message = 'Error in plForm saveCustomization >>>>' + e + '\n' + e.stack;
                            $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                        }
                    }


                    $scope.saveAndEditActionPopup = function ($event, template) {
                        try {
                            $scope.optionsToShow = $scope.$eval(template);
                            if (angular.isDefined($scope.optionsToShow)) {
                                var optionsHtml = "<div class='app-max-height app-white-space-nowrap app-light-gray-backgroud-color' >" +
                                    "<div ng-repeat='option in optionsToShow' ng-show='{{option.isShow}}' class='app-row-action app-cursor-pointer pl-popup-label app-float-left' title='{{option.title}}' ng-click='saveAndEditActionOptionClick($index, option)' ng-bind-html='option.template'></div>" +
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
                            }
                        } catch (e) {
                            var title = "saveAndEditActionPopup in pl.form";
                            var message = 'Error in plForm saveAndEditActionPopup >>>>' + e + '\n' + e.stack;
                            $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                        }
                    }

                    $scope.saveAndEditActionOptionClick = function ($index, saveAction) {
                        try {
                            if (saveAction.onClick) {
                                $scope[saveAction.onClick]();
                            }
                        }
                        catch (e) {
                            var title = "saveAndEditActionOptionClick in pl.form";
                            var message = 'Error in plForm saveAndEditActionOptionClick >>>>' + e + '\n' + e.stack;
                            $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                        }
                    }


                    var template = "<div class='app-display-table app-width-full app-height-full app-position-relative'>";
                    if ($scope.formOptions.headerTemplate) {
                        template += $scope.formOptions.headerTemplate;
                    } else {
                        template += "               <div class='pl-header-toolbar' ng-class='{\"left\":formOptions.sharedOptions.viewPosition ==\"left\" || formOptions.sharedOptions.viewPosition ==\"full\",\"top\":formOptions.sharedOptions.viewPosition== \"right\"}' >" +
                            "                   <pl-tool-bar-header></pl-tool-bar-header>" +
                            "               </div>" +
                            "               <div pl-tool-bar class='pl-toolbar app-float-left app-width-full'></div>";
                    }
                    template += "               <div ";
                    if ($scope.formOptions.toolbar == false) {
                        template = "<div class='app-display-table app-width-full app-height-full app-position-relative'>" +
                            $scope.formOptions.headerTemplate +
                            "               <div ";
                    }

                    if (!$scope.formOptions.nested) {
                        template += " class='pl-form-wrapper' ng-class='{\"left\":formOptions.sharedOptions.viewPosition ==\"left\" || formOptions.sharedOptions.viewPosition ==\"full\",\"top\":formOptions.sharedOptions.viewPosition == \"right\"}'";
                    }
                    template += ">";

                    template += "   <div ng-if='formOptions.tabs.length > 0' pl-form-tabs></div>" +
                        "           <div ng-repeat='group in formOptions.groups' ng-show='formOptions.defaultActive' class='pl-form-group-wrapper-level-{{$index}}' pl-form-group ng-controller='pl-form-group-controller' ng-style='group.style'></div>" +
                        '                     <div class="app-text-align-right pl-clear app-padding-right-twenty-px app-padding-top-five-px" ng-show="formOptions.__isDescriptiveFields">' +
                        '                         <a ng-click="toggleMoreFields()" class="pl-link" ng-if="!formOptions.__descriptive">More fields...</a>' +
                        '                         <a ng-click="toggleMoreFields()" class="pl-link" ng-if="formOptions.__descriptive">Less fields...</a>' +
                        '                     </div>' +
                        "               </div>" +
                        "           </div>";
                    iElement.append($compile(template)($scope));


                    $scope.$watch("formOptions.dataReloaded", function (newValue, oldValue) {
                        if (!angular.equals(newValue, oldValue) && angular.isDefined(oldValue)) {
                            var data = $scope.$eval($scope.formOptions.data);
                            $scope.row = {entity: data};
                        }
                    });
                    var data = $scope.$eval($scope.formOptions.data);
                    if (angular.isUndefined(data)) {
                        var title = "pl.form";
                        var message = "Data is not defined in pl-form";
                        $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                        return;
                    }
                    if (angular.isArray(data)) {
                        var title = "pl.form";
                        var message = "Data expected object but got [" + JSON.stringify(data) + "]";
                        $scope.formOptions.warningOptions.error = new Error(message + "-" + title);
                        return;
                    }
                    $scope.row = {entity: data};
                    if ($scope.formOptions.parentSharedOptions) {
                        $scope.formOptions.parentSharedOptions.resizable = true;
                    }
                },
                post: function ($scope, iElement) {
                    $timeout(function () {
                        if (iElement.find('input,textarea').length > 0) {
                            iElement.find('input,textarea')[0].focus();
                        }
                    }, 0);
                    $scope.toggleMoreFields = function () {
                        $scope.formOptions.__descriptive = !$scope.formOptions.__descriptive;
                    }
                }
            }
        }
    };
}]);

pl.directive('plFormTabs', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: "AE",
        scope: false,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                },
                post: function ($scope, iElement) {
                    var template = "<div class='pl-header-toolbar' style='min-height: 43px; height: auto;'>" +
                        "               <a ng-if='formOptions.groups.length > 0' class='block app-float-left pl-application-tab app-cursor-pointer' ng-class='{\"active-tab\":formOptions.defaultActive}' ng-click='onFormTabClick(\"reset\")' ng-bind='formOptions.tabLabel || formOptions.label'></a>" +
                        "               <a class='block app-cursor-pointer app-float-left pl-application-tab app-left-border' ng-repeat='tab in formOptions.tabs' ng-bind='tab.label' ng-class='{\"active-tab\":tab.active, \"app-right-border\":formOptions.tabs.length - 1 == $index}' ng-click='onFormTabClick(tab, $index)'></a>" +
                        "           </div>" +
                        "           <div ng-repeat='tab in formOptions.tabs' ng-show='tab.active' class='absolute-wrapper' style='top:43px;'>" +
                        "               <div ng-repeat='group in tab.groups' class='pl-form-group-wrapper-level-{{$index}} app-height-full' pl-form-group ng-controller='pl-form-group-controller' ng-style='group.style'></div>" +
                        "           </div>";
                    iElement.append($compile(template)($scope));
                    $scope.onFormTabClick = function (tab) {
                        try {
                            for (var i = 0; i < $scope.formOptions.tabs.length; i++) {
                                $scope.formOptions.tabs[i].active = false;
                            }
                            if (tab == 'reset') {
                                $scope.formOptions.defaultActive = true;
                            } else {
                                $scope.formOptions.defaultActive = false;
                                tab.active = true;
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

pl.directive('plFormGroup', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: "A",
        scope: false,
        compile: function () {
            return{
                pre: function ($scope, iElement, attrs) {
                    if ($scope.group.columns && $scope.group.columns.length > 0) {
                        for (var i = 0; i < $scope.group.columns.length; i++) {
                            var column = $scope.group.columns[i];
                            column.style = column.style || {};
                            column.columnHolderStyle = column.columnHolderStyle || {};
                            column.style.width = column.style.width || column.width || "200px";

                            if (column.formType === "Short") {
                                $scope.formOptions.shortFieldDefined = true;
                            }

                            if ($scope.group.type == "flow") {
                                column.columnHolderStyle.width = $scope.group.width || "200px";
                            } else if (column.ui == "rte") {
                                column.columnHolderStyle.width = "100%";
                                column.singleColumn = true;
                                column.style.width = "100%";
                            } else {
                                column.columnHolderStyle.width = $scope.group.noOfColumnsPerRow > 0 ? (100 / $scope.group.noOfColumnsPerRow) + '%' : "50%";
                            }
                        }

                    }

                    if (($scope.formOptions.shortFieldDefined == undefined) && $scope.group.views && $scope.group.views.length > 0) {
                        for (var i = 0; i < $scope.group.views.length; i++) {
                            var view = $scope.group.views[i];
                            if (view.viewOptions.formType == 'Short') {
                                $scope.formOptions.shortFieldDefined = true;
                                break;
                            }
                        }
                    }
                    if (!$scope.formOptions.shortFieldDefined) {
                        $scope.formOptions.__descriptive = true;
                        $scope.formOptions.__isDescriptiveFields = false;
                    } else {
                        $scope.formOptions.__descriptive = false;
                        $scope.formOptions.__isDescriptiveFields = true;
                    }
                },
                post: function ($scope, iElement) {
                    var template = '<div class="app-width-full app-float-left pl-form-group app-height-full " ';
                    if (angular.isDefined($scope.group.when) && $scope.group.when.toString().trim().length > 0) {
                        template += ' ng-show=\'' + $scope.group.when + '\' ';
                    }
                    template += ' >' +
                        '               <div class="pl-form-group-level-{{$index}} app-font-weight-bold app-width-auto app-color-blue app-font-weight-bold app-font-size-sixteen-px app-padding-five-px app-background-grey " pl-accordion ng-show="group.showTitle">' +
                        '                   <span class="pl-group-title" ng-bind="group.title"></span>' +
                        '                   <span class="app-float-right pl-button-box" ng-click="toggleChild()">' +
                        '                       <i class=\"pl-accordion app-float-right icon-chevron-up\" ></i>' +
                        '                   </span>' +
                        '               </div>' +
                        '               <div ng-repeat="col in group.columns" ng-show="col.formType == \'Short\' || formOptions.__descriptive" class="pl-form-column-holder pl-form-container-' + $scope.group.noOfColumnsPerRow + '" pl-form-column-holder ng-style=\"col.columnHolderStyle\"></div>' +
//                        '               <pl-form-nested-column-holder></pl-form-nested-column-holder>' +
                        '               <div ng-repeat="view in group.views" ng-class="{\'app-height-full\':view.viewOptions.headerFreeze && view.viewOptions.ui==\'grid\'}" ng-style="view.viewOptions.style" ng-show="view.viewOptions.formType == \'Short\' || formOptions.__descriptive" pl-group-view></div>' +
                        '           </div>' +
                        '           <hr class="pl-form-hr" ng-show="group.separator"/>';
                    iElement.append($compile(template)($scope));
                }
            }
        }
    };
}]);

pl.directive('plAccordion', ['$compile', function ($compile) {
    return{
        restrict: "A",
        replace: true,
        compile: function () {
            return{
                post: function ($scope, iElement, attrs) {
                    $scope.toggleChild = function () {
                        try {
                            var iconChild = iElement.find('i.pl-accordion');
                            var iconClass = iconChild.hasClass('icon-chevron-up');
                            var siblins = iElement.siblings('div');
                            $(siblins).toggle();
                            if (iconClass) {
                                iconChild.removeClass('icon-chevron-up');
                                iconChild.addClass('icon-chevron-down');
                            } else {
                                iconChild.addClass('icon-chevron-up');
                                iconChild.removeClass('icon-chevron-down');
                            }
                        } catch (e) {
                            if ($scope.handleClientError) {
                                $scope.handleClientError(e);
                            }
                        }
                    }

                    if ($scope.group && $scope.group.collapse) {
                        var iconChild = iElement.find('i.pl-accordion');
                        var siblins = iElement.siblings('div');
                        $(siblins).hide();
                        iconChild.removeClass('icon-chevron-up');
                        iconChild.addClass('icon-chevron-down');
                    }
                }
            }
        }
    }
}]);

pl.directive("plGroupView", ["$compile", function ($compile) {
    'use strict';
    return {
        restrict: "A",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {
                    var template = '<div pl-view ng-controller="ViewCtrl" class="app-float-left app-width-full app-height-full" ng-style="view.viewOptions.style" ';
                    if (angular.isDefined($scope.view.viewOptions.when) && $scope.view.viewOptions.when.toString().trim().length > 0) {
//                        var when = $scope.view.viewOptions.when.replace(/\$/g, "row.entity.");
//                        when = when.replace(/this./g, "row.entity.");
                        template += " ng-show='" + $scope.view.viewOptions.when + "' ";
                    }
                    template += " ></div>";
                    iElement.append($compile(template)($scope));
                },
                post: function ($scope, iElement) {
                }
            };
        }
    };
}]);

pl.directive('plFormEditCellTemplate', ['$compile', function ($compile) {
    'use strict';
    return {
        restrict: "A",
        scope: false,
        link: function ($scope, iElement) {
            var ngShow = '';
            var cellTemplate = "<div style='padding-left: 4px ; line-height: 28px;' ng-show='!formOptions.sharedOptions.saveOptions.editMode ";
            var editableTemplate = "<div ng-show='formOptions.sharedOptions.saveOptions.editMode ";
            if (angular.isDefined($scope.col.editableWhen)) {
                ngShow = $scope.col.editableWhen;
                cellTemplate += " || !(" + ngShow + ") ";
                editableTemplate += " && (" + ngShow + ") ";
            }
            cellTemplate += "' >" + $scope.col.cellTemplate + "</div>";
            editableTemplate += " '>" + $scope.col.editableCellTemplate + "</div>";
            iElement.append($compile(cellTemplate)($scope));
            iElement.append($compile(editableTemplate)($scope));
        }
    }
}]);

pl.directive("plFormColumnHolder", ["$compile", function ($compile) {
    'use strict';
    return {
        restrict: "AE",
        replace: true,
        compile: function () {
            return {
                pre: function ($scope, iElement, attrs) {

                    $scope.col.cHolderChildStyle = $scope.col.cHolderChildStyle || {};
                    var template = '<div  class="app-width-full pl-form-content-holder" ng-style="col.cHolderChildStyle" ';
                    if (angular.isDefined($scope.col.when) && ($scope.col.when).trim().length > 0) {
//                        var when = $scope.col.when.replace(/\$/g, "row.entity.");
//                        when = when.replace(/this./g, "row.entity.");
                        template += " ng-show='" + $scope.col.when + "' ";
                    }
                    template += " >";
                    var lbl = $scope.col.label;
                    if (lbl && $scope.col.mandatory) {
                        lbl += "*";
                    }

                    template += ' <div  class="pl-form-label pl-form-text-' + $scope.$parent.group.noOfColumnsPerRow + '" title="{{col.label}}"  ng-style="col.columnLabelStyle" ng-show="group.showLabel">' + lbl + '</div>' +
                        '       <div class="pl-form-component app-float-left app-position-relative pl-form-editor-' + $scope.$parent.group.noOfColumnsPerRow + '"  pl-form-edit-cell-template ng-style="col.columnEditCellTemplateStyle"></div>' +
                        '   </div>';
                    iElement.append($compile(template)($scope));

                },
                post: function ($scope, iElement) {
                    $scope.col.columnLabelStyle = $scope.group.columnLabelStyle || {};
                    $scope.col.columnEditCellTemplateStyle = $scope.group.columnEditCellTemplateStyle || {};
                    if ($scope.formOptions.sharedOptions.saveOptions && $scope.formOptions.sharedOptions.saveOptions.editMode) {
                        $scope.col.columnLabelStyle['line-height'] = '26px';
                    }
//                    $scope.col.columnLabelStyle.width = "90%";
//                    $scope.col.columnLabelStyle["padding"] = "0px 5px";
//                    $scope.col.columnLabelStyle["text-align"] = "left";
////                    $scope.col.columnEditCellTemplateStyle.width = "90%";
//                    $scope.col.columnEditCellTemplateStyle.width = "99%";
                }
            };
        }
    };
}]);
