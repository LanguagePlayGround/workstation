var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("LowerCaseModule testcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it("Lowercase on insert", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates =
                    [
                        {$collection: {collection: "countries", fields: [
                            {field: "country", toLowerCase: true, type: "string"}
                        ]}, $insert: [
                            {country: "India"}
                        ]}
                    ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection": "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].country_lower).to.eql("india");
                done();
            }).fail(function (err) {
                done(err);
            });
    })
    it("Lowercase on update", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates =
                    [
                        {$collection: {collection: "countries", fields: [
                            {field: "country", toLowerCase: true, type: "string"}
                        ]}, $insert: [
                            {country: "India"}
                        ]}
                    ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection": "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].country_lower).to.eql("india");
                var updates =
                    [
                        {$collection: {collection: "countries", fields: [
                            {field: "country", toLowerCase: true, type: "string"}
                        ]}, $update: [
                            {_id: data.result[0]._id, $set: {country: "Bharat"}}
                        ]}
                    ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection": "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("Bharat");
                expect(data.result[0].country_lower).to.eql("bharat")
                done();
            }).fail(function (err) {
                done(err);
            });
    })
    it("Lowercase on unset in update", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates =
                    [
                        {$collection: {collection: "countries", fields: [
                            {field: "country", toLowerCase: true, type: "string"}
                        ]}, $insert: [
                            {country: "India"}
                        ]}
                    ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection": "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].country_lower).to.eql("india");
                var updates =
                    [
                        {$collection: {collection: "countries", fields: [
                            {field: "country", toLowerCase: true, type: "string"}
                        ]}, $update: [
                            {_id: data.result[0]._id, $unset: {country: "Bharat"}}
                        ]}
                    ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection": "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql(undefined);
                expect(data.result[0].country_lower).to.eql(undefined)
                done();
            }).fail(function (err) {
                done(err);
            });
    })
});