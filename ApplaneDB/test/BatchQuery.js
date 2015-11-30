/**
 *  mocha --recursive --timeout 150000 -g "BatchQuerytestcase" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("BatchQuerytestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })

    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })


    it("simple batchQuery", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection: "employees", $insert: [
                        {name: "Applane Employee"}
                    ]},
                    {$collection: "users", $insert: [
                        {name: "Applane User"}
                    ]}
                ]
                return db.update(insert);
            }).then(function () {
                return db.batchQuery({"employees": {$collection: "employees"}, "users": {$collection: "users"}});
            }).then(function (data) {
                expect(data.employees.result).to.have.length(1);
                expect(data.employees.result[0].name).to.eql("Applane Employee");
                expect(data.users.result).to.have.length(1);
                expect(data.users.result[0].name).to.eql("Applane User");
            }).then(function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("simple batchQuery query in dollar query", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection: "employees", $insert: [
                        {name: "Applane Employee"}
                    ]},
                    {$collection: "users", $insert: [
                        {name: "Applane User"}
                    ]}
                ]
                return db.update(insert);
            }).then(function () {
                return db.batchQuery({"employees": {$collection: "employees"}, "users": {$query: {$collection: "users"}}});
            }).then(function (data) {
                expect(data.employees.result).to.have.length(1);
                expect(data.employees.result[0].name).to.eql("Applane Employee");
                expect(data.users.result).to.have.length(1);
                expect(data.users.result[0].name).to.eql("Applane User");
            }).then(function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it(" batchQuery onBatchResult event", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection: "employees", $insert: [
                        {name: "Applane Employee"}
                    ]},
                    {$collection: "users", $insert: [
                        {name: "Applane User"}
                    ]}
                ]
                return db.update(insert);
            }).then(function () {
                var functionsToRegister = [
                    {name: "Cities", source: "NorthwindTestCase/lib", type: "js"}
                ]
                return ApplaneDB.registerFunction(functionsToRegister);
            }).then(function () {
                return db.batchQuery({"employees": {$collection: "employees"}, "users": {$query: {$collection: "users"}}, "$events": {"event": "onBatchResult", "function": "Cities.onBatchResult"}});
            }).then(function (data) {
                expect(data.employees.result).to.have.length(1);
                expect(data.employees.result[0].name).to.eql("Applane Employee");
                expect(data.employees.result[0].emailid).to.eql("applane.developer@gmail.com");
                expect(data.users.result).to.have.length(1);
                expect(data.users.result[0].name).to.eql("Applane User");
            }).then(function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it(" batchQuery onBatchQuery event", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection: "employees", $insert: [
                        {name: "Applane Employee"}
                    ]},
                    {$collection: "users", $insert: [
                        {name: "Applane User"}
                    ]}
                ]
                return db.update(insert);
            }).then(function () {
                var functionsToRegister = [
                    {name: "Cities", source: "NorthwindTestCase/lib", type: "js"}
                ]
                return ApplaneDB.registerFunction(functionsToRegister);
            }).then(function () {
                return db.batchQuery({"employees": {$collection: "employees"}, "users": {$query: {$collection: "users"}}, "$events": {"event": "onBatchQuery", "function": "Cities.onBatchQuery"}});
            }).then(function (data) {
                expect(data.employees.result).to.have.length(0);
                expect(data.users.result).to.have.length(1);
                expect(data.users.result[0].name).to.eql("Applane User");
            }).then(function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });
});
