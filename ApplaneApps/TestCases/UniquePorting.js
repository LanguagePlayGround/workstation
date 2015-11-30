///**
//* Created with IntelliJ IDEA.
//* User: daffodil
//* Date: 20/11/13
//* Time: 7:25 PM
//* To change this template use File | Settings | File Templates.
//*/
//
//
//var Constants = require("ApplaneBaas/lib/shared/Constants.js");
//var ApplaneCallback = require("ApplaneCore/apputil/ApplaneCallback.js");
//var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
//var Utils = require("ApplaneCore/apputil/util.js");
//var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
//var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
//
//
//portUniqueData(function (err, res) {
//    if (err) {
//        console.log(err.stack);
//    } else {
//        console.log("success........");
//    }
//})
//
//function portUniqueData(callback) {
//    getTable(ApplaneCallback(callback, function (tables) {
//        if (tables && tables.length > 0) {
//            console.log(tables.length);
//            Utils.iterateArray(tables, ApplaneCallback(callback, function () {
//                callback();
//            }), function (table, callback) {
//                var tableId = table._id;
//                getTableInfo(tableId, ApplaneCallback(callback, function (tableInfo) {
//                    if (tableInfo && tableInfo[0].columns) {
//                        var tableColumns = tableInfo[0].columns;
//                        var operations = [];
//                        for (var i = 0; i < tableColumns.length; i++) {
//                            var tableColumn = tableColumns[i];
//                            if (tableColumn.primary) {
//                                var update = {};
//                                update._id = tableColumn._id;
//                                update.unique = true;
//                                operations.push(update);
//                            }
//                        }
//                        if (operations.length > 0) {
//                            updateTable(tableId, operations, callback);
//                        } else {
//                            callback();
//                        }
//
//                    } else {
//                        callback();
//                    }
//                }))
//            })
//        } else {
//            callback();
//        }
//
//    }))
//}
//
//function updateTable(tableid, tableColumns, callback) {
//    var operation = {};
//    operation[QueryConstants.Query._ID] = tableid;
//    operation.columns = tableColumns;
//    var updates = {};
//    updates.table = "tables__baas";
//    updates.operations = operation;
//    updates.excludejobs = true;
//    updates.excludemodules = true;
//    console.log("updates>>>" + JSON.stringify(updates));
//
////    if (tableid.toString() == "52a1d6350a1976580a00003f") {
//        UpdateEngine.performUpdate({
//            ask: "baas",
//            updates: updates,
//            callback: callback
//        });
////    } else {
////        callback();
////    }
//
//}
//
//
//function getTableInfo(id, callback) {
//
//    var viewQuery = {};
//    viewQuery[QueryConstants.Query.TABLE] = "tables__baas";
//    viewQuery[QueryConstants.Query.COLUMNS] = ["columns"];
//    viewQuery[QueryConstants.Query.FILTER] = {"_id": id};
//
//    DatabaseEngine.query({
//        ask: "baas",
//        query: viewQuery,
//        callback: ApplaneCallback(callback, function (result) {
//            var data = result[QueryConstants.Query.Result.DATA];
//            callback(null, data);
//        })
//    })
//}
//
//function getTable(callback) {
//
//    var viewQuery = {};
//    viewQuery[QueryConstants.Query.TABLE] = "tables__baas";
//    viewQuery[QueryConstants.Query.COLUMNS] = ["_id", "id"];
////    viewQuery[QueryConstants.Query.FILTER] = filter;
//
//    DatabaseEngine.query({
//        ask: "baas",
//        query: viewQuery,
//        callback: ApplaneCallback(callback, function (result) {
//            var data = result[QueryConstants.Query.Result.DATA];
//            callback(null, data);
//        })
//    })
//}