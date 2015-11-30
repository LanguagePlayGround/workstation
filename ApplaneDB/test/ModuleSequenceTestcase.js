/*
 * mocha --recursive --timeout 150000 -g "ModuleSequencetestcase" --reporter spec
 */


var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("ModuleSequencetestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach().then(
            function () {
                var ModuleManager = require("../lib/ModuleManager.js");
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

    it("clone test", function (done) {
        var ModuleManager = require("../lib/ModuleManager.js");
//        expect(ModuleManager.getSequence("query")).to.have.length(0);
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.query({$collection: "tasks"});
            }).then(
            function () {
                console.log("qurey sequence>>>" + JSON.stringify(ModuleManager.getSequence("query")));
                expect(ModuleManager.getSequence("query")).to.have.length(15);
                expect(ModuleManager.getSequence("query")[0].name).to.eql("UserSorting");
                expect(ModuleManager.getSequence("query")[1].name).to.eql("Role");
                expect(ModuleManager.getSequence("query")[2].name).to.eql("GroupRecursion");
                expect(ModuleManager.getSequence("query")[3].name).to.eql("UDTModule");
                expect(ModuleManager.getSequence("query")[4].name).to.eql("UEModule");
                expect(ModuleManager.getSequence("query")[5].name).to.eql("Child");
                expect(ModuleManager.getSequence("query")[6].name).to.eql("Recursion");
                expect(ModuleManager.getSequence("query")[7].name).to.eql("DBRef");
                expect(ModuleManager.getSequence("query")[8].name).to.eql("SubQuery");
                expect(ModuleManager.getSequence("query")[9].name).to.eql("Group");
                expect(ModuleManager.getSequence("query")[10].name).to.eql("Function");
                expect(ModuleManager.getSequence("query")[11].name).to.eql("DataTypeModule");
                expect(ModuleManager.getSequence("query")[12].name).to.eql("TriggerModule");
                expect(ModuleManager.getSequence("query")[13].name).to.eql("HistoryLogs");
                expect(ModuleManager.getSequence("query")[14].name).to.eql("CollectionHierarchy");
                var update = [
                    {"$collection": "tasks", $insert: [
                        {_id: 1, name: "manjeet"}
                    ]}
                ]
                return db.update(update)
            }).then(
            function () {
                console.log("update sequence>>>" + JSON.stringify(ModuleManager.getSequence("update")));
                expect(ModuleManager.getSequence("update")).to.have.length(17);
                expect(ModuleManager.getSequence("update")[0].name).to.eql("Replicate");
                expect(ModuleManager.getSequence("update")[1].name).to.eql("MergeLocalAdminDB");
                expect(ModuleManager.getSequence("update")[2].name).to.eql("Role");
                expect(ModuleManager.getSequence("update")[3].name).to.eql("DataTypeModule");
                expect(ModuleManager.getSequence("update")[4].name).to.eql("Schedule");
                expect(ModuleManager.getSequence("update")[5].name).to.eql("Cascade");
                expect(ModuleManager.getSequence("update")[6].name).to.eql("TriggerRequiredFields");
                expect(ModuleManager.getSequence("update")[7].name).to.eql("TriggerModule");
                expect(ModuleManager.getSequence("update")[8].name).to.eql("UserSorting");
                expect(ModuleManager.getSequence("update")[9].name).to.eql("SequenceModule");
                expect(ModuleManager.getSequence("update")[10].name).to.eql("LowerCaseModule");
                expect(ModuleManager.getSequence("update")[11].name).to.eql("ValidationModule");
                expect(ModuleManager.getSequence("update")[12].name).to.eql("SelfRecursiveModule");
                expect(ModuleManager.getSequence("update")[13].name).to.eql("Child");
                expect(ModuleManager.getSequence("update")[14].name).to.eql("HistoryLogs");
                expect(ModuleManager.getSequence("update")[15].name).to.eql("CollectionHierarchy");
                expect(ModuleManager.getSequence("update")[16].name).to.eql("TransactionModule");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    });

});


