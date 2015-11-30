///**
// * Created with IntelliJ IDEA.
// * User: daffodil
// * Date: 20/11/13
// * Time: 7:25 PM
// * To change this template use File | Settings | File Templates.
// */
//
//
//var Constants = require("ApplaneBaas/lib/shared/Constants.js");
//var ApplaneCallback = require("ApplaneCore/apputil/ApplaneCallback.js");
//var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
//var Utils = require("ApplaneCore/apputil/util.js");
//var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
//var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
//
//function portMenus(callback) {
//    getViewGroups(ApplaneCallback(callback, function (viewgroups) {
//        Utils.iterateArray(viewgroups, callback, function (viewGroup, callback) {
//            var viewGroupMenus = viewGroup.menus;
//            var count = 0;
//            if (viewGroupMenus && viewGroupMenus.length > 0) {
//                console.log(viewGroupMenus.length);
//                var menuCount = 1;
//                Utils.iterateArray(viewGroupMenus, callback, function (viewGroupMenu, callback) {
//                    if (!viewGroupMenu.applicationid) {
//                        callback();
//                    } else {
//                        var menuUpdate = {};
//                        menuUpdate.label = viewGroupMenu.label;
//                        if (viewGroupMenu.table) {
//                            menuUpdate.baasview = {id:viewGroupMenu.table.id};
//                        }
//                        if (viewGroupMenu.viewid) {
//                            menuUpdate.viewid = viewGroupMenu.viewid.id;
//                        }
//                        menuUpdate.filter = viewGroupMenu.filter;
//                        if (viewGroupMenu.visibleexpression && viewGroupMenu.visibleexpression.trim().length > 0) {
//                            menuUpdate.visibleexpression = viewGroupMenu.visibleexpression;
//                        }
//                        menuUpdate.index = {"index":menuCount, subindex:new Date().getTime()};
//                        menuCount = menuCount + 1;
////                        menuUpdate.index = viewGroupMenu.index;
//                        menuUpdate.applicationid = {_id:viewGroupMenu.applicationid._id};
//                        updateMenus(menuUpdate, ApplaneCallback(callback, function (res) {
//                            if (viewGroupMenu.menus && viewGroupMenu.menus.length > 0) {
//                                var viewGroupSubMenus = viewGroupMenu.menus;
//                                var menuUpdates = [];
//                                for (var j = 0; j < viewGroupSubMenus.length; j++) {
//                                    var viewGroupSubMenu = viewGroupSubMenus[j];
//                                    if (!viewGroupSubMenu.applicationid) {
//                                        continue;
//                                    }
//                                    var subMenuUpdate = {};
//                                    subMenuUpdate.label = viewGroupSubMenu.label;
//                                    if (viewGroupSubMenu.table) {
//                                        subMenuUpdate.baasview = {id:viewGroupSubMenu.table.id};
//                                    }
//                                    if (viewGroupSubMenu.viewid) {
//                                        subMenuUpdate.viewid = viewGroupSubMenu.viewid.id;
//                                    }
//                                    subMenuUpdate.index = {"index":menuCount, subindex:new Date().getTime()};
//                                    menuCount = menuCount + 1;
//                                    subMenuUpdate.filter = viewGroupSubMenu.filter;
//                                    if (viewGroupSubMenu.visibleexpression && viewGroupSubMenu.visibleexpression.trim().length > 0) {
//                                        subMenuUpdate.visibleexpression = viewGroupSubMenu.visibleexpression;
//                                    }
////                                    subMenuUpdate.index = viewGroupSubMenu.index;
//                                    subMenuUpdate.applicationid = {_id:viewGroupSubMenu.applicationid._id};
//                                    subMenuUpdate.parentmenuid = {_id:res.insert[0]._id};
//                                    menuUpdates.push(subMenuUpdate);
//                                }
//                                if (menuUpdates.length > 0) {
//                                    updateMenus(menuUpdates, callback);
//                                } else {
//                                    callback();
//                                }
//                            } else {
//                                callback();
//                            }
//                        }))
//                    }
//                })
//            } else {
//                callback();
//            }
//        })
//    }))
//}
//
//function updateMenus(menuUpdates, callback) {
//    var updates = {};
//    updates.table = "menus__appsstudio";
//    updates.operations = menuUpdates;
//    updates.excludejobs = true;
//    updates.excludemodules = true;
////
////                callback();
//    UpdateEngine.performUpdate({
//        ask:"appsstudio",
//        updates:updates,
//        callback:function (err, res) {
//            callback(null, res);
//        }
//    });
//}
//
//function getViewGroups(callback) {
//    var orders = [];
//    var indexOrder = {};
//    indexOrder[Constants.AppsStudio.ViewGroups.MENUS + "." + Constants.AppsStudio.ViewGroups.Menus.INDEX] = {$order:"asc"};
//    orders.push(indexOrder);
//    var viewQuery = {};
//    viewQuery[QueryConstants.Query.TABLE] = "viewgroups__appsstudio";
//    viewQuery.orders = orders;
//    DatabaseEngine.query({
//        ask:"appsstudio",
//        query:viewQuery,
//        callback:ApplaneCallback(callback, function (result) {
//            var data = result[QueryConstants.Query.Result.DATA];
//            callback(null, data);
//        })
//    })
//}
//
//portMenus(function (err, res) {
//    if (err) {
//        console.log(err.stack);
//    } else {
//        console.log("success........");
//    }
//})