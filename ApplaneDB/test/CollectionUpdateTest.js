var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Q = require('q');
var Testcases = require("./TestCases.js");
describe("collectionUpdatetestcase", function () {
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    it("collection update Test", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"myCollection"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.collections", $filter:{collection:"myCollection"}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].collection).to.eql("myCollection");
                expect(data.result[0].db).to.eql("northwindtestcases");
            }).then(
            function (data) {
                var d = Q.defer();
                var update = [
                    {$collection:"pl.collections", $update:[
                        {_id:1001, $set:{"collection":"updatedCollection"} }
                    ]}
                ]
                db.update(update).then(
                    function () {
                        d.reject("Not ok.");
                    }).fail(function (err) {
                        if (err.toString().indexOf("Update is not allowed in") != -1) {
                            d.resolve();
                        } else {
                            d.reject(err);
                        }
                    })
                return d.promise;
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })
})


