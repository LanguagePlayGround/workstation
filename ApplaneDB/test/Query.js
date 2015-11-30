/**
 *  mocha --recursive --timeout 150000 -g "Querystestcase" --reporter spec
 *
 *
 * $filters
 to get attendace of all employee direct reporting to current user
 $collection:"daily_attendance",$filter:{"employee_id":{"$in":{"$function":{"Functions.CurrentUser":{"referredFK":{"collection":"employees","referredField":"user_id","field":"direct_reporting_to._id"}}}}}}

 HRISUtilitiesMethods.getSelfAndTeam -- Self and all team recursively


 *  $events can be [] or {} = {function:"",event:"onQuery/onBatchQuery",pre:true,post:true,require:"modle_name"} - event will be run before module_name passed, by default it will run in last.
 *
 *  $cache:true can be set in query --> {$collection:"",$cache:true} --> then query result can be cache - Sachin Bansal (22-09-2014)
 *
 *  $events on batch query -- start - Manjeet (23-09-2014)
 *      required for P&L report for calculating net profit/ net loss over dashboard
 *      event:"onBatchQuery"
 event:"onBatchResult"
 batch query - {employees:{},users:{},$events:[]} OR {$queries:[{},{}....], $events:[]}

 $events on batch query -- end
 *
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require('./NorthwindDb.js');
var ObjectID = require("mongodb").ObjectID;
var Testcases = require("./TestCases.js");
var Utils = require("ApplaneCore/apputil/util.js");

describe("batchQueries testcase ", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("batch queries", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:NorthwindDb.EMPLOYEES_TABLE, $insert:NorthwindDb.Emps},
                    {$collection:NorthwindDb.TASK_TABLE, $insert:NorthwindDb.Tasks}
                ]
                return db.update(updates);
            }).then(
            function () {
                var batchQueries = {
                    "employees":{
                        $collection:NorthwindDb.EMPLOYEES_TABLE,
                        $fields:{employee:1, code:1},
                        $sort:{employee:1}
                    },
                    "tasks":{
                        $collection:NorthwindDb.TASK_TABLE,
                        $fields:{task:1, status:1},
                        $sort:{task:1}
                    }
                }
//                console.log("batchQueries :: ---------" + JSON.stringify(batchQueries));
                return db.batchQuery(batchQueries);
            }).then(
            function (data) {
//                console.log("Data :: ---------" + JSON.stringify(data));
                expect(data.employees.result).to.have.length(7);
                expect(data.employees.result[0]._id).to.eql("Ashish");
                expect(data.employees.result[1]._id).to.eql("Ashu");
                expect(data.employees.result[2]._id).to.eql("Nitin");
                expect(data.employees.result[3]._id).to.eql("Pawan");
                expect(data.employees.result[4]._id).to.eql("Rohit");
                expect(data.employees.result[5]._id).to.eql("Sachin");
                expect(data.employees.result[6]._id).to.eql("Yogesh");
                expect(data.employees.result[0].code).to.eql("DFG-1014");
                expect(data.employees.result[1].code).to.eql("DFG-1019");
                expect(data.employees.result[2].code).to.eql("DFG-1018");
                expect(data.employees.result[3].code).to.eql("DFG-1012");
                expect(data.employees.result[4].code).to.eql("DFG-1015");
                expect(data.employees.result[5].code).to.eql("DFG-1013");
                expect(data.employees.result[6].code).to.eql("DFG-1011");
                expect(data.tasks.result).to.have.length(12);
                expect(data.tasks.result[0]._id).to.eql("task01");
                expect(data.tasks.result[1]._id).to.eql("task02");
                expect(data.tasks.result[2]._id).to.eql("task03");
                expect(data.tasks.result[3]._id).to.eql("task04");
                expect(data.tasks.result[4]._id).to.eql("task05");
                expect(data.tasks.result[5]._id).to.eql("task06");
                expect(data.tasks.result[6]._id).to.eql("task07");
                expect(data.tasks.result[7]._id).to.eql("task08");
                expect(data.tasks.result[8]._id).to.eql("task09");
                expect(data.tasks.result[9]._id).to.eql("task10");
                expect(data.tasks.result[10]._id).to.eql("task11");
                expect(data.tasks.result[11]._id).to.eql("task12");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
        var expectedResults = {"employees":{"result":[
            {"_id":"Ashish", "employee":"Ashish", "code":"DFG-1014"},
            {"_id":"Ashu", "employee":"Ashu", "code":"DFG-1019"},
            {"_id":"Nitin", "employee":"Nitin", "code":"DFG-1018"},
            {"_id":"Pawan", "employee":"Pawan", "code":"DFG-1012"},
            {"_id":"Rohit", "employee":"Rohit", "code":"DFG-1015"},
            {"_id":"Sachin", "employee":"Sachin", "code":"DFG-1013"} ,
            {"_id":"Yogesh", "employee":"Yogesh", "code":"DFG-1011"}
        ]}, "tasks":{"result":[
            {"_id":"task01", "task":"task01", "status":"New"},
            {"_id":"task02", "task":"task02", "status":"New"},
            {"_id":"task03", "task":"task03", "status":"InProgress"},
            {"_id":"task 04", "task":"task04", "status":"InProgress"},
            {"_id":"task05", "task":"task05", "status":"New"},
            {"_id":"task06", "task":"task06", "status":"InProgress"},
            {"_id":"task07", "task":"task07", "status":"New"},
            {"_id":"task08", "task":"task08", "status":"New" },
            {"_id":"task09", "task":"task09", "status":"Completed"},
            {"_id":"task10", "task":"task10", "status":"Completed"},
            {"_id":"ta sk11", "task":"task11", "status":"Completed"},
            {"_id":"task12", "task":"task12", "status":"Completed"}
        ]}}
    })
})


describe("Querystestcase", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("Find data excedding query limit", function (done) {
        var db = undefined;
        var queryLimit = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                queryLimit = db.getConfig("QUERY_LIMIT");
                ApplaneDB.configure({QUERY_LIMIT:5})
            }).then(
            function () {
                var inserts = [
                    {task:"task1"},
                    {task:"task2"},
                    {task:"task3"},
                    {task:"task4"},
                    {task:"task5"},
                    {task:"task6"},
                    {task:"task7"},
                    {task:"task8"},
                    {task:"task9"},
                    {task:"task10"}
                ]
                return db.update({$collection:NorthwindDb.TASK_TABLE, $insert:inserts});
            }).then(
            function () {
                var query = {$collection:"tasks"};
                return db.query(query);
            }).fail(
            function (err) {
                if (err.message.indexOf("Too much records") === -1) {
                    throw err;
                }
            }).then(
            function () {
                var query = {$collection:"tasks", $limit:7};
                return db.query(query);
            }).fail(
            function (err) {
                if (err.message.indexOf("Max limit allowed is ") === -1) {
                    throw err;
                }
            }).then(
            function () {
                db.setConfig("QUERY_LIMIT", queryLimit);
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("Find All data Fields will not be passed", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var inserts = [
                    {_id:"task1", task:"task1", status:"Completed", priority:1, estHrs:2},
                    {_id:"task2", task:"task2", status:"New", priority:2, estHrs:3},
                    {_id:"task3", task:"task3", status:"Inprogress", priority:3, estHrs:4}
                ]
                return db.update({$collection:NorthwindDb.TASK_TABLE, $insert:inserts});
            }).then(
            function () {
                var query = {$collection:"tasks"};
                return db.query(query);
            }).then(
            function (data) {
//                console.log("result >>>>>>>>>>>>>>>>" + JSON.stringify(data))
                expect(data.result).to.have.length(3);

                expect(data.result[0].task).to.eql("task1");
                expect(data.result[0].status).to.eql("Completed");
                expect(data.result[0].priority).to.eql(1);
                expect(data.result[0].estHrs).to.eql(2);


                expect(data.result[1].task).to.eql("task2");
                expect(data.result[1].status).to.eql("New");
                expect(data.result[1].priority).to.eql(2);
                expect(data.result[1].estHrs).to.eql(3);

                expect(data.result[2].task).to.eql("task3");
                expect(data.result[2].status).to.eql("Inprogress");
                expect(data.result[2].priority).to.eql(3);
                expect(data.result[2].estHrs).to.eql(4);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("Find All data if Fields is passed as 1", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var inserts = [
                    {_id:"task1", task:"task1", status:"Completed", priority:1, estHrs:2}     ,
                    {_id:"task2", task:"task2", status:"New", priority:2, estHrs:3} ,
                    {_id:"task3", task:"task3", status:"Inprogress", priority:3, estHrs:4}
                ]
                return db.update({$collection:NorthwindDb.TASK_TABLE, $insert:inserts});
            }).then(
            function () {
                var query = {$collection:"tasks", $fields:{task:1, priority:1}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);

                expect(data.result[0].task).to.eql("task1");
                expect(data.result[0].status).to.eql(undefined);
                expect(data.result[0].priority).to.eql(1);
                expect(data.result[0].estHrs).to.eql(undefined);

                expect(data.result[1].task).to.eql("task2");
                expect(data.result[1].status).to.eql(undefined);
                expect(data.result[1].priority).to.eql(2);
                expect(data.result[1].estHrs).to.eql(undefined);

                expect(data.result[2].task).to.eql("task3");
                expect(data.result[2].status).to.eql(undefined);
                expect(data.result[2].priority).to.eql(3);
                expect(data.result[2].estHrs).to.eql(undefined);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })


    it("Find All data if Fields is passed as 0", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var inserts = [
                    {_id:"task1", task:"task1", status:"Completed", priority:1, estHrs:2}     ,
                    {_id:"task2", task:"task2", status:"New", priority:2, estHrs:3} ,
                    {_id:"task3", task:"task3", status:"Inprogress", priority:3, estHrs:4}
                ]
                return db.update({$collection:NorthwindDb.TASK_TABLE, $insert:inserts});
            }).then(
            function () {
                var query = {$collection:"tasks", $fields:{status:0, estHrs:0}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);

                expect(data.result[0].task).to.eql("task1");
                expect(data.result[0].status).to.eql(undefined);
                expect(data.result[0].priority).to.eql(1);
                expect(data.result[0].estHrs).to.eql(undefined);

                expect(data.result[1].task).to.eql("task2");
                expect(data.result[1].status).to.eql(undefined);
                expect(data.result[1].priority).to.eql(2);
                expect(data.result[1].estHrs).to.eql(undefined);

                expect(data.result[2].task).to.eql("task3");
                expect(data.result[2].status).to.eql(undefined);
                expect(data.result[2].priority).to.eql(3);
                expect(data.result[2].estHrs).to.eql(undefined);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })


    it("Filter simple eq", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var inserts = [
                    {_id:"task1", task:"task1", status:"Completed", priority:1, estHrs:2}     ,
                    {_id:"task2", task:"task2", status:"New", priority:2, estHrs:3} ,
                    {_id:"task3", task:"task3", status:"Inprogress", priority:3, estHrs:4}
                ]
                return db.update({$collection:NorthwindDb.TASK_TABLE, $insert:inserts});
            }).then(
            function () {
                var query = {$collection:"tasks", $filter:{status:"Completed"}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);

                expect(data.result[0].task).to.eql("task1");
                expect(data.result[0].status).to.eql("Completed");
                expect(data.result[0].priority).to.eql(1);
                expect(data.result[0].estHrs).to.eql(2);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("Filter gt or lt", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var inserts = [
                    {_id:"task1", task:"task1", status:"Completed", priority:1, estHrs:2}     ,
                    {_id:"task2", task:"task2", status:"New", priority:2, estHrs:3} ,
                    {_id:"task3", task:"task3", status:"Inprogress", priority:3, estHrs:4}
                ]
                return db.update({$collection:NorthwindDb.TASK_TABLE, $insert:inserts});
            }).then(
            function () {
                var query = {$collection:"tasks", $filter:{estHrs:{$lt:3}}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].task).to.eql("task1");
                expect(data.result[0].status).to.eql("Completed");
                expect(data.result[0].priority).to.eql(1);
                expect(data.result[0].estHrs).to.eql(2);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("Sort", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var inserts = [
                    {_id:"task1", task:"task1", status:"Completed", priority:1, estHrs:2}     ,
                    {_id:"task2", task:"task2", status:"New", priority:2, estHrs:3} ,
                    {_id:"task3", task:"task3", status:"Inprogress", priority:3, estHrs:4}
                ]
                return db.update({$collection:NorthwindDb.TASK_TABLE, $insert:inserts});
            }).then(
            function () {
                var query = {$collection:"tasks", $sort:{task:-1}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);

                expect(data.result[2].task).to.eql("task1");
                expect(data.result[2].status).to.eql("Completed");
                expect(data.result[2].priority).to.eql(1);
                expect(data.result[2].estHrs).to.eql(2);


                expect(data.result[1].task).to.eql("task2");
                expect(data.result[1].status).to.eql("New");
                expect(data.result[1].priority).to.eql(2);
                expect(data.result[1].estHrs).to.eql(3);

                expect(data.result[0].task).to.eql("task3");
                expect(data.result[0].status).to.eql("Inprogress");
                expect(data.result[0].priority).to.eql(3);
                expect(data.result[0].estHrs).to.eql(4);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("limit", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var inserts = [
                    {_id:"task1", task:"task1", status:"Completed", priority:1, estHrs:2}     ,
                    {_id:"task2", task:"task2", status:"New", priority:2, estHrs:3} ,
                    {_id:"task3", task:"task3", status:"Inprogress", priority:3, estHrs:4}
                ]
                return db.update({$collection:NorthwindDb.TASK_TABLE, $insert:inserts});
            }).then(
            function () {
                var query = {$collection:"tasks", $sort:{task:1}, $limit:1};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);

                expect(data.result[0].task).to.eql("task1");
                expect(data.result[0].status).to.eql("Completed");
                expect(data.result[0].priority).to.eql(1);
                expect(data.result[0].estHrs).to.eql(2);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("Check whether query has more records than the specified limit or not", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var inserts = [
                    {_id:"task1", task:"task1", status:"Completed", priority:1, estHrs:2}     ,
                    {_id:"task2", task:"task2", status:"New", priority:2, estHrs:3} ,
                    {_id:"task3", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task4", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task5", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task6", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task7", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task8", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task9", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task10", task:"task3", status:"Inprogress", priority:3, estHrs:4}


                ]
                return db.update({$collection:NorthwindDb.TASK_TABLE, $insert:inserts});
            }).then(
            function () {
                var query = {$collection:"tasks", $sort:{task:1}, $limit:4};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.dataInfo.hasNext).to.eql(true);
                expect(data.result).to.have.length(4);
                var query = {$collection:"tasks", $sort:{task:1}, $limit:6, $skip:4};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.dataInfo.hasNext).to.eql(false);
                expect(data.result).to.have.length(6);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("Check whether unwind query has more records than the specified limit or not", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var inserts = [
                    {_id:"task1", task:"task1", status:"Completed", priority:1, estHrs:2, progress:[
                        {status:"inprogress"},
                        {status:"inprogress"},
                        {status:"completed"}
                    ]}
                ]
                return db.update({$collection:NorthwindDb.TASK_TABLE, $insert:inserts});
            }).then(
            function () {
                var query = {$collection:"tasks", $sort:{task:1}, $unwind:["progress"]};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.dataInfo.hasNext).to.eql(false);
                expect(data.result).to.have.length(3);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })


    it("Has Next is undefined when limit is not passed", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var inserts = [
                    {_id:"task1", task:"task1", status:"Completed", priority:1, estHrs:2}     ,
                    {_id:"task2", task:"task2", status:"New", priority:2, estHrs:3} ,
                    {_id:"task3", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task4", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task5", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task6", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task7", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task8", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task9", task:"task3", status:"Inprogress", priority:3, estHrs:4},
                    {_id:"task10", task:"task3", status:"Inprogress", priority:3, estHrs:4}


                ]
                return db.update({$collection:NorthwindDb.TASK_TABLE, $insert:inserts});
            }).then(
            function () {
                var query = {$collection:"tasks", $sort:{task:1}};
                return db.query(query);
            }).then(
            function (data) {
                console.log("data >>>" + JSON.stringify(data));
                expect(data.dataInfo.hasNext).to.eql(false);
                expect(data.result).to.have.length(10);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("filter with _id", function (done) {
        var db = undefined;
        var haryanaID = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {"$collection":"states_demo", $insert:[
                        { state:"Haryana", code:"21312"} ,
                        {"_id":"Newyork", state:"Newyork", code:"2312"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"states_demo", $sort:{state:1}});
            }).then(
            function (data) {
                haryanaID = data.result[0]._id;
                var query = {$collection:"states_demo", $filter:{_id:haryanaID}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                var query = {$collection:"states_demo", $filter:{_id:haryanaID.toString()}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("filter with in _id", function (done) {
        var db = undefined;
        var haryanaID = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {"$collection":"states_demo", $insert:[
                        { state:"Haryana", code:"21312"} ,
                        {"_id":"Newyork", state:"Newyork", code:"2312"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"states_demo", $sort:{state:1}});
            }).then(
            function (data) {
                haryanaID = data.result[0]._id;
                var query = {$collection:"states_demo", $filter:{_id:{$in:[haryanaID, "Newyork"]}}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                var query = {$collection:"states_demo", $filter:{_id:{$in:[haryanaID.toString(), "Newyork"]}}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("filter with nin _id", function (done) {
        var db = undefined;
        var haryanaID = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {"$collection":"states_demo", $insert:[
                        { state:"Haryana", code:"21312"} ,
                        {"_id":"Newyork", state:"Newyork", code:"2312"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"states_demo", $sort:{state:1}});
            }).then(
            function (data) {
                haryanaID = data.result[0]._id;
                var query = {$collection:"states_demo", $filter:{_id:{$nin:[haryanaID]}}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                var query = {$collection:"states_demo", $filter:{_id:{$nin:[haryanaID.toString()]}}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("filter with ne _id", function (done) {
        var db = undefined;
        var haryanaID = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {"$collection":"states_demo", $insert:[
                        { state:"Haryana", code:"21312"} ,
                        {"_id":"Newyork", state:"Newyork", code:"2312"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"states_demo", $sort:{state:1}});
            }).then(
            function (data) {
                haryanaID = data.result[0]._id;
                var query = {$collection:"states_demo", $filter:{_id:{$ne:haryanaID}}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                var query = {$collection:"states_demo", $filter:{_id:{$ne:haryanaID.toString()}}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("filter with gte _id", function (done) {
        var db = undefined;
        var haryanaID = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {"$collection":"states_demo", $insert:[
                        {state:"Haryana", code:"21312"} ,
                        {state:"Newyork", code:"2312"},
                        {state:"Punjab", code:"77712"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"states_demo", $sort:{state:1}});
            }).then(
            function (data) {
                haryanaID = data.result[0]._id;
                var query = {$collection:"states_demo", $filter:{_id:{$gte:haryanaID}}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                var query = {$collection:"states_demo", $filter:{_id:{$gte:haryanaID.toString()}}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("filter with lt _id", function (done) {
        var db = undefined;
        var haryanaID = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {"$collection":"states_demo", $insert:[
                        {state:"Haryana", code:"21312"} ,
                        {state:"Newyork", code:"2312"},
                        {state:"Punjab", code:"77712"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"states_demo", $sort:{state:1}});
            }).then(
            function (data) {
                haryanaID = data.result[0]._id;
                var query = {$collection:"states_demo", $filter:{_id:{$lt:haryanaID}}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                var query = {$collection:"states_demo", $filter:{_id:{$lt:ObjectID(haryanaID.toString())}}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("filter with _id unwind", function (done) {
        var db = undefined;
        var HisarId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {"$collection":{collection:"states_demo", fields:[
                        {field:"cities", type:"object", multiple:true}
                    ]}, $insert:[
                        {state:"Haryana", code:"21312", cities:[
                            { name:"Hisar"},
                            { name:"Rohtak"},
                            { name:"Sirsa"}
                        ]} ,
                        {state:"Punjab", code:"77712", cities:[
                            { name:"Chandigarh"},
                            { name:"Mohali"},
                            { name:"Ludhiana"}
                        ]}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"states_demo", $sort:{state:1}, $unwind:["cities"]});
            }).then(
            function (data) {
                HisarId = data.result[0].cities._id;
                var query = {$collection:"states_demo", $unwind:["cities"], $filter:{"cities._id":HisarId}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                var query = {$collection:"states_demo", $unwind:["cities"], $filter:{"cities._id":HisarId.toString()}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("filter with _id Fk", function (done) {
        var db = undefined;
        var denverID = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {"$collection":{collection:"states_demo", fields:[
                        {field:"district", type:"fk", upsert:true, collection:"district_demo"}
                    ]}, $insert:[
                        {_id:"Haryana", "state":"Haryana", "code":"21312", "district":{"_id":"Hisar", $set:{name:"Hisar"}}
                        } ,
                        {"_id":"California", "state":"California", "code":"2312", "district":{$query:{"name":"Denver"}}
                        }
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"states_demo", $sort:{state:1}});
            }).then(
            function (states) {
                denverID = states.result[0].district._id;
                var query = {$collection:"states_demo", $filter:{"district._id":denverID}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].state).to.eql("California");
                var query = {$collection:"states_demo", $filter:{"district._id":denverID.toString()}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].state).to.eql("California");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("limit zero for Simple Data", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var inserts = [
                    {_id:"task1", task:"task1", status:"Completed", priority:1, estHrs:2}     ,
                    {_id:"task2", task:"task2", status:"New", priority:2, estHrs:3} ,
                    {_id:"task3", task:"task3", status:"Inprogress", priority:3, estHrs:4}
                ]
                return db.update({$collection:NorthwindDb.TASK_TABLE, $insert:inserts});
            }).then(
            function () {
                var query = {$collection:"tasks", $sort:{task:1}, $limit:0};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("limit zero for Aggregate Data", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return  db.mongoUpdate([
                    {$collection:NorthwindDb.VOUCHERS_TABLE, $insert:NorthwindDb.Vouchers},
                    {$collection:NorthwindDb.ACCOUNT_GROUPS_TABLE, $insert:NorthwindDb.AccountGroups},
                    {$collection:NorthwindDb.ACCOUNTS_TABLE, $insert:NorthwindDb.Accounts}
                ])
            }).then(
            function () {
                var query = {
                    "$collection":{collection:"vouchers", fields:[
                        {field:"accountgroupid", type:"fk", collection:"accountgroups"}
                    ]},
                    $unwind:["vlis"],
                    "$group":{"_id":"$vlis.accountgroupid._id",
                        "amount":{"$sum":"$vlis.amount"},
                        "vlis_accountgroupid__id":{"$first":"$vlis.accountgroupid._id"},
                        $sort:{"vlis.accountgroupid._id":1}
                    }, $limit:0
                };
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })


    it("Dotted Fk field in Query", function (done) {
        var db = undefined;

        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"departments"},
                        {collection:"___employee"},
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"department", type:"string", collectionid:{$query:{collection:"departments"}}} ,
                        {field:"location", type:"string", collectionid:{$query:{collection:"departments"}}} ,
                        {field:"ename", type:"striing", collectionid:{$query:{collection:"___employee"}}} ,
                        {field:"departmentId", type:"fk", collectionid:{$query:{collection:"___employee"}}, collection:"departments", set:["department"]},
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"___employee", set:["ename"]}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var departmentData = [
                    {department:"Department1", location:"Hisar"},
                    {department:"Department2", location:"Sirsa"}
                ];
                return db.update({$collection:"departments", $insert:departmentData});
            }).then(
            function () {
                var employeeData = [
                    {ename:"First", departmentId:{$query:{department:"Department1"}}},
                    {ename:"Second", departmentId:{$query:{department:"Department2"}}}
                ];
                return db.update({$collection:"___employee", $insert:employeeData});
            }).then(
            function () {
                var tasks = [
                    {task:"task1", ownerid:{$query:{ename:"First"}}},
                    {task:"task2", ownerid:{$query:{ename:"Second"}}}
                ];
                return db.update({$collection:"tasks", $insert:tasks});
            }).then(
            function () {
                var query = {$collection:"tasks", $fields:{"ownerid.departmentId":1}};
                return db.query(query);
            }).then(
            function (data) {
                expect(data.result[0].ownerid.departmentId.department).to.eql("Department1");
                expect(data.result[0].task).to.eql(undefined);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

});


describe("Querystestcase", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })


    it("Find Aggregate query in parallel with seperate mongo connection", function (done) {
        var db = undefined;
        var rohitDb = undefined;
        var aggregateQuery = undefined;
        var findQuery = undefined;
        var status = {};
        var mongoFind = 0;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefinition = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"accountsss"},
                        {collection:"voucherlineitemsss"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"accountsss"}}, visibility:true},
                        {field:"code", type:"string", collectionid:{$query:{collection:"accountsss"}}, visibility:true},
                        {field:"parent_account_id", type:"fk", collectionid:{$query:{collection:"accountsss"}}, collection:"accountsss", set:["name"]},
                        {field:"account_id", label:"Location", type:"fk", collectionid:{$query:{collection:"voucherlineitemsss"}}, collection:"accountsss", displayField:"name", set:["name"], visibility:true},
                        {field:"code", type:"string", parentfieldid:{$query:{field:"account_id", collectionid:{$query:{collection:"voucherlineitemsss"}}}}, collectionid:{$query:{collection:"voucherlineitemsss"}}, visibility:true},
                        {field:"amount", type:"currency", collectionid:{$query:{collection:"voucherlineitemsss"}}, visibility:true}

                    ]}
                ];
                return db.update(collectionDefinition);
            }).then(
            function () {
                return db.update({$collection:"pl.currencies", $insert:[
                    {type:"INR"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"accountsss", $insert:[
                    {"name":"asset", "code":"asset1"},
                    {"name":"current asset", "code":"asset2", parent_account_id:{$query:{name:"asset"}}},
                    {"name":"cash", "code":"asset3", parent_account_id:{$query:{name:"current asset"}}},
                    {"name":"bank", "code":"asset4", parent_account_id:{$query:{name:"current asset"}}},
                    {"name":"fixed asset", "code":"asset5", parent_account_id:{$query:{name:"asset"}}},
                    {"name":"building", "code":"asset6", parent_account_id:{$query:{name:"fixed asset"}}},
                    {"name":"furniture", "code":"asset7", parent_account_id:{$query:{name:"fixed asset"}}},
                    {"name":"liabilities", "code":"liab1"},
                    {"name":"current liabilities", "code":"liab2", parent_account_id:{$query:{name:"liabilities"}}},
                    {"name":"creditors", "code":"liab3", parent_account_id:{$query:{name:"current liabilities"}}},
                    {"name":"bank overdraft", "code":"liab4", parent_account_id:{$query:{name:"current liabilities"}}},
                    {"name":"fixed liabilities", "code":"liab5", parent_account_id:{$query:{name:"liabilities"}}},
                    {"name":"loan", "code":"liab6", parent_account_id:{$query:{name:"fixed liabilities"}}},
                    {"name":"debentures", "code":"liab7", parent_account_id:{$query:{name:"fixed liabilities"}}}
                ]});
            }).then(
            function () {
                return db.update({$collection:"voucherlineitemsss", $insert:[
                    {"amount":{"amount":20, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"cash"}}},
                    {"amount":{"amount":30, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"cash"}}},
                    {"amount":{"amount":50, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"bank"}}},
                    {"amount":{"amount":50, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"bank"}}},
                    {"amount":{"amount":100, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"building"}}},
                    {"amount":{"amount":200, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"furniture"}}},
                    {"amount":{"amount":100, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"creditors"}}},
                    {"amount":{"amount":100, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"creditors"}}},
                    {"amount":{"amount":50, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"creditors"}}},
                    {"amount":{"amount":200, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"bank overdraft"}}},
                    {"amount":{"amount":500, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"bank overdraft"}}},
                    {"amount":{"amount":50, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"loan"}}},
                    {"amount":{"amount":10, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"debentures"}}},
                    {"amount":{"amount":10, type:{$query:{currency:"INR"}}}, account_id:{$query:{"name":"debentures"}}}
                ]});
            }).then(
            function () {
                aggregateQuery = {
                    $collection:"voucherlineitemsss",
                    $group:{
                        "_id":null,
                        "amount":{"$sum":"$amount"},
                        account_id:{$first:"$account_id"},
                        count:{$sum:1}
                    },
                    $filter:{}
                };
                for (var i = 0; i < 1000; i++) {
                    aggregateQuery.$filter["count" + i] = 2;
                }
                findQuery = {$collection:"accountsss", $filter:{}, $fields:{_id:1}};
            }).then(
            function () {
                var array = [1, 2, 3, 4, 5];
                var Utils = require("ApplaneCore/apputil/util.js")
                return Utils.iterateArrayWithPromise(array, function (index, value) {
                    return db.query(findQuery)
                })
            }).then(
            function () {
                db.mongoTime = {};
            }).then(
            function () {
                executeAggregateQuery(status, aggregateQuery, db).then(function (data) {
                    mongoFind = data;
                });
            }).then(
            function () {
                return executeFindQuery(status, findQuery, db).then(function (data) {
                    mongoFind = data;
                });
            }).then(
            function () {
                return require("q").delay(5000);
            }).then(
            function () {
//                console.log("mongoFind>>>>>" + mongoFind);
                expect(mongoFind).to.be.below(50);
                done();
            }).fail(function (err) {
                done(err);
            })
    });

    function executeAggregateQueryPromise(query, counter, db) {
        return db.query(query).then(function () {
            if (counter > 0) {
                return executeAggregateQueryPromise(query, (counter - 1), db);
            }
        })
    }


    function executeFindQueryPromise(query, counter, db) {
        return db.query(query).then(function () {
            if (counter > 0) {
                return executeFindQueryPromise(query, (counter - 1), db);
            }
        })
    }

    function executeAggregateQuery(status, query, db) {
        return executeAggregateQueryPromise(query, 100, db).then(function () {
            status.aggregate = true;
            if (status.aggregate && status.find) {
                return expectTime(db);
            }
        })
    }

    function executeFindQuery(status, query, db) {
        return executeFindQueryPromise(query, 2, db).then(function () {
            status.find = true;
            if (status.aggregate && status.find) {
                return expectTime(db);
            }
        })
    }

    function expectTime(db) {
        var mongoTime = db.mongoTime;
        var mongoFind = mongoTime.mongoFind;
        return mongoFind;
    }
});

describe("Query optimization", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("Simple Find Query", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefinition = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"priorities"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"priorities"}}, visibility:true}
                    ]}
                ];
                return db.update(collectionDefinition);
            }).then(
            function () {
                return db.update({$collection:"priorities", $insert:[
                    {name:"Low"},
                    {name:"High"},
                    {name:"Medium"}
                ]})
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
            }).then(
            function (db1) {
                db = db1;
                var itearate = [];
                for (var i = 0; i < 500; i++) {
                    itearate.push(i);
                }
                var sTime = new Date();
                return Utils.iterateArrayWithPromise(itearate,
                    function (index, row) {
                        return db.query({$collection:"priorities"});
                    }).then(function () {
                        var diff = new Date() - sTime - db.mongoTime.mongoFind;
                        console.log("diff>>>>" + diff);
                        expect(diff).to.be.below(500);
                    })
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Simple Find fk query", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefinition = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"departments"} ,
                        {collection:"employees"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"departments"}}, visibility:true},
                        {field:"name", type:"string", collectionid:{$query:{collection:"employees"}}, visibility:true},
                        {field:"departmentid", type:"fk", collection:"departments", set:["name"], collectionid:{$query:{collection:"employees"}}, visibility:true}
                    ]}
                ];
                return db.update(collectionDefinition);
            }).then(
            function () {
                return db.update({$collection:"departments", $insert:[
                    {name:"Computer"},
                    {name:"Science"}
                ]})
            }).then(
            function () {
                return db.update({$collection:"employees", $insert:[
                    {name:"Sachin", departmentid:{$query:{name:"Computer"}}},
                    {name:"manjeet", departmentid:{$query:{name:"Science"}}}
                ]})
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
            }).then(
            function (db1) {
                db = db1;
                var itearate = [];
                for (var i = 0; i < 500; i++) {
                    itearate.push(i);
                }
                var sTime = new Date();
                return Utils.iterateArrayWithPromise(itearate,
                    function (index, row) {
                        return db.query({$collection:"employees", $fields:{name:1, departmentid:1}});
                    }).then(function () {
                        var diff = ((new Date() - sTime) - db.mongoTime.mongoFind);
                        console.log("diff>>>>" + diff);
                        expect(diff).to.be.below(1000);
                    })
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Find Query with role", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Employee Self", privileges:[
                        {type:"Collection", collection:"employees", filterUI:"grid", filterInfos:{$insert:[
                            {field:"userid", value:"$$CurrentUser"}
                        ]}, operationInfos:{$insert:[
                            {type:"find", sequence:1},
                            {type:"update", sequence:2},
                            {type:"remove", sequence:3},
                            {type:"insert", sequence:4}
                        ]}}
                    ]},
                    {role:"Employee All", privileges:[
                        {type:"Collection", collection:"employees", operationInfos:{$insert:[
                            {type:"find", sequence:1},
                            {type:"update", sequence:2},
                            {type:"remove", sequence:3},
                            {type:"insert", sequence:4}
                        ]}}
                    ]}
                ]};
                return db.update(createRoles);
            }).then(
            function () {
                var collectionDefinition = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"departments"} ,
                        {collection:"employees"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"departments"}}, visibility:true},
                        {field:"name", type:"string", collectionid:{$query:{collection:"employees"}}, visibility:true},
                        {field:"departmentid", type:"fk", collection:"departments", set:["name"], collectionid:{$query:{collection:"employees"}}, visibility:true},
                        {field:"userid", type:"fk", collection:"pl.users", set:["emailid"], collectionid:{$query:{collection:"employees"}}, visibility:true, displayField:"emailid"}
                    ]}
                ];
                return db.update(collectionDefinition);
            }).then(
            function () {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin", password:"sachin", emailid:"sachin.bansal@gm.com", roles:[
                        {role:{$query:{role:"Employee Self"}}}
                    ]},
                    {username:"Rohit", password:"rohit", emailid:"rohit.bansal@gm.com", roles:[
                        {role:{$query:{role:"Employee All"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return db.update({$collection:"departments", $insert:[
                    {name:"Computer"},
                    {name:"Science"}
                ]})
            }).then(
            function () {
                var inserts = [
                    {$collection:"employees", $insert:[
                        {name:"Rohit", userid:{$query:{emailid:"rohit.bansal@gm.com"}}, departmentid:{$query:{name:"Computer"}}},
                        {name:"Sachin", userid:{$query:{emailid:"sachin.bansal@gm.com"}}, departmentid:{$query:{name:"Science"}}}
                    ]}
                ]
                return db.update(inserts);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin", password:"sachin"});
            }).then(
            function (db1) {
                db = db1;
                var itearate = [];
                for (var i = 0; i < 500; i++) {
                    itearate.push(i);
                }
                var sTime = new Date();
                return Utils.iterateArrayWithPromise(itearate,
                    function (index, row) {
                        return db.query({$collection:"employees", $fields:{name:1, departmentid:1}})
                    }).then(function () {
                        var diff = ((new Date() - sTime) - db.mongoTime.mongoFind);
                        console.log("diff>>>>" + diff);
                        expect(diff).to.be.below(1500);
                    })
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Rohit", password:"rohit"});
            }).then(
            function (db1) {
                db = db1;
                var itearate = [];
                for (var i = 0; i < 500; i++) {
                    itearate.push(i);
                }
                var sTime = new Date();
                return Utils.iterateArrayWithPromise(itearate,
                    function (index, row) {
                        return db.query({$collection:"employees", $fields:{name:1, departmentid:1}});
                    }).then(function () {
                        var diff = ((new Date() - sTime) - db.mongoTime.mongoFind);
                        console.log("diff>>>>" + diff);
                        expect(diff).to.be.below(1500);
                    })
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
})

describe("Aggregate query", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("onAggregate Event", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefinition = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"offers"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"date", type:"date", collectionid:{$query:{collection:"offers"}}},
                        {field:"status", type:"string", collectionid:{$query:{collection:"offers"}}},
                        {field:"count", type:"number", collectionid:{$query:{collection:"offers"}}}
                    ]},
                    {$collection:"pl.functions", $insert:[
                        {name:"Aggregate", source:"NorthwindTestCase/lib", type:"js"}
                    ]},
                    {$collection:"pl.events", $insert:[
                        {event:"onAggregate", pre:true, function:"Aggregate.onAggregateEvent", collectionid:{$query:{collection:"offers"}}}
                    ]}
                ];
                return db.update(collectionDefinition);
            }).then(
            function () {
                return db.update({$collection:"offers", $insert:[
                    {date:"2015-07-13T13:00:00+05:30", status:"Active", count:1},
                    {date:"2015-07-13T14:00:00+05:30", status:"Active", count:1},
                    {date:"2015-07-14T02:00:00+05:30", status:"Active", count:1},
                    {date:"2015-07-14T03:00:00+05:30", status:"Active", count:1},
                    {date:"2015-07-14T04:00:00+05:30", status:"Active", count:1},
                    {date:"2015-07-14T01:00:00+05:30", status:"Active", count:1},
                    {date:"2015-07-14T12:00:00+05:30", status:"DeActive", count:3},
                    {date:"2015-07-14T11:00:00+05:30", status:"Active", count:10},
                    {date:"2015-07-14T10:00:00+05:30", status:"Active", count:15},
                    {date:"2015-07-14T09:00:00+05:30", status:"DeActive", count:13},
                    {date:"2015-07-14T08:00:00+05:30", status:"DeActive", count:11},
                    {date:"2015-07-14T07:00:00+05:30", status:"Active", count:3},
                    {date:"2015-07-14T06:00:00+05:30", status:"DeActive", count:8}
                ]});
            }).then(
            function () {
                return db.query({$collection:"offers", $events:false, $group:{_id:{status:"$status", date:{"$dayOfMonth":"$date"}, "month":{$month:"$date"}, year:{$year:"$date"}}, date:{$first:"$date"}, status:{$first:"$status"}, count:{$sum:1}, total:{$sum:"$count"},$sort:{"_id.date":1,"_id.status":1}}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);

                expect(result.result[0]._id.status).to.eql("Active");
                expect(result.result[0]._id.date).to.eql(13);
                expect(result.result[0]._id.month).to.eql(7);
                expect(result.result[0]._id.year).to.eql(2015);
                expect(result.result[0].count).to.eql(6);
                expect(result.result[0].total).to.eql(6);

                expect(result.result[1]._id.status).to.eql("Active");
                expect(result.result[1]._id.date).to.eql(14);
                expect(result.result[1]._id.month).to.eql(7);
                expect(result.result[1]._id.year).to.eql(2015);
                expect(result.result[1].count).to.eql(3);
                expect(result.result[1].total).to.eql(28);

                expect(result.result[2]._id.status).to.eql("DeActive");
                expect(result.result[2]._id.date).to.eql(14);
                expect(result.result[2]._id.month).to.eql(7);
                expect(result.result[2]._id.year).to.eql(2015);
                expect(result.result[2].count).to.eql(4);
                expect(result.result[2].total).to.eql(35);

            }).then(
            function () {
                return db.query({$collection:"offers", $group:{_id:{status:"$status", date:{"$dayOfMonth":"$date"}, "month":{$month:"$date"}, year:{$year:"$date"}}, date:{$first:"$date"}, status:{$first:"$status"}, count:{$sum:1}, total:{$sum:"$count"},$sort:{"_id.date":1,"_id.status":1}}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);

                expect(result.result[0]._id.status).to.eql("Active");
                expect(result.result[0]._id.date).to.eql(13);
                expect(result.result[0]._id.month).to.eql(7);
                expect(result.result[0]._id.year).to.eql(2015);
                expect(result.result[0].count).to.eql(2);
                expect(result.result[0].total).to.eql(2);

                expect(result.result[1]._id.status).to.eql("Active");
                expect(result.result[1]._id.date).to.eql(14);
                expect(result.result[1]._id.month).to.eql(7);
                expect(result.result[1]._id.year).to.eql(2015);
                expect(result.result[1].count).to.eql(7);
                expect(result.result[1].total).to.eql(32);

                expect(result.result[2]._id.status).to.eql("DeActive");
                expect(result.result[2]._id.date).to.eql(14);
                expect(result.result[2]._id.month).to.eql(7);
                expect(result.result[2]._id.year).to.eql(2015);
                expect(result.result[2].count).to.eql(4);
                expect(result.result[2].total).to.eql(35);

            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    });
})