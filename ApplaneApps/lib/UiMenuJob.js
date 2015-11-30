/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 18/1/14
 * Time: 4:10 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("ApplaneBaas/lib/shared/Constants.js");
var ApplaneError = require("ApplaneCore/apputil/ApplaneError.js");
var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var MetadataProvider = require("ApplaneBaas/lib/metadata/MetadataProvider.js");
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
var ViewService = require("./ViewService.js");
var AppsStudioConstants = require("./AppsStudioConstants.js");
var OptionUtils = require("ApplaneBaas/lib/util/OptionsUtil.js");
var AppsStudioError = require("ApplaneCore/apputil/ApplaneError.js");

exports.afterInsert = function (updates, options, callback) {
    var menu = updates.operation;
    updateMenus(menu, options, callback);
}

exports.afterUpdate = function (updates, options, callback) {
    var menu = updates.operation;
    updateMenus(menu, options, callback);
}

exports.afterQuery = function (query, result, context, options, callback) {
    try {
        var parameters = query[QueryConstants.Query.PARAMETERS] || {};
        require("ApplaneBaas/lib/modules/RoleModule.js").getRole(parameters.applicationid, parameters.organizationid, options, function (err, role) {
            if (err) {
                callback(err);
                return;
            }
            if (role) {
                require("./UiMenuJob.js").populateMenuAsRole(result[QueryConstants.Query.Result.DATA], role);
            }
            callback();
        })
    } catch (e) {
        callback(e);
    }
}

exports.populateMenuAsRole = function (menus, role) {
    for (var j = 0; j < menus.length; j++) {
        var row = menus[j];
        if (row[AppsStudioConstants.UI_MENUS.TABLE_ID] && row[AppsStudioConstants.UI_MENUS.BAAS_VIEW_ID]) {
            var tableName = row[AppsStudioConstants.UI_MENUS.TABLE_ID][Constants.Baas.Tables.ID];
            var viewId = row[AppsStudioConstants.UI_MENUS.BAAS_VIEW_ID][Constants.Baas.Tables.ID];
            var rights = require("ApplaneBaas/lib/modules/RoleModule.js").populateRights(tableName, viewId, role);
            if (rights[Constants.Baas.Roles.Rights.NONE]) {
                menus.splice(j, 1);
                j = j - 1;
            }
        }
    }
}

function updateMenus(operation, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in updateMenus in UiMenuJob");
    }
    try {
        MetadataProvider.getOrganization(Constants.Baas.Organizations.GLOBAL_ORGANIZATION[Constants.Baas.Organizations.OSK], options, function (err, globalOrgInfo) {
            try {
                if (err) {
                    callback(err);
                    return;
                }
                var label = operation[AppsStudioConstants.UI_MENUS.LABEL];
                var baasViewId = operation[AppsStudioConstants.UI_MENUS.BAAS_VIEW_ID];
                if (operation[AppsStudioConstants.UI_MENUS.TYPE] == AppsStudioConstants.UI_MENUS.Type.MENU) {
                    if (!operation[AppsStudioConstants.UI_MENUS.APPLICATIONID]) {
                        callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [AppsStudioConstants.UI_MENUS.APPLICATIONID]));
                        return;
                    }
                    if (!operation[AppsStudioConstants.UI_MENUS.BAAS_VIEW_ID]) {
                        callback();
                        return;
                    }
                    if (!operation[AppsStudioConstants.UI_MENUS.TABLE_ID]) {
                        callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [AppsStudioConstants.UI_MENUS.TABLE_ID]));
                        return;
                    }
                } else if (operation[AppsStudioConstants.UI_MENUS.TYPE] == AppsStudioConstants.UI_MENUS.Type.CHILD) {
                    if (!operation[AppsStudioConstants.UI_MENUS.SOURCE_VIEW_ID]) {
                        callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [AppsStudioConstants.UI_MENUS.SOURCE_VIEW_ID]));
                        return;
                    }
                    if (!operation[AppsStudioConstants.UI_MENUS.BAAS_VIEW_ID]) {
                        callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [AppsStudioConstants.UI_MENUS.BAAS_VIEW_ID]));
                        return;
                    }
                    if (!operation[AppsStudioConstants.UI_MENUS.TABLE_ID]) {
                        callback(new AppsStudioError(Constants.ErrorCode.FIELDS_BLANK_SINGLE, [AppsStudioConstants.UI_MENUS.TABLE_ID]));
                        return;
                    }
                }
                var viewId = baasViewId[Constants.Baas.Queries.ID];
                insertQuickView(operation[QueryConstants.Query._ID], label, baasViewId, options, function (err) {
                    try {
                        if (err) {
                            callback(err);
                            return;
                        }
                        insertAppViews(viewId, label, globalOrgInfo, options, function (err) {
                            if (err) {
                                callback(err);
                                return;
                            }
                            callback();
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
}

function insertQuickView(menuId, label, baasViewId, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in insertQuickView in UiMenuJob");
    }
    try {
        DatabaseEngine.executeQuery({table:AppsStudioConstants.QUICK_VIEWS.TABLE, filter:{"sourceid":menuId, "baasviewid":baasViewId._id }}, OptionUtils.getOptions(options, AppsStudioConstants.ASK), function (err, res) {
            try {
                if (err) {
                    callback(err);
                    return;
                }
                if (res && res[QueryConstants.Query.Result.DATA] && res[QueryConstants.Query.Result.DATA].length > 0) {
                    callback();
                    return;
                }
                var operation = {};
                operation[AppsStudioConstants.QUICK_VIEWS.SOURCE_ID] = {_id:menuId, label:label};
                operation[AppsStudioConstants.QUICK_VIEWS.BAAS_VIEW_ID] = baasViewId;
                operation[AppsStudioConstants.QUICK_VIEWS.LABEL] = label;
                var updates = {};
                updates[QueryConstants.Query.TABLE] = AppsStudioConstants.QUICK_VIEWS.TABLE;
                updates[QueryConstants.Update.OPERATIONS] = operation;
                UpdateEngine.executeUpdate(updates, OptionUtils.getOptions(options, AppsStudioConstants.ASK), callback);
            } catch (e) {
                callback(e);
            }
        })

    } catch (e) {
        callback(e);
    }
}

function insertAppViews(viewId, label, globalOrgInfo, options, callback) {
    if (!callback || (typeof callback != 'function')) {
        throw new Error("Callback not defined in insertAppViews in UiMenuJob");
    }
    try {
        DatabaseEngine.executeQuery({table:AppsStudioConstants.UI_VIEWS.TABLE, filter:{"id":viewId, organizationid:null, userid:null}}, OptionUtils.getOptions(options, AppsStudioConstants.ASK), function (err, res) {
            try {
                if (err) {
                    callback(err);
                    return;
                }
                if (res && res[QueryConstants.Query.Result.DATA] && res[QueryConstants.Query.Result.DATA].length > 0) {
                    callback();
                    return;
                }
                var operation = {};
                operation[AppsStudioConstants.UI_VIEWS.ID] = viewId;
                operation[AppsStudioConstants.UI_VIEWS.LABEL] = label;
                var updates = {};
                updates[QueryConstants.Query.TABLE] = AppsStudioConstants.UI_VIEWS.TABLE;
                updates[QueryConstants.Update.OPERATIONS] = operation;
                UpdateEngine.executeUpdate(updates, OptionUtils.getOptions(options, AppsStudioConstants.ASK), callback);
            } catch (e) {
                callback(e);
            }
        })
    } catch (e) {
        callback(e);
    }
}


