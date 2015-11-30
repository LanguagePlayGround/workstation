//var ProfilingLog = {};
//
//exports.logProfile = function (source, startTime, dbName, options) {
//    ProfilingLog[source] = ProfilingLog[source] || {time:0, count:0};
//    var totalTime = (new Date() - startTime);
//    if (totalTime > 0) {
//        ProfilingLog[source].time = ProfilingLog[source].time + totalTime;
//        ProfilingLog[source].count = ProfilingLog[source].count + 1;
//    }
//    if (ProfilingLog[source].time > 30000) {
//        persistInDB(source, ProfilingLog[source].count, ProfilingLog[source].time, dbName);
//        delete ProfilingLog[source];
//    }
//
//}
//
//function persistInDB(source, count, time, dbName) {
//    var ApplaneDB = require("ApplaneDB");
//    ApplaneDB.getAdminDB().then(
//        function (adminDB) {
//            return adminDB.mongoUpdate({$collection:"pl.functionlogs", $upsert:{$query:{source:source, db:dbName}, $update:{$inc:{count:count, time:time}}, $options:{new:true, upsert:true}}})
//        }).fail(function (err) {
//            console.log("err>>>>>>>>>" + err.stack);
//        })
//}
//
