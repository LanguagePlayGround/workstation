///**
// * Created with IntelliJ IDEA.
// * User: daffodil
// * Date: 20/11/13
// * Time: 7:25 PM
// * To change this template use File | Settings | File Templates.
// */
//
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
//portTableReferredColumns(function (err, res) {
//    if (err) {
//        console.log("error in referredcolumns ............" + err.stack);
//    } else {
//        console.log("port table display columns successfully........");
//        portData(res, function (err, data) {
//            if (err) {
//                console.log("error in data ............" + err.stack);
//            } else {
//                console.log("port data successfully........");
//            }
//        })
//    }
//})
//
//function portData(referredColumnMap, callback) {
//    getTable(ApplaneCallback(callback, function (tables) {
//        console.log(tables.length);
//        Utils.iterateArrayWithIndex(tables, callback, function (index, table, callback) {
//            console.log("porting of display columns>>>>[" + index + "], out of[" + tables.length + "]");
//            var tableId = table._id;
//            getTableInfo(tableId, ApplaneCallback(callback, function (tableInfo) {
//                var tableColumns = tableInfo.columns;
//                var tableReferredColumns = tableInfo.referredcolumns;
//                if (tableInfo.columns && tableInfo.columns.length > 0) {
//                    var columns = [];
//                    for (var i = 0; i < tableColumns.length; i++) {
//                        var tableColumn = tableColumns[i];
//                        if (tableColumn.type == "lookup") {
//                            var operation = {};
//                            if (tableColumn.table && referredColumnMap[tableColumn.table._id]) {
//                                if (!tableColumn.displaycolumns || tableColumn.displaycolumns.length == 0) {
//                                    operation.displaycolumns = referredColumnMap[tableColumn.table._id];
//                                }
//                            } else if (tableColumn.options && tableColumn.options.length > 0) {
//                                operation.type = "string";
//                            }
//                            if (Object.keys(operation).length > 0) {
//                                operation._id = tableColumn._id;
//                                if (operation.displaycolumns && operation.displaycolumns.length == 2 && tableColumn.table.id == "users__baas" && operation.displaycolumns[0] == "usergroupid") {
//                                    operation.displaycolumns = ["username", "usergroupid"];
//                                }
//                                columns.push(operation);
//                            }
//                        }
//                    }
//                    if (columns.length > 0) {
//                        var operation = {};
//                        operation._id = tableId;
//                        operation.columns = columns;
//                        updateTable(operation, callback);
//                    } else {
//                        callback();
//                    }
//                } else {
//                    callback();
//                }
//            }))
//        })
//    }))
//}
//
//function portTableReferredColumns(callback) {
//    getTable(ApplaneCallback(callback, function (tables) {
//        console.log(tables.length);
//        var referredColumnMap = {};
//        Utils.iterateArrayWithIndex(tables, ApplaneCallback(callback, function () {
//            callback(null, referredColumnMap);
//        }), function (index, table, callback) {
//            console.log("index to port>>>>[" + index + "] out of [" + tables.length + "]");
//            var tableId = table._id;
//            getTableInfo(tableId, ApplaneCallback(callback, function (tableInfo) {
//                if (tableInfo.columns && tableInfo.columns.length > 0) {
//                    var tableColumns = tableInfo.columns;
//                    var tableReferredColumns = tableInfo.referredcolumns || [];
//                    for (var i = 0; i < tableColumns.length; i++) {
//                        var tableColumn = tableColumns[i];
//                        var columnExp = tableColumn.expression;
//                        if (columnExp && columnExp.indexOf(".") == -1 && tableColumn.primary && tableReferredColumns.indexOf(columnExp) == -1) {
//                            tableReferredColumns.push(columnExp);
//                        }
//                    }
//
//                    if (tableReferredColumns.length > 0 && tableId != "522f039dd870c3ec17000590" && tableId != "522f04fdd870c3ec170005ef") {
//                        var operation = {};
//                        operation._id = tableId;
//                        operation.referredcolumns = tableReferredColumns;
//                        referredColumnMap[tableId] = tableReferredColumns;
//                        updateTable(operation, callback);
//                    } else {
//                        callback();
//                    }
//                } else {
//                    callback();
//                }
//            }))
//        })
//    }))
//}
//
//function updateTable(operation, callback) {
//    var updates = {};
//    updates.table = "tables__baas";
//    updates.operations = operation;
//    updates.excludejobs = true;
//    updates.excludemodules = true;
//    console.log("updates>>>" + JSON.stringify(updates));
//    UpdateEngine.performUpdate({
//        ask:"baas",
//        updates:updates,
//        callback:callback
//    });
//}
//
//
//function getTableInfo(id, callback) {
//
//    var viewQuery = {};
//    viewQuery[QueryConstants.Query.TABLE] = "tables__baas";
////    viewQuery[QueryConstants.Query.COLUMNS] = ["columns"];
//    viewQuery[QueryConstants.Query.FILTER] = {"_id":id};
//
//    DatabaseEngine.query({
//        ask:"baas",
//        query:viewQuery,
//        callback:ApplaneCallback(callback, function (result) {
//            var data = result[QueryConstants.Query.Result.DATA][0];
//            callback(null, data);
//        })
//    })
//}
//
//function getTable(callback) {
//    var viewQuery = {};
//    viewQuery[QueryConstants.Query.TABLE] = "tables__baas";
//    viewQuery[QueryConstants.Query.COLUMNS] = ["_id", "id"];
//
//    DatabaseEngine.query({
//        ask:"baas",
//        query:viewQuery,
//        callback:ApplaneCallback(callback, function (result) {
//            var data = result[QueryConstants.Query.Result.DATA];
//            callback(null, data);
//        })
//    })
//}