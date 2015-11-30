/**
 * mocha --recursive --timeout 30000 -g "AsyncUpdatestestcase" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");
var httputil = require("ApplaneCore/apputil/httputil.js");


describe("AsyncUpdatestestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it.skip("insert records asyncally", function (done) {
        var db = undefined;
        var requestId = undefined;
        var service = {};
        service.hostname = Config.HOSTNAME;
        service.port = Config.PORT;
        service.path = "/rest/connect";
        service.method = "post";
        var params = {db: Config.DB, options: JSON.stringify(Config.OPTIONS)};
        httputil.executeServiceAsPromise(service, params).then(function (result) {
            result = JSON.parse(result);
            result = result.response;
            service.path = "/rest/update";
            var insert = [
                {$collection: "countires", $insert: [
                    {_id: 11, "countryname": "india"}
                ]},
                {$collection: "countires", $insert: [
                    {_id: 12, "countryname": "nigeria"}
                ]},
                {$collection: "cities", $insert: [
                    {_id: 13, "cityname": "rio de jenario"}
                ]}
            ];
            var params = {update: JSON.stringify(insert), token: result.token, async: true};
            return httputil.executeServiceAsPromise(service, params);
        }).then(function (result) {
                result = JSON.parse(result);
                result = result.response;
                var index = result.indexOf("[");
                requestId = result.substr(index + 1, result.indexOf("]") - 1);
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
            }).then(function (db1) {
                db = db1;
                var D = require("q").defer();
                setTimeout(function () {
                    return db.query({$collection: "pl.logs", $filter: {token: requestId}}).then(function (data) {
                        D.resolve(data);
                    }).fail(function (err) {
                            D.reject(err);
                        });
                }, 100);
                return D.promise;
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].status).to.eql("success");
                expect(data.result[0].successcount).to.eql("3/3");
            }).then(function () {
                done();
            }).fail(function (err) {
                console.log(err);
                done(err);
            });
    })
})

