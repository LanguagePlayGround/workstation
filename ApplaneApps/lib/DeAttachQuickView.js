/**
 * get viewid
 *
 */

exports.deAttachQuickView = function (parameters, options, callback) {
    var AppsStudioConstants = require("./AppsStudioConstants.js");
    var RequestConstants = require("./RequestConstants.js");
    var ViewService = require("./UiViewService.js");
    var Constants = require("ApplaneBaas/lib/shared/Constants.js");
    var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
    var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
    var OptionsUtil = require("ApplaneBaas/lib/util/OptionsUtil.js");
    var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
    var AppsStudioError = require("ApplaneCore/apputil/ApplaneError.js");

    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in DeattachQuickView In DeattachQuickView.js");
    }
    try {
        var sourceViewId = parameters[RequestConstants.DeAttachQuickView.VIEW_ID];
        var menuId = parameters[RequestConstants.DeAttachQuickView.MENUID];
        var developer = parameters[RequestConstants.DeAttachQuickView.DEVELOPER];
        var ask = parameters[RequestConstants.DeAttachQuickView.ASK];
        var osk = parameters[RequestConstants.DeAttachQuickView.OSK];
        if (!sourceViewId) {
            callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [RequestConstants.DeAttachQuickView.VIEW_ID]));
            return;
        }

        if (!ask) {
            callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [RequestConstants.DeAttachQuickView.ASK]));
            return;
        }
        if (!osk) {
            callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [RequestConstants.DeAttachQuickView.OSK]));
            return;
        }
        if (!developer) {
            callback(new Error("Copy view is supported by developer only."));
            return;
        }
        ViewService.authenticateView(ask, osk, sourceViewId, true, options, function (err, authView) {
            if (err) {
                callback(err);
                return;
            }
            try {
                if (!authView.globalorganization) {
                    callback(new Error("Deattach quick view is Supported only in Global Organization."));
                    return;
                }
                if (authView.organizationview || authView.queryviews.organizationview) {
                    callback(new Error("Please save changes at global level before deattach."));
                    return;
                }
                var globalAppView = authView.globalview;
                var globalBaasView = authView.queryviews.globalview;
                if (!globalAppView) {
                    callback(new Error("Global App View not found."));
                    return;
                }
                if (!globalBaasView) {
                    callback(new Error("Global Baas View not found."));
                    return;
                }
                var globalBaasView_id = globalBaasView[QueryConstants.Query._ID];

                var filter = {};
                filter[AppsStudioConstants.QUICK_VIEWS.SOURCE_ID] = menuId;
                filter[AppsStudioConstants.QUICK_VIEWS.BAAS_VIEW_ID] = globalBaasView_id;
                var query = {table:AppsStudioConstants.QUICK_VIEWS.TABLE};
                query.filter = filter;
                DatabaseEngine.executeQuery(query, OptionsUtil.getOptions(options, AppsStudioConstants.ASK), function (err, quickViewData) {
                    try {
                        if (err) {
                            callback(err);
                            return;
                        }
                        if (!quickViewData || !quickViewData.data || quickViewData.data.length == 0) {
                            callback(new Error("Quick view not found"));
                            return;
                        } else if (quickViewData.data.length > 1) {
                            callback(new Error("More than one quick view found"));
                            return;
                        }
                        var operation = {};
                        operation[QueryConstants.Query._ID] = quickViewData.data[0][QueryConstants.Query._ID];
                        operation[QueryConstants.Update.Operation.TYPE] = QueryConstants.Update.Operation.Type.DELETE;
                        UpdateEngine.executeUpdate({table:AppsStudioConstants.QUICK_VIEWS.TABLE, operations:operation}, OptionsUtil.getOptions(options, AppsStudioConstants.ASK), callback);
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