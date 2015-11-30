/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 31/1/14
 * Time: 6:44 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("ApplaneBaas/lib/shared/Constants.js");
var ApplaneCallback = require("ApplaneCore/apputil/ApplaneCallback.js");
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var MetadataProvider = require("ApplaneBaas/lib/metadata/MetadataProvider.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var MongoDBManager = require("ApplaneBaas/lib/database/mongodb/MongoDBManager.js");
var OPTIONS = {ask:"baas", autocommit:true, disablelogs:true};

portFileData(function (err, res) {
    if (err) {
        console.log("Error >>>>>>>>>>>>" + err);
    } else {
        console.log("Port Successful.......");
    }
})

function portFileData(callback) {
    getTables(ApplaneCallback(callback, function (tables) {
        console.log("tables length >>>>>>>>>>>" + tables.length);
        Utils.iterateArray(tables, callback, function (table, callback) {
            var columnExpression = table[Constants.Baas.Tables.COLUMNS][Constants.Baas.Tables.Columns.EXPRESSION];
            MetadataProvider.getTable(table.id, OPTIONS, ApplaneCallback(callback, function (tableInfo) {
                MetadataProvider.populateAppOrgDetails(tableInfo, OPTIONS, ApplaneCallback(callback, function (appOrgDetails) {
                    Utils.iterateArray(appOrgDetails, callback, function (appOrgDetail, callback) {
                        var newOptions = Utils.deepClone(OPTIONS);
                        newOptions.ask = appOrgDetail.ask;
                        newOptions.osk = appOrgDetail.osk;
                        console.log("appOrgDetails >>>>>>>>>>>>" + JSON.stringify(appOrgDetail));
                        MetadataProvider.getAuthenticatedTable(table.id, newOptions, ApplaneCallback(callback, function (tableInfos) {
                            var database = tableInfos.database;
                            var queryFilter = {};
                            queryFilter[columnExpression] = {$exists:true};
                            var fields = {};
                            var indexOf = columnExpression.indexOf(".");
                            var firstPart = (indexOf == -1) ? columnExpression : columnExpression.substr(0, indexOf);
                            fields[firstPart] = 1;
                            MongoDBManager.find(database.db, tableInfo.id, queryFilter, {fields:fields}, OPTIONS, ApplaneCallback(callback, function (result) {
                                Utils.iterateArray(result, callback, function (row, callback) {
                                    resolveColumnValue(row, columnExpression);
                                    var rowId = row._id;
                                    delete row._id
                                    console.log("update >>>>>>>>>>>>>" + JSON.stringify(row) + ">>>>>database >>>>>>>>>" + database.db + ">>>>>>table>>>>>" + tableInfo.id);
                                    MongoDBManager.update(database[Constants.Baas.Organizations.DB], tableInfo.id, {_id:rowId}, {$set:row}, {}, OPTIONS, callback);
                                })
                            }))
                        }))
                    })
                }))
            }))
        })
    }))
}

function resolveColumnValue(row, columnExpression) {
    var indexOf = columnExpression.indexOf(".");
    if (indexOf == -1) {
        var columnValue = Utils.resolveValue(row, columnExpression);
        if (Utils.isJSONObject(columnValue)) {
            if (columnValue.key && !columnValue._id) {
                columnValue._id = columnValue.key;
            }
        } else if (columnValue instanceof Array) {
            for (var i = 0; i < columnValue.length; i++) {
                if (columnValue[i].key && !columnValue[i]._id) {
                    columnValue[i]._id = columnValue[i].key;
                }

            }
        }
    } else {
        var firstPart = columnExpression.substr(0, indexOf);
        var columnValue = Utils.resolveValue(row, firstPart);
        if (Utils.isJSONObject(columnValue)) {
            resolveColumnValue(columnValue, columnExpression.substr(indexOf + 1));
        } else if (columnValue instanceof Array) {
            for (var i = 0; i < columnValue.length; i++) {
                resolveColumnValue(columnValue[i], columnExpression.substr(indexOf + 1));

            }
        }
    }
}

function getTables(callback) {
    var viewQuery = {};
    viewQuery[QueryConstants.Query.TABLE] = "tables__baas";
    viewQuery[QueryConstants.Query.COLUMNS] = ["_id", "id", "columns.expression"];
    var filter = {};
    filter[Constants.Baas.Tables.COLUMNS + "." + Constants.Baas.Tables.Columns.TYPE] = "image";
    viewQuery[QueryConstants.Query.FILTER] = filter;
    DatabaseEngine.executeQuery(viewQuery, OPTIONS, ApplaneCallback(callback, function (res) {
        callback(null, res.data)
    }))
}
