/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 3/8/13
 * Time: 4:49 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("ApplaneBaas/lib/shared/Constants.js");
var ApplaneCallback = require("ApplaneCore/apputil/ApplaneCallback.js");
var AppsStudioError = require("ApplaneCore/apputil/ApplaneError.js");
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
var RequestConstants = require("ApplaneBaas/lib/shared/RequestConstants.js");
var ViewService = require("./ViewService.js");
var Utils = require("ApplaneCore/apputil/util.js");
var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var MetadataProvider = require("ApplaneBaas/lib/metadata/MetadataProvider.js");
var objectID = require("mongodb").ObjectID;
var OptionsUtil = require("ApplaneBaas/lib/util/OptionsUtil.js");


exports.saveViewCustomization = function (parameters, options, callback) {
    var viewId = parameters[RequestConstants.AppsStudio.VIEWID];
    if (!viewId) {
        throw new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK, ["viewid"]);
    }
    var user = options.user;
    var userId = user[QueryConstants.Query._ID];
    MetadataProvider.getOrganization(parameters[RequestConstants.AppsStudio.OSK], options, ApplaneCallback(callback, function (organizationDetail) {
        var organizationId = organizationDetail[QueryConstants.Query._ID];
        ViewService.getViewDetails(viewId, userId, organizationId, options, ApplaneCallback(callback, function (viewResult) {
            if (Object.keys(viewResult).length == 0) {
                throw new AppsStudioError(Constants.ErrorCode.VIEW_NOT_FOUND, [viewId]);
            }
            var userKey = viewId + "___" + organizationId + "___" + userId;
            parameters[RequestConstants.AppsStudio.CUSTOMIZATION] = parameters[RequestConstants.AppsStudio.CUSTOMIZATION] ? JSON.parse(parameters[RequestConstants.AppsStudio.CUSTOMIZATION]) : {};
            var customization = parameters[RequestConstants.AppsStudio.CUSTOMIZATION];
            var savedCustomization = {};
            var baasViewDetails;
            var updates = {};
            if (viewResult[userKey]) {
                var userViewDetails = viewResult[userKey];
                updates[QueryConstants.Query._ID] = userViewDetails[QueryConstants.Query._ID];
                savedCustomization = userViewDetails[Constants.AppsStudio.Views.CUSTOMIZATION] ? JSON.parse(userViewDetails[Constants.AppsStudio.Views.CUSTOMIZATION]) : {};
                baasViewDetails = userViewDetails[Constants.AppsStudio.Views.BAAS_VIEWID];
            } else {
                var applicationKey = viewId;
                var organizationKey = viewId + "___" + organizationId;
                var viewData = viewResult[applicationKey] || viewResult[organizationKey];
                baasViewDetails = viewData[Constants.AppsStudio.Views.BAAS_VIEWID];
                updates = Utils.deepClone(viewData);
                delete updates[QueryConstants.Query._ID];
                delete updates[Constants.AppsStudio.Views.CUSTOMIZATION];
                updates[Constants.AppsStudio.Views.USERID] = userId;
                if (!updates[Constants.AppsStudio.Views.ORGANIZATIONID]) {
                    updates[Constants.AppsStudio.Views.ORGANIZATIONID] = organizationId;
                }
            }
            savedCustomization[Constants.AppsStudio.Views.Customization.MAIN_TABLE_ID] = savedCustomization[Constants.AppsStudio.Views.Customization.MAIN_TABLE_ID] || baasViewDetails[Constants.Baas.Views.TABLE][Constants.Baas.Tables.ID];
            updates.baasviewid = baasViewDetails;
            populateCustomization(customization, savedCustomization);
            populateViewInfoInCustomization(customization, savedCustomization);
            populateSchedules(customization, viewId, updates, options);
            var childs = customization[RequestConstants.AppsStudio.Customization.CHILDS];
            populateChilds(childs, savedCustomization, options, ApplaneCallback(callback, function () {
                populateUniversalFilter(customization, options, organizationId);
                updates[Constants.AppsStudio.Views.CUSTOMIZATION] = JSON.stringify(savedCustomization);
                updateAppView(updates, options, ApplaneCallback(callback, function () {
                    getView(parameters, options, callback);
                }));
            }))
        }))
    }))
}

function populateViewInfoInCustomization(customization, savedCustomization) {
    if (customization[Constants.AppsStudio.Views.Customization.VIEW]) {
        var savedViewInfo = savedCustomization[Constants.AppsStudio.Views.Customization.VIEW] || {};
        var currentViewInfo = customization[Constants.AppsStudio.Views.Customization.VIEW];
        if (typeof currentViewInfo == "string") {
            currentViewInfo = JSON.parse(currentViewInfo);
        }
        for (var exp in currentViewInfo) {
            savedViewInfo[exp] = currentViewInfo[exp];
        }
        savedCustomization[Constants.AppsStudio.Views.Customization.VIEW] = savedViewInfo;
    }
}


function populateUniversalFilter(customization, options, organization) {
    if (customization[RequestConstants.AppsStudio.Customization.APPLIED_FILTER_INFO] && customization[RequestConstants.AppsStudio.Customization.APPLIED_FILTERS]) {
        ViewService.getUserStates(options, function (err, userState) {
            if (userState && userState[Constants.Baas.Users.UserState.ORGANIZATION_WISE_STATE]) {
                var appliedFilters = customization[RequestConstants.AppsStudio.Customization.APPLIED_FILTERS];
                var appliedFilterInfos = customization[RequestConstants.AppsStudio.Customization.APPLIED_FILTER_INFO];
                var organizationWiseStates = userState[Constants.Baas.Users.UserState.ORGANIZATION_WISE_STATE];
                var universalFilter;
                var organizationWiseState;
                for (var i = 0; i < organizationWiseStates.length; i++) {
                    organizationWiseState = organizationWiseStates[i];
                    if (organizationWiseState[Constants.Baas.Users.UserState.OrganizationWiseState.ORGANIZATION] == organization && organizationWiseState[Constants.Baas.Users.UserState.OrganizationWiseState.UNIVERSAL_FILTER]) {
                        universalFilter = JSON.parse(organizationWiseState[Constants.Baas.Users.UserState.OrganizationWiseState.UNIVERSAL_FILTER]);
                        break;
                    }
                }
                if (!universalFilter) {
                    universalFilter = {};
                }
                try {
                    var updateUniversalFilter = false;
                    for (var exp in appliedFilterInfos) {
                        var appliedFilterInfo = appliedFilterInfos[exp];
                        if (appliedFilterInfo[Constants.AppsStudio.ViewColumns.UNIVERSAL_FILTER] && appliedFilters[exp]) {
                            var appliedUniversalFilter = appliedFilterInfo[Constants.AppsStudio.ViewColumns.UNIVERSAL_FILTER];
                            if (appliedUniversalFilter != "Off") {
                                updateUniversalFilter = true;
                                var appliedUniversalFilterTable = appliedFilterInfo[Constants.Baas.Tables.Columns.TABLE][Constants.Baas.Tables.ID];
                                universalFilter[appliedUniversalFilter] = universalFilter[appliedUniversalFilter] || {};
                                universalFilter[appliedUniversalFilter][appliedUniversalFilterTable] = appliedFilters[exp];
                            }
                        }
                    }
                    if (updateUniversalFilter) {
                        organizationWiseState[Constants.Baas.Users.UserState.OrganizationWiseState.UNIVERSAL_FILTER] = universalFilter;
                        ViewService.updateUserState(userState, options, function (err, res) {
                        })
                    }
                } catch (err) {
                    console.log(err.stack);
                }
            }
        })
    }
}

function populateColumns(customization, savedCustomization) {
    var customizationColumns = customization [RequestConstants.AppsStudio.Customization.COLUMNS];
    if (customizationColumns && customizationColumns.length > 0) {
        var savedColumns = savedCustomization[Constants.AppsStudio.Views.Customization.COLUMNS];
        var savedColumnSequences = savedCustomization[Constants.AppsStudio.Views.Customization.SEQUENCE];
        var columns = savedColumns ? Utils.deepClone(savedColumns) : {};
        var sequences = [];
        for (var i = 0; i < customizationColumns.length; i++) {
            var customizationColumn = customizationColumns[i];
            var columnExpression = customizationColumn[RequestConstants.AppsStudio.Customization.Columns.EXPRESSION];
            if (sequences.indexOf(columnExpression) == -1) {
                sequences.push(columnExpression);
            }
            columns[columnExpression] = populateCustomizationProperties(customizationColumn);
        }
        for (var expression in savedColumns) {
            if (sequences.indexOf(expression) == -1) {
                sequences.push(expression);
                var columnVisibility = savedColumns[expression] [RequestConstants.AppsStudio.Customization.Columns.VISIBILITY];
                if (columnVisibility instanceof Object) {
                    savedColumns[expression] [RequestConstants.AppsStudio.Customization.Columns.VISIBILITY] = columnVisibility._val;
                }
            }
        }
        savedCustomization[Constants.AppsStudio.Views.Customization.COLUMNS] = columns;
        savedCustomization[Constants.AppsStudio.Views.Customization.SEQUENCE] = sequences;
    }
}


function populateCustomization(customization, savedCustomization) {
    populateColumns(customization, savedCustomization);
    delete savedCustomization[Constants.AppsStudio.Views.Customization.APPLIED_FILTERS];
    if (customization[RequestConstants.AppsStudio.Customization.APPLIED_FILTERS] && customization[RequestConstants.AppsStudio.Customization.SOURCE]) {
        savedCustomization[Constants.AppsStudio.Views.Customization.SOURCE_APPLIED_FILTERS] = savedCustomization[RequestConstants.AppsStudio.Customization.SOURCE_APPLIED_FILTERS] || {};
        savedCustomization[Constants.AppsStudio.Views.Customization.SOURCE_APPLIED_FILTERS][customization[RequestConstants.AppsStudio.Customization.SOURCE]] = customization[RequestConstants.AppsStudio.Customization.APPLIED_FILTERS];
    }
    if (customization[RequestConstants.AppsStudio.Customization.ORDERS]) {
        savedCustomization[Constants.AppsStudio.Views.Customization.ORDERS] = customization[RequestConstants.AppsStudio.Customization.ORDERS];
    }
    if (customization[RequestConstants.AppsStudio.Customization.COLUMN_GROUPS]) {
        savedCustomization[Constants.AppsStudio.Views.Customization.COLUMN_GROUPS] = customization[RequestConstants.AppsStudio.Customization.COLUMN_GROUPS];
    }
    if (customization[RequestConstants.AppsStudio.Customization.ACTIONS]) {
        savedCustomization[Constants.AppsStudio.Views.Customization.ACTIONS] = customization[RequestConstants.AppsStudio.Customization.ACTIONS];
    }
}


function populateSchedules(customization, viewId, updates, options) {
    var schedules = customization[RequestConstants.AppsStudio.Customization.SCHEDULES];
    if (schedules && schedules.length > 0) {
        for (var i = 0; i < schedules.length; i++) {
            var schedule = schedules[i];
            delete schedule._insert;
            delete schedule.$$hashKey;
            if (schedule[QueryConstants.Query._ID] && schedule[QueryConstants.Query._ID].indexOf("temp") != -1) {
                delete schedule[QueryConstants.Query._ID];
            }
            if (schedule[Constants.AppsStudio.Views.Schedules.SCHEDULEID]) {
                var scheduleObject = schedule[Constants.AppsStudio.Views.Schedules.SCHEDULEID];
                if (!scheduleObject[Constants.AppsStudio.Schedules.VIEWID]) {
                    scheduleObject[Constants.AppsStudio.Schedules.VIEWID] = viewId;
                }
                var scheduleId = scheduleObject[QueryConstants.Query._ID];
                if (scheduleId) {
                    var scheduleUpdates = {};
                    if (schedule[QueryConstants.Update.Operation.TYPE] && schedule[QueryConstants.Update.Operation.TYPE] == [QueryConstants.Update.Operation.Type.DELETE]) {
                        scheduleUpdates[QueryConstants.Query._ID] = scheduleId;
                        scheduleUpdates[QueryConstants.Update.Operation.TYPE] = QueryConstants.Update.Operation.Type.DELETE;
                    } else {
                        scheduleUpdates = scheduleObject;
                    }
                    updateSchedules(scheduleUpdates, options);

                }
            }
        }
        updates[Constants.AppsStudio.Views.SCHEDULES] = schedules;
    }
}

function updateSchedules(scheduleUpdates, options) {
    var updates = {};
    updates[QueryConstants.Query.TABLE] = Constants.AppsStudio.SCHEDULES;
    updates[QueryConstants.Update.OPERATIONS] = scheduleUpdates;
    updates.excludejobs = true;
    updates.excludemodules = true;
    UpdateEngine.executeUpdate(updates, OptionsUtil.getOptions(options, Constants.AppsStudio.ASK), function (err, res) {
    })
}

function populateCustomizationProperties(column) {
    var columnProperties = {};
//    delete column[Constants.AppsStudio.ViewColumns.MULTIPLE];
    columnProperties[Constants.AppsStudio.ViewColumns.WIDTH] = column[Constants.AppsStudio.ViewColumns.WIDTH] || 200;
    columnProperties[Constants.AppsStudio.ViewColumns.LABEL] = column[Constants.AppsStudio.ViewColumns.LABEL] || column[Constants.AppsStudio.ViewColumns.EXPRESSION];
    columnProperties[Constants.AppsStudio.ViewColumns.ID] = column[Constants.AppsStudio.ViewColumns.ID];
    var visibility = column[Constants.AppsStudio.ViewColumns.VISIBILITY];
    if (visibility instanceof Object) {
        visibility = visibility._val;
    }
    columnProperties[Constants.AppsStudio.ViewColumns.VISIBILITY] = visibility;
    columnProperties[Constants.AppsStudio.ViewColumns.UPDATE] = column[Constants.AppsStudio.ViewColumns.UPDATE];
    columnProperties[Constants.AppsStudio.ViewColumns.MAX_ROWS] = column[Constants.AppsStudio.ViewColumns.MAX_ROWS];
    columnProperties[Constants.AppsStudio.ViewColumns.TOTAL_AGGREGATE] = column[Constants.AppsStudio.ViewColumns.TOTAL_AGGREGATE];
    columnProperties[Constants.AppsStudio.ViewColumns.VISIBLE_EXPRESSION] = column[Constants.AppsStudio.ViewColumns.VISIBLE_EXPRESSION];
    columnProperties[Constants.AppsStudio.ViewColumns.TIME] = column[Constants.AppsStudio.ViewColumns.TIME];
    columnProperties[Constants.AppsStudio.ViewColumns.MULTIPLE_FILTER] = column[Constants.AppsStudio.ViewColumns.MULTIPLE_FILTER];
    columnProperties[Constants.AppsStudio.ViewColumns.VIEW] = column[Constants.AppsStudio.ViewColumns.VIEW];
    columnProperties[Constants.AppsStudio.ViewColumns.TYPE_EDITABLE_EXPRESSION] = column[Constants.AppsStudio.ViewColumns.TYPE_EDITABLE_EXPRESSION];
    columnProperties[Constants.AppsStudio.ViewColumns.EDITABLE_EXPRESSION] = column[Constants.AppsStudio.ViewColumns.EDITABLE_EXPRESSION];
    columnProperties[Constants.AppsStudio.ViewColumns.COLUMN_GROUP] = column[Constants.AppsStudio.ViewColumns.COLUMN_GROUP];
    columnProperties[Constants.AppsStudio.ViewColumns.EDIT_COLUMN] = column[Constants.AppsStudio.ViewColumns.EDIT_COLUMN];
    columnProperties[Constants.AppsStudio.ViewColumns.VIEW_DETAIL] = column[Constants.AppsStudio.ViewColumns.VIEW_DETAIL];
    columnProperties[Constants.AppsStudio.ViewColumns.ORDERS] = column[Constants.AppsStudio.ViewColumns.ORDERS];
    columnProperties[Constants.AppsStudio.ViewColumns.UNIVERSAL_FILTER] = column[Constants.AppsStudio.ViewColumns.UNIVERSAL_FILTER];
    columnProperties[Constants.AppsStudio.ViewColumns.FILTER_REQUIRED_COLUMNS] = column[Constants.AppsStudio.ViewColumns.FILTER_REQUIRED_COLUMNS];
    columnProperties[Constants.AppsStudio.ViewColumns.RANGE_DATE] = column[Constants.AppsStudio.ViewColumns.RANGE_DATE];
    columnProperties[Constants.AppsStudio.ViewColumns.RANGE_MONTH] = column[Constants.AppsStudio.ViewColumns.RANGE_MONTH];
    columnProperties[Constants.AppsStudio.ViewColumns.RANGE_YEAR] = column[Constants.AppsStudio.ViewColumns.RANGE_YEAR];
    columnProperties[Constants.AppsStudio.ViewColumns.TEXT_TYPE] = column[Constants.AppsStudio.ViewColumns.TEXT_TYPE];
    columnProperties[Constants.AppsStudio.ViewColumns.REMEMBER] = column[Constants.AppsStudio.ViewColumns.REMEMBER];
    columnProperties[Constants.AppsStudio.ViewColumns.DECIMAL_PLACE] = column[Constants.AppsStudio.ViewColumns.DECIMAL_PLACE];
    columnProperties[Constants.AppsStudio.ViewColumns.LOOK_UP_QUERY] = column[Constants.AppsStudio.ViewColumns.LOOK_UP_QUERY];
    columnProperties[Constants.AppsStudio.ViewColumns.TABLE_VISIBLE_EXPRESSION] = column[Constants.AppsStudio.ViewColumns.TABLE_VISIBLE_EXPRESSION];
    columnProperties[Constants.AppsStudio.ViewColumns.MANDATORY] = column[Constants.AppsStudio.ViewColumns.MANDATORY];
    columnProperties[Constants.AppsStudio.ViewColumns.BREADCRUMB] = column[Constants.AppsStudio.ViewColumns.BREADCRUMB];
    columnProperties[Constants.AppsStudio.ViewColumns.VISIBLE_REQUIRED_COLUMNS] = column[Constants.AppsStudio.ViewColumns.VISIBLE_REQUIRED_COLUMNS];
    if (column[Constants.AppsStudio.ViewColumns.FILTER]) {
        var filter = column[Constants.AppsStudio.ViewColumns.FILTER];
        if (typeof filter == "string") {
            filter = JSON.parse(filter);
        }
        columnProperties[Constants.AppsStudio.ViewColumns.FILTER] = filter;
    }
    if (column[Constants.AppsStudio.ViewColumns.PARAMETER_MAPPINGS]) {
        var parameterMappings = column[Constants.AppsStudio.ViewColumns.PARAMETER_MAPPINGS];
        if (typeof parameterMappings == "string") {
            parameterMappings = JSON.parse(parameterMappings);
        }
        columnProperties[Constants.AppsStudio.ViewColumns.PARAMETER_MAPPINGS] = parameterMappings;
    }
    columnProperties[Constants.AppsStudio.ViewColumns.VIEWID] = column[Constants.AppsStudio.ViewColumns.VIEWID];
    return columnProperties;
}

function populateChilds(childs, savedCustomization, options, callback) {
    if (childs && childs.length > 0) {
        var newChilds = [];
        Utils.iterateArray(childs, ApplaneCallback(callback, function () {
            savedCustomization[Constants.AppsStudio.Views.Customization.CHILDS] = newChilds;
            callback();
        }), function (child, callback) {
            var type = child.__type__;
            if (type == "delete") {
//                if (child.viewid) {
//                    setTimeout(function () {
//                        deleteChildView(child.viewid, parameters);
//                    }, 500);
//                }
                callback();
            } else if (child.viewid) {
                newChilds.push(child);
                callback();
            } else {
                child._id = new objectID().toString();
                var childBaasView = child[Constants.AppsStudio.Views.Customization.Childs.VIEW];
                var childAppView = child[Constants.AppsStudio.Views.Customization.Childs.APP_VIEW];
                var childCloneValue = child[Constants.AppsStudio.Views.Customization.Childs.CLONE];
                if (childAppView) {
                    var childAppViewId = childAppView[Constants.AppsStudio.Views.ID];
                    if (!childCloneValue) {
                        child.viewid = childAppViewId;
                        newChilds.push(child);
                        callback();
                    } else {
                        ViewService.getViewDetails(childAppViewId, null, null, options, ApplaneCallback(callback, function (viewInfos) {
                            if (viewInfos && viewInfos[childAppViewId]) {
                                var viewDetailClone = viewInfos[childAppViewId];
                                delete viewDetailClone[QueryConstants.Query._ID];
                                childAppViewId += "___" + new Date().getTime();
                                viewDetailClone[Constants.AppsStudio.Views.ID] = childAppViewId;
                                updateAppView(viewDetailClone, options, ApplaneCallback(callback, function () {
                                    child.viewid = childAppViewId;
                                    newChilds.push(child);
                                    callback();
                                }))
                            } else {
                                callback();
                            }
                        }))
                    }
                } else if (childBaasView) {
                    addChildView(childBaasView, child[Constants.AppsStudio.ViewColumns.LABEL], options, ApplaneCallback(callback, function (view) {
                        child.viewid = view[Constants.AppsStudio.Views.ID];
                        newChilds.push(child);
                        callback();
                    }));
                } else {
                    callback();
                }
            }
        })
    } else {
        callback();
    }
}

function updateAppView(viewOperation, options, callback) {
    var updates = {};
    updates[QueryConstants.Query.TABLE] = Constants.AppsStudio.VIEWS;
    updates[QueryConstants.Update.OPERATIONS] = viewOperation;
    UpdateEngine.executeUpdate(updates, OptionsUtil.getOptions(options, Constants.AppsStudio.ASK), callback);
}

function isViewExist(viewId, options, callback) {
    var filter = {};
    filter[Constants.AppsStudio.Views.ID] = viewId;

    var viewQuery = {};
    viewQuery[QueryConstants.Query.TABLE] = Constants.AppsStudio.VIEWS;
    viewQuery[QueryConstants.Query.COLUMNS] = [QueryConstants.Query._ID];
    viewQuery[QueryConstants.Query.FILTER] = filter;
    DatabaseEngine.executeQuery(viewQuery, OptionsUtil.getOptions(options, Constants.AppsStudio.ASK), ApplaneCallback(callback, function (result) {
        if (result[QueryConstants.Query.Result.DATA] && result[QueryConstants.Query.Result.DATA].length > 0) {
            callback(null, true);
        } else {
            callback(null, false);
        }
    }))
}

function addChildView(baasView, label, options, callback) {
    var baasViewId = baasView[Constants.Baas.Views.ID];
    isViewExist(baasViewId, options, ApplaneCallback(callback, function (viewExist) {
        var viewId = baasViewId;
        if (viewExist) {
            viewId += "___" + new Date().getTime();
        }
        var viewOperation = {};
        viewOperation[Constants.AppsStudio.Views.ID] = viewId;
        viewOperation[Constants.AppsStudio.Views.LABEL] = label;
        viewOperation[Constants.AppsStudio.Views.BAAS_VIEWID] = {_id:baasView[QueryConstants.Query._ID]};
        viewOperation[Constants.AppsStudio.Views.QUICK_VIEWID] = viewId;
        updateAppView(viewOperation, options, ApplaneCallback(callback, function (viewUpdateResult) {
            var view = viewUpdateResult[QueryConstants.Update.Operation.Type.INSERT][0];
            callback(null, {_id:view[QueryConstants.Query._ID], id:view[Constants.AppsStudio.Views.ID]});
        }))
    }))
}

function getView(parameters, options, callback) {
    var viewCallBack = parameters[RequestConstants.AppsStudio.CUSTOMIZATION][RequestConstants.AppsStudio.Customization.CALLBACK];
    if (viewCallBack == undefined || viewCallBack == true) {
        var viewParameters = {};
        //TODO parameters which to pass in viewservice
        viewParameters[RequestConstants.AppsStudio.ASK] = parameters[RequestConstants.AppsStudio.ASK];
        viewParameters[RequestConstants.AppsStudio.OSK] = parameters[RequestConstants.AppsStudio.OSK];
        viewParameters[RequestConstants.AppsStudio.VIEWID] = parameters[RequestConstants.AppsStudio.VIEWID];
        viewParameters[RequestConstants.AppsStudio.VIEW_INFO] = {};
        ViewService.getView(viewParameters, options, callback);
    } else {
        callback(null, "success");
    }
}

exports.saveCopyView = function (parameters, options, callback) {
    var viewId = parameters[RequestConstants.AppsStudio.VIEWID];
    if (!viewId) {
        throw new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK, ["viewid"]);
    }
    var user = options[RequestConstants.AppsStudio.USER];
    var userId = user[QueryConstants.Query._ID];
    var customization = parameters[RequestConstants.AppsStudio.CUSTOMIZATION] ? JSON.parse(parameters[RequestConstants.AppsStudio.CUSTOMIZATION]) : {};
    var level = customization[RequestConstants.AppsStudio.Customization.LEVEL] || RequestConstants.AppsStudio.Customization.Level.SELF;
    checkAccessRights(userId, level, parameters, options, ApplaneCallback(callback, function () {
        var copyViewLabel = customization[RequestConstants.AppsStudio.Customization.LABEL];
        var override = customization[RequestConstants.AppsStudio.Customization.OVERRIDE];
        MetadataProvider.getOrganization(parameters[RequestConstants.AppsStudio.OSK], options, ApplaneCallback(callback, function (organizationDetail) {
            var organizationId = organizationDetail[QueryConstants.Query._ID];
            ViewService.getViewDetails(viewId, userId, organizationId, options, ApplaneCallback(callback, function (viewResult) {
                if (Object.keys(viewResult).length == 0) {
                    throw new AppsStudioError(Constants.ErrorCode.VIEW_NOT_FOUND, [viewId]);
                }
                var applicationKey = viewId;
                var organizationKey = viewId + "___" + organizationId;
                var userKey = viewId + "___" + organizationId + "___" + userId;
                var userOrganizationViewDetail = viewResult[userKey];
                var organizationViewDetail = viewResult[organizationKey];
                var viewDetail = viewResult[applicationKey] || viewResult[organizationKey] || viewResult[userKey];
                var viewKey;
                var viewInCustomization;
                var schedules;
                if (override) {
                    if (level == RequestConstants.AppsStudio.Customization.Level.SELF) {
                        if (userOrganizationViewDetail) {
                            viewKey = userOrganizationViewDetail[QueryConstants.Query._ID];
                            viewDetail[Constants.AppsStudio.Views.LABEL] = userOrganizationViewDetail[Constants.AppsStudio.Views.LABEL] || viewDetail[Constants.AppsStudio.Views.LABEL];
                        }
                    } else if (level == RequestConstants.AppsStudio.Customization.Level.ORGANIZATION) {
                        if (userOrganizationViewDetail) {
                            viewInCustomization = userOrganizationViewDetail[Constants.AppsStudio.Views.CUSTOMIZATION];
                            schedules = userOrganizationViewDetail[Constants.AppsStudio.Views.SCHEDULES];
                            viewDetail[Constants.AppsStudio.Views.LABEL] = userOrganizationViewDetail[Constants.AppsStudio.Views.LABEL] || viewDetail[Constants.AppsStudio.Views.LABEL];
                        }
                        if (organizationViewDetail) {
                            viewKey = organizationViewDetail[QueryConstants.Query._ID];
                            viewDetail[Constants.AppsStudio.Views.LABEL] = organizationViewDetail[Constants.AppsStudio.Views.LABEL] || viewDetail[Constants.AppsStudio.Views.LABEL];
                        }
                    } else {
                        if (userOrganizationViewDetail) {
                            viewInCustomization = userOrganizationViewDetail[Constants.AppsStudio.Views.CUSTOMIZATION];
                            schedules = userOrganizationViewDetail[Constants.AppsStudio.Views.SCHEDULES];
                            viewDetail[Constants.AppsStudio.Views.LABEL] = userOrganizationViewDetail[Constants.AppsStudio.Views.LABEL] || viewDetail[Constants.AppsStudio.Views.LABEL];
                        } else if (organizationViewDetail) {
                            viewInCustomization = organizationViewDetail[Constants.AppsStudio.Views.CUSTOMIZATION];
                            schedules = organizationViewDetail[Constants.AppsStudio.Views.SCHEDULES];
                            viewDetail[Constants.AppsStudio.Views.LABEL] = organizationViewDetail[Constants.AppsStudio.Views.LABEL] || viewDetail[Constants.AppsStudio.Views.LABEL];
                        }
                        if (viewResult[applicationKey]) {
                            viewKey = viewDetail[QueryConstants.Query._ID];
                        }
                    }
                }
                else {
                    viewInCustomization = viewDetail[Constants.AppsStudio.Views.CUSTOMIZATION] ? JSON.parse(viewDetail[Constants.AppsStudio.Views.CUSTOMIZATION]) : {};
                    schedules = viewDetail[Constants.AppsStudio.Views.SCHEDULES] || [];
                    if (organizationViewDetail) {
                        var viewToCustomization = organizationViewDetail[Constants.AppsStudio.Views.CUSTOMIZATION] ? JSON.parse(organizationViewDetail[Constants.AppsStudio.Views.CUSTOMIZATION]) : {};
                        ViewService.mergeViewCustomization(viewInCustomization, viewToCustomization);
                        var schedulesToMerge = organizationViewDetail[Constants.AppsStudio.Views.SCHEDULES] || [];
                        schedules = ViewService.mergeViewSchedules(schedules, schedulesToMerge);
                        viewDetail[Constants.AppsStudio.Views.LABEL] = organizationViewDetail[Constants.AppsStudio.Views.LABEL] || viewDetail[Constants.AppsStudio.Views.LABEL];
                    }
                    if (userOrganizationViewDetail) {
                        var viewToCustomization = userOrganizationViewDetail[Constants.AppsStudio.Views.CUSTOMIZATION] ? JSON.parse(userOrganizationViewDetail[Constants.AppsStudio.Views.CUSTOMIZATION]) : {};
                        ViewService.mergeViewCustomization(viewInCustomization, viewToCustomization);
                        var schedulesToMerge = userOrganizationViewDetail[Constants.AppsStudio.Views.SCHEDULES] || [];
                        schedules = ViewService.mergeViewSchedules(schedules, schedulesToMerge);
                        viewDetail[Constants.AppsStudio.Views.LABEL] = userOrganizationViewDetail[Constants.AppsStudio.Views.LABEL] || viewDetail[Constants.AppsStudio.Views.LABEL];
                    }
                }
                var viewToCopy = {};
                if (!viewKey) {
                    var baasView = {};
                    baasView[QueryConstants.Query._ID] = viewDetail[Constants.AppsStudio.Views.BAAS_VIEWID][QueryConstants.Query._ID];
                    viewToCopy[Constants.AppsStudio.Views.BAAS_VIEWID] = baasView;
                    viewToCopy[Constants.AppsStudio.Views.QUICK_VIEWID] = viewDetail ? (viewDetail[Constants.AppsStudio.Views.QUICK_VIEWID] || viewId) : viewId;
                    if (level == RequestConstants.AppsStudio.Customization.Level.SELF) {
                        viewToCopy[Constants.AppsStudio.Views.USERID] = userId;
                        viewToCopy[Constants.AppsStudio.Views.ORGANIZATIONID] = organizationId;
                    } else if (level == RequestConstants.AppsStudio.Customization.Level.ORGANIZATION) {
                        viewToCopy[Constants.AppsStudio.Views.ORGANIZATIONID] = organizationId;
                    }
                    if (override == undefined || override != true) {
                        viewToCopy[Constants.AppsStudio.Views.ID] = viewId + "__" + new Date().getTime();
                    } else {
                        viewToCopy[Constants.AppsStudio.Views.ID] = viewId;
                    }
                }
                if (viewInCustomization) {
                    viewToCopy[Constants.AppsStudio.Views.CUSTOMIZATION] = (typeof viewInCustomization == "string") ? viewInCustomization : JSON.stringify(viewInCustomization);
                }
                if (copyViewLabel && copyViewLabel.trim().length > 0) {
                    viewToCopy[Constants.AppsStudio.Views.LABEL] = copyViewLabel;
                } else if (!viewKey) {
                    viewToCopy[Constants.AppsStudio.Views.LABEL] = viewDetail[Constants.AppsStudio.Views.LABEL] || viewId;
                }
                if (schedules && schedules.length > 0) {
                    for (var i = 0; i < schedules.length; i++) {
                        var schedule = schedules[i];
                        if (!viewKey && schedule[Constants.AppsStudio.Views.Schedules.SCHEDULEID]) {
                            var scheduleObject = schedule[Constants.AppsStudio.Views.Schedules.SCHEDULEID];
                            delete scheduleObject[QueryConstants.Query._ID];
                            scheduleObject[Constants.AppsStudio.Schedules.VIEWID] = viewToCopy[Constants.AppsStudio.Views.ID];
                        }
                    }
                    viewToCopy[Constants.AppsStudio.Views.SCHEDULES] = schedules;
                }
                viewToCopy[QueryConstants.Query._ID] = viewKey
                console.log("viewToCopy >>>>>>>>>>>>>>" + JSON.stringify(viewToCopy));
                updateAppView(viewToCopy, options, ApplaneCallback(callback, function () {
                    if (viewToCopy[Constants.AppsStudio.Views.ID]) {
                        parameters[RequestConstants.AppsStudio.VIEWID] = viewToCopy[Constants.AppsStudio.Views.ID];
                    }
                    getView(parameters, options, callback);
                }))
            }))
        }))
    }));
}

function checkAccessRights(userId, level, parameters, options, callback) {
    if (level == RequestConstants.AppsStudio.Customization.Level.ORGANIZATION) {
        getOrganizationsAsAdmin(userId, options, ApplaneCallback(callback, function (organizations) {
            for (var i = 0; i < organizations.length; i++) {
                if (organizations[i][Constants.Baas.Organizations.OSK] == parameters[RequestConstants.AppsStudio.OSK]) {
                    callback();
                    return;
                }
            }
            callback(new AppsStudioError(Constants.ErrorCode.User.NOT_ORG_ACCESS, [parameters[RequestConstants.AppsStudio.OSK]]));
        }))
    } else if (level == RequestConstants.AppsStudio.Customization.Level.APPLICATION) {
        getApplicationsAsDeveloper(userId, options, ApplaneCallback(callback, function (applications) {
            for (var i = 0; i < applications.length; i++) {
                if (applications[i][Constants.Baas.Applications.ASK] == parameters[RequestConstants.AppsStudio.ASK]) {
                    callback();
                    return;
                }
            }
            callback(new AppsStudioError(Constants.ErrorCode.User.NOT_APP_ACCESS, [parameters[RequestConstants.AppsStudio.ASK]]));
        }))
    } else {
        callback();
    }
}

function getApplicationsAsDeveloper(userId, options, callback) {
    var filter = {};
    filter[Constants.Baas.Applications.DEVELOPERS] = userId;
    var query = {};
    query[QueryConstants.Query.TABLE] = Constants.Baas.APPLICATIONS;
    query[QueryConstants.Query.COLUMNS] = [Constants.Baas.Applications.ASK];
    query[QueryConstants.Query.FILTER] = filter;
    query.excludejobs = true;
    query.excludemodules = true;
    DatabaseEngine.executeQuery(query, OptionsUtil.getOptions(options, Constants.Baas.ASK), ApplaneCallback(callback, function (result) {
        callback(null, result[QueryConstants.Query.Result.DATA]);
    }))
}


function getOrganizationsAsAdmin(userId, options, callback) {
    var filter = {};
    filter[Constants.Baas.Organizations.ADMINS] = userId;
    var query = {};
    query[QueryConstants.Query.TABLE] = Constants.Baas.ORGANIZATIONS;
    query[QueryConstants.Query.COLUMNS] = [Constants.Baas.Organizations.OSK];
    query[QueryConstants.Query.FILTER] = filter;
    query.excludejobs = true;
    query.excludemodules = true;
    DatabaseEngine.executeQuery(query, OptionsUtil.getOptions(options, Constants.Baas.ASK), ApplaneCallback(callback, function (result) {
        callback(null, result[QueryConstants.Query.Result.DATA]);
    }))
}

//function deleteChildView(viewid, parameters) {
//    var query = {};
//    query[QueryConstants.Query.TABLE] = Constants.AppsStudio.VIEWS;
//    query[QueryConstants.Query.COLUMNS] = [QueryConstants.Query._ID];
//    query[QueryConstants.Query.FILTER] = {id:viewid};
//    DatabaseEngine.executeQuery(query, OptionsUtil.getOptions(parameters, Constants.AppsStudio.ASK), function (err, res) {
//        if (res && res[QueryConstants.Query.Result.DATA] && res[QueryConstants.Query.Result.DATA].length > 0) {
//            var data = res[QueryConstants.Query.Result.DATA];
//            var operations = [];
//            for (var i = 0; i < data.length; i++) {
//                var row = data[i];
//                var update = {};
//                update[QueryConstants.Query._ID] = row[QueryConstants.Query._ID];
//                update[QueryConstants.Update.Operation.TYPE] = QueryConstants.Update.Operation.Type.DELETE;
//                operations.push(update);
//            }
//            var updates = {};
//            updates[QueryConstants.Query.TABLE] = Constants.AppsStudio.VIEWS;
//            updates[QueryConstants.Update.OPERATIONS] = operations;
//            UpdateEngine.executeUpdate(updates, OptionsUtil.getOptions(parameters, Constants.AppsStudio.ASK), function (err, res) {
//            })
//        }
//    })
//}


//function getBaasViewTable(baasView, parameters, callback) {
//    var query = {};
//    query[QueryConstants.Query.TABLE] = Constants.Baas.VIEWS;
//    query[QueryConstants.Query.COLUMNS] = [Constants.Baas.Views.TABLE];
//    query[QueryConstants.Query.FILTER] = {_id:baasView[QueryConstants.Query._ID]};
//    DatabaseEngine.executeQuery(query, OptionsUtil.getOptions(parameters, Constants.Baas.ASK), ApplaneCallback(callback, function (result) {
//        callback(null, result[QueryConstants.Query.Result.DATA][0][Constants.Baas.Views.TABLE]);
//    }))
//}

//function updateChildViewCustomization(childBaasView, viewKey, parameters, baasView, callback) {
//    getBaasViewTable(childBaasView, parameters, ApplaneCallback(callback, function (baasViewTable) {
//        MetadataProvider.getTable(baasViewTable[Constants.Baas.Tables.ID], {}, ApplaneCallback(callback, function (tableInfo) {
//            var tableColumns = tableInfo ? Utils.deepClone(tableInfo[Constants.Baas.Tables.COLUMNS]) || [] : [];
//            var childViewColumns = {};
//            var childViewSequences = [];
//            Utils.iterateArray(tableColumns, ApplaneCallback(callback, function () {
//                if (Object.keys(childViewColumns).length > 0) {
//                    var childViewCustomization = {};
//                    childViewCustomization[Constants.AppsStudio.Views.Customization.COLUMNS] = childViewColumns;
//                    childViewCustomization[Constants.AppsStudio.Views.Customization.SEQUENCE] = childViewSequences;
//                    var updates = {};
//                    updates[QueryConstants.Query._ID] = viewKey;
//                    updateViewCustomization(updates, childViewCustomization, parameters, false, callback);
//                } else {
//                    callback();
//                }
//            }), function (tableColumn, callback) {
//                if (tableColumn[Constants.Baas.Tables.Columns.TYPE] == Constants.Baas.Tables.Columns.Type.LOOKUP && tableColumn[Constants.Baas.Tables.Columns.TABLE]) {
//                    var tableColumnExpression = tableColumn[Constants.Baas.Tables.Columns.EXPRESSION];
//                    var lookupTable = tableColumn[Constants.Baas.Tables.Columns.TABLE][Constants.Baas.Tables.ID];
//                    MetadataProvider.getTable(lookupTable, {}, ApplaneCallback(callback, function (lookupTableInfo) {
//                        var lookupTableColumns = lookupTableInfo ? Utils.deepClone(lookupTableInfo[Constants.Baas.Tables.COLUMNS]) || [] : [];
//                        for (var i = 0; i < lookupTableColumns.length; i++) {
//                            var lookupTableColumn = lookupTableColumns[i];
//                            if (!lookupTableColumn[Constants.Baas.Tables.Columns.REVERSE_RELATION_COLUMN] && lookupTableColumn[Constants.Baas.Tables.Columns.TABLE]) {
//                                if (lookupTableColumn[Constants.Baas.Tables.Columns.TABLE][Constants.Baas.Tables.ID] == baasView[Constants.Baas.Views.TABLE][Constants.Baas.Tables.ID]) {
//                                    childViewSequences.push(tableColumnExpression);
//                                    var tableColumnCustomization = populateCustomizationProperties(tableColumn);
//                                    var columnFilter = {};
//                                    columnFilter[ lookupTableColumn[Constants.Baas.Tables.Columns.EXPRESSION]] = "{_id}";
//                                    tableColumnCustomization[QueryConstants.Query.FILTER] = columnFilter;
//                                    childViewColumns[tableColumnExpression] = tableColumnCustomization;
//                                    break;
//                                }
//                            }
//                        }
//                        callback();
//                    }));
//                } else {
//                    callback();
//                }
//            });
//        }))
//    }));
//}