/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 4/3/14
 * Time: 6:43 PM
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
var APP_OPTIONS = {ask:"appsstudio", autocommit:true, disablelogs:true};

getViewsToPort(function (err, res) {
    if (err) {
        console.log("Error >>>>>>>>>>>>" + err.stack);
    } else {
        console.log("Port Successful......." + JSON.stringify(res));
    }
})

function getViewsToPort(callback) {
    DatabaseEngine.executeQuery({"table":"queries__baas", "columns":["id", "query"], filter:{userid:null, organizationid:null}}, OPTIONS, function (err, queries) {
        if (err) {
            callback(err);
            return;
        }
        queries = queries.data;
        var viewIds = [];
        var count = 0;
        Utils.iterateArray(queries, function (err) {
            callback(null, viewIds);
        }, function (queryData, callback) {
            var query = queryData.query;
            if (query && typeof query == "string") {
                query = JSON.parse(query);
            }
            if (!query || query.fields) {
                callback();
            } else {
                count = count + 1;
                DatabaseEngine.executeQuery({table:"uiviews__appsstudio", filter:{"id":queryData.id, userid:null, organizationid:null}}, APP_OPTIONS, function (err, view) {
                    if (err) {
                        callback(err);
                        return;
                    }
                    view = view.data && view.data.length > 0 ? view.data[0] : null;
                    if (view && view.columns && view.columns.length > 0) {
                        viewIds.push(queryData.id);
                    }
                    callback();
                })
            }
        })
    })
}