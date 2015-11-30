/**
 mocha --recursive --timeout 30000 -g "timezonetestcase" --reporter spec
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Utils = require("ApplaneCore/apputil/util.js");
var Testcases = require("./TestCases.js");
describe("timezonetestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it("timezone of america", function (done) {
        var db = undefined;
        var options = Utils.deepClone(Config.OPTIONS);
        options.timezoneOffset = 240;
        var date1 = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, options).then(function (db1) {
            db = db1;
            date1 = new Date();
            return  db.update({$collection: {collection: "countries", fields: [
                {field: "date", type: "date"}
            ]}, $insert: {date: date1}});
        }).then(function () {
                return db.query({$collection: "countries"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                done();
            }).fail(function (err) {
                done(err);
            })
    })
})
