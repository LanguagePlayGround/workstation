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
var OPTIONS = {ask:"baas", autocommit:true, disablelogs:true};

portAlias(function (err, res) {
    if (err) {
        console.log("Error >>>>>>>>>>>>" + err);
    } else {
        console.log("Port Successful.......");
    }
})

function portAlias(callback) {
    getTables(ApplaneCallback(callback, function (tables) {
        console.log("tableslength >>>>>>>>>>" + tables.length);
        if (tables && tables.length > 0) {
            for (var i = 0; i < tables.length; i++) {
                var table = tables[i];
                console.log("tableName >>>>>>>>>" + table.id);
                table.__type__ = "delete";
            }
            var updates = {table:"tables__baas", "operations":tables, excludejobs:true, excludemodules:true};
            UpdateEngine.executeUpdate(updates, OPTIONS, callback);
        } else {
            callback();
        }
    }))
}

function getTables(callback) {
    var viewQuery = {};
    viewQuery[QueryConstants.Query.TABLE] = "tables__baas";
    viewQuery[QueryConstants.Query.COLUMNS] = ["_id","id"];
    var filter = {};
    filter[Constants.Baas.Tables.MAINAPPLICATION] = null;
    viewQuery[QueryConstants.Query.FILTER] = filter;
    DatabaseEngine.executeQuery(viewQuery, OPTIONS, ApplaneCallback(callback, function (res) {
        callback(null, res.data)
    }))
}
