/**
 * get viewid
 *
 */


var AppsStudioConstants = require("./AppsStudioConstants.js");
var Constants = require("ApplaneBaas/lib/shared/Constants.js");
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");

var OptionsUtil = require("ApplaneBaas/lib/util/OptionsUtil.js");
var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var Utils = require("ApplaneCore/apputil/util.js");
var AppsStudioError = require("ApplaneCore/apputil/ApplaneError.js");
var LogUtility = require("ApplaneBaas/lib/util/LogUtility.js");
var SELF = require("./UiViewService.js");
var RequestConstants = require("./RequestConstants.js");


exports.getView = function (parameters, options, finalCallback) {
    if (!finalCallback || (typeof finalCallback != 'function')) {
        throw new Error("Callback not defined in getView In UiViewService.");
    }
    try {
        if (!options.disablelogs && !options.logid) {
            finalCallback(new Error("ViewService>>getView>>Neither disablelogs nor logid provided"));
            return;
        }
        var user = options.user;
        if (!user) {
            finalCallback(new AppsStudioError(Constants.ErrorCode.SESSION_NOT_FOUND));
        }
        var subLogIdId = false;
        if (!options.disablelogs) {
            subLogIdId = LogUtility.startLog(options.logid, "ViewService >>>> exports.getView");
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
        SELF.authenticateView(parameters.ask, parameters.osk, viewId, false, options, function (err, authView) {
            if (err) {
                callback(err);
                return;
            }
            try {
                populateView(parameters, authView.application, authView.organization, authView.globalview, authView.organizationview, authView.userview, authView.queryviews, options, callback);

            } catch (e) {
                callback(e);
            }

        })


    } catch (e) {
        finalCallback(e);
    }
};

function getGlobalView(views) {
    if (!views) {
        return;
    }
    for (var i = 0; i < views.length; i++) {
        if (!views[i][AppsStudioConstants.UI_VIEWS.ORGANIZATIONID] && !views[i][AppsStudioConstants.UI_VIEWS.USERID]) {
            return views[i];
        }

    }
}
function getOrganizationView(views, organizationId) {
    if (!views) {
        return;
    }
    for (var i = 0; i < views.length; i++) {
        if (views[i][AppsStudioConstants.UI_VIEWS.ORGANIZATIONID] && views[i][AppsStudioConstants.UI_VIEWS.ORGANIZATIONID][QueryConstants.Query._ID] == organizationId && !views[i][AppsStudioConstants.UI_VIEWS.USERID]) {
            return views[i];
        }

    }
}
function getUserView(views, organizationId, userId) {
    if (!views) {
        return;
    }
    for (var i = 0; i < views.length; i++) {
        if (views[i][AppsStudioConstants.UI_VIEWS.ORGANIZATIONID] && views[i][AppsStudioConstants.UI_VIEWS.ORGANIZATIONID][QueryConstants.Query._ID] == organizationId && views[i][AppsStudioConstants.UI_VIEWS.USERID] && views[i][AppsStudioConstants.UI_VIEWS.USERID][QueryConstants.Query._ID] == userId) {
            return views[i];
        }

    }
}
exports.authenticateView = function (ask, osk, viewId, queryViewRequired, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in authenticateView in UIViewService");
    }
    try {
        var RequestAuthenticator = require("ApplaneBaas/lib/server/RequestAuthenticator.js")
        RequestAuthenticator.authenticate(ask, osk, options, function (err, authInfo) {
            if (err) {
                callback(err)
                return
            }
            try {
                getAppsStudioViews(viewId, authInfo.organization, options, function (err, views) {
                    if (err) {
                        callback(err)
                        return;
                    }
                    try {
                        var authView = {};
                        authView.application = authInfo.application
                        authView.organization = authInfo.organization
                        authView.globalview = views.global
                        authView.organizationview = views.organization
                        authView.userview = views.user
                        if (authView.organization[Constants.Baas.Organizations.ID] == Constants.Baas.Organizations.GLOBAL_ORGANIZATION.id) {
                            authView.globalorganization = true;
                            queryViewRequired = true;
                        }
                        if (queryViewRequired) {
                            DatabaseEngine.getQueryViews(viewId, authView.organization, options, function (err, queryViews) {
                                if (err) {
                                    callback(err);
                                    return;
                                }
                                try {
                                    authView.queryviews = {};
                                    authView.queryviews.globalview = queryViews.globalview;
                                    authView.queryviews.organizationview = queryViews.organizationview;
                                    authView.queryviews.userview = queryViews.userview;
                                    callback(null, authView);

                                } catch (e) {
                                    callback(e);
                                }
                            })

                        } else {
                            callback(null, authView);
                        }


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

function populateView(parameters, application, organization, globalView, organizationView, userView, queryviews, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined");
    }
    try {


        var viewId = parameters[RequestConstants.UIViews.VIEW_ID];
        var ask = parameters[RequestConstants.UIViews.ASK];
        var osk = parameters[RequestConstants.UIViews.OSK];
        var filter = parameters[RequestConstants.UIViews.FILTER];

        var requestParameters = parameters[RequestConstants.UIViews.PARAMETERS] || {};

        var viewOptions = OptionsUtil.getOptions(options, ask, osk);
        require("ApplaneBaas/Service.js").populateCurrentState(viewOptions, function (err) {
            if (err) {
                callback();
                return;
            }
            try {
                var viewType = AppsStudioConstants.UI_VIEWS.Type.TABLE;
                var viewQuery = {};
                viewQuery[QueryConstants.Query.VIEW] = viewId;
                viewQuery[QueryConstants.Query.METADATA] = true;

                if (parameters.resulttype) {
                    viewQuery.resulttype = parameters.resulttype;
                }
                var max_rows = getViewSelfPorperty(AppsStudioConstants.UI_VIEWS.MAX_ROWS, globalView, organizationView, userView);
                if (max_rows !== undefined) {
                    if (max_rows.toString().trim().length == 0) {
                        max_rows = undefined;
                    }
                }
                max_rows = max_rows !== undefined ? Number(max_rows) : parameters[RequestConstants.UIViews.MAX_ROWS] !== undefined ? parameters[RequestConstants.UIViews.MAX_ROWS] : (options.user[Constants.Baas.Users.RECORD_LIMIT]) ? options.user[Constants.Baas.Users.RECORD_LIMIT] : 50;
                var template = getViewSelfPorperty(AppsStudioConstants.UI_VIEWS.TEMPLATE, globalView, organizationView, userView);
                if (template) {
                    viewQuery[QueryConstants.Query.TEMPLATE] = template;
                    viewType = AppsStudioConstants.UI_VIEWS.Type.HTML;
                }


                viewQuery[QueryConstants.Query.FILTER] = filter;
                viewQuery[QueryConstants.Query.PARAMETERS] = requestParameters;

//                if (max_rows && max_rows == 1) {
//                var queryColumns = undefined;
//                    viewType = "panel";
//                    queryColumns = getPanelColumns(globalView, organizationView, userView);
//                    viewQuery[QueryConstants.Query.COLUMNS] = queryColumns;
//                }


                viewQuery[QueryConstants.Query.MAX_ROWS] = 0;
                DatabaseEngine.executeQuery(viewQuery, viewOptions, function (err, viewMetaData) {
                    try {
                        if (err) {
                            callback(err);
                            return;
                        }

                        var metadata = viewMetaData[QueryConstants.Query.Result.METADATA];

                        SELF.populateViewSelf(metadata, globalView, organizationView, userView);

                        metadata[AppsStudioConstants.UI_VIEWS.ACTIONS] = globalView[AppsStudioConstants.UI_VIEWS.ACTIONS];
                        metadata[AppsStudioConstants.UI_VIEWS.ACTIONS] = SELF.mergeOtherKeys(metadata, organizationView, AppsStudioConstants.UI_VIEWS.ACTIONS);
                        metadata[AppsStudioConstants.UI_VIEWS.ACTIONS] = SELF.mergeOtherKeys(metadata, userView, AppsStudioConstants.UI_VIEWS.ACTIONS);

                        metadata[AppsStudioConstants.UI_VIEWS.COLUMN_GROUPS] = globalView[AppsStudioConstants.UI_VIEWS.COLUMN_GROUPS];
                        metadata[AppsStudioConstants.UI_VIEWS.COLUMN_GROUPS] = SELF.mergeOtherKeys(metadata, organizationView, AppsStudioConstants.UI_VIEWS.COLUMN_GROUPS);
                        metadata[AppsStudioConstants.UI_VIEWS.COLUMN_GROUPS] = SELF.mergeOtherKeys(metadata, userView, AppsStudioConstants.UI_VIEWS.COLUMN_GROUPS);


                        populateColumns(metadata, globalView, organizationView, userView, parameters, viewOptions, function (err) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            try {
                                metadata[RequestConstants.UIViews.MAX_ROWS] = max_rows;

                                metadata.viewid = viewId;
                                metadata.viewid_id = globalView[QueryConstants.Query._ID];
                                metadata.parameters = requestParameters;
                                if (organizationView) {
                                    metadata[AppsStudioConstants.UI_VIEWS.LAST_MODIFIED_TIME] = organizationView[AppsStudioConstants.UI_VIEWS.LAST_MODIFIED_TIME];
                                }
                                getChilds(viewId, organization, parameters[RequestConstants.UIViews.DEVELOPER], viewOptions, function (err, childs) {

                                    try {
                                        if (err) {
                                            callback(err);
                                            return;
                                        }
                                        populateActionAsRole(metadata, parameters, viewOptions, function (err) {
                                            if (err) {
                                                callback(err);
                                                return;
                                            }
                                            try {
                                                getQuickViews(parameters[RequestConstants.UIViews.SOURCE], organization, metadata.table, viewOptions, function (err, quickViews) {
                                                    if (err) {
                                                        callback(err);
                                                        return;
                                                    }
                                                    try {
                                                        metadata.childs = childs || [];
                                                        metadata.quickviews = quickViews || [];
                                                        metadata[RequestConstants.UIViews.SOURCE] = parameters[RequestConstants.UIViews.SOURCE];
                                                        metadata[RequestConstants.UIViews.MENUID] = parameters[RequestConstants.UIViews.MENUID];
                                                        metadata[AppsStudioConstants.UI_VIEWS.ACTIONS] = metadata[AppsStudioConstants.UI_VIEWS.ACTIONS] || [];
                                                        var commitRequired = organizationView || (queryviews && queryviews.organizationview);
                                                        var commitAction = getCommitViewAction(parameters[RequestConstants.UIViews.DEVELOPER], organization, commitRequired, metadata[AppsStudioConstants.UI_VIEWS.LAST_MODIFIED_TIME], viewId);
                                                        if (commitAction) {
                                                            metadata.actions.push(commitAction);
                                                        }
                                                        var copyAction = getCopyViewAction(parameters[RequestConstants.UIViews.DEVELOPER], organization, viewId, parameters);
                                                        if (copyAction) {
                                                            metadata.actions.push(copyAction);
                                                        }

                                                        if (quickViews && quickViews.length > 1) {
                                                            var deattachQuickViewAction = getDeattachQuickView(parameters[RequestConstants.UIViews.DEVELOPER], organization, viewId, parameters);
                                                            if (deattachQuickViewAction) {
                                                                metadata.actions.push(deattachQuickViewAction);
                                                            }
                                                        }


                                                        if (viewOptions._currentstate.role) {
                                                            require("./UiMenuJob.js").populateMenuAsRole(metadata.childs, viewOptions._currentstate.role);
                                                        }
                                                        populateFiltersInQuery(viewQuery, metadata, userView, parameters, function (err, data) {
                                                            if (err) {
                                                                callback(err);
                                                                return;
                                                            }
                                                            try {
                                                                metadata.filter = viewQuery[QueryConstants.Query.FILTER];
                                                                delete viewQuery[QueryConstants.Query.METADATA];
                                                                if (max_rows && max_rows == 1) {
                                                                    viewType = AppsStudioConstants.UI_VIEWS.Type.PANEL;
                                                                    var fields = {};
                                                                    for (var i = 0; i < metadata.columns.length; i++) {
                                                                        var column = metadata.columns[i];
                                                                        if (column[AppsStudioConstants.UI_VIEWS.Columns.SHOW_ON_PANEL]) {
                                                                            fields[column[Constants.Baas.Tables.Columns.EXPRESSION]] = 1;
                                                                        }
                                                                    }
                                                                    viewQuery[QueryConstants.Query.FIELDS] = fields;
                                                                    metadata[AppsStudioConstants.UI_VIEWS.INSERT] = false;
                                                                    metadata[AppsStudioConstants.UI_VIEWS.DELETE] = false;
                                                                    metadata[AppsStudioConstants.UI_VIEWS.FTS_SEARCH] = false;
                                                                    metadata[AppsStudioConstants.UI_VIEWS.NAVIGATION] = false;
                                                                }

                                                                viewQuery[QueryConstants.Query.MAX_ROWS] = max_rows;
                                                                DatabaseEngine.executeQuery(viewQuery, viewOptions, function (err, viewData) {
                                                                    try {
                                                                        var newView = {};
                                                                        if (err) {
                                                                            metadata.warnings = [err.stack];
                                                                            newView.data = {data:[]};

                                                                        } else {
                                                                            newView.data = viewData;
                                                                        }
                                                                        metadata.type = viewType;
                                                                        newView.metadata = metadata;
                                                                        newView.ask = ask;
                                                                        newView.osk = osk;
                                                                        newView.viewid = metadata.viewid;
                                                                        newView.viewid_id = metadata.viewid_id;
                                                                        updateApplicationWiseUserState(viewId, parameters, application[QueryConstants.Query._ID], organization[QueryConstants.Query._ID], viewOptions, function (err) {
                                                                            if (err) {
                                                                                callback(err);
                                                                                return;
                                                                            }
                                                                            callback(null, newView);
                                                                        })


                                                                    } catch (e) {
                                                                        callback(e);
                                                                    }
                                                                });
                                                            } catch (e) {
                                                                callback(e);
                                                            }

                                                        });
                                                    } catch (e) {
                                                        callback(e);
                                                    }

                                                });
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
                        });


                    } catch (e) {
                        callback(e);
                    }
                });
            } catch (e) {
                callback(e);
            }
        })
    } catch (e) {
        callback(e);
    }
}

function populateFiltersInQuery(viewQuery, metadata, userView, parameters, callback) {

    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined");
    }
    try {

        metadata.filterparameters = {};
        if (userView && parameters[RequestConstants.UIViews.SOURCE]) {
            var source = parameters[RequestConstants.UIViews.SOURCE];
            var userViewFilter = userView[AppsStudioConstants.UI_VIEWS.FILTER];
            if (userViewFilter && userViewFilter[source]) {
                metadata.filterparameters = userViewFilter[source];
                viewQuery[QueryConstants.Query.FILTER] = viewQuery[QueryConstants.Query.FILTER] || {};
                for (var key in metadata.filterparameters) {
                    if (metadata.filterparameters[key].filter) {
                        viewQuery[QueryConstants.Query.FILTER][key] = metadata.filterparameters[key].filter;
                    } else if (metadata.filterparameters[key].filters) {
                        for (var i = 0; i < metadata.filterparameters[key].filters.length; i++) {
                            for (var obj in metadata.filterparameters[key].filters[i]) {
                                viewQuery[QueryConstants.Query.FILTER][obj] = metadata.filterparameters[key].filters[i][obj];
                            }
                        }
                    }
                }
            }
        }
        var columns = metadata[Constants.Baas.Tables.COLUMNS];
        viewQuery[QueryConstants.Query.FILTER] = viewQuery[QueryConstants.Query.FILTER] || {};

        Utils.iterateArray(columns, callback, function (column, callback) {
            try {
                var type = column[AppsStudioConstants.UI_VIEWS.Columns.UI] || column[AppsStudioConstants.UI_VIEWS.Columns.UI_PANEL];
                var defaultFilter = column[AppsStudioConstants.UI_VIEWS.Columns.FILTER_DEFAULT_EXPRESSION];

                if (defaultFilter && type != Constants.Baas.Tables.Columns.Type.SCHEDULE && type != Constants.Baas.Tables.Columns.Type.DATE) {
                    callback(new Error("Default filter not supported for >> ") + type);
                    return;
                }

                var expression = column[Constants.Baas.Tables.Columns.EXPRESSION];
                if (type == Constants.Baas.Tables.Columns.Type.SCHEDULE) {
                    expression += "." + Constants.Baas.Tables.Columns.Type.Schedule.DUE_DATE;
                }

                if (defaultFilter && !viewQuery[QueryConstants.Query.FILTER][expression]) {
                    defaultFilter = defaultFilter.toString().trim();
                    if (defaultFilter.length > 0) {
                        viewQuery[QueryConstants.Query.FILTER][expression] = "{" + defaultFilter + "}";
                        metadata.filterparameters[expression] = {filter:"{" + defaultFilter + "}", value:{filter:"{" + defaultFilter + "}"}};
                    }
                }
                callback();
            } catch (e) {
                callback(e);
            }

        });


    } catch (e) {
        callback(e);
    }

}

function getAppsStudioViews(viewId, organization, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in getAppsStudioViews In UiViewService.");
    }
    try {


        var query = {};
        query.table = AppsStudioConstants.UI_VIEWS.TABLE;
        var orFilter = [];

        var globalViewFilter = {};
        globalViewFilter[AppsStudioConstants.UI_VIEWS.ID] = viewId;
        globalViewFilter[AppsStudioConstants.UI_VIEWS.ORGANIZATIONID] = null;
        globalViewFilter[AppsStudioConstants.UI_VIEWS.USERID] = null;
        orFilter.push(globalViewFilter);

        if (organization) {
            var orgViewFilter = {};
            orgViewFilter[AppsStudioConstants.UI_VIEWS.ID] = viewId;
            orgViewFilter[AppsStudioConstants.UI_VIEWS.ORGANIZATIONID] = organization[QueryConstants.Query._ID];
            orgViewFilter[AppsStudioConstants.UI_VIEWS.USERID] = null;
            orFilter.push(orgViewFilter);
        }

        if (options.user) {
            var userViewFilter = {};
            userViewFilter[AppsStudioConstants.UI_VIEWS.ID] = viewId;
            userViewFilter[AppsStudioConstants.UI_VIEWS.ORGANIZATIONID] = organization ? organization[QueryConstants.Query._ID] : null;
            userViewFilter[AppsStudioConstants.UI_VIEWS.USERID] = options.user[QueryConstants.Query._ID];
            orFilter.push(userViewFilter);
        }

        query[QueryConstants.Query.FILTER] = {$or:orFilter};
        var appsStudioOptions = OptionsUtil.getOptions(options, AppsStudioConstants.ASK)
        DatabaseEngine.executeQuery(query, appsStudioOptions, function (err, viewData) {
            if (err) {
                callback(err);
                return;
            }
            try {
                var views = viewData.data;
                var globalView = getGlobalView(views);
                var organizationView = getOrganizationView(views, organization[QueryConstants.Query._ID]);
                var userView = getUserView(views, organization[QueryConstants.Query._ID], options.user[QueryConstants.Query._ID]);
                if (!globalView) {
                    throw new Error("Global view not found for viewid[" + viewId + "]");
                }
                callback(null, {global:globalView, organization:organizationView, user:userView});

            } catch (e) {
                callback(e);
            }
        })


    } catch (e) {
        callback(e);
    }
}

function getChilds(viewId, organization, developer, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in getChilds In UiViewService.");
    }
    try {
        var query = {};
        query[QueryConstants.Query.TABLE] = AppsStudioConstants.UI_MENUS.TABLE;
        var filter = {};
        filter[AppsStudioConstants.UI_MENUS.SOURCE_VIEW_ID + "." + AppsStudioConstants.UI_VIEWS.ID] = viewId;
        filter[AppsStudioConstants.UI_MENUS.TYPE] = AppsStudioConstants.UI_MENUS.Type.CHILD;
        if (!developer) {
            var orFilter = [];
            var nullOrganizationFilter = {};
            nullOrganizationFilter[AppsStudioConstants.UI_MENUS.ORGANIZATION_ID] = {$exists:false};
            orFilter.push(nullOrganizationFilter);
            var currentOrganizationFilter = {};
            currentOrganizationFilter[AppsStudioConstants.UI_MENUS.ORGANIZATION_ID] = organization[QueryConstants.Query._ID];
            orFilter.push(currentOrganizationFilter);
            filter.$or = orFilter;
        }
        query[QueryConstants.Query.FILTER] = filter;
        query[QueryConstants.Query.ORDERS] = {index:"asc"};
        DatabaseEngine.executeQuery(query, OptionsUtil.getOptions(options, AppsStudioConstants.ASK), function (err, data) {
            if (err) {
                callback(err)
                return;
            }
            try {
                callback(null, data.data);
            } catch (e) {
                callback(e);
            }
        })


    } catch (e) {
        callback(e);
    }
}

function getQuickViews(source, organization, table, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in getQuickViews In UiViewService.");
    }
    try {
        var query = {};
        query[QueryConstants.Query.TABLE] = AppsStudioConstants.QUICK_VIEWS.TABLE;
        var filter = {};
        filter[AppsStudioConstants.QUICK_VIEWS.SOURCE_ID] = source;
        var orFilter = [];
        var nullOrganizationFilter = {};
        nullOrganizationFilter[AppsStudioConstants.QUICK_VIEWS.ORGANIZATION_ID] = {$exists:false};
        orFilter.push(nullOrganizationFilter);
        var currentOrganizationFilter = {};
        currentOrganizationFilter[AppsStudioConstants.QUICK_VIEWS.ORGANIZATION_ID] = organization[QueryConstants.Query._ID];
        orFilter.push(currentOrganizationFilter);
        filter.$or = orFilter;
        query[QueryConstants.Query.FILTER] = filter;
        DatabaseEngine.executeQuery(query, OptionsUtil.getOptions(options, AppsStudioConstants.ASK), function (err, data) {
            if (err) {
                callback(err)
                return;
            }
            try {
                var quickViews = data.data;
                if (!quickViews || quickViews.length == 0 || !options._currentstate.role) {
                    callback(null, quickViews);
                    return;
                }
                var quickViewIds = [];
                for (var i = 0; i < quickViews.length; i++) {
                    quickViewIds.push(quickViews[i][AppsStudioConstants.QUICK_VIEWS.BAAS_VIEW_ID][Constants.Baas.Queries.ID]);
                }
                var allowedQuickViews = require("ApplaneBaas/lib/modules/RoleModule.js").populateViewsAsRole(table, quickViewIds, options._currentstate.role);
                var newQuickViews = [];
                for (var i = 0; i < quickViewIds.length; i++) {
                    if (allowedQuickViews[quickViewIds[i]] === 1) {
                        newQuickViews.push(quickViews[i]);
                    }
                }
                callback(null, newQuickViews);
            } catch (e) {
                callback(e);
            }
        })


    } catch (e) {
        callback(e);
    }
}

exports.populateViewSelf = function (metadata, globalView, organizationView, userView) {
    var fieldsToMerge = [AppsStudioConstants.UI_VIEWS.LABEL, AppsStudioConstants.UI_VIEWS.SEQUENCE, AppsStudioConstants.UI_VIEWS.SEQUENCE_PANEL, AppsStudioConstants.UI_VIEWS.LAST_MODIFIED_TIME, AppsStudioConstants.UI_VIEWS.MAX_ROWS, AppsStudioConstants.UI_VIEWS.TEMPLATE, AppsStudioConstants.UI_VIEWS.INSERT, AppsStudioConstants.UI_VIEWS.LABEL, AppsStudioConstants.UI_VIEWS.SAVE, AppsStudioConstants.UI_VIEWS.INSERT_MODE, AppsStudioConstants.UI_VIEWS.DELETE, AppsStudioConstants.UI_VIEWS.ENABLE_SELECTION, AppsStudioConstants.UI_VIEWS.EDIT, AppsStudioConstants.UI_VIEWS.UPDATE_TYPE];
    mergeViewSelf(metadata, fieldsToMerge, globalView);
    mergeViewSelf(metadata, fieldsToMerge, organizationView);
    mergeViewSelf(metadata, fieldsToMerge, userView);
}

function getViewSelfPorperty(key, globalView, organizationView, userView) {
    var keyValue = globalView[key];
    if (organizationView && organizationView[key] !== undefined) {
        keyValue = organizationView[key];
    }
    if (userView && userView[key] !== undefined) {
        keyValue = userView[key];
    }
    return keyValue;

}
function mergeViewSelf(metadata, fields, view) {
    if (!metadata || !view || !fields) {
        return;
    }
    for (var i = 0; i < fields.length; i++) {
        if (view[fields[i]] !== undefined) {
            metadata[fields[i]] = view[fields[i]];
        }

    }
}

exports.mergeColumn = function (column, globalColumn) {
    if (!globalColumn || !column) {
        return;
    }
    for (var k in globalColumn) {
        column[k] = globalColumn[k];
    }

}

function mergeIfNotExist(column, field, value) {
    if (column[field] === undefined) {
        column[field] = value;
    }
}

function populateColumns(metadata, globalView, organizationView, userView, parameters, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in getChilds In UiViewService.");
    }
    try {
        var columns = metadata[QueryConstants.Query.COLUMNS]
        var newColumns = [];
        Utils.iterateArray(columns, function () {
            try {
                metadata[QueryConstants.Query.COLUMNS] = newColumns;
                populateSequence(metadata, AppsStudioConstants.UI_VIEWS.SEQUENCE, true);
                populateSequence(metadata, AppsStudioConstants.UI_VIEWS.SEQUENCE_PANEL, false);
                callback();
            } catch (e) {
                callback(e);
            }

        }, function (column, callback) {
            try {
                var globalViewColumn = SELF.getColumn(globalView.columns, "_id", column._id);
                if (globalViewColumn) {
                    SELF.mergeColumn(column, globalViewColumn);
                }
                var organizationViewColumn = organizationView ? SELF.getColumn(organizationView.columns, "_id", column._id) : undefined;
                if (organizationViewColumn) {
                    SELF.mergeColumn(column, organizationViewColumn);
                }
                var userViewColumn = userView ? SELF.getColumn(userView.columns, "_id", column._id) : userView;
                if (userViewColumn) {
                    SELF.mergeColumn(column, userViewColumn);
                }
                var expression = column[Constants.Baas.Tables.Columns.EXPRESSION];
                var dotted = expression.indexOf(".");
                if (column[Constants.Baas.Tables.Columns.MULTIPLE]) {
                    mergeIfNotExist(column, AppsStudioConstants.UI_VIEWS.Columns.SHOW_ON_TABLE, false)
                    mergeIfNotExist(column, AppsStudioConstants.UI_VIEWS.Columns.SHOW_ON_PANEL, true)
                    if (column[Constants.Baas.Tables.Columns.TYPE] == Constants.Baas.Tables.Columns.Type.OBJECT) {
                        mergeIfNotExist(column, AppsStudioConstants.UI_VIEWS.Columns.UI, AppsStudioConstants.UI_VIEWS.Columns.UITypes.TABLE)
                    } else {
                        mergeIfNotExist(column, AppsStudioConstants.UI_VIEWS.Columns.UI, column[Constants.Baas.Tables.Columns.TYPE])
                    }
                } else if (dotted >= 0) {
                    mergeIfNotExist(column, AppsStudioConstants.UI_VIEWS.Columns.SHOW_ON_TABLE, false)
                    mergeIfNotExist(column, AppsStudioConstants.UI_VIEWS.Columns.SHOW_ON_PANEL, true)
                    mergeIfNotExist(column, AppsStudioConstants.UI_VIEWS.Columns.UI, column[Constants.Baas.Tables.Columns.TYPE])
                } else {
                    mergeIfNotExist(column, AppsStudioConstants.UI_VIEWS.Columns.SHOW_ON_TABLE, true)
                    mergeIfNotExist(column, AppsStudioConstants.UI_VIEWS.Columns.SHOW_ON_PANEL, true)
                    mergeIfNotExist(column, AppsStudioConstants.UI_VIEWS.Columns.UI, column[Constants.Baas.Tables.Columns.TYPE])
                }
                mergeIfNotExist(column, AppsStudioConstants.UI_VIEWS.Columns.LABEL, column[Constants.Baas.Tables.Columns.EXPRESSION]);
                mergeIfNotExist(column, AppsStudioConstants.UI_VIEWS.Columns.WIDTH, 200)
                delete column[Constants.Baas.Tables.Columns.TYPE];
                var private = column[AppsStudioConstants.UI_VIEWS.Columns.PRIVATE]

                if ((!private) || parameters[RequestConstants.UIViews.DEVELOPER]) {
                    newColumns.push(column);
                    if (column[Constants.Baas.Tables.Columns.FLEX_COLUMN] && column[Constants.Baas.Tables.Columns.TABLE]) {
                        var flexibleTableName = column[Constants.Baas.Tables.Columns.TABLE][Constants.Baas.Tables.ID];
                        require("ApplaneBaas/lib/modules/FlexfieldModuleColumn.js").getFlexFieldFlexibleColumns(flexibleTableName, options, function (err, flexibleColumms) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            try {
                                if (flexibleColumms && flexibleColumms.length > 0) {
                                    column.flexcolumns = flexibleColumms;
                                    callback();
                                } else {
                                    callback();
                                }
                            } catch (e) {
                                callback(e);
                            }

                        });
                    } else {
                        callback();
                    }

                } else {
                    callback();
                }

            } catch (e) {
                callback(e);
            }

        })


    } catch (e) {
        callback(e);
    }


}

function populateSequence(metadata, key, modifyColumn) {
    var sequence = metadata[key];
    var columns = metadata[AppsStudioConstants.UI_VIEWS.COLUMNS];
    if (!columns || !sequence) {
        return;
    }
    var newColumns = [];
    var newSequence = [];
    for (var i = 0; i < sequence.length; i++) {
        var seq = sequence[i];
        var newColumn = SELF.getColumn(columns, QueryConstants.Query._ID, seq);
        if (newColumn) {
            newColumns.push(newColumn);
            newSequence.push(seq);
        }
    }

    for (var i = 0; i < columns.length; i++) {
        var column = columns[i];
        var seqCol = SELF.getColumn(newColumns, QueryConstants.Query._ID, column[QueryConstants.Query._ID])
        if (!seqCol) {
            newColumns.push(column);
            newSequence.push(column[QueryConstants.Query._ID]);
        }
    }

    metadata[key] = newSequence;
    if (modifyColumn) {
        metadata[AppsStudioConstants.UI_VIEWS.COLUMNS] = newColumns;
    }

}

exports.getColumn = function (columns, key, value) {
    if (!columns) {
        return undefined;
    }
    for (var i = 0; i < columns.length; i++) {
        if (columns[i][key] === value) {
            return columns[i]
        }

    }
}

exports.getUserStates = function (options, callback) {
    try {
        var viewQuery = {};
        viewQuery[QueryConstants.Query.TABLE] = Constants.Baas.USERS;
        viewQuery[QueryConstants.Query.FILTER] = {"_id":options.user[QueryConstants.Query._ID]};
        viewQuery[QueryConstants.Query.COLUMNS] = [Constants.Baas.Users.USER_STATE];
        DatabaseEngine.executeQuery(viewQuery, OptionsUtil.getOptions(options, Constants.Baas.ASK), function (err, userStateResult) {
            if (err) {
                callback(err);
                return;
            }
            var userStates = userStateResult[QueryConstants.Query.Result.DATA];
            var userState = {};
            if (userStates && userStates.length > 0 && userStates[0][Constants.Baas.Users.USER_STATE]) {
                userState = userStates[0][Constants.Baas.Users.USER_STATE];
            }
            callback(null, userState);
        })
    } catch (e) {
        callback(e);
    }
}

exports.updateUserState = function (userState, options, callback) {
    var updates = {};
    updates[QueryConstants.Query.TABLE] = Constants.Baas.USERS;
    var operation = {};
    operation[QueryConstants.Query._ID] = options.user[QueryConstants.Query._ID];
    operation.userstate = userState;
    updates[QueryConstants.Update.OPERATIONS] = operation;
    updates.excludejobs = true;
    updates.excludemodules = true;
    var newOptions = OptionsUtil.getOptions(options);
    newOptions.autocommit = true;
    UpdateEngine.executeUpdate(updates, newOptions, callback);
}

function updateApplicationWiseUserState(viewId, parameters, application, organization, options, callback) {
    var menu = parameters[RequestConstants.UIViews.MENUID];
    if (menu) {
        populateUserStates(parameters, options, function (err, userState) {
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
            SELF.updateUserState(userState, options, callback);
        })
    } else {
        callback();
    }
}

function populateUserStates(parameters, options, callback) {
    if (parameters[RequestConstants.UIViews.USER_STATE]) {
        callback(null, parameters[RequestConstants.UIViews.USER_STATE]);
    } else {
        SELF.getUserStates(options, function (err, userstate) {
            callback(null, userstate);
        })
    }
}


exports.mergeOtherKeys = function (globalView, organizationView, key) {
    var keyData = globalView[key] || [];

    var organizationKeyData = organizationView ? organizationView[key] : [];
    organizationKeyData = organizationKeyData || [];

    for (var i = 0; i < keyData.length; i++) {
        var keyRecord = keyData[i];
        var orgKeyRecord = SELF.getColumn(organizationKeyData, QueryConstants.Query._ID, keyRecord[QueryConstants.Query._ID]);
        if (orgKeyRecord) {
            SELF.mergeColumn(keyRecord, orgKeyRecord);
        }
    }
    for (var i = 0; i < organizationKeyData.length; i++) {
        var orgKeyRecord = organizationKeyData[i];
        var keyRecord = SELF.getColumn(keyData, QueryConstants.Query._ID, orgKeyRecord[QueryConstants.Query._ID]);
        if (!keyRecord) {
            keyData.push(orgKeyRecord);
        }
    }
    return keyData;

}

function getCommitViewAction(developer, organization, commitRequired, lastModifiedTime, viewid) {
    if (!developer || !organization || organization.id != Constants.Baas.Organizations.GLOBAL_ORGANIZATION.id || !commitRequired) {
        return false;
    }
    var commitViewAction = {label:"Commit",
        parameters:{viewid:viewid, developer:developer, lastmodifiedtime:lastModifiedTime},
        type:"Invoke",
        preMessage:"Committing...", postMessage:"Committed.",
        invokeType:"method",
        module:"lib/CommitView",
        method:"commitView",
        onHeader:true,
        noSelection:true,
        ask:AppsStudioConstants.ASK,
        private:true

    };
    return commitViewAction;

}

function getCopyViewAction(developer, organization, viewid, parameters) {
    if (!developer || !organization || organization.id != Constants.Baas.Organizations.GLOBAL_ORGANIZATION.id) {
        return false;
    }
    var commitViewAction = {label:"Copy",
        parameters:{viewid:viewid, developer:developer, menuid:parameters[RequestConstants.UIViews.SOURCE]},
        type:"Invoke",
        preMessage:"Cloning...", postMessage:"Cloned.",
        invokeType:"method",
        module:"lib/CopyView",
        method:"copyView",
        onHeader:true,
        noSelection:true,
        columns:[
            {expression:"targetviewid", label:"Target view", ui:"string", showOnPanel:true},
            {expression:"targetviewalias", label:"Alias", ui:"string", showOnPanel:true},
            {expression:"asquickview", label:"As quick view", ui:"boolean", showOnPanel:true}
        ],
        ask:AppsStudioConstants.ASK,
        private:true

    };
    return commitViewAction;

}

function getDeattachQuickView(developer, organization, viewid, parameters) {
    if (!developer || !organization || organization.id != Constants.Baas.Organizations.GLOBAL_ORGANIZATION.id) {
        return false;
    }
    var commitViewAction = {label:"Deattach quick view",
        parameters:{viewid:viewid, developer:developer, menuid:parameters[RequestConstants.UIViews.SOURCE]},
        type:"Invoke",
        preMessage:"Deattaching...", postMessage:"Deattached.",
        invokeType:"method",
        module:"lib/DeAttachQuickView.js",
        method:"deAttachQuickView",
        onHeader:true,
        noSelection:true,
        ask:AppsStudioConstants.ASK,
        private:true

    };
    return commitViewAction;

}

function populateActionAsRole(metadata, parameters, options, callback) {

    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in populateActionAsRole In UiViewService.");
    }
    try {
        var actions = metadata[AppsStudioConstants.UI_VIEWS.ACTIONS];
        if (!actions || actions.length == 0) {
            callback();
            return;
        }
        if (!options._currentstate.role) {
            callback();
            return;
        }
        var newActions = [];
        Utils.iterateArray(actions, function () {
            metadata[AppsStudioConstants.UI_VIEWS.ACTIONS] = newActions;
            callback();
        }, function (action, callback) {
            if (action.jobname) {
                require("ApplaneBaas/lib/modules/RoleModule.js").populateCustomJobAsRole(action.jobname, options, function (err, rights) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    try {
                        if (!rights || rights[Constants.Baas.Roles.Tables.Rights.WRITE]) {
                            newActions.push(action);
                        }
                        callback();
                    } catch (e) {
                        callback(e);
                    }
                });
            } else {
                newActions.push(action);
                callback();
            }

        })

    } catch (e) {

    }
}

function getPanelColumns(globalView, organizationView, userView) {
    var panelMetaData = {};
    panelMetaData[AppsStudioConstants.UI_VIEWS.COLUMNS] = globalView[AppsStudioConstants.UI_VIEWS.COLUMNS];
    SELF.mergeOtherKeys(panelMetaData, organizationView, AppsStudioConstants.UI_VIEWS.COLUMNS);
    SELF.mergeOtherKeys(panelMetaData, userView, AppsStudioConstants.UI_VIEWS.COLUMNS);
    var columns = panelMetaData[AppsStudioConstants.UI_VIEWS.COLUMNS];
    var panelColumns = [];
    for (var i = 0; i < columns.length; i++) {
        if (columns[i][AppsStudioConstants.UI_VIEWS.Columns.SHOW_ON_PANEL]) {
            panelColumns.push(columns[i]);
        }
    }
    return panelColumns;

}
