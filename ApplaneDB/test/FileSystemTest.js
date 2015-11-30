/**
 * mocha --recursive --timeout 10000 -g "Read Write Operation in mongoDB testcase" --reporter spec
 * Created with IntelliJ IDEA.
 * User: Rajit
 * Date: 16/6/14
 * Time: 11:48 AM
 * To change this template use File | Settings | File Templates.
 */


var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Constants = require("../lib/Constants.js");
var Testcases = require("./TestCases.js");

describe("Read Write Operation in mongoDB testcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it("read-write operation in mongodb", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return   db.uploadFile("testfile", "my name is rajit")
            }).then(
            function (data) {
//                console.log("data after uploading>>>>>>>>" + JSON.stringify(data));  //this will be key
                return   db.downloadFile(data)
            }).then(
            function (data) {
//                console.log("data after downloading>>>>>>>>" + JSON.stringify(data));   //this is data in binary/octet form
                var b = new Buffer(data.data, 'binary');
                var s = b.toString('utf8');
                console.log("data of the file after convert to stirng>>>>>>>>>>>>>> " + JSON.stringify(s));  //this is converted data in string
                done();
            }).fail(function (err) {
                done(err);
            })
    })
})