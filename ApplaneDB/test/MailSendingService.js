/**
 * mocha --recursive --timeout 10000 -g "mail sending service" --reporter spec
 * mocha --recursive --timeout 10000 -g "sending mail through send grid" --reporter spec
 * mocha --recursive --timeout 10000 -g "sending mail through nodemailer" --reporter spec
 * mocha --recursive --timeout 10000 -g "sending mail through Amazon" --reporter spec
 *
 * AMAZON docs is available at http://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/SES.html#sendRawEmail-property
 */

var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("mail sending service", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it.skip("sending mail through send grid", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.uploadFile("testfile", "hello, its my demo file using send Grid");
            }).then(
            function (fileKey) {
                return db.downloadFile(fileKey)
            }).then(
            function (data) {
                var fileContents = data.data;
                var contentType = data.metadata.contentType
                var options = {}
                options["template"] = "<h1><%= title %></h1>";    //sendgrid does not support comma separated string
                options["data"] = {title: "Hellooooo"}
                options["to"] = ["rajit.garg@daffodilsw.com"];
                options["toname"] = ["RAJIT KUMAR GARG"];
                options["from"] = "developer@daffodilsw.com";
                options["fromname"] = "DEVELOPER AT DAFFODIL";
                options["subject"] = "Hello , This is my first demo mail thru send grid";
                options["bcc"] = "naveen.singh@daffodilsw.com";
                options["cc"] = ["rajit.garg2010@gmail.com", "manjeet.sanghwan@daffodilsw.com"];
                options["replyto"] = "rajitgarg2@gmail.com";
                options["sendgrid"] = true;
                options["sendgridusername"] = "daffodilsw";
                options["sendgridpassword"] = "#daffodilsw@123";
                options["files"] = [
                    {
                        filename: 'DemoFile',
                        contentType: 'contentType',
                        content: new Buffer(fileContents, "utf-8")
                    }
                ]
                return db.sendMail(options)
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it.skip("sending mail through nodemailer", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.uploadFile("testfile", "hello, its my demo using node mailer")
            }).then(
            function (fileKey) {
                return db.downloadFile(fileKey)
            }).then(
            function (data) {
                var fileContents = data.data;
                var contentType = data.metadata.contentType
                var options = {}
                options["template"] = "<h1><%= title %></h1>";      //nodemailer support both array and comma separated string for to, bcc and cc
                options["data"] = {title: "Hellooooo"}
                options["to"] = ["rajit.garg@daffodilsw.com"];
                options["from"] = "developerdaffodil@gmail.com";
                options["subject"] = "Hello , This is my first demo mail thru node mailer";
                options["bcc"] = "rajit.garg2010@gmail.com";
                options["cc"] = "manjeet.sanghwan@daffodilsw.com";
                options["replyTo"] = "rajitgarg2@gmail.com";
                options["nodemailer"] = true;
                options["username"] = "developerdaffodil@gmail.com";
                options["password"] = "daffo123@";
                options["attachments"] = [
                    {
                        filename: 'nodemailerFile',
                        content: new Buffer(fileContents, "utf-8"),
                        contentType: 'contentType'
                    }
                ]
                return db.sendMail(options)
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it.skip("sending mail through Amazon", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.uploadFile("testfile", "hello, its my demo using Amazon")
            }).then(
            function (fileKey) {
                return db.downloadFile(fileKey)
            }).then(
            function (data) {
                var fileContents = data.data;
                var contentType = data.metadata.contentType
                var options = {}
                options["template"] = "<h1><%= title %></h1>";
                options["data"] = {title: "Hello, I am sending mail using Amazon!"}
                options["to"] = ["rajit.garg@daffodilsw.com"]
                options["from"] = "rajit.garg@daffodilsw.com"
//                options["bcc"] = ["sachin.bansal@daffodilsw.com"]        //bcc not working with files
                options["cc"] = ["manjeet.sanghwan@daffodilsw.com"]
                options["subject"] = "Hi There, I am sending mail using Amazon SES";
                options["type"] = "amazon";
                options["amazonsecretkey"] = "ktXzD92OlrSGpXm9qCbkf3vj/DwElOzirgItoL/J";
                options["amazonaccesskey"] = "AKIAJF5XSYQOJAPXS6HA";
                options["amazonregion"] = "us-west-2";
                options["files"] = [
                    {
                        filename: 'DemoFile',
                        contentType: contentType,
                        content: new Buffer(fileContents, "utf-8")
                    }
                ]
                return db.sendMail(options)
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
})