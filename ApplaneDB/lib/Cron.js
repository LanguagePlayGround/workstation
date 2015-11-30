/**
 * Created by ashu on 7/8/14.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("./Constants.js");
var Q = require("q");
var Config = require("../Config.js").config;
var SELF = require("./Cron.js");
var ApplaneDB = require("./DB.js");

exports.runCron = function () {
    console.log("run Cron called............");
    setInterval(function () {
        var adminDB = undefined;
        var status = getCronRunningStatus();
        if (!status) {
            return;
        }
        return ApplaneDB.getAdminDB().then(
            function (adb) {
                adminDB = adb;
                var dbFilter = {};
                dbFilter[Constants.Admin.Dbs.CRON_ENABLED] = true;
                return adminDB.query({$collection:Constants.Admin.DBS, $filter:dbFilter});
            }).then(
            function (dbs) {
                var dbNames = [];
                for (var i = 0; i < dbs.result.length; i++) {
                    dbNames.push(dbs.result[i][Constants.Admin.Dbs.DB]);
                }
                if (dbNames.length > 0) {
                    return runCronforDbs(dbNames, adminDB);
                }
            }).fail(
            function (err) {
                var options = {to:"sachin.bansal@daffodilsw.com", from:"developer@daffodilsw.com", subject:"Error in Cron"};
                var html = '';
                html += "<b>ERROR</b>" + err.message + "<br>";
                html += "<b>STACK</b>" + err.stack + "<br>";
                html += "<b>DATE</b>" + new Date() + "<br>";
                options.html = html;
                require("./MailService.js").sendFromAdmin(options);
            }).then(
            function () {
                adminDB = undefined;
            })
    }, 10000);
}
exports.runAdminCron = function () {
    var adminCronFunction = Config.ADMIN_CRON_FUNCTION;
    if (!adminCronFunction) {
        return;
    }
    var interval = Config.ADMIN_CRON_INTERVAL || 60 * 60 * 1000;
    setInterval(function () {
        ApplaneDB.getAdminDB().then(function (adminDB) {
            return adminDB.invokeFunction(adminCronFunction, [
                {}
            ])
        })
    }, interval)
}

function getCronRunningStatus() {
    var cronStatus = Config.CRON_STATUS;
    return cronStatus === undefined || cronStatus === "running";
}

function runCronforDbs(dbNames, db) {
    var queryToGetCron = {$collection:Constants.Admin.CRONS, $filter:{"when.nextDueOn":{$lte:new Date()}, serverName:Config.SERVER_NAME, processing:{$ne:true}}, $sort:{_id:1}};
    return db.query(queryToGetCron).then(
        function (result) {
            result = result.result;
            return Utils.asyncIterator(result, function (index, cron) {
                return manageCron(cron, dbNames, db);
            })
        })
}

function manageCron(cron, dbNames, db) {
    var insert = {__createdon:new Date(), lock:{type:"Cron", name:cron[Constants.Admin.Crons.NAME]}, db:db.db.databaseName};
    var lockId = undefined;
    return db.mongoUpdate({$collection:Constants.Admin.APP_LOCKS, $insert:insert}).fail(
        function (err) {
            if (err.code !== 11000) {
                throw err;
            }
        }).then(
        function (update) {
            if (update) {
                lockId = update[Constants.Admin.APP_LOCKS].$insert[0]._id;
                if (lockId) {
                    return executeCron(cron, dbNames, db);
                }
            }
        }).fail(
        function (err) {
            var error = undefined;
            if (err instanceof Array) {
                error = JSON.stringify(err);
            } else {
                error = JSON.stringify(Utils.getErrorInfo(err));
            }
            return db.mongoUpdate({$collection:"pl.errorlogs", $insert:[
                {date:new Date(), error:error, type:"Cron"}
            ]});
        }).then(
        function () {
            if (lockId) {
                return db.mongoUpdate({$collection:Constants.Admin.APP_LOCKS, $delete:{_id:lockId}});
            }
        })
}

function executeCron(cron, dbNames, db) {
    var status = cron[Constants.Admin.Crons.STATUS] || Constants.Admin.Crons.Status.OFF;
    var statusWiseDbs = SELF.populateDBWithStatus(status, dbNames, cron[Constants.Admin.Crons.DBS]);
    var startTime = new Date();
    var plLogId = undefined;
    var finalStatus = undefined;
    return db.mongoUpdate({$collection:"pl.logs", $insert:{type:"Cron", status:"In Progress", info:JSON.stringify({cron:cron[Constants.Admin.Crons.NAME], serverName:cron[Constants.Admin.Crons.SERVER_NAME], statusWiseDbs:statusWiseDbs}), startTime:startTime, cronid:{_id:cron._id}}}).then(
        function (update) {
            plLogId = update["pl.logs"].$insert[0]._id;
            return db.mongoUpdate({$collection:Constants.Admin.CRONS, $update:{$query:{_id:cron._id}, $set:{processing:true}}});
        }).then(
        function () {
            return Utils.iterateArrayWithPromise(statusWiseDbs, function (index, dbInfo) {
                if (dbInfo.status === "Off") {
                    return;
                }
                var d1 = Q.defer();
                setImmediate(
                    function () {
                        var dbToConnect = undefined;
                        var dbStartTime = new Date();
                        var dbName = dbInfo.db;
                        var logInfo = {db:dbName};
                        var error = undefined;
                        var functionName = dbInfo[Constants.Admin.Crons.Dbs.FUNCTION] || cron[Constants.Admin.Crons.FUNCTION];
                        var logId = Utils.getUniqueObjectId();
                        var insertLog = {startTime:startTime, db:db.db.databaseName, username:dbName, serviceType:"cron", key:functionName};
                        var serviceLogParams = {startTime:dbStartTime};
                        serviceLogParams.logId = logId;
                        return require("./Http.js").addServiceLog(logId, insertLog).then(
                            function () {
                                return db.connectUnauthorized(dbName);
                            }).then(
                            function (dbc) {
                                dbToConnect = dbc;
                                logInfo.function = functionName;
                                return dbToConnect.invokeFunction(functionName);
                            }).fail(
                            function (err) {
                                finalStatus = "Failed";
                                error = Utils.getErrorInfo(err);
                            }).then(
                            function () {
                                return require("./Cron.js").manageInnerLogs(plLogId, "Cron", logInfo, dbStartTime, error, db);
                            }).then(
                            function () {
                                serviceLogParams.error = error;
                                return require("./Http.js").updateServiceLog(serviceLogParams);
                            }).then(
                            function () {
                                dbToConnect.clean();
                                dbToConnect = undefined;
                            }).then(
                            function () {
                                d1.resolve();
                            }).fail(function (err) {
                                d1.reject(err);
                            })
                    })
                return d1.promise;
            })
        }).then(
        function () {
            return db.mongoUpdate({$collection:Constants.Admin.CRONS, $update:{$query:{_id:cron._id}, $unset:{processing:""}}});
        }).then(
        function () {
            return updateLastRunDate(cron, db);
        }).then(
        function () {
            var endTime = new Date();
            return db.mongoUpdate({$collection:"pl.logs", $update:{$query:{_id:plLogId}, $set:{status:finalStatus || "Success", endTime:new Date(), totalTime:(endTime - startTime)}}});
        }).then(function () {
            return plLogId;
        })
}

exports.manageInnerLogs = function (logId, type, logInfo, startTime, error, db) {
    var innerLog = {};
    innerLog.type = type;
    innerLog.status = error ? "Failed" : "Success";
    if (error) {
        innerLog.status = "Failed";
        innerLog.error = JSON.stringify(Utils.getErrorInfo(error));
    } else {
        innerLog.status = "Success";
    }
    innerLog.startTime = startTime;
    innerLog.endTime = new Date();
    innerLog.totalTime = innerLog.endTime - startTime;
    innerLog.log = JSON.stringify(logInfo);
    return db.mongoUpdate({$collection:"pl.logs", $update:[
        {$query:{_id:logId}, $push:{logs:{$each:[
            innerLog
        ]}}}
    ]});
}

exports.populateDBWithStatus = function (status, dbNames, overrideDbs) {
    var dbsWithStatus = [];
    for (var i = 0; i < dbNames.length; i++) {
        var dbName = dbNames[i];
        var index = Utils.isExists(overrideDbs, {db:dbName}, "db");
        if (index === undefined) {
            dbsWithStatus.push({db:dbName, status:status});
        } else {
            var overrideDbInfo = overrideDbs[index];
            dbsWithStatus.push({db:dbName, status:overrideDbInfo.status || status, function:overrideDbInfo.function});
        }
    }
    return dbsWithStatus;
}
exports.runningStatus = function (req, res) {
    var running = true;
    if (req.param("status")) {
        var statusMontitor = require(req.param("status"));
        if (req.param("cron")) {
            statusMontitor = statusMontitor [req.param("cron")];
        }
        if (req.param("value")) {
            statusMontitor[req.param("key")] = req.param("value");
            running = statusMontitor[req.param("key")] === req.param("value");
        } else {
            running = statusMontitor[req.param("key")]
        }

    }
    res.writeHead(200);
    res.write("Server Running [ " + running + "]" + process.uptime());
    res.end();
}


function updateLastRunDate(cron, db) {
    var lastRunOn = new Date();
    var nextDueOn = require("../lib/modules/Schedule.js").getNextDueDate(cron[Constants.Admin.Crons.WHEN], lastRunOn);
    return db.update({$collection:Constants.Admin.CRONS, $update:[
        {_id:cron._id, $set:{lastRunOn:lastRunOn, when:{$set:{nextDueOn:nextDueOn}}}}
    ]});
}
