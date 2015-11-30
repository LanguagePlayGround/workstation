/**
 * mocha --recursive --timeout 150000 -g "Upsert testcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "Upsert without query" --reporter spec
 *
 * Created with IntelliJ IDEA.
 * User: Administrator
 * Date: 4/8/14
 * Time: 1:11 PM
 * To change this template use File | Settings | File Templates.
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("Upsert testcase", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("simple Upsert", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDb) {
                db = connectedDb;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {country:"USA", code:"01", "states":[
                            {_id:"newyork", state:"newyork"},
                            {_id:"canada", state:"canada"}
                        ]},
                        {country:"China", code:"01", "states":[
                            {_id:"bejing", state:"bejing"},
                            {_id:"tokyo", state:"tokyo"}
                        ]}
                    ]}
                ]

                return db.update(updates)

            }).then(
            function (result) {
                return db.query({$collection:COUNTRIES, $sort:{country:1}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].states).to.have.length(2);
                expect(data.result[1].states).to.have.length(2);
                var newUpdates = [
                    {$collection:COUNTRIES, $upsert:[
                        {$query:{"country":"india"}, $set:{"states":[
                            {"state":"haryana", "_id":"haryana"}
                        ]}, $fields:{"country":1, "states":1}
                        }
                    ]}
                    ,
                    {$collection:COUNTRIES, $upsert:[
                        {$query:{"country":"USA"}, $set:{"country":"USA1", "states":{$insert:[
                            {"_id":"las vegas", "state":"las vegas"}
                        ]}}, $fields:{"country":1, "states":1}
                        }
                    ]}
                ]
                return  db.update(newUpdates)

            }).then(
            function (result) {
                expect(result["countries"]["$upsert"]).to.have.length(2);
                expect(result["countries"]["$upsert"][1].country).to.eql("USA1");
            }).then(
            function () {
                done()
            }).then().fail(function (err) {
                done(err);
            })

    });

    it("Upsert without query", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDb) {
                db = connectedDb


                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {country:"USA", code:"01", "states":[
                            {_id:"newyork", state:"newyork"},
                            {_id:"canada", state:"canada"}
                        ]}
                    ]}
                ]

                return db.update(updates)

            }).then(
            function (result) {


                return  db.query({$collection:COUNTRIES, $sort:{country:1}})

            }).then(
            function (data) {


                expect(data.result).to.have.length(1);
                expect(data.result[0].states).to.have.length(2);
                var newUpdates = [
                    {$collection:COUNTRIES, $upsert:[
                        {$set:{"states":[
                            {"state":"haryana", "_id":"haryana"}
                        ]}, $fields:{"country":1, "states":1}
                        }
                    ]}
                ]
                return db.update(newUpdates)


            }).then(
            function (result) {
                expect(result["countries"]["$upsert"]).to.have.length(1);
                expect(result["countries"]["$upsert"][0].country).to.eql(undefined);
                return db.query({$collection:COUNTRIES})

            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
            }).then(
            function () {
                done()
            }).then().fail(function (err) {
                done(err);
            })
    })
    it("upsert with override a property of query with given  set", function (done) {
        console.log("inside testcase");
        var db = undefined;
        var stateid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                console.log("connected");
                var updates = [
                    {$collection:"states", $insert:{statename:"haryana"}}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"states"});
            }).then(
            function (data) {
//                console.log("states data>>>>>" + JSON.stringify(data))
                stateid = data.result[0]._id;
                var updates = {$collection:{collection:"cities", fields:[
                    {field:"stateid", type:"fk", collectionid:"cities", collection:"states"}
                ]}, $upsert:[
                    {$query:{cityname:"hisar", stateid:stateid}, $set:{population:"23432343211", stateid:{_id:stateid}}}
                ]}
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"cities"});
            }).then(
            function (data) {
//                console.log("cities data>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].cityname).to.eql("hisar");
                expect(data.result[0].stateid._id).to.eql(stateid);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    })

    it("Multiple Record found error", function (done) {
        console.log("inside testcase");
        var db = undefined;
        var stateid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                console.log("connected");
            }).then(
            function () {
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"states"},
                        {collection:"cities"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection:"pl.fields", $insert:[
                        {field:"name", width:"100px", type:"string", collectionid:{$query:{collection:"states"}}, ui:"text", visibility:true, index:2},
                        {field:"name", width:"100px", type:"number", collectionid:{$query:{collection:"cities"}}, ui:"number", visibility:true, index:3},
                        {field:"stateid", upsert:true, width:"100px", type:"fk", collectionid:{$query:{collection:"cities"}}, ui:"text", visibility:true, index:4, collection:"states", set:["name"]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection:"states", $insert:[
                        {name:"Haryana"},
                        {name:"Haryana"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection:"cities", $insert:[
                        {name:"Hisar", stateid:{$query:{name:"Haryana"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                done("Not Ok.");
            }).fail(function (err) {
                if (err.toString().indexOf("Mulitple Records found") === -1) {
                    done(err);
                } else {
                    done();
                }
            });
    })
})
