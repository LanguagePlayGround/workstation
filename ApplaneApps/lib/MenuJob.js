/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 18/1/14
 * Time: 4:10 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("ApplaneBaas/lib/shared/Constants.js");
var OptionUtils = require("ApplaneBaas/lib/util/OptionsUtil.js");
var ApplaneCallback = require("ApplaneCore/apputil/ApplaneCallback.js");
var ApplaneError = require("ApplaneCore/apputil/ApplaneError.js");
var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var ViewService = require("./ViewService.js");
var MergeUtils = require("ApplaneCore/apputil/mergeutil.js");

exports.beforeInsert = function (updates, options, callback) {
    updateMenu(updates, options, callback);
}

exports.beforeUpdate = function (updates, options, callback) {
    var menu = updates.operation;
    var oldValue = updates._old;
    if (MergeUtils.isUpdated(oldValue, menu, Constants.AppsStudio.Menus.APP_VIEW) || MergeUtils.isUpdated(oldValue, menu, Constants.AppsStudio.Menus.CLONE)) {
        populateViewId(menu, options, ApplaneCallback(callback, function (viewId) {
            if (viewId) {
                menu[Constants.AppsStudio.Menus.VIEWID] = viewId;
            }
            callback();
        }));
    } else if (MergeUtils.isUpdated(oldValue, menu, Constants.AppsStudio.Menus.BAAS_VIEW)) {
        insertView(menu, options, ApplaneCallback(callback, function (viewId) {
            if (viewId) {
                menu[Constants.AppsStudio.Menus.VIEWID] = viewId;
            }
            callback();
        }));
    } else {
        callback();
    }
}

function updateMenu(updates, options, callback) {
    var menu = updates.operation;
    populateViewId(menu, options, ApplaneCallback(callback, function (viewId) {
        if (viewId) {
            menu[Constants.AppsStudio.Menus.VIEWID] = viewId;
        }
        callback();
    }));
}

function populateViewId(menu, options, callback) {
    if (menu[Constants.AppsStudio.Menus.APP_VIEW]) {
        var viewId = menu[Constants.AppsStudio.Menus.APP_VIEW][Constants.AppsStudio.Views.ID];
        if (!menu[Constants.AppsStudio.Menus.CLONE]) {
            callback(null, viewId);
        } else {
            cloneView(menu, viewId, options, callback);
        }
    } else {
        insertView(menu, options, callback);
    }
}

function cloneView(menu, viewId, options, callback) {
    ViewService.getViewDetails(viewId, null, null, options, ApplaneCallback(callback, function (viewInfos) {
        if (viewInfos && viewInfos[viewId]) {
            var viewDetailClone = viewInfos[viewId];
            delete viewDetailClone[QueryConstants.Query._ID];
            viewId += "___" + new Date().getTime();
            viewDetailClone[Constants.AppsStudio.Views.ID] = viewId;
            updateView(viewDetailClone, options, callback);
        } else {
            insertView(menu, options, callback);
        }
    }))
}

function insertView(menu, options, callback) {
    var baasView = menu[Constants.AppsStudio.Menus.BAAS_VIEW];
    if (baasView) {
        var baasViewId = baasView[Constants.Baas.Views.ID];
        var viewQuery = {};
        viewQuery[QueryConstants.Query.TABLE] = Constants.AppsStudio.VIEWS;
        viewQuery[QueryConstants.Query.COLUMNS] = [QueryConstants.Query._ID];
        viewQuery[QueryConstants.Query.FILTER] = {id:baasViewId};
        DatabaseEngine.executeQuery(viewQuery, OptionUtils.getOptions(options, Constants.AppsStudio.ASK), ApplaneCallback(callback, function (result) {
            var viewId = baasViewId;
            if (result[QueryConstants.Query.Result.DATA] && result[QueryConstants.Query.Result.DATA].length > 0) {
                viewId += "___" + new Date().getTime();
            }
            var viewOperation = {};
            viewOperation[Constants.AppsStudio.Views.ID] = viewId;
            viewOperation[Constants.AppsStudio.Views.LABEL] = menu[Constants.AppsStudio.Menus.LABEL];
            viewOperation[Constants.AppsStudio.Views.BAAS_VIEWID] = {_id:baasView[QueryConstants.Query._ID]};
            viewOperation[Constants.AppsStudio.Views.QUICK_VIEWID] = viewId;
            updateView(viewOperation, options, callback);
        }))
    } else {
        callback();
    }
}

function updateView(viewOperation, options, callback) {
    var updates = {};
    updates[QueryConstants.Query.TABLE] = Constants.AppsStudio.VIEWS;
    updates[QueryConstants.Update.OPERATIONS] = viewOperation;
    UpdateEngine.executeUpdate(updates, OptionUtils.getOptions(options, Constants.AppsStudio.ASK), ApplaneCallback(callback, function () {
        callback(null, viewOperation[Constants.AppsStudio.Views.ID]);
    }));
}

