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
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var MongodbManager = require("ApplaneBaas/lib/database/mongodb/MongoDBManager.js");
var ReferenceDataPorting = require("ApplaneBaas/lib/customcode/baas/ReferenceDataPorting.js");
var OPTIONS = {ask:"baas", autocommit:true, disablelogs:true};

portSystemColumns(function (err, res) {
    if (err) {
        console.log("Error >>>>>>>>>>>>" + err.stack);
    } else {
        console.log("Port Successful.......");
    }
})

function portSystemColumns(callback) {
    getTables(ApplaneCallback(callback, function (tables) {
        console.log("tables length " + tables.length);
        Utils.iterateArrayWithIndex(tables, callback, function (index, table, callback) {
            MongodbManager.find("baas", "tables__baas", {_id:table._id}, {fields:{columns:1}}, OPTIONS, ApplaneCallback(callback, function (tableColumns) {
                var columns = undefined;
                if (tableColumns instanceof Array) {
                    columns = tableColumns[0].columns;
                } else {
                    columns = tableColumns.columns;
                }
                MongodbManager.update("baas", "tables__baas", {"_id":table._id}, {$set:{systemcolumns:columns}}, {}, OPTIONS, callback);
            }))
        })
    }))
}

function getTables(callback) {
    var viewQuery = {};
    viewQuery[QueryConstants.Query.TABLE] = "tables__baas";
    viewQuery[QueryConstants.Query.COLUMNS] = ["_id", "id"];
//    viewQuery[QueryConstants.Query.FILTER] = {"id": "reimbursement_types__hris_basic"};
    DatabaseEngine.executeQuery(viewQuery, OPTIONS, ApplaneCallback(callback, function (res) {
        callback(null, res.data)
    }))
}
