/**
 * Created by ashu on 4/11/14.
 */

exports.addSystemLogs = function (pingHistory) {
    // manage cpu & ram usage logs of all workers
    var pids = Object.keys(pingHistory);
    var ApplaneDB = require("./DB.js");
    var Config = require("../Config.js").config;
    var inserts = [];
    return getProcessDetails(pids).then(function (data) {
        for (var key in data) {
            var info = data[key];
            inserts.push({pid: key, cpu: info.cpu, memory: info.memory, server: Config.SERVER_NAME, createdOn: new Date()});
        }
    }).then(function () {
        return ApplaneDB.getLogDB();
    }).then(function (logDb) {
        return logDb.update({$collection: "pl.serverprofiling", $insert: inserts, $modules: false, $events: false});
    });
};

function getProcessDetails(pids) {
    // Array of pids is required
    var processDetail = {};
    var usage = require('usage');
    var Utility = require("ApplaneCore/apputil/util.js");
    return Utility.iterateArrayWithPromise(pids, function (index, pid) {
        var d = require("q").defer();
        usage.clearHistory(pid);
        usage.lookup(pid, function (err, result) {
            if (result) {
                result.memory = result.memory / (1024 * 1024);
                processDetail[pid] = result;
            }
            d.resolve();
        });
        return d.promise;
    }).then(function () {
        //returns json object of pids with cpu & ram usage
        return processDetail;
    });
}
