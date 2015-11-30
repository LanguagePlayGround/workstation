/**
 * mocha --recursive --timeout 150000 -g "FieldValidationtestcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "Fields Verification insert for type sequence, with multiple sequence type for validation" --reporter spec
 * Created with IntelliJ IDEA.
 * User: Rajit
 * Date: 15/5/14
 * Time: 9:59 AM
 * To change this template use File | Settings | File Templates.
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("FieldValidationtestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it("Fields Verification Simple", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:11, "collection":"country"},
                        {_id:12, "collection":"states"}  ,
                        {_id:13, "collection":"task"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{"collection":"country"}}},
                        {field:"address", type:"string", collectionid:{$query:{"collection":"states"}}},
                        {field:"line1", type:"string", collectionid:{$query:{"collection":"states"}}},
                        {field:"Area", type:"string", collectionid:{$query:{"collection":"states"}}},
                        {field:"city", type:"string", collectionid:{$query:{"collection":"states"}}},
                        {field:"state", type:"string", collectionid:{$query:{"collection":"states"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"states"}, $events:[
                    {
                        function:"onQuery",
                        event:"onQuery",
                        pre:false
                    },
                    {
                        function:"onResult",
                        event:"onQuery",
                        post:false
                    }
                ]});
            }).then(
            function (data) {
                expect(data.result).to.have.length(5);
                expect(data.result[0].field).to.eql("address");
                expect(data.result[1].field).to.eql("line1");
                expect(data.result[2].field).to.eql("Area");
                expect(data.result[3].field).to.eql("city");
                expect(data.result[4].field).to.eql("state");
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification with error", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"cities"},
                        {_id:1002, "collection":"states"}  ,
                        {_id:1003, "collection":"countries"}   ,
                        {_id:1004, "collection":"continents"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {field:"city", type:"string", collectionid:{$query:{"collection":"cities"}}},

                        {field:"state", type:"string", collectionid:{$query:{"collection":"states"}}},
                        {field:"code", type:"number", collectionid:{$query:{"collection":"states"}}},
                        {field:"city1", type:"string", collectionid:{$query:{"collection":"states"}}},


                        {field:"profile", type:"object", collectionid:{$query:{"collection":"states"}}},
                        {field:"name", type:"string", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"code", type:"string", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"address", type:"object", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"line1", type:"string", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"line2", type:"string", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"city", type:"object", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"cityname", type:"string", "parentfieldid":{$query:{"field":"city", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"code", type:"string", "parentfieldid":{$query:{"field":"city", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},

                        {field:"country", type:"string", collectionid:{$query:{"collection":"countries"}}},

                        {field:"continent", type:"string", collectionid:{$query:{"collection":"continents"}}},
                        {field:"code", type:"string", collectionid:{$query:{"collection":"continents"}}},
                        {field:"countryid", type:"fk", collectionid:{$query:{"collection":"states"}}, collection:"countries"},
                        {field:"continentid", type:"fk", collectionid:{$query:{"collection":"countries"}}, collection:"continents"},
                        {field:"stateid", type:"fk", collectionid:{$query:{"collection":"cities"}}, collection:"states", displayField:"city1", set:["code", "state", /*"profile.address.line1", "profile.address.city.code", "profile.name1", "profile.code",*/ "countryid._id", "countryid.country", "countryid.continentid._id", "countryid.continentid.continent"] }
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                if (err.toString().indexOf("field [name1] not found in collection [states]") != -1) {
                    done();
                } else {
                    done(err);
                }
            })
    })
    it("Fields Verification without error", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"cities"},
                        {_id:1002, "collection":"states"}  ,
                        {_id:1003, "collection":"countries"}   ,
                        {_id:1004, "collection":"continents"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {field:"city", type:"string", collectionid:{$query:{"collection":"cities"}}},
                        {field:"state", type:"string", collectionid:{$query:{"collection":"states"}}},
                        {field:"code", type:"number", collectionid:{$query:{"collection":"states"}}},
                        {field:"city1", type:"string", collectionid:{$query:{"collection":"states"}}},
                        {field:"profile", type:"object", collectionid:{$query:{"collection":"states"}}},
                        {field:"name", type:"string", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"code", type:"string", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"address", type:"object", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"line1", type:"string", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"line2", type:"string", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"city", type:"object", "parentfieldid":{$query:{"field":"address", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"cityname", type:"string", "parentfieldid":{$query:{"field":"city", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"code", type:"string", "parentfieldid":{$query:{"field":"city", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"country", type:"string", collectionid:{$query:{"collection":"countries"}}},
                        {field:"continent", type:"string", collectionid:{$query:{"collection":"continents"}}},
                        {field:"code", type:"string", collectionid:{$query:{"collection":"continents"}}},
                        {field:"countryid", type:"fk", collectionid:{$query:{"collection":"states"}}, collection:"countries"},
                        {field:"continentid", type:"fk", collectionid:{$query:{"collection":"countries"}}, collection:"continents"},
                        {field:"stateid", type:"fk", collectionid:{$query:{"collection":"cities"}}, collection:"states", displayField:"city1", set:["code", "state", /*"profile.address.line1", "profile.address.city.code", "profile.name", "profile.code",*/ "countryid._id", "countryid.country", "countryid.continentid._id", "countryid.continentid.continent"] },
                        {field:"Person", type:"object", collectionid:{$query:{"collection":"cities"}}, query:JSON.stringify({"$collection":"states"}), multiple:true, fk:"code"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"cities"}, $events:[
                    {
                        function:"onQuery",
                        event:"onQuery",
                        pre:false
                    },
                    {
                        function:"onResult",
                        event:"onQuery",
                        post:false
                    }
                ]});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].field).to.eql("city");
                expect(data.result[0].type).to.eql("string");
                expect(data.result[1].field).to.eql("stateid");
                expect(data.result[1].type).to.eql("fk");
                expect(data.result[1].collection).to.eql("states");
                expect(data.result[1].displayField).to.eql("city1");
//                expect(data.result[1].set).to.have.length(10);
                expect(data.result[1].set).to.have.length(6);
                expect(data.result[1].set).to.eql(["code", "state", /*"profile.address.line1", "profile.address.city.code", "profile.name", "profile.code",*/ "countryid._id", "countryid.country", "countryid.continentid._id", "countryid.continentid.continent"]);
                expect(data.result[2].type).to.eql("object");
                expect(data.result[2].multiple).to.eql(true);
                expect(data.result[2].fk).to.eql("code");
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification query", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"cities"},
                        {_id:1002, "collection":"states"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {field:"code", type:"number", collectionid:{$query:{"collection":"states"}}},
                        {field:"Person", type:"object", collectionid:{$query:{"collection":"cities"}}, query:JSON.stringify({"$collection":"states"}), multiple:true, fk:"code"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"cities"}, $events:[
                    {
                        function:"onQuery",
                        event:"onQuery",
                        pre:false
                    },
                    {
                        function:"onResult",
                        event:"onQuery",
                        post:false
                    }
                ]});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].type).to.eql("object");
                expect(data.result[0].multiple).to.eql(true);
                expect(data.result[0].fk).to.eql("code");
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification grid", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"cities"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {field:"ui", type:"object", collectionid:{$query:{"collection":"cities"}}, uiForm:"grid", multiple:true}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"cities"}, $events:[
                    {
                        function:"onQuery",
                        event:"onQuery",
                        pre:false
                    },
                    {
                        function:"onResult",
                        event:"onQuery",
                        post:false
                    }
                ]});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].type).to.eql("object");
                expect(data.result[0].multiple).to.eql(true);
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Fields Verification insert for type duration", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"tasks"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"efforts", type:"duration", collectionid:{$query:{"collection":"tasks"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}, $sort:{field:1}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(4);
                expect(data.result[0].field).to.eql("convertedvalue");
                expect(data.result[0].__system__).to.eql(true);
                expect(data.result[0].collectionid._id).to.eql(1001);
                expect(data.result[0].parentfieldid._id).to.eql("111");
                expect(data.result[1].field).to.eql("efforts");
                expect(data.result[2].field).to.eql("time");
                expect(data.result[2].__system__).to.eql(true);
                expect(data.result[2].collectionid._id).to.eql(1001);
                expect(data.result[2].parentfieldid._id).to.eql("111");
                expect(data.result[3].field).to.eql("unit");
                expect(data.result[3].__system__).to.eql(true);
                expect(data.result[3].collectionid._id).to.eql(1001);
                expect(data.result[3].parentfieldid._id).to.eql("111");
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification insert for type currency", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"tasks"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"fees", type:"currency", collectionid:{$query:{"collection":"tasks"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
//                console.log("insert into pl.fields complete>>>>>>>>>>>>>>>>>>>>>>");
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].field).to.eql("fees");
                expect(data.result[1].field).to.eql("amount");
                expect(data.result[1].__system__).to.eql(true);
                expect(data.result[1].collectionid._id).to.eql(1001);
                expect(data.result[1].parentfieldid._id).to.eql("111");
                expect(data.result[2].field).to.eql("type");
                expect(data.result[2].__system__).to.eql(true);
                expect(data.result[2].collectionid._id).to.eql(1001);
                expect(data.result[2].parentfieldid._id).to.eql("111");
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification insert for type unit", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:2223, "collection":"persons"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"weight", type:"unit", collectionid:{$query:{"collection":"persons"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":2223}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].field).to.eql("weight");
                expect(data.result[1].field).to.eql("quantity");
                expect(data.result[1].__system__).to.eql(true);
                expect(data.result[1].collectionid._id).to.eql(2223);
                expect(data.result[1].parentfieldid._id).to.eql("111");
                expect(data.result[2].field).to.eql("unit");
                expect(data.result[2].__system__).to.eql(true);
                expect(data.result[2].collectionid._id).to.eql(2223);
                expect(data.result[2].parentfieldid._id).to.eql("111");
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification insert for type file", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"persons"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"photo", type:"file", collectionid:{$query:{"collection":"persons"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(4);
                expect(data.result[0].field).to.eql("photo");
                expect(data.result[1].field).to.eql("key");
                expect(data.result[1].__system__).to.eql(true);
                expect(data.result[1].collectionid._id).to.eql(1001);
                expect(data.result[1].parentfieldid._id).to.eql("111");
                expect(data.result[2].field).to.eql("name");
                expect(data.result[2].__system__).to.eql(true);
                expect(data.result[2].collectionid._id).to.eql(1001);
                expect(data.result[2].parentfieldid._id).to.eql("111");
                expect(data.result[3].field).to.eql("url");
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Fields Verification delete for type duration", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"tasks"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"efforts", type:"duration", collectionid:{$query:{"collection":"tasks"}}},
                        { field:"task", type:"string", collectionid:{$query:{"collection":"tasks"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}, $sort:{field:1}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(5);
                expect(data.result[0].field).to.eql("convertedvalue");
                expect(data.result[0].__system__).to.eql(true);
                expect(data.result[0].collectionid._id).to.eql(1001);
                expect(data.result[0].parentfieldid._id).to.eql("111");
                expect(data.result[1].field).to.eql("efforts");
                expect(data.result[2].field).to.eql("task");
                expect(data.result[3].field).to.eql("time");
                expect(data.result[3].__system__).to.eql(true);
                expect(data.result[3].collectionid._id).to.eql(1001);
                expect(data.result[3].parentfieldid._id).to.eql("111");
                expect(data.result[4].field).to.eql("unit");
                expect(data.result[4].__system__).to.eql(true);
                expect(data.result[4].collectionid._id).to.eql(1001);
                expect(data.result[4].parentfieldid._id).to.eql("111");

            }).then(
            function () {
                var recordDelete = [
                    {$collection:"pl.fields", $delete:[
                        {_id:"111"}
                    ]}
                ]
                return db.update(recordDelete);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification delete for type currency", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"tasks"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"fees", type:"currency", collectionid:{$query:{"collection":"tasks"}}},
                        { field:"task", type:"string", collectionid:{$query:{"collection":"tasks"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}, $sort:{field:1}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(4);
                expect(data.result[0].field).to.eql("amount");
                expect(data.result[0].__system__).to.eql(true);
                expect(data.result[0].collectionid._id).to.eql(1001);
                expect(data.result[0].parentfieldid._id).to.eql("111");
                expect(data.result[1].field).to.eql("fees");
                expect(data.result[2].field).to.eql("task");
                expect(data.result[3].field).to.eql("type");
                expect(data.result[3].__system__).to.eql(true);
                expect(data.result[3].collectionid._id).to.eql(1001);
                expect(data.result[3].parentfieldid._id).to.eql("111");

            }).then(
            function () {
                var recordDelete = [
                    {$collection:"pl.fields", $delete:[
                        {_id:"111"}
                    ]}
                ]
                return db.update(recordDelete);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].field).to.eql("task");
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification delete for type unit", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:2223, "collection":"persons"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"weight", type:"unit", collectionid:{$query:{"collection":"persons"}}},
                        {field:"name", type:"string", collectionid:{$query:{"collection":"persons"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":2223}, $sort:{field:1}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(4);
                expect(data.result[0].field).to.eql("name");
                expect(data.result[1].field).to.eql("quantity");
                expect(data.result[1].__system__).to.eql(true);
                expect(data.result[1].collectionid._id).to.eql(2223);
                expect(data.result[1].parentfieldid._id).to.eql("111");
                expect(data.result[2].field).to.eql("unit");
                expect(data.result[2].__system__).to.eql(true);
                expect(data.result[2].collectionid._id).to.eql(2223);
                expect(data.result[2].parentfieldid._id).to.eql("111");
                expect(data.result[3].field).to.eql("weight");

            }).then(
            function () {
                var recordDelete = [
                    {$collection:"pl.fields", $delete:[
                        {_id:"111"}
                    ]}
                ]
                return db.update(recordDelete);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":2223}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].field).to.eql("name");
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification delete for type file", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"persons"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"photo", type:"file", collectionid:{$query:{"collection":"persons"}}},
                        {field:"name", type:"string", collectionid:{$query:{"collection":"persons"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}, $sort:{field:1, parentfieldid:1}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(5);
                expect(data.result[0].field).to.eql("key");
                expect(data.result[0].__system__).to.eql(true);
                expect(data.result[0].parentfieldid._id).to.eql("111");
                expect(data.result[0].collectionid._id).to.eql(1001);
                expect(data.result[1].field).to.eql("name");
                expect(data.result[2].field).to.eql("name");
                expect(data.result[2].__system__).to.eql(true);
                expect(data.result[2].collectionid._id).to.eql(1001);
                expect(data.result[2].parentfieldid._id).to.eql("111");
                expect(data.result[3].field).to.eql("photo");
                expect(data.result[4].field).to.eql("url");

            }).then(
            function () {
                var recordDelete = [
                    {$collection:"pl.fields", $delete:[
                        {_id:"111"}
                    ]}
                ]
                return db.update(recordDelete);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].field).to.eql("name");
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Fields Verification when update type duration to currency", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"cities"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:111, field:"closetime", type:"duration", collectionid:{$query:{"collection":"cities"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(4);
                var update = [
                    {$collection:"pl.fields", $update:[
                        {_id:111, $set:{type:"currency"}}
                    ]}
                ]
                return db.update(update)
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].field).to.eql("closetime");
                expect(data.result[1].field).to.eql("amount");
                expect(data.result[2].field).to.eql("type");
                expect(data.result[2].type).to.eql("fk");
                expect(data.result[2].collection).to.eql("pl.currencies");
                expect(data.result[2].set).to.eql(["currency"]);
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification when update type number to currency", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"cities"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:111, field:"citytax", type:"number", collectionid:{$query:{"collection":"cities"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                var update = [
                    {$collection:"pl.fields", $update:[
                        {_id:111, $set:{type:"currency"}}
                    ]}
                ]
                return db.update(update)
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].field).to.eql("citytax");
                expect(data.result[1].field).to.eql("amount");
                expect(data.result[2].field).to.eql("type");
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification when update type currency to number", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"cities"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:111, field:"citytax", type:"currency", collectionid:{$query:{"collection":"cities"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].field).to.eql("citytax");
                expect(data.result[1].field).to.eql("amount");
                expect(data.result[2].field).to.eql("type");
                var update = [
                    {$collection:"pl.fields", $update:[
                        {_id:111, $set:{type:"number"}}
                    ]}
                ]
                return db.update(update)
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].field).to.eql("citytax");
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification insert for type sequence, when parentfield is specify", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"states"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {field:"profile", type:"object", collectionid:{$query:{"collection":"states"}}},
                        {field:"name", type:"sequence", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                done("Not Ok")
            }).fail(function (err) {
                if (err.toString().indexOf("Sequence Type Field [name] must not have any parentfieldid  [ profile ]") != -1) {
                    done();
                } else {
                    done(err);
                }
            })
    })
    it("Fields Verification insert for type sequence, with multiple sequence type for validation", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"invoice"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{"collection":"invoice"}}},
                        {field:"srNo", type:"sequence", collectionid:{$query:{"collection":"invoice"}}}  ,
                        {field:"invoiceNo", type:"sequence", collectionid:{$query:{"collection":"invoice"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                done()
            }).fail(function (err) {    // More than one Sequence Type field cannot be defined in a collection>>doc>>>{"updates":{"field":"invoiceNo","type":"sequence","collectionid":{"_id":1001,"collection":"invoice"},"lastmodifiedtime":"2014-07-28T10:00:51.202Z"},"oldRecord":null,"type":"insert","transientValues":{"collectionid":{}},"collection":"pl.fields"}
                if (err.toString().indexOf('More than one Sequence Type field cannot be defined in a collection>>doc>>>{"updates":{"field":"invoiceNo","type":"sequence","collectionid":{"_id":1001,"collection":"invoice"}') != -1) {
                    done();
                } else {
                    done(err);
                }
            })
    })
    it("Fields Verification insert for type sequence, with multiple sequence type then update for validation", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"invoice"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{"collection":"invoice"}}},
                        {field:"srNo", type:"sequence", collectionid:{$query:{"collection":"invoice"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"invoice"}});
            }).then(
            function (data) {
                var update = [
                    {$collection:"pl.fields", $update:[
                        {_id:data.result[1]._id, $set:{cache:true}}
                    ]}
                ];
                return db.update(update);
            }).then(
            function (result) {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"invoice"}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(2);
                expect(result.result[1].cache).to.eql(true);
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Verification of to lowercase while insert error", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"tasks"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"task", type:"number", collectionid:{$query:{"collection":"tasks"}}, "toLowerCase":true}
                    ]}
                ]
                return db.update(insert);
            }).fail(function (err) {
                if (err.toString().indexOf('To Lower Case cannot be defined for column  type ["number"] in ["tasks"] ')) {
                    done();
                } else {
                    done(err);
                }
            })
    })
    it("Verification of to lowercase while update error", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"tasks"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"task", type:"number", collectionid:{$query:{"collection":"tasks"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var update = [
                    {$collection:"pl.fields", $update:[
                        {_id:"111", $set:{ "toLowerCase":true}}
                    ]}
                ]
                return db.update(update);
            }).fail(function (err) {
                if (err.toString().indexOf('To Lower Case cannot be defined for column  type ["number"] in ["tasks"] ')) {
                    done();
                } else {
                    done(err);
                }
            })
    })
    it("Verification of to lowercase while insert successful", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"tasks"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"task", type:"string", collectionid:{$query:{"collection":"tasks"}}, "toLowerCase":true}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}, $sort:{field:1}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].field).to.eql("task");
                expect(data.result[0].type).to.eql("string");
                expect(data.result[0].toLowerCase).to.eql(true);
                expect(data.result[0].collectionid._id).to.eql(1001);
                expect(data.result[0].collectionid._id).to.eql(1001);

                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Verification of to lowercase while update successful", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"tasks"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"task", type:"string", collectionid:{$query:{"collection":"tasks"}}, "toLowerCase":true}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}, $sort:{field:1}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].field).to.eql("task");
                expect(data.result[0].type).to.eql("string");
                expect(data.result[0].toLowerCase).to.eql(true);
                expect(data.result[0].collectionid._id).to.eql(1001);
                expect(data.result[0].collectionid._id).to.eql(1001);
            }).then(
            function () {
                var update = [
                    {$collection:"pl.fields", $update:[
                        {_id:"111", $set:{"toLowerCase":true}}
                    ]}
                ]
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}, $sort:{field:1}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].field).to.eql("task");
                expect(data.result[0].type).to.eql("string");
                expect(data.result[0].toLowerCase).to.eql(true);
                expect(data.result[0].collectionid._id).to.eql(1001);
                expect(data.result[0].collectionid._id).to.eql(1001);
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification insert for type dateRange", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"tasks"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"efforts", type:"daterange", collectionid:{$query:{"collection":"tasks"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}, $sort:{field:1}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].field).to.eql("efforts");
                expect(data.result[0].type).to.eql("daterange");

                expect(data.result[1].field).to.eql("from");
                expect(data.result[1].__system__).to.eql(true);
                expect(data.result[1].collectionid._id).to.eql(1001);
                expect(data.result[1].parentfieldid._id).to.eql("111");
                expect(data.result[1].type).to.eql("date");

                expect(data.result[2].field).to.eql("to");
                expect(data.result[2].__system__).to.eql(true);
                expect(data.result[2].collectionid._id).to.eql(1001);
                expect(data.result[2].parentfieldid._id).to.eql("111");
                expect(data.result[2].type).to.eql("date");

                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification when update type dateRange to string", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"tasks"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:111, field:"efforts", type:"daterange", collectionid:{$query:{"collection":"tasks"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                var update = [
                    {$collection:"pl.fields", $update:[
                        {_id:111, $set:{type:"string"}}
                    ]}
                ]
                return db.update(update)
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].field).to.eql("efforts");
                expect(data.result[0].type).to.eql("string");
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Fields Verification delete for type dateRange", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"tasks"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"efforts", type:"daterange", collectionid:{$query:{"collection":"tasks"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}, $sort:{field:1}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
            }).then(
            function () {
                var recordDelete = [
                    {$collection:"pl.fields", $delete:[
                        {_id:"111"}
                    ]}
                ]
                return db.update(recordDelete);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid._id":1001}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("check string type when json is true, error case", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"employees"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"name", type:"string", json:true, collectionid:{$query:{collection:"employees"}}}
                ]});
            }).then(
            function () {
                var insert = [
                    {$collection:"employees", $insert:[
                        {"name":"rajit"}
                    ]}
                ];
                return db.update(insert);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                if (err.toString().indexOf("Error while casting for expression [name] with value [rajit] for type [string] in collection [employees].") != -1) {
                    done();
                } else {
                    done(err);
                }
            })
    })
    it("check string type when json is true, right case", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"employees"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"name", type:"string", json:true, collectionid:{$query:{collection:"employees"}}}
                ]});
            }).then(
            function () {
                var insert = [
                    {$collection:"employees", $insert:[
                        {"name":JSON.stringify({'code':'abc'})}
                    ]}
                ];
                return db.update(insert);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("check string type when json is not given, right case", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"employees"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"name", type:"string", collectionid:{$query:{collection:"employees"}}}
                ]});
            }).then(
            function () {
                var insert = [
                    {$collection:"employees", $insert:[
                        {"name":"rajit"}
                    ]}
                ];
                return db.update(insert);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("when parent field expression changes change it in child also", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"states"}
                ]});
            }).then(
            function () {
                var update = [
                    {$collection:"pl.fields", $insert:[
                        {field:"profile", type:"object", collectionid:{$query:{"collection":"states"}}},
                        {field:"name", type:"string", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"code", type:"string", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}},
                        {field:"address", type:"object", "parentfieldid":{$query:{"field":"profile", collectionid:{$query:{"collection":"states"}}}}, collectionid:{$query:{"collection":"states"}}}
                    ]}
                ]
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"states"}});
            }).then(
            function (fields) {
                expect(fields.result).to.have.length(4);
                expect(fields.result[0].field).to.eql("profile");
                expect(fields.result[1].field).to.eql("name");
                expect(fields.result[1].parentfieldid.field).to.eql("profile");
                expect(fields.result[2].field).to.eql("code");
                expect(fields.result[2].parentfieldid.field).to.eql("profile");
                expect(fields.result[3].field).to.eql("address");
                expect(fields.result[2].parentfieldid.field).to.eql("profile");
                return db.update({$collection:"pl.fields", "$update":{"_id":fields.result[0]._id, $set:{"field":"profile1"}}});
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"states"}});
            }).then(
            function (fields) {
                expect(fields.result).to.have.length(4);
                expect(fields.result[0].field).to.eql("profile1");
                expect(fields.result[1].field).to.eql("name");
                expect(fields.result[1].parentfieldid.field).to.eql("profile1");
                expect(fields.result[2].field).to.eql("code");
                expect(fields.result[2].parentfieldid.field).to.eql("profile1");
                expect(fields.result[3].field).to.eql("address");
                expect(fields.result[2].parentfieldid.field).to.eql("profile1");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("when parent menu label changes change it in child menus also", function (done) {
        var db = undefined;
        var applicationid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"states"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.applications", $insert:[
                    {label:"Org Setup"}
                ]});
            }).then(
            function () {
                return db.query({$collection:"pl.applications"});
            }).then(
            function (applications) {
                applicationid = applications.result[0]._id;
                var update = [
                    {$collection:"pl.menus", $insert:[
                        {index:1000, label:"Setup", collection:"states", application:{_id:applicationid}},
                        {index:1001, label:"name", collection:"states", application:{_id:applicationid}, parentmenu:{$query:{label:"Setup", application:{_id:applicationid}}}},
                        {index:1002, label:"code", collection:"states", application:{_id:applicationid}, parentmenu:{$query:{label:"Setup", application:{_id:applicationid}}}}
                    ]}
                ]
                return db.update(update);
            }).then(
            function (result) {
                return db.query({$collection:"pl.menus", $filter:{"application":applicationid }, $sort:{index:1}});
            }).then(
            function (menus) {
                expect(menus.result).to.have.length(3);
                expect(menus.result[0].label).to.eql("Setup");
                expect(menus.result[1].label).to.eql("name");
                expect(menus.result[1].parentmenu.label).to.eql("Setup");
                expect(menus.result[2].label).to.eql("code");
                expect(menus.result[2].parentmenu.label).to.eql("Setup");
                return db.update({$collection:"pl.menus", "$update":{"_id":menus.result[0]._id, $set:{"label":"Setup1"}}});
            }).then(
            function () {
                return db.query({$collection:"pl.menus", $filter:{"application":applicationid}, $sort:{index:1}});
            }).then(
            function (menus) {
                expect(menus.result).to.have.length(3);
                expect(menus.result[0].label).to.eql("Setup1");
                expect(menus.result[1].label).to.eql("name");
                expect(menus.result[1].parentmenu.label).to.eql("Setup1");
                expect(menus.result[2].label).to.eql("code");
                expect(menus.result[2].parentmenu.label).to.eql("Setup1");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
})