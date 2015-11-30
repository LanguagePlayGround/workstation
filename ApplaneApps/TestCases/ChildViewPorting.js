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
//var objectID = require("mongodb").ObjectID;
//
//function portChildView(callback) {
//    getViews(ApplaneCallback(callback, function (views) {
//        var viewHasChilds = [];
//        Utils.iterateArray(views, ApplaneCallback(callback, function () {
//            callback();
//        }), function (view, callback) {
//            var viewId = view._id;
//            getViewCustomization(viewId, ApplaneCallback(callback, function (customization) {
//                customization = typeof customization == "string" ? JSON.parse(customization) : customization;
//                if (customization && customization.childs && customization.childs.length > 0) {
//                    viewHasChilds.push(view._id);
//                    var childs = customization.childs;
//                    var newChilds = [];
//                    Utils.iterateArray(childs, ApplaneCallback(callback, function () {
//                        if (newChilds.length > 0) {
//                            console.log("viewid >>>>>>>>>" + view.id + " ,newChilds>>>>>>>>>>>" + JSON.stringify(newChilds));
//                            customization.childs = newChilds;
//                            if ((view.id == "vouchers__books" || view.id == "voucher__books__1382015990228") && newChilds.length == 1) {
//                                delete customization.childs;
//                            }
//                            updateView(viewId, customization, callback);
//                        } else {
//                            callback();
//                        }
//                    }), function (child, callback) {
//                            delete child.id;
//                            delete child.$$hashKey;
//                            delete child.visibility;
//                            delete child.usecurrentrow;
//                            delete child.type;
//                            delete child.__selected__;
//                            delete child.childtype;
//                            delete child.posk;
//                            delete child.pask;
//                            child._id = new objectID().toString();
//                            if (child.filter && Object.keys(child.filter).length > 0 && !(child.relatedcolumn)) {
//                                var childFilter = child.filter;
//                                for (var key in childFilter) {
//                                    child.relatedcolumn = key;
//                                    break;
//                                }
//                            }
//                            if (child.filter && Object.keys(child.filter).length > 0 && child.relatedcolumn) {
//                                var childFilter = child.filter;
//                                for (var key in childFilter) {
//                                    var filterValue = childFilter[key];
//                                    filterValue = filterValue.substr(1, filterValue.length - 2);
//                                    var tableid = filterValue.substr(0, filterValue.lastIndexOf("__id"));
//                                    child.tableid = tableid;
//                                    child.parentcolumn = "_id";
//                                    break;
//                                }
//                            }
//
//                            if (child.table) {
//                                var childTableName = child.table.id;
//                                delete child.table;
//                                if (child.relatedcolumn && !(child.filter)) {
//                                    var relatedcolumn = child.relatedcolumn;
//                                    var childFilter = {};
//                                    var filterParameter = (childTableName == "views__baas" ? "tables__baas" : childTableName) + "__id";
//                                    childFilter[relatedcolumn] = "{" + filterParameter + "}";
//                                    child.filter = childFilter;
//                                    var childParameterMappings = {};
//                                    childParameterMappings[relatedcolumn] = "_id";
//                                    childParameterMappings[filterParameter] = "_id";
//                                    child.parametermappings = childParameterMappings;
//                                }
//                                getBaasViewDetails(childTableName, ApplaneCallback(callback, function (baasViewDetails) {
//                                    child.view = baasViewDetails;
//                                    newChilds.push(child);
//                                    callback();
//                                }))
//                            } else {
//                                newChilds.push(child);
//                                callback();
//                            }
//                        }
//                    )
//                } else {
//                    callback();
//                }
//            }))
//        })
//    }))
//}
//
//function getBaasViewDetails(tableName, callback) {
//    var viewQuery = {};
//    viewQuery[QueryConstants.Query.TABLE] = "views__baas";
//    viewQuery[QueryConstants.Query.COLUMNS] = ["_id", "id"];
//    viewQuery[QueryConstants.Query.FILTER] = {"id":tableName, "table.id":tableName};
//
//    DatabaseEngine.query({
//        ask:"baas",
//        query:viewQuery,
//        callback:ApplaneCallback(callback, function (result) {
//            var customization = result[QueryConstants.Query.Result.DATA][0];
//            callback(null, customization);
//        })
//    })
//}
//
//function updateView(viewId, customization, callback) {
//    var operation = {};
//    operation[QueryConstants.Query._ID] = viewId;
//    operation.customization = JSON.stringify(customization);
//    var updates = {};
//    updates.table = "views__appsstudio";
//    updates.operations = operation;
//    updates.excludejobs = true;
//    updates.excludemodules = true;
////    callback();
//    UpdateEngine.performUpdate({
//        ask:"appsstudio",
//        updates:updates,
//        callback:callback
//    });
//}
//
//function getViewCustomization(viewId, callback) {
//    var viewQuery = {};
//    viewQuery[QueryConstants.Query.TABLE] = "views__appsstudio";
//    viewQuery[QueryConstants.Query.COLUMNS] = ["customization"];
//    viewQuery[QueryConstants.Query.FILTER] = {"_id":viewId};
//
//    DatabaseEngine.query({
//        ask:"appsstudio",
//        query:viewQuery,
//        callback:ApplaneCallback(callback, function (result) {
//            var customization = result[QueryConstants.Query.Result.DATA][0].customization;
//            callback(null, customization);
//        })
//    })
//}
//
//function getViews(callback) {
//    var viewQuery = {};
//    viewQuery[QueryConstants.Query.TABLE] = "views__appsstudio";
//    viewQuery[QueryConstants.Query.COLUMNS] = ["_id", "id"];
//
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
//portChildView(function (err, res) {
//    if (err) {
//        console.log(err.stack);
//    } else {
//        console.log("success........");
//    }
//})