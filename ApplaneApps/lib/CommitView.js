/**
 * get viewid
 *
 */
var RequestConstants = require("./RequestConstants.js")
var UIVewService = require("./UiViewService.js")
var Constants = require("ApplaneBaas/lib/shared/Constants.js");
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
var AppsStudioConstants = require("./AppsStudioConstants.js");

var OptionsUtil = require("ApplaneBaas/lib/util/OptionsUtil.js");
var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var Utils = require("ApplaneCore/apputil/util.js");

exports.commitView = function (parameters, options, callback) {

    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in commitView In CommitView.js");
    }
    try {
        var viewId = parameters[RequestConstants.CommitView.VIEW_ID];
        var ask = parameters[RequestConstants.CommitView.ASK];
        var osk = parameters[RequestConstants.CommitView.OSK];
        var developer = parameters[RequestConstants.CommitView.DEVELOPER];
        var lastModifiedTime = parameters[RequestConstants.CommitView.LAST_MODIFIED_TIME];
        if (!viewId) {
            callback(new Error("viewId not defined"));
            return;
        }

        if (!ask) {
            callback(new Error("ask not defined"));
            return;
        }

        if (!osk) {
            callback(new Error("osk not defined"));
            return;
        }

        if (!developer) {
            callback(new Error("Only developer can commit view"));
            return;
        }
        UIVewService.authenticateView(ask, osk, viewId, true, options, function (err, authView) {
            if (err) {
                callback(err);
                return;
            }
            try {
                var organization = authView.organization;
                var application = authView.application;
                var globalView = authView.globalview;
                var organizationView = authView.organizationview;
                var userView = authView.userview;
                var globalQueryView = authView.queryviews.globalview;
                var organizationQueryView = authView.queryviews.organizationview;
                var userQueryView = authView.queryviews.userview;
                var globalOrganization = authView.globalorganization;


                if (!organization || organization.id != Constants.Baas.Organizations.GLOBAL_ORGANIZATION.id) {
                    callback(new Error("Commit can only be allowed in global organization"))
                    return;
                }

                if (!globalView || !globalQueryView) {
                    callback(new Error("globalView or globalQueryView not found [" + viewId + "]"))
                    return;
                }

                var globalViewLastModifiedTime = organizationView ? organizationView[AppsStudioConstants.UI_VIEWS.LAST_MODIFIED_TIME] : globalView[AppsStudioConstants.UI_VIEWS.LAST_MODIFIED_TIME];
                if (lastModifiedTime && globalViewLastModifiedTime && globalViewLastModifiedTime > lastModifiedTime) {
                    callback(new Error("View not synched, update view before commit [" + viewId + "]"))
                    return;
                }

                mergeUIView(viewId, globalView, organizationView, userView, options, function (err, modifiedUiView) {
                    if (err) {
                        callback(err)
                        return;
                    }
                    try {
                        mergeQueryView(viewId, globalQueryView, organizationQueryView, userQueryView, globalOrganization, developer, options, function (err, modifiedQueryView) {
                            if (err) {
                                callback(err)
                                return;
                            }
                            try {
                                //save global view
                                saveUIView(viewId, globalView[QueryConstants.Query._ID], modifiedUiView, options, function (err) {
                                    if (err) {
                                        callback(err);
                                        return;
                                    }
                                    try {
                                        //unset developer view


                                        removeUIView(viewId, organizationView ? organizationView[QueryConstants.Query._ID] : undefined, options, function (err) {
                                            if (err) {
                                                callback(err);
                                                return;
                                            }
                                            try {
                                                //save query view
                                                saveQueryView(viewId, globalQueryView[QueryConstants.Query._ID], modifiedQueryView, options, function (err) {
                                                    if (err) {
                                                        callback(err);
                                                        return;
                                                    }
                                                    try {
                                                        //unset query view
                                                        removeQueryView(viewId, organizationQueryView ? organizationQueryView[QueryConstants.Query._ID] : undefined, options, function (err) {
                                                            if (err) {
                                                                callback(err);
                                                                return;
                                                            }
                                                            try {
                                                                callback();

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

        })


    } catch (e) {
        callback(e);
    }
};


function mergeUIView(viewId, globalView, organizationView, userView, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in mergeUIView In CommitView.js");
    }
    try {
        if (!organizationView) {
            callback();
            return;
        }
        var modifiedView = {};
        UIVewService.populateViewSelf(modifiedView, globalView, organizationView);

        if (modifiedView[AppsStudioConstants.UI_VIEWS.SEQUENCE]) {
            modifiedView[AppsStudioConstants.UI_VIEWS.SEQUENCE] = {data:modifiedView[AppsStudioConstants.UI_VIEWS.SEQUENCE], override:true};
        }

        if (modifiedView[AppsStudioConstants.UI_VIEWS.SEQUENCE_PANEL]) {
            modifiedView[AppsStudioConstants.UI_VIEWS.SEQUENCE_PANEL] = {data:modifiedView[AppsStudioConstants.UI_VIEWS.SEQUENCE_PANEL], override:true};
        }

        var columns = UIVewService.mergeOtherKeys(globalView, organizationView, AppsStudioConstants.UI_VIEWS.COLUMNS);
        modifiedView[AppsStudioConstants.UI_VIEWS.COLUMNS] = {data:columns, override:true};

        var actions = UIVewService.mergeOtherKeys(globalView, organizationView, AppsStudioConstants.UI_VIEWS.ACTIONS);
        modifiedView[AppsStudioConstants.UI_VIEWS.ACTIONS] = {data:actions, override:true};

        var schedules = UIVewService.mergeOtherKeys(globalView, organizationView, AppsStudioConstants.UI_VIEWS.SCHEDULES);
        modifiedView[AppsStudioConstants.UI_VIEWS.SCHEDULES] = {data:schedules, override:true};

        var columnGroups = UIVewService.mergeOtherKeys(globalView, organizationView, AppsStudioConstants.UI_VIEWS.COLUMN_GROUPS);
        modifiedView[AppsStudioConstants.UI_VIEWS.COLUMN_GROUPS] = {data:columnGroups, override:true};

        callback(null, modifiedView);

    } catch (e) {
        callback(e);
    }
}


function mergeQueryView(viewId, globalView, organizationView, userView, globalOrganization, developer, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in mergeQueryView In CommitView.js");
    }
    try {
        if (!organizationView) {
            callback();
            return;
        }
        var globalViewQuery = globalView.query;
        var organizationViewQuery = organizationView ? organizationView.query : {};

        var globalViewFields = globalViewQuery[Constants.Baas.Queries.Query.FIELDS] || {};
        var organizationViewFields = organizationViewQuery[Constants.Baas.Queries.Query.FIELDS] || {};
        mergeJSONObject(globalViewFields, organizationViewFields)
        globalViewQuery[Constants.Baas.Queries.Query.FIELDS] = globalViewFields;

        var globalViewAggregates = globalViewQuery[Constants.Baas.Queries.Query.AGGREGATES] || {};
        var organizationViewAggregates = organizationViewQuery[Constants.Baas.Queries.Query.AGGREGATES] || {};
        mergeJSONObject(globalViewAggregates, organizationViewAggregates)
        globalViewQuery[Constants.Baas.Queries.Query.AGGREGATES] = globalViewAggregates;

        var globalViewOrders = globalViewQuery[Constants.Baas.Queries.Query.ORDERS] || {};
        var organizationViewOrders = organizationViewQuery[Constants.Baas.Queries.Query.ORDERS] || {};
        mergeJSONObject(globalViewOrders, organizationViewOrders)
        globalViewQuery[Constants.Baas.Queries.Query.ORDERS] = globalViewOrders;

        var globalViewUnwindColumns = globalViewQuery[Constants.Baas.Queries.Query.UNWIND_COLUMNS] || {};
        var organizationViewUnwindColumns = organizationViewQuery[Constants.Baas.Queries.Query.UNWIND_COLUMNS] || {};
        mergeJSONObject(globalViewUnwindColumns, organizationViewUnwindColumns)
        globalViewQuery[Constants.Baas.Queries.Query.UNWIND_COLUMNS] = globalViewUnwindColumns;

        if (organizationViewQuery.filter !== undefined) {
            if (organizationViewQuery.filter && Object.keys(organizationViewQuery.filter).length > 0) {
                globalViewQuery.filter = organizationViewQuery.filter;
            } else {
                delete globalViewQuery.filter;
            }
        }

        var modifiedQueryView = {};
        modifiedQueryView.query = globalViewQuery;
        callback(null, modifiedQueryView);
    } catch (e) {
        callback(e);
    }
}

function mergeJSONObject(globalViewFields, organizationViewFields) {
    for (var key in organizationViewFields) {
        globalViewFields[key] = organizationViewFields[key];
    }
}

function saveUIView(viewId, view_Id, uiView, options, callback) {
    console.log("save ui view>>>>" + view_Id + ">>>>uiview>>>>" + JSON.stringify(uiView));
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in saveUIView In CommitView.js");
    }
    try {
        if (!uiView) {
            callback();
            return;
        }
        var updates = {};
        updates[QueryConstants.Query.TABLE] = AppsStudioConstants.UI_VIEWS.TABLE;
        uiView[QueryConstants.Query._ID] = view_Id;
        uiView[QueryConstants.Update.Operation.TYPE] = QueryConstants.Update.Operation.Type.UPDATE;
        updates[QueryConstants.Update.OPERATIONS] = uiView;
        UpdateEngine.executeUpdate(updates, OptionsUtil.getOptions(options, AppsStudioConstants.ASK), callback);
    } catch (e) {
        callback(e);
    }
}

function removeUIView(viewId, view_Id, options, callback) {
    console.log("removeUIView>>>>" + view_Id);
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in removeUIView In CommitView.js");
    }
    try {
        if (!view_Id) {
            callback();
            return;
        }
        var updates = {};
        var operation = {};
        updates[QueryConstants.Query.TABLE] = AppsStudioConstants.UI_VIEWS.TABLE;
        operation[QueryConstants.Query._ID] = view_Id;
        operation[QueryConstants.Update.Operation.TYPE] = QueryConstants.Update.Operation.Type.DELETE;
        updates[QueryConstants.Update.OPERATIONS] = operation;
        UpdateEngine.executeUpdate(updates, OptionsUtil.getOptions(options, AppsStudioConstants.ASK), callback);
    } catch (e) {
        callback(e);
    }
}
function saveQueryView(viewId, view_Id, queryView, options, callback) {
    console.log("saveQueryView>>>>" + view_Id + ">>>>queryView>>>>" + JSON.stringify(queryView));
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in saveUIView In CommitView.js");
    }
    try {
        if (!queryView) {
            callback();
            return;
        }
        var updates = {};
        updates[QueryConstants.Query.TABLE] = Constants.Baas.QUERIES;
        queryView[QueryConstants.Query._ID] = view_Id;
        queryView[QueryConstants.Update.Operation.TYPE] = QueryConstants.Update.Operation.Type.UPDATE;
        updates[QueryConstants.Update.OPERATIONS] = queryView;
        UpdateEngine.executeUpdate(updates, OptionsUtil.getOptions(options, Constants.Baas.ASK), callback);
    } catch (e) {
        callback(e);
    }
}

function removeQueryView(viewId, view_Id, options, callback) {
    console.log("removeBaasView>>>>" + view_Id);
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in removeBaasView In CommitView.js");
    }
    try {
        if (!view_Id) {
            callback();
            return;
        }
        var updates = {};
        var operation = {};
        updates[QueryConstants.Query.TABLE] = Constants.Baas.QUERIES;
        operation[QueryConstants.Query._ID] = view_Id;
        operation[QueryConstants.Update.Operation.TYPE] = QueryConstants.Update.Operation.Type.DELETE;
        updates[QueryConstants.Update.OPERATIONS] = operation;
        UpdateEngine.executeUpdate(updates, OptionsUtil.getOptions(options, AppsStudioConstants.ASK), callback);
    } catch (e) {
        callback(e);
    }
}