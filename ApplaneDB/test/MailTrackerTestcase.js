//mocha --recursive --timeout 30000 -g "Mail tracking" --reporter spec

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("MailTracerTestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it.skip("Mail tracking", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(function (db1) {
            db = db1;
            var insert = [
                {$collection: "pl.users", $insert: [
                    {_id: 11, "username": "northwindtestcase", "emailtracker": {"username": "northwindtestcase@gmail.com", password: "hrhkhrhk", startdate: new Date()}}
                ]},
                {$collection: "pl.emailtrackers", $insert: {function: "MyEmails.emails", status: "on"}}
            ];
            return db.update(insert);
        }).then(function (result) {
            var MyEmails = {name: "MyEmails", source: "NorthwindTestCase/lib", type: "js"};
            return ApplaneDB.registerFunction(MyEmails);
        }).then(function () {
            var options = {}
            options["to"] = ["northwindtestcase@gmail.com"];
            options["cc"] = "northwindtestcase1@gmail.com"
            options["subject"] = "Hello , This is my first demo mail";
            options["html"] = "Testing mail from testcase";
            options["nodemailer"] = true;
            options["username"] = "northwindtestcase2@gmail.com";
            options["password"] = "hrhkhrhk";
            return db.sendMail(options);
        }).then(function () {
            return db.invokeFunction("EmailTracker.trackEmail");
        }).then(function () {
            return db.query({"$collection": "myemails"});
        }).then(function (data) {
            console.log("data>>" + JSON.stringify(data.result[0]));
            expect(data.result[0].from).to.have.length(1);
            expect(data.result[0].to).to.have.length(1);
            expect(data.result[0].subject).to.eql("Hello , This is my first demo mail");
            expect(data.result[0].body).to.eql("Testing mail from testcase\r\n");
            expect(data.result[0].cc).to.have.length(1);
            expect(data.result[0].participants).to.have.length(2);
            expect(data.result[0].participants[0]).to.eql("northwindtestcase2@gmail.com");
            expect(data.result[0].participants[1]).to.eql("northwindtestcase1@gmail.com");
        }).then(function () {
            done();
        }).fail(function (err) {
            done(err);
        });
    })
});