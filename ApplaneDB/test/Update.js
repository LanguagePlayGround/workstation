/**
 *
 *  mocha --recursive --timeout 150000 -g "simple Updatetestcase" --reporter spec
 *  mocha --recursive --timeout 150000 -g "_id simple" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;

var collectionsToRegister = [
    {
        collection:"tasks",
        fields:[
            {field:"task", type:"string"},
            {field:"type", type:"string"},
            {field:"statusid", type:"fk", collection:"status", set:["status"]}
        ]
    } ,
    {
        collection:"status",
        fields:[
            {field:"status", type:"string"}
        ]
    }
];

var Testcases = require("./TestCases.js");
describe("simple Updatetestcase", function () {

    before(function (done) {
        ApplaneDB.registerCollection(collectionsToRegister).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("simple insert", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;

                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {country:"India", code:"91"},
                        {country:"USA", code:"01"}

                    ]}
                ]
                return  db.update(updates)
            }).then(
            function (result) {
                return  db.query({$collection:COUNTRIES, $sort:{country:1}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
            }).then(
            function () {
                done()
            }).fail(function (err) {
                done(err);
            })
    })


    it("simple update", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;
                return db.mongoUpdate({$collection:COUNTRIES, $insert:[
                    {country:"India", code:"91"},
                    {country:"USA", code:"01"}
                ]})
            }).then(
            function (result) {
                return db.query({$collection:COUNTRIES, $sort:{country:1}})
            }).then(
            function (data) {
                return  db.mongoUpdate({$collection:COUNTRIES, $update:[
                    {$query:{_id:data.result[0]._id}, $set:{code:"+91"}},
                    {$query:{_id:data.result[1]._id}, $set:{code:"+01"}}

                ]});
            }).then(
            function (updateResult) {
                return db.query({$collection:COUNTRIES, $sort:{country:1}})
            }).then(
            function (queryResult) {
                expect(queryResult.result).to.have.length(2);
                expect(queryResult.result[0].code).to.eql("+91");
                expect(queryResult.result[1].code).to.eql("+01");
            }).then(
            function () {
                done()
            }).fail(function (err) {
                done(err);
            })
    })

    it("simple delete", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;
                return db.mongoUpdate({$collection:COUNTRIES, $insert:[
                    {country:"India", code:"91"},
                    {country:"USA", code:"01"}

                ]})
            }).then(
            function (result) {
                return  db.query({$collection:COUNTRIES, $sort:{country:1}})
            }).then(
            function (data) {
                return db.mongoUpdate({$collection:COUNTRIES, $delete:[
                    {_id:data.result[0]._id}

                ]})
            }).then(
            function (deleteResult) {
                return db.query({$collection:COUNTRIES, $sort:{country:1}})
            }).then(
            function (queryResult) {
                expect(queryResult.result).to.have.length(1);
                expect(queryResult.result[0].code).to.eql("01");
            }).then(
            function () {
                done()
            }).fail(function (err) {
                done(err);
            })
    })


    it("_id simple", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;
                return db.update({"$collection":"states_demo", $insert:[
                    { state:"Haryana", code:"21312"} ,
                    {"_id":"Newyork", state:"Newyork", code:"2312"}
                ]})
            }).then(
            function (data) {
                return db.query({$collection:"states_demo", $sort:{state:1}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].state).to.eql("Haryana");
                expect(data.result[0]._id).to.be.an("object");
                expect(data.result[1]._id).to.be.an("string");
                expect(data.result[1]._id).to.eql("Newyork");
                var haryanaStateId = data.result[0]._id;

                var updateStringID = [
                    {"$collection":"states_demo", $update:[
                        {_id:"Newyork", $set:{"state":"Washington"}}  ,
                        {_id:haryanaStateId, $set:{"state":"Haryana1"}} ,
                        {_id:haryanaStateId.toString(), $set:{"state":"Haryana2"}}
                    ]
                    }
                ]
                return db.update(updateStringID)

            }).then(
            function (data) {
                return  db.query({$collection:"states_demo", $sort:{state:1}})

            }).then(
            function (data) {
                expect(data.result[0]._id).to.be.an("object");
                expect(data.result[0].state).to.eql("Haryana2");
                expect(data.result[1].state).to.eql("Washington");

            }).then(
            function () {
                done()
            }).fail(function (err) {
                done(err);
            })
    })

    it("_id multiple", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;


                var insert = [
                    {"$collection":{collection:"states_demo", fields:[
                        {field:"district", type:"object", multiple:true, fields:[
                            {field:"cities", type:"object", multiple:true}
                        ]}
                    ]}, $insert:[
                        {"state":"Haryana", "code":"21312", "district":{$insert:[
                            {"_id":"Hisar", "name":"Hisar", cities:{$insert:[
                                {"_id":"Hisar", name:"Hisar"},
                                {name:"Bhiwani1"}
                            ]}},
                            {"name":"Sirsa"}
                        ]}} ,
                        {"_id":"Newyork", "state":"Newyork", "code":"2312", "district":[
                            {"_id":"Denver", city:"Denver"}
                        ]}
                    ]}
                ]
                return db.update(insert)


            }).then(
            function (data) {


                return db.query({$collection:"states_demo", $sort:{state:1}})

            }).then(
            function (data) {


                expect(data.result).to.have.length(2);
                expect(data.result[0].state).to.eql("Haryana");
                expect(data.result[0]._id).to.be.an("object");
                expect(data.result[1]._id).to.be.a("string");
                expect(data.result[0].district[0]._id).to.be.an("string");
                expect(data.result[0].district[1]._id).to.be.a("object");
                var haryanaID = data.result[0]._id;
                var sirsaId = data.result[0].district[1]._id;
                var update = [
                    {$collection:"states_demo", $update:[
                        {"_id":haryanaID, $set:{"district":{$update:[
                            {_id:sirsaId.toString(), $set:{"cities":[
                                {"name":"Sirsa-city"}
                            ]}}
                        ]}}
                        }
                    ]
                    },
                    {$collection:"states_demo", $update:[
                        {"_id":haryanaID, $set:{"district":{$update:[
                            { "_id":"Hisar", $set:{"cities":[
                                {_id:"Hansi", "name":"Hansi"}
                            ]}}
                        ]}}
                        }
                    ]
                    }  ,
                    {$collection:"states_demo", $update:[
                        {"_id":"Newyork", $set:{"district":{$update:[
                            { "_id":"Denver", $set:{"cities":[
                                {_id:"Hansi", "name":"Hansi"}
                            ]}}
                        ]}}
                        }
                    ]
                    }
                ]
                return db.update(update)

            }).then(
            function (data) {


                return db.query({$collection:"states_demo", $sort:{state:1}})

            }).then(
            function (data) {
                expect(data.result[0].district[1].cities[0].name).to.eql("Sirsa-city");
                expect(data.result[0].district[0].cities[0].name).to.eql("Hansi");
                expect(data.result[1].district[0].cities[0].name).to.eql("Hansi");
            }).then(
            function () {
                done()
            }).fail(function (err) {
                done(err);
            })
    })

    it("_id with fk", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;


                var insert = [
                    {"$collection":{collection:"states_demo", fields:[
                        {field:"district", type:"fk", upsert:true, collection:"district_demo"}
                    ]}, $insert:[
                        {_id:"Haryana", "state":"Haryana", "code":"21312", "district":{"_id":"Hisar", $set:{name:"Hisar"}}
                        } ,
                        {"_id":"California", "state":"California", "code":"2312", "district":{$query:{"name":"Denver"}}
                        }
                    ]}
                ]
                return db.update(insert)


            }).then(
            function (data) {


                return db.query({$collection:"states_demo", $sort:{state:1}})

            }).then(
            function (states) {


                expect(states.result).to.have.length(2);
                expect(states.result[0].district._id).to.be.an("object");
                expect(states.result[1].district._id).to.be.an("string");
                expect(states.result[1].district._id).to.eql("Hisar");
                expect(states.result[1].district.name).to.eql(undefined);
                return db.query({$collection:"district_demo", $sort:{name:1}})

            }).then(
            function (district) {


                expect(district.result).to.have.length(2);
                expect(district.result[0]._id).to.be.an("object");
                expect(district.result[1]._id).to.be.an("string");
                expect(district.result[1]._id).to.eql("Hisar");
                expect(district.result[1].name).to.eql("Hisar");

                var update = [
                    {"$collection":{collection:"states_demo", fields:[
                        {field:"district", type:"fk", collection:"district_demo", upsert:true}
                    ]}, $update:[
                        {  _id:"Haryana", $set:{district:{_id:"Hisar", $set:{name:"Hisar***City"}}}

                        }
                    ]}
                ]
                return db.update(update)

            }).then(
            function (data) {
                return db.query({$collection:"states_demo", $sort:{state:1}})

            }).then(
            function () {
                done()
            }).fail(function (err) {
                done(err);
            })
    })

    it("string type query filter in update", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;
                return db.update({$collection:"tasks", $insert:[
                    {task:"Task1"}
                ], $query:{$filter:{type:"Feature"}}})
            }).then(
            function () {
                return db.query({$collection:"tasks", $filter:{task:"Task1"}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].type).to.eql("Feature");
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"Task2"}
                ], $query:{$filter:{type:"$type"}, $parameters:{type:"Feature"}}});
            }).then(
            function () {
                return db.query({$collection:"tasks", $filter:{task:"Task2"}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].type).to.eql("Feature");
            }).then(
            function () {
                done()
            }).fail(function (err) {
                done(err);
            })
    })

    it("fk type query filter in update", function (done) {
        var db = undefined;
        var statusid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;
                return db.update({$collection:"status", $insert:[
                    {status:"New"}
                ]});
            }).then(
            function () {
                return db.query({$collection:"status"});
            }).then(
            function (result) {
                statusid = result.result[0]._id;
                return db.update({$collection:"tasks", $insert:[
                    {task:"Task1"}
                ], $query:{$filter:{statusid:statusid}}})
            }).then(
            function () {
                return db.query({$collection:"tasks", $filter:{task:"Task1"}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].statusid._id).to.eql(statusid);
                expect(result.result[0].statusid.status).to.eql("New");
            }).then(
            function () {
                return db.update({$collection:"tasks", $insert:[
                    {task:"Task2"}
                ], $query:{$filter:{statusid:"$statusid"}, $parameters:{statusid:statusid}}});
            }).then(
            function () {
                return db.query({$collection:"tasks", $filter:{task:"Task2"}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].statusid._id).to.eql(statusid);
                expect(result.result[0].statusid.status).to.eql("New");
            }).then(
            function () {
                done()
            }).fail(function (err) {
                done(err);
            })
    })

});