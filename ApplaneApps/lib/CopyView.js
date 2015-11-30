/**
 * get viewid
 *
 */

exports.copyView = function (parameters, options, callback) {
    var AppsStudioConstants = require("./AppsStudioConstants.js");
    var RequestConstants = require("./RequestConstants.js");
    var ViewService = require("./UiViewService.js");
    var Constants = require("ApplaneBaas/lib/shared/Constants.js");
    var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
    var OptionsUtil = require("ApplaneBaas/lib/util/OptionsUtil.js");
    var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
    var AppsStudioError = require("ApplaneCore/apputil/ApplaneError.js");

    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in copyView In CopyView.js");
    }
    try {

        var sourceViewId = parameters[RequestConstants.CopyView.SOURCE_VIEW_ID];
        var targetViewId = parameters[RequestConstants.CopyView.TARGET_VIEW_ID];
        var targetViewAlias = parameters[RequestConstants.CopyView.TARGET_VIEW_ALIAS];
        var menuId = parameters[RequestConstants.CopyView.MENUID];
        var asQuickView = parameters[RequestConstants.CopyView.AS_QUICK_VIEW];
        var developer = parameters[RequestConstants.CopyView.DEVELOPER];
        var ask = parameters[RequestConstants.CopyView.ASK];
        var osk = parameters[RequestConstants.CopyView.OSK];
        if (!sourceViewId) {
            callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [RequestConstants.CopyView.SOURCE_VIEW_ID]));
            return;
        }
        if (!targetViewId) {
            callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [RequestConstants.CopyView.TARGET_VIEW_ID]));
            return;
        }
        if (!targetViewAlias) {
            callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [RequestConstants.CopyView.TARGET_VIEW_ALIAS]));
            return;
        }
        if (!ask) {
            callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [RequestConstants.CopyView.ASK]));
            return;
        }
        if (!osk) {
            callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [RequestConstants.CopyView.OSK]));
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
                    callback(new Error("Copy View is Supported only in Global Organization."));
                    return;
                }
                if (authView.organizationview || authView.queryviews.organizationview) {
                    callback(new Error("Please save changes at global level to copy view."));
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
                globalAppView[AppsStudioConstants.UI_VIEWS.ID] = targetViewId;
                globalAppView[AppsStudioConstants.UI_VIEWS.LABEL] = targetViewAlias;
                delete globalAppView[QueryConstants.Query._ID];
                globalBaasView[Constants.Baas.Queries.ID] = targetViewId;
                globalBaasView[Constants.Baas.Queries.ALIAS] = targetViewAlias;
                delete globalBaasView[QueryConstants.Query._ID];
                UpdateEngine.executeUpdate({table:AppsStudioConstants.UI_VIEWS.TABLE, operations:globalAppView}, OptionsUtil.getOptions(options, AppsStudioConstants.ASK), function (err) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    try {
                        UpdateEngine.executeUpdate({table:Constants.Baas.QUERIES, operations:globalBaasView}, OptionsUtil.getOptions(options, Constants.Baas.ASK), function (err, res) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            try {
                                if (!asQuickView) {
                                    callback();
                                    return;
                                }
                                if (!menuId) {
                                    callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [RequestConstants.CopyView.MENUID]));
                                    return;
                                }
                                var operation = {};
                                operation[AppsStudioConstants.QUICK_VIEWS.SOURCE_ID] = {_id:menuId};
                                operation[AppsStudioConstants.QUICK_VIEWS.BAAS_VIEW_ID] = {_id:res.insert[0][QueryConstants.Query._ID]};
                                operation[AppsStudioConstants.QUICK_VIEWS.LABEL] = targetViewAlias;
                                operation[AppsStudioConstants.QUICK_VIEWS.ORGANIZATION_ID] = parameters[RequestConstants.CopyView.ORGANIZATION_ID];
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
        })
    } catch (e) {
        callback(e);
    }
};