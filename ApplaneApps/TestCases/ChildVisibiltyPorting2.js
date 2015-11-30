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
//            var viewsCount = 0;
//            var filterCount = 0;
//            var viewids = [];
//            Utils.iterateArray(views, ApplaneCallback(callback, function () {
//                console.log(viewsCount);
//                console.log(filterCount);
//                console.log("views >>>>>>>>>>>" + JSON.stringify(viewids));
//                callback();
//            }), function (view, callback) {
//                var viewId = view._id;
//                getViewCustomization(viewId, ApplaneCallback(callback, function (viewdetails) {
//                    var customization = viewdetails.customization;
//                    var baasView = viewdetails.baasviewid;
//                    customization = typeof customization == "string" ? JSON.parse(customization) : customization;
//                    if (customization && customization.columns && Object.keys(customization.columns).length > 0) {
//                        var columns = customization.columns;
//                        var childs = customization.childs || [];
//                        var hasChild = false;
//                        for (var exp in columns) {
//                            var colObj = columns[exp];
//                            if (colObj.visibility && colObj.visibility == "Child" && colObj.filter && Object.keys(colObj.filter).length > 1) {
//                                hasChild = true;
//                                colObj.visibility = "None";
//                                var newChild = {};
//                                newChild._id = new objectID().toString();
//                                newChild.label = colObj.label;
//                                newChild.viewid = colObj.viewid;
////                                newChild.tableid = customization.maintableid;
//                                var childFilter = colObj.filter;
//                                for (var filterkey in childFilter) {
//                                    var filterValue = childFilter[filterkey];
//                                    filterValue = filterValue.replace(/\./g, '_');
//                                    childFilter[filterkey] = filterValue;
//                                }
//                                var childParameterMappings = colObj.parametermappings;
//                                var newChildParameterMappings = {};
//                                for (var key in childParameterMappings) {
//                                    var paramValue = childParameterMappings[filterkey];
//                                    var newKey = key.replace(/\./g, '_');
//                                    newChildParameterMappings[newKey] = paramValue;
//                                }
//                                newChild.filter = childFilter;
//                                newChild.parametermappings = newChildParameterMappings;
//                                newChild.childcolumn = colObj.childcolumn;
////                                var filter = colObj.filter;
////                                for (var filterkey in filter) {
////                                    var filterValue = filter[filterkey];
////                                    filterValue = filterValue.substr(1, filterValue.length - 2);
////                                    var parentColumn = filterValue.substr(filterValue.indexOf(customization.maintableid) + customization.maintableid.length + 1);
////                                    newChild.parentcolumn = parentColumn;
////                                    newChild.relatedcolumn = filterkey;
////                                    break;
////                                }
//                                newChild.view = {"_id":baasView._id, "id":baasView.id};
//                                childs.push(newChild);
//                            }
//                        }
//                        if (hasChild && childs.length > 0) {
//                            customization.childs = childs;
//                            console.log("childs >>>>>>>>>>>" + JSON.stringify(childs));
//                            updateView(viewId, customization, callback);
//                        } else {
//                            callback();
//                        }
//                    }
//                    else {
//                        callback();
//                    }
//                })
//                )
//            })
//        }
//    ))
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
//    viewQuery[QueryConstants.Query.COLUMNS] = ["customization", "baasviewid"];
//    viewQuery[QueryConstants.Query.FILTER] = {"_id":viewId};
//
//    DatabaseEngine.query({
//        ask:"appsstudio",
//        query:viewQuery,
//        callback:ApplaneCallback(callback, function (result) {
//            var data = result[QueryConstants.Query.Result.DATA][0];
//            callback(null, data);
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