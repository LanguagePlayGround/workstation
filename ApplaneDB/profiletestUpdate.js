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

//var update = {$collection:"testingupdate", $insert:[
//    {name:"Sachin", sex:"M", age:24}
//], $events:false, $modules:false};


//var update = {$collection:"testingupdate", $insert:[
//    {name:"Sachin", sex:"M", age:24}
//], $events:false, $modules:{
//    Replicate:1,
//    MergeLocalAdminDB:1,
//    Role:1,
//    DataTypeModule:1,
//    Schedule:1,
//    cascade:1, /*only for delete type*/
//    TriggerRequiredFields:1,
//    TriggerModule:1,
//    UserSorting:1,
//    SequenceModule:1,
//    LowerCaseModule:1,
//    ValidationModule:1,
//    SelfRecursiveModule:1,
//    Child:1,
//    HistoryLogs:1,
//    CollectionHierarchy:1, /*only for insert type*/
//    TransactionModule:1,
//}};

var update = {$collection:"testingupdate", $insert:[
    {name:"Sachin", sex:"M", age:24,address:{$insert:[{city:"hisar"}]}}
]};


var executeUpdate = function (db) {
    var data = [];
    for (var i = 0; i < loadCount; i++) {
        data.push(i);
    }
    var startTime = new Date();
    db.mongoTime = {};
    return Utility.iterateArrayWithPromise(data,
        function (index, row) {
            return db.update(update);
        }).then(
        function (resp) {
            var endTime = new Date();
            var diff = endTime - startTime;
            var cpu = diff - db.mongoTime.totalTime;
            console.log("Diff.." + (cpu));
            console.log("total time[" + (diff) + ") in making " + loadCount);
            console.log("DB detail" + JSON.stringify(db.mongoTime));
            console.log("timeInEventManager>>>>" + timeInEventManager);

//            console.log("timeInTransaction>>>>" + timeInTransaction);

            if (cpu < minTime) {
                minTime = cpu
            }
            if (cpu > maxTime) {
                maxTime = cpu;
            }
            totalTime = totalTime + cpu;
            count = count + 1;
            timeInEventManager = 0;

//            timeInTransaction = 0;
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


function doUpdate() {
    return executeUpdate(db).then(function () {
        doUpdate();
    })

}

makeQuery().then(function () {
    return doUpdate();
});