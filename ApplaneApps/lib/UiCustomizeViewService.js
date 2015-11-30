/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 17/2/14
 * Time: 1:06 AM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("ApplaneBaas/lib/shared/Constants.js");
var AppsStudioConstants = require("./AppsStudioConstants.js");
var RequestConstants = require("./RequestConstants.js");

var AppsStudioError = require("ApplaneCore/apputil/ApplaneError.js");
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");


var OptionsUtil = require("ApplaneBaas/lib/util/OptionsUtil.js");
var LogUtility = require("ApplaneBaas/lib/util/LogUtility.js");

exports.saveViewCustomization = function (parameters, options, finalCallback) {
    if (!finalCallback || (typeof finalCallback != 'function')) {
        throw new Error("Callback not defined in saveViewCustomization In UiCustomizeViewService.");
    }
    console.log("save view customization called>>>>" + JSON.stringify(parameters));
    try {
        if (!options.disablelogs && !options.logid) {
            finalCallback(new Error("UiCustomizeViewService>>saveViewCustomization>>Neither disablelogs nor logid provided"));
            return;
        }
        var user = options.user;
        if (!user) {
            finalCallback(new AppsStudioError(Constants.ErrorCode.SESSION_NOT_FOUND));
        }
        var subLogIdId = false;
        if (!options.disablelogs) {
            subLogIdId = LogUtility.startLog(options.logid, "UiCustomizeViewService >>>> exports.saveViewCustomization");
        }
        var callback = function (err, data) {
            if (subLogIdId) {
                LogUtility.endLog(options.logid, subLogIdId);
            }
            finalCallback(err, data);
        }

        var viewId = parameters.viewid;
        if (!viewId) {
            callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK, ["viewid"]));
            return;
        }
        populateViewCustomization(parameters, options, callback);
    } catch (e) {
        finalCallback(e);
    }
}

function saveCustomization(appView, queryView, appViewUpdateRequired, queryViewUpdateRequired, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        callback(new Error("Callback not defined in saveCustomization In UiCustomizeViewService."));
        return;
    }
    try {
        var lastModifiedTime = new Date().getTime();
        appView[AppsStudioConstants.UI_VIEWS.LAST_MODIFIED_TIME] = lastModifiedTime;
        queryView[Constants.Baas.Queries.LAST_MODIFIED_TIME] = lastModifiedTime;
        updateAppViews(appView, appViewUpdateRequired, options, function (err) {
            updateQueryViews(queryView, queryViewUpdateRequired, options, callback);
        })
    } catch (e) {
        callback(e);
    }

}
function populateViewCustomization(parameters, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        callback(new Error("Callback not defined in populateViewCustomization In UiCustomizeViewService."));
        return;
    }
    try {
        var ask = parameters.ask;
        var osk = parameters.osk;
        var viewId = parameters.viewid;
        authenticateView(ask, osk, viewId, options, function (err, authView) {
            if (err) {
                callback(err);
                return;
            }
            try {
                var appView = authView.appview;
                var queryView = authView.queryview;
//                console.log("appView >>>>>>>>>>>>>>>>>" + JSON.stringify(appView));
//                console.log("queryView >>>>>>>>>>>>>>>>>" + JSON.stringify(queryView));
                if (parameters.lastmodifiedtime && authView.globalorganization && appView[AppsStudioConstants.UI_VIEWS.LAST_MODIFIED_TIME] && appView[AppsStudioConstants.UI_VIEWS.LAST_MODIFIED_TIME] > parameters.lastmodifiedtime) {
                    callback(new Error("View is already modified by another developer.Kindly do the changes again."));
                    return;
                }
                if (parameters[RequestConstants.UIViews.REMOVE_CUSTOMIZATION] === true) {
                    removeCustomization(appView, queryView, options, function (err) {
                        callback(err);
                    })
                    return;
                }
                var appViewUpdateRequired = populateAppViewCustomization(appView, authView.globalorganization, parameters);
                var queryViewUpdateRequired = populateQueryViewCustomization(queryView, parameters);
                saveCustomization(appView, queryView, appViewUpdateRequired, queryViewUpdateRequired, options, callback);
            } catch (e) {
                callback(e);
            }
        })
    } catch (e) {
        callback(e);
    }
}

function removeCustomization(appView, queryView, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        callback(new Error("Callback not defined in removeCustomization In UiCustomizeViewService."));
        return;
    }
    try {
        deleteView(appView, AppsStudioConstants.UI_VIEWS.TABLE, AppsStudioConstants.ASK, options, function (err) {
            if (err) {
                callback(err);
                return;
            }
            try {
                deleteView(queryView, Constants.Baas.QUERIES, Constants.Baas.ASK, options, function (err) {
                    callback(err);
                })
            } catch (e) {
                callback(e);
            }
        })
    } catch (e) {
        callback(e);
    }
}

function deleteView(view, tableName, ask, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        callback(new Error("Callback not defined in deleteView In UiCustomizeViewService."));
        return;
    }
    try {
        if (!view[QueryConstants.Query._ID]) {
            callback();
            return;
        }
        var updates = {};
        updates[QueryConstants.Query.TABLE] = tableName;
        var operation = {};
        operation[QueryConstants.Query._ID] = view[QueryConstants.Query._ID];
        operation[QueryConstants.Update.Operation.TYPE] = QueryConstants.Update.Operation.Type.DELETE;
        updates[QueryConstants.Update.OPERATIONS] = operation;
        UpdateEngine.executeUpdate(updates, OptionsUtil.getOptions(options, ask), callback);
    } catch (e) {
        callback(e);
    }

}

function populateAppViewCustomization(appView, globalOrganization, parameters) {
    var updateRequired = false;
    if (parameters[AppsStudioConstants.UI_VIEWS.LABEL]) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.LABEL] = parameters[AppsStudioConstants.UI_VIEWS.LABEL];
    }

    if (parameters[AppsStudioConstants.UI_VIEWS.TEMPLATE] !== undefined) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.TEMPLATE] = parameters[AppsStudioConstants.UI_VIEWS.TEMPLATE];
    }

    if (parameters[AppsStudioConstants.UI_VIEWS.INSERT] !== undefined) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.INSERT] = parameters[AppsStudioConstants.UI_VIEWS.INSERT];
    }

    if (parameters[AppsStudioConstants.UI_VIEWS.SAVE] !== undefined) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.SAVE] = parameters[AppsStudioConstants.UI_VIEWS.SAVE];
    }

    if (parameters[AppsStudioConstants.UI_VIEWS.INSERT_MODE] !== undefined) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.INSERT_MODE] = parameters[AppsStudioConstants.UI_VIEWS.INSERT_MODE];
    }

    if (parameters[AppsStudioConstants.UI_VIEWS.UPDATE_TYPE] !== undefined) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.UPDATE_TYPE] = parameters[AppsStudioConstants.UI_VIEWS.UPDATE_TYPE];
    }

    if (parameters[AppsStudioConstants.UI_VIEWS.DELETE] !== undefined) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.DELETE] = parameters[AppsStudioConstants.UI_VIEWS.DELETE];
    }

    if (parameters[AppsStudioConstants.UI_VIEWS.ENABLE_SELECTION] !== undefined) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.ENABLE_SELECTION] = parameters[AppsStudioConstants.UI_VIEWS.ENABLE_SELECTION];
    }

    if (parameters[AppsStudioConstants.UI_VIEWS.EDIT] !== undefined) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.EDIT] = parameters[AppsStudioConstants.UI_VIEWS.EDIT];
    }

    if (parameters[AppsStudioConstants.UI_VIEWS.MAX_ROWS]) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.MAX_ROWS] = parameters[AppsStudioConstants.UI_VIEWS.MAX_ROWS];
    }

    if (parameters[AppsStudioConstants.UI_VIEWS.COLUMNS]) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.COLUMNS] = parameters[AppsStudioConstants.UI_VIEWS.COLUMNS];
    }
    if (parameters[AppsStudioConstants.UI_VIEWS.SEQUENCE]) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.SEQUENCE] = {data:parameters[AppsStudioConstants.UI_VIEWS.SEQUENCE], override:true};
    }
    if (parameters[AppsStudioConstants.UI_VIEWS.SEQUENCE_PANEL]) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.SEQUENCE_PANEL] = {data:parameters[AppsStudioConstants.UI_VIEWS.SEQUENCE_PANEL], override:true};
    }
    if (parameters[AppsStudioConstants.UI_VIEWS.ACTIONS]) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.ACTIONS] = parameters[AppsStudioConstants.UI_VIEWS.ACTIONS];
    }
    if (parameters[AppsStudioConstants.UI_VIEWS.COLUMN_GROUPS]) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.COLUMN_GROUPS] = parameters[AppsStudioConstants.UI_VIEWS.COLUMN_GROUPS];
    }
    if (parameters[AppsStudioConstants.UI_VIEWS.FILTER] && parameters[RequestConstants.UIViews.SOURCE] && !globalOrganization) {
        updateRequired = true;
        appView[AppsStudioConstants.UI_VIEWS.FILTER] = appView[AppsStudioConstants.UI_VIEWS.FILTER] || {};
        appView[AppsStudioConstants.UI_VIEWS.FILTER][parameters[RequestConstants.UIViews.SOURCE]] = parameters[AppsStudioConstants.UI_VIEWS.FILTER];
    }
    return updateRequired;
}

function populateQueryViewCustomization(queryView, parameters) {
    var updateRequired = false;
    if (parameters[AppsStudioConstants.UI_VIEWS.COLUMNS]) {
        var columns = parameters[AppsStudioConstants.UI_VIEWS.COLUMNS];
        var query = queryView[Constants.Baas.Queries.QUERY] || {};
        var columnsLength = columns.length;
        var queryUpdateRequired = false;
        for (var i = 0; i < columnsLength; i++) {
            var column = columns[i];
            var columnExpression = column[Constants.Baas.Tables.Columns.EXPRESSION];
            var showOnTable = column[AppsStudioConstants.UI_VIEWS.Columns.SHOW_ON_TABLE];
            if (showOnTable !== undefined) {
                queryUpdateRequired = true;
                if (!query[Constants.Baas.Queries.Query.FIELDS]) {
                    query[Constants.Baas.Queries.Query.FIELDS] = {};
                }
                query[Constants.Baas.Queries.Query.FIELDS][columnExpression] = showOnTable ? 1 : 0;
            }
            if (column[AppsStudioConstants.UI_VIEWS.Columns.TOTAL_AGGREGATE] !== undefined) {
                queryUpdateRequired = true;

                query[Constants.Baas.Queries.Query.AGGREGATES] = query[Constants.Baas.Queries.Query.AGGREGATES] || {};

                if (column[AppsStudioConstants.UI_VIEWS.Columns.TOTAL_AGGREGATE]) {
                    query[Constants.Baas.Queries.Query.AGGREGATES][columnExpression] = column[AppsStudioConstants.UI_VIEWS.Columns.TOTAL_AGGREGATE];
                } else {
                    delete query[Constants.Baas.Queries.Query.AGGREGATES][columnExpression];
                }
            }
            if (column[AppsStudioConstants.UI_VIEWS.Columns.UNWIND] !== undefined) {
                queryUpdateRequired = true;
                query[Constants.Baas.Queries.Query.UNWIND_COLUMNS] = query[Constants.Baas.Queries.Query.UNWIND_COLUMNS] || {};
                if (column[AppsStudioConstants.UI_VIEWS.Columns.UNWIND]) {
                    query[Constants.Baas.Queries.Query.UNWIND_COLUMNS][columnExpression] = 1;
                } else {
                    delete query[Constants.Baas.Queries.Query.UNWIND_COLUMNS][columnExpression];
                }
            }
        }
        if (queryUpdateRequired) {
            updateRequired = true;
            queryView[Constants.Baas.Queries.QUERY] = query;
        }
    }
    if (parameters[RequestConstants.UIViews.ORDERS]) {
        updateRequired = true;
        queryView[Constants.Baas.Queries.QUERY] = queryView[Constants.Baas.Queries.QUERY] || {};
        queryView[Constants.Baas.Queries.QUERY][QueryConstants.Query.ORDERS] = parameters[RequestConstants.UIViews.ORDERS];
    }
    if (parameters[RequestConstants.UIViews.ADVANCE_FILTER] !== undefined) {
        updateRequired = true;
        queryView[Constants.Baas.Queries.QUERY] = queryView[Constants.Baas.Queries.QUERY] || {};
        if (parameters[RequestConstants.UIViews.ADVANCE_FILTER]) {
            queryView[Constants.Baas.Queries.QUERY][QueryConstants.Query.FILTER] = parameters[RequestConstants.UIViews.ADVANCE_FILTER];
        } else {
            queryView[Constants.Baas.Queries.QUERY][QueryConstants.Query.FILTER] = {};
        }

    }
    return updateRequired;
}

function updateAppViews(appViewUpdates, appViewUpdateRequired, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        callback(new Error("Callback not defined in updateAppViews In UiCustomizeViewService."));
        return;
    }
    try {
        if (appViewUpdateRequired) {
//            console.log("appviewupdateRequired ?>>>>>>>>>>>>>>>>>>>" + JSON.stringify(appViewUpdates));
            require("ApplaneBaas/lib/database/UpdateEngine.js").executeUpdate({table:AppsStudioConstants.UI_VIEWS.TABLE, operations:appViewUpdates}, OptionsUtil.getOptions(options, AppsStudioConstants.ASK), function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback();
            });
        } else {
            callback();
        }
    } catch (e) {
        callback(e);
    }
}

function updateQueryViews(baasViewUpdates, queryViewUpdateRequired, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        callback(new Error("Callback not defined in updateQueryViews In UiCustomizeViewService."));
        return;
    }
    try {
        if (queryViewUpdateRequired) {
//            console.log("queryViewUpdateRequired ?>>>>>>>>>>>>>>>>>>>" + JSON.stringify(baasViewUpdates));
            require("ApplaneBaas/lib/database/UpdateEngine.js").executeUpdate({table:Constants.Baas.QUERIES, operations:baasViewUpdates}, OptionsUtil.getOptions(options, Constants.Baas.ASK), function (err) {
                if (err) {
                    callback(err);
                    return;
                }
                callback();
            });
        } else {
            callback();
        }
    } catch (e) {
        callback(e);
    }
}

function authenticateView(ask, osk, viewId, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        callback(new Error("Callback not defined in authenticateView in UiCustomizeViewService"));
        return;
    }
    try {
        var RequestAuthenticator = require("ApplaneBaas/lib/server/RequestAuthenticator.js");
        RequestAuthenticator.authenticate(ask, osk, options, function (err, authInfo) {
            if (err) {
                callback(err);
                return;
            }
            try {
                var authView = {};
                authView.application = authInfo.application;
                authView.organization = authInfo.organization;
                if (authInfo.organization[Constants.Baas.Organizations.ID] == Constants.Baas.Organizations.GLOBAL_ORGANIZATION.id) {
                    authView.globalorganization = true;
                }
                var query = {};
                query[QueryConstants.Query.TABLE] = AppsStudioConstants.UI_VIEWS.TABLE;
                var globalViewFilter = {};
                globalViewFilter[Constants.Baas.Queries.ID] = viewId;
                globalViewFilter[Constants.Baas.Queries.ORGANIZATIONID] = authInfo.organization[QueryConstants.Query._ID];
                if (!authView.globalorganization) {
                    globalViewFilter[Constants.Baas.Queries.USERID] = options.user[QueryConstants.Query._ID];
                }
                query[QueryConstants.Query.FILTER] = globalViewFilter;
                DatabaseEngine.executeQuery(query, OptionsUtil.getOptions(options, AppsStudioConstants.ASK), function (err, viewData) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    try {
                        if (viewData.data.length > 1) {
                            callback(new Error("More than one AppsStudio view found >>>" + JSON.stringify(query)));
                            return;
                        }
                        var appView = {};
                        if (viewData.data.length == 0) {
                            appView[AppsStudioConstants.UI_VIEWS.ID] = viewId;
                            appView[AppsStudioConstants.UI_VIEWS.ORGANIZATIONID] = {_id:authInfo.organization[QueryConstants.Query._ID], id:authInfo.organization[Constants.Baas.Organizations.ID]};
                            if (!authView.globalorganization) {
                                appView[AppsStudioConstants.UI_VIEWS.USERID] = {_id:options.user[QueryConstants.Query._ID], username:options.user[Constants.Baas.Users.USERNAME]};
                            }
                        } else {
                            appView = viewData.data[0];
                        }
                        authView.appview = appView;
                        var baasViewQuery = {};
                        baasViewQuery[QueryConstants.Query.TABLE] = Constants.Baas.QUERIES;
                        baasViewQuery[QueryConstants.Query.FILTER] = globalViewFilter;
                        DatabaseEngine.executeQuery(baasViewQuery, OptionsUtil.getOptions(options, Constants.Baas.ASK), function (err, baasViewData) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            try {
                                if (baasViewData.data.length > 1) {
                                    callback(new Error("More than one baas view found >>>" + JSON.stringify(baasViewQuery)));
                                    return;
                                }
                                var queryView = {};
                                if (baasViewData.data.length == 0) {
                                    queryView[Constants.Baas.Queries.ID] = viewId;
                                    queryView[Constants.Baas.Queries.ORGANIZATIONID] = {_id:authInfo.organization[QueryConstants.Query._ID], id:authInfo.organization[Constants.Baas.Organizations.ID]};
                                    if (!authView.globalorganization) {
                                        queryView[Constants.Baas.Queries.USERID] = {_id:options.user[QueryConstants.Query._ID], username:options.user[Constants.Baas.Users.USERNAME]};
                                    }
                                } else {
                                    queryView = baasViewData.data[0];
                                }
                                authView.queryview = queryView;
                                callback(null, authView);
                            } catch (e) {
                                callback(e);
                            }
                        })
                    } catch (e) {
                        callback(e);
                    }
                })
            } catch (e) {
                callback(e);
            }
        })
    } catch (e) {
        callback(e);
    }
}
