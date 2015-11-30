/**
 * mocha --recursive --timeout 30000 -g "FooterAggregatetestcase" --reporter spec
 * mocha --recursive --timeout 30000 -g "aggregate query on currency type field" --reporter spec
 *
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");
describe.skip("FooterAggregatetestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it("Task Efforts aggregate", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: "tasks", $insert: [
                    {task: "task1", efforts: 110},
                    {task: "task1", efforts: 1000},
                    {task: "task1", efforts: 10},
                    {task: "task1", efforts: 5},
                    {task: "task1", efforts: 400},
                    {task: "task1", efforts: 200}
                ]}
            ]
            return db.update(updates);
        }).then(function () {
                return  db.query({$collection: {collection: "tasks"}, $group: { _id: null, efforts_sum: {$sum: "$efforts"}}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].efforts_sum).to.eql(1725);
            }).then(function () {
                done();
            }).fail(function () {
                done(err);
            })

    })
    it("Task Progress Efforts aggregate", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {collection: "tasks", fields: [
                        {field: "progress", type: "object", multiple: true}
                    ]}, $insert: [
                        {"task": "Task1", "estimatedefforts": 5, progress: [
                            {"progresshours": 2},
                            {"progresshours": 3},
                            {"progresshours": 5}
                        ]},
                        {"task": "Task2", "estimatedefforts": 15, progress: [
                            {"progresshours": 12},
                            {"progresshours": 13},
                            {"progresshours": 15}
                        ]},
                        {"task": "Task3", "estimatedefforts": 35, progress: [
                            {"progresshours": 22},
                            {"progresshours": 33},
                            {"progresshours": 55}
                        ]}  ,
                        {"task": "Task4", "estimatedefforts": 53, progress: [
                            {"progresshours": 21},
                            {"progresshours": 31},
                            {"progresshours": 51}
                        ]}   ,
                        {"task": "Task5", "estimatedefforts": 50, progress: [
                            {"progresshours": 24},
                            {"progresshours": 54},
                            {"progresshours": 34}
                        ]}   ,
                        {"task": "Task6", "estimatedefforts": 3, progress: [
                            {"progresshours": 26},
                            {"progresshours": 36},
                            {"progresshours": 56}
                        ]}   ,
                        {"task": "Task7", "estimatedefforts": 2, progress: [
                            {"progresshours": 27},
                            {"progresshours": 37},
                            {"progresshours": 57}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "tasks"});
            }).then(
            function (data) {
//                console.log("tasks data>>>>>>>" + JSON.stringify(data));
                return db.query({$collection: "tasks", $unwind: ["progress"], $group: { _id: {"_id": "$_id"}, progresshours_sum: {$sum: "$progress.progresshours"}}});
            }).then(
            function (result) {
//                console.log("result>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
                expect(result.result).to.have.length(7);
                expect(result.result[0].progresshours_sum).to.eql(121);
                expect(result.result[1].progresshours_sum).to.eql(118);
                expect(result.result[2].progresshours_sum).to.eql(110);
                expect(result.result[3].progresshours_sum).to.eql(112);
                expect(result.result[4].progresshours_sum).to.eql(40);
                expect(result.result[5].progresshours_sum).to.eql(103);
                expect(result.result[6].progresshours_sum).to.eql(10);
            }).then(function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("Task Progress Subprogress Efforts aggregate", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "tasks", $insert: [
                        {"task": "Task1", "estimatedefforts": 5, progress: [
                            {"progresshours": 2, subprogress: [
                                {subprogresshours: 22},
                                {subprogresshours: 33} ,
                                {subprogresshours: 44}
                            ]},
                            {"progresshours": 3, subprogress: [
                                {subprogresshours: 33},
                                {subprogresshours: 44} ,
                                {subprogresshours: 55}
                            ]},
                            {"progresshours": 5, subprogress: [
                                {subprogresshours: 44},
                                {subprogresshours: 55} ,
                                {subprogresshours: 66}
                            ]}
                        ]},
                        {"task": "Task2", "estimatedefforts": 15, progress: [
                            {"progresshours": 12, subprogress: [
                                {subprogresshours: 44},
                                {subprogresshours: 33} ,
                                {subprogresshours: 22}
                            ]},
                            {"progresshours": 13, subprogress: [
                                {subprogresshours: 33},
                                {subprogresshours: 22} ,
                                {subprogresshours: 11}
                            ]},
                            {"progresshours": 15, subprogress: [
                                {subprogresshours: 55},
                                {subprogresshours: 44} ,
                                {subprogresshours: 33}
                            ]}
                        ]},
                        {"task": "Task3", "estimatedefforts": 35, progress: [
                            {"progresshours": 22, subprogress: [
                                {subprogresshours: 1},
                                {subprogresshours: 3} ,
                                {subprogresshours: 4}
                            ]},
                            {"progresshours": 33, subprogress: [
                                {subprogresshours: 2},
                                {subprogresshours: 3} ,
                                {subprogresshours: 44}
                            ]},
                            {"progresshours": 55, subprogress: [
                                {subprogresshours: 2},
                                {subprogresshours: 34} ,
                                {subprogresshours: 44}
                            ]}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "tasks", $unwind: ["progress", "progress.subprogress"], $group: [
                    { _id: {"_id": "$_id"}, subprogresshours_sum: {$sum: "$progress.subprogress.subprogresshours"} }
                ]});
            }).then(
            function (result) {
                console.log("result>>>>>>" + JSON.stringify(result));
                expect(result.result).to.have.length(3);
                expect(result.result[0].subprogresshours_sum).to.eql(137);
                expect(result.result[1].subprogresshours_sum).to.eql(297);
                expect(result.result[2].subprogresshours_sum).to.eql(396);
            }).then(function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("Task Progress Subprogress Efforts aggregate unwind data", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "tasks", $insert: [
                        {"task": "Task1", "efforts": 5, progress: [
                            {progress: "1", "efforts": 2, subprogress: [
                                {efforts: 22},
                                {efforts: 33} ,
                                {efforts: 44}
                            ]},
                            {progress: "2", "efforts": 3, subprogress: [
                                {efforts: 33},
                                {efforts: 44} ,
                                {efforts: 55}
                            ]},
                            {progress: "3", "efforts": 5, subprogress: [
                                {efforts: 44},
                                {efforts: 55} ,
                                {efforts: 66}
                            ]}
                        ]},
                        {"task": "Task2", "efforts": 15, progress: [
                            {progress: "1", "efforts": 12, subprogress: [
                                {efforts: 44},
                                {efforts: 33} ,
                                {efforts: 22}
                            ]},
                            {progress: "2", "efforts": 13, subprogress: [
                                {efforts: 33},
                                {efforts: 22} ,
                                {efforts: 11}
                            ]},
                            {progress: "3", "efforts": 15, subprogress: [
                                {efforts: 55},
                                {efforts: 44} ,
                                {efforts: 33}
                            ]}
                        ]},
                        {"task": "Task3", "efforts": 35, progress: [
                            {progress: "1", "efforts": 22, subprogress: [
                                {efforts: 1},
                                {efforts: 3} ,
                                {efforts: 4}
                            ]},
                            {progress: "2", "efforts": 33, subprogress: [
                                {efforts: 2},
                                {efforts: 3} ,
                                {efforts: 44}
                            ]},
                            {progress: "3", "efforts": 55, subprogress: [
                                {efforts: 2},
                                {efforts: 34} ,
                                {efforts: 44}
                            ]}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "tasks", $unwind: ["progress", "progress.subprogress"], $group: [
                    { _id: {"_id": "$_id", "progress": "$progress._id"}, progress_subprogress_efforts_sum: {$sum: "$progress.subprogress.efforts"} }
                ]});
            }).then(function (data) {
//                console.log("data>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
            }).then(function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("aggregate query on duration type field", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "estimatedefforts", type: "duration"}
                    ]}, $insert: [
                        {"task": "Task 0", priority: 5, "estimatedefforts": {"time": "5", "unit": "Hrs"}},
                        {"task": "Task1", "estimatedefforts": {"time": "15", "unit": "Hrs"}},
                        {"task": "Task2", "estimatedefforts": {"time": "35", "unit": "Hrs"}}  ,
                        {"task": "Task3", "estimatedefforts": {"time": "53", "unit": "Hrs"}}   ,
                        {"task": "Task4", "estimatedefforts": {"time": "50", "unit": "Hrs"}}   ,
                        {"task": "Task5", "estimatedefforts": {"time": "3", "unit": "Hrs"}}   ,
                        {"task": "Task6", "estimatedefforts": {"time": "2", "unit": "Hrs"}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: {collection: "tasks", fields: [
                    {field: "task", type: "string"},
                    {field: "estimatedefforts", type: "duration"}
                ]}, $group: { _id: null, estimatedefforts_sum: {$sum: "$estimatedefforts"}}});
            }).then(
            function (result) {
                console.log("result>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(result));
                expect(result.result).to.have.length(1);
                expect(result.result[0].estimatedefforts_sum.time).to.eql(163);
                expect(result.result[0].estimatedefforts_sum.unit).to.eql("Hrs");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("aggregate query on progress array with duration type field", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "estimatedefforts", type: "duration"},
                        {field: "progress", type: "object", multiple: true, fields: [
                            {field: "efforts", type: "duration"}
                        ]}
                    ]}, $insert: [
                        {"_id": 1, "task": "Task0", "estimatedefforts": {"time": 1, "unit": "Hrs"}, progress: [
                            {"_id": 11, efforts: {time: 2, unit: "Hrs"}}
                        ]},
                        {"_id": 2, "task": "Task1", "estimatedefforts": {"time": 4, "unit": "Hrs"}, progress: [
                            {"_id": 22, efforts: {time: 1, unit: "Hrs"}},
                            {"_id": 33, efforts: {time: 1, unit: "Hrs"}}
                        ]},
                        {"_id": 3, "task": "Task2", "estimatedefforts": {"time": 5, "unit": "Hrs"}, progress: [
                            {"_id": 44, efforts: {time: 3, unit: "Hrs"}},
                            {"_id": 55, efforts: {time: 5, unit: "Hrs"}}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: {collection: "tasks"}});
            }).then(
            function (data) {
                console.log("data after saving>>>>" + JSON.stringify(data));
                return db.query({$collection: {collection: "tasks", fields: [
                    {field: "task", type: "string"},
                    {field: "estimatedefforts", type: "duration"},
                    {field: "progress", type: "object", multiple: true, fields: [
                        {field: "efforts", type: "duration"}
                    ]}
                ]}, $unwind: ["progress"], $group: [
                    { _id: {"_id": "$_id"}, progress_efforts_sum: {$sum: "$progress.efforts"}, estimatedefforts: {$first: "$estimatedefforts"}},
                    { _id: null, estimatedefforts_sum: {$sum: "$estimatedefforts"}, tasks: {$push: {_id: "$_id._id", "progress_efforts_sum": "$progress_efforts_sum"}}, $sort: {"tasks._id": 1}}
                ], $sort: {"tasks._id": 1}});
            }).then(
            function (result) {
                console.log(">>>>>>>>>>>>>>>>Result>>>>>>" + JSON.stringify(result));
                expect(result.result).to.have.length(1);
                expect(result.result[0].estimatedefforts_sum.time).to.eql(10);
                expect(result.result[0].estimatedefforts_sum.unit).to.eql("Hrs");
                expect(result.result[0].tasks).to.have.length(3);
                expect(result.result[0].tasks[0].progress_efforts_sum.time).to.eql(2);
                expect(result.result[0].tasks[0].progress_efforts_sum.unit).to.eql("Hrs");
                expect(result.result[0].tasks[1].progress_efforts_sum.time).to.eql(2);
                expect(result.result[0].tasks[1].progress_efforts_sum.unit).to.eql("Hrs");
                expect(result.result[0].tasks[2].progress_efforts_sum.time).to.eql(8);
                expect(result.result[0].tasks[2].progress_efforts_sum.unit).to.eql("Hrs");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("aggregate query on subprogress array in  progress array  with duration type field", function (done) {
        var db = undefined;
        var taskInfo = {"collection": "tasks", fields: [
            {field: "task", type: "string"},
            {field: "estimatedefforts", type: "duration"},
            {field: "progress", type: "object", multiple: true, fields: [
                {field: "efforts", type: "duration"},
                {field: "subprogress", type: "object", multiple: true, fields: [
                    {field: "efforts", type: "duration"}
                ]}
            ]}
        ]}
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: taskInfo, $insert: [
                        {"_id": 1, "task": "Task0", "estimatedefforts": {"time": 1, "unit": "Hrs"}, progress: [
                            {"_id": 11, efforts: {time: 2, unit: "Hrs"}, subprogress: [
                                {"_id": 111, efforts: {time: 10, unit: "Hrs"}}
                            ]}
                        ]},
                        {"_id": 2, "task": "Task1", "estimatedefforts": {"time": 4, "unit": "Hrs"}, progress: [
                            {"_id": 22, efforts: {time: 1, unit: "Hrs"}, subprogress: [
                                {"_id": 222, efforts: {time: 1, unit: "Hrs"}},
                                {"_id": 333, efforts: {time: 1, unit: "Hrs"}}
                            ]},
                            {"_id": 33, efforts: {time: 1, unit: "Hrs"}, subprogress: [
                                {"_id": 444, efforts: {time: 3, unit: "Hrs"}},
                                {"_id": 555, efforts: {time: 3, unit: "Hrs"}}
                            ]}
                        ]},
                        {"_id": 3, "task": "Task2", "estimatedefforts": {"time": 5, "unit": "Hrs"}, progress: [
                            {"_id": 44, efforts: {time: 3, unit: "Hrs"}, subprogress: [
                                {"_id": 666, efforts: {time: 5, unit: "Hrs"}},
                                {"_id": 777, efforts: {time: 5, unit: "Hrs"}}
                            ]},
                            {"_id": 55, efforts: {time: 5, unit: "Hrs"}, subprogress: [
                                {"_id": 888, efforts: {time: 2, unit: "Hrs"}},
                                {"_id": 999, efforts: {time: 2, unit: "Hrs"}}
                            ]}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: {collection: "tasks"}});
            }).then(
            function (data) {
                console.log("data after saving>>>>" + JSON.stringify(data));
                return db.query({$collection: taskInfo, $unwind: ["progress", "progress.subprogress"], $group: [
                    { _id: {"_id": "$_id", "progress": "$progress._id"}, progress_subprogress_efforts_sum: {$sum: "$progress.subprogress.efforts"}, estimatedefforts: {$first: "$estimatedefforts"}, "progress_efforts": {$first: "$progress.efforts"}},
                    { _id: {"_id": "$_id._id"}, progress_efforts_sum: {$sum: "$progress_efforts"}, estimatedefforts: {$first: "$estimatedefforts"}, progress: {$push: {_id: "$_id.progress._id", progress_subprogress_efforts_sum: "$progress_subprogress_efforts_sum"}}},
                    { _id: null, estimatedefforts_sum: {$sum: "$estimatedefforts"}, tasks: {$push: {_id: "$_id._id", "progress_efforts_sum": "$progress_efforts_sum", "progress": "$progress"}}}
                ] });
            }).then(
            function (result) {
                console.log(">>>>>>>>>>>>>>Result>>>>>>" + JSON.stringify(result));
                expect(result.result).to.have.length(1);
                expect(result.result[0].estimatedefforts_sum.time).to.eql(10);
                expect(result.result[0].estimatedefforts_sum.time).to.eql("Hrs");
                expect(result.result[0].tasks).to.have.length(3);
                expect(result.result[0].tasks[0].progress_efforts_sum.time).to.eql(2);
                expect(result.result[0].tasks[0].progress_efforts_sum.unit).to.eql("Hrs");
                expect(result.result[0].tasks[0].progress).to.have.length(1);
                expect(result.result[0].tasks[0].progress[0].progress_subprogress_efforts_sum.time).to.eql(10);
                expect(result.result[0].tasks[0].progress[0].progress_subprogress_efforts_sum.unit).to.eql("Hrs");

                expect(result.result[0].tasks[1].progress_efforts_sum.time).to.eql(2);
                expect(result.result[0].tasks[1].progress_efforts_sum.unit).to.eql("Hrs");
                xpect(result.result[0].tasks[1].progress).to.have.length(2);
                expect(result.result[0].tasks[1].progress[0].progress_subprogress_efforts_sum.time).to.eql(2);
                expect(result.result[0].tasks[1].progress[0].progress_subprogress_efforts_sum.unit).to.eql("Hrs");
                expect(result.result[0].tasks[1].progress[1].progress_subprogress_efforts_sum.time).to.eql(6);
                expect(result.result[0].tasks[1].progress[1].progress_subprogress_efforts_sum.unit).to.eql("Hrs");


                expect(result.result[0].tasks[2].progress_efforts_sum.time).to.eql(8);
                expect(result.result[0].tasks[2].progress_efforts_sum.unit).to.eql("Hrs");
                expect(result.result[0].tasks[2].progress).to.have.length(2);
                expect(result.result[0].tasks[2].progress[0].progress_subprogress_efforts_sum.time).to.eql(10);
                expect(result.result[0].tasks[2].progress[0].progress_subprogress_efforts_sum.time).to.eql("Hrs");
                expect(result.result[0].tasks[2].progress[1].progress_subprogress_efforts_sum.time).to.eql(4);
                expect(result.result[0].tasks[2].progress[1].progress_subprogress_efforts_sum.time).to.eql("Hrs");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("aggregate query on currency type field", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: {"collection": "payments", fields: [
                        {field: "paymentno", type: "string"},
                        {field: "cost", type: "currency"}
                    ]}, $insert: [
                        {"paymentno": "P0", "cost": {"amount": 5, "type": {_id: "1", currency: "INR"}}},
                        {"paymentno": "P1", "cost": {"amount": 15, "type": {_id: "1", currency: "INR"}}},
                        {"paymentno": "P2", "cost": {"amount": 35, "type": {_id: "1", currency: "INR"}}},
                        {"paymentno": "P3", "cost": {"amount": 53, "type": {_id: "1", currency: "INR"}}},
                        {"paymentno": "P4", "cost": {"amount": 50, "type": {_id: "1", currency: "INR"}}},
                        {"paymentno": "P5", "cost": {"amount": 3, "type": {_id: "1", currency: "INR"}}},
                        {"paymentno": "P6", "cost": {"amount": 2, "type": {_id: "1", currency: "INR"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function (data) {
                console.log("data after updates>>>>>>>>>>>>>>" + JSON.stringify(data));
                return db.query({$collection: {"collection": "payments", fields: [
                    {field: "paymentno", type: "string"},
                    {field: "cost", type: "currency"}
                ]}, $group: { _id: null, totalcost_sum: {$sum: "$cost"}}});
            }).then(
            function (result) {
                console.log("result>>>>>" + JSON.stringify(result));
                expect(result.result).to.have.length(1);
                expect(result.result[0].totalcost_sum.amount).to.eql(163);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("aggregate query on progress array with currency type field", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                        {$collection: {"collection": "payments", fields: [
                            {field: "paymentno", type: "string"},
                            {field: "cost", type: "currency"},
                            {field: "lineitems", type: "object", multiple: true, fields: [
                                {field: "lineitemcost", type: "currency"}
                            ]}
                        ]}, $insert: [
                            {"_id": 1, "paymentno": "P0", "cost": {"amount": 1, "type": {_id: "1", currency: "INR"}}, lineitems: [
                                {"_id": 11, lineitemcost: {amount: 2, "type": {_id: "1", currency: "INR"}}}
                            ]},
                            {"_id": 2, "paymentno": "P1", "cost": {"amount": 4, "type": {_id: "1", currency: "INR"}}, lineitems: [
                                {"_id": 22, lineitemcost: {amount: 1, "type": {_id: "1", currency: "INR"}}},
                                {"_id": 33, lineitemcost: {amount: 1, "type": {_id: "1", currency: "INR"}}}
                            ]},
                            {"_id": 3, "paymentno": "P2", "cost": {"amount": 5, "type": {_id: "1", currency: "INR"}}, lineitems: [
                                {"_id": 44, lineitemcost: {amount: 3, "type": {_id: "1", currency: "INR"}}},
                                {"_id": 55, lineitemcost: {amount: 5, "type": {_id: "1", currency: "INR"}}}
                            ]}
                        ]
                        }
                    ]
                    ;
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: {collection: "tasks"}});
            }).then(
            function (data) {
                console.log("data after saving>>>>" + JSON.stringify(data));
                return db.query({$collection: {"collection": "payments", fields: [
                    {field: "paymentno", type: "string"},
                    {field: "cost", type: "currency"},
                    {field: "lineitems", type: "object", multiple: true, fields: [
                        {field: "lineitemcost", type: "currency"}
                    ]}
                ]}, $unwind: ["lineitems"], $group: [
                    { _id: {"_id": "$_id"}, lineitems_lineitemcost_sum: {$sum: "$lineitems.lineitemcost"}, costs_sum: {$first: "$cost"}},
                    { _id: null, costs_sum: {$sum: "$costs_sum"}, payments: {$push: {_id: "$_id._id", "lineitems_lineitemcost_sum": "$lineitems_lineitemcost_sum"}}}
                ] });
            }).then(
            function (result) {
                console.log(">>>>>>>>>>>>>>>>Result>>>>>>" + JSON.stringify(result));
                expect(result.result).to.have.length(1);
                expect(result.result[0].costs_sum.amount).to.eql(10);
                expect(result.result[0].payments).to.have.length(3);
                expect(result.result[0].payments[0].lineitems_lineitemcost_sum.amount).to.eql(2);
                expect(result.result[0].payments[1].lineitems_lineitemcost_sum.amount).to.eql(2);
                expect(result.result[0].payments[2].lineitems_lineitemcost_sum.amount).to.eql(8);
                done();
            }).fail(function (err) {
                done(err);
            });
    })
    ;
    it("aggregate query on sublineitems array in  lineitems array  with currency type field", function (done) {
        var db = undefined;
        var paymentInfo = {"collection": "payments", fields: [
            {field: "paymentno", type: "string"},
            {field: "totalamount", type: "currency"},
            {field: "lineitems", type: "object", multiple: true, fields: [
                {field: "totalamount", type: "currency"},
                {field: "sublineitems", type: "object", multiple: true, fields: [
                    {field: "totalamount", type: "currency"}
                ]}
            ]}
        ]}
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = {$collection: paymentInfo, $insert: [
                    {"_id": 1, "paymentno": "p0", "totalamount": {"amount": 100, "type": {_id: "1", currency: "INR"}}, lineitems: [
                        {"_id": 11, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}, sublineitems: [
                            {"_id": 111, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}}
                        ]}
                    ]},
                    {"_id": 2, "task": "Task1", totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}, lineitems: [
                        {"_id": 22, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}, sublineitems: [
                            {"_id": 222, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}},
                            {"_id": 333, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}}
                        ]},
                        {"_id": 33, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}, sublineitems: [
                            {"_id": 444, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}},
                            {"_id": 555, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}}
                        ]}
                    ]},
                    {"_id": 3, "task": "Task2", totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}, lineitems: [
                        {"_id": 44, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}, sublineitems: [
                            {"_id": 666, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}},
                            {"_id": 777, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}}
                        ]},
                        {"_id": 55, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}, sublineitems: [
                            {"_id": 888, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}},
                            {"_id": 999, totalamount: {"amount": 100, "type": {_id: "1", currency: "INR"}}}
                        ]}
                    ]}
                ]};
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: {collection: "payments"}});
            }).then(
            function (data) {
                console.log("data after saving>>>>" + JSON.stringify(data));
                return db.query({$collection: paymentInfo, $unwind: ["lineitems", "lineitems.sublineitems"], $group: [
                    { _id: {"_id": "$_id", "lineitems": "$lineitems._id"}, lineitems_sublineitems_totalamount_sum: {$sum: "$lineitems.sublineitems.totalamount"}, totalamount: {$first: "$totalamount"}, "lineitems_totalamount_sum": {$first: "$lineitems.totalamount"}},
                    { _id: {"_id": "$_id._id"}, lineitems_totalamount_sum: {$sum: "$lineitems_totalamount_sum"}, totalamount: {$first: "$totalamount"}, lineitems: {$push: {_id: "$_id.lineitems._id", lineitems_sublineitems_totalamount_sum: "$lineitems_sublineitems_totalamount_sum"}}},
                    { _id: null, totalamount_sum: {$sum: "$totalamount"}, payments: {$push: {_id: "$_id._id", "lineitems_totalamount_sum": "$lineitems_totalamount_sum", lineitems: "$lineitems"}}}
                ] });
            }).then(
            function (result) {
                console.log(">>>>>>>>>>>>>>Result>>>>>>" + JSON.stringify(result));
                expect(result.result).to.have.length(1);
                expect(result.result[0].totalamount_sum.amount).to.eql(300);
                expect(result.result[0].payments).to.have.length(3);
                expect(result.result[0].payments[0].lineitems_totalamount_sum.amount).to.eql(100);
                expect(result.result[0].payments[0].lineitems).to.have.length(1);
                expect(result.result[0].payments[0].lineitems[0].lineitems_sublineitems_totalamount_sum.amount).to.eql(100);

                expect(result.result[0].payments[1].lineitems_totalamount_sum.amount).to.eql(200);
                expect(result.result[0].payments[1].lineitems).to.have.length(2);
                expect(result.result[0].payments[1].lineitems[0].lineitems_sublineitems_totalamount_sum.amount).to.eql(200);
                expect(result.result[0].payments[1].lineitems[1].lineitems_sublineitems_totalamount_sum.amount).to.eql(200);


                expect(result.result[0].payments[2].lineitems_totalamount_sum.amount).to.eql(200);
                expect(result.result[0].payments[2].lineitems).to.have.length(2);
                expect(result.result[0].payments[2].lineitems[0].lineitems_sublineitems_totalamount_sum.amount).to.eql(200);
                expect(result.result[0].payments[2].lineitems[1].lineitems_sublineitems_totalamount_sum.amount).to.eql(200);
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("aggregate query on progress array  with duration type field with in object", function (done) {
        var db = undefined;
        var taskInfo = {"collection": "tasks", fields: [
            {field: "task", type: "string"},
            {field: "estimatedefforts", type: "duration"},
            {field: "progress", type: "object", fields: [
                {field: "efforts", type: "duration"}
            ]}
        ]}
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: taskInfo, $insert: [
                        {"_id": 1, "task": "Task0", "estimatedefforts": {"time": 1, "unit": "Hrs"}, progress: {"_id": 11, efforts: {time: 2, unit: "Hrs"}}},
                        {"_id": 2, "task": "Task1", "estimatedefforts": {"time": 4, "unit": "Hrs"}, progress: {"_id": 11, efforts: {time: 4, unit: "Hrs"}}},
                        {"_id": 3, "task": "Task2", "estimatedefforts": {"time": 5, "unit": "Hrs"}, progress: {"_id": 11, efforts: {time: 6, unit: "Hrs"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: {collection: "tasks"}});
            }).then(
            function (data) {
                console.log("data after saving>>>>" + JSON.stringify(data));
                return db.query({$collection: taskInfo, $group: [
                    { _id: null, estimatedefforts_sum: {$sum: "$estimatedefforts"}, progress_efforts: {$sum: "$progress.efforts"}}
                ] });
            }).then(
            function (result) {
                console.log(">>>>>>>>>>>>>>Result>>>>>>" + JSON.stringify(result));
                expect(result.result).to.have.length(1);
                expect(result.result[0].estimatedefforts_sum.time).to.eql(10);
                expect(result.result[0].estimatedefforts_sum.unit).to.eql("Hrs");
                expect(result.result[0].progress_efforts.time).to.eql(12);
                expect(result.result[0].progress_efforts.unit).to.eql("Hrs");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

})
;