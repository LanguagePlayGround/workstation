var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");
var Q = require("q");
describe("AsyncJobTestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });
    it("asyncjobtestcase then transaction is enabled", function (done) {
        var db = undefined;
        var txid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(function (txid1) {
                txid = txid1;
                var myRelationships = {   name: "onRelationshipSave", source: "NorthwindTestCase/lib/MyRelationships"};
                event = [
                    {
                        function: myRelationships,
                        event: "onSave",
                        post: true
                    }
                ]
                var insert = [
                    {$collection: {collection: "relationships", events: event}, $insert: [
                        {customer: "Applane"}
                    ]}
                ];
                return db.update(insert);
            }).then(function () {
                return db.query({$collection: "relationships"});
            }).then(function (data) {
                console.log("data>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].customer).to.eql("Applane");
                expect(data.result[0].page_rating).to.eql(undefined);
            }).then(function () {
                return db.commitTransaction({sync: true});
            }).then(function () {
                return db.query({$collection: "relationships"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].customer).to.eql("Applane");
                expect(data.result[0].page_rating).to.eql(9);
            }).then(function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("async queue executed immediately in async if db is not transaction enabled", function (done) {
        var db = undefined;
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = {$collection: "countries", $insert: [
                    {
                        country: "india", states: ["haryana", "delhi"]
                    }
                ]};
                return db.addToQueue({mongoUpdates: updates});
            }).then(function () {
                return Q.delay(1000).then(function () {
                    return db.query({$collection: "countries"});
                });
            }).then(function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].country).to.have.eql("india");
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("async queue executed immediately in sync if db is not transaction enabled", function (done) {
        var db = undefined;
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = {$collection: "countries", $insert: [
                    {
                        country: "india", states: ["haryana", "delhi"]
                    }
                ]};
                return db.addToQueue({mongoUpdates: updates, sync: true});
            }).then(function () {
                return db.query({$collection: "countries"});
            }).then(function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].country).to.have.eql("india");
                done();
            }).fail(function (err) {
                done(err);
            })
    })
});
