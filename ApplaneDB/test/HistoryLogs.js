/**
 *
 * mocha --recursive --timeout 150000 -g "historylogs" --reporter spec
 * mocha --recursive --timeout 150000 -g "__history test update with no change in any field" --reporter spec
 *
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require('./NorthwindDb.js');
var Testcases = require("./TestCases.js");

describe("historylogs testcases", function () {

    var collectionsToRegister = [
        {collection: "employee", historyEnabled: true, fields: [
            {field: "name", type: "string"},
            {field: "age", type: "number"},
            {field: "city", type: "string"}
        ]},
        {collection: "employees", historyEnabled: true, historyFields: {age: 0}, fields: [
            {field: "name", type: "string"},
            {field: "age", type: "number"},
            {field: "city", type: "string"}
        ]},
        {collection: "tasks", fields: [
            {field: "task", type: "string"}
        ]}
    ];

    before(function (done) {
        ApplaneDB.registerCollection(collectionsToRegister).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    });
    after(function (done) {
        ApplaneDB.removeCollections(["employee", "tasks", "employees"]);
        done();
    });
    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });

    it('__history testcase', function (done) {
        var db = undefined;
        var lastUpdatedOn = undefined;
        var lastUpdatedById = undefined;
        var insertId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection: "tasks", $insert: [
                    {"task": "task1"}
                ]});
            }).then(
            function (updateData) {
                expect(updateData.tasks.$insert[0].__history).to.not.equal(undefined);
                expect(updateData.tasks.$insert[0].__history).to.have.property("__createdOn");
                expect(updateData.tasks.$insert[0].__history).to.have.property("__createdBy");
                expect(updateData.tasks.$insert[0].__history).to.have.property("__lastUpdatedOn");
                expect(updateData.tasks.$insert[0].__history).to.have.property("__lastUpdatedBy");
                insertId = updateData.tasks.$insert[0]._id;
                lastUpdatedOn = updateData.tasks.$insert[0].__history.__lastUpdatedOn;
                lastUpdatedById = updateData.tasks.$insert[0].__history.__lastUpdatedBy._id;
            }).then(
            function () {
                return db.update({"$collection": "tasks", $update: [
                    {_id: insertId, $set: {task: "task99"}}
                ]});
            }).then(
            function (updateData) {
                return db.query({"$collection": "tasks", $filter: {_id: insertId}, $historyFields: true});
            }).then(
            function (queryData) {
//            writelog("queryData >> " + JSON.stringify(queryData.result[0]));
                expect(queryData.result[0].__history.__createdOn).to.not.equal(undefined);
                expect(queryData.result[0].__history.__lastUpdatedOn).to.not.equal(lastUpdatedOn);
//            var time =queryData.result[0].__history.__lastUpdatedOn - lastUpdatedOn;
//            writelog("time ::: "+time);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it("__history test - delete", function (done) {
        var db = undefined;
        var recordID;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = {"$collection": "employee", $insert: {name: "Ashu", age: 25, city: "Hisar"}};
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "employee"});
            }).then(
            function (data) {
//            writelog("data >>" + JSON.stringify(data.result));
                recordID = data.result[0]._id;
                var update = {$collection: "employee", $delete: {_id: recordID}};
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "pl.historylogs", $historyFields: true});
            }).then(
            function (data) {
//            writelog("historyLOgs  >>" + JSON.stringify(data.result));
                expect(data.result[0].__collection).to.eql("employee");
                expect(data.result[0].name).to.eql("Ashu");
                expect(data.result[0].age).to.eql(25);
                expect(data.result[0].city).to.eql("Hisar");
                expect(data.result[0].__history).to.not.equal(undefined);
            }).then(
            function () {
                done();
            }).catch(function (e) {
                done(e);
            });

    });

    it("__history test - update", function (done) {
        var db = undefined;
        var recordID;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = {"$collection": "employee", $insert: {name: "Ashu", age: 25, city: "Hisar"}};
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "employee"});
            }).then(
            function (data) {
//            writelog("data >>" + JSON.stringify(data.result));
                recordID = data.result[0]._id;
                var update = {$collection: "employee", $update: [
                    {_id: recordID, $set: {city: "Delhi", age: 26}}
                ]};
                return db.update(update);
            }).then(
            function () {
                var update = {$collection: "employee", $update: [
                    {_id: recordID, $set: {city: "Chandigarh", age: 25}}
                ]};
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "employee", $historyFields: true});
            }).then(
            function (data) {
//            writelog("employee  >>" + JSON.stringify(data ));
                expect(data.result[0].__history).to.not.equal(undefined);
                expect(data.result[0].__history.history).to.not.equal(undefined);
                expect(data.result[0].__history.history).to.have.length(2);
                expect(data.result[0].__history.history[0].city).to.eql("Hisar");
                expect(data.result[0].__history.history[0].age).to.eql(25);
                expect(data.result[0].__history.history[1].city).to.eql("Delhi");
                expect(data.result[0].__history.history[1].age).to.eql(26);
            }).then(
            function () {
                done();
            }).catch(function (e) {
                done(e);
            });
    });

    it("__history test - update", function (done) {
        var db = undefined;
        var recordID;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = {"$collection": "employee", $insert: {name: "Ashu", age: 25, city: "Hisar"}};
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "employee"});
            }).then(
            function (data) {
//            writelog("data >>" + JSON.stringify(data.result));
                recordID = data.result[0]._id;
                var update = {$collection: "employee", $update: [
                    {_id: recordID, $set: {city: "Delhi", age: 26}}
                ]};
                return db.update(update);
            }).then(
            function () {
                var update = {$collection: "employee", $update: [
                    {_id: recordID, $set: {city: "Chandigarh", age: 25}}
                ]};
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "employee", $historyFields: true});
            }).then(
            function (data) {
//            writelog("employee  >>" + JSON.stringify(data ));
                expect(data.result[0].__history).to.not.equal(undefined);
                expect(data.result[0].__history.history).to.not.equal(undefined);
                expect(data.result[0].__history.history).to.have.length(2);
                expect(data.result[0].__history.history[0].city).to.eql("Hisar");
                expect(data.result[0].__history.history[0].age).to.eql(25);
                expect(data.result[0].__history.history[1].city).to.eql("Delhi");
                expect(data.result[0].__history.history[1].age).to.eql(26);
            }).then(
            function () {
                done();
            }).catch(function (e) {
                done(e);
            });
    });

    it("__history test update with no change in any field", function (done) {
        var db = undefined;
        var recordID;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = {"$collection": "employee", $insert: {name: "Ashu", age: 25, city: "Hisar", address: {street: 3, city: "Hisar", state: "Haryana"}}};
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "employee"});
            }).then(
            function (data) {
                recordID = data.result[0]._id;
                var update = {$collection: "employee", $update: [
                    {_id: recordID}
                ]};
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "employee", $historyFields: true});
            }).then(
            function (data) {
                expect(data.result[0].__history.history).to.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (e) {
                done(e);
            });

    });

    it("__history test update with change in exclude field", function (done) {
        var db = undefined;
        var recordID;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = {"$collection": "employees", $insert: {name: "Ashu", age: 25, city: "Hisar", address: {street: 3, city: "Hisar", state: "Haryana"}}};
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "employees"});
            }).then(
            function (data) {
                recordID = data.result[0]._id;
                var update = {$collection: "employees", $update: [
                    {_id: recordID, $set: {name: "Ashu1", age: 25}}
                ]};
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "employees", $historyFields: true});
            }).then(
            function (data) {
                expect(data.result[0].__history.history).to.have.length(1);
                expect(data.result[0].__history.history[0].name).to.eql("Ashu");
                expect(data.result[0].__history.history[0].age).to.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (e) {
                done(e);
            });

    });

    it("__history test update -  array insert in multiple", function (done) {
        var db = undefined;
        var recordID;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = {"$collection": "employee", $insert: {name: "Ashu", age: 25, city: "Hisar", languages: [
                    {lang: "Hindi", w: true, r: true},
                    {lang: "English", w: true, r: true}
                ]}};
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "employee"});
            }).then(
            function (data) {
//            writelog("Data >> " + JSON.stringify(data));
                recordID = data.result[0]._id;
                var update = {$collection: "employee", $update: [
                    {_id: recordID, $set: {languages: {$insert: [
                        {lang: "Urdu", w: false, r: true}
                    ]}}}
                ]};
                return db.update(update);
            }).then(
            function (updateData) {
                var update = {$collection: "employee", $update: [
                    {_id: recordID, $set: {languages: {$insert: [
                        {lang: "French", w: false, r: false}
                    ]}}}
                ]};
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "employee", $historyFields: true});
            }).then(
            function (data) {
//            writelog("Data >>  " + JSON.stringify(data));
                expect(data.result[0].languages).to.have.length(4);
                expect(data.result[0].languages[2].lang).to.eql("Urdu");
                expect(data.result[0].languages[3].lang).to.eql("French");
                expect(data.result[0].__history.history).to.have.length(2);
                expect(data.result[0].__history.history[0].languages[0]._id).to.eql(data.result[0].languages[2]._id);
                expect(data.result[0].__history.history[1].languages[0]._id).to.eql(data.result[0].languages[3]._id);
                done();
            }).catch(function (e) {
                done(e);
            });
    });

    it("__history test update -  array update in multiple", function (done) {
        var db = undefined;
        var recordID;
        var frenchId;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = {"$collection": "employee", $insert: {name: "Ashu", age: 25, city: "Hisar", languages: [
                    {lang: "Hindi", w: true, r: true},
                    {lang: "French", w: false, r: true},
                    {lang: "English", w: true, r: true}
                ]}};
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "employee"});
            }).then(
            function (data) {
//            writelog("Data >> " + JSON.stringify(data));
                frenchId = data.result[0].languages[1]._id;
                recordID = data.result[0]._id;
                var update = {$collection: "employee", $update: [
                    {_id: recordID, $set: {languages: {$update: [
                        {_id: frenchId, $set: {w: true}}
                    ]}}}
                ]};
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "employee", $historyFields: true});
            }).then(
            function (data) {
//            writelog("Data >>  " + JSON.stringify(data));
                expect(data.result[0].languages).to.have.length(3);
                expect(data.result[0].languages[0].lang).to.eql("Hindi");
                expect(data.result[0].languages[1].lang).to.eql("French");
                expect(data.result[0].__history.history).to.have.length(1);
                expect(data.result[0].__history.history[0].languages[0].w).to.eql(false);
            }).then(
            function () {
                done();
            }).catch(function (e) {
                done(e);
            });
    });

    it("__history test update -  array delete in multiple)", function (done) {
        var db = undefined;
        var recordID;
        var hindiId;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = {"$collection": "employee", $insert: {name: "Ashu", age: 25, city: "Hisar", languages: [
                    {lang: "Hindi", w: true, r: true},
                    {lang: "French", w: false, r: true},
                    {lang: "English", w: true, r: true}
                ]}};
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "employee"});
            }).then(
            function (data) {
//            writelog("Data >> " + JSON.stringify(data));
                hindiId = data.result[0].languages[0]._id;
                recordID = data.result[0]._id;
                var update = {$collection: "employee", $update: [
                    {_id: recordID, $set: {languages: {$delete: [
                        {_id: hindiId}
                    ]}}}
                ]};
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "employee", $historyFields: true});
            }).then(
            function (data) {
//            writelog("Data >>  " + JSON.stringify(data));
                expect(data.result[0].languages).to.have.length(2);
                expect(data.result[0].languages[0].lang).to.eql("French");
                expect(data.result[0].languages[1].lang).to.eql("English");
                expect(data.result[0].__history.history).to.have.length(1);
                expect(data.result[0].__history.history[0].languages[0].lang).to.eql("Hindi");
                expect(data.result[0].__history.history[0].languages[0].w).to.eql(true);
                expect(data.result[0].__history.history[0].languages[0].r).to.eql(true);
                expect(data.result[0].__history.history[0].languages[0].__type).to.eql("delete");
            }).then(
            function () {
                done();
            }).catch(function (e) {
                done(e);
            });
    });

    it("__history test update -  array nested insert in multiple", function (done) {
        var db = undefined;
        var recordID;
        var frenchId;
        var level2Id;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = {"$collection": "employee", $insert: {name: "Ashu", age: 25, city: "Hisar", languages: [
                    {lang: "Hindi", w: true, r: true},
                    {lang: "French", w: false, r: true, courses: [
                        {name: "level1", duration: "15 hrs"},
                        {name: "level2", duration: "20 hrs"}
                    ]},
                    {lang: "English", w: true, r: true}
                ]}};
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "employee"});
            }).then(
            function (data) {
                recordID = data.result[0]._id;
//            writelog("Data >> " + JSON.stringify(data));
                level2Id = data.result[0].languages[1].courses[1]._id;
                frenchId = data.result[0].languages[1]._id;
                var update = {$collection: "employee", $update: [
                    {_id: recordID, $set: {languages: {$update: [
                        {_id: frenchId, $set: {courses: {$insert: [
                            {name: "level3", duration: "25 hrs"}
                        ]}}}
                    ]}}}
                ]};
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "employee", $historyFields: true});
            }).then(
            function (data) {
//            writelog("Data >>  " + JSON.stringify(data));
                expect(data.result[0].languages).to.have.length(3);
                expect(data.result[0].languages[1].lang).to.eql("French");
                expect(data.result[0].languages[1].courses).to.have.length(3);
                expect(data.result[0].languages[1].courses[2].name).to.eql("level3");
                expect(data.result[0].languages[1].courses[2].duration).to.eql("25 hrs");
                expect(data.result[0].__history.history).to.have.length(1);
                expect(data.result[0].__history.history[0]).to.have.property("languages");
                expect(data.result[0].__history.history[0].languages[0]).to.have.property("courses");
                expect(data.result[0].__history.history[0].languages[0].courses[0]._id).to.eql(data.result[0].languages[1].courses[2]._id);
                expect(data.result[0].__history.history[0].languages[0].courses[0].__type).to.eql("insert");
            }).then(
            function () {
                done();
            }).catch(function (e) {
                done(e);
            });
    });

    it("__history test update -  array nested update in multiple", function (done) {
        var db = undefined;
        var recordID;
        var frenchId;
        var level2Id;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = {"$collection": "employee", $insert: {name: "Ashu", age: 25, city: "Hisar", languages: [
                    {lang: "Hindi", w: true, r: true},
                    {lang: "French", w: false, r: true, courses: [
                        {name: "level1", duration: "15 hrs"},
                        {name: "level2", duration: "25 hrs"}
                    ]},
                    {lang: "English", w: true, r: true}
                ]}};
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "employee"});
            }).then(
            function (data) {
                recordID = data.result[0]._id;
//            writelog("Data >> " + JSON.stringify(data));
                level2Id = data.result[0].languages[1].courses[1]._id;
                frenchId = data.result[0].languages[1]._id;
                var update = {$collection: "employee", $update: [
                    {_id: recordID, $set: {languages: {$update: [
                        {_id: frenchId, $set: {courses: {$update: [
                            {_id: level2Id, $set: {duration: "20 hrs"}}
                        ]}}}
                    ]}}}
                ]};
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "employee", $historyFields: true});
            }).then(
            function (data) {
//            writelog("Data >>  " + JSON.stringify(data));
                expect(data.result[0].languages).to.have.length(3);
                expect(data.result[0].languages[1].lang).to.eql("French");
                expect(data.result[0].languages[1].courses).to.have.length(2);
                expect(data.result[0].languages[1].courses[1].duration).to.eql("20 hrs");
                expect(data.result[0].__history.history).to.have.length(1);
                expect(data.result[0].__history.history[0]).to.have.property("languages");
                expect(data.result[0].__history.history[0].languages[0]).to.have.property("courses");
                expect(data.result[0].__history.history[0].languages[0].courses[0]).to.have.property("duration");
                expect(data.result[0].__history.history[0].languages[0].courses[0].duration).to.eql("25 hrs");
            }).then(
            function () {
                done();
            }).catch(function (e) {
                done(e);
            });
    });

    it("__history test update -  array nested delete in multiple", function (done) {
        var db = undefined;
        var recordID;
        var frenchId;
        var level2Id;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = {"$collection": "employee", $insert: {name: "Ashu", age: 25, city: "Hisar", languages: [
                    {lang: "Hindi", w: true, r: true},
                    {lang: "French", w: false, r: true, courses: [
                        {name: "level1", duration: "15 hrs"},
                        {name: "level2", duration: "25 hrs"}
                    ]},
                    {lang: "English", w: true, r: true}
                ]}};
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection: "employee"});
            }).then(
            function (data) {
                recordID = data.result[0]._id;
//            writelog("Data >> " + JSON.stringify(data));
                level2Id = data.result[0].languages[1].courses[1]._id;
                frenchId = data.result[0].languages[1]._id;
                var update = {$collection: "employee", $update: [
                    {_id: recordID, $set: {languages: {$update: [
                        {_id: frenchId, $set: {courses: {$delete: [
                            {_id: level2Id}
                        ]}}}
                    ]}}}
                ]};
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "employee", $historyFields: true});
            }).then(
            function (data) {
//            writelog("Data >>  " + JSON.stringify(data));
                expect(data.result[0].languages).to.have.length(3);
                expect(data.result[0].languages[1].lang).to.eql("French");
                expect(data.result[0].languages[1].courses).to.have.length(1);
                expect(data.result[0].languages[1].courses[0].duration).to.eql("15 hrs");
                expect(data.result[0].__history.history).to.have.length(1);
                expect(data.result[0].__history.history[0]).to.have.property("languages");
                expect(data.result[0].__history.history[0].languages[0]).to.have.property("courses");
                expect(data.result[0].__history.history[0].languages[0].courses[0]).to.have.property("duration");
                expect(data.result[0].__history.history[0].languages[0].courses[0].duration).to.eql("25 hrs");
                expect(data.result[0].__history.history[0].languages[0].courses[0]).to.have.property("name");
                expect(data.result[0].__history.history[0].languages[0].courses[0].name).to.eql("level2");
                expect(data.result[0].__history.history[0].languages[0].courses[0].__type).to.eql("delete");
                expect(data.result[0].__history.history[0].languages[0].courses[0]._id).to.eql(level2Id);
            }).then(
            function () {
                done();
            }).catch(function (e) {
                done(e);
            });
    });

});


describe("historylogs testcases primary column fk case", function () {

    var collectionsToRegister = [

        {collection: "historyCheck", historyEnabled: true, fields: [
            {label: "Owner", primary: true, field: "ownerid", type: "fk", collection: "eemployees", collectionid: {$query: {collection: "historyCheck"}}, displayField: "ename", set: ["ename"]}
        ]},
        {collection: "eemployees", fields: [
            {field: "ename", type: "string"}
        ]}
    ];

    before(function (done) {
        ApplaneDB.registerCollection(collectionsToRegister).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    });
    after(function (done) {
        ApplaneDB.removeCollections(["eemployees", "historyCheck"]);
        done();
    });
    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });

    it('__history testcase ui primary fk case', function (done) {
        var db = undefined;
        var lastUpdatedOn = undefined;
        var lastUpdatedById = undefined;
        var insertId = undefined;
        var innerId = undefined;
        var stateId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection: "eemployees", $insert: [
                    {"ename": "Ashu"},
                    {"ename": "Ritesh"}
                ]});
            }).then(
            function () {
                return db.update({$collection: "historyCheck", $insert: [
                    {ownerid: {$query: {ename: "Ashu"}}}
                ]});

            }).then(function (updateData) {
                insertId = updateData["historyCheck"].$insert[0]._id;
            }).then(
            function () {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});

            }).then(
            function (queryData) {
                var result = queryData.result;
                expect(result).to.have.length(1);
                expect(result[0].message).to.eql("Record created for (Owner : Ashu).")
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });
});

function writelog(message) {
//    console.log(message);
}

describe("historylogs testcases ui", function () {

    var collectionsToRegister = [

        {collection: "historyCheck", historyEnabled: true, fields: [
            {label: "Name", field: "name", type: "string"},
            {label: "String Multiple", field: "stringMultiple", muiltiple: true, type: "string", options: ["first", "second", "third"]},
            {label: "Age", field: "age", type: "number"},
            {label: "Sequence", field: "sequenceType", type: "sequence"},
            {label: "Address", field: "address", type: "object", fields: [
                {label: "City", field: "city", type: "string" },
                {label: "State", field: "state", type: "string" }
            ]},
            {label: "Country Details", field: "countryDetails", type: "object", multiple: true, fields: [
                {label: "City", field: "city", type: "string" },
                {label: "Country", field: "country", type: "string" },
                {label: "State Details", field: "stateDetails", type: "object", multiple: true, fields: [
                    {label: "State 1", field: "state1", type: "string" },
                    {label: "State 2", field: "state2", type: "string" }
                ]}
            ]},
            {field: "jsonType", label: "JSON", type: "json"},
            {label: "Department Details", field: "departmentDetails", type: "object", multiple: true, fields: [
                {label: "City", field: "city", primary: true, type: "string" },
                {label: "Country", field: "country", type: "string" },
                {label: "State Details", field: "stateDetails", type: "object", multiple: true, fields: [
                    {label: "State 1", primary: true, field: "state1", type: "string" },
                    {label: "State 2", field: "state2", type: "string" }
                ]}
            ]},
            {label: "Currency", field: "currencyCheck", type: "currency", fields: [
                {label: "Amount", field: "amount", type: "number"},
                {label: "Type", field: "type", type: "fk", collection: "pl.currencies", collectionid: {$query: {collection: "historyCheck"}}, displayField: "currency", set: ["currency"]}
            ]},
            {label: "Duration", field: "durationCheck", type: "duration", fields: [
                {label: "Time", field: "time", type: "string"},
                {label: "Unit", field: "unit", type: "string"}
            ]},
            {label: "Unit", field: "unitCheck", type: "unit", fields: [
                {label: "Quantity", field: "quantity", type: "string"},
                {label: "Unit", field: "unit", type: "fk", collection: "pl.units", collectionid: {$query: {collection: "historyCheck"}}, displayField: "unit", set: ["unit"]}
            ]},
            {label: "Reporting To", field: "reportingTo", type: "fk", multiple: true, collection: "eemployees", collectionid: {$query: {collection: "historyCheck"}}, displayField: "ename", set: ["ename"]},
            {label: "Sibling", field: "sibling", type: "fk", collection: "eemployees", collectionid: {$query: {collection: "historyCheck"}}, displayField: "ename", set: ["ename"]}
        ]},
        {collection: "eemployees", fields: [
            {field: "ename", type: "string"}
        ]}
    ];

    before(function (done) {
        ApplaneDB.registerCollection(collectionsToRegister).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    });
    after(function (done) {
        ApplaneDB.removeCollections(["eemployees", "historyCheck"]);
        done();
    });
    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });

    it('__history testcase ui', function (done) {
        var db = undefined;
        var lastUpdatedOn = undefined;
        var lastUpdatedById = undefined;
        var insertId = undefined;
        var innerId = undefined;
        var stateId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection: "eemployees", $insert: [
                    {"ename": "Ashu"},
                    {"ename": "Manjit"},
                    {"ename": "Sachin"},
                    {"ename": "Naveen"},
                    {"ename": "Rajit"},
                    {"ename": "Ritesh"}
                ]});
            }).then(
            function () {
                return db.update({$collection: "historyCheck", $insert: [
                    {name: "r"}
                ]});

            }).then(function (updateData) {
                insertId = updateData["historyCheck"].$insert[0]._id;
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {age: 15, address: {$set: {city: "hisar", state: "haryana"}}}}
                ]});
            }).then(
            function () {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});

            }).then(
            function (queryData) {
                var result = queryData.result;
                expect(result).to.have.length(4);
                expect(result[0].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[1].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[2].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[3].message).to.eql("Record created .")

                writelog("first expect..")
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {age: 16, address: {$set: {city: "hisara", state: "haryanaa"}}}}
                ]});
            }).then(
            function () {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});
            }).then(function (queryData) {
                var result = queryData.result;
                expect(result).to.have.length(7);
                expect(result[0].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[1].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[2].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[3].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[4].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[5].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[6].message).to.eql("Record created .")
                writelog("second....")

                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {age: null, address: {$set: {city: "", state: ""}}}}
                ]});
            }).then(function () {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});
            }).then(function (queryData) {
                var result = queryData.result;
                expect(result).to.have.length(10);
                expect(result[0].message).to.eql("<b>Age</b> changed from <b>16</b> to <b>No value</b>.")
                expect(result[1].message).to.eql("<b>City</b> changed from <b>hisara</b> to <b>No value</b>.")
                expect(result[2].message).to.eql("<b>State</b> changed from <b>haryanaa</b> to <b>No value</b>.")
                expect(result[3].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[4].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[5].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[6].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[7].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[8].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[9].message).to.eql("Record created .")
                writelog("third.....");
            }).then(function () {
                return db.update({$collection: "pl.currencies", $insert: [
                    {currency: "INR"},
                    {currency: "USD"}
                ]})
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {currencyCheck: {amount: 100, type: {$query: {currency: "INR"}}}}}
                ]});
            }).then(function () {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});
            }).then(function (queryData) {
                var result = queryData.result;
                expect(result).to.have.length(11);
                expect(result[0].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 INR</b>.")
                expect(result[1].message).to.eql("<b>Age</b> changed from <b>16</b> to <b>No value</b>.")
                expect(result[2].message).to.eql("<b>City</b> changed from <b>hisara</b> to <b>No value</b>.")
                expect(result[3].message).to.eql("<b>State</b> changed from <b>haryanaa</b> to <b>No value</b>.")
                expect(result[4].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[5].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[6].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[7].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[8].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[9].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[10].message).to.eql("Record created .")
                writelog("fourth.....");
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {currencyCheck: {amount: 102, type: {$query: {currency: "USD"}}}}}
                ]});
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {currencyCheck: {amount: 102, type: {$query: {currency: "INR"}}}}}
                ]});
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $unset: {currencyCheck: ""}}
                ]});
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {age: 220, currencyCheck: {amount: 100, type: {$query: {currency: "USD"}}}}}
                ]});
            }).then(function () {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});
            }).then(function (queryData) {
                var result = queryData.result;
                expect(result).to.have.length(16);
                expect(result[0].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>220</b>.");
                expect(result[1].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 USD</b>.");
                expect(result[2].message).to.eql("<b>Currency</b> changed from <b>102.00 INR</b> to <b>No value</b>.")
                expect(result[3].message).to.eql("<b>Currency</b> changed from <b>102.00 USD</b> to <b>102.00 INR</b>.")
                expect(result[4].message).to.eql("<b>Currency</b> changed from <b>100.00 INR</b> to <b>102.00 USD</b>.")
                expect(result[5].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 INR</b>.")
                expect(result[6].message).to.eql("<b>Age</b> changed from <b>16</b> to <b>No value</b>.")
                expect(result[7].message).to.eql("<b>City</b> changed from <b>hisara</b> to <b>No value</b>.")
                expect(result[8].message).to.eql("<b>State</b> changed from <b>haryanaa</b> to <b>No value</b>.")
                expect(result[9].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[10].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[11].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[12].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[13].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[14].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[15].message).to.eql("Record created .")
                writelog("fifth...")
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {reportingTo: [
                        {$query: {ename: "Ashu"}},
                        {$query: {ename: "Sachin"}}
                    ]}}
                ]})
            }).then(function () {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});

            }).then(function (queryData) {
                var result = queryData.result;
                expect(result).to.have.length(18);
                expect(result[0].message).to.eql("<b>Reporting To</b> (ename:Ashu) added.");
                expect(result[1].message).to.eql("<b>Reporting To</b> (ename:Sachin) added.");
                expect(result[2].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>220</b>.");
                expect(result[3].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 USD</b>.");
                expect(result[4].message).to.eql("<b>Currency</b> changed from <b>102.00 INR</b> to <b>No value</b>.")
                expect(result[5].message).to.eql("<b>Currency</b> changed from <b>102.00 USD</b> to <b>102.00 INR</b>.")
                expect(result[6].message).to.eql("<b>Currency</b> changed from <b>100.00 INR</b> to <b>102.00 USD</b>.")
                expect(result[7].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 INR</b>.")
                expect(result[8].message).to.eql("<b>Age</b> changed from <b>16</b> to <b>No value</b>.")
                expect(result[9].message).to.eql("<b>City</b> changed from <b>hisara</b> to <b>No value</b>.")
                expect(result[10].message).to.eql("<b>State</b> changed from <b>haryanaa</b> to <b>No value</b>.")
                expect(result[11].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[12].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[13].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[14].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[15].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[16].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[17].message).to.eql("Record created .")
                writelog("sixth...")
            }).then(function () {

                //how to unset an array fk field--here i have to unset sachin (ashu,sachin-->result is ashu)
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {reportingTo: [
                        {$query: {ename: "Ashu"}}
                    ]}}
                ]})

            }).then(function () {
                //i have to set naveen,manjit and remove ashu
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {reportingTo: [
                        {$query: {ename: "Manjit"}},
                        {$query: {ename: "Naveen"}}
                    ]}}
                ]})
            }).then(function (queryData) {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});

            }).then(function (queryData) {
                var result = queryData.result;
                expect(result).to.have.length(22);
                expect(result[0].message).to.eql("<b>Reporting To</b> (ename:Ashu) deleted.");
                expect(result[1].message).to.eql("<b>Reporting To</b> (ename:Manjit) added.");
                expect(result[2].message).to.eql("<b>Reporting To</b> (ename:Naveen) added.");
                expect(result[3].message).to.eql("<b>Reporting To</b> (ename:Sachin) deleted.");
                expect(result[4].message).to.eql("<b>Reporting To</b> (ename:Ashu) added.");
                expect(result[5].message).to.eql("<b>Reporting To</b> (ename:Sachin) added.");
                expect(result[6].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>220</b>.");
                expect(result[7].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 USD</b>.");
                expect(result[8].message).to.eql("<b>Currency</b> changed from <b>102.00 INR</b> to <b>No value</b>.")
                expect(result[9].message).to.eql("<b>Currency</b> changed from <b>102.00 USD</b> to <b>102.00 INR</b>.")
                expect(result[10].message).to.eql("<b>Currency</b> changed from <b>100.00 INR</b> to <b>102.00 USD</b>.")
                expect(result[11].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 INR</b>.")
                expect(result[12].message).to.eql("<b>Age</b> changed from <b>16</b> to <b>No value</b>.")
                expect(result[13].message).to.eql("<b>City</b> changed from <b>hisara</b> to <b>No value</b>.")
                expect(result[14].message).to.eql("<b>State</b> changed from <b>haryanaa</b> to <b>No value</b>.")
                expect(result[15].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[16].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[17].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[18].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[19].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[20].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[21].message).to.eql("Record created .")
                writelog("seventh...")

            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {age: 225, currencyCheck: {amount: 120, type: {$query: {currency: "INR"}}}, address: {$set: {city: "Hisar"}}, durationCheck: {time: 120, unit: "Hrs"}}}
                ]})
            }).then(function (queryData) {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});

            }).then(function (queryData) {
                var result = queryData.result;
                expect(result).to.have.length(26);
                expect(result[0].message).to.eql("<b>Age</b> changed from <b>220</b> to <b>225</b>.");
                expect(result[1].message).to.eql("<b>Currency</b> changed from <b>100.00 USD</b> to <b>120.00 INR</b>.");
                expect(result[2].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>Hisar</b>.");
                expect(result[3].message).to.eql("<b>Duration</b> changed from <b>No value</b> to <b>120 Hrs</b>.");
                expect(result[4].message).to.eql("<b>Reporting To</b> (ename:Ashu) deleted.");
                expect(result[5].message).to.eql("<b>Reporting To</b> (ename:Manjit) added.");
                expect(result[6].message).to.eql("<b>Reporting To</b> (ename:Naveen) added.");
                expect(result[7].message).to.eql("<b>Reporting To</b> (ename:Sachin) deleted.");
                expect(result[8].message).to.eql("<b>Reporting To</b> (ename:Ashu) added.");
                expect(result[9].message).to.eql("<b>Reporting To</b> (ename:Sachin) added.");
                expect(result[10].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>220</b>.");
                expect(result[11].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 USD</b>.");
                expect(result[12].message).to.eql("<b>Currency</b> changed from <b>102.00 INR</b> to <b>No value</b>.")
                expect(result[13].message).to.eql("<b>Currency</b> changed from <b>102.00 USD</b> to <b>102.00 INR</b>.")
                expect(result[14].message).to.eql("<b>Currency</b> changed from <b>100.00 INR</b> to <b>102.00 USD</b>.")
                expect(result[15].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 INR</b>.")
                expect(result[16].message).to.eql("<b>Age</b> changed from <b>16</b> to <b>No value</b>.")
                expect(result[17].message).to.eql("<b>City</b> changed from <b>hisara</b> to <b>No value</b>.")
                expect(result[18].message).to.eql("<b>State</b> changed from <b>haryanaa</b> to <b>No value</b>.")
                expect(result[19].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[20].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[21].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[22].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[23].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[24].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[25].message).to.eql("Record created .")


                writelog("eighth...")

            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {countryDetails: [
                        {city: "city", country: "country"}
                    ] }}
                ]})

            }).then(function () {
                return db.query({$collection: "historyCheck" })
            }).then(function (queryData) {
                innerId = queryData.result[0].countryDetails[0]._id;
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {countryDetails: { $update: [
                        {_id: innerId, $set: {stateDetails: [
                            {state1: "state1", state2: "state2"}
                        ]}}
                    ]}}}
                ]})
            }).then(function () {
                return db.query({$collection: "historyCheck" })
            }).then(function (queryData) {
                stateId = queryData.result[0].countryDetails[0].stateDetails[0]._id;
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {countryDetails: { $update: [
                        {_id: innerId, $set: {city: "newCity", country: "newCountry" }}
                    ]}}}
                ]})
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {countryDetails: { $update: [
                        {_id: innerId, $set: {stateDetails: {$update: [
                            {_id: stateId, $set: {state1: "newState1", state2: "newState2"}}
                        ]}}}
                    ]}}}
                ]})
            }).then(function () {
                return db.query({$collection: "historyCheck" })
            }).then(function (queryData) {
                //state details deleted...
                stateId = queryData.result[0].countryDetails[0].stateDetails[0]._id;
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {countryDetails: { $update: [
                        {_id: innerId, $set: {stateDetails: {$delete: [
                            {_id: stateId}
                        ]}}}
                    ]}}}
                ]})
            }).then(function () {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});

            }).then(function (queryData) {
                var result = queryData.result;
                expect(result).to.have.length(33);
                expect(result[0].message).to.eql("<b>Country Details</b> (0)--><b>State Details</b> deleted.");
                expect(result[1].message).to.eql("<b>Country Details</b> (0)--><b>State Details</b>--> <b>State 1</b> changed from <b>state1</b> to <b>newState1</b>.");
                expect(result[2].message).to.eql("<b>Country Details</b> (0)--><b>State Details</b>--> <b>State 2</b> changed from <b>state2</b> to <b>newState2</b>.");
                expect(result[3].message).to.eql("<b>Country Details</b> (0)--> <b>City</b> changed from <b>city</b> to <b>newCity</b>.");
                expect(result[4].message).to.eql("<b>Country Details</b> (0)--> <b>Country</b> changed from <b>country</b> to <b>newCountry</b>.");
                expect(result[5].message).to.eql("<b>Country Details</b> (0)--><b>State Details</b> added.");
                expect(result[6].message).to.eql("<b>Country Details</b> (0) added.");
                expect(result[7].message).to.eql("<b>Age</b> changed from <b>220</b> to <b>225</b>.");
                expect(result[8].message).to.eql("<b>Currency</b> changed from <b>100.00 USD</b> to <b>120.00 INR</b>.");
                expect(result[9].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>Hisar</b>.");
                expect(result[10].message).to.eql("<b>Duration</b> changed from <b>No value</b> to <b>120 Hrs</b>.");
                expect(result[11].message).to.eql("<b>Reporting To</b> (ename:Ashu) deleted.");
                expect(result[12].message).to.eql("<b>Reporting To</b> (ename:Manjit) added.");
                expect(result[13].message).to.eql("<b>Reporting To</b> (ename:Naveen) added.");
                expect(result[14].message).to.eql("<b>Reporting To</b> (ename:Sachin) deleted.");
                expect(result[15].message).to.eql("<b>Reporting To</b> (ename:Ashu) added.");
                expect(result[16].message).to.eql("<b>Reporting To</b> (ename:Sachin) added.");
                expect(result[17].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>220</b>.");
                expect(result[18].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 USD</b>.");
                expect(result[19].message).to.eql("<b>Currency</b> changed from <b>102.00 INR</b> to <b>No value</b>.")
                expect(result[20].message).to.eql("<b>Currency</b> changed from <b>102.00 USD</b> to <b>102.00 INR</b>.")
                expect(result[21].message).to.eql("<b>Currency</b> changed from <b>100.00 INR</b> to <b>102.00 USD</b>.")
                expect(result[22].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 INR</b>.")
                expect(result[23].message).to.eql("<b>Age</b> changed from <b>16</b> to <b>No value</b>.")
                expect(result[24].message).to.eql("<b>City</b> changed from <b>hisara</b> to <b>No value</b>.")
                expect(result[25].message).to.eql("<b>State</b> changed from <b>haryanaa</b> to <b>No value</b>.")
                expect(result[26].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[27].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[28].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[29].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[30].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[31].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[32].message).to.eql("Record created .")
                writelog("ninth...")
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {countryDetails: {$insert: [
                        {city: "newSecondCity", country: "newSecondCountry"}
                    ], $delete: [
                        {_id: innerId}
                    ]}}}
                ]})

            }).then(function () {
                return db.query({$collection: "historyCheck"})
            }).then(function (queryData) {
                innerId = queryData.result[0].countryDetails[0]._id;
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {countryDetails: { $insert: [
                        {city: "newThirdCity", country: "newThirdCountry"}
                    ], $update: [
                        {_id: innerId, $set: {stateDetails: [
                            {state1: "state1", state2: "state2"}
                        ]}}
                    ]}}}
                ]})
            }).then(function () {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});
            }).then(function (queryData) {

                var result = queryData.result;
                expect(result).to.have.length(37);
                expect(result[0].message).to.eql("<b>Country Details</b> (0)--><b>State Details</b> (0) added.");
                expect(result[1].message).to.eql("<b>Country Details</b> (1) added.");
                expect(result[2].message).to.eql("<b>Country Details</b> deleted.");
                expect(result[3].message).to.eql("<b>Country Details</b> (0) added.");
                expect(result[4].message).to.eql("<b>Country Details</b>--><b>State Details</b> deleted.");
                expect(result[5].message).to.eql("<b>Country Details</b>--><b>State Details</b>--> <b>State 1</b> changed from <b>state1</b> to <b>newState1</b>.");
                expect(result[6].message).to.eql("<b>Country Details</b>--><b>State Details</b>--> <b>State 2</b> changed from <b>state2</b> to <b>newState2</b>.");
                expect(result[7].message).to.eql("<b>Country Details</b>--> <b>City</b> changed from <b>city</b> to <b>newCity</b>.");
                expect(result[8].message).to.eql("<b>Country Details</b>--> <b>Country</b> changed from <b>country</b> to <b>newCountry</b>.");
                expect(result[9].message).to.eql("<b>Country Details</b>--><b>State Details</b> added.");
                expect(result[10].message).to.eql("<b>Country Details</b> added.");
                expect(result[11].message).to.eql("<b>Age</b> changed from <b>220</b> to <b>225</b>.");
                expect(result[12].message).to.eql("<b>Currency</b> changed from <b>100.00 USD</b> to <b>120.00 INR</b>.");
                expect(result[13].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>Hisar</b>.");
                expect(result[14].message).to.eql("<b>Duration</b> changed from <b>No value</b> to <b>120 Hrs</b>.");
                expect(result[15].message).to.eql("<b>Reporting To</b> (ename:Ashu) deleted.");
                expect(result[16].message).to.eql("<b>Reporting To</b> (ename:Manjit) added.");
                expect(result[17].message).to.eql("<b>Reporting To</b> (ename:Naveen) added.");
                expect(result[18].message).to.eql("<b>Reporting To</b> (ename:Sachin) deleted.");
                expect(result[19].message).to.eql("<b>Reporting To</b> (ename:Ashu) added.");
                expect(result[20].message).to.eql("<b>Reporting To</b> (ename:Sachin) added.");
                expect(result[21].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>220</b>.");
                expect(result[22].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 USD</b>.");
                expect(result[23].message).to.eql("<b>Currency</b> changed from <b>102.00 INR</b> to <b>No value</b>.")
                expect(result[24].message).to.eql("<b>Currency</b> changed from <b>102.00 USD</b> to <b>102.00 INR</b>.")
                expect(result[25].message).to.eql("<b>Currency</b> changed from <b>100.00 INR</b> to <b>102.00 USD</b>.")
                expect(result[26].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 INR</b>.")
                expect(result[27].message).to.eql("<b>Age</b> changed from <b>16</b> to <b>No value</b>.")
                expect(result[28].message).to.eql("<b>City</b> changed from <b>hisara</b> to <b>No value</b>.")
                expect(result[29].message).to.eql("<b>State</b> changed from <b>haryanaa</b> to <b>No value</b>.")
                expect(result[30].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[31].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[32].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[33].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[34].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[35].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[36].message).to.eql("Record created .")
                writelog("tenth...")
            }).then(function () {
                return db.update({$collection: "pl.units", $insert: [
                    {unit: "INR"},
                    {unit: "USD"}
                ]})
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {sequenceType: 5, unitCheck: {quantity: 150, unit: {$query: {unit: "INR"}}}}}
                ]});
            }).then(function () {
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {sequenceType: 51, unitCheck: {quantity: 2550, unit: {$query: {unit: "USD"}}}}}
                ]});
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {sequenceType: 15, unitCheck: {quantity: 250, unit: {$query: {unit: "INR"}}}}}
                ]});
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {sequenceType: 45, unitCheck: ""}}
                ]});
            }).then(function (historyCheckData) {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});
            }).then(function (queryData) {
                var result = queryData.result;
                expect(result).to.have.length(45);
                expect(result[0].message).to.eql("<b>Sequence</b> changed from <b>15</b> to <b>45</b>.");
                expect(result[1].message).to.eql("<b>Unit</b> changed from <b>250 INR</b> to <b>No value</b>.");
                expect(result[2].message).to.eql("<b>Sequence</b> changed from <b>51</b> to <b>15</b>.");
                expect(result[3].message).to.eql("<b>Unit</b> changed from <b>2550 USD</b> to <b>250 INR</b>.");
                expect(result[4].message).to.eql("<b>Sequence</b> changed from <b>5</b> to <b>51</b>.");
                expect(result[5].message).to.eql("<b>Unit</b> changed from <b>150 INR</b> to <b>2550 USD</b>.");
                expect(result[6].message).to.eql("<b>Sequence</b> changed from <b>1</b> to <b>5</b>.");
                expect(result[7].message).to.eql("<b>Unit</b> changed from <b>No value</b> to <b>150 INR</b>.");

                expect(result[8].message).to.eql("<b>Country Details</b> (0)--><b>State Details</b> (0) added.");
                expect(result[9].message).to.eql("<b>Country Details</b> (1) added.");
                expect(result[10].message).to.eql("<b>Country Details</b> deleted.");
                expect(result[11].message).to.eql("<b>Country Details</b> (0) added.");
                expect(result[12].message).to.eql("<b>Country Details</b>--><b>State Details</b> deleted.");
                expect(result[13].message).to.eql("<b>Country Details</b>--><b>State Details</b>--> <b>State 1</b> changed from <b>state1</b> to <b>newState1</b>.");
                expect(result[14].message).to.eql("<b>Country Details</b>--><b>State Details</b>--> <b>State 2</b> changed from <b>state2</b> to <b>newState2</b>.");
                expect(result[15].message).to.eql("<b>Country Details</b>--> <b>City</b> changed from <b>city</b> to <b>newCity</b>.");
                expect(result[16].message).to.eql("<b>Country Details</b>--> <b>Country</b> changed from <b>country</b> to <b>newCountry</b>.");
                expect(result[17].message).to.eql("<b>Country Details</b>--><b>State Details</b> added.");
                expect(result[18].message).to.eql("<b>Country Details</b> added.");
                expect(result[19].message).to.eql("<b>Age</b> changed from <b>220</b> to <b>225</b>.");
                expect(result[20].message).to.eql("<b>Currency</b> changed from <b>100.00 USD</b> to <b>120.00 INR</b>.");
                expect(result[21].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>Hisar</b>.");
                expect(result[22].message).to.eql("<b>Duration</b> changed from <b>No value</b> to <b>120 Hrs</b>.");
                expect(result[23].message).to.eql("<b>Reporting To</b> (ename:Ashu) deleted.");
                expect(result[24].message).to.eql("<b>Reporting To</b> (ename:Manjit) added.");
                expect(result[25].message).to.eql("<b>Reporting To</b> (ename:Naveen) added.");
                expect(result[26].message).to.eql("<b>Reporting To</b> (ename:Sachin) deleted.");
                expect(result[27].message).to.eql("<b>Reporting To</b> (ename:Ashu) added.");
                expect(result[28].message).to.eql("<b>Reporting To</b> (ename:Sachin) added.");
                expect(result[29].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>220</b>.");
                expect(result[30].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 USD</b>.");
                expect(result[31].message).to.eql("<b>Currency</b> changed from <b>102.00 INR</b> to <b>No value</b>.")
                expect(result[32].message).to.eql("<b>Currency</b> changed from <b>102.00 USD</b> to <b>102.00 INR</b>.")
                expect(result[33].message).to.eql("<b>Currency</b> changed from <b>100.00 INR</b> to <b>102.00 USD</b>.")
                expect(result[34].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 INR</b>.")
                expect(result[35].message).to.eql("<b>Age</b> changed from <b>16</b> to <b>No value</b>.")
                expect(result[36].message).to.eql("<b>City</b> changed from <b>hisara</b> to <b>No value</b>.")
                expect(result[37].message).to.eql("<b>State</b> changed from <b>haryanaa</b> to <b>No value</b>.")
                expect(result[38].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[39].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[40].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[41].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[42].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[43].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[44].message).to.eql("Record created .")
                writelog("eleventh...")
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {departmentDetails: [
                        {city: "city", country: "country"}
                    ] }}
                ]})
            }).then(function () {
                return db.query({$collection: "historyCheck" })
            }).then(function (queryData) {
                innerId = queryData.result[0].departmentDetails[0]._id;
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {departmentDetails: { $update: [
                        {_id: innerId, $set: {stateDetails: [
                            {state1: "state1", state2: "state2"}
                        ]}}
                    ]}}}
                ]})
            }).then(function () {
                return db.query({$collection: "historyCheck" })
            }).then(function (queryData) {
                stateId = queryData.result[0].departmentDetails[0].stateDetails[0]._id;
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {departmentDetails: { $update: [
                        {_id: innerId, $set: {city: "newCity", country: "newCountry" }}
                    ]}}}
                ]})
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {departmentDetails: { $update: [
                        {_id: innerId, $set: {stateDetails: {$update: [
                            {_id: stateId, $set: {state1: "newState1", state2: "newState2"}}
                        ]}}}
                    ]}}}
                ]})
            }).then(function () {
                return db.query({$collection: "historyCheck" })
            }).then(function (queryData) {
                //state details deleted...
                stateId = queryData.result[0].departmentDetails[0].stateDetails[0]._id;
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {departmentDetails: { $update: [
                        {_id: innerId, $set: {stateDetails: {$delete: [
                            {_id: stateId}
                        ]}}}
                    ]}}}
                ]})
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {departmentDetails: {$insert: [
                        {city: "newSecondCity", country: "newSecondCountry"}
                    ], $delete: [
                        {_id: innerId}
                    ]}}}
                ]})

            }).then(function () {
                return db.query({$collection: "historyCheck"})
            }).then(function (queryData) {
                innerId = queryData.result[0].departmentDetails[0]._id;
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {departmentDetails: { $insert: [
                        {city: "newThirdCity", country: "newThirdCountry"}
                    ], $update: [
                        {_id: innerId, $set: {stateDetails: [
                            {state1: "state1", state2: "state2"}
                        ]}}
                    ]}}}
                ]})
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: {_id: insertId, $set: {jsonType: JSON.stringify({name: "r"})}}})
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: {_id: insertId, $set: {jsonType: JSON.stringify({name: "newR"})}}})
            }).then(function () {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});
            }).then(function (queryData) {

                var result = queryData.result;
                expect(result).to.have.length(58);
                expect(result[0].message).to.eql("<b>JSON</b> changed.")
                expect(result[1].message).to.eql("<b>JSON</b> changed.")
                expect(result[2].message).to.eql("<b>Department Details</b> (City:newSecondCity)--><b>State Details</b> (State 1:state1) added.");
                expect(result[3].message).to.eql("<b>Department Details</b> (City:newThirdCity) added.");
                expect(result[4].message).to.eql("<b>Department Details</b> (City:newCity) deleted.");
                expect(result[5].message).to.eql("<b>Department Details</b> (City:newSecondCity) added.");
                expect(result[6].message).to.eql("<b>Department Details</b> (City:newCity)--><b>State Details</b> (State 1:newState1) deleted.");
                expect(result[7].message).to.eql("<b>Department Details</b> (City:newCity)--><b>State Details</b> (State 1:newState1)--> <b>State 1</b> changed from <b>state1</b> to <b>newState1</b>.");
                expect(result[8].message).to.eql("<b>Department Details</b> (City:newCity)--><b>State Details</b> (State 1:newState1)--> <b>State 2</b> changed from <b>state2</b> to <b>newState2</b>.");
                expect(result[9].message).to.eql("<b>Department Details</b> (City:newCity)--> <b>City</b> changed from <b>city</b> to <b>newCity</b>.");
                expect(result[10].message).to.eql("<b>Department Details</b> (City:newCity)--> <b>Country</b> changed from <b>country</b> to <b>newCountry</b>.");
                expect(result[11].message).to.eql("<b>Department Details</b> (City:city)--><b>State Details</b> (State 1:state1) added.");
                expect(result[12].message).to.eql("<b>Department Details</b> (City:city) added.");

                expect(result[13].message).to.eql("<b>Sequence</b> changed from <b>15</b> to <b>45</b>.");
                expect(result[14].message).to.eql("<b>Unit</b> changed from <b>250 INR</b> to <b>No value</b>.");
                expect(result[15].message).to.eql("<b>Sequence</b> changed from <b>51</b> to <b>15</b>.");
                expect(result[16].message).to.eql("<b>Unit</b> changed from <b>2550 USD</b> to <b>250 INR</b>.");
                expect(result[17].message).to.eql("<b>Sequence</b> changed from <b>5</b> to <b>51</b>.");
                expect(result[18].message).to.eql("<b>Unit</b> changed from <b>150 INR</b> to <b>2550 USD</b>.");
                expect(result[19].message).to.eql("<b>Sequence</b> changed from <b>1</b> to <b>5</b>.");
                expect(result[20].message).to.eql("<b>Unit</b> changed from <b>No value</b> to <b>150 INR</b>.");

                expect(result[21].message).to.eql("<b>Country Details</b> (0)--><b>State Details</b> (0) added.");
                expect(result[22].message).to.eql("<b>Country Details</b> (1) added.");
                expect(result[23].message).to.eql("<b>Country Details</b> deleted.");
                expect(result[24].message).to.eql("<b>Country Details</b> (0) added.");
                expect(result[25].message).to.eql("<b>Country Details</b>--><b>State Details</b> deleted.");
                expect(result[26].message).to.eql("<b>Country Details</b>--><b>State Details</b>--> <b>State 1</b> changed from <b>state1</b> to <b>newState1</b>.");
                expect(result[27].message).to.eql("<b>Country Details</b>--><b>State Details</b>--> <b>State 2</b> changed from <b>state2</b> to <b>newState2</b>.");
                expect(result[28].message).to.eql("<b>Country Details</b>--> <b>City</b> changed from <b>city</b> to <b>newCity</b>.");
                expect(result[29].message).to.eql("<b>Country Details</b>--> <b>Country</b> changed from <b>country</b> to <b>newCountry</b>.");
                expect(result[30].message).to.eql("<b>Country Details</b>--><b>State Details</b> added.");
                expect(result[31].message).to.eql("<b>Country Details</b> added.");

                expect(result[32].message).to.eql("<b>Age</b> changed from <b>220</b> to <b>225</b>.");
                expect(result[33].message).to.eql("<b>Currency</b> changed from <b>100.00 USD</b> to <b>120.00 INR</b>.");
                expect(result[34].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>Hisar</b>.");
                expect(result[35].message).to.eql("<b>Duration</b> changed from <b>No value</b> to <b>120 Hrs</b>.");
                expect(result[36].message).to.eql("<b>Reporting To</b> (ename:Ashu) deleted.");
                expect(result[37].message).to.eql("<b>Reporting To</b> (ename:Manjit) added.");
                expect(result[38].message).to.eql("<b>Reporting To</b> (ename:Naveen) added.");
                expect(result[39].message).to.eql("<b>Reporting To</b> (ename:Sachin) deleted.");
                expect(result[40].message).to.eql("<b>Reporting To</b> (ename:Ashu) added.");
                expect(result[41].message).to.eql("<b>Reporting To</b> (ename:Sachin) added.");
                expect(result[42].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>220</b>.");
                expect(result[43].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 USD</b>.");
                expect(result[44].message).to.eql("<b>Currency</b> changed from <b>102.00 INR</b> to <b>No value</b>.")
                expect(result[45].message).to.eql("<b>Currency</b> changed from <b>102.00 USD</b> to <b>102.00 INR</b>.")
                expect(result[46].message).to.eql("<b>Currency</b> changed from <b>100.00 INR</b> to <b>102.00 USD</b>.")
                expect(result[47].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 INR</b>.")
                expect(result[48].message).to.eql("<b>Age</b> changed from <b>16</b> to <b>No value</b>.")
                expect(result[49].message).to.eql("<b>City</b> changed from <b>hisara</b> to <b>No value</b>.")
                expect(result[50].message).to.eql("<b>State</b> changed from <b>haryanaa</b> to <b>No value</b>.")
                expect(result[51].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[52].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[53].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[54].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[55].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[56].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[57].message).to.eql("Record created .")
                writelog("thirteenth...")
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: {_id: insertId, $set: {sibling: {$query: {ename: "Ashu"}}}}})
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: {_id: insertId, $set: {sibling: {$query: {ename: "Naveen"}}}}})
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: {_id: insertId, $unset: {sibling: ""}}})
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: {_id: insertId, $set: {sibling: {$query: {ename: "Sachin"}}}}})
            }).then(function () {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});
            }).then(function (queryData) {

                var result = queryData.result;
                expect(result).to.have.length(62);
                expect(result[0].message).to.eql("<b>Sibling</b> changed from <b>No value</b> to <b>Sachin</b>.")
                expect(result[1].message).to.eql("<b>Sibling</b> changed from <b>Naveen</b> to <b>No value</b>.")
                expect(result[2].message).to.eql("<b>Sibling</b> changed from <b>Ashu</b> to <b>Naveen</b>.")
                expect(result[3].message).to.eql("<b>Sibling</b> changed from <b>No value</b> to <b>Ashu</b>.")
                expect(result[4].message).to.eql("<b>JSON</b> changed.")
                expect(result[5].message).to.eql("<b>JSON</b> changed.")
                expect(result[6].message).to.eql("<b>Department Details</b> (City:newSecondCity)--><b>State Details</b> (State 1:state1) added.");
                expect(result[7].message).to.eql("<b>Department Details</b> (City:newThirdCity) added.");
                expect(result[8].message).to.eql("<b>Department Details</b> (City:newCity) deleted.");
                expect(result[9].message).to.eql("<b>Department Details</b> (City:newSecondCity) added.");
                expect(result[10].message).to.eql("<b>Department Details</b> (City:newCity)--><b>State Details</b> (State 1:newState1) deleted.");
                expect(result[11].message).to.eql("<b>Department Details</b> (City:newCity)--><b>State Details</b> (State 1:newState1)--> <b>State 1</b> changed from <b>state1</b> to <b>newState1</b>.");
                expect(result[12].message).to.eql("<b>Department Details</b> (City:newCity)--><b>State Details</b> (State 1:newState1)--> <b>State 2</b> changed from <b>state2</b> to <b>newState2</b>.");
                expect(result[13].message).to.eql("<b>Department Details</b> (City:newCity)--> <b>City</b> changed from <b>city</b> to <b>newCity</b>.");
                expect(result[14].message).to.eql("<b>Department Details</b> (City:newCity)--> <b>Country</b> changed from <b>country</b> to <b>newCountry</b>.");
                expect(result[15].message).to.eql("<b>Department Details</b> (City:city)--><b>State Details</b> (State 1:state1) added.");
                expect(result[16].message).to.eql("<b>Department Details</b> (City:city) added.");

                expect(result[17].message).to.eql("<b>Sequence</b> changed from <b>15</b> to <b>45</b>.");
                expect(result[18].message).to.eql("<b>Unit</b> changed from <b>250 INR</b> to <b>No value</b>.");
                expect(result[19].message).to.eql("<b>Sequence</b> changed from <b>51</b> to <b>15</b>.");
                expect(result[20].message).to.eql("<b>Unit</b> changed from <b>2550 USD</b> to <b>250 INR</b>.");
                expect(result[21].message).to.eql("<b>Sequence</b> changed from <b>5</b> to <b>51</b>.");
                expect(result[22].message).to.eql("<b>Unit</b> changed from <b>150 INR</b> to <b>2550 USD</b>.");
                expect(result[23].message).to.eql("<b>Sequence</b> changed from <b>1</b> to <b>5</b>.");
                expect(result[24].message).to.eql("<b>Unit</b> changed from <b>No value</b> to <b>150 INR</b>.");

                expect(result[25].message).to.eql("<b>Country Details</b> (0)--><b>State Details</b> (0) added.");
                expect(result[26].message).to.eql("<b>Country Details</b> (1) added.");
                expect(result[27].message).to.eql("<b>Country Details</b> deleted.");
                expect(result[28].message).to.eql("<b>Country Details</b> (0) added.");
                expect(result[29].message).to.eql("<b>Country Details</b>--><b>State Details</b> deleted.");
                expect(result[30].message).to.eql("<b>Country Details</b>--><b>State Details</b>--> <b>State 1</b> changed from <b>state1</b> to <b>newState1</b>.");
                expect(result[31].message).to.eql("<b>Country Details</b>--><b>State Details</b>--> <b>State 2</b> changed from <b>state2</b> to <b>newState2</b>.");
                expect(result[32].message).to.eql("<b>Country Details</b>--> <b>City</b> changed from <b>city</b> to <b>newCity</b>.");
                expect(result[33].message).to.eql("<b>Country Details</b>--> <b>Country</b> changed from <b>country</b> to <b>newCountry</b>.");
                expect(result[34].message).to.eql("<b>Country Details</b>--><b>State Details</b> added.");
                expect(result[35].message).to.eql("<b>Country Details</b> added.");

                expect(result[36].message).to.eql("<b>Age</b> changed from <b>220</b> to <b>225</b>.");
                expect(result[37].message).to.eql("<b>Currency</b> changed from <b>100.00 USD</b> to <b>120.00 INR</b>.");
                expect(result[38].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>Hisar</b>.");
                expect(result[39].message).to.eql("<b>Duration</b> changed from <b>No value</b> to <b>120 Hrs</b>.");
                expect(result[40].message).to.eql("<b>Reporting To</b> (ename:Ashu) deleted.");
                expect(result[41].message).to.eql("<b>Reporting To</b> (ename:Manjit) added.");
                expect(result[42].message).to.eql("<b>Reporting To</b> (ename:Naveen) added.");
                expect(result[43].message).to.eql("<b>Reporting To</b> (ename:Sachin) deleted.");
                expect(result[44].message).to.eql("<b>Reporting To</b> (ename:Ashu) added.");
                expect(result[45].message).to.eql("<b>Reporting To</b> (ename:Sachin) added.");
                expect(result[46].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>220</b>.");
                expect(result[47].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 USD</b>.");
                expect(result[48].message).to.eql("<b>Currency</b> changed from <b>102.00 INR</b> to <b>No value</b>.")
                expect(result[49].message).to.eql("<b>Currency</b> changed from <b>102.00 USD</b> to <b>102.00 INR</b>.")
                expect(result[50].message).to.eql("<b>Currency</b> changed from <b>100.00 INR</b> to <b>102.00 USD</b>.")
                expect(result[51].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 INR</b>.")
                expect(result[52].message).to.eql("<b>Age</b> changed from <b>16</b> to <b>No value</b>.")
                expect(result[53].message).to.eql("<b>City</b> changed from <b>hisara</b> to <b>No value</b>.")
                expect(result[54].message).to.eql("<b>State</b> changed from <b>haryanaa</b> to <b>No value</b>.")
                expect(result[55].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[56].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[57].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[58].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[59].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[60].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[61].message).to.eql("Record created .")
                writelog("fourteenth...")
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: {_id: insertId, $set: {stringMultiple: ["first", "second"]}}})
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: {_id: insertId, $set: {stringMultiple: ["first", "third"]}}})
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: {_id: insertId, $set: {stringMultiple: ["second"]}}})
            }).then(function () {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId}});
            }).then(function (queryData) {

                var result = queryData.result;
                expect(result).to.have.length(65);

                expect(result[0].message).to.eql("<b>String Multiple</b> changed from <b>first,third</b> to <b>second</b>.")
                expect(result[1].message).to.eql("<b>String Multiple</b> changed from <b>first,second</b> to <b>first,third</b>.")
                expect(result[2].message).to.eql("<b>String Multiple</b> changed from <b>No value</b> to <b>first,second</b>.")
                expect(result[3].message).to.eql("<b>Sibling</b> changed from <b>No value</b> to <b>Sachin</b>.")
                expect(result[4].message).to.eql("<b>Sibling</b> changed from <b>Naveen</b> to <b>No value</b>.")
                expect(result[5].message).to.eql("<b>Sibling</b> changed from <b>Ashu</b> to <b>Naveen</b>.")
                expect(result[6].message).to.eql("<b>Sibling</b> changed from <b>No value</b> to <b>Ashu</b>.")
                expect(result[7].message).to.eql("<b>JSON</b> changed.")
                expect(result[8].message).to.eql("<b>JSON</b> changed.")
                expect(result[9].message).to.eql("<b>Department Details</b> (City:newSecondCity)--><b>State Details</b> (State 1:state1) added.");
                expect(result[10].message).to.eql("<b>Department Details</b> (City:newThirdCity) added.");
                expect(result[11].message).to.eql("<b>Department Details</b> (City:newCity) deleted.");
                expect(result[12].message).to.eql("<b>Department Details</b> (City:newSecondCity) added.");
                expect(result[13].message).to.eql("<b>Department Details</b> (City:newCity)--><b>State Details</b> (State 1:newState1) deleted.");
                expect(result[14].message).to.eql("<b>Department Details</b> (City:newCity)--><b>State Details</b> (State 1:newState1)--> <b>State 1</b> changed from <b>state1</b> to <b>newState1</b>.");
                expect(result[15].message).to.eql("<b>Department Details</b> (City:newCity)--><b>State Details</b> (State 1:newState1)--> <b>State 2</b> changed from <b>state2</b> to <b>newState2</b>.");
                expect(result[16].message).to.eql("<b>Department Details</b> (City:newCity)--> <b>City</b> changed from <b>city</b> to <b>newCity</b>.");
                expect(result[17].message).to.eql("<b>Department Details</b> (City:newCity)--> <b>Country</b> changed from <b>country</b> to <b>newCountry</b>.");
                expect(result[18].message).to.eql("<b>Department Details</b> (City:city)--><b>State Details</b> (State 1:state1) added.");
                expect(result[19].message).to.eql("<b>Department Details</b> (City:city) added.");

                expect(result[20].message).to.eql("<b>Sequence</b> changed from <b>15</b> to <b>45</b>.");
                expect(result[21].message).to.eql("<b>Unit</b> changed from <b>250 INR</b> to <b>No value</b>.");
                expect(result[22].message).to.eql("<b>Sequence</b> changed from <b>51</b> to <b>15</b>.");
                expect(result[23].message).to.eql("<b>Unit</b> changed from <b>2550 USD</b> to <b>250 INR</b>.");
                expect(result[24].message).to.eql("<b>Sequence</b> changed from <b>5</b> to <b>51</b>.");
                expect(result[25].message).to.eql("<b>Unit</b> changed from <b>150 INR</b> to <b>2550 USD</b>.");
                expect(result[26].message).to.eql("<b>Sequence</b> changed from <b>1</b> to <b>5</b>.");
                expect(result[27].message).to.eql("<b>Unit</b> changed from <b>No value</b> to <b>150 INR</b>.");

                expect(result[28].message).to.eql("<b>Country Details</b> (0)--><b>State Details</b> (0) added.");
                expect(result[29].message).to.eql("<b>Country Details</b> (1) added.");
                expect(result[30].message).to.eql("<b>Country Details</b> deleted.");
                expect(result[31].message).to.eql("<b>Country Details</b> (0) added.");
                expect(result[32].message).to.eql("<b>Country Details</b>--><b>State Details</b> deleted.");
                expect(result[33].message).to.eql("<b>Country Details</b>--><b>State Details</b>--> <b>State 1</b> changed from <b>state1</b> to <b>newState1</b>.");
                expect(result[34].message).to.eql("<b>Country Details</b>--><b>State Details</b>--> <b>State 2</b> changed from <b>state2</b> to <b>newState2</b>.");
                expect(result[35].message).to.eql("<b>Country Details</b>--> <b>City</b> changed from <b>city</b> to <b>newCity</b>.");
                expect(result[36].message).to.eql("<b>Country Details</b>--> <b>Country</b> changed from <b>country</b> to <b>newCountry</b>.");
                expect(result[37].message).to.eql("<b>Country Details</b>--><b>State Details</b> added.");
                expect(result[38].message).to.eql("<b>Country Details</b> added.");

                expect(result[39].message).to.eql("<b>Age</b> changed from <b>220</b> to <b>225</b>.");
                expect(result[40].message).to.eql("<b>Currency</b> changed from <b>100.00 USD</b> to <b>120.00 INR</b>.");
                expect(result[41].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>Hisar</b>.");
                expect(result[42].message).to.eql("<b>Duration</b> changed from <b>No value</b> to <b>120 Hrs</b>.");
                expect(result[43].message).to.eql("<b>Reporting To</b> (ename:Ashu) deleted.");
                expect(result[44].message).to.eql("<b>Reporting To</b> (ename:Manjit) added.");
                expect(result[45].message).to.eql("<b>Reporting To</b> (ename:Naveen) added.");
                expect(result[46].message).to.eql("<b>Reporting To</b> (ename:Sachin) deleted.");
                expect(result[47].message).to.eql("<b>Reporting To</b> (ename:Ashu) added.");
                expect(result[48].message).to.eql("<b>Reporting To</b> (ename:Sachin) added.");
                expect(result[49].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>220</b>.");
                expect(result[50].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 USD</b>.");
                expect(result[51].message).to.eql("<b>Currency</b> changed from <b>102.00 INR</b> to <b>No value</b>.")
                expect(result[52].message).to.eql("<b>Currency</b> changed from <b>102.00 USD</b> to <b>102.00 INR</b>.")
                expect(result[53].message).to.eql("<b>Currency</b> changed from <b>100.00 INR</b> to <b>102.00 USD</b>.")
                expect(result[54].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 INR</b>.")
                expect(result[55].message).to.eql("<b>Age</b> changed from <b>16</b> to <b>No value</b>.")
                expect(result[56].message).to.eql("<b>City</b> changed from <b>hisara</b> to <b>No value</b>.")
                expect(result[57].message).to.eql("<b>State</b> changed from <b>haryanaa</b> to <b>No value</b>.")
                expect(result[58].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[59].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[60].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[61].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[62].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[63].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[64].message).to.eql("Record created .")
                writelog("fifteenth....")
            }).then(function () {
                return db.update({$collection: "historyCheck", $delete: {_id: insertId}});
            }).then(function () {
                return db.query({$collection: "historyCheck", $events: [
                    {"post": true, "function": "HistoryLogs.populateHistoryLogs", "event": "onQuery"}
                ], $parameters: {collection: "historyCheck", _id: insertId, showDeletedHistoryLogs: "show"}});
            }).then(function (queryData) {

                var result = queryData.result;
                expect(result).to.have.length(66);
                expect(result[0].message).to.eql("Record deleted .")
                expect(result[1].message).to.eql("<b>String Multiple</b> changed from <b>first,third</b> to <b>second</b>.")
                expect(result[2].message).to.eql("<b>String Multiple</b> changed from <b>first,second</b> to <b>first,third</b>.")
                expect(result[3].message).to.eql("<b>String Multiple</b> changed from <b>No value</b> to <b>first,second</b>.")
                expect(result[4].message).to.eql("<b>Sibling</b> changed from <b>No value</b> to <b>Sachin</b>.")
                expect(result[5].message).to.eql("<b>Sibling</b> changed from <b>Naveen</b> to <b>No value</b>.")
                expect(result[6].message).to.eql("<b>Sibling</b> changed from <b>Ashu</b> to <b>Naveen</b>.")
                expect(result[7].message).to.eql("<b>Sibling</b> changed from <b>No value</b> to <b>Ashu</b>.")
                expect(result[8].message).to.eql("<b>JSON</b> changed.")
                expect(result[9].message).to.eql("<b>JSON</b> changed.")
                expect(result[10].message).to.eql("<b>Department Details</b> (City:newSecondCity)--><b>State Details</b> (State 1:state1) added.");
                expect(result[11].message).to.eql("<b>Department Details</b> (City:newThirdCity) added.");
                expect(result[12].message).to.eql("<b>Department Details</b> (City:newCity) deleted.");
                expect(result[13].message).to.eql("<b>Department Details</b> (City:newSecondCity) added.");
                expect(result[14].message).to.eql("<b>Department Details</b> (City:newCity)--><b>State Details</b> (State 1:newState1) deleted.");
                expect(result[15].message).to.eql("<b>Department Details</b> (City:newCity)--><b>State Details</b> (State 1:newState1)--> <b>State 1</b> changed from <b>state1</b> to <b>newState1</b>.");
                expect(result[16].message).to.eql("<b>Department Details</b> (City:newCity)--><b>State Details</b> (State 1:newState1)--> <b>State 2</b> changed from <b>state2</b> to <b>newState2</b>.");
                expect(result[17].message).to.eql("<b>Department Details</b> (City:newCity)--> <b>City</b> changed from <b>city</b> to <b>newCity</b>.");
                expect(result[18].message).to.eql("<b>Department Details</b> (City:newCity)--> <b>Country</b> changed from <b>country</b> to <b>newCountry</b>.");
                expect(result[19].message).to.eql("<b>Department Details</b> (City:city)--><b>State Details</b> (State 1:state1) added.");
                expect(result[20].message).to.eql("<b>Department Details</b> (City:city) added.");

                expect(result[21].message).to.eql("<b>Sequence</b> changed from <b>15</b> to <b>45</b>.");
                expect(result[22].message).to.eql("<b>Unit</b> changed from <b>250 INR</b> to <b>No value</b>.");
                expect(result[23].message).to.eql("<b>Sequence</b> changed from <b>51</b> to <b>15</b>.");
                expect(result[24].message).to.eql("<b>Unit</b> changed from <b>2550 USD</b> to <b>250 INR</b>.");
                expect(result[25].message).to.eql("<b>Sequence</b> changed from <b>5</b> to <b>51</b>.");
                expect(result[26].message).to.eql("<b>Unit</b> changed from <b>150 INR</b> to <b>2550 USD</b>.");
                expect(result[27].message).to.eql("<b>Sequence</b> changed from <b>1</b> to <b>5</b>.");
                expect(result[28].message).to.eql("<b>Unit</b> changed from <b>No value</b> to <b>150 INR</b>.");

                expect(result[29].message).to.eql("<b>Country Details</b> (0)--><b>State Details</b> (0) added.");
                expect(result[30].message).to.eql("<b>Country Details</b> (1) added.");
                expect(result[31].message).to.eql("<b>Country Details</b> deleted.");
                expect(result[32].message).to.eql("<b>Country Details</b> (0) added.");
                expect(result[33].message).to.eql("<b>Country Details</b>--><b>State Details</b> deleted.");
                expect(result[34].message).to.eql("<b>Country Details</b>--><b>State Details</b>--> <b>State 1</b> changed from <b>state1</b> to <b>newState1</b>.");
                expect(result[35].message).to.eql("<b>Country Details</b>--><b>State Details</b>--> <b>State 2</b> changed from <b>state2</b> to <b>newState2</b>.");
                expect(result[36].message).to.eql("<b>Country Details</b>--> <b>City</b> changed from <b>city</b> to <b>newCity</b>.");
                expect(result[37].message).to.eql("<b>Country Details</b>--> <b>Country</b> changed from <b>country</b> to <b>newCountry</b>.");
                expect(result[38].message).to.eql("<b>Country Details</b>--><b>State Details</b> added.");
                expect(result[39].message).to.eql("<b>Country Details</b> added.");


                expect(result[40].message).to.eql("<b>Age</b> changed from <b>220</b> to <b>225</b>.");
                expect(result[41].message).to.eql("<b>Currency</b> changed from <b>100.00 USD</b> to <b>120.00 INR</b>.");
                expect(result[42].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>Hisar</b>.");
                expect(result[43].message).to.eql("<b>Duration</b> changed from <b>No value</b> to <b>120 Hrs</b>.");
                expect(result[44].message).to.eql("<b>Reporting To</b> (ename:Ashu) deleted.");
                expect(result[45].message).to.eql("<b>Reporting To</b> (ename:Manjit) added.");
                expect(result[46].message).to.eql("<b>Reporting To</b> (ename:Naveen) added.");
                expect(result[47].message).to.eql("<b>Reporting To</b> (ename:Sachin) deleted.");
                expect(result[48].message).to.eql("<b>Reporting To</b> (ename:Ashu) added.");
                expect(result[49].message).to.eql("<b>Reporting To</b> (ename:Sachin) added.");
                expect(result[50].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>220</b>.");
                expect(result[51].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 USD</b>.");
                expect(result[52].message).to.eql("<b>Currency</b> changed from <b>102.00 INR</b> to <b>No value</b>.")
                expect(result[53].message).to.eql("<b>Currency</b> changed from <b>102.00 USD</b> to <b>102.00 INR</b>.")
                expect(result[54].message).to.eql("<b>Currency</b> changed from <b>100.00 INR</b> to <b>102.00 USD</b>.")
                expect(result[55].message).to.eql("<b>Currency</b> changed from <b>No value</b> to <b>100.00 INR</b>.")
                expect(result[56].message).to.eql("<b>Age</b> changed from <b>16</b> to <b>No value</b>.")
                expect(result[57].message).to.eql("<b>City</b> changed from <b>hisara</b> to <b>No value</b>.")
                expect(result[58].message).to.eql("<b>State</b> changed from <b>haryanaa</b> to <b>No value</b>.")
                expect(result[59].message).to.eql("<b>Age</b> changed from <b>15</b> to <b>16</b>.")
                expect(result[60].message).to.eql("<b>City</b> changed from <b>hisar</b> to <b>hisara</b>.")
                expect(result[61].message).to.eql("<b>State</b> changed from <b>haryana</b> to <b>haryanaa</b>.")
                expect(result[62].message).to.eql("<b>Age</b> changed from <b>No value</b> to <b>15</b>.")
                expect(result[63].message).to.eql("<b>City</b> changed from <b>No value</b> to <b>hisar</b>.")
                expect(result[64].message).to.eql("<b>State</b> changed from <b>No value</b> to <b>haryana</b>.")
                expect(result[65].message).to.eql("Record created .")
                writelog("final...")
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });


});


describe("historylogs in delete case", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("history logs in delete case with filter", function (done) {

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefination = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "historyCheck", historyEnabled: true},
                        {collection: "departments"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "department", type: "string", collectionid: {$query: {collection: "departments"}}, ui: "text", visibility: true},
                        {field: "name", type: "string", collectionid: {$query: {collection: "historyCheck"}}, ui: "text", visibility: true},
                        {field: "age", type: "number", collectionid: {$query: {collection: "historyCheck"}}, ui: "text", visibility: true},
                        {label: "Department", field: "departmentid", type: "fk", collection: "departments", collectionid: {$query: {collection: "historyCheck"}}, displayField: "department", set: ["department"]}
                    ]},
                    {$collection: "pl.qviews", $insert: [
                        {label: "Ledger", id: "historyCheck", collection: {$query: {collection: "historyCheck"}}, mainCollection: {$query: {collection: "historyCheck"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(function () {
                return db.update({$collection: "departments", $insert: [
                    {department: "D1"},
                    {department: "D2"},
                    {department: "D3"}
                ]})
            }).then(
            function () {
                return db.update({$collection: "historyCheck", $insert: [
                    {name: "r", departmentid: {$query: {department: "D2"}}}

                ]});
            }).then(function (updateData) {
                insertId = updateData["historyCheck"].$insert[0]._id;
                return db.update({$collection: "historyCheck", $update: [
                    {_id: insertId, $set: {age: 15, address: {$set: {city: "hisar", state: "haryana"}}}}
                ]});
            }).then(function () {
                return db.update({$collection: "historyCheck", $insert: [
                    {name: "ri"},
                    {name: "rit"},
                    {name: "rite", departmentid: {$query: {department: "D1"}}},
                    {name: "rites", departmentid: {$query: {department: "D3"}}},
                    {name: "ritesh"}
                ]});
            }).then(function () {
                return db.query({$collection: "historyCheck", $filter: {"name": "rite"}, $fields: {_id: 1}})
            }).then(function (historyCheckIdData) {
                var historyCheckIds = historyCheckIdData.result;
                return db.update({$collection: "historyCheck", $delete: [
                    {_id: historyCheckIds[0]._id}
                ]})
            }).then(function () {
                return db.query({$collection: "historyCheck", $filter: {"name": "rites"}, $fields: {_id: 1}})
            }).then(function (historyCheckIdData) {
                var historyCheckIds = historyCheckIdData.result;
                return db.update({$collection: "historyCheck", $delete: [
                    {_id: historyCheckIds[0]._id}
                ]})
            }).then(function () {
                return db.query({$collection: "historyCheck", $filter: {"name": "ritesh"}, $fields: {_id: 1}})
            }).then(function (historyCheckIdData) {
                var historyCheckIds = historyCheckIdData.result;
                return db.update({$collection: "historyCheck", $delete: [
                    {_id: historyCheckIds[0]._id}
                ]})
            }).then(function () {
                return db.invokeFunction("view.getView", [
                    {id: "historyCheck", $parameters: {showDeletedHistoryLogs: true}}
                ]);
            }).then(function (viewData) {
                var data = viewData.data.result;
                expect(data).to.have.length(3);
                expect(data[0].name).to.eql("ritesh")
                expect(data[1].name).to.eql("rites")
                expect(data[2].name).to.eql("rite")
            }).then(function () {
                return db.invokeFunction("view.getView", [
                    {id: "historyCheck"}
                ]);
            }).then(function (viewData) {
                var datas = viewData.data.result;
                expect(datas).to.have.length(3);
                expect(datas[0].name).to.eql("rit")
                expect(datas[1].name).to.eql("ri")
                expect(datas[2].name).to.eql("r")
            }).then(function () {
                return db.query({$collection: "departments", $filter: {department: "D1"}, $fields: {department: 1}});
            }).then(function (departmentid) {
                return db.invokeFunction("view.getView", [
                    {id: "historyCheck", $filter: {"departmentid": departmentid.result[0]._id}, $parameters: {showDeletedHistoryLogs: true}}
                ]);
            }).then(function (viewData) {
                var data = viewData.data.result;
                expect(data).to.have.length(1);
                expect(data[0].name).to.eql("rite")
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

})


describe("historylogs in rollback transaction", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("history logs rollback transaction", function (done) {
        var insertid = undefined;
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(function () {
                var collectionDefination = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "historyCheck", historyEnabled: true}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "name", type: "string", collectionid: {$query: {collection: "historyCheck"}}, ui: "text", visibility: true},
                        {field: "age", type: "number", collectionid: {$query: {collection: "historyCheck"}}, ui: "text", visibility: true},
                        {field: "uniqueField", type: "string", collectionid: {$query: {collection: "historyCheck"}}, ui: "text", visibility: true}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return db.update({$collection: "pl.functions", $insert: {name: "RollbackTransaction", source: "NorthwindTestCase/lib", type: "js"}})
            }).then(
            function () {
                return db.update({$collection: "pl.events", $insert: {event: "onSave", function: "RollbackTransaction.onSave", collectionid: {$query: {collection: "historyCheck"}}, post: true}});
            }).then(function () {
                return db.update({$collection: "historyCheck", $insert: [
                    {name: "rite", age: "13", uniqueField: "ritesh1"}
                ]})
            }).then(function (updateData) {
                insertid = updateData["historyCheck"].$insert[0]._id;
            }).then(function () {
                return db.startTransaction();
            }).then(function () {
                return db.update({$collection: "historyCheck", $update: {_id: insertid, $set: {name: "ritesh", age: "14", uniqueField: "ritesh2"}}});
            }).then(function () {
                return db.commitTransaction();
            }).fail(function (err) {
                if (err && err.message === "Update in document.") {
                    return db.rollbackTransaction();
                } else {
                    throw err;
                }
            }).then(function () {
                return db.query({$collection: "historyCheck", $filter: {_id: insertid}, $events: false, $modules: false});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].__history.__lastUpdatedOn).to.not.equal(undefined);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

})