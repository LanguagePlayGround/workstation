/**
 * mocha --recursive --timeout 150000 -g "IncludeExcludeModuletestcase" --reporter spec
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");
describe("IncludeExcludeModuletestcase", function () {


    afterEach(function (done) {
        Testcases.afterEach().then(
            function () {
                var ModuleManager = require("../lib/ModuleManager.js");
                ModuleManager.unRegisterModule("IncludeExcludeModule");
                ModuleManager.unRegisterModule("IncludeExcludeModule1");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("module test", function (done) {
        var ModuleManager = require("../lib/ModuleManager.js");
        ModuleManager.registerModule({"index": 1, path: "../test/IncludeExcludeModule.js", name: "IncludeExcludeModule", events: [
            {event: "onSave", pre: true, function: "onPreSave"}
        ]});
        ModuleManager.registerModule({"index": 1, path: "../test/IncludeExcludeModule1.js", name: "IncludeExcludeModule1", events: [
            {event: "onSave", pre: true, function: "onPreSave"}
        ]});
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates =
                    [
                        {$collection: {collection: "countries"}, $insert: [
                            {
                                _id: "1", country: "india", state: "haryana"
                            }
                        ], $modules: {IncludeExcludeModule: 0}}
                    ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection": {collection: "countries"}});
            }).then(
            function (result) {
//                console.log("countires>>>" + JSON.stringify(result));
                expect(result.result).to.have.length(1);
                expect(result.result[0].country).to.eql("india");
                expect(result.result[0].code).to.eql(100);
                var updates =
                    [
                        {$collection: {collection: "countries"}, $delete: [
                            {
                                _id: "1"
                            }
                        ], $modules: {IncludeExcludeModule: 1}}
                    ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection": {collection: "countries"}});
            }).then(
            function (res) {
//                console.log("countires>>>" + JSON.stringify(res));
                expect(res.result).to.have.length(2);
                expect(res.result[0].country).to.eql("india");
                expect(res.result[0].code).to.eql(100);
                expect(res.result[0].code1).to.eql(undefined);
//                            expect(res.result[1].country).to.eql("USA");
                expect(res.result[1].code).to.eql(100);
                expect(res.result[1].code1).to.eql(91);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })
})