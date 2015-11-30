/**
 *
 * mocha --recursive --timeout 150000 -g "collections testcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "collection Fields" --reporter spec
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require("./NorthwindDb.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../lib/Constants.js");
var Testcases = require("./TestCases.js");
describe("collections testcase", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("collection Fields", function (done) {

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            { collection:"states"},
                            { collection:"countries"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[
                            {field:"country", type:"string", mandatory:true, collectionid:{$query:{collection:"countries"}}},
                            {field:"code", type:"string", mandatory:true, collectionid:{$query:{collection:"countries"}}},
                            {_id:"cities", field:"cities", type:"object", collectionid:{$query:{collection:"states"}}, multiple:true},
                            {field:"city", type:"string", collectionid:{$query:{collection:"states"}}, parentfieldid:{$query:{_id:"cities", field:"cities", collectionid:{$query:{collection:"states"}}}}},
                            {field:"countryid", type:"fk", collectionid:{$query:{collection:"states"}}, collection:"countries", set:["country"], parentfieldid:{$query:{_id:"cities", field:"cities", collectionid:{$query:{collection:"states"}}}}} ,
                            {_id:"schools", field:"schools", type:"object", multiple:true, collectionid:{$query:{collection:"states"}}, parentfieldid:{$query:{_id:"cities", field:"cities"}, collectionid:{$query:{collection:"states"}}}},
                            {field:"schoolname", type:"string", multiple:false, collectionid:{$query:{collection:"states"}}, parentfieldid:{$query:{_id:"schools", field:"schools"}, collectionid:{$query:{collection:"states"}}}},
                            {field:"code", type:"string", mandatory:true, collectionid:{$query:{collection:"states"}}},
                            {field:"countryid", type:"fk", collectionid:{$query:{collection:"states"}}, collection:"countries", set:["country", "code"]},
                            {field:"state", type:"string", mandatory:true, collectionid:{$query:{collection:"states"}}}
                        ]
                    }
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.collection("states");
            }).then(
            function (collectionObj) {
                return  collectionObj.get("fields");
            }).then(
            function (collectionFields) {
//                console.log("collectionFields >>>>>>>>>>>>>>>>" + JSON.stringify(collectionFields));
                expect(collectionFields).to.have.length(4);
                expect(collectionFields[1].field).to.eql("code");
                expect(collectionFields[2].field).to.eql("countryid");
                expect(collectionFields[0].field).to.eql("cities");
                expect(collectionFields[0].fields).to.have.length(3);
                expect(collectionFields[0].fields[0].field).to.eql("city");
                expect(collectionFields[0].fields[1].field).to.eql("countryid");
                expect(collectionFields[0].fields[2].field).to.eql("schools");
                expect(collectionFields[0].fields[2].fields).to.have.length(1);
                expect(collectionFields[0].fields[2].fields[0].field).to.eql("schoolname");
                expect(collectionFields[3].field).to.eql("state");
                return db.collection("countries");
            }).then(
            function (collectionObj) {
                return collectionObj.get("referredfks");
            }).then(
            function (referredFks) {
//                console.log("referredfks >>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(referredFks));
                expect(referredFks).to.have.length(2);
                expect(referredFks[0].field).to.eql("cities.$.countryid");
                expect(referredFks[0].set).to.eql(["country"]);
                expect(referredFks[1].field).to.eql("countryid");
                expect(referredFks[1].set).to.eql(["country", "code"]);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
        var expectedResult = [
            {"field":"state", "type":"string", "mandatory":true, "collectionid":{"_id":"534e65458dbaae303ebc3614"}, "_id":"534e65458dbaae303ebc3615"},
            {"field":"code", "type":"string", "mandatory":true, "collectionid":{"_id":"534e65458dbaae303ebc3614"}, "_id":"534e65458dbaae 303ebc3619"},
            {"field":"countryid", "type":"fk", "mandatory":true, "collectionid":{"_id":"534e65458dbaae303ebc3614"}, collection:"countries", set:["country"], "_id":"534e65458dbaae 303ebc3219"},
            {"field":"cities", "type":"object", "collectionid":{"_id":"534e65458dbaae303ebc3614"}, "multiple":true, "_id":"534e65458dbaae303ebc361d", "fields":[
                {"field":"city", "type":"string", "collectionid":{"_id":"534e65458dbaae303ebc3614"}, "parentfieldid":{"field":"cities", "_id":"534e65458 dbaae303ebc361d"}, "_id":"534e65458dbaae303ebc3621", "fields":[]},
                {"field":"countryid", "type":"fk", "mandatory":true, "collectionid":{"_id":"534e65458dbaae303ebc3614"}, collection:"countries", set:["country"], "_id":"534e65458dbaae 303ebc3219"},
                {"field":"schools", "type":"object", "multiple":true, "collectionid":{"_id":"534e65458dbaae303ebc3614"}, "parentfieldid":{"field":"cities", "_id":"534e65458dbaae303ebc361d"}, "_id":"534e65458dbaae303ebc3628", "fields":[
                    {"field":"schoolname", "t ype":"string", "multiple":false, "collectionid":{"_id":"534e65458dbaae303ebc3614"}, "parentfieldid":{"field":"schools", "_id":"534e65458dbaae303ebc3628"}, "_id":"534e65458dbaae303ebc362f"}
                ]}
            ]}
        ];
    })

    it("Referred Fks insert field testcase", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            { _id:"persons", collection:"persons"},
                            { _id:"students", collection:"students"},
                            { _id:"cities", collection:"cities"},
                            { _id:"states", collection:"states"},
                            { _id:"countries", collection:"countries"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[
                            {_id:"country", field:"country", type:"string", collectionid:{_id:"countries"}},
                            {_id:"countrycode", field:"countrycode", type:"string", collectionid:{_id:"countries"}},

                            {_id:"state", field:"state", type:"string", collectionid:{_id:"states"}},
                            {_id:"statecode", field:"statecode", type:"string", collectionid:{_id:"states"}},
                            {_id:"statecountryid", field:"countryid", type:"fk", collection:"countries", set:["country"], collectionid:{_id:"states"}},

                            {_id:"city", field:"city", type:"string", collectionid:{_id:"cities"}},
                            {_id:"citycode", field:"citycode", type:"string", collectionid:{_id:"cities"}},
                            {_id:"citystateid", field:"stateid", type:"fk", collection:"states", set:["state"], collectionid:{_id:"cities"}},

                            {_id:"personname", field:"personname", type:"string", collectionid:{_id:"persons"}},
                            {_id:"cityid", field:"cityid", type:"fk", collection:"cities", set:["city", "stateid._id", "stateid.state", "stateid.countryid._id", "stateid.countryid.country"], collectionid:{_id:"persons"}},
                            {_id:"cities", field:"cities", type:"fk", multiple:true, collection:"cities", set:["city", "stateid._id", "stateid.state", "stateid.countryid._id", "stateid.countryid.country"], collectionid:{_id:"persons"}},
                            {_id:"address", field:"address", type:"object", collectionid:{_id:"persons"}},
                            {_id:"addresscity", field:"cityid", type:"fk", collection:"cities", set:["city"], collectionid:{_id:"persons"}, parentfieldid:{"_id":"address"}},
                            {_id:"addresscitymultiple", multiple:true, field:"cities", type:"fk", collection:"cities", set:["city"], collectionid:{_id:"persons"}, parentfieldid:{"_id":"address"}},
                            {_id:"documents", field:"documents", type:"object", multiple:true, collectionid:{_id:"persons"}},
                            {_id:"documentcity", field:"cityid", type:"fk", collection:"cities", set:["city"], collectionid:{_id:"persons"}, parentfieldid:{"_id":"documents"}},
                            {_id:"documentcitymultiple", multiple:true, field:"cities", type:"fk", collection:"cities", set:["city"], collectionid:{_id:"persons"}, parentfieldid:{"_id":"documents"}},
                            {_id:"schools", field:"schools", type:"object", multiple:true, collectionid:{_id:"persons"}},
                            {_id:"schoolsaddress", field:"address", type:"object", multiple:true, collectionid:{_id:"persons"}, parentfieldid:{"_id":"schools"}},
                            {_id:"schoolsaddresscity", field:"cityid", type:"fk", collection:"cities", set:["city"], collectionid:{_id:"persons"}, parentfieldid:{"_id":"schoolsaddress"}},
                            {_id:"schoolsaddresscitymultiple", field:"cities", multiple:true, type:"fk", collection:"cities", set:["city"], collectionid:{_id:"persons"}, parentfieldid:{"_id":"schoolsaddress"}},
                            {_id:"personid", field:"personid", type:"fk", collection:"persons", set:["personname", "cityid._id", "cityid.city", "cities.stateid._id", "cities.stateid.state", "cities.stateid.countryid._id", "cities.stateid.countryid.country"/*, "schools.address.cityid._id", "schools.address.cityid.city"*/], collectionid:{_id:"students"}}
                        ]
                    }
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.collection("countries");
            }).then(
            function (collectionObj) {
                return  collectionObj.get("referredfks");
            }).then(
            function (countries) {
//                console.log("referredfks countries>>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(countries));
                expect(countries).to.have.length(4);
                expect(countries[0].collectionid._id).to.eql("states");
                expect(countries[0].collectionid.collection).to.eql("states");
                expect(countries[0].field).to.eql("countryid");
                expect(countries[0].set).to.eql(["country"]);
                expect(countries[1].collectionid._id).to.eql("persons");
                expect(countries[1].collectionid.collection).to.eql("persons");
                expect(countries[1].field).to.eql("cityid.stateid.countryid");
                expect(countries[1].set).to.eql(["country"]);
                expect(countries[2].collectionid._id).to.eql("persons");
                expect(countries[2].collectionid.collection).to.eql("persons");
                expect(countries[2].field).to.eql("cities.$.stateid.countryid");
                expect(countries[2].set).to.eql(["country"]);
                expect(countries[3].collectionid._id).to.eql("students");
                expect(countries[3].collectionid.collection).to.eql("students");
                expect(countries[3].field).to.eql("personid.cities.$.stateid.countryid");
                expect(countries[3].set).to.eql(["country"]);
                return db.collection("states");
            }).then(
            function (collectionObj) {
                return collectionObj.get("referredfks");
            }).then(
            function (states) {
//                console.log("referredfks states>>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(states));
                expect(states).to.have.length(4);
                expect(states[0].collectionid._id).to.eql("cities");
                expect(states[0].collectionid.collection).to.eql("cities");
                expect(states[0].field).to.eql("stateid");
                expect(states[0].set).to.eql(["state"]);
                expect(states[1].collectionid._id).to.eql("persons");
                expect(states[1].collectionid.collection).to.eql("persons");
                expect(states[1].field).to.eql("cityid.stateid");
                expect(states[1].set).to.eql(["state", "countryid._id", "countryid.country"]);
                expect(states[2].collectionid._id).to.eql("persons");
                expect(states[2].collectionid.collection).to.eql("persons");
                expect(states[2].field).to.eql("cities.$.stateid");
                expect(states[2].set).to.eql(["state", "countryid._id", "countryid.country"]);
                expect(states[3].collectionid._id).to.eql("students");
                expect(states[3].collectionid.collection).to.eql("students");
                expect(states[3].field).to.eql("personid.cities.$.stateid");
                expect(states[3].set).to.eql(["state", "countryid._id", "countryid.country"]);
                return db.collection("cities");
            }).then(
            function (collectionObj) {
                return collectionObj.get("referredfks");
            }).then(
            function (cities) {
//                console.log("referredfkscities >>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(cities));
                expect(cities).to.have.length(10);
                expect(cities[0].collectionid.collection).to.eql("persons");
                expect(cities[0].field).to.eql("cityid");
                expect(cities[0].set).to.eql(["city", "stateid._id", "stateid.state", "stateid.countryid._id", "stateid.countryid.country"]);
                expect(cities[1].collectionid.collection).to.eql("persons");
                expect(cities[1].field).to.eql("cities.$");
                expect(cities[1].set).to.eql(["city", "stateid._id", "stateid.state", "stateid.countryid._id", "stateid.countryid.country"]);
                expect(cities[2].collectionid.collection).to.eql("persons");
                expect(cities[2].field).to.eql("address.cityid");
                expect(cities[2].set).to.eql(["city"]);
                expect(cities[3].collectionid.collection).to.eql("persons");
                expect(cities[3].field).to.eql("address.cities.$");
                expect(cities[3].set).to.eql(["city"]);
                expect(cities[4].collectionid.collection).to.eql("persons");
                expect(cities[4].field).to.eql("documents.$.cityid");
                expect(cities[4].set).to.eql(["city"]);
                expect(cities[5].collectionid.collection).to.eql("persons");
                expect(cities[5].field).to.eql("documents.$.cities.$");
                expect(cities[5].set).to.eql(["city"]);
                expect(cities[6].collectionid.collection).to.eql("persons");
                expect(cities[6].field).to.eql("schools.$.address.$.cityid");
                expect(cities[6].set).to.eql(["city"]);
                expect(cities[7].collectionid.collection).to.eql("persons");
                expect(cities[7].field).to.eql("schools.$.address.$.cities.$");
                expect(cities[7].set).to.eql(["city"]);
                expect(cities[8].collectionid.collection).to.eql("students");
                expect(cities[8].field).to.eql("personid.cityid");
                expect(cities[8].set).to.eql(["city"]);
                expect(cities[9].collectionid.collection).to.eql("students");
                expect(cities[9].field).to.eql("personid.cities.$");
                expect(cities[9].set).to.eql(["stateid._id", "stateid.state", "stateid.countryid._id", "stateid.countryid.country"]);
//                expect(cities[10].collectionid.collection).to.eql("students");
//                expect(cities[10].field).to.eql("personid.schools.$.address.$.cityid");
//                expect(cities[10].set).to.eql(["city"]);
                return db.collection("persons");
            }).then(
            function (collectionObj) {
                return collectionObj.get("referredfks");
            }).then(
            function (persons) {
//                console.log("referredfks persons>>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(persons));
                expect(persons).to.have.length(1);
                expect(persons[0].collectionid._id).to.eql("students");
                expect(persons[0].collectionid.collection).to.eql("students");
                expect(persons[0].field).to.eql("personid");
                expect(persons[0].set).to.eql(["personname", "cityid._id", "cityid.city", "cities.stateid._id", "cities.stateid.state", "cities.stateid.countryid._id", "cities.stateid.countryid.country"/*, "schools.address.cityid._id", "schools.address.cityid.city"*/]);
                return db.collection("students");
            }).then(
            function (collectionObj) {
                return collectionObj.get("referredfks");
            }).then(
            function (students) {
//                console.log("referredfks students>>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(students));
                expect(students).to.have.length(0);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("Referred Fks update field testcase", function (done) {

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            { _id:"states", collection:"states"},
                            { _id:"countries", collection:"countries"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[
                            {field:"country", type:"string", mandatory:true, collectionid:{$query:{collection:"countries"}}} ,
                            {_id:"statecountryid", field:"countryid", type:"fk", collection:"countries", set:["country"], collectionid:{_id:"states"}}
                        ],
                        $update:[
                            {_id:"statecountryid", $set:{field:"contid"}}
                        ]
                    }
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.collection("countries");
            }).then(
            function (collectionObj) {
                return collectionObj.get("referredfks");
            }).then(
            function (countries) {
//                console.log("referredfks countries>>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(countries));
                expect(countries).to.have.length(1);
                expect(countries[0].collectionid._id).to.eql("states");
                expect(countries[0].collectionid.collection).to.eql("states");
                expect(countries[0].field).to.eql("contid");
                expect(countries[0].set).to.eql(["country"]);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

        var expectedResult = [
            {"collectionid":{"_id":"states", "collection":"states"}, "field":"contid", "set":["country"], "_id":"5358e2339550d830150eea76"}
        ];

    })

    it("Referred Fks delete field testcase", function (done) {

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {
                        $collection:Constants.Admin.COLLECTIONS,
                        $insert:[
                            { _id:"states", collection:"states"},
                            { _id:"countries", collection:"countries"}
                        ]
                    },
                    {
                        $collection:Constants.Admin.FIELDS,
                        $insert:[
                            {field:"country", type:"string", mandatory:true, collectionid:{$query:{collection:"countries"}}} ,
                            {_id:"statecountryid", field:"countryid", type:"fk", collection:"countries", set:["country"], collectionid:{_id:"states"}}
                        ]
                    } ,
                    {
                        $collection:Constants.Admin.FIELDS,
                        $delete:[
                            {_id:"statecountryid"}
                        ]
                    }
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.collection("countries");
            }).then(
            function (collectionObj) {
                return collectionObj.get("referredfks");
            }).then(
            function (countries) {
//                console.log("referredfks countries>>>>>>>>>>>>>>>>++++++++++++++++++++++" + JSON.stringify(countries));
                expect(countries).to.have.length(0);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("ensure Index on update in collection indexes", function (done) {
        var db = undefined;
        var collection = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}},
                        {field:"date", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"status", type:"string", collectionid:{$query:{collection:"tasks"}}}
                    ]}
                ]);
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.indexes", $insert:[
                        {name:"taskUnique", indexes:JSON.stringify({task:1}), background:true, unique:true, collectionid:{$query:{collection:"tasks"}}}
                    ]}
                ]);
            }).then(
            function () {
                return db.collection("tasks");
            }).then(
            function (collectionObj) {
                collection = collectionObj;
                return collection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(2);
                expect(result[0].name).to.eql("_id_");
                expect(result[1].name).to.eql("taskUnique");
                expect(result[1].unique).to.eql(true);
                expect(result[1].background).to.eql(true);
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.indexes", $insert:[
                        {name:"date", indexes:JSON.stringify({date:1}), background:true, collectionid:{$query:{collection:"tasks"}}}
                    ]}
                ]);
            }).then(
            function () {
                return collection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(3);
                expect(result[2].key).to.eql({date:1});
                expect(result[2].name).to.eql("date");
                expect(result[2].background).to.eql(true);
            }).then(
            function () {
                return db.query({$collection:"pl.indexes", $filter:{"collectionid.collection":"tasks", "name":"date"}});
            }).then(
            function (result) {
                return db.update({$collection:"pl.indexes", $update:{_id:result.result[0]._id, $set:{unique:true, indexes:JSON.stringify({status:1})}}})
            }).then(
            function () {
                return collection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(3);
                expect(result[2].key).to.eql({status:1});
                expect(result[2].name).to.eql("date");
                expect(result[2].background).to.eql(true);
                expect(result[2].unique).to.eql(true);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("ensure Index on change in collections in applications", function (done) {
        var db = undefined;
        var taskCollection = undefined;
        var statusCollection = undefined;
        var priorityCollection = undefined;
        var adminDb = undefined;
        var dbToCheckIndex = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.applications", $insert:[
                        {label:"Task Management", id:"taskmanagement"}
                    ]},
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"} ,
                        {collection:"status"},
                        {collection:"priority"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}},
                        {field:"date", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"status", type:"string", collectionid:{$query:{collection:"tasks"}}},
                        {field:"name", type:"string", collectionid:{$query:{collection:"status"}}},
                        {field:"name", type:"date", collectionid:{$query:{collection:"priority"}}}
                    ]}
                ]);
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.indexes", $insert:[
                        {name:"taskUnique", indexes:JSON.stringify({task:1}), background:true, unique:true, collectionid:{$query:{collection:"tasks"}}} ,
                        {name:"statusUnique", indexes:JSON.stringify({name:1}), background:true, unique:true, collectionid:{$query:{collection:"status"}}},
                        {name:"priorityUnique", indexes:JSON.stringify({name:1}), background:true, unique:true, collectionid:{$query:{collection:"priority"}}}
                    ]}
                ]);
            }).then(
            function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data:{commit:true}}
                ]);
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDb = adb;
                return adminDb.query({$collection:"pl.dbs", $fields:{db:1}, $filter:{db:Config.GLOBAL_DB}});
            }).then(
            function (dbResult) {
                return adminDb.update({$collection:"pl.dbs", $update:{_id:dbResult.result[0]._id, $set:{applications:{$insert:[
                    {application:"taskmanagement"}
                ]}}}})
            }).then(
            function () {
                return db.query({$collection:"pl.applications", $filter:{id:"taskmanagement"}});
            }).then(
            function (applicationResult) {
                return db.update({$collection:"pl.applications", $update:{_id:applicationResult.result[0]._id, $set:{collections:{$insert:[
                    {collection:"tasks"},
                    {collection:"status"},
                    {collection:"priority"}
                ]}}}})
            }).then(
            function () {
                return db.connectUnauthorized(Config.GLOBAL_DB);
            }).then(
            function (db1) {
                dbToCheckIndex = db1;
            }).then(
            function () {
                return dbToCheckIndex.collection("tasks");
            }).then(
            function (collectionObj) {
                taskCollection = collectionObj;
            }).then(
            function () {
                return dbToCheckIndex.collection("status");
            }).then(
            function (collectionObj) {
                statusCollection = collectionObj;
            }).then(
            function () {
                return dbToCheckIndex.collection("priority");
            }).then(
            function (collectionObj) {
                priorityCollection = collectionObj;
            }).then(
            function () {
                return taskCollection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(2);
                expect(result[0].name).to.eql("_id_");
                expect(result[1].name).to.eql("taskUnique");
                expect(result[1].unique).to.eql(true);
                expect(result[1].background).to.eql(true);
            }).then(
            function () {
                return statusCollection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(2);
                expect(result[0].name).to.eql("_id_");
                expect(result[1].name).to.eql("statusUnique");
                expect(result[1].unique).to.eql(true);
                expect(result[1].background).to.eql(true);
            }).then(
            function () {
                return priorityCollection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(2);
                expect(result[0].name).to.eql("_id_");
                expect(result[1].name).to.eql("priorityUnique");
                expect(result[1].unique).to.eql(true);
                expect(result[1].background).to.eql(true);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("ensure Index on change in applications in db", function (done) {
        var db = undefined;
        var taskCollection = undefined;
        var statusCollection = undefined;
        var priorityCollection = undefined;
        var adminDb = undefined;
        var dbToCheckIndex = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.applications", $insert:[
                        {label:"Task Management", id:"taskmanagement"}
                    ]},
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"} ,
                        {collection:"status"},
                        {collection:"priority"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}},
                        {field:"date", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"status", type:"string", collectionid:{$query:{collection:"tasks"}}},
                        {field:"name", type:"string", collectionid:{$query:{collection:"status"}}},
                        {field:"name", type:"date", collectionid:{$query:{collection:"priority"}}}
                    ]}
                ]);
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.indexes", $insert:[
                        {name:"taskUnique", indexes:JSON.stringify({task:1}), background:true, unique:true, collectionid:{$query:{collection:"tasks"}}} ,
                        {name:"statusUnique", indexes:JSON.stringify({name:1}), background:true, unique:true, collectionid:{$query:{collection:"status"}}},
                        {name:"priorityUnique", indexes:JSON.stringify({name:1}), background:true, unique:true, collectionid:{$query:{collection:"priority"}}}
                    ]}
                ]);
            }).then(
            function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data:{commit:true}}
                ]);
            }).then(
            function () {
                return db.query({$collection:"pl.applications", $filter:{id:"taskmanagement"}});
            }).then(
            function (applicationResult) {
                return db.update({$collection:"pl.applications", $update:{_id:applicationResult.result[0]._id, $set:{collections:{$insert:[
                    {collection:"tasks"},
                    {collection:"status"},
                    {collection:"priority"}
                ]}}}})
            }).then(
            function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data:{commit:true}}
                ]);
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDb = adb;
                return adminDb.query({$collection:"pl.dbs", $fields:{db:1}, $filter:{db:Config.GLOBAL_DB}});
            }).then(
            function (dbResult) {
                return adminDb.update({$collection:"pl.dbs", $update:{_id:dbResult.result[0]._id, $set:{applications:{$insert:[
                    {application:"taskmanagement"}
                ]}}}})
            }).then(
            function () {
                return db.connectUnauthorized(Config.GLOBAL_DB);
            }).then(
            function (db1) {
                dbToCheckIndex = db1;
            }).then(
            function () {
                return dbToCheckIndex.collection("tasks");
            }).then(
            function (collectionObj) {
                taskCollection = collectionObj;
            }).then(
            function () {
                return dbToCheckIndex.collection("status");
            }).then(
            function (collectionObj) {
                statusCollection = collectionObj;
            }).then(
            function () {
                return dbToCheckIndex.collection("priority");
            }).then(
            function (collectionObj) {
                priorityCollection = collectionObj;
            }).then(
            function () {
                return taskCollection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(2);
                expect(result[0].name).to.eql("_id_");
                expect(result[1].name).to.eql("taskUnique");
                expect(result[1].unique).to.eql(true);
                expect(result[1].background).to.eql(true);
            }).then(
            function () {
                return statusCollection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(2);
                expect(result[0].name).to.eql("_id_");
                expect(result[1].name).to.eql("statusUnique");
                expect(result[1].unique).to.eql(true);
                expect(result[1].background).to.eql(true);
            }).then(
            function () {
                return priorityCollection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(2);
                expect(result[0].name).to.eql("_id_");
                expect(result[1].name).to.eql("priorityUnique");
                expect(result[1].unique).to.eql(true);
                expect(result[1].background).to.eql(true);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("ensure Index on change in indexes in commit collection", function (done) {
        var db = undefined;
        var taskCollection = undefined;
        var statusCollection = undefined;
        var priorityCollection = undefined;
        var adminDb = undefined;
        var dbToCheckIndex = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.applications", $insert:[
                        {label:"Task Management", id:"taskmanagement"}
                    ]},
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"} ,
                        {collection:"status"},
                        {collection:"priority"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}},
                        {field:"date", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"status", type:"string", collectionid:{$query:{collection:"tasks"}}},
                        {field:"name", type:"string", collectionid:{$query:{collection:"status"}}},
                        {field:"name", type:"date", collectionid:{$query:{collection:"priority"}}}
                    ]}
                ]);
            }).then(
            function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data:{commit:true}}
                ]);
            }).then(
            function () {
                return db.query({$collection:"pl.applications", $filter:{id:"taskmanagement"}});
            }).then(
            function (applicationResult) {
                return db.update({$collection:"pl.applications", $update:{_id:applicationResult.result[0]._id, $set:{collections:{$insert:[
                    {collection:"tasks"},
                    {collection:"status"},
                    {collection:"priority"}
                ]}}}})
            }).then(
            function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data:{commit:true}}
                ]);
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDb = adb;
                return adminDb.query({$collection:"pl.dbs", $fields:{db:1}, $filter:{db:Config.GLOBAL_DB}});
            }).then(
            function (dbResult) {
                return adminDb.update({$collection:"pl.dbs", $update:{_id:dbResult.result[0]._id, $set:{applications:{$insert:[
                    {application:"taskmanagement"}
                ]}}}})
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.indexes", $insert:[
                        {name:"taskUnique", indexes:JSON.stringify({task:1}), background:true, unique:true, collectionid:{$query:{collection:"tasks"}}} ,
                        {name:"statusUnique", indexes:JSON.stringify({name:1}), background:true, unique:true, collectionid:{$query:{collection:"status"}}},
                        {name:"priorityUnique", indexes:JSON.stringify({name:1}), background:true, unique:true, collectionid:{$query:{collection:"priority"}}}
                    ]}
                ]);
            }).then(
            function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data:{commit:true}}
                ]);
            }).then(
            function () {
                return require("q").delay(1000);
            }).then(
            function () {
                return db.connectUnauthorized(Config.GLOBAL_DB);
            }).then(
            function (db1) {
                dbToCheckIndex = db1;
            }).then(
            function () {
                return dbToCheckIndex.collection("tasks");
            }).then(
            function (collectionObj) {
                taskCollection = collectionObj;
            }).then(
            function () {
                return dbToCheckIndex.collection("status");
            }).then(
            function (collectionObj) {
                statusCollection = collectionObj;
            }).then(
            function () {
                return dbToCheckIndex.collection("priority");
            }).then(
            function (collectionObj) {
                priorityCollection = collectionObj;
            }).then(
            function () {
                return taskCollection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(2);
                expect(result[0].name).to.eql("_id_");
                expect(result[1].name).to.eql("taskUnique");
                expect(result[1].unique).to.eql(true);
                expect(result[1].background).to.eql(true);
            }).then(
            function () {
                return statusCollection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(2);
                expect(result[0].name).to.eql("_id_");
                expect(result[1].name).to.eql("statusUnique");
                expect(result[1].unique).to.eql(true);
                expect(result[1].background).to.eql(true);
            }).then(
            function () {
                return priorityCollection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(2);
                expect(result[0].name).to.eql("_id_");
                expect(result[1].name).to.eql("priorityUnique");
                expect(result[1].unique).to.eql(true);
                expect(result[1].background).to.eql(true);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("ensure Index on change in indexes in commit collection in child dbs", function (done) {
        var db = undefined;
        var taskCollection = undefined;
        var statusCollection = undefined;
        var priorityCollection = undefined;
        var adminDb = undefined;
        var dbToCheckIndex = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.applications", $insert:[
                        {label:"Task Management", id:"taskmanagement"}
                    ]},
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"} ,
                        {collection:"status"},
                        {collection:"priority"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}},
                        {field:"date", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                        {field:"status", type:"string", collectionid:{$query:{collection:"tasks"}}},
                        {field:"name", type:"string", collectionid:{$query:{collection:"status"}}},
                        {field:"name", type:"date", collectionid:{$query:{collection:"priority"}}}
                    ]}
                ]);
            }).then(
            function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data:{commit:true}}
                ]);
            }).then(
            function () {
                return db.query({$collection:"pl.applications", $filter:{id:"taskmanagement"}});
            }).then(
            function (applicationResult) {
                return db.update({$collection:"pl.applications", $update:{_id:applicationResult.result[0]._id, $set:{collections:{$insert:[
                    {collection:"tasks"},
                    {collection:"status"},
                    {collection:"priority"}
                ]}}}})
            }).then(
            function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data:{commit:true}}
                ]);
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDb = adb;
                return adminDb.query({$collection:"pl.dbs", $fields:{db:1}, $filter:{db:Config.GLOBAL_DB}});
            }).then(
            function (dbResult) {
                return adminDb.update({$collection:"pl.dbs", $update:{_id:dbResult.result[0]._id, $set:{applications:{$insert:[
                    {application:"taskmanagement"}
                ]}}}})
            }).then(
            function () {
                return adminDb.update({$collection:"pl.dbs", $insert:[
                    {db:"northwinddaffodil", applications:[
                        {application:"taskmanagement"}
                    ], globalDb:Config.GLOBAL_DB, globalUserName:Config.OPTIONS.username, guestUserName:Config.OPTIONS.username, ensureUser:true, globalPassword:Config.OPTIONS.password, globalUserAdmin:true},
                ]})
            }).then(
            function () {
                return db.update([
                    {$collection:"pl.indexes", $insert:[
                        {name:"taskUnique", indexes:JSON.stringify({task:1}), background:true, unique:true, collectionid:{$query:{collection:"tasks"}}} ,
                        {name:"statusUnique", indexes:JSON.stringify({name:1}), background:true, unique:true, collectionid:{$query:{collection:"status"}}},
                        {name:"priorityUnique", indexes:JSON.stringify({name:1}), background:true, unique:true, collectionid:{$query:{collection:"priority"}}}
                    ]}
                ]);
            }).then(
            function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data:{commit:true}}
                ]);
            }).then(
            function () {
                return require("q").delay(1000);
            }).then(
            function () {
                return db.connectUnauthorized("northwinddaffodil");
            }).then(
            function (db1) {
                dbToCheckIndex = db1;
            }).then(
            function () {
                return dbToCheckIndex.collection("tasks");
            }).then(
            function (collectionObj) {
                taskCollection = collectionObj;
            }).then(
            function () {
                return dbToCheckIndex.collection("status");
            }).then(
            function (collectionObj) {
                statusCollection = collectionObj;
            }).then(
            function () {
                return dbToCheckIndex.collection("priority");
            }).then(
            function (collectionObj) {
                priorityCollection = collectionObj;
            }).then(
            function () {
                return taskCollection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(2);
                expect(result[0].name).to.eql("_id_");
                expect(result[1].name).to.eql("taskUnique");
                expect(result[1].unique).to.eql(true);
                expect(result[1].background).to.eql(true);
            }).then(
            function () {
                return statusCollection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(2);
                expect(result[0].name).to.eql("_id_");
                expect(result[1].name).to.eql("statusUnique");
                expect(result[1].unique).to.eql(true);
                expect(result[1].background).to.eql(true);
            }).then(
            function () {
                return priorityCollection.getIndexes();
            }).then(
            function (result) {
                expect(result).to.have.length(2);
                expect(result[0].name).to.eql("_id_");
                expect(result[1].name).to.eql("priorityUnique");
                expect(result[1].unique).to.eql(true);
                expect(result[1].background).to.eql(true);
            }).then(
            function () {
                dbToCheckIndex.dropDatabase();
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

})