/**
 * Created by sourabh on 3/8/15.
 */


var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");
var Commit = require("../lib/apps/Commit.js");
var ReferredFks = require("../lib/apps/triggers/ReferredFks.js");

describe("setField", function () {

    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    afterEach(function (done) {
        Testcases.afterEach(done);
    })

    it("set field function as a process", function (done) {
        var db = undefined;
        var processid = undefined;
        var asyncDB = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "students"},
                        {collection: "classes"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "class", type: "string", collectionid: {$query: {collection: "classes"}}},
                        {field: "name", type: "string", collectionid: {$query: {collection: "students"}}},
                        {field: "age", type: "number", collectionid: {$query: {collection: "students"}}},
                        {field: "studentid", type: "fk", collection: "students", set: ["name"], collectionid: {$query: {collection: "classes"}}}
                    ]}
                ];
                return db.update(updates)
            }).then(function () {
                var insert = [
                    {$collection: "students", $insert: [
                        {name: "sourabh", age: 16},
                        {name: "rahul", age: 17},
                        {name: "nitish", age: 15}
                    ]},
                    {$collection: "classes", $insert: [
                        {class: "IX", studentid: {$query: {name: "sourabh"}}},
                        {class: "X", studentid: {$query: {name: "rahul"}}},
                        {class: "VIII", studentid: {$query: {name: "nitish"}}}
                    ]
                    }
                ]
                return db.update(insert);
            }).then(function (result) {
                return db.query({$collection: "classes"});
            }).then(function (result) {
                return db.query({$collection: "pl.fields", $filter: {field: "studentid", "collectionid.collection": "classes"}});
            }).then(
            function (fieldResult) {
                var updates = [
                    {$collection: "pl.fields", $update: [
                        {_id: fieldResult.result[0]._id, $set: {set: ["name", "age"]}}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                asyncDB = db.asyncDB();
                var options = {processName: "SetFields"};
                return asyncDB.createProcess(options);
            }).then(function (process) {
                processid = process.processid;
                var params = {collection: "classes", fields: ["studentid"], dbs: [db.db.databaseName]};
                var options = {processid: process.processid};
                asyncDB.startProcess([params], "Porting.repopulateSetFieldsInProcess", options);
                return waitForSetField(db, processid);
            }).then(function () {
                return db.query({$collection: "classes"});
            }).then(function (result) {
                var result = result.result;
                expect(result).to.have.length(3);
                expect(result[0].class).to.eql("IX");
                expect(result[0].studentid.name).to.eql("sourabh");
                expect(result[0].studentid.age).to.eql(16);
                expect(result[1].studentid.name).to.eql("rahul");
                expect(result[1].studentid.age).to.eql(17);
                expect(result[2].studentid.name).to.eql("nitish");
                expect(result[2].studentid.age).to.eql(15);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    // for set field call at the time of field is updated through sb.....
    /*it("set field for db where field meta will be update", function (done) {
     var db = undefined;
     var processid = undefined;
     ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
     function (db1) {
     db = db1;
     var updates = [
     {$collection: "pl.collections", $insert: [
     {collection: "students"},
     {collection: "classes"}
     ]},
     {$collection: "pl.fields", $insert: [
     {field: "class", type: "string", collectionid: {$query: {collection: "classes"}}},
     {field: "name", type: "string", collectionid: {$query: {collection: "students"}}},
     {field: "age", type: "number", collectionid: {$query: {collection: "students"}}},
     {field: "studentid", type: "fk", collection: "students", set: ["name"], collectionid: {$query: {collection: "classes"}}}
     ]}
     ];
     return db.update(updates)
     }).then(function () {
     var insert = [
     {$collection: "students", $insert: [
     {name: "sourabh", age: 16},
     {name: "rahul", age: 17},
     {name: "nitish", age: 15}
     ]},
     {$collection: "classes", $insert: [
     {class: "IX", studentid: {$query: {name: "sourabh"}}},
     {class: "X", studentid: {$query: {name: "rahul"}}},
     {class: "VIII", studentid: {$query: {name: "nitish"}}}
     ]
     }
     ]
     return db.update(insert);
     }).then(function (result) {
     return db.query({$collection: "pl.fields", $filter: {field: "studentid", "collectionid.collection": "classes"}});
     }).then(
     function (fieldResult) {
     var updates = [
     {$collection: "pl.fields", $update: [
     {_id: fieldResult.result[0]._id, $set: {set: ["name", "age"]}}
     ]}
     ];
     return db.update(updates);
     }).then(function () {
     return require("q").delay(300);
     }).then(function () {
     return db.query({$collection: "classes"});
     }).then(function (result) {
     var result = result.result;
     expect(result).to.have.length(3);
     expect(result[0].class).to.eql("IX");
     expect(result[0].studentid.name).to.eql("sourabh");
     expect(result[0].studentid.age).to.eql(16);
     expect(result[1].studentid.name).to.eql("rahul");
     expect(result[1].studentid.age).to.eql(17);
     expect(result[2].studentid.name).to.eql("nitish");
     expect(result[2].studentid.age).to.eql(15);

     done();
     }).fail(function (err) {
     console.log(err);
     done(err);
     });
     });*/

    // for set field call for dotted field at the time of field is updated through sb.....
    it("set field update for a field and single dotted field", function (done) {
        var db = undefined;
        var processid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "students"},
                        {collection: "classes"},
                        {collection: "cities"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "city", type: "string", collectionid: {$query: {collection: "cities"}}},
                        {field: "population", type: "string", collectionid: {$query: {collection: "cities"}}},
                        {field: "class", type: "string", collectionid: {$query: {collection: "classes"}}},
                        {field: "name", type: "string", collectionid: {$query: {collection: "students"}}},
                        {field: "age", type: "number", collectionid: {$query: {collection: "students"}}},
                        {field: "studentid", type: "fk", collection: "students", set: ["name"], collectionid: {$query: {collection: "classes"}}},
                        {field:"address", type:"object", multiple: true, collectionid:{$query:{collection:"classes"}}},
                        {field:"cityid", type:"fk", collection:"cities", set:["city"], collectionid:{$query:{collection:"classes"}}, parentfieldid:{$query:{"field":"address", collectionid:{$query:{"collection":"classes"}}}}}

                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                var insert = [
                    {$collection: "students", $insert: [
                        {name: "sourabh", age: 16},
                        {name: "rahul", age: 17},
                        {name: "nitish", age: 15}
                    ]},
                    {$collection: "cities", $insert: [
                        {city: "karnal", population: "30K"},
                        {city: "kkr", population: "25K"},
                        {city: "panipat", population: "40K"}
                    ]},
                    {$collection: "classes", $insert: [
                        {class: "IX", studentid: {$query: {name: "sourabh"}}, address: [{cityid: {$query: {city: "karnal"}}}]},
                        {class: "X", studentid: {$query: {name: "rahul"}}, address: [{cityid: {$query: {city: "panipat"}}}]},
                        {class: "VIII", studentid: {$query: {name: "nitish"}}, address: [{cityid: {$query: {city: "kkr"}}}]}
                    ]}
                ]
                return db.update(insert);
            }).then(function () {
                return db.query({$collection: "pl.fields", $filter: {field: "studentid", "collectionid.collection": "classes"}});
            }).then(
            function (fieldResult) {
                var updates = [
                    {$collection: "pl.fields", $update: [
                        {_id: fieldResult.result[0]._id, $set: {set: ["name", "age"]}}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                return require("q").delay(300);
            }).then(function () {
                return db.query({$collection: "classes"});
            }).then(function (result) {
                var result = result.result;
                expect(result).to.have.length(3);
                expect(result[0].class).to.eql("IX");
                expect(result[0].studentid.name).to.eql("sourabh");
                expect(result[0].studentid.age).to.eql(16);
                expect(result[1].studentid.name).to.eql("rahul");
                expect(result[1].studentid.age).to.eql(17);
                expect(result[2].studentid.name).to.eql("nitish");
                expect(result[2].studentid.age).to.eql(15);


                return db.query({$collection: "pl.fields", $filter: {field: "cityid", "collectionid.collection": "classes"}});
            }).then(
            function (fieldResult) {
                var updates = [
                    {$collection: "pl.fields", $update: [
                        {_id: fieldResult.result[0]._id, $set: {set: ["city", "population"]}}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                return require("q").delay(1500);
            }).then(function () {
                return db.query({$collection: "classes"});
            }).then(function (result) {
                var result = result.result;

                expect(result).to.have.length(3);
                expect(result).to.have.length(3);
                expect(result[0].address[0].cityid.city).to.eql("karnal");
                expect(result[0].address[0].cityid.population).to.eql("30K");
                expect(result[1].address[0].cityid.population).to.eql("40K");
                expect(result[1].address[0].cityid.city).to.eql("panipat");
                expect(result[2].address[0].cityid.population).to.eql("25K");


                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("set field error for two dotted fields", function (done) {
        var db = undefined;
        var processid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "students"},
                        {collection: "classes"},
                        {collection: "cities"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "city", type: "string", collectionid: {$query: {collection: "cities"}}},
                        {field: "population", type: "string", collectionid: {$query: {collection: "cities"}}},
                        {field: "class", type: "string", collectionid: {$query: {collection: "classes"}}},
                        {field: "name", type: "string", collectionid: {$query: {collection: "students"}}},
                        {field: "age", type: "number", collectionid: {$query: {collection: "students"}}},
                        {field: "studentid", type: "fk", collection: "students", set: ["name"], collectionid: {$query: {collection: "classes"}}},
                        {field:"address", type:"object",collectionid:{$query:{collection:"classes"}}},
                        {field:"state", type:"object", multiple: true, collectionid:{$query:{collection:"classes"}},  parentfieldid:{$query:{"field":"address", collectionid:{$query:{"collection":"classes"}}}}},
                        {field:"cityid", type:"fk", collection:"cities", set:["city"], collectionid:{$query:{collection:"classes"}}, parentfieldid:{$query:{"field":"state", collectionid:{$query:{"collection":"classes"}}}}}

                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                var insert = [
                    {$collection: "students", $insert: [
                        {name: "sourabh", age: 16},
                        {name: "rahul", age: 17},
                        {name: "nitish", age: 15}
                    ]},
                    {$collection: "cities", $insert: [
                        {city: "karnal", population: "30K"},
                        {city: "kkr", population: "25K"},
                        {city: "panipat", population: "40K"}
                    ]},
                    {$collection: "classes", $insert: [
                        {class: "IX", studentid: {$query: {name: "sourabh"}}, address: {state: [{cityid: {$query: {city: "karnal"}}}]}},
                        {class: "X", studentid: {$query: {name: "rahul"}}, address: {state:  [{cityid: {$query: {city: "panipat"}}}]}},
                        {class: "VIII", studentid: {$query: {name: "nitish"}}, address: {state:  [{cityid: {$query: {city: "kkr"}}}]}}
                    ]}
                ]
                return db.update(insert);
            }).then(function () {
                return db.query({$collection: "pl.fields", $filter: {field: "cityid", "collectionid.collection": "classes"}});
            }).then(
            function (fieldResult) {
                var updates = [
                    {$collection: "pl.fields", $update: [
                        {_id: fieldResult.result[0]._id, $set: {set: ["city", "population"]}}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                return require("q").delay(500);
            }).then(function () {
                return db.query({$collection: "pl.processes"});
            }).then(function (result) {
                var result = result.result[0];
                var detailmessage = result.detail[0].error;

                expect(detailmessage.search("RepopulateSetFields is not supported for two dotted fields") > -1).to.eql(true);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
});

function waitForSetField(db, processid) {
    return db.query({$collection: "pl.processes", $filter: {_id: processid}}).then(function (result) {
        if (result && result.result.length > 0 && result.result[0].status != "success") {
            return waitForSetField(db, processid)
        }
    })
}

