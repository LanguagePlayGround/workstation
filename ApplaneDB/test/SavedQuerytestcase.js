var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("Savedquerytestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it("execute saved query", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection: "employees", $insert: [
                        { "name": "Manjeet"},
                        { "name": "Sourbh"},
                        { "name": "Sachin"},
                        { "name": "Praveen"}
                    ]}
                ]
                return db.update(insert);
            }).then(function () {
                return db.update({$collection: "pl.queries", $insert: [
                    {id: "getEmployees", query: JSON.stringify({$collection: "employees"})}
                ]});
            }).then(function () {
                return db.query({$collection: "pl.queries"});
            }).then(
            function (result) {
                return db.query({$query: "getEmployees"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(4);
                done();
            }).fail(function (err) {
                done(err);
            })
    });

    it("execute saved query with limit override ", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection: "employees", $insert: [
                        { "name": "Manjeet"},
                        { "name": "Sourbh"},
                        { "name": "Sachin"},
                        { "name": "Praveen"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.update({$collection: "pl.queries", $insert: [
                    {id: "getEmployees", query: JSON.stringify({$collection: "employees", $limit: 2})}
                ]});
            }).then(
            function () {
                return db.query({$query: "getEmployees"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(2);
            }).then(
            function () {
                return db.query({$query: "getEmployees", $limit: 3});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);
                done();
            }).fail(function (err) {
                done(err);
            })
    });


    it("execute saved query with merging filter ", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection: "employees", $insert: [
                        { "name": "Manjeet", "age": 24, "edu": "btech"},
                        { "name": "Sourbh", "age": 23, "edu": "mca"},
                        { "name": "Sachin", "age": 22, "edu": "btech"},
                        { "name": "Praveen", "age": 20, "edu": "mca"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.update({$collection: "pl.queries", $insert: [
                    {id: "getEmployees", query: JSON.stringify({$collection: "employees", $filter: {edu: "mca"}})}
                ]});
            }).then(
            function () {
                return db.query({$query: "getEmployees"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(2);
            }).then(
            function () {
                return db.query({$query: "getEmployees", $filter: {age: {$gt: 20}} });
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                done();
            }).fail(function (err) {
                done(err);
            })
    })


    it("execute saved query with merging filter and override sorting ", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection: "employees", $insert: [
                        { "name": "Manjeet", "age": 24, "edu": "btech"},
                        { "name": "Sourbh", "age": 23, "edu": "mca"},
                        { "name": "Sachin", "age": 22, "edu": "btech"},
                        { "name": "Praveen", "age": 20, "edu": "mca"},
                        { "name": "Shubham", "age": 21, "edu": "mca"},
                        { "name": "deppak", "age": 19, "edu": "btech"},
                        { "name": "rajit", "age": 22, "edu": "bsc"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.update({$collection: "pl.queries", $insert: [
                    {id: "getEmployees", query: JSON.stringify({$collection: "employees", $filter: {edu: "mca"}, $sort: {"name": 1}})}
                ]});
            }).then(
            function () {
                return db.query({$query: "getEmployees"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);
                expect(result.result[0].name).to.eql("Praveen");
                expect(result.result[0].edu).to.eql("mca");
                expect(result.result[2].name).to.eql("Sourbh");
            }).then(
            function () {
                return db.query({$query: "getEmployees", $filter: {age: {$gt: 20}}, $sort: {"name": -1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(2);
                expect(result.result[0].edu).to.eql("mca");
                expect(result.result[0].name).to.eql("Sourbh");
                expect(result.result[1].name).to.eql("Shubham");
                done();
            }).fail(function (err) {
                done(err);
            })
    })

})