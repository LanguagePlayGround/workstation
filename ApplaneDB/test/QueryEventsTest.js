/**
 * mocha --recursive --timeout 150000 -g "queryEventstestcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "post query event in collection" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

var countriesCollection = {collection: "countries", events: [
    {event: "onQuery", function: "Countries.preQuery", pre: true}
]};
var employeeCollection = {collection: "employee", events: [
    {event: "onQuery", function: "Employee.postQuery", post: true}
]};
var statesCollection = {collection: "states", events: [
    {event: "onQuery", function: "States.postQuery", post: true}
]};
var citiesCollection = {collection: "cities", events: [
    {event: "onQuery", function: "Cities.preQuery", pre: true}
]};
var personCollection = {collection: "person", events: [
    {event: "onQuery", function: "Person.postQuery", post: true}
]};
var collectionsToRegister = [countriesCollection, statesCollection, citiesCollection, personCollection, employeeCollection];
var functionsToRegister = [
    {name: "Countries", source: "NorthwindTestCase/lib", "type": "js"},
    {name: "States", source: "NorthwindTestCase/lib", "type": "js"},
    {name: "Cities", source: "NorthwindTestCase/lib", "type": "js"},
    {name: "Person", source: "NorthwindTestCase/lib", "type": "js"} ,
    {name: "Employee", source: "NorthwindTestCase/lib", "type": "js"}
]
describe("queryEventstestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    before(function (done) {
        ApplaneDB.registerCollection(collectionsToRegister).then(
            function () {
                return ApplaneDB.registerFunction(functionsToRegister)
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })
    after(function (done) {
        ApplaneDB.removeCollections(["countries", "states", "cities", "employee", "person"]);
        done();
    })
    it("pre query event in collection", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: "india", "country": "india", code: "91", population: "2 crore"},
                        {_id: "pakisatan", "country": "pakisatan", code: "92", population: "5 thousand"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "countries", $fields: {code: 1, country: 1}});
            }).then(function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].code).to.eql("91");
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].population).to.eql("2 crore");
                expect(data.result[1].code).to.eql("92");
                expect(data.result[1].country).to.eql("pakisatan");
                expect(data.result[1].population).to.eql("5 thousand");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it.skip("post query event in collection", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "employee", $insert: [
                        {_id: "haryana", "state": "haryana", code: "91", population: "2 crore"},
                        {_id: "punjab", "state": "punjab", code: "92", population: "5 thousand"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "employee", $fields: {code: 1, state: 1}});
            }).then(function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].code).to.eql("91");
                expect(data.result[0].state).to.eql("haryana");
                expect(data.result[0].population).to.eql(undefined);
                expect(data.result[1].code).to.eql("92");
                expect(data.result[1].state).to.eql("punjab");
                expect(data.result[1].population).to.eql(undefined);
                expect(data.result[2].code).to.eql("01");
                expect(data.result[2].state).to.eql("delhi");
                expect(data.result[2].population).to.eql("15 thousand");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("pre event false", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: "india", "country": "india", code: "91", population: "2 crore"},
                        {_id: "pakisatan", "country": "pakisatan", code: "92", population: "5 thousand"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "countries", $fields: {code: 1, country: 1}, $events: false});
            }).then(function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].code).to.eql("91");
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].population).to.eql(undefined);
                expect(data.result[1].code).to.eql("92");
                expect(data.result[1].country).to.eql("pakisatan");
                expect(data.result[1].population).to.eql(undefined);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("merge events from query and collection", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: "india", "country": "india", code: "91", population: "2 crore"},
                        {_id: "pakisatan", "country": "pakisatan", code: "92", population: "5 thousand"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "countries", $fields: {code: 1, country: 1}, $events: [
                    {event: "onQuery", function: "Countries.postQuery", post: true}
                ]});
            }).then(function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].code).to.eql("91");
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].population).to.eql("2 crore");
                expect(data.result[1].code).to.eql("92");
                expect(data.result[1].country).to.eql("pakisatan");
                expect(data.result[1].population).to.eql("5 thousand");
                expect(data.result[2].code).to.eql("01");
                expect(data.result[2].country).to.eql("usa");
                expect(data.result[2].population).to.eql("15 thousand");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("merge events from query and collection case 2", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "states", $insert: [
                        {_id: "haryana", "state": "haryana", code: "91", population: "2 crore"},
                        {_id: "punjab", "state": "punjab", code: "92", population: "5 thousand"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "states", $fields: {code: 1, state: 1}, $events: [
                    {event: "onQuery", function: "States.preQuery", pre: true}
                ]});
            }).then(function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].code).to.eql("91");
                expect(data.result[0].state).to.eql("haryana");
                expect(data.result[0].population).to.eql("2 crore");
                expect(data.result[1].code).to.eql("92");
                expect(data.result[1].state).to.eql("punjab");
                expect(data.result[1].population).to.eql("5 thousand");
                expect(data.result[2].code).to.eql("01");
                expect(data.result[2].state).to.eql("delhi");
                expect(data.result[2].population).to.eql("15 thousand");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("remove collection event from query event", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "cities", $insert: [
                        {_id: "haryana", "state": "haryana", code: "91", population: "2 crore"},
                        {_id: "punjab", "state": "punjab", code: "92", population: "5 thousand"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "cities", $fields: {code: 1, state: 1}, $events: [
                    {event: "onQuery", function: "Cities.preQuery", pre: false}
                ]});
            }).then(function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].code).to.eql("91");
                expect(data.result[0].state).to.eql("haryana");
                expect(data.result[0].population).to.eql(undefined);
                expect(data.result[1].code).to.eql("92");
                expect(data.result[1].state).to.eql("punjab");
                expect(data.result[1].population).to.eql(undefined);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("remove collection event from query event case2", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "person", $insert: [
                        {_id: "haryana", "state": "haryana", code: "91", population: "2 crore"},
                        {_id: "punjab", "state": "punjab", code: "92", population: "5 thousand"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "person", $fields: {code: 1, state: 1}, $events: [
                    {event: "onQuery", function: "Person.postQuery", post: false}
                ]});
            }).then(function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].code).to.eql("91");
                expect(data.result[0].state).to.eql("haryana");
                expect(data.result[0].population).to.eql(undefined);
                expect(data.result[1].code).to.eql("92");
                expect(data.result[1].state).to.eql("punjab");
                expect(data.result[1].population).to.eql(undefined);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
});