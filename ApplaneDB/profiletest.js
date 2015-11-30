var ApplaneDB = require("ApplaneDB");
var config = {"SERVER_NAME":"localSachin", "PORT":"5100", "URL":"mongodb://192.168.100.21:27022", "BASE_URL":"D:\\projects\\developmentapplane\\node_modules\\AFBSourceClient\\/node_modules", "Admin":{"DB":"pladmin", "USER_NAME":"admin", "PASSWORD":"damin"}, "MongoAdmin":{"DB":"admin", "USER_NAME":"daffodilsw", "PASSWORD":"daffodil-applane"}, "SERVICE_LOGS_ENABLED":true};
var Utility = require("ApplaneCore/apputil/util.js");
var totalTime = {};
var loadCount = 500;
var db = undefined;
var minTime = 1000000000000;
var maxTime = 0;
var totalTime = 0;
var count = 0;

//var query = {$collection:"Priority"};
var query = {$collection:"employees", $limit:1};
//var query = {$collection: "tasks", $modules:{},$limit: 1};


var TaskFunction = {function: "getMenuState", parameters: [
    {"_id": "537090a82d1d7c020095ceb4", "__txs__": {}, "application": {"_id": "537081452d1d7c020095ce58", "label": "Task Management"}, "collection": "tasks", "index": 20, "label": "Tasks", "lastmodifiedtime": "2014-11-01T06:14:48.074Z", "qviews": [
        {"_id": "54ab62b1159317301714451c", "collection": "tasks", "id": "tasks", "index": 3, "label": "Backlog"},
        {"collection": "tasks", "id": "all_task", "index": 4, "label": "All Tasks", "_id": "54ab62b1159317301714451d"}
    ], "isVisible": true, "$$hashKey": 432, "open": true, "selectedApplication": "537081452d1d7c020095ce58"}
]};


var executeQuery = function (db, query) {
    var data = [];
    for (var i = 0; i < loadCount; i++) {
        data.push(i);
    }
    var startTime = new Date();
    db.mongoTime = {};
    return Utility.iterateArrayWithPromise(data,
        function (index, row) {
//            return db.query(query);
            return db.invokeFunction(TaskFunction.function, TaskFunction.parameters);
        }).then(
        function (resp) {
            var endTime = new Date();
            var diff = endTime - startTime;
            var cpu = diff - db.mongoTime.totalTime;
            console.log("Diff.." + (cpu));
            console.log("total time[" + (diff) + ") in making " + loadCount);
            console.log("DB detail" + JSON.stringify(db.mongoTime))

            if (cpu < minTime) {
                minTime = cpu
            }
            if (cpu > maxTime) {
                maxTime = cpu;
            }
            totalTime = totalTime + cpu;
            count = count + 1;
            console.log("Diff stats... Min time..." + minTime + "....max Time..." + maxTime + " Avg time " + (totalTime / count).toFixed(0) + " in " + count + " try of " + loadCount + " batch size");

        }).fail(function (e) {
            console.log("error..." + e.stack)

        });


}
var makeQuery = function () {
    return ApplaneDB.configure(config).then(
        function () {
            return ApplaneDB.connect("mongodb://192.168.100.21:27022", "business_sb", {username:"Amit.Singh", "password":"amitaman"}).then(function (db1) {
                db = db1;
            })
        }).fail(function (err) {
            console.log(err);

        })
}


function doQuery(log) {
    if (log) {
        var logInfo = {};
        logInfo.startTime = new Date();
        logInfo.username = db.user.username;
        logInfo.status = "In Progress";
        logInfo.db = db.db.databaseName;
        var Logger = require('./lib/Logger.js');
        var logger = new Logger(logInfo);
        logger.enable = true;
        db.setLogger(logger);
    }
    return executeQuery(db, query).then(
        function () {
            if (log) {
                delete db.logger;
            }
        }).then(function () {
            doQuery(log);
        })

}

makeQuery().then(function () {
    return doQuery(false);
});