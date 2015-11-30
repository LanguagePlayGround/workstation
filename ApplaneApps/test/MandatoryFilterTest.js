var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");


describe("Mandatory Filter testcase", function () {
    beforeEach(function (done) {
        return Testcases.beforeEach(done);
    });
    afterEach(function (done) {
        return Testcases.afterEach(done);
    });
    it("Mandatory Filter TestCase", function (done) {
        var db = undefined;
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var updates = [
                {$collection: "pl.collections", $insert: [
                    {collection: "tasks"},
                    {collection: "priority"}
                ]}
            ]
            return db.update(updates);
        }).then(function () {
                var updates = [
                    {$collection: "pl.fields", $insert: [
                        {field: "name", type: "string", collectionid: {$query: {collection: "priority"}}},
                        {field: "rate", type: "string", collectionid: {$query: {collection: "tasks"}}, options: ["Satisfactory", "Good", "Bad"], visibilityFilter: "Always", filterable: true, defaultFilter: "Satisfactory"},
                        {field: "date", type: "date", collectionid: {$query: {collection: "tasks"}}, visibilityFilter: "Always", filterable: true, defaultFilter: "$$CurrentMonthFilter"},
                        {field: "priorityid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "priority", displayField: "name", set: ["name"], visibilityFilter: "Always", filterable: true, defaultFilter: "$First"}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                var currentDate = new Date();
                currentDate.setUTCDate(10);
                currentDate.setUTCHours(0);
                currentDate.setUTCMinutes(0);
                currentDate.setUTCSeconds(0);
                console.log("currentDate>>>" + currentDate);
                var nextDate = new Date(currentDate.getFullYear(), currentDate.getMonth() + 2, currentDate.getDate());
                nextDate.setUTCHours(0);
                nextDate.setUTCMinutes(0);
                nextDate.setUTCSeconds(0);
                console.log("nextDate>>>" + nextDate);
                var updates = [
                    {$collection: "priority", $insert: [
                        {name: "blocker"},
                        {name: "high"}
                    ]},
                    {$collection: "tasks", $insert: [
                        {rate: "Satisfactory", priorityid: {$query: {name: "high"}}, "date": currentDate},
                        {rate: "Bad", priorityid: {$query: {name: "high"}}, "date": currentDate},
                        {name: "Good", priorityid: {$query: {name: "blocker"}}, "date": nextDate}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "tasks"});
            }).then(function (data) {
                console.log("data saved in tasks collection >>>" + JSON.stringify(data));
                var updates = [
                    {$collection: {collection: "pl.qviews", fields: [
                        {field: "id", type: "string"},
                        {"field": "collection", type: "fk", collection: "pl.collections", displayField: "collection", set: ["collection"]},
                        {"field": "mainCollection", type: "fk", collection: "pl.collections", displayField: "collection", set: ["collection"]}
                    ]}, $insert: [
                        {id: "TodayTasks", collection: {$query: {collection: "tasks"}}, mainCollection: {$query: {collection: "tasks"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(function (data) {
                var v = {};
                v.id = "TodayTasks";
                return db.invokeFunction("view.getView", [v]);
            }).then(function (data) {
                console.log("final data>>" + JSON.stringify(data));
                expect(data.data.result).to.have.length(1);
                expect(data.data.result[0].rate).to.eql("Satisfactory");
                expect(data.data.result[0].priorityid.name).to.eql("high");
                expect(data.data.result[0].date.getUTCDate()).to.eql(10);
                done();
            }).fail(function (err) {
                done(err);
            })
    })
});
