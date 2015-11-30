/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 26/7/13
 * Time: 10:51 AM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("ApplaneBaas/lib/shared/Constants.js");
var FlexFieldColumn = require("ApplaneBaas/lib/modules/FlexfieldModuleColumn.js");
var ApplaneCallback = require("ApplaneCore/apputil/ApplaneCallback.js");
var AppsStudioError = require("ApplaneCore/apputil/ApplaneError.js");
var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var RoleModule = require("ApplaneBaas/lib/modules/RoleModule.js");
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
var RequestConstants = require("ApplaneBaas/lib/shared/RequestConstants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Self = require("./ViewService.js");
var MetadataProvider = require('ApplaneBaas/lib/metadata/MetadataProvider.js');
var TableSchema = require("ApplaneBaas/lib/util/TableSchema.js");
var Service = require("ApplaneBaas/Service.js");
var LogUtility = require("ApplaneBaas/lib/util/LogUtility.js");
var OptionsUtil = require("ApplaneBaas/lib/util/OptionsUtil.js");

exports.getView = function (parameters, options, callback1) {
    if (!options.disablelogs && !options.logid) {
        callback(new Error("ViewService>>getView>>Neither disablelogs nor logid provided"));
        return;
    }
    var subLogIdId = false;
    if (!options.disablelogs) {
        subLogIdId = LogUtility.startLog(options.logid, "ViewService >>>> exports.getView");
    }
    var callback = function (err, data) {
        if (subLogIdId) {
            LogUtility.endLog(options.logid, subLogIdId);
        }

        callback1(err, data);
    }

    var viewId = parameters[RequestConstants.AppsStudio.VIEWID];
    if (!viewId) {
        callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK, ["viewid"]));
        return;
    }
    var user = options.user;
    var userId = user[QueryConstants.Query._ID];
    if (!user) {
        callback(new AppsStudioError(Constants.ErrorCode.SESSION_NOT_FOUND));
    }
    parameters[RequestConstants.AppsStudio.VIEW_INFO] = parameters[RequestConstants.AppsStudio.VIEW_INFO] || {};
    populateUserStateInViewInfo(parameters[RequestConstants.AppsStudio.VIEW_INFO], options, ApplaneCallback(callback, function () {
        MetadataProvider.getApplication(parameters[RequestConstants.AppsStudio.ASK], options, ApplaneCallback(callback, function (applicationDetail) {
            parameters.applicationid = applicationDetail[QueryConstants.Query._ID];
            MetadataProvider.getOrganization(parameters[RequestConstants.AppsStudio.OSK], options, ApplaneCallback(callback, function (organizationDetail) {
                var organizationId = organizationDetail[QueryConstants.Query._ID];
                parameters.organizationid = organizationId;
                Self.getViewDetails(viewId, userId, organizationId, options, ApplaneCallback(callback, function (viewResult) {
                    if (Object.keys(viewResult).length == 0) {
                        throw new AppsStudioError(Constants.ErrorCode.VIEW_NOT_FOUND, [viewId]);
                    }
                    var applicationKey = viewId;
                    var organizationKey = viewId + "___" + organizationId;
                    var userKey = viewId + "___" + organizationId + "___" + userId;
                    var viewData = viewResult[applicationKey] || viewResult[organizationKey] || viewResult[userKey];
                    parameters.baasTableName = viewData[Constants.AppsStudio.Views.BAAS_VIEWID] [Constants.Baas.Views.TABLE][Constants.Baas.Tables.ID];
                    parameters.baasViewId = viewData[Constants.AppsStudio.Views.BAAS_VIEWID] [Constants.Baas.Views.ID];
                    parameters.quickViewId = viewData[Constants.AppsStudio.Views.QUICK_VIEWID];
                    var customization = viewData [Constants.AppsStudio.Views.CUSTOMIZATION] ? JSON.parse(viewData[Constants.AppsStudio.Views.CUSTOMIZATION]) : {};
                    customization[Constants.AppsStudio.Views.Customization.COLUMNS] = customization[Constants.AppsStudio.Views.Customization.COLUMNS] || {};
                    var schedules = viewData [Constants.AppsStudio.Views.SCHEDULES] || [];
                    if (viewResult[applicationKey]) {
                        if (parameters[RequestConstants.AppsStudio.VIEW_INFO][RequestConstants.AppsStudio.ViewInfo.APPLICATION_DEVELOPER]) {
                            addPropertyInColumnsObj(customization[Constants.AppsStudio.Views.Customization.COLUMNS], "developer");
                        }
                        if (viewResult[organizationKey]) {
                            var organizationViewDetail = viewResult[organizationKey];
                            var organizationViewCustomization = organizationViewDetail[Constants.AppsStudio.Views.CUSTOMIZATION] ? JSON.parse(organizationViewDetail[Constants.AppsStudio.Views.CUSTOMIZATION]) : {};
                            addPropertyInColumnsObj(customization[Constants.AppsStudio.Views.Customization.COLUMNS], "admin");
                            Self.mergeViewCustomization(customization, organizationViewCustomization);
                            var schedulesToMerge = organizationViewDetail[Constants.AppsStudio.Views.SCHEDULES] || [];
                            schedules = Self.mergeViewSchedules(schedules, schedulesToMerge);
                        }
                        if (viewResult[userKey]) {
                            var userViewDetail = viewResult[userKey];
                            var userViewCustomization = userViewDetail[Constants.AppsStudio.Views.CUSTOMIZATION] ? JSON.parse(userViewDetail[Constants.AppsStudio.Views.CUSTOMIZATION]) : {};
                            Self.mergeViewCustomization(customization, userViewCustomization);
                            var schedulesToMerge = userViewDetail[Constants.AppsStudio.Views.SCHEDULES] || [];
                            schedules = Self.mergeViewSchedules(schedules, schedulesToMerge);
                        }
                    } else if (viewResult[organizationKey]) {
                        addPropertyInColumnsObj(customization[Constants.AppsStudio.Views.Customization.COLUMNS], "admin");
                        if (viewResult[userKey]) {
                            var userViewDetail = viewResult[userKey];
                            var userViewCustomization = userViewDetail[Constants.AppsStudio.Views.CUSTOMIZATION] ? JSON.parse(userViewDetail[Constants.AppsStudio.Views.CUSTOMIZATION]) : {};
                            Self.mergeViewCustomization(customization, userViewCustomization);
                            var schedulesToMerge = userViewDetail[Constants.AppsStudio.Views.SCHEDULES] || [];
                            schedules = Self.mergeViewSchedules(schedules, schedulesToMerge);
                        }
                    }
                    parameters.customization = customization;
                    populateView(viewId, schedules, parameters, options, callback);
                }))
            }))
        }))
    }))
};

function populateUserStateInViewInfo(viewInfo, options, callback) {
    if (viewInfo[RequestConstants.AppsStudio.ViewInfo.USER_STATE]) {
        callback();
    } else {
        Self.getUserStates(options, ApplaneCallback(callback, function (userState) {
            viewInfo[RequestConstants.AppsStudio.ViewInfo.USER_STATE] = userState;
            callback();
        }))
    }
}

function addPropertyInColumnsObj(columns, property) {
    for (var expression in columns) {
        var column = columns[expression];
        if (column[Constants.AppsStudio.ViewColumns.VISIBILITY] && column[Constants.AppsStudio.ViewColumns.VISIBILITY] == "Off") {
            column[property] = true;
        }
    }
}

exports.mergeViewSchedules = function (schedules, schedulesToMerge) {
    if (typeof schedules == "string") {
        schedules = JSON.parse(schedules);
    }
    if (typeof schedulesToMerge == "string") {
        schedulesToMerge = JSON.parse(schedulesToMerge);
    }
    for (var i = 0; i < schedulesToMerge.length; i++) {
        var scheduleToMerge = schedulesToMerge[i];
        var scheduleToMergeId = scheduleToMerge[QueryConstants.Query._ID];
        var found = false;
        for (var j = 0; j < schedules.length; j++) {
            var schedule = schedules[j];
            var scheduleId = schedule[QueryConstants.Query._ID];
            if (scheduleToMergeId == scheduleId) {
                schedules[j] = scheduleToMerge;
                found = true;
                break;
            }
        }
        if (!found) {
            schedules.push(scheduleToMerge);
        }
    }
    return schedules;
}

exports.mergeViewCustomization = function (customizationInMerge, customizationToMerge) {
    var customizationInMergeColumns = customizationInMerge[Constants.AppsStudio.Views.Customization.COLUMNS] || {};
    var customizationToMergeColumns = customizationToMerge[Constants.AppsStudio.Views.Customization.COLUMNS];
    if (customizationToMergeColumns) {
        for (var expression in customizationToMergeColumns) {
            var toMergeColumnObject = customizationToMergeColumns[expression];
            customizationInMergeColumns[expression] = customizationInMergeColumns[expression] || {};
            var inMergeColumnObject = customizationInMergeColumns[expression];
            for (var exp in toMergeColumnObject) {
                inMergeColumnObject[exp] = toMergeColumnObject[exp];
            }
        }
        customizationInMerge[Constants.AppsStudio.Views.Customization.COLUMNS] = customizationInMergeColumns;
    }

    if (customizationToMerge[Constants.AppsStudio.Views.Customization.CHILDS]) {
        customizationInMerge[Constants.AppsStudio.Views.Customization.CHILDS] = mergeArray(customizationInMerge[Constants.AppsStudio.Views.Customization.CHILDS], customizationToMerge[Constants.AppsStudio.Views.Customization.CHILDS]);
    }
    if (customizationToMerge[Constants.AppsStudio.Views.Customization.SEQUENCE]) {
        customizationInMerge[Constants.AppsStudio.Views.Customization.SEQUENCE] = customizationToMerge[Constants.AppsStudio.Views.Customization.SEQUENCE];
    }
    if (customizationToMerge[Constants.AppsStudio.Views.Customization.ORDERS]) {
        customizationInMerge[Constants.AppsStudio.Views.Customization.ORDERS] = customizationToMerge[Constants.AppsStudio.Views.Customization.ORDERS];
    }
    if (customizationToMerge[Constants.AppsStudio.Views.Customization.SOURCE_APPLIED_FILTERS]) {
        customizationInMerge[Constants.AppsStudio.Views.Customization.SOURCE_APPLIED_FILTERS] = customizationToMerge[Constants.AppsStudio.Views.Customization.SOURCE_APPLIED_FILTERS];
    }
    if (customizationToMerge[Constants.AppsStudio.Views.Customization.COLUMN_GROUPS]) {
        customizationInMerge[Constants.AppsStudio.Views.Customization.COLUMN_GROUPS] = customizationToMerge[Constants.AppsStudio.Views.Customization.COLUMN_GROUPS];
    }
    if (customizationToMerge[Constants.AppsStudio.Views.Customization.ACTIONS]) {
        customizationInMerge[Constants.AppsStudio.Views.Customization.ACTIONS] = customizationToMerge[Constants.AppsStudio.Views.Customization.ACTIONS];
    }
    if (customizationToMerge[Constants.AppsStudio.Views.Customization.VIEW]) {
        customizationInMerge[Constants.AppsStudio.Views.Customization.VIEW] = customizationToMerge[Constants.AppsStudio.Views.Customization.VIEW];
    }
}

function mergeArray(inMerge, toMerge) {
    if (inMerge && inMerge.length > 0) {
        for (var i = 0; i < toMerge.length; i++) {
            var toMergeObject = toMerge[i];
            var toMergeId = toMergeObject[QueryConstants.Query._ID];
            var found = false;
            for (var j = 0; j < inMerge.length; j++) {
                var inMergeObject = inMerge[j];
                var inMergeId = inMergeObject[QueryConstants.Query._ID];
                if (toMergeId == inMergeId || toMergeObject.label.toLowerCase() == inMergeObject.label.toLowerCase()) {
                    inMerge.splice(j, 1);
                    inMerge.splice(j, 0, toMergeObject);
                    found = true;
                    break;
                }
            }
            if (!found) {
                inMerge.splice(i, 0, toMergeObject);
            }
        }
    } else {
        inMerge = toMerge;
    }
    return inMerge;
}

function getViewColumns() {
    var columns = [];
    columns.push(Constants.AppsStudio.Views.ID);
    columns.push(Constants.AppsStudio.Views.BAAS_VIEWID);
    columns.push(Constants.AppsStudio.Views.LABEL);
    columns.push(Constants.AppsStudio.Views.CUSTOMIZATION);
    columns.push(Constants.AppsStudio.Views.QUICK_VIEWID);
    columns.push(Constants.AppsStudio.Views.USERID);
    columns.push(Constants.AppsStudio.Views.ORGANIZATIONID);
    var schedules = {};
    schedules[QueryConstants.Query.Columns.EXPRESSION] = Constants.AppsStudio.Views.SCHEDULES;
    var scheduleColumns = [];
    scheduleColumns.push(Constants.AppsStudio.Views.Schedules.VISIBILITY);
    scheduleColumns.push(Constants.AppsStudio.Views.Schedules.WHEN);
    scheduleColumns.push({expression:Constants.AppsStudio.Views.Schedules.SCHEDULEID, columns:[Constants.AppsStudio.Schedules.NAME, Constants.AppsStudio.Schedules.VIEWID, Constants.AppsStudio.Schedules.DATE_FILTER, Constants.AppsStudio.Schedules.DATE_COLUMN]});
    schedules[QueryConstants.Query.COLUMNS] = scheduleColumns;
    columns.push(schedules);
    return columns;
}

exports.getViewDetails = function (viewId, userId, organizationId, options, callback) {
    var filter = {};
    filter[Constants.AppsStudio.Views.ID] = viewId;
    var orFilter = [];
    var applicationFilter = {};
    applicationFilter[Constants.AppsStudio.Views.USERID] = null;
    applicationFilter[Constants.AppsStudio.Views.ORGANIZATIONID] = null;
    orFilter.push(applicationFilter);
    if (organizationId) {
        var organizationFilter = {};
        organizationFilter[Constants.AppsStudio.Views.USERID] = null;
        organizationFilter[Constants.AppsStudio.Views.ORGANIZATIONID] = organizationId;
        orFilter.push(organizationFilter);
        if (userId) {
            var userFilter = {};
            userFilter[Constants.AppsStudio.Views.USERID] = userId;
            userFilter[Constants.AppsStudio.Views.ORGANIZATIONID] = organizationId;
            orFilter.push(userFilter);
        }
    }
    filter.$or = orFilter;

    var viewQuery = {};
    viewQuery[QueryConstants.Query.TABLE] = Constants.AppsStudio.VIEWS;
    viewQuery[QueryConstants.Query.COLUMNS] = getViewColumns();
    viewQuery[QueryConstants.Query.FILTER] = filter;
    DatabaseEngine.executeQuery(viewQuery, OptionsUtil.getOptions(options, Constants.AppsStudio.ASK), ApplaneCallback(callback, function (result) {
        var data = result[QueryConstants.Query.Result.DATA];
        var viewMap = {};
        if (data && data.length > 0) {
            var applicationKey = viewId;
            var organizationKey = viewId;
            var userKey = viewId;
            if (organizationId) {
                organizationKey = viewId + "___" + organizationId;
                if (userId) {
                    userKey = viewId + "___" + organizationId + "___" + userId;
                }
            }
            for (var i = 0; i < data.length; i++) {
                var row = data[i];
                if (!row[Constants.AppsStudio.Views.USERID] && !row[Constants.AppsStudio.Views.ORGANIZATIONID]) {
                    viewMap[applicationKey] = row;
                } else if (!row[Constants.AppsStudio.Views.USERID] && row[Constants.AppsStudio.Views.ORGANIZATIONID]) {
                    viewMap[organizationKey] = row;
                } else if (row[Constants.AppsStudio.Views.USERID] && row[Constants.AppsStudio.Views.ORGANIZATIONID]) {
                    viewMap[userKey] = row;
                }
            }
        }
        callback(null, viewMap);
    }))
}

function populateNewMetadata(newMetadata, viewType, baasTableName, baasViewId, childColumn, customization) {
    newMetadata[RequestConstants.AppsStudio.Metadata.TYPE] = viewType;
    newMetadata[RequestConstants.AppsStudio.Metadata.TABLE] = baasTableName;
    newMetadata[RequestConstants.AppsStudio.Metadata.BAAS_VIEW_ID] = baasViewId;
    if (childColumn) {
        newMetadata.primarycolumn = childColumn + "." + QueryConstants.Query._ID;
        newMetadata.childcolumn = childColumn;
    }
    newMetadata[Constants.AppsStudio.Views.Customization.MAIN_TABLE_ID] = customization[Constants.AppsStudio.Views.Customization.MAIN_TABLE_ID] || baasTableName;
}

function populateViewInfoCustomization(newMetadata, customization) {
    var savedViewCustomization = customization[Constants.AppsStudio.Views.Customization.VIEW];

    if (savedViewCustomization) {
        for (var exp in savedViewCustomization) {
            newMetadata[exp] = savedViewCustomization[exp];
        }
    }
}

function mergeOrders(newMetadata, customization, dataQuery) {
    var orders = customization[Constants.AppsStudio.Views.Customization.ORDERS];
    if (orders) {
        newMetadata[QueryConstants.Query.ORDERS] = orders;
        dataQuery[QueryConstants.Query.ORDERS] = orders;
    }
}

function getFlexibleChild(tableData, parameters) {
    var flexibleChild = {};
    flexibleChild.label = "Manage Flex Columns";
    flexibleChild.id = "Manage Flex Columns";
    flexibleChild.relatedcolumn = Constants.Baas.Flexfields.COLUMNVALUE;
    flexibleChild.viewid = "flexfields__baas";
    flexibleChild.system = true;
    flexibleChild.view = {"id":"flexfields__baas", "_id":"5225ad8ff0d7a1f40f000002"};
    var flexibleChildFilter = {};
    flexibleChildFilter[Constants.Baas.Flexfields.TABLE] = tableData[Constants.Baas.Tables.ID];
    if (tableData[Constants.Baas.Tables.ORGENABLED]) {
        flexibleChildFilter[Constants.Baas.Flexfields.ORGANIZATION] = parameters.organizationid;
    }
    flexibleChildFilter[Constants.Baas.Flexfields.COLUMNVALUE] = "{" + parameters.primarycolumn + "}";
    flexibleChild.filter = flexibleChildFilter;
    var parameterMappings = {}
    parameterMappings[parameters.primarycolumn] = parameters.primarycolumn;
    flexibleChild.parametermappings = parameterMappings;
    return flexibleChild;
}

function populateMetadataChilds(customization, tableData, parameters, newMetadata) {
    var customizationChilds = customization[Constants.AppsStudio.Views.Customization.CHILDS] || [];
    if (tableData && tableData[Constants.Baas.Tables.FLEXIBLE]) {
        for (var i = 0; i < customizationChilds.length; i++) {
            var customizationChild = customizationChilds[i];
            if (customizationChild.label == "Manage Flex Columns" && customizationChild.id == "Manage Flex Columns") {
                customizationChilds.splice(i, 1);
                break;
            }
        }
        var primaryColumn = newMetadata.primarycolumn || QueryConstants.Query._ID;
        parameters.primarycolumn = primaryColumn;
        var flexibleChild = getFlexibleChild(tableData, parameters);
        customizationChilds.push(flexibleChild);
    }
    newMetadata[RequestConstants.AppsStudio.Metadata.CHILDS] = customizationChilds;
}

function populateView(viewId, schedules, parameters, options, callback) {
    var viewInfo = parameters[RequestConstants.AppsStudio.VIEW_INFO];
    var baasTableName = parameters.baasTableName;
    var baasViewId = parameters.baasViewId;
    var customization = parameters.customization;
    if (viewInfo[QueryConstants.Query.FILTER] && typeof viewInfo[QueryConstants.Query.FILTER] == "string") {
        viewInfo[QueryConstants.Query.FILTER] = JSON.parse(viewInfo[QueryConstants.Query.FILTER]);
    }
    var queryOptions = OptionsUtil.getOptions(options, parameters[RequestConstants.AppsStudio.ASK], parameters[RequestConstants.AppsStudio.OSK]);
    Service.populateCurrentState(queryOptions, ApplaneCallback(callback, function () {
    getMetadataResult(baasTableName, baasViewId, queryOptions, ApplaneCallback(callback, function (metadataResult) {
        var metadata = metadataResult[QueryConstants.Query.Result.METADATA];
        var columns = metadata[QueryConstants.Query.COLUMNS];
        var dataQuery = {};
        var newMetadata = {};
        if (metadata.readonly) {
            newMetadata.readonly = true;
        }
        populateDataQuery(dataQuery, baasTableName, baasViewId, newMetadata, viewInfo);
        var userRecordLimit = viewInfo[QueryConstants.Query.MAX_ROWS] !== undefined ? viewInfo[QueryConstants.Query.MAX_ROWS] : (options.user[Constants.Baas.Users.RECORD_LIMIT]) ? options.user[Constants.Baas.Users.RECORD_LIMIT] : 50;
        dataQuery[QueryConstants.Query.MAX_ROWS] = userRecordLimit;
        newMetadata[QueryConstants.Query.MAX_ROWS] = userRecordLimit;
        if (schedules && schedules.length > 0) {
            newMetadata[RequestConstants.AppsStudio.Metadata.SCHEDULES] = schedules;
        }
        if (customization[Constants.AppsStudio.Views.Customization.COLUMN_GROUPS]) {
            newMetadata[RequestConstants.AppsStudio.Metadata.COLUMN_GROUPS] = customization[Constants.AppsStudio.Views.Customization.COLUMN_GROUPS];
        }
        if (customization[Constants.AppsStudio.Views.Customization.ACTIONS]) {
            newMetadata[RequestConstants.AppsStudio.Metadata.ACTIONS] = customization[Constants.AppsStudio.Views.Customization.ACTIONS];
        }
        var viewType = viewInfo[RequestConstants.AppsStudio.ViewInfo.TYPE] || "table";
        var childColumn = viewInfo[RequestConstants.AppsStudio.ViewInfo.CHILD_COLUMN];
        mergeOrders(newMetadata, customization, dataQuery);
        populateViewInfoCustomization(newMetadata, customization);
        populateNewMetadata(newMetadata, viewType, baasTableName, baasViewId, childColumn, customization);
        MetadataProvider.getTable(newMetadata[Constants.AppsStudio.Views.Customization.MAIN_TABLE_ID], queryOptions, ApplaneCallback(callback, function (tableData) {
            var applicationMatched = parameters.applicationid == tableData[Constants.Baas.Tables.MAINAPPLICATION][QueryConstants.Query._ID];
            populateMetadataChilds(customization, tableData, parameters, newMetadata);
            getQuickViews(parameters, options, ApplaneCallback(callback, function (quickViewData) {
                if (quickViewData && quickViewData.length > 0) {
                    addQuickViews(newMetadata, quickViewData, viewId, parameters);
                }
                populateMetadataColumns(columns, childColumn, null, queryOptions, ApplaneCallback(callback, function (columnsObj) {
                    var newColumnsObj = {};
                    addDottedColumnsInColumns(columnsObj, newColumnsObj);
                    mergeColumnsCustomization(newMetadata, dataQuery, newColumnsObj, customization, parameters, applicationMatched, queryOptions, ApplaneCallback(callback, function () {
                        mergeAppliedFilters(newMetadata, customization, dataQuery, parameters.organizationid, viewInfo);
                        getViewData(viewId, viewInfo, dataQuery, newMetadata, parameters.applicationid, parameters.organizationid, queryOptions, callback);
                    }));
                }));
            }));
        }));
    }))
    }))
}


function addDottedColumnsInColumns(columns, newColumns) {
    for (var expression in columns) {
        var columnMetadata = columns[expression];
        newColumns[expression] = columnMetadata;
        var columnType = columnMetadata[Constants.Baas.Tables.Columns.TYPE];
        var columnMetadataColumns = columnMetadata[Constants.Baas.Tables.COLUMNS];
        if (columnMetadataColumns && typeof columnMetadataColumns == "string") {
            columnMetadataColumns = JSON.parse(columnMetadataColumns);
            columnMetadata[Constants.Baas.Tables.COLUMNS] = columnMetadataColumns;
        }
        if ((columnType == Constants.Baas.Tables.Columns.Type.OBJECT || columnType == Constants.Baas.Tables.Columns.Type.LOOKUP) && columnMetadataColumns) {
            var innerColumns = columnMetadata[Constants.Baas.Tables.COLUMNS];
            var newInnerColumns = {};
            for (var i = 0; i < innerColumns.length; i++) {
                var innerColumn = Utils.deepClone(innerColumns[i]);
                innerColumn[Constants.AppsStudio.ViewColumns.VISIBILITY] = "None";
                innerColumn.pexpression = expression;
                var innerColumnExpression = innerColumn[Constants.Baas.Tables.Columns.EXPRESSION];
                if (innerColumnExpression != QueryConstants.Query._ID) {
                    innerColumn[Constants.Baas.Tables.Columns.EXPRESSION] = expression + "." + innerColumnExpression;
                    newColumns[expression + "." + innerColumnExpression] = innerColumn;
                    newInnerColumns[expression + "." + innerColumnExpression] = innerColumn;
                }
            }
            addDottedColumnsInColumns(newInnerColumns, newColumns);
        }
    }
}

function getMetadataResult(baasTableName, baasViewId, queryOptions, callback) {
    var metadataQuery = {};
    metadataQuery[QueryConstants.Query.TABLE] = baasTableName;
    metadataQuery[QueryConstants.Query.VIEW] = baasViewId;
    metadataQuery[QueryConstants.Query.METADATA] = true;
    metadataQuery[QueryConstants.Query.MAX_ROWS] = 0;
    DatabaseEngine.executeQuery(metadataQuery, queryOptions, callback);
}

function populateDataQuery(dataQuery, baasTableName, baasViewId, metadata, viewInfo) {
    dataQuery[QueryConstants.Query.TABLE] = baasTableName;
    dataQuery[QueryConstants.Query.VIEW] = baasViewId;
    dataQuery[QueryConstants.Query.FILTER] = viewInfo[RequestConstants.AppsStudio.ViewInfo.FILTER];
    var viewParameters = viewInfo[RequestConstants.AppsStudio.ViewInfo.PARAMETERS] || {};
    if (viewInfo[RequestConstants.AppsStudio.ViewInfo.PARAMETER_MAPPINGS]) {
        var viewParameterMappings = viewInfo[RequestConstants.AppsStudio.ViewInfo.PARAMETER_MAPPINGS];
        metadata[RequestConstants.AppsStudio.Metadata.PARAMETER_MAPPINGS] = viewParameterMappings;
        viewParameters = resolveParameterMappings(dataQuery, viewParameters, viewParameterMappings);
    }
    dataQuery[QueryConstants.Query.PARAMETERS] = viewParameters;
}

function resolveParameterMappings(dataQuery, viewParameters, viewParameterMappings) {
    var newParameters = {};
    var selectedKeys = viewParameters.selectedkeys;
    if (selectedKeys) {
        newParameters.selectedkeys = selectedKeys;
    }
    for (var parameterExpression in viewParameters) {
        if (isParameter(parameterExpression)) {
            newParameters[parameterExpression] = viewParameters[parameterExpression];
        }
    }
    if (viewParameters._id) {
        newParameters._id = viewParameters._id;
    }
    Object.keys(viewParameterMappings).forEach(function (k) {
        newParameters[k] = viewParameters[viewParameterMappings[k]]
    });

    return newParameters;
}

function getQuickViews(parameters, options, callback) {
    var organizationId = parameters.organizationid;
    var userId = options.user[QueryConstants.Query._ID];

    var quickViewFilter = {};
    quickViewFilter[Constants.AppsStudio.Views.QUICK_VIEWID] = "{id}";

    var quickViewQuery = {};
    quickViewQuery[QueryConstants.Query.TABLE] = Constants.AppsStudio.VIEWS;
    quickViewQuery[QueryConstants.Query.COLUMNS] = [Constants.AppsStudio.Views.ID, Constants.AppsStudio.Views.QUICK_VIEWID, Constants.AppsStudio.Views.LABEL, Constants.AppsStudio.Views.USERID, Constants.AppsStudio.Views.ORGANIZATIONID];
    quickViewQuery[QueryConstants.Query.FILTER] = quickViewFilter;
    quickViewQuery[QueryConstants.Query.PARAMETERS] = {"id":parameters.quickViewId};

    DatabaseEngine.executeQuery(quickViewQuery, OptionsUtil.getOptions(options, Constants.AppsStudio.ASK), ApplaneCallback(callback, function (quickViewResult) {
        var quickViewData = quickViewResult[QueryConstants.Query.Result.DATA];
        if (quickViewData && quickViewData.length > 0) {
            var newQuickViewData = [];
            var quickViewsObj = {};
            for (var i = 0; i < quickViewData.length; i++) {
                var quickView = quickViewData[i];
                var viewId = quickView[Constants.AppsStudio.Views.ID];
                if (quickViewsObj[viewId]) {
                    quickViewsObj[viewId].push(quickView);
                } else {
                    var quickViewsArray = [];
                    quickViewsArray.push(quickView);
                    quickViewsObj[viewId] = quickViewsArray;
                }
            }
            for (var viewId in quickViewsObj) {
                var quickViewsArray = quickViewsObj[viewId];
                if (quickViewsArray.length == 1) {
                    newQuickViewData.push(quickViewsArray[0]);
                } else {
                    var addUserQuickView = false;
                    for (var i = 0; i < quickViewsArray.length; i++) {
                        var quickView = quickViewsArray[i];
                        var quickViewUserId = quickView[Constants.AppsStudio.Views.USERID];
                        var quickViewOrganizationId = quickView[Constants.AppsStudio.Views.ORGANIZATIONID];
                        if (quickViewUserId && quickViewUserId[QueryConstants.Query._ID] == userId && (!quickViewOrganizationId || quickViewOrganizationId[QueryConstants.Query._ID] == organizationId)) {
                            addUserQuickView = true;
                            newQuickViewData.push(quickView);
                            break;
                        }
                    }
                    if (!addUserQuickView) {
                        var addOrganizationQuickView = false;
                        for (var i = 0; i < quickViewsArray.length; i++) {
                            var quickView = quickViewsArray[i];
                            var quickViewUserId = quickView[Constants.AppsStudio.Views.USERID];
                            var quickViewOrganizationId = quickView[Constants.AppsStudio.Views.ORGANIZATIONID]
                            if ((!quickViewUserId || quickViewUserId[QueryConstants.Query._ID] == userId) && quickViewOrganizationId && quickViewOrganizationId[QueryConstants.Query._ID] == organizationId) {
                                addOrganizationQuickView = true;
                                newQuickViewData.push(quickView);
                                break;
                            }
                        }
                        if (!addOrganizationQuickView) {
                            for (var i = 0; i < quickViewsArray.length; i++) {
                                var quickView = quickViewsArray[i];
                                var quickViewUserId = quickView[Constants.AppsStudio.Views.USERID];
                                var quickViewOrganizationId = quickView[Constants.AppsStudio.Views.ORGANIZATIONID]
                                if (!quickViewUserId && !quickViewOrganizationId) {
                                    newQuickViewData.push(quickView);
                                    break;
                                }
                            }
                        }
                    }
                }
            }
            callback(null, newQuickViewData);
        } else {
            callback();
        }
    }))
}

function mergeAppliedFilters(newMetadata, customization, dataQuery, organization, viewInfo) {
    var source = viewInfo[RequestConstants.AppsStudio.ViewInfo.SOURCE];
    newMetadata.source = source;
    var appliedFilters;
    if (source && customization && customization[Constants.AppsStudio.Views.Customization.SOURCE_APPLIED_FILTERS] && customization[Constants.AppsStudio.Views.Customization.SOURCE_APPLIED_FILTERS][source]) {
        appliedFilters = customization[Constants.AppsStudio.Views.Customization.SOURCE_APPLIED_FILTERS][source];
    }
    if (appliedFilters && Object.keys(appliedFilters).length > 0) {
        var appliedFiltersClone = Utils.deepClone(appliedFilters);
        dataQuery[QueryConstants.Query.FILTER] = dataQuery[QueryConstants.Query.FILTER] || {};
        var dataQueryFilters = dataQuery[QueryConstants.Query.FILTER];
        for (var appliedFilterExp in appliedFiltersClone) {
            if (appliedFilterExp == "advanceFilters") {
                continue;
            } else if (appliedFilterExp == "advanceFilter") {
                var appliedFilter = appliedFiltersClone[appliedFilterExp];
                if (appliedFilter instanceof Object) {
                    Object.keys(appliedFilter).forEach(function (appliedFilterKey) {
                        dataQueryFilters[appliedFilterKey] = appliedFilter[appliedFilterKey];
                    })
                }
            } else {
                var appliedFilter = appliedFiltersClone[appliedFilterExp];
                if (appliedFilter instanceof Object && appliedFilter.filter) {
                    if (appliedFilter.asparameter) {
                        dataQuery[QueryConstants.Query.PARAMETERS] = dataQuery[QueryConstants.Query.PARAMETERS] || {};
                        dataQuery[QueryConstants.Query.PARAMETERS][appliedFilterExp] = appliedFilter.filter;
                    } else {
                        if (appliedFilter.filter instanceof Object) {
                            Object.keys(appliedFilter.filter).forEach(function (k) {
                                dataQueryFilters[k] = appliedFilter.filter[k];
                            });
                        } else {
                            dataQueryFilters[appliedFilterExp] = appliedFilter.filter;
                        }
                    }
                }
            }
        }
    }
    var userState = viewInfo[RequestConstants.AppsStudio.ViewInfo.USER_STATE];
    if (userState && userState[Constants.Baas.Users.UserState.ORGANIZATION_WISE_STATE] && userState[Constants.Baas.Users.UserState.ORGANIZATION_WISE_STATE].length > 0) {
        var organizationWiseStates = userState[Constants.Baas.Users.UserState.ORGANIZATION_WISE_STATE];
        var universalFilter;
        for (var i = 0; i < organizationWiseStates.length; i++) {
            var organizationWiseState = organizationWiseStates[i];
            if (organizationWiseState[Constants.Baas.Users.UserState.OrganizationWiseState.ORGANIZATION] == organization && organizationWiseState[Constants.Baas.Users.UserState.OrganizationWiseState.UNIVERSAL_FILTER]) {
                universalFilter = JSON.parse(organizationWiseState[Constants.Baas.Users.UserState.OrganizationWiseState.UNIVERSAL_FILTER]);
                break;
            }
        }
        if (universalFilter && Object.keys(universalFilter).length > 0) {
            var columns = newMetadata.columns;
            for (var i = 0; i < columns.length; i++) {
                var column = columns[i];
                if (column[Constants.AppsStudio.ViewColumns.UNIVERSAL_FILTER] && column[Constants.AppsStudio.ViewColumns.UNIVERSAL_FILTER] != "Off" && column[Constants.Baas.Tables.Columns.TABLE]) {
                    var columnTable = column[Constants.Baas.Tables.Columns.TABLE][Constants.Baas.Tables.ID];
                    var columnUniversalFilter = column[Constants.AppsStudio.ViewColumns.UNIVERSAL_FILTER];
                    if (universalFilter[columnUniversalFilter] && universalFilter[columnUniversalFilter][columnTable]) {
                        var universalAppliedFilter = universalFilter[columnUniversalFilter][columnTable];
                        if (universalAppliedFilter instanceof Object && universalAppliedFilter.filter) {
                            dataQueryFilters[column[Constants.Baas.Tables.Columns.EXPRESSION]] = universalAppliedFilter.filter;
                            appliedFilters[column[Constants.Baas.Tables.Columns.EXPRESSION]] = universalAppliedFilter;
                        }
                    }
                }
            }
        }
    }

    if (appliedFilters && Object.keys(appliedFilters).length > 0) {
        newMetadata.filterparameters = appliedFilters;
    }
}

function addQuickViews(newMetadata, quickViewData, viewId, parameters) {
    var quickViewCount = quickViewData.length;
    var quickViewIndex = 0;
    for (var i = 0; i < quickViewCount; i++) {
        var quickView = quickViewData[i];
        if (quickView[Constants.AppsStudio.Views.ID] == viewId) {
            quickViewIndex = i;
        }
    }
    newMetadata[RequestConstants.AppsStudio.Metadata.QUICK_VIEWS] = quickViewData;
    newMetadata[RequestConstants.AppsStudio.Metadata.QUICK_VIEW_INDEX] = quickViewIndex;
}

function getColumn(expression, columns) {
    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        var columnExpression = column[QueryConstants.Query.Columns.EXPRESSION];
        if (expression == columnExpression) {
            return column;
        }
    }
}

function getMergedColumns(column, columnsToMerge) {
    var innerColumns = column[Constants.Baas.Tables.COLUMNS] || [];
    var innerColumnExps = [];
    for (var i = 0; i < innerColumns.length; i++) {
        var innerColumn = innerColumns[i];
        innerColumnExps.push(innerColumn[Constants.Baas.Tables.Columns.EXPRESSION]);
    }
    if (columnsToMerge && columnsToMerge.length > 0) {
        for (var i = 0; i < columnsToMerge.length; i++) {
            var column = columnsToMerge[i];
            var columnExp = column[Constants.Baas.Tables.Columns.EXPRESSION];
            if (innerColumnExps.indexOf(columnExp) == -1) {
                innerColumnExps.push(columnExp);
                innerColumns.push(column);
            }
        }
    }
    return innerColumns;
}

function addMultipleColumns(childLookupTable, columnExpression, columnsObj, options, callback) {
    MetadataProvider.getTable(childLookupTable, options, ApplaneCallback(callback, function (result) {
        var columns = result ? result[Constants.Baas.Tables.COLUMNS] || [] : [];
        for (var i = 0; i < columns.length; i++) {
            var column = Utils.deepClone(columns[i]);
            var multiple = column[Constants.Baas.Tables.Columns.MULTIPLE];
            var columnType = column[Constants.Baas.Tables.Columns.TYPE];
            if (multiple && (columnType == Constants.Baas.Tables.Columns.Type.LOOKUP || columnType == Constants.Baas.Tables.Columns.Type.OBJECT)) {
                column[Constants.Baas.Tables.Columns.EXPRESSION] = columnExpression + "." + column[Constants.Baas.Tables.Columns.EXPRESSION];
                column[Constants.AppsStudio.ViewColumns.VISIBILITY] = "None";
                columnsObj[column[Constants.Baas.Tables.Columns.EXPRESSION]] = column;
            }
        }
        callback();
    }))
}


function populateMetadataColumns(columns, childColumn, parentExp, options, callback) {
    var mainColumn;
    if (childColumn) {
        var indexOfDot = childColumn.indexOf(".");
        var mainExpression = indexOfDot > 0 ? childColumn.substr(0, indexOfDot) : childColumn;
        mainColumn = getColumn(mainExpression, columns);
        var mainInnerColumns = getMergedColumns(mainColumn, mainColumn[Constants.Baas.Tables.Columns.Type.Lookup.LOOKUP_DISPLAY_COLUMNS]);
//        mainInnerColumns = getMergedColumns(mainColumn, mainColumn[Constants.Baas.Tables.Columns.Type.Lookup.ID_COLUMNS]);
        if (indexOfDot > 0) {
            return populateMetadataColumns(mainInnerColumns, childColumn.substr(indexOfDot + 1), (parentExp ? parentExp + "." + mainExpression : mainExpression), options, callback);
        }
        var columnsObj = {};
        var mainColumnType = mainColumn[Constants.Baas.Tables.Columns.TYPE];
        if (mainColumnType == Constants.Baas.Tables.Columns.Type.LOOKUP) {
            mainColumn[Constants.Baas.Tables.Columns.EXPRESSION] = parentExp ? parentExp + "." + mainColumn[Constants.Baas.Tables.Columns.EXPRESSION] : mainColumn[Constants.Baas.Tables.Columns.EXPRESSION];
            mainColumn[Constants.Baas.Tables.Columns.MULTIPLE] = false;
            columnsObj[ mainColumn[Constants.Baas.Tables.Columns.EXPRESSION]] = mainColumn;
        }
        addDefaultIdColumns(columnsObj, parentExp ? parentExp + "." + childColumn + "." + QueryConstants.Query._ID : childColumn + "." + QueryConstants.Query._ID);
        for (var i = 0; i < mainInnerColumns.length; i++) {
            var mainInnerColumn = Utils.deepClone(mainInnerColumns[i]);
            mainInnerColumn[Constants.Baas.Tables.Columns.EXPRESSION] = parentExp ? parentExp + "." + childColumn + "." + mainInnerColumn[Constants.Baas.Tables.Columns.EXPRESSION] : childColumn + "." + mainInnerColumn[Constants.Baas.Tables.Columns.EXPRESSION];
            columnsObj[mainInnerColumn[Constants.Baas.Tables.Columns.EXPRESSION]] = mainInnerColumn;
        }
        if (mainColumnType == Constants.Baas.Tables.Columns.Type.LOOKUP) {
            var childLookupTable = mainColumn[Constants.Baas.Tables.Columns.TABLE][Constants.Baas.Tables.ID];
            addMultipleColumns(childLookupTable, (parentExp ? parentExp + "." + childColumn : childColumn), columnsObj, options, ApplaneCallback(callback, function () {
                callback(null, columnsObj);
            }))
        } else {
            callback(null, columnsObj);
        }
    } else {
        var columnsObj = {};
        for (var i = 0; i < columns.length; i++) {
            var column = columns[i];
            var expression = column[QueryConstants.Query.Columns.EXPRESSION];
            if (expression == "_organizationid_") {
                continue;
            }
            columnsObj[expression] = column;
        }
        callback(null, columnsObj);
    }
}

function addDefaultIdColumns(columns, columnExpression) {
    var childColumnProperties = {};
    childColumnProperties[Constants.AppsStudio.ViewColumns.LABEL] = "_Id";
    childColumnProperties[Constants.AppsStudio.ViewColumns.WIDTH] = 200;
    childColumnProperties[Constants.AppsStudio.ViewColumns.TYPE] = Constants.Baas.Tables.Columns.Type.STRING;
    childColumnProperties[Constants.AppsStudio.ViewColumns.VISIBILITY] = "Query";
    childColumnProperties[Constants.AppsStudio.ViewColumns.EXPRESSION] = columnExpression;
    columns[columnExpression] = childColumnProperties;
}

function mergeExtraProperties(customizeColumns, columnExpression, metadataColumn, newMetadataColumns) {
    var customizeColumn = customizeColumns[columnExpression];
//    if (customizeColumn && customizeColumn[Constants.AppsStudio.ViewColumns.VISIBILITY] == "Off") {
//        return;
//    }
    for (var expression in customizeColumn) {
        metadataColumn[expression] = customizeColumn[expression];
    }
    newMetadataColumns.push(metadataColumn);
}
function mergeColumnsCustomization(newMetadata, dataQuery, metadataColumns, customization, parameters, applicationMatched, options, callback) {
    var organizationAdmin = parameters[RequestConstants.AppsStudio.VIEW_INFO][RequestConstants.AppsStudio.ViewInfo.ORGANIZATION_ADMIN] || false;
    var applicationDeveloper = parameters[RequestConstants.AppsStudio.VIEW_INFO][RequestConstants.AppsStudio.ViewInfo.APPLICATION_DEVELOPER] || false;
    var newMetadataColumns = [];
    var sequence = customization ? customization[Constants.AppsStudio.Views.Customization.SEQUENCE] : null;
    var customizeColumns = customization ? customization[Constants.AppsStudio.Views.Customization.COLUMNS] : null;
    if (sequence && customizeColumns) {
        var columnsCount = sequence.length;
        for (var i = 0; i < columnsCount; i++) {
            var columnExpression = sequence[i];
            var metadataColumn = metadataColumns[columnExpression];
            if (metadataColumn) {
                mergeExtraProperties(customizeColumns, columnExpression, metadataColumn, newMetadataColumns);
            }
        }
        for (var expression in metadataColumns) {
            if (sequence.indexOf(expression) == -1) {
                newMetadataColumns.push(metadataColumns[expression]);
            }
        }
    } else {
        for (var expression in metadataColumns) {
            newMetadataColumns.push(metadataColumns[expression]);
        }
    }
    for (var i = 0; i < newMetadataColumns.length; i++) {
        var newMetadataColumn = newMetadataColumns[i];
        var newColumnExpression = newMetadataColumn[Constants.Baas.Tables.Columns.EXPRESSION];
        var columnVisibility = newMetadataColumn[Constants.AppsStudio.ViewColumns.VISIBILITY];
        if (columnVisibility instanceof Object) {
            columnVisibility = columnVisibility._val;
        }
        if (columnVisibility == "Embed") {
            for (var j = 0; j < newMetadataColumns.length; j++) {
                var newMetadataInnerColumn = newMetadataColumns[j];
                var innerColumnPExpression = newMetadataInnerColumn.pexpression
                if (innerColumnPExpression && (innerColumnPExpression == newColumnExpression || innerColumnPExpression.indexOf(newColumnExpression + ".") != -1)) {
                    newMetadataInnerColumn.subvisibility = "Embed";
                }
            }
        }
    }

    var queryColumns = [];
    var newMetadataColumnsArray = [];
    var privateColumns = [];
    Utils.iterateArray(newMetadataColumns, ApplaneCallback(callback, function () {
        dataQuery[QueryConstants.Query.COLUMNS] = queryColumns;
        newMetadata[RequestConstants.AppsStudio.Metadata.COLUMNS] = newMetadataColumnsArray;
        callback();
    }), function (newMetadataColumn, callback) {
        var newColumnExpression = newMetadataColumn[Constants.Baas.Tables.Columns.EXPRESSION];
        /* for not show extra columns of user to all application */
        var privateColumn = newMetadataColumn[Constants.Baas.Tables.Columns.PRIVATE];
        var dottedColumn = newColumnExpression.indexOf(".");
        if (dottedColumn && privateColumns.indexOf(newColumnExpression.substr(0, dottedColumn)) != -1) {
            privateColumn = true;
        }
        if (!applicationMatched && privateColumn) {
            privateColumns.push(newColumnExpression);
            callback();
        } else {
            deleteExtraColumns(newMetadataColumn);
            if (newMetadataColumn[Constants.Baas.Tables.Columns.Type.Lookup.LOOKUP_DISPLAY_COLUMNS]) {
                newMetadataColumn[Constants.Baas.Tables.Columns.Type.Lookup.LOOKUP_DISPLAY_COLUMNS] = manageColumnStructure(newMetadataColumn[Constants.Baas.Tables.Columns.Type.Lookup.LOOKUP_DISPLAY_COLUMNS]);
            }
            if (!newMetadataColumn[Constants.AppsStudio.ViewColumns.LABEL]) {
                if (newColumnExpression.lastIndexOf(".") != -1) {
                    newMetadataColumn[Constants.AppsStudio.ViewColumns.LABEL] = parseLabel(newColumnExpression.substr(newColumnExpression.lastIndexOf(".") + 1));
                } else {
                    newMetadataColumn[Constants.AppsStudio.ViewColumns.LABEL] = parseLabel(newColumnExpression);
                }
            }
            var columnMultiple = newMetadataColumn[Constants.AppsStudio.ViewColumns.MULTIPLE];
            var columnType = newMetadataColumn[Constants.Baas.Tables.Columns.TYPE];
            newMetadataColumn[Constants.AppsStudio.ViewColumns.WIDTH] = newMetadataColumn[Constants.AppsStudio.ViewColumns.WIDTH] || 200;
            if (!newMetadataColumn[Constants.AppsStudio.ViewColumns.VISIBILITY]) {
                if (newMetadataColumn[Constants.Baas.Tables.Columns.REVERSE_RELATION_COLUMN] || columnType == Constants.Baas.Tables.Columns.Type.OBJECT) {
                    newMetadataColumn[Constants.AppsStudio.ViewColumns.VISIBILITY] = "None";
                } else if ((columnMultiple && columnType == Constants.Baas.Tables.Columns.Type.LOOKUP) || columnType == Constants.Baas.Tables.Columns.Type.TEXT || columnType == Constants.Baas.Tables.Columns.Type.RICHTEXT) {
                    newMetadataColumn[Constants.AppsStudio.ViewColumns.VISIBILITY] = "Panel";
                } else {
                    newMetadataColumn[Constants.AppsStudio.ViewColumns.VISIBILITY] = "Both";
                }
            }
            if (columnType == Constants.Baas.Tables.Columns.Type.LOOKUP && newMetadataColumn[Constants.Baas.Tables.Columns.TABLE]) {
                newMetadataColumn[Constants.Baas.Tables.COLUMNS] = getMergedColumns(newMetadataColumn, newMetadataColumn[Constants.Baas.Tables.Columns.Type.Lookup.LOOKUP_DISPLAY_COLUMNS]);
            }
            removeInnerNoneVisibilityColumn(newMetadataColumn[Constants.Baas.Tables.COLUMNS]);
            if (newMetadataColumn[Constants.AppsStudio.ViewColumns.VISIBILITY] == "Table" || newMetadataColumn[Constants.AppsStudio.ViewColumns.VISIBILITY] == "Query" || newMetadataColumn[Constants.AppsStudio.ViewColumns.VISIBILITY] == "Both") {
                if (!newMetadataColumn.subvisibility) {
                    queryColumns.push(newMetadataColumn);
                }
            }
            if (newMetadataColumn[Constants.AppsStudio.ViewColumns.VISIBILITY] == "Off") {
                var developer = newMetadataColumn.developer;
                var admin = newMetadataColumn.admin;
                delete newMetadataColumn.developer;
                delete newMetadataColumn.admin;
                if ((applicationDeveloper && developer) || (organizationAdmin && admin) || (!developer && !admin)) {
                    newMetadataColumnsArray.push(newMetadataColumn);
                }
            } else {
                newMetadataColumnsArray.push(newMetadataColumn);
            }
            if (newMetadataColumn[Constants.Baas.Tables.Columns.FLEX_COLUMN] && newMetadataColumn[Constants.Baas.Tables.Columns.TABLE]) {
                var flexibleTableName = newMetadataColumn[Constants.Baas.Tables.Columns.TABLE][Constants.Baas.Tables.ID];
                FlexFieldColumn.getFlexFieldFlexibleColumns(flexibleTableName, options, ApplaneCallback(callback, function (flexibleColumms) {
                    if (flexibleColumms && flexibleColumms.length > 0) {
                        newMetadataColumn.flexcolumns = flexibleColumms;
                        callback();
                    } else {
                        callback();
                    }
                }));
            } else {
                callback();
            }
        }
    })
}

function removeInnerNoneVisibilityColumn(innerColumns) {
    if (innerColumns && innerColumns.length > 0) {
        for (var i = 0; i < innerColumns.length; i++) {
            var innerColumn = innerColumns[i];
            if (innerColumn.visibility && innerColumn.visibility == "None") {
                innerColumns.splice(i, 1);
                i = i - 1;
                continue;
            }
            removeInnerNoneVisibilityColumn(innerColumn.columns);
        }
    }
}

function deleteExtraColumns(column) {
    delete column[Constants.ModulesConstants.AuditTrail.Columns.UPDATED_ON];
    delete column[Constants.ModulesConstants.AuditTrail.Columns.UPDATED_BY];
    delete column[Constants.ModulesConstants.AuditTrail.Columns.CREATED_BY];
    delete column[Constants.ModulesConstants.AuditTrail.Columns.CREATED_ON];
    delete column.replicatecolumns;
    delete column.replicate;
    delete column.primarycolumns;
    delete column.primary;
    delete column[Constants.Baas.Tables.Columns.Type.Lookup.ID_COLUMNS];
}

function manageColumnStructure(columns) {
    if (columns && typeof columns == "string") {
        columns = JSON.parse(columns);
    }
    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        deleteExtraColumns(column);
        if (column[Constants.Baas.Tables.Columns.Type.Lookup.LOOKUP_DISPLAY_COLUMNS]) {
            column[Constants.Baas.Tables.Columns.Type.Lookup.LOOKUP_DISPLAY_COLUMNS] = manageColumnStructure(column[Constants.Baas.Tables.Columns.Type.Lookup.LOOKUP_DISPLAY_COLUMNS]);
        }
    }
    return columns;
}

function parseLabel(expression) {
    expression = expression.replace(/\./gi, " ");
    expression = expression.replace(/_id/gi, " ");
    expression = expression.replace(/__/gi, " ");
    expression = expression.replace(/_/gi, " ");
    var split = expression.split(" ");
    var newLabel = "";
    for (var i = 0; i < split.length; i++) {
        var word = split[i];
        word = word.substr(0, 1).toUpperCase() + word.substr(1);
        if (newLabel.length > 0) {
            newLabel = newLabel + " ";
        }
        newLabel = newLabel + word;
    }
    return newLabel;
}
function getViewData(viewId, viewInfo, dataQuery, metadata, applicationId, organizationId, queryOptions, callback) {
    dataQuery[QueryConstants.Query.FILTER] = dataQuery[QueryConstants.Query.FILTER] || {};
    var dataQueryFilters = dataQuery[QueryConstants.Query.FILTER];
    metadata[RequestConstants.AppsStudio.Metadata.FILTER] = dataQueryFilters;
    metadata[RequestConstants.AppsStudio.Metadata.PARAMETERS] = dataQuery[QueryConstants.Query.PARAMETERS];
    var orders = addIndexColumnInOrders(dataQuery);
    var addNestedResultInTree = viewInfo.childrendata || false;
    addExtraPropertiesInOrders(orders, addNestedResultInTree);
    if (orders.length > 0) {
        dataQuery[QueryConstants.Query.ORDERS] = orders;
        metadata[RequestConstants.AppsStudio.Metadata.ORDERS] = orders;
    } else {
        delete dataQuery[QueryConstants.Query.ORDERS];
        delete metadata[RequestConstants.AppsStudio.Metadata.ORDERS];
    }
    var view = {};
    view.ask = queryOptions.ask;
    view.osk = queryOptions.osk;
    view.usk = queryOptions.osk;
    view[RequestConstants.AppsStudio.VIEWID] = viewId;
    view[QueryConstants.Query.Result.METADATA] = metadata;
    dataQuery.keepstructure = true;
    populateChildsAsRole(metadata, queryOptions, ApplaneCallback(callback, function () {
        var queryCallback = function (err, result) {
            if (err) {
                view.dataexception = err.stack;
                view[QueryConstants.Query.Result.DATA] = {data:[]};
                callback(null, view);
            } else {
                view[QueryConstants.Query.Result.DATA] = result;
                updateApplicationWiseUserState(viewId, viewInfo, applicationId, organizationId, queryOptions, ApplaneCallback(callback, function () {
                    callback(null, view);
                }))
            }
        }
        DatabaseEngine.executeQuery(dataQuery, queryOptions, queryCallback);
    }))
}

function populateChildsAsRole(metadata, options, callback) {
    var childs = metadata[RequestConstants.AppsStudio.Metadata.CHILDS];
    if (childs && childs.length > 0) {
            if (options._currentstate && options._currentstate.role) {
                populateChildViewMap(childs, options, ApplaneCallback(callback, function (viewMap) {
                    RoleModule.populateChildsAsRole(childs, options._currentstate.role, viewMap);
                    callback();
                }))
            } else {
                callback();
            }
    } else {
        callback();
    }
}

function populateChildViewMap(childs, options, callback) {
    var viewIds = [];
    for (var i = 0; i < childs.length; i++) {
        var child = childs[i];
        if (child[Constants.AppsStudio.Views.Customization.Childs.VIEW]) {
            viewIds.push(child[Constants.AppsStudio.Views.Customization.Childs.VIEW][QueryConstants.Query._ID]);
        }
    }
    var filter = {};
    filter[QueryConstants.Query._ID] = {$in:viewIds};
    var query = {};
    query[QueryConstants.Query.TABLE] = Constants.Baas.VIEWS;
    query[QueryConstants.Query.COLUMNS] = [Constants.Baas.Views.TABLE, Constants.Baas.Views.ID];
    query[QueryConstants.Query.FILTER] = filter;
    DatabaseEngine.executeQuery(query, OptionsUtil.getOptions(options, Constants.Baas.ASK), ApplaneCallback(callback, function (result) {
        var data = result[QueryConstants.Query.Result.DATA] || [];
        var viewMap = {};
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            if (row[Constants.Baas.Views.TABLE]) {
                viewMap[row[Constants.Baas.Views.ID]] = row[Constants.Baas.Views.TABLE][Constants.Baas.Tables.ID];
            }
        }
        callback(null, viewMap);
    }))
}

function addExtraPropertiesInOrders(orders, addNestedResultInTree, aggregateColumns) {
    for (var i = 0; i < orders.length; i++) {
        var order = orders[i];
        var exp = Object.keys(order)[0];
        if (addNestedResultInTree && (order[exp].$recursive || order[exp].$group)) {
            order[exp].$result = QueryConstants.Query.Orders.Result.NESTED;
        }
    }
}
function addIndexColumnInOrders(dataQuery) {
    var dataQueryColumns = dataQuery[QueryConstants.Query.COLUMNS];
    var orders = dataQuery[QueryConstants.Query.ORDERS] || [];
    for (var i = 0; i < dataQueryColumns.length; i++) {
        var column = dataQueryColumns[i];
        var columnType = column[Constants.Baas.Tables.Columns.TYPE];
        var columnExpression = column[Constants.Baas.Tables.Columns.EXPRESSION];
        if (columnType == Constants.Baas.Tables.Columns.Type.INDEX) {
            if (orders instanceof Object && !(orders instanceof Array)) {
                orders = [orders];
            }
            var newOrder = {};
            newOrder[columnExpression] = {$order:"asc"};
            orders.unshift(newOrder);
            return orders;
        }
    }
    return orders;
}
exports.updateUserState = function (userState, options, callback) {
//    callback();
//    return;
    var updates = {};
    updates[QueryConstants.Query.TABLE] = Constants.Baas.USERS;
    var operation = {};
    operation[QueryConstants.Query._ID] = options.user[QueryConstants.Query._ID];
    operation.userstate = userState;
    updates[QueryConstants.Update.OPERATIONS] = operation;
    updates.excludejobs = true;
    updates.excludemodules = true;
    UpdateEngine.executeUpdate(updates, OptionsUtil.getOptions(options, Constants.Baas.ASK), callback);
}
function updateApplicationWiseUserState(viewId, viewInfo, application, organization, options, callback) {
    var menu = viewInfo[RequestConstants.AppsStudio.ViewInfo.MENUID];
    if (menu) {
        var userState = viewInfo[RequestConstants.AppsStudio.ViewInfo.USER_STATE];
        userState[Constants.Baas.Users.UserState.APPLICATION_WISE_STATE] = userState[Constants.Baas.Users.UserState.APPLICATION_WISE_STATE] || [];
        var applicationWiseStates = userState[Constants.Baas.Users.UserState.APPLICATION_WISE_STATE];
        var updateMenu = false;
        if (applicationWiseStates.length > 0) {
            for (var i = 0; i < applicationWiseStates.length; i++) {
                var applicationWiseState = applicationWiseStates[i];
                if (applicationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.ORGANIZATION] == organization && applicationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.APPLICATION] == application) {
                    applicationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.MENU] = menu;
                    applicationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.QUICK_VIEW] = viewId;
                    updateMenu = true;
                    break;
                }
            }
        }
        if (!updateMenu) {
            var applicationWiseState = {};
            applicationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.ORGANIZATION] = organization;
            applicationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.APPLICATION] = application;
            applicationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.MENU] = menu;
            applicationWiseState[Constants.Baas.Users.UserState.ApplicationWiseState.QUICK_VIEW] = viewId;
            applicationWiseStates.push(applicationWiseState)
        }
        Self.updateUserState(userState, options, callback);
    } else {
        callback();
    }
}
exports.getUserStates = function (options, callback) {
    var viewQuery = {};
    viewQuery[QueryConstants.Query.TABLE] = Constants.Baas.USERS;
    viewQuery[QueryConstants.Query.FILTER] = {"_id":options.user[QueryConstants.Query._ID]};
    viewQuery[QueryConstants.Query.COLUMNS] = [Constants.Baas.Users.USER_STATE];
    DatabaseEngine.executeQuery(viewQuery, OptionsUtil.getOptions(options, Constants.Baas.ASK), ApplaneCallback(callback, function (userStateResult) {
        var userStates = userStateResult[QueryConstants.Query.Result.DATA];
        var userState = {};
        if (userStates && userStates.length > 0 && userStates[0][Constants.Baas.Users.USER_STATE]) {
            userState = userStates[0][Constants.Baas.Users.USER_STATE];
        }
        callback(null, userState);
    }))
}
function isParameter(value) {
    var pattern = new RegExp("^(_).+(_)$");
    return pattern.test(value);
}