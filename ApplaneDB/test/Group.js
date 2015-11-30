/**
 *
 *  mocha --recursive --timeout 150000 -g GroupQuerytestcase --reporter spec
 *
 *   mocha --recursive --timeout 150000 -g "group by on fk column without save _id and filter on _id default aggregates and add _id if fk column" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var config = require("./config.js").config;
var NorthwindDb = require("./NorthwindDb.js");
var OPTIONS = {};
var Testcases = require("./TestCases.js");
var collectionsToRegister = [
    {collection: NorthwindDb.TASK_TABLE, fields: [
        {field: "businessfunctionid", type: "fk", collection: NorthwindDb.BUSINESS_FUNCTION_TABLE, upsert: true, "set": ["businessfunction"]},
        {"field": "priorityid", "type": "fk", "collection": "priorities", "set": ["priotiry"], upsert: true} ,
        {field: "est_amt", type: "currency"},
        {field: "est_hrs", type: "duration"}
    ]},
    {collection: NorthwindDb.TASK_WITHOUT_ID_TABLE, fields: [
        {field: "businessfunctionid", type: "fk", collection: NorthwindDb.BUSINESS_FUNCTIONS_WITHOUT_ID_TABLE, upsert: true, "set": ["businessfunction"]}
    ]}
];


describe("GroupQuerytestcase", function () {
    describe("Tasktabletestcase", function () {
        before(function (done) {
            ApplaneDB.registerCollection(collectionsToRegister).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })
        after(function (done) {
            ApplaneDB.removeCollections([NorthwindDb.TASK_TABLE, NorthwindDb.TASK_WITHOUT_ID_TABLE]);
            done();
        })

        afterEach(function (done) {
            Testcases.afterEach(done);
        })
        beforeEach(function (done) {
            Testcases.beforeEach(done);
        })
        // tasks and its count
        //TODO doubt
        it.skip("data and total count", function (done) {
            done();
        })

        //tasks and total of esthrs.

        it.skip("data and total aggregates", function (done) {
            done();
        })

        // in tasks --> group by on businessfunction --> get count and total of estefforts

        //TODO businessfunctionid will be provided inteligently in result, user should specify this using $first or other thing...
        it("group by on fk column aggregates", function (done) {
            var db = undefined;
            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.TASK_TABLE, $insert: NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": "tasks",
                        "$group": {
                            "_id": "$businessfunctionid._id",
                            "count": {"$sum": 1},
                            "estefforts": {"$sum": "$estefforts"},
                            "businessfunctionid": {"$first": "$businessfunctionid"},
                            "$sort": {"businessfunctionid": 1}
                        },
                        "$sort": {"task": 1}
                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);
//
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");

                    expect(data.result[1]._id).to.eql("Delivery");
                    expect(data.result[1].count).to.eql(5);
                    expect(data.result[1].estefforts).to.eql(22);
                    expect(data.result[1].businessfunctionid._id).to.eql("Delivery");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Delivery");

                    expect(data.result[2]._id).to.eql("HR");
                    expect(data.result[2].count).to.eql(2);
                    expect(data.result[2].estefforts).to.eql(23);
                    expect(data.result[2].businessfunctionid._id).to.eql("HR");
                    expect(data.result[2].businessfunctionid.businessfunction).to.eql("HR");

                    expect(data.result[3]._id).to.eql("Sales");
                    expect(data.result[3].count).to.eql(3);
                    expect(data.result[3].estefforts).to.eql(14);
                    expect(data.result[3].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[3].businessfunctionid.businessfunction).to.eql("Sales");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })


            /**
             * Execute plan
             * group module will not work here --> it will run when $field or array is in _id of group
             */
            /*
             * Query engine --> $group, $unwind --> pipeline
             * */
            var mongoPipelines =
                [
                    {"$group": {"_id": "$businessfunctionid._id",
                        "count": {"$sum": 1},
                        "estefforts": {"$sum": "$estefforts"},
                        "businessfunctionid": {"$first": "$businessfunctionid"}}
                    },
                    {"$sort": {"businessfunctionid": 1}}
                ]

            var expectedResult = {result: [
                {_id: "Accounts", businessfunctionid: {_id: "Accounts", delivery: "Accounts"}, count: 2, estefforts: 19},
                {_id: "Delivery", businessfunctionid: {_id: "Delivery", delivery: "Delivery"}, count: 5, estefforts: 22} ,
                {_id: "HR", businessfunctionid: {_id: "HR", delivery: "HR"}, count: 2, estefforts: 23},
                {_id: "Sales", businessfunctionid: {_id: "Sales", delivery: "Sales"}, count: 3, estefforts: 14}
            ]}
        });

        it("group by on fk column aggregates and add _id if fk columns", function (done) {

            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.TASK_TABLE, $insert: NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": NorthwindDb.TASK_TABLE,
                        "$sort": {"task": 1},
                        "$group": {
                            "_id": "$businessfunctionid",
                            "count": {"$sum": 1},
                            "estefforts": {"$sum": "$estefforts"},
                            "businessfunctionid": {"$first": "$businessfunctionid"},
                            "$sort": {"businessfunctionid": 1}
                        }
                    }

                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);
//
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");

                    expect(data.result[1]._id).to.eql("Delivery");
                    expect(data.result[1].count).to.eql(5);
                    expect(data.result[1].estefforts).to.eql(22);
                    expect(data.result[1].businessfunctionid._id).to.eql("Delivery");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Delivery");

                    expect(data.result[2]._id).to.eql("HR");
                    expect(data.result[2].count).to.eql(2);
                    expect(data.result[2].estefforts).to.eql(23);
                    expect(data.result[2].businessfunctionid._id).to.eql("HR");
                    expect(data.result[2].businessfunctionid.businessfunction).to.eql("HR");

                    expect(data.result[3]._id).to.eql("Sales");
                    expect(data.result[3].count).to.eql(3);
                    expect(data.result[3].estefforts).to.eql(14);
                    expect(data.result[3].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[3].businessfunctionid.businessfunction).to.eql("Sales");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            /*
             * Query engine --> $group, $unwind --> pipeline
             * */
            var mongoPipelines =
                [
                    {"$group": {"_id": "$businessfunctionid._id",
                        "count": {"$sum": 1},
                        "estefforts": {"$sum": "$estefforts"},
                        "businessfunctionid": {"$first": "$businessfunctionid"}}
                    },
                    {"$sort": {"businessfunctionid": 1}}
                ]

            var expectedResult = {result: [
                {_id: "Accounts", businessfunctionid: {_id: "Accounts", delivery: "Accounts"}, count: 2, estefforts: 19},
                {_id: "Delivery", businessfunctionid: {_id: "Delivery", delivery: "Delivery"}, count: 5, estefforts: 22} ,
                {_id: "HR", businessfunctionid: {_id: "HR", delivery: "HR"}, count: 2, estefforts: 23},
                {_id: "Sales", businessfunctionid: {_id: "Sales", delivery: "Sales"}, count: 3, estefforts: 14}
            ]}
        });

        it("group by on fk column without save _id and filter on _id default aggregates and add _id if fk column", function (done) {
            var db = undefined;
            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.update([
                        {$collection: NorthwindDb.TASK_WITHOUT_ID_TABLE, $insert: NorthwindDb.TasksWithout_Id}
                    ])
                }).then(
                function () {
                    return db.query({$collection: NorthwindDb.BUSINESS_FUNCTIONS_WITHOUT_ID_TABLE, $fields: {_id: 1}})
                }).then(
                function (res) {
                    var bfs = [];
                    for (var i = 0; i < res.result.length; i++) {
                        bfs.push(res.result[i]._id.toString());
                    }
//                    console.log("bfs>>>>>>>>>>>" + JSON.stringify(bfs));
                    var query = {
                        "$collection": "taskswithout_id",
                        "$sort": {"task": 1},
                        "$group": {
                            "_id": "$businessfunctionid",
                            "count": {"$sum": 1},
                            "estefforts": {"$sum": "$estefforts"},
                            "businessfunctionid": {"$first": "$businessfunctionid"},
                            "$sort": {"businessfunctionid.businessfunction": 1},
                            "$filter": {"businessfunctionid._id": {"$in": bfs}}
                        }
                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data >>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(3);

                    expect(data.result[0].count).to.eql(1);
                    expect(data.result[0].estefforts).to.eql(4);
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Account");

                    expect(data.result[1].count).to.eql(2);
                    expect(data.result[1].estefforts).to.eql(4);
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Delivery");

                    expect(data.result[2].count).to.eql(1);
                    expect(data.result[2].estefforts).to.eql(2);
                    expect(data.result[2].businessfunctionid.businessfunction).to.eql("Sales");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            var expRes = {"result": [
                {"_id": "536b545963b8387811000029", "count": 1, "estefforts": 4, "businessfunctionid": {"businessfunction": "Account", "_id": "536b545963b8387811000029"}},
                {"_id": "536b545963b8387811000017", "count": 2, "estefforts": 4, "business functionid": {"businessfunction": "Delivery", "_id": "536b545963b8387811000017"}},
                {"_id": "536b545963b838781100001e", "count": 1, "estefforts": 2, "businessfunctionid": {"businessfunction": "Sales", "_id": "536b545963b838781100001e"}}
            ]};

            var mongoPipelines =
                [
                    {"$group": {"_id": "$businessfunctionid._id",
                        "count": {"$sum": 1},
                        "estefforts": {"$sum": "$estefforts"},
                        "businessfunctionid": {"$first": "$businessfunctionid"}}
                    },
                    {"$sort": {"businessfunctionid": 1}}
                ]

            var expectedResult = {result: [
                {_id: "Accounts", businessfunctionid: {_id: "Accounts", delivery: "Accounts"}, count: 2, estefforts: 19},
                {_id: "Delivery", businessfunctionid: {_id: "Delivery", delivery: "Delivery"}, count: 5, estefforts: 22} ,
                {_id: "HR", businessfunctionid: {_id: "HR", delivery: "HR"}, count: 2, estefforts: 23},
                {_id: "Sales", businessfunctionid: {_id: "Sales", delivery: "Sales"}, count: 3, estefforts: 14}
            ]}
        });

        it("group by on fk column in json aggregates and add _id if fk column", function (done) {
            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.TASK_TABLE, $insert: NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": NorthwindDb.TASK_TABLE,
                        "$sort": {"task": 1},
                        "$group": {
                            "_id": {"businessfunctionid": "$businessfunctionid"},
                            "count": {"$sum": 1},
                            "estefforts": {"$sum": "$estefforts"},
                            "businessfunctionid": {"$first": "$businessfunctionid"},
                            "$sort": {"businessfunctionid": 1}
                        }
                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("result >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data.result));
                    expect(data.result).to.have.length(4);
//
                    expect(data.result[0]._id.businessfunctionid).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");

                    expect(data.result[1]._id.businessfunctionid).to.eql("Delivery");
                    expect(data.result[1].count).to.eql(5);
                    expect(data.result[1].estefforts).to.eql(22);
                    expect(data.result[1].businessfunctionid._id).to.eql("Delivery");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Delivery");

                    expect(data.result[2]._id.businessfunctionid).to.eql("HR");
                    expect(data.result[2].count).to.eql(2);
                    expect(data.result[2].estefforts).to.eql(23);
                    expect(data.result[2].businessfunctionid._id).to.eql("HR");
                    expect(data.result[2].businessfunctionid.businessfunction).to.eql("HR");

                    expect(data.result[3]._id.businessfunctionid).to.eql("Sales");
                    expect(data.result[3].count).to.eql(3);
                    expect(data.result[3].estefforts).to.eql(14);
                    expect(data.result[3].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[3].businessfunctionid.businessfunction).to.eql("Sales");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
            /*
             * Query engine --> $group, $unwind --> pipeline
             * */
            var mongoPipelines =
                [
                    {"$group": {"_id": "$businessfunctionid._id",
                        "count": {"$sum": 1},
                        "estefforts": {"$sum": "$estefforts"},
                        "businessfunctionid": {"$first": "$businessfunctionid"}}
                    },
                    {"$sort": {"businessfunctionid": 1}}
                ]

            var expectedResult = {result: [
                {_id: "Accounts", businessfunctionid: {_id: "Accounts", delivery: "Accounts"}, count: 2, estefforts: 19},
                {_id: "Delivery", businessfunctionid: {_id: "Delivery", delivery: "Delivery"}, count: 5, estefforts: 22} ,
                {_id: "HR", businessfunctionid: {_id: "HR", delivery: "HR"}, count: 2, estefforts: 23},
                {_id: "Sales", businessfunctionid: {_id: "Sales", delivery: "Sales"}, count: 3, estefforts: 14}
            ]}
        });

        // tasks and group by on businessfunction and data

        it("group by on fk columns aggregates and data", function (done) {
            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.TASK_TABLE, $insert: NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": "tasks",
                        "$fields": {"task": 1, "estefforts": 1, "status": 1},
                        "$sort": {"task": 1},
                        "$group": {
                            "_id": "$businessfunctionid._id",
                            "count": {"$sum": 1},
                            "estefforts": {"$sum": "$estefforts"},
                            "businessfunctionid": {"$first": "$businessfunctionid"},
                            "$sort": {"businessfunctionid": 1}
                        }
                    }
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(4);
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[0].children).to.have.length(2);
                    expect(data.result[0].children[0]._id).to.eql("task09");
                    expect(data.result[0].children[0].task).to.eql("task09");
                    expect(data.result[0].children[0].estefforts).to.eql(9);
                    expect(data.result[0].children[0].status).to.eql("Completed");

                    expect(data.result[1]._id).to.eql("Delivery");
                    expect(data.result[1].count).to.eql(5);
                    expect(data.result[1].estefforts).to.eql(22);
                    expect(data.result[1].businessfunctionid._id).to.eql("Delivery");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Delivery");
                    expect(data.result[1].children).to.have.length(5);

                    expect(data.result[2]._id).to.eql("HR");
                    expect(data.result[2].count).to.eql(2);
                    expect(data.result[2].estefforts).to.eql(23);
                    expect(data.result[2].businessfunctionid._id).to.eql("HR");
                    expect(data.result[2].businessfunctionid.businessfunction).to.eql("HR");
                    expect(data.result[2].children).to.have.length(2);

                    expect(data.result[3]._id).to.eql("Sales");
                    expect(data.result[3].count).to.eql(3);
                    expect(data.result[3].estefforts).to.eql(14);
                    expect(data.result[3].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[3].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[3].children).to.have.length(3);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            // groupby module , it will remove fields, add it as childern, and also populate businessfunctionid as $first
            //TODO how will  other module get fields

            var mongoPipelines =
                [
                    {$group: {
                        _id: "businessfunctionid._id",
                        count: {$sum: 1},
                        estefforts: {$sum: "$estefforts"},
                        businessfunctionid: {$first: "$businessfunctionid"},
                        children: {$push: {_id: "$_id", task: "$task", status: "$status", estefforts: "$estefforts"}}}
                    },
                    { $sort: {businessfunctionid: 1}}

                ]

            var expectedResult = {"result": [
                {"_id": "Accounts", "count": 2, "estefforts": 19, "businessfunctionid": {"_id": "Accounts", "businessfunction": "Accounts"}, "children": [
                    {"_id": "task09", "task": "task09", "estefforts": 9, "status": "Completed"},
                    {"_id": "task10", "task": "task10", "estefforts": 10, "status": "Completed"}
                ]},
                {"_id": "Delivery", "count": 5, "estefforts": 22, "businessfunctionid": {"_id": "Delivery", "businessfunction": "Delivery"}, "children": [
                    {"_id": "task01", "task": "task01", "estefforts": 1, "status": "New"},
                    {"_id": "task03", "task": "task03", "estefforts": 3, "status": "InProgress"},
                    {"_id": "task05", "task": "task05", "estefforts": 5,
                        "status": "New"},
                    {"_id": "task06", "task": "task06", "estefforts": 6, "status": "InProgress"},
                    {"_id": "task07", "task": "task07", "estefforts": 7, "status": "New"}
                ]},
                {"_id": "HR", "count": 2, "estefforts": 23, "businessfunctionid": {"_id": "HR", "businessfunction": "HR"}, "children": [
                    {"_id": "task11", "task": "task11", "estefforts": 11, "status": "Completed"},
                    {"_id": "task12", "task": "task12", "estefforts": 12, "status": "Completed"}
                ]},
                {"_id": "Sales", "count": 3, "estefforts": 14, "businessfunctionid": {"_id": "Sales", "businessfunction": "Sales"}, "children": [
                    {"_id": "task02", "task": "task02", "estefforts": 2, "status": "New"},
                    {"_id": "task04", "task": "task04", "estefforts": 4, "status": "InProgress"},
                    {"_id": "task08", "task": "task08", "estefforts": 8, "status": "New"}
                ]}
            ]}

        })


        //  in tasks --> group by on businessfunction having sum(estefforts) < 20 and sort on sum(esteffort) : asc --> get count and estefforts sum
        it("group by on fk column with having and sort and aggregates", function (done) {

            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.TASK_TABLE, $insert: NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": "tasks",
                        "$sort": {"task": 1},
                        "$group": {
                            "_id": "$businessfunctionid._id",
                            "count": {"$sum": 1},
                            "estefforts": {"$sum": "$estefforts"},
                            "businessfunctionid": {"$first": "$businessfunctionid"},
                            "$sort": {"estefforts": 1},
                            "$filter": {"estefforts": {"$lt": 20}}
                        }
                    }
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).to.eql("Sales");
                    expect(data.result[0].count).to.eql(3);
                    expect(data.result[0].estefforts).to.eql(14);
                    expect(data.result[0].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Sales");

                    expect(data.result[1]._id).to.eql("Accounts");
                    expect(data.result[1].count).to.eql(2);
                    expect(data.result[1].estefforts).to.eql(19);
                    expect(data.result[1].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Accounts");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            //$fitler and $sort will be handle by QueryEngine, and other execute plan is same as above
            var mongoPipelines =
                [
                    {$group: {
                        _id: "businessfunctionid._id",
                        count: {$sum: 1},
                        estefforts: {$sum: "$estefforts"},
                        businessfunctionid: {$first: "$businessfunctionid"}}
                    },
                    { $match: {estefforts: {$lt: 20}}},
                    { $sort: {estefforts: 1}}

                ]

            var expectedResult = {"result": [
                {"_id": "Sales", "count": 3, "estefforts": 14, "businessfunctionid": {"_id": "Sales", "businessfunction": "Sales"}},
                {"_id": "Accounts", "count": 2, "estefforts": 19, "businessfunctionid": {"_id": "Accounts", "businessfunction": "Accounts"}}
            ]}

        })

        it("group by on fk column with having and sort and aggregates and data ", function (done) {

            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.TASK_TABLE, $insert: NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": "tasks",
                        "$fields": {"task": 1, "estefforts": 1, "status": 1},
                        "$sort": {"task": 1},
                        "$group": {
                            "_id": "$businessfunctionid._id",
                            "count": {"$sum": 1},
                            "estefforts": {"$sum": "$estefforts"},
                            "businessfunctionid": {"$first": "$businessfunctionid"},
                            "$sort": {"estefforts": 1 },
                            "$filter": {"estefforts": {"$lt": 20}}
                        }
                    };
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(2);

                    expect(data.result[0]._id).to.eql("Sales");
                    expect(data.result[0].count).to.eql(3);
                    expect(data.result[0].estefforts).to.eql(14);
                    expect(data.result[0].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[0].children).to.have.length(3);
                    expect(data.result[0].children[0]._id).to.eql("task02");
                    expect(data.result[0].children[0].task).to.eql("task02");
                    expect(data.result[0].children[0].estefforts).to.eql(2);
                    expect(data.result[0].children[0].status).to.eql("New");

                    expect(data.result[1]._id).to.eql("Accounts");
                    expect(data.result[1].count).to.eql(2);
                    expect(data.result[1].estefforts).to.eql(19);
                    expect(data.result[1].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[1].children).to.have.length(2);
                    expect(data.result[1].children[0]._id).to.eql("task09");
                    expect(data.result[1].children[0].task).to.eql("task09");
                    expect(data.result[1].children[0].estefforts).to.eql(9);
                    expect(data.result[1].children[0].status).to.eql("Completed");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })


            var mongoPipeLine = [
                {$group: {
                    _id: "businessfunctionid._id",
                    count: {$sum: 1},
                    estefforts: {$sum: "$estefforts"},
                    businessfunctionid: {$first: "$businessfunctionid._id"},
                    children: {$push: {task: "$task", status: "$status", estefforts: "$estefforts"}}}
                },
                { $match: {estefforts: {$lt: 20}}},
                { $sort: {estefforts: 1}}
            ];

            var expectedResult = {"result": [
                {"_id": "Sales", "count": 3, "estefforts": 14, "businessfunctionid": {"_id": "Sales", "businessfunction": "Sales"}, "children": [
                    {"_id": "task02", "task": "task02", "estefforts": 2, "status": "New"},
                    {"_id": "task04", "task": "task04", "estefforts": 4, "status": "InProgress"},
                    {"_id": "task08", "task": "task08", "estefforts": 8, "status": "New"}
                ]},
                {"_id": "Accounts", "count": 2, "estefforts": 19, "businessfunctionid": {"_id": "Accounts", "businessfunction": "Accounts"}, "children": [
                    {"_id": "task09", "task": "task09", "estefforts": 9, "status": "Completed"},
                    {"_id": "task10", "task": "task10", "estefforts": 10, "status": "Completed"}
                ]}

            ]}
        })

        it("group by on fk column in nested data", function (done) {

            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.VOUCHERS_TABLE, $insert: NorthwindDb.Vouchers},
                        {$collection: NorthwindDb.ACCOUNT_GROUPS_TABLE, $insert: NorthwindDb.AccountGroups},
                        {$collection: NorthwindDb.ACCOUNTS_TABLE, $insert: NorthwindDb.Accounts}
                    ]);
                }).then(
                function () {
                    var query = {
                        "$collection": "vouchers",
                        "$group": {
                            "_id": "$vlis.accountgroupid._id",
                            "amount": {"$sum": "$vlis.amount"},
                            "vlis_accountgroupid__id": {"$first": "$vlis.accountgroupid._id"}},
                        "$unwind": ["vlis"]
                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data >>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(3);

                    expect(data.result[0]._id).to.eql("Asset");
                    expect(data.result[0].amount).to.eql(-100);
                    expect(data.result[1]._id).to.eql("Expense");
                    expect(data.result[1].amount).to.eql(600);
                    expect(data.result[2]._id).to.eql("Income");
                    expect(data.result[2].amount).to.eql(-500);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            var expectedResult = {"result": [
                {"_id": "Asset", "amount": -100, "vlis_accountgroupid__id": "Asset"},
                {"_id": "Expense", "amount": 600, "vlis_accountgroupid__id": "Expense"},
                {"_id": "Income", "amount": -500, "vlis_accountgroupid__id": "Income"}
            ]};
        })

//  in tasks --> group by on businessfunction having sum(estefforts) < 20 and sort on sum(esteffort) : asc --> group by on status (first group by on businessfunction and then group by on status)

//TODO do we need to apply having on inner group

        it("group by on column more than one with having and sort and aggregates and data and array ", function (done) {

            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.TASK_TABLE, $insert: NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": "tasks",
                        "$fields": {"task": 1, "estefforts": 1, "status": 1},
                        "$sort": {"task": 1},
                        "$group": {
                            "_id": [
                                {"businessfunctionid": "$businessfunctionid._id"},
                                {"status": "$status"}
                            ],
                            "count": {"$sum": 1},
                            "estefforts": {"$sum": "$estefforts"},
                            "businessfunctionid": {"$first": "$businessfunctionid"},
                            "status": {"$first": "$status"},
                            "$sort": {"businessfunctionid": 1, "status": 1},
                            "$filter": {"estefforts": {"$lt": 20}}
                        }
                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data >>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0]._id).to.eql("Completed");
                    expect(data.result[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0]._id).to.eql("task09");
                    expect(data.result[0].children[0].children[0].task).to.eql("task09");
                    expect(data.result[0].children[0].children[0].estefforts).to.eql(9);
                    expect(data.result[0].children[0].children[0].status).to.eql("Completed");

                    expect(data.result[1]._id).to.eql("Sales");
                    expect(data.result[1].count).to.eql(3);
                    expect(data.result[1].estefforts).to.eql(14);
                    expect(data.result[1].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[1].children[0]._id).to.eql("InProgress");
                    expect(data.result[1].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children).to.have.length(1);
                    expect(data.result[1].children[0].children[0]._id).to.eql("task04");
                    expect(data.result[1].children[0].children[0].task).to.eql("task04");
                    expect(data.result[1].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[1]._id).to.eql("New");
                    expect(data.result[1].children[1].status).to.eql("New");
                    expect(data.result[1].children[1].children).to.have.length(2);
                    expect(data.result[1].children[1].children[0]._id).to.eql("task02");
                    expect(data.result[1].children[1].children[0].task).to.eql("task02");
                    expect(data.result[1].children[1].children[0].estefforts).to.eql(2);
                    expect(data.result[1].children[1].children[0].status).to.eql("New");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            // /step

            var query1 = {
                $collection: "tasks",
                $group: [
                    {
                        _id: {businessfunctionid: "$businessfunctionid._id", status: "$status"},
                        count: {$sum: 1},
                        estefforts: {$sum: "$estefforts"},
                        businessfunctionid: {$first: "$businessfunctionid"},
                        status: {$first: "$status"},
                        children: {$push: {task: "$task", status: "$status", estefforts: "$estefforts"}},
                        $filter: {estefforts: {$lt: 20}},
                        $sort: {businessfunctionid: 1, status: 1}
                    },
                    {
                        _id: "$_id.businessfunctionid",
                        count: {$sum: "$count"},
                        estefforts: {$sum: "$estefforts"},
                        businessfunctionid: {$first: "$businessfunctionid"},
                        children: {$push: {_id: "_id.status", status: "$status", count: "$count", estefforts: "$estefforts", children: "$children"}},
                        $filter: {estefforts: {$lt: 20}},
                        $sort: {businessfunctionid: 1, status: 1}
                    }
                ]};

            var mongoPipeLine = [
                {"$group": {
                    "_id": {"businessfunctionid": "$businessfunctionid._id", "status": "$status"},
                    "count": {"$sum": 1},
                    "estefforts": {"$sum": "$estefforts"},
                    "businessfunctionid": {"$first": "$businessfunctionid"},
                    "status": {"$first": "$status"},
                    "children": {"$push": {"_id": "$_id", "task": "$task", "estefforts": "$estefforts", "stat us": "$status"}}
                }},
                {"$match": {"estefforts": {"$lt": 20}}},
                {"$sort": {"businessfunctionid": 1}},
                {"$group": {
                    "_id": "$_id.businessfunctionid",
                    "count": {"$sum": "$count"},
                    "estefforts": {"$sum": "$estefforts"},
                    "businessfunctionid": {"$first": "$businessfunctionid"},
                    "children": {"$push": {"_id": "$_id.status", "status": " $status", "children": "$children", "count": "$count", "estefforts": "$estefforts"}}
                }},
                {"$match": {"estefforts": {"$lt": 20}}},
                {"$sort": {"businessfunctionid": 1, status: 1}}
            ]
            var expectedResult = {"result": [
                {"_id": "Accounts", "count": 2, "estefforts": 19, "businessfunctionid": {"_id": "Accounts", "businessfunction": "Accounts"}, "children": [
                    {"_id": "Completed", "status": "Completed", "children": [
                        {"_id": "task09", "task": "task09", "estefforts": 9, "status": "Completed"},
                        {"_id": "task10", "tas k": "task10", "estefforts": 10, "status": "Completed"}
                    ], "count": 2, "estefforts": 19}
                ]},
                {"_id": "Sales", "count": 3, "estefforts": 14, "businessfunctionid": {"_id": "Sales", "businessfunction": "Sales"}, "children": [
                    {"_id": "InProgress", "status": "InProgress", "children": [
                        {"_id": "task04", "task": "task04", "estefforts": 4, "s tatus": "InProgress"}
                    ], "count": 1, "estefforts": 4},
                    {"_id": "New", "status": "New", "children": [
                        {"_id": "task02", "task": "task02", "estefforts": 2, "status": "New"},
                        {"_id": "task08", "task": "task08", "estefforts": 8, "status": "New"}
                    ], "count": 2, "estefforts": 10}
                ]}
            ]}

        })

        it("group by on column more than one with having and sort and aggregates and data and array", function (done) {

            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.TASK_TABLE, $insert: NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": "tasks",
                        "$fields": {"task": 1, "estefforts": 1, "status": 1},
                        "$sort": {"task": 1},
                        "$group": {
                            "_id": [
                                {"businessfunctionid": "$businessfunctionid._id"},
                                {"status": "$status"}
                            ],
                            "count": {"$sum": 1},
                            "estefforts": {"$sum": "$estefforts"},
                            "businessfunctionid": {"$first": "$businessfunctionid"},
                            "status": {"$first": "$status"},
                            "$sort": {"businessfunctionid": 1, "status": 1},
                            "$filter": {"estefforts": {"$lt": 20}}
                        }
                    }
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data >>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0]._id).to.eql("Completed");
                    expect(data.result[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0]._id).to.eql("task09");
                    expect(data.result[0].children[0].children[0].task).to.eql("task09");
                    expect(data.result[0].children[0].children[0].estefforts).to.eql(9);
                    expect(data.result[0].children[0].children[0].status).to.eql("Completed");

                    expect(data.result[1]._id).to.eql("Sales");
                    expect(data.result[1].count).to.eql(3);
                    expect(data.result[1].estefforts).to.eql(14);
                    expect(data.result[1].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[1].children[0]._id).to.eql("InProgress");
                    expect(data.result[1].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children).to.have.length(1);
                    expect(data.result[1].children[0].children[0]._id).to.eql("task04");
                    expect(data.result[1].children[0].children[0].task).to.eql("task04");
                    expect(data.result[1].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[1]._id).to.eql("New");
                    expect(data.result[1].children[1].status).to.eql("New");
                    expect(data.result[1].children[1].children).to.have.length(2);
                    expect(data.result[1].children[1].children[0]._id).to.eql("task02");
                    expect(data.result[1].children[1].children[0].task).to.eql("task02");
                    expect(data.result[1].children[1].children[0].estefforts).to.eql(2);
                    expect(data.result[1].children[1].children[0].status).to.eql("New");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            // /step

            var query1 = {
                $collection: "tasks",
                $group: [
                    {
                        _id: {businessfunctionid: "$businessfunctionid._id", status: "$status"},
                        count: {$sum: 1},
                        estefforts: {$sum: "$estefforts"},
                        businessfunctionid: {$first: "$businessfunctionid"},
                        status: {$first: "$status"},
                        children: {$push: {task: "$task", status: "$status", estefforts: "$estefforts"}},
                        $filter: {estefforts: {$lt: 20}},
                        $sort: {businessfunctionid: 1, status: 1}
                    },
                    {
                        _id: "$_id.businessfunctionid",
                        count: {$sum: "$count"},
                        estefforts: {$sum: "$estefforts"},
                        businessfunctionid: {$first: "$businessfunctionid"},
                        children: {$push: {_id: "_id.status", status: "$status", count: "$count", estefforts: "$estefforts", children: "$children"}},
                        $filter: {estefforts: {$lt: 20}},
                        $sort: {businessfunctionid: 1, status: 1}
                    }
                ]};

            var mongoPipeLine = [
                {"$group": {
                    "_id": {"businessfunctionid": "$businessfunctionid._id", "status": "$status"},
                    "count": {"$sum": 1},
                    "estefforts": {"$sum": "$estefforts"},
                    "businessfunctionid": {"$first": "$businessfunctionid"},
                    "status": {"$first": "$status"},
                    "children": {"$push": {"_id": "$_id", "task": "$task", "estefforts": "$estefforts", "stat us": "$status"}}
                }},
                {"$match": {"estefforts": {"$lt": 20}}},
                {"$sort": {"businessfunctionid": 1}},
                {"$group": {
                    "_id": "$_id.businessfunctionid",
                    "count": {"$sum": "$count"},
                    "estefforts": {"$sum": "$estefforts"},
                    "businessfunctionid": {"$first": "$businessfunctionid"},
                    "children": {"$push": {"_id": "$_id.status", "status": " $status", "children": "$children", "count": "$count", "estefforts": "$estefforts"}}
                }},
                {"$match": {"estefforts": {"$lt": 20}}},
                {"$sort": {"businessfunctionid": 1, status: 1}}
            ]
            var expectedResult = {"result": [
                {"_id": "Accounts", "count": 2, "estefforts": 19, "businessfunctionid": {"_id": "Accounts", "businessfunction": "Accounts"}, "children": [
                    {"_id": "Completed", "status": "Completed", "children": [
                        {"_id": "task09", "task": "task09", "estefforts": 9, "status": "Completed"},
                        {"_id": "task10", "tas k": "task10", "estefforts": 10, "status": "Completed"}
                    ], "count": 2, "estefforts": 19}
                ]},
                {"_id": "Sales", "count": 3, "estefforts": 14, "businessfunctionid": {"_id": "Sales", "businessfunction": "Sales"}, "children": [
                    {"_id": "InProgress", "status": "InProgress", "children": [
                        {"_id": "task04", "task": "task04", "estefforts": 4, "s tatus": "InProgress"}
                    ], "count": 1, "estefforts": 4},
                    {"_id": "New", "status": "New", "children": [
                        {"_id": "task02", "task": "task02", "estefforts": 2, "status": "New"},
                        {"_id": "task08", "task": "task08", "estefforts": 8, "status": "New"}
                    ], "count": 2, "estefforts": 10}
                ]}
            ]}

        })

        it("group by on column more than one with having and sort and aggregates and data and array with udt fields", function (done) {

            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.TASK_TABLE, $insert: NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": "tasks",
                        "$fields": {"task": 1, est_hrs: 1, est_amt: 1, status: 1},
                        "$sort": {"task": 1},
                        "$group": {
                            "_id": [
                                {"businessfunctionid": "$businessfunctionid._id"},
                                {"status": "$status"}
                            ],
                            "est_amt": {"$sum": "$est_amt"},
                            "est_hrs": {"$sum": "$est_hrs"},
                            "businessfunctionid": {"$first": "$businessfunctionid"},
                            "status": {"$first": "$status"},
                            "$sort": {"businessfunctionid": 1, "status": 1}
                        }
                    }
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(4);
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].est_hrs.time).to.eql(4);
                    expect(data.result[0].est_hrs.unit).to.eql("Hrs");
                    expect(data.result[0].est_amt.amount).to.eql(20000);
                    expect(data.result[0].est_amt.type.currency).to.eql("INR");
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0]._id).to.eql("Completed");
                    expect(data.result[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].est_hrs.time).to.eql(4);
                    expect(data.result[0].children[0].est_hrs.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].est_amt.amount).to.eql(20000);
                    expect(data.result[0].children[0].est_amt.type.currency).to.eql("INR");
                    expect(data.result[0].children[0].children).to.have.length(2);
                    expect(data.result[0].children[0].children[0].est_hrs.time).to.eql(2);
                    expect(data.result[0].children[0].children[0].est_hrs.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].children[0].est_amt.amount).to.eql(10000);
                    expect(data.result[0].children[0].children[0].est_amt.type.currency).to.eql("INR");
                    expect(data.result[0].children[0].children[1].est_hrs.time).to.eql(2);
                    expect(data.result[0].children[0].children[1].est_hrs.unit).to.eql("Hrs");
                    expect(data.result[0].children[0].children[1].est_amt.amount).to.eql(10000);
                    expect(data.result[0].children[0].children[1].est_amt.type.currency).to.eql("INR");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        })

        it("group by on n Fk column more than one with having and sort and aggregates and data and array with min max", function (done) {

            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.TASK_TABLE, $insert: NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": "tasks",
                        "$fields": {"task": 1, "estefforts": 1, "status": 1},
                        "$sort": {"task": 1},
                        "$group": {
                            _id: [
                                {businessfunctionid: "$businessfunctionid._id"},
                                { status: "$status"} ,
                                { priorityid: "$priorityid._id"}
                            ],
                            count: {$sum: 1},
                            estefforts: {$sum: "$estefforts"},
                            estefforts_min: {$min: "$estefforts"},
                            estefforts_max: {$max: "$estefforts"},
                            businessfunctionid: {$first: "$businessfunctionid"},
                            status: {$first: "$status"},
                            priorityid: {$first: "$priorityid"},
                            "$sort": {"businessfunctionid": 1, "status": 1},
                            "$filter": {"estefforts": {"$lt": 20}}
                        }
                    }
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data >>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].estefforts_min).to.eql(9);
                    expect(data.result[0].estefforts_max).to.eql(10);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0]._id).to.eql("Completed");
                    expect(data.result[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].estefforts).to.eql(19);
                    expect(data.result[0].children[0].estefforts_min).to.eql(9);
                    expect(data.result[0].children[0].estefforts_max).to.eql(10);
                    expect(data.result[0].children[0].count).to.eql(2);
                    expect(data.result[0].children[0].children[0]._id).to.eql("High");
                    expect(data.result[0].children[0].children[0].priorityid.priority).to.eql("High");
                    expect(data.result[0].children[0].children[0].children).have.length(2);
                    expect(data.result[0].children[0].children[0].children[0]._id).to.eql("task09");
                    expect(data.result[0].children[0].children[0].children[0].task).to.eql("task09");
                    expect(data.result[0].children[0].children[0].children[0].estefforts).to.eql(9);
                    expect(data.result[0].children[0].children[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children[0].estefforts).to.eql(19);
                    expect(data.result[0].children[0].children[0].estefforts_min).to.eql(9);
                    expect(data.result[0].children[0].children[0].estefforts_max).to.eql(10);
                    expect(data.result[0].children[0].children[0].count).to.eql(2);

                    expect(data.result[1]._id).to.eql("Sales");
                    expect(data.result[1].count).to.eql(3);
                    expect(data.result[1].estefforts).to.eql(14);
                    expect(data.result[1].estefforts_min).to.eql(2);
                    expect(data.result[1].estefforts_max).to.eql(8);
                    expect(data.result[1].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[1].children).to.have.length(2);
                    expect(data.result[1].children[0]._id).to.eql("InProgress");
                    expect(data.result[1].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children).to.have.length(1);
                    expect(data.result[1].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].estefforts_min).to.eql(4);
                    expect(data.result[1].children[0].estefforts_max).to.eql(4);
                    expect(data.result[1].children[0].count).to.eql(1);
                    expect(data.result[1].children[0].children[0]._id).to.eql("High");
                    expect(data.result[1].children[0].children[0].priorityid.priority).to.eql("High");
                    expect(data.result[1].children[0].children[0].children).have.length(1);
                    expect(data.result[1].children[0].children[0].children[0]._id).to.eql("task04");
                    expect(data.result[1].children[0].children[0].children[0].task).to.eql("task04");
                    expect(data.result[1].children[0].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].count).to.eql(1);

                    expect(data.result[1].children[1]._id).to.eql("New");
                    expect(data.result[1].children[1].status).to.eql("New");
                    expect(data.result[1].children[1].children).to.have.length(2);
                    expect(data.result[1].children[1].estefforts).to.eql(10);
                    expect(data.result[1].children[1].estefforts_min).to.eql(2);
                    expect(data.result[1].children[1].estefforts_max).to.eql(8);
                    expect(data.result[1].children[1].count).to.eql(2);
                    expect(data.result[1].children[1].children[0]._id).to.eql("Medium");
                    expect(data.result[1].children[1].children[0].priorityid.priority).to.eql("Medium");
                    expect(data.result[1].children[1].children[0].children).have.length(1);
                    expect(data.result[1].children[1].children[0].children[0]._id).to.eql("task08");
                    expect(data.result[1].children[1].children[0].children[0].task).to.eql("task08");
                    expect(data.result[1].children[1].children[0].children[0].estefforts).to.eql(8);
                    expect(data.result[1].children[1].children[0].children[0].status).to.eql("New");
                    expect(data.result[1].children[1].children[0].estefforts).to.eql(8);
                    expect(data.result[1].children[1].children[0].estefforts_min).to.eql(8);
                    expect(data.result[1].children[1].children[0].estefforts_max).to.eql(8);
                    expect(data.result[1].children[1].children[0].count).to.eql(1);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            var mongoPipeLine = [
                {"$group": {"_id": {"businessfunctionid": "$businessfunctionid._id", "status": "$status", "priorityid": "$priorityid._id"}, "count": {"$sum": 1}, "estefforts": {"$sum": "$estefforts"}, "estefforts_min": {"$min": "$estefforts"}, "estefforts_max": {"$max": "$estefforts"}, "businessfunctionid": {"$first": "$businessfunctionid"}, "status": {"$first": "$status"}, "priorityid": {"$first": "$priorityid"}, "children": {"$push": {"_id": "$_id", "task": "$task", "estefforts": "$estefforts", "status": "$status"}}}},
                {"$match": {"estefforts": {"$lt": 20}}},
                {"$sort": {"businessfunctionid": 1, "status": 1}},
                {"$group": {"_id": {"business functionid": "$_id.businessfunctionid", "status": "$_id.status"}, "count": {"$sum": "$count"}, "estefforts": {"$sum": "$estefforts"}, "estefforts_min": {"$min": "$estefforts_min"}, "estefforts_max": {"$max": "$estefforts_max"}, "businessfunctionid": {"$first": "$businessfunctionid"}, "status": {"$first": "$status"}, "chi ldren": {"$push": {"_id": "$_id.priorityid", "priorityid": "$priorityid", "children": "$children", "count": "$count", "estefforts": "$estefforts", "estefforts_min": "$estefforts_min", "estefforts_max": "$estefforts_max"}}}},
                {"$match": {"estefforts": {"$lt": 20}}},
                {"$sort": {"businessfunctionid": 1, "status": 1}},
                {"$group ": {"_id": "$_id.businessfunctionid", "count": {"$sum": "$count"}, "estefforts": {"$sum": "$estefforts"}, "estefforts_min": {"$min": "$estefforts_min"}, "estefforts_max": {"$max": "$estefforts_max"}, "businessfunctionid": {"$first": "$businessfunctionid"}, "children": {"$push": {"_id": "$_id.status", "status": "$status", " children": "$children", "count": "$count", "estefforts": "$estefforts", "estefforts_min": "$estefforts_min", "estefforts_max": "$estefforts_max"}}}},
                {"$match": {"estefforts": {"$lt": 20}}},
                {"$sort": {"businessfunctionid": 1, "status": 1}},
                {"$sort": {"task": 1}}
            ]

            var expectedResult = {"result": [
                {"_id": "Accounts", "count": 2, "estefforts": 19, "estefforts_min": 9, "estefforts_max": 10, "businessfunctionid": {"_id": "Accounts", "businessfunction": "Accounts"}, "children": [
                    {"_id": "Completed", "status": "Completed", "children": [
                        {"_id": "High", "priorityid": {"_id": "Hi gh", "priority": "High"}, "children": [
                            {"_id": "task09", "task": "task09", "estefforts": 9, "status": "Completed"},
                            {"_id": "task10", "task": "task10", "estefforts": 10, "status": "Completed"}
                        ], "count": 2, "estefforts": 19, "estefforts_min": 9, "estefforts_max": 10}
                    ], "count": 2, "estefforts": 19, "estefforts_min": 9, "estefforts_m ax": 10}
                ]},
                {"_id": "Sales", "count": 3, "estefforts": 14, "estefforts_min": 2, "estefforts_max": 8, "businessfunctionid": {"_id": "Sales", "businessfunction": "Sales"}, "children": [
                    {"_id": "InProgress", "status": "InProgress", "children": [
                        {"_id": "High", "priorityid": {"_id": "High", "priority": "High"}, "children": [
                            {"_id": "t ask04", "task": "task04", "estefforts": 4, "status": "InProgress"}
                        ], "count": 1, "estefforts": 4, "estefforts_min": 4, "estefforts_max": 4}
                    ], "count": 1, "estefforts": 4, "estefforts_min": 4, "estefforts_max": 4},
                    {"_id": "New", "status": "New", "children": [
                        {"_id": "Medium", "priorityid": {"_id": "Medium", "priority": "Medium"}, "ch ildren": [
                            {"_id": "task08", "task": "task08", "estefforts": 8, "status": "New"}
                        ], "count": 1, "estefforts": 8, "estefforts_min": 8, "estefforts_max": 8},
                        {"_id": "High", "priorityid": {"_id": "High", "priority": "High"}, "children": [
                            {"_id": "task02", "task": "task02", "estefforts": 2, "status": "New"}
                        ], "count": 1, "estefforts": 2, "e stefforts_min": 2, "estefforts_max": 2}
                    ], "count": 2, "estefforts": 10, "estefforts_min": 2, "estefforts_max": 8}
                ]}
            ]};

        })

        it("group by on n Fk column more than one with having and sort and aggregates and data and array with avg", function (done) {

            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.TASK_TABLE, $insert: NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": "tasks",
                        "$fields": {"task": 1, "estefforts": 1, "status": 1},
                        "$sort": {"task": 1},
                        "$group": {
                            _id: [
                                {businessfunctionid: "$businessfunctionid._id"},
                                { status: "$status"} ,
                                { priorityid: "$priorityid._id"}
                            ],
                            count: {$sum: 1},
                            estefforts: {$sum: "$estefforts"},
                            estefforts_avg: {$avg: "$estefforts"},
                            businessfunctionid: {$first: "$businessfunctionid"},
                            status: {$first: "$status"},
                            priorityid: {$first: "$priorityid"},
                            "$sort": {"businessfunctionid": 1, "status": 1},
                            "$filter": {"estefforts": {"$lt": 20}}
                        }
                    }
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].estefforts_avg).to.eql(9.5);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0]._id).to.eql("Completed");
                    expect(data.result[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].estefforts).to.eql(19);
                    expect(data.result[0].children[0].estefforts_avg).to.eql(9.5);
                    expect(data.result[0].children[0].count).to.eql(2);
                    expect(data.result[0].children[0].children[0]._id).to.eql("High");
                    expect(data.result[0].children[0].children[0].priorityid.priority).to.eql("High");
                    expect(data.result[0].children[0].children[0].children).have.length(2);
                    expect(data.result[0].children[0].children[0].children[0]._id).to.eql("task09");
                    expect(data.result[0].children[0].children[0].children[0].task).to.eql("task09");
                    expect(data.result[0].children[0].children[0].children[0].estefforts).to.eql(9);
                    expect(data.result[0].children[0].children[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children[0].estefforts).to.eql(19);
                    expect(data.result[0].children[0].children[0].estefforts_avg).to.eql(9.5);
                    expect(data.result[0].children[0].children[0].count).to.eql(2);

                    expect(data.result[1]._id).to.eql("Sales");
                    expect(data.result[1].count).to.eql(3);
                    expect(data.result[1].estefforts).to.eql(14);
                    expect(data.result[1].estefforts_avg).to.eql(4.5);
                    expect(data.result[1].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[1].children).to.have.length(2);
                    expect(data.result[1].children[0]._id).to.eql("InProgress");
                    expect(data.result[1].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children).to.have.length(1);
                    expect(data.result[1].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].estefforts_avg).to.eql(4);
                    expect(data.result[1].children[0].count).to.eql(1);
                    expect(data.result[1].children[0].children[0]._id).to.eql("High");
                    expect(data.result[1].children[0].children[0].priorityid.priority).to.eql("High");
                    expect(data.result[1].children[0].children[0].children).have.length(1);
                    expect(data.result[1].children[0].children[0].children[0]._id).to.eql("task04");
                    expect(data.result[1].children[0].children[0].children[0].task).to.eql("task04");
                    expect(data.result[1].children[0].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].count).to.eql(1);

                    expect(data.result[1].children[1]._id).to.eql("New");
                    expect(data.result[1].children[1].status).to.eql("New");
                    expect(data.result[1].children[1].children).to.have.length(2);
                    expect(data.result[1].children[1].estefforts).to.eql(10);
                    expect(data.result[1].children[1].estefforts_avg).to.eql(5);
                    expect(data.result[1].children[1].count).to.eql(2);
                    expect(data.result[1].children[1].children[0]._id).to.eql("Medium");
                    expect(data.result[1].children[1].children[0].priorityid.priority).to.eql("Medium");
                    expect(data.result[1].children[1].children[0].children).have.length(1);
                    expect(data.result[1].children[1].children[0].children[0]._id).to.eql("task08");
                    expect(data.result[1].children[1].children[0].children[0].task).to.eql("task08");
                    expect(data.result[1].children[1].children[0].children[0].estefforts).to.eql(8);
                    expect(data.result[1].children[1].children[0].children[0].status).to.eql("New");
                    expect(data.result[1].children[1].children[0].estefforts).to.eql(8);
                    expect(data.result[1].children[1].children[0].estefforts_avg).to.eql(8);
                    expect(data.result[1].children[1].children[0].count).to.eql(1);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            var mongoPipeLine = [
                {"$group": {"_id": {"businessfunctionid": "$businessfunctionid._id", "status": "$status", "priorityid": "$priorityid._id"}, "count": {"$sum": 1}, "estefforts": {"$sum": "$estefforts"}, "estefforts_avg": {"$avg": "$estefforts"}, "businessfunctionid": {"$first": "$businessfunctionid"}, "status": {"$first": "$status"}, "priorityid": {"$first": "$priorityid"}, "children": {"$push": {"_id": "$_id", "task": "$task", "estefforts": "$estefforts", "status": "$status"}}}},
                {"$match": {"estefforts": {"$lt": 20}}},
                {"$sort": {"businessfunctionid": 1, "status": 1}},
                {"$group": {"_id": {"business functionid": "$_id.businessfunctionid", "status": "$_id.status"}, "count": {"$sum": "$count"}, "estefforts": {"$sum": "$estefforts"}, "estefforts_avg": {"$avg": "$estefforts_avg"}, "businessfunctionid": {"$first": "$businessfunctionid"}, "status": {"$first": "$status"}, "chi ldren": {"$push": {"_id": "$_id.priorityid", "priorityid": "$priorityid", "children": "$children", "count": "$count", "estefforts": "$estefforts", "estefforts_min": "$estefforts_min", "estefforts_max": "$estefforts_max"}}}},
                {"$match": {"estefforts": {"$lt": 20}}},
                {"$sort": {"businessfunctionid": 1, "status": 1}},
                {"$group ": {"_id": "$_id.businessfunctionid", "count": {"$sum": "$count"}, "estefforts": {"$sum": "$estefforts"}, "estefforts_avg": {"$avg": "$estefforts_avg"}, "businessfunctionid": {"$first": "$businessfunctionid"}, "children": {"$push": {"_id": "$_id.status", "status": "$status", " children": "$children", "count": "$count", "estefforts": "$estefforts", "estefforts_min": "$estefforts_min", "estefforts_max": "$estefforts_max"}}}},
                {"$match": {"estefforts": {"$lt": 20}}},
                {"$sort": {"businessfunctionid": 1, "status": 1}},
                {"$sort": {"task": 1}}
            ]

            var expectedResult = {"result": [
                {"_id": "Accounts", "count": 2, "estefforts": 19, "estefforts_avg": 9.5, "businessfunctionid": {"_id": "Accounts", "businessfunction": "Accounts"}, "children": [
                    {"_id": "Completed", "status": "Completed", "children": [
                        {"_id": "High", "priorityid": {"_id": "High", "priority": "High"}, "children": [
                            {" _id": "task09", "task": "task09", "estefforts": 9, "status": "Completed"},
                            {"_id": "task10", "task": "task10", "estefforts": 10, "status": "Completed"}
                        ], "count": 2, "estefforts": 19, "estefforts_avg": 9.5}
                    ], "count": 2, "estefforts": 19, "estefforts_avg": 9.5}
                ]},
                {"_id": "Sales", "count": 3, "estefforts": 14, "estefforts_avg": 4.5, " businessfunctionid": {"_id": "Sales", "businessfunction": "Sales"}, "children": [
                    {"_id": "InProgress", "status": "InProgress", "children": [
                        {"_id": "High", "priorityid": {"_id": "High", "priority": "High"}, "children": [
                            {"_id": "task04", "task": "task04", "estefforts": 4, "status": "InProgress"}
                        ], "count": 1, "estefforts": 4, "es tefforts_avg": 4}
                    ], "count": 1, "estefforts": 4, "estefforts_avg": 4},
                    {"_id": "New", "status": "New", "children": [
                        {"_id": "Medium", "priorityid": {"_id": "Medium", "priority": "Medium"}, "children": [
                            {"_id": "task08", "task": "task08", "estefforts": 8, "status": "New"}
                        ], "count": 1, "estefforts": 8, "estefforts_avg": 8},
                        {"_id": "Hi gh", "priorityid": {"_id": "High", "priority": "High"}, "children": [
                            {"_id": "task02", "task": "task02", "estefforts": 2, "status": "New"}
                        ], "count": 1, "estefforts": 2, "estefforts_avg": 2}
                    ], "count": 2, "estefforts": 10, "estefforts_avg": 5}
                ]}
            ], "dataInfo": {}};

        })

        it("group by on n Fk column more than one with having and sort and aggregates and data and array without _id", function (done) {

            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.TASK_TABLE, $insert: NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": NorthwindDb.TASK_TABLE,
                        "$fields": {"task": 1, "estefforts": 1, "status": 1},
                        "$sort": {"task": 1},
                        "$group": {
                            "_id": [
                                {"businessfunctionid": "$businessfunctionid"},
                                {"status": "$status"},
                                {"priorityid": "$priorityid"}
                            ],
                            "count": {"$sum": 1},
                            "estefforts": {"$sum": "$estefforts"},
                            "businessfunctionid": {"$first": "$businessfunctionid"},
                            "status": {"$first": "$status"},
                            "priorityid": {"$first": "$priorityid"},
                            "$sort": {"businessfunctionid": 1, "status": 1},
                            "$filter": {"estefforts": {"$lt": 20}}
                        }
                    }
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data >>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[0].children).to.have.length(1);
                    expect(data.result[0].children[0]._id).to.eql("Completed");
                    expect(data.result[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children).to.have.length(1);
                    expect(data.result[0].children[0].estefforts).to.eql(19);
                    expect(data.result[0].children[0].count).to.eql(2);
                    expect(data.result[0].children[0].children[0]._id).to.eql("High");
                    expect(data.result[0].children[0].children[0].priorityid.priority).to.eql("High");
                    expect(data.result[0].children[0].children[0].children).have.length(2);
                    expect(data.result[0].children[0].children[0].children[0]._id).to.eql("task09");
                    expect(data.result[0].children[0].children[0].children[0].task).to.eql("task09");
                    expect(data.result[0].children[0].children[0].children[0].estefforts).to.eql(9);
                    expect(data.result[0].children[0].children[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[0].children[0].estefforts).to.eql(19);
                    expect(data.result[0].children[0].children[0].count).to.eql(2);

                    expect(data.result[1]._id).to.eql("Sales");
                    expect(data.result[1].count).to.eql(3);
                    expect(data.result[1].estefforts).to.eql(14);
                    expect(data.result[1].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[1].children).to.have.length(2);
                    expect(data.result[1].children[0]._id).to.eql("InProgress");
                    expect(data.result[1].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children).to.have.length(1);
                    expect(data.result[1].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].count).to.eql(1);
                    expect(data.result[1].children[0].children[0]._id).to.eql("High");
                    expect(data.result[1].children[0].children[0].priorityid.priority).to.eql("High");
                    expect(data.result[1].children[0].children[0].children).have.length(1);
                    expect(data.result[1].children[0].children[0].children[0]._id).to.eql("task04");
                    expect(data.result[1].children[0].children[0].children[0].task).to.eql("task04");
                    expect(data.result[1].children[0].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[0].children[0].estefforts).to.eql(4);
                    expect(data.result[1].children[0].children[0].count).to.eql(1);

                    expect(data.result[1].children[1]._id).to.eql("New");
                    expect(data.result[1].children[1].status).to.eql("New");
                    expect(data.result[1].children[1].children).to.have.length(2);
                    expect(data.result[1].children[1].estefforts).to.eql(10);
                    expect(data.result[1].children[1].count).to.eql(2);
                    expect(data.result[1].children[1].children[0]._id).to.eql("Medium");
                    expect(data.result[1].children[1].children[0].priorityid.priority).to.eql("Medium");
                    expect(data.result[1].children[1].children[0].children).have.length(1);
                    expect(data.result[1].children[1].children[0].children[0]._id).to.eql("task08");
                    expect(data.result[1].children[1].children[0].children[0].task).to.eql("task08");
                    expect(data.result[1].children[1].children[0].children[0].estefforts).to.eql(8);
                    expect(data.result[1].children[1].children[0].children[0].status).to.eql("New");
                    expect(data.result[1].children[1].children[0].estefforts).to.eql(8);
                    expect(data.result[1].children[1].children[0].count).to.eql(1);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            // /step

            var query1 = {
                $collection: "tasks",
                $group: [
                    {
                        _id: {businessfunctionid: "$businessfunctionid._id", status: "$status", priorityid: "$priorityid._id"},
                        count: {$sum: 1},
                        estefforts: {$sum: "$estefforts"},
                        businessfunctionid: {$first: "$businessfunctionid"},
                        status: {$first: "$status"},
                        priorityid: {$first: "$priorityid"},
                        children: {$push: {task: "$task", status: "$status", estefforts: "$estefforts"}},
                        $filter: {estefforts: {$lt: 20}},
                        $sort: {businessfunctionid: 1, status: 1}
                    },
                    {
                        _id: {businessfunctionid: "$_id.businessfunctionid", status: "$_id.status"},
                        count: {$sum: "$count"},
                        estefforts: {$sum: "$estefforts"},
                        businessfunctionid: {$first: "$businessfunctionid"},
                        status: {$first: "$status"},
                        children: {$push: {_id: "$_id.priorityid", priorityid: "$priorityid", count: "$count", estefforts: "$estefforts", children: "$children"}},
                        $filter: {estefforts: {$lt: 20}},
                        $sort: {businessfunctionid: 1, status: 1}
                    },
                    {
                        _id: "$_id.businessfunctionid",
                        count: {$sum: "$count"},
                        estefforts: {$sum: "$estefforts"},
                        businessfunctionid: {$first: "$businessfunctionid"},
                        children: {$push: {_id: "$_id.status", status: "$status", count: "$count", estefforts: "$estefforts", children: "$children"}},
                        $filter: {estefforts: {$lt: 20}},
                        $sort: {businessfunctionid: 1, status: 1}
                    }
                ]};

            var mongoPipeLine = [
                {"$group": {
                    "_id": {"businessfunctionid": "$businessfunctionid._id", "status": "$status", "priorityid": "$priorityid"},
                    "count": {"$sum": 1},
                    "estefforts": {"$sum": "$estefforts"},
                    "businessfunctionid": {"$first": "$businessfunctionid"},
                    "status": {"$first": "$status"},
                    "priorityid": {"$first": "$priorityid"},
                    "children": {"$push": {"_id": "$_id", "task": "$task", "estefforts": "$estefforts", "status": "$status"}}
                }},
                {"$match": {"estefforts": {"$lt": 20}}},
                {"$sort": {"businessfunctionid": 1}},
                {"$group": {
                    "_id": {"businessfunctionid": "$_id.businessfunctionid", "status": "$_id.status"},
                    "count": {"$sum": "$count"},
                    "estefforts": {"$sum": "$estefforts"},
                    "businessfunctionid": {"$first": "$businessfunctionid"},
                    "status": {"$first": "$status"},
                    "children": {"$push": {"_id": "$_id.priorityid", "priorityid": "$priorityid", "children": "$children", "count": "$count", "estefforts": "$estefforts"}}
                }},
                {"$match": {"estefforts": {"$lt": 20}}},
                {"$sort ": {"businessfunctionid": 1, status: 1}},
                {"$group": {
                    "_id": "$_id.businessfunctionid",
                    "count": {"$sum": "$count"},
                    "estefforts": {"$sum": "$estefforts"},
                    "businessfunctionid": {"$first": "$businessfunctionid"},
                    "children": {"$push": {"_id": "$_id.status", "status": "$status", "children": "$children", "count": "$count", "estefforts": "$estefforts"}}
                }},
                {"$match": {"estefforts": {"$lt": 20}}},
                {"$sort": {"businessfunctionid": 1, status: 11}}
            ]


            var expectedResult = [
                {"_id": "Accounts", "count": 2, "estefforts": 19, "businessfunctionid": {"_id": "Accounts", "businessfunction": "Accounts"}, "children": [
                    {"_id": "Completed", "status": "Completed", "children": [
                        {"_id": "High", "priorityid": {"_id": "High", "priority": "High"}, "children": [
                            {"_id": "task09", "task": "task09", "estefforts": 9, "status": "Completed"},
                            {"_id": "task10", "task": "task10", "estefforts": 10, "status": "Completed"}
                        ], "count": 2, "estefforts": 19}
                    ], "count": 2, "estefforts": 19}
                ]},
                {"_id": "Sales", "count": 3, "estefforts": 14, "businessfunctionid": {"_id": "Sales", "businessfunction": "Sales"}, "children": [
                    {"_id": "InProgress", "status": "InProgress", "children": [
                        {"_id": "High", "priorityid": {"_id": "High", "priority": "High"}, "children": [
                            {"_id": "task04", "task": "task04", "estefforts": 4, "status": "InProgress"}
                        ], "count": 1, "estefforts": 4}
                    ], "count": 1, "estefforts": 4},
                    {"_id": "New", "status": "New", "children": [
                        {"_id": "Medium", "priorityid ": {"_id": "Medium", "priority": "Medium"}, "children": [
                            {"_id": "task08", "task": "task08", "estefforts": 8, "status": "New"}
                        ], "count": 1, "estefforts": 8},
                        {"_id": "High", "priorityid": {"_id": "High", "priority": "High"}, "children": [
                            {"_id": "task02", "task": "task02", "estefforts": 2, "status": "New"}
                        ], "count": 1, "estefforts": 2}
                    ], "count": 2, "estefforts": 10}
                ]}
            ]

        })

//  in tasks --> group by on businessfunction having sum(estefforts) < 20 and sort on sum(esteffort) : asc --> group by on status (group by on businessfunction and status simultaneously)

        it("group by on n fk column more than one with having and sort and aggregates and data without array ", function (done) {
            var db = undefined;
            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: NorthwindDb.TASK_TABLE, $insert: NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": "tasks",
                        "$fields": {"task": 1, "estefforts": 1, "status": 1},
                        "$group": {
                            "_id": {"businessfunctionid": "$businessfunctionid._id", "status": "$status"},
                            "count": {"$sum": 1},
                            "estefforts": {"$sum": "$estefforts"},
                            "businessfunctionid": {"$first": "$businessfunctionid"},
                            "status": {"$first": "$status"},
                            "$sort": {"businessfunctionid.businessfunction": 1, status: 1, task: 1},
                            "$filter": {"estefforts": {"$lt": 20}}
                        }
                    }
                    return db.query(query);
                }).then(
                function (data) {
                    console.log("data >>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(5);
                    expect(data.result[0]._id.businessfunctionid).to.eql("Accounts");
                    expect(data.result[0]._id.status).to.eql("Completed");
                    expect(data.result[0].count).to.eql(2);
                    expect(data.result[0].estefforts).to.eql(19);
                    expect(data.result[0].status).to.eql("Completed");
                    expect(data.result[0].businessfunctionid._id).to.eql("Accounts");
                    expect(data.result[0].businessfunctionid.businessfunction).to.eql("Accounts");
                    expect(data.result[0].children).to.have.length(2);
                    expect(data.result[0].children[0].task).to.eql("task09");
                    expect(data.result[0].children[0].estefforts).to.eql(9);
                    expect(data.result[0].children[0].status).to.eql("Completed");
                    expect(data.result[0].children[1].task).to.eql("task10");
                    expect(data.result[0].children[1].estefforts).to.eql(10);
                    expect(data.result[0].children[1].status).to.eql("Completed");

                    expect(data.result[1]._id.businessfunctionid).to.eql("Delivery");
                    expect(data.result[1]._id.status).to.eql("InProgress");
                    expect(data.result[1].count).to.eql(2);
                    expect(data.result[1].estefforts).to.eql(9);
                    expect(data.result[1].status).to.eql("InProgress");
                    expect(data.result[1].businessfunctionid._id).to.eql("Delivery");
                    expect(data.result[1].businessfunctionid.businessfunction).to.eql("Delivery");
                    expect(data.result[1].children).to.have.length(2);
                    expect(data.result[1].children[0].task).to.eql("task03");
                    expect(data.result[1].children[0].estefforts).to.eql(3);
                    expect(data.result[1].children[0].status).to.eql("InProgress");
                    expect(data.result[1].children[1].task).to.eql("task06");
                    expect(data.result[1].children[1].estefforts).to.eql(6);
                    expect(data.result[1].children[1].status).to.eql("InProgress");

                    expect(data.result[2]._id.businessfunctionid).to.eql("Delivery");
                    expect(data.result[2]._id.status).to.eql("New");
                    expect(data.result[2].count).to.eql(3);
                    expect(data.result[2].estefforts).to.eql(13);
                    expect(data.result[2].status).to.eql("New");
                    expect(data.result[2].businessfunctionid._id).to.eql("Delivery");
                    expect(data.result[2].businessfunctionid.businessfunction).to.eql("Delivery");
                    expect(data.result[2].children).to.have.length(3);
                    expect(data.result[2].children[0].task).to.eql("task01");
                    expect(data.result[2].children[0].estefforts).to.eql(1);
                    expect(data.result[2].children[0].status).to.eql("New");
                    expect(data.result[2].children[1].task).to.eql("task05");
                    expect(data.result[2].children[1].estefforts).to.eql(5);
                    expect(data.result[2].children[1].status).to.eql("New");
                    expect(data.result[2].children[2].task).to.eql("task07");
                    expect(data.result[2].children[2].estefforts).to.eql(7);
                    expect(data.result[2].children[2].status).to.eql("New");

                    expect(data.result[3]._id.businessfunctionid).to.eql("Sales");
                    expect(data.result[3]._id.status).to.eql("InProgress");
                    expect(data.result[3].count).to.eql(1);
                    expect(data.result[3].estefforts).to.eql(4);
                    expect(data.result[3].status).to.eql("InProgress");
                    expect(data.result[3].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[3].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[3].children).to.have.length(1);
                    expect(data.result[3].children[0].task).to.eql("task04");
                    expect(data.result[3].children[0].estefforts).to.eql(4);
                    expect(data.result[3].children[0].status).to.eql("InProgress");

                    expect(data.result[4]._id.businessfunctionid).to.eql("Sales");
                    expect(data.result[4]._id.status).to.eql("New");
                    expect(data.result[4].count).to.eql(2);
                    expect(data.result[4].estefforts).to.eql(10);
                    expect(data.result[4].status).to.eql("New");
                    expect(data.result[4].businessfunctionid._id).to.eql("Sales");
                    expect(data.result[4].businessfunctionid.businessfunction).to.eql("Sales");
                    expect(data.result[4].children).to.have.length(2);
                    expect(data.result[4].children[0].task).to.eql("task02");
                    expect(data.result[4].children[0].estefforts).to.eql(2);
                    expect(data.result[4].children[0].status).to.eql("New");
                    expect(data.result[4].children[1].task).to.eql("task08");
                    expect(data.result[4].children[1].estefforts).to.eql(8);
                    expect(data.result[4].children[1].status).to.eql("New");

                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            var mongoPipeLine = [
                {$group: {
                    _id: {businessfunctionid: "$businessfunctionid._id", status: "$status"},
                    count: {$sum: 1},
                    estefforts: {$sum: "$estefforts"},
                    businessfunctionid: {$first: "$businessfunctionid"},
                    status: {$first: "$status"},
                    children: {$push: {task: "$task", status: "$status", estefforts: "$estefforts"}}}},
                {$match: {estefforts: {$lt: 20}}},
                {$sort: {"businessfunctionid.businessfunction": 1}}
            ]

            var result = {"result": [
                {"_id": {"businessfunctionid": "Accounts", "status": "Completed"}, "count": 2, "estefforts": 19, "businessfunctionid": {"_id": "Accounts", "businessfunction": "Accounts"}, "status": "Completed", "children": [
                    {"_id": "task09", "task": "task09", "estefforts": 9, "status": "Completed"},
                    {"_id": "task10 ", "task": "task10", "estefforts": 10, "status": "Completed"}
                ]},
                {"_id": {"businessfunctionid": "Delivery", "status": "InProgress"}, "count": 2, "estefforts": 9, "businessfunctionid": {"_id": "Delivery", "businessfunction": "Delivery"}, "status": "InProgress", "children": [
                    {"_id": "task03", "task": "task03", "estefforts": 3, "status": "InProgress"},
                    {"_id": "task06", "task": "task06", "estefforts": 6, "status": "InProgress"}
                ]},
                {"_id": {"businessfunctionid": "Delivery", "status": "New"}, "count": 3, "estefforts": 13, "businessfunctionid": {"_id": "Delivery", "businessfunction": "Delivery"}, "status": "New", "children": [
                    {"_id": "task01", "task": "task01", "estefforts": 1, "status": "New"},
                    {"_id": "task05", "task": "task05", "estefforts": 5, "status": "New"},
                    {"_id": "task07", "task": "task07", "estefforts": 7, "status": "New"}
                ]},
                {"_id": {"businessfunctionid": "Sales", "status": "New"}, "count": 2, "estefforts": 10, "businessfunctionid": {"_id": "Sales", "businessfunction": "Sales"}, "status": "New", "children": [
                    {"_id": "task02", "task": "task02", "estefforts": 2, "status": "New"},
                    {"_id": "task08", "task": "task08", "estefforts": 8, "status": "New"}
                ]},
                {"_id": {"businessfunctionid": "Sales", "status": "InProgress"}, "count": 1, "estefforts": 4, "businessfunctionid": {"_id": "Sales", "businessfunction ": "Sales"}, "status": "InProgress", "children": [
                    {"_id": "task04", "task": "task04", "estefforts": 4, "status": "InProgress"}
                ]}
            ]}

        })

        it("group by on date column", function (done) {
            var db = undefined;
            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: "sales", $insert: [
                            { "_id": 1, "item": "abc", "price": 10, "quantity": 2, "date": new Date("2014-01-01T08:15:39.736Z") },
                            { "_id": 2, "item": "A", "price": 100, "quantity": 3, "date": new Date("2014-02-03T08:15:39.736Z") },
                            { "_id": 3, "item": "B", "price": 50, "quantity": 5, "date": new Date("2014-10-05T08:15:39.736Z") },
                            { "_id": 4, "item": "C", "price": 40, "quantity": 7, "date": new Date("2013-04-01T08:15:39.736Z") },
                            { "_id": 5, "item": "D", "price": 50, "quantity": 1, "date": new Date("2012-02-01T08:15:39.736Z") },
                            { "_id": 6, "item": "E", "price": 30, "quantity": 4, "date": new Date("2012-01-05T08:15:39.736Z") },
                            { "_id": 7, "item": "F", "price": 100, "date": new Date("2014-12-10T08:25:39.736Z") },
                            { "_id": 8, "item": "G", "price": 500, quantity: 20, "date": new Date("2014-12-15T08:25:39.736Z") }
                        ]}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": "sales",
                        "$group": {
                            _id: {"group_date": {"year": { $year: "$date"}, "month": { $month: "$date"}}},
                            totalQuantity: {$sum: "$quantity"},
                            totalPrice: {"$sum": "$price"},
                            count: {"$sum": 1},
                            $sort: {totalPrice: 1}
                        },
                        "$sort": {"item": 1}
                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(7);
                    expect(data.result[0]._id.group_date.year).to.equal(2014);
                    expect(data.result[0]._id.group_date.month).to.equal(1);
                    expect(data.result[0].totalQuantity).to.equal(2);
                    expect(data.result[0].totalPrice).to.equal(10);
                    expect(data.result[0].count).to.equal(1);

                    expect(data.result[1]._id.group_date.year).to.equal(2012);
                    expect(data.result[1]._id.group_date.month).to.equal(1);
                    expect(data.result[1].totalQuantity).to.equal(4);
                    expect(data.result[1].totalPrice).to.equal(30);
                    expect(data.result[1].count).to.equal(1);

                    expect(data.result[2]._id.group_date.year).to.equal(2013);
                    expect(data.result[2]._id.group_date.month).to.equal(4);
                    expect(data.result[2].totalQuantity).to.equal(7);
                    expect(data.result[2].totalPrice).to.equal(40);
                    expect(data.result[2].count).to.equal(1);

                    expect(data.result[3]._id.group_date.year).to.equal(2012);
                    expect(data.result[3]._id.group_date.month).to.equal(2);
                    expect(data.result[3].totalQuantity).to.equal(1);
                    expect(data.result[3].totalPrice).to.equal(50);
                    expect(data.result[3].count).to.equal(1);

                    expect(data.result[4]._id.group_date.year).to.equal(2014);
                    expect(data.result[4]._id.group_date.month).to.equal(10);
                    expect(data.result[4].totalQuantity).to.equal(5);
                    expect(data.result[4].totalPrice).to.equal(50);
                    expect(data.result[4].count).to.equal(1);

                    expect(data.result[5]._id.group_date.year).to.equal(2014);
                    expect(data.result[5]._id.group_date.month).to.equal(2);
                    expect(data.result[5].totalQuantity).to.equal(3);
                    expect(data.result[5].totalPrice).to.equal(100);
                    expect(data.result[5].count).to.equal(1);

                    expect(data.result[6]._id.group_date.year).to.equal(2014);
                    expect(data.result[6]._id.group_date.month).to.equal(12);
                    expect(data.result[6].totalQuantity).to.equal(20);
                    expect(data.result[6].totalPrice).to.equal(600);
                    expect(data.result[6].count).to.equal(2);


                    //Also can use

                    /**
                     * db.sales.aggregate(
                     [
                     {
                     $project:
                     {
                     year: { $year: "$date" },
                     month: { $month: "$date" },
                     day: { $dayOfMonth: "$date" },
                     hour: { $hour: "$date" },
                     minutes: { $minute: "$date" },
                     seconds: { $second: "$date" },
                     milliseconds: { $millisecond: "$date" },
                     dayOfYear: { $dayOfYear: "$date" },
                     dayOfWeek: { $dayOfWeek: "$date" },
                     week: { $week: "$date" },
                     quantity:1,
                     price:1
                     }
                     },
                     {
                     $group:
                     {
                     _id:{year:"$year","month":"$month"},
                     totalQuantity:{$sum:"$quantity"},
                     totalPrice:{"$sum":"$price"},
                     count:{"$sum":1}
                     }
                     }
                     ]
                     )
                     */

                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })


        });

        it("group by on date column concat in group", function (done) {
            var db = undefined;
            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return db.mongoUpdate([
                        {$collection: "sales", $insert: [
                            { "_id": 1, "item": "abc", "price": 10, "quantity": 2, "date": new Date("2014-01-01T08:15:39.736Z") },
                            { "_id": 2, "item": "A", "price": 100, "quantity": 3, "date": new Date("2014-02-03T08:15:39.736Z") },
                            { "_id": 3, "item": "B", "price": 50, "quantity": 5, "date": new Date("2014-10-05T08:15:39.736Z") },
                            { "_id": 4, "item": "C", "price": 40, "quantity": 7, "date": new Date("2013-04-01T08:15:39.736Z") },
                            { "_id": 5, "item": "D", "price": 50, "quantity": 1, "date": new Date("2012-02-01T08:15:39.736Z") },
                            { "_id": 6, "item": "E", "price": 30, "quantity": 4, "date": new Date("2012-01-05T08:15:39.736Z") },
                            { "_id": 7, "item": "F", "price": 100, "date": new Date("2014-12-10T08:25:39.736Z") },
                            { "_id": 8, "item": "G", "price": 500, quantity: 20, "date": new Date("2014-12-15T08:25:39.736Z") }
                        ]}
                    ])
                }).then(
                function () {
                    var query = {
                        "$collection": "sales",
                        "$group": {
                            _id: {$concat: [
                                {$substr: ["$date", 0, 4]},
                                "__",
                                {$substr: ["$date", 5, 2]}
                            ]},
                            totalQuantity: {$sum: "$quantity"},
                            totalPrice: {"$sum": "$price"},
                            count: {"$sum": 1},
                            $sort: {totalPrice: 1}
                        },
                        "$sort": {"item": 1}
                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(7);
                    expect(data.result[0]._id).to.equal("2014__01");
                    expect(data.result[0].totalQuantity).to.equal(2);
                    expect(data.result[0].totalPrice).to.equal(10);
                    expect(data.result[0].count).to.equal(1);

                    expect(data.result[1]._id).to.equal("2012__01");
                    expect(data.result[1].totalQuantity).to.equal(4);
                    expect(data.result[1].totalPrice).to.equal(30);
                    expect(data.result[1].count).to.equal(1);

                    expect(data.result[2]._id).to.equal("2013__04");
                    expect(data.result[2].totalQuantity).to.equal(7);
                    expect(data.result[2].totalPrice).to.equal(40);
                    expect(data.result[2].count).to.equal(1);

                    expect(data.result[3]._id).to.equal("2012__02");
                    expect(data.result[3].totalQuantity).to.equal(1);
                    expect(data.result[3].totalPrice).to.equal(50);
                    expect(data.result[3].count).to.equal(1);

                    expect(data.result[4]._id).to.equal("2014__10");
                    expect(data.result[4].totalQuantity).to.equal(5);
                    expect(data.result[4].totalPrice).to.equal(50);
                    expect(data.result[4].count).to.equal(1);

                    expect(data.result[5]._id).to.equal("2014__02");
                    expect(data.result[5].totalQuantity).to.equal(3);
                    expect(data.result[5].totalPrice).to.equal(100);
                    expect(data.result[5].count).to.equal(1);

                    expect(data.result[6]._id).to.equal("2014__12");
                    expect(data.result[6].totalQuantity).to.equal(20);
                    expect(data.result[6].totalPrice).to.equal(600);
                    expect(data.result[6].count).to.equal(2);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        });

        it("navigation in group", function (done) {
            var db = undefined;
            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var collectionDefinition = [
                        {$collection: "pl.collections", $insert: [
                            {collection: "activities"},
                            {collection: "location"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "location"}}, visibility: true} ,

                            {field: "name", type: "string", index: 1, collectionid: {$query: {collection: "activities"}}},
                            {field: "amount", type: "currency", index: 2, collectionid: {$query: {collection: "activities"}}, ui: "currency", aggregate: "sum", aggregatable: true},
                            {field: "location_id", label: "Location", type: "fk", collectionid: {$query: {collection: "activities"}}, "displayField": "name", collection: "location", set: ["name"]}

                        ]}
                    ];
                    return db.update(collectionDefinition);
                }).then(
                function () {
                    return db.update({$collection: "pl.currencies", $insert: [
                        {type: "INR"}
                    ]});
                }).then(
                function () {
                    return db.update({$collection: "location", $insert: [
                        {"name": "Hisar"},
                        {"name": "Sec33"},
                        {"name": "Silokhera"},
                        {"name": "Gurgaon"},
                        {"name": "Dlf"}
                    ]});
                }).then(
                function () {
                    return db.update({$collection: "activities", $insert: [
                        {"amount": {"amount": 1000, type: {$query: {currency: "INR"}}}, "name": "Activity1", "location_id": {$query: {"name": "Hisar"}}},
                        {"amount": {"amount": 2000, type: {$query: {currency: "INR"}}}, "name": "Activity2", "location_id": {$query: {"name": "Sec33"}}},
                        {"amount": {"amount": 3000, type: {$query: {currency: "INR"}}}, "name": "Activity3", "location_id": {$query: {"name": "Gurgaon"}}},
                        {"amount": {"amount": 4000, type: {$query: {currency: "INR"}}}, "name": "Activity4", "location_id": {$query: {"name": "Dlf"}}},
                        {"amount": {"amount": 5000, type: {$query: {currency: "INR"}}}, "name": "Activity5", "location_id": {$query: {"name": "Hisar"}}},
                        {"amount": {"amount": 6000, type: {$query: {currency: "INR"}}}, "name": "Activity6", "location_id": {$query: {"name": "Hisar"}}},
                        {"amount": {"amount": 7000, type: {$query: {currency: "INR"}}}, "name": "Activity7", "location_id": {$query: {"name": "Silokhera"}}},
                        {"amount": {"amount": 8000, type: {$query: {currency: "INR"}}}, "name": "Activity8", "location_id": {$query: {"name": "Dlf"}}},
                        {"amount": {"amount": 9000, type: {$query: {currency: "INR"}}}, "name": "Activity9", "location_id": {$query: {"name": "Silokhera"}}}
                    ]});
                }).then(
                function () {
                    var query = {"$collection": "activities", "$group": {"_id": "$location_id", location: {$first: "$location_id"}, "amount": {"$sum": "$amount"}, "$sort": {"location.name": 1}}, $limit: 2}
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].location.name).to.eql("Dlf");
                    expect(data.result[1].location.name).to.eql("Gurgaon");
                    expect(data.dataInfo.hasNext).to.eql(true);
                    var query = {"$collection": "activities", "$group": {"_id": "$location_id", location: {$first: "$location_id"}, "amount": {"$sum": "$amount"}, "$sort": {"location.name": 1}}, $skip: 2, $limit: 2}
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(2);
                    expect(data.result[0].location.name).to.eql("Hisar");
                    expect(data.result[1].location.name).to.eql("Sec33");
                    expect(data.dataInfo.hasNext).to.eql(true);
                    var query = {"$collection": "activities", "$group": {"_id": "$location_id", location: {$first: "$location_id"}, "amount": {"$sum": "$amount"}, "$sort": {"location.name": 1}}, $skip: 4, $limit: 2}
                    return db.query(query);
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].location.name).to.eql("Silokhera");
                    expect(data.dataInfo.hasNext).to.eql(false);
                }).then(
                function () {
                    done();
                }).fail(function (err) {
                    done(err);
                })
        })

        it("average in group with view.getView", function (done) {
            var db = undefined;
            ApplaneDB.connect(config.URL, config.DB, config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var collectionDefinition = [
                        {$collection: "pl.collections", $insert: [
                            {collection: "orders__"},
                            {collection: "locations__"},
                            {collection: "business_unit__"}
                        ]},
                        {$collection: "pl.fields", $insert: [
                            {field: "name", type: "string", collectionid: {$query: {collection: "business_unit__"}}, visibility: true},
                            {field: "location", type: "string", collectionid: {$query: {collection: "locations__"}}, visibility: true} ,
                            {field: "name", type: "string", index: 1, collectionid: {$query: {collection: "orders__"}}, visibility: true},
                            {field: "amount", type: "currency", index: 2, collectionid: {$query: {collection: "orders__"}}, ui: "currency", visibility: true, aggregate: "avg", aggregatable: true},
                            {field: "location_id", label: "Location", type: "fk", collectionid: {$query: {collection: "orders__"}}, collection: "locations__", displayField: "location", set: ["location"], visibility: true},
                            {field: "profit_center_id", label: "Unit", type: "fk", collectionid: {$query: {collection: "orders__"}}, collection: "business_unit__", displayField: "name", set: ["name"], visibility: true}
                        ]},
                        {$collection: "pl.qviews", $insert: [
                            {label: "Orders", id: "orders", collection: {$query: {collection: "orders__"}}, mainCollection: {$query: {collection: "orders__"}}, sort: JSON.stringify({_id: -1}), group: JSON.stringify(["profit_center_id", "location_id"])}
                        ]}
                    ];
                    return db.update(collectionDefinition);
                }).then(
                function () {
                    return db.update({$collection: "pl.currencies", $insert: [
                        {type: "INR"}
                    ]});
                }).then(
                function () {
                    return db.update({$collection: "business_unit__", $insert: [
                        {"name": "Applane"},
                        {"name": "Daffodil"},
                        {"name": "Daffodil Hisar"}
                    ]});
                }).then(
                function () {
                    return db.update({$collection: "locations__", $insert: [
                        {"name": "Gurgaon"},
                        {"name": "Hisar"}
                    ]});
                }).then(
                function () {
                    return db.update({$collection: "orders__", $insert: [
                        {"amount": {"amount": 1000, type: {$query: {currency: "INR"}}}, "name": "Activity1", "location_id": {$query: {"name": "Hisar"}}, "profit_center_id": {$query: {"name": "Applane"}}},
                        {"amount": {"amount": 3000, type: {$query: {currency: "INR"}}}, "name": "Activity3", "location_id": {$query: {"name": "Gurgaon"}}, "profit_center_id": {$query: {"name": "Applane"}}},
                        {"amount": {"amount": 3000, type: {$query: {currency: "INR"}}}, "name": "Activity3", "location_id": {$query: {"name": "Hisar"}}, "profit_center_id": {$query: {"name": "Applane"}}},
                        {"amount": {"amount": 2000, type: {$query: {currency: "INR"}}}, "name": "Activity2", "location_id": {$query: {"name": "Hisar"}}, "profit_center_id": {$query: {"name": "Daffodil"}}},
                        {"amount": {"amount": 4000, type: {$query: {currency: "INR"}}}, "name": "Activity2", "location_id": {$query: {"name": "Gurgaon"}}, "profit_center_id": {$query: {"name": "Daffodil Hisar"}}},
                        {"amount": {"amount": 3000, type: {$query: {currency: "INR"}}}, "name": "Activity3", "location_id": {$query: {"name": "Hisar"}}, "profit_center_id": {$query: {"name": "Daffodil Hisar"}}},
                        {"name": "Activity3", "location_id": {$query: {"name": "Gurgaon"}}, "profit_center_id": {$query: {"name": "Daffodil Hisar"}}}
                    ]});
                }).then(
                function () {
                    return db.invokeFunction("view.getView", [
                        {id: "orders"}
                    ]);
                }).then(
                function (viewResult) {
                    var result = viewResult.data.result;

                    expect(result).to.have.length(3);
                    expect(result[0].profit_center_id.name).to.eql("Daffodil Hisar");
                    expect(result[0].amount.amount).to.eql(3500);
                    expect(result[0].children).to.have.length(2);
                    expect(result[0].children[0].amount.amount).to.eql(4000);
                    expect(result[0].children[0].children).to.have.length(2);
                    expect(result[0].children[0].children[0].name).to.eql("Activity3");
                    expect(result[0].children[0].children[1].name).to.eql("Activity2");
                    expect(result[0].children[0].children[1].amount.amount).to.eql(4000);
                    expect(result[0].children[1].amount.amount).to.eql(3000);
                    expect(result[0].children[1].children).to.have.length(1);
                    expect(result[0].children[1].children[0].name).to.eql("Activity3");

                    expect(result[1].profit_center_id.name).to.eql("Applane");
                    expect(result[1].amount.amount).to.eql(2500);
                    expect(result[1].children).to.have.length(2);
                    expect(result[1].children[0].amount.amount).to.eql(2000);
                    expect(result[1].children[0].children).to.have.length(2);
                    expect(result[1].children[0].children[0].name).to.eql("Activity3");
                    expect(result[1].children[0].children[0].amount.amount).to.eql(3000);
                    expect(result[1].children[0].children[1].name).to.eql("Activity1");
                    expect(result[1].children[0].children[1].amount.amount).to.eql(1000);

                    expect(result[1].children[1].amount.amount).to.eql(3000);
                    expect(result[1].children[1].children).to.have.length(1);
                    expect(result[1].children[1].children[0].name).to.eql("Activity3");
                    expect(result[1].children[1].children[0].name).to.eql("Activity3");
                    expect(result[1].children[1].children[0].amount.amount).to.eql(3000);

                    expect(result[2].profit_center_id.name).to.eql("Daffodil");
                    expect(result[2].amount.amount).to.eql(2000);
                    expect(result[2].children).to.have.length(1);
                    expect(result[2].children[0].amount.amount).to.eql(2000);
                    expect(result[2].children[0].children).to.have.length(1);
                    expect(result[2].children[0].children[0].name).to.eql("Activity2");
                    expect(result[2].children[0].children[0].amount.amount).to.eql(2000);
                }).then(
                function () {
                    done();
                }).fail(function (err) {
                    done(err);
                })
        })
    })
})

