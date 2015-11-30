var DatabaseEngine = require("ApplaneBaas/lib/database/DatabaseEngine.js");
var UpdateEngine = require("ApplaneBaas/lib/database/UpdateEngine.js");
var MongodbManager = require("ApplaneBaas/lib/database/mongodb/MongoDBManager.js");
var apputil = require("ApplaneCore/apputil/util.js");


function portEmployees() {
    var query = {table:"employees__hris_basic"};
    var options = {ask:"523ae7ef9ebd194301000006", osk:"daffodil", disablelogs:true, autocommit:true};
    console.log("start query");
    DatabaseEngine.executeQuery(query, options, function (err, data) {
        console.log("end query");
        if (err) {
            console.log(err.stack);
            return;
        }
        if (data && data.data.length > 0) {
            console.log("lebth >>>>>>>>>>>" + data.data.length);
            apputil.iterateArrayWithIndex(data.data, function (err, result) {
                if (err) {
                    console.log("err >> " + err.stack);
                } else {
                    console.log("Porting successfully.");
                }
            }, function (index, update, callback) {
                console.log("index >>>>>>>>>>>" + index);
                var newUpdate = {};
                newUpdate._id = update._id;
                var reportingToId = [];
                var directReportTo = update.direct_reporting_to_id;
                if (directReportTo && directReportTo.length > 0) {
                    for (var i = 0; i < directReportTo.length; i++) {
                        var directReportToId = directReportTo[i];
                        reportingToId.push({_id:directReportToId._id, name:directReportToId.name});
                    }
                }
                var indirectReportTo = update.in_direct_reporting_to_id;
                if (indirectReportTo && indirectReportTo.length > 0) {
                    for (var i = 0; i < indirectReportTo.length; i++) {
                        var indirectReportToId = indirectReportTo[i];
                        apputil.pushIfNotExists(reportingToId, {_id:indirectReportToId._id, name:indirectReportToId.name}, "_id");
                    }
                }
                if (reportingToId && reportingToId.length > 0) {
                    newUpdate.reporting_to_id = reportingToId;
                }

                console.log("newUpdates >>>>>>>>>>>>>>" + JSON.stringify(newUpdate));
                var updates = {table:"employees__hris_basic", operations:newUpdate, excludejobs:true, excludemodules:true};

                var newOptions = {ask:"523ae7ef9ebd194301000006", osk:"daffodil", disablelogs:true};
                MongodbManager.startTransaction(newOptions);
                UpdateEngine.executeUpdate(updates, newOptions, function (err, data) {
                    if (err) {
                        console.log("Error while updating ::::::::: " + err.stack);
                        callback(err);
                    }
                    MongodbManager.commitTransaction(newOptions.txnid, newOptions, function (err) {
                        if (err) {
                            console.log("Error while committing ::::::::: " + err.stack);
                            callback(err);
                        }
                        callback();
                    })
                });
            });
        }
    });
}


portEmployees();