/**
 *  mocha --recursive --timeout 150000 -g "Arraytestcase" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("Arraytestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })


    it("simple insert in  string array", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates =
                    [
                        {$collection:"countries", $insert:[
                            {
                                country:"india", states:["haryana", "delhi"]
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection":"countries"});
            }).then(
            function (data) {
//                console.log("countires>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].states).to.have.length(2);
                done();
            }).fail(function (err) {
                done(err);
            });
    })

    it("update with nested  Array inside Object", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {country:"India", code:"91", "states":{ state:"haryana", "cities":[
                            {"city":"hisar", "schools":[
                                {"school":"vdjs"},
                                { "school":"model"}
                            ]},
                            {"city":"sirsa", "schools":[
                                {"school":"jindal"},
                                {"school":"modern"}
                            ]},
                            {"city":"rohtak", "schools":[
                                {"school":"dav"},
                                {"school":"high school"}
                            ]}
                        ]}
                        }
                    ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>>>data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].states.cities).to.have.length(3);
                expect(data.result[0].states.cities[0].schools).to.have.length(2);
                expect(data.result[0].states.cities[1].schools).to.have.length(2);
                var arrayUpdates = [
                    {$collection:{collection:COUNTRIES, fields:[
                        {field:"states", type:"object", fields:[
                            {field:"cities", type:"object", multiple:true, fields:[
                                {field:"schools", type:"object", multiple:true, fields:[
                                    {field:"school", type:"string"}
                                ]}
                            ]}
                        ]}
                    ]}, $update:[
                        {
                            _id:data.result[0]._id,
                            $set:{ "states":{$set:{state:"haryana1",
                                "cities":{"$insert":[
                                    {"city":"bathinda"}
                                ], "$delete":[
                                    {"_id":data.result[0].states.cities[1]._id}
                                ], "$update":[
                                    {"_id":data.result[0].states.cities[0]._id,
                                        "$set":{"city":"firoza-e-hisar", "schools":{"$insert":[
                                            {"school":"happy public school"}
                                        ], "$delete":[
                                            {"_id":data.result[0].states.cities[0].schools[1]._id}
                                        ], "$update":[
                                            {$query:{"school":"vdjs"}, "$set":{"school":"vidya devi jindal school"}}
                                        ]}}}
                                ]   }           }}
                            }}
                    ]}
                ]
                return db.update(arrayUpdates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("data>>>>>>>in countries table after update" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].states.state).to.eql("haryana1");
                expect(data.result[0].states.cities).to.length(3);

                expect(data.result[0].states.cities[0].city).to.eql("firoza-e-hisar");
                expect(data.result[0].states.cities[0].schools).to.have.length(2);
                expect(data.result[0].states.cities[0].schools[0].school).to.eql("vidya devi jindal school");
                expect(data.result[0].states.cities[0].schools[1].school).to.eql("happy public school");

                expect(data.result[0].states.cities[1].city).to.eql("rohtak");
                expect(data.result[0].states.cities[1].schools).to.have.length(2);
                expect(data.result[0].states.cities[1].schools[0].school).to.eql("dav");
                expect(data.result[0].states.cities[1].schools[1].school).to.eql("high school");


                expect(data.result[0].states.cities[2].city).to.eql("bathinda");
                expect(data.result[0].states.cities[2].schools).to.eql(undefined);
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("remove  inserts in case of insert operation", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {country:"India", code:"91", "states":{"$insert":[
                            {state:"haryana", cities:{"$insert":[
                                {"city":"hisar"},
                                {"city":"sirsa"}
                            ]}},
                            {state:"punjab", cities:{"$insert":[
                                {"city":"amritsar"},
                                {"city":"ludhiana"}
                            ]}}
                        ]}},
                        {country:"Pakistan", code:"91", "states":[
                            {state:"lahore", cities:{"$insert":[
                                {"city":"jharkhand"},
                                {"city":"up"}
                            ]}},
                            {state:"multan", cities:{"$insert":[
                                {"city":"bihar"}
                            ]}}
                        ]}
                    ] }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].states).to.have.length(2);
                expect(data.result[0].states[0].cities).to.have.length(2);
                expect(data.result[0].states[0].cities[0].city).to.eql("hisar");
                expect(data.result[0].states[0].cities[1].city).to.eql("sirsa");
                expect(data.result[0].states[1].cities).to.have.length(2);
                expect(data.result[0].states[1].cities[0].city).to.eql("amritsar");
                expect(data.result[0].states[1].cities[1].city).to.eql("ludhiana");

                expect(data.result[1].states).to.have.length(2);
                expect(data.result[1].states[0].cities).to.have.length(2);
                expect(data.result[1].states[0].cities[0].city).to.eql("jharkhand");
                expect(data.result[1].states[0].cities[1].city).to.eql("up");
                expect(data.result[1].states[1].cities).to.have.length(1);
                expect(data.result[1].states[1].cities[0].city).to.eql("bihar");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("simple insert with Array", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {country:"India", code:"91", "states":[
                            {state:"haryana"},
                            {state:"punjab"}
                        ]},
                        {country:"USA", code:"01", "states":[
                            {state:"newyork"},
                            {state:"canada"}
                        ]}

                    ] }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].states).to.have.length(2);
                expect(data.result[0].states[0].state).to.eql("haryana");
                expect(data.result[0].states[1].state).to.eql("punjab");
                expect(data.result[1].states).to.have.length(2);
                expect(data.result[1].states[0].state).to.eql("newyork");
                expect(data.result[1].states[1].state).to.eql("canada");
                done();
            }).fail(function (err) {
                done(err);
            });
    })

    it("All In One set,unset ,inc, override, set in object", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {
                            name:"rohit",
                            status:"single",
                            age:30,
                            address:{line1:"zz", line2:"xx", city:"hansi", state:"haryana", score:9 },
                            gameinfo:{"game":"cricket"},
                            schools:[
                                { school:"pcsd", code:"91", status:"private", score:100},
                                {school:"sdm", code:"92", status:"public", score:98},
                                {school:"psb", code:"93", status:"public", score:90}
                            ],
                            countries:[
                                {country:"india", code:"91", states:[
                                    {state:"haryana", code:"10", cities:[
                                        {city:"hisar", code:"1662"},
                                        {city:"sirsa", code:"1664"},
                                        {city:"rohtak", code:"1262"},
                                        {city:"ggn", code:"124"}
                                    ]}
                                ]},
                                { country:"USA", code:"0011", states:[
                                    {state:"new york", code:"12", cities:[
                                        {city:"manhattan", code:"1662"},
                                        {city:"brooklyn", code:"1664"}
                                    ]},
                                    {state:"washington", code:"132", cities:[
                                        {city:"florida", code:"1754"},
                                        {city:"dc1", code:111}
                                    ]}
                                ]}
                            ],
                            languages:[
                                { language:"hindi"},
                                {language:"urdu"}
                            ],
                            score:10
                        }
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].address.line1).to.eql("zz");
                expect(data.result[0].address.line2).to.eql("xx");
                expect(data.result[0].address.city).to.eql("hansi");
                expect(data.result[0].gameinfo.game).to.eql("cricket");
                expect(data.result[0].schools).to.have.length(3);
                expect(data.result[0].countries).to.have.length(2);
                expect(data.result[0].countries[0].states).to.have.length(1);
                expect(data.result[0].countries[1].states).to.have.length(2);
                expect(data.result[0].countries[0].states[0].cities).to.have.length(4);
                expect(data.result[0].countries[1].states[0].cities).to.have.length(2);
                expect(data.result[0].countries[1].states[1].cities).to.have.length(2);
                expect(data.result[0].languages).to.have.length(2);
                expect(data.result[0].score).to.eql(10);
                var arrayUpdates = [
                    {$collection:COUNTRIES, $update:[
                        {
                            _id:data.result[0]._id,
                            $set:{
                                "address":{$set:{line1:"z1"}, $unset:{line2:""}},
                                status:"married",
                                schools:{
                                    $insert:[
                                        { school:"dav", score:"17"}
                                    ], $update:[
                                        {_id:data.result[0].schools[1]._id, $set:{school:"SDM"}, $unset:{status:""}}
                                    ], $delete:[
                                        {_id:data.result[0].schools[0]._id}
                                    ]
                                },
                                countries:{
                                    $insert:[
                                        { country:"Pakistan", code:"92", states:[
                                            {state:"lahore", code:"12", cities:[
                                                {city:"multan", code:"1662"}
                                            ]}
                                        ]}
                                    ],
                                    $update:[
                                        {_id:data.result[0].countries[1]._id, $set:{states:{$insert:[
                                            {state:"canada", code:"121", cities:[
                                                {city:"mini-punjab", code:"18852"}
                                            ]}
                                        ], $delete:[
                                            {_id:data.result[0].countries[1].states[0]._id}
                                        ], $update:[
                                            {"_id":data.result[0].countries[1].states[1]._id, $set:{"cities":{"$insert":[
                                                { city:"abc", code:"1864084"}
                                            ], $delete:[
                                                {"_id":data.result[0].countries[1].states[0].cities[0]._id}
                                            ], $update:[
                                                {"_id":data.result[0].countries[1].states[0].cities[1]._id, "$set":{city:"dc1"}}
                                            ]}}}
                                        ]}}},
                                        {_id:data.result[0].countries[0]._id, $set:{states:{$insert:[
                                            {state:"himachal", code:"099", cities:[
                                                {city:"kasol", code:"876"}
                                            ]}
                                        ]}}
                                        }
                                    ]
                                },
                                languages:[
                                    {language:"english"},
                                    {language:"german"}
                                ]

                            },
                            $unset:{age:"", gameinfo:""},
                            $inc:{score:10}
                        }
                    ]}
                ]
                return db.update(arrayUpdates);
            }).then(
            function () {
//                console.log("after updates as promise");
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].score).to.eql(20);
                expect(data.result[0].languages).to.have.length(2);
                expect(data.result[0].languages[0].language).to.eql("english");
                expect(data.result[0].languages[1].language).to.eql("german");
                expect(data.result[0].address.line1).to.eql("z1");
                expect(data.result[0].schools).to.have.length(3);
                expect(data.result[0].schools[0].school).to.eql("SDM");
                expect(data.result[0].schools[0].score).to.eql(98);
                expect(data.result[0].schools[1].school).to.eql("psb");
                expect(data.result[0].schools[1].score).to.eql(90);
                expect(data.result[0].schools[2].school).to.eql("dav");
                expect(data.result[0].schools[2].score).to.eql("17");


                expect(data.result[0].countries).to.have.length(3);
                expect(data.result[0].countries[1].country).to.eql("USA")
                expect(data.result[0].countries[1].states).to.have.length(2);

                expect(data.result[0].countries[1].states[0].state).to.eql("washington");
                expect(data.result[0].countries[1].states[0].cities).to.have.length(3);
                expect(data.result[0].countries[1].states[0].cities[0].city).to.eql("florida");
                expect(data.result[0].countries[1].states[0].cities[1].city).to.eql("dc1");
                expect(data.result[0].countries[1].states[0].cities[1].code).to.eql(111);
                expect(data.result[0].countries[1].states[0].cities[2].city).to.eql("abc");

                expect(data.result[0].countries[1].states[1].state).to.eql("canada");
                expect(data.result[0].countries[1].states[1].cities).to.have.length(1);
                expect(data.result[0].countries[1].states[1].cities[0].city).to.eql("mini-punjab");

                expect(data.result[0].countries[0].country).to.eql("india")
                expect(data.result[0].countries[0].states).to.have.length(2)
                expect(data.result[0].countries[0].states[0].state).to.eql("haryana")
                expect(data.result[0].countries[0].states[0].cities).to.have.length(4)
                expect(data.result[0].countries[0].states[0].cities[0].city).to.eql("hisar")
                expect(data.result[0].countries[0].states[0].cities[1].city).to.eql("sirsa")
                expect(data.result[0].countries[0].states[0].cities[2].city).to.eql("rohtak")
                expect(data.result[0].countries[0].states[0].cities[3].city).to.eql("ggn")
                expect(data.result[0].countries[0].states[1].state).to.eql("himachal")
                expect(data.result[0].countries[0].states[1].cities).to.have.length(1)
                expect(data.result[0].countries[0].states[1].cities[0].city).to.eql("kasol");


                expect(data.result[0].countries[2].country).to.eql("Pakistan")
                expect(data.result[0].countries[2].states).to.have.length(1)
                expect(data.result[0].countries[2].states[0].state).to.eql("lahore")
                expect(data.result[0].countries[2].states[0].cities).to.have.length(1)
                expect(data.result[0].countries[2].states[0].cities[0].city).to.eql("multan")


                done();
            }).fail(function (err) {
                done(err);
            });
    })

    it("simple update with Array in array testcase", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {country:"India", code:"91", "states":[
                            {state:"haryana"},
                            {state:"punjab"},
                            {state:"bihar"}
                        ]},
                        {country:"USA", code:"01", "states":[
                            {state:"newyork"},
                            {state:"canada"}
                        ]}
                    ] }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>>>data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>..>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].states).to.have.length(3);
                expect(data.result[1].states).to.have.length(2);
                var arrayUpdates = [
                    {$collection:COUNTRIES, $update:[
                        {_id:data.result[0]._id,
                            $set:{
                                states:{
                                    $insert:[
                                        {state:"gujrat"}
                                    ],
                                    $delete:[
                                        {_id:data.result[0].states[2]._id}
                                    ],
                                    $update:[
                                        {_id:data.result[0].states[1]._id,
                                            $set:{
                                                state:"punjab1",
                                                cities:{$insert:[
                                                    {city:"bathinda"}
                                                ]}}},
                                        {_id:data.result[0].states[0]._id, $set:{state:"haryana1", cities:[
                                            {city:"sirsa"}
                                        ]}}
                                    ]}}}
                    ]}
                ];
                return db.update(arrayUpdates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].states).to.have.length(3);
                expect(data.result[0].states[0].state).eql("haryana1");
                expect(data.result[0].states[0].cities).to.have.length(1);
                expect(data.result[0].states[0].cities[0].city).eql("sirsa");
                expect(data.result[0].states[1].state).eql("punjab1");
                expect(data.result[0].states[1].cities).to.have.length(1);
                expect(data.result[0].states[1].cities[0].city).eql("bathinda");
                expect(data.result[0].states[2].state).eql("gujrat");
                expect(data.result[1].states).to.have.length(2);
                expect(data.result[1].states[0].state).to.eql("newyork");
                expect(data.result[1].states[1].state).to.eql("canada");
                done();
            }).fail(function (err) {
                done(err);
            });
    })

    it("update with nested  Array  in array testcaess", function (done) {
        var COUNTRIES = "countries";
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {country:"India", code:"91", "states":[
                            {state:"haryana", "cities":[
                                {"city":"hisar", "schools":[
                                    {"school":"vdjs"},
                                    {"school":"model"}
                                ]},
                                {"city":"sirsa", "schools":[
                                    {"school":"jindal"},
                                    {"school":"modern"}
                                ]}
                            ]},
                            {state:"punjab", "cities":[
                                {"city":"amritsar", "schools":[
                                    {"school":"sant kabir"},
                                    {"school":"guru nanak"}
                                ]},
                                {"city":"patiala", "schools":[
                                    {"school":"bhagat singh school"},
                                    {"school":"sukhdev singh school"}
                                ]}
                            ]},
                            { state:"gujrat", "cities":[
                                {"city":"amhemdabad", "schools":[
                                    {"school":"patel school"}
                                ]},
                                {"city":"goa", "schools":[
                                    {"school":"beach school"}
                                ]}
                            ]}
                        ]}
                    ] }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>>>data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].states).to.have.length(3);
                expect(data.result[0].states[0].cities).to.have.length(2);
                expect(data.result[0].states[0].cities[0].schools).to.have.length(2);
                expect(data.result[0].states[1].cities).to.have.length(2);
                expect(data.result[0].states[1].cities[1].schools).to.have.length(2);
                var arrayUpdates = [
                    {$collection:{collection:COUNTRIES, fields:[
                        {field:"states", type:"object", multiple:true, fields:[
                            {field:"cities", type:"object", multiple:true, fields:[
                                {field:"schools", type:"object", multiple:true, fields:[
                                    {field:"school", type:"string"}
                                ]}
                            ]}
                        ]}
                    ]}, $update:[
                        {
                            _id:data.result[0]._id,
                            $set:{states:{$insert:[
                                {state:"gurgoan"}
                            ], $delete:[
                                {$query:{state:"haryana"}},
                                {$query:{state:"gujrat"}}
                            ], $update:[
                                {_id:data.result[0].states[1]._id, $set:{state:"punjab1", cities:{"$insert":[
                                    {"city":"bathinda"}
                                ], "$delete":[
                                    {"_id":data.result[0].states[1].cities[1]._id}
                                ], "$update":[
                                    {"_id":data.result[0].states[1].cities[0]._id,
                                        "$set":{"city":"amritsar1", "schools":{"$insert":[
                                            {"school":"happy public school"}
                                        ], "$delete":[
                                            {"_id":data.result[0].states[1].cities[0].schools[0]._id}
                                        ], "$update":[
                                            {"_id":data.result[0].states[1].cities[0].schools[1]._id, "$set":{"school":"guru nanak school"}}
                                        ]}}}
                                ]}
                                }}
                            ]}}}
                    ]}
                ]
                return db.update(arrayUpdates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("data>>>>>>>in countries table after update" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].states).to.have.length(2);
                expect(data.result[0].states[0].state).to.eql("punjab1");
                expect(data.result[0].states[0].cities).to.length(2);
                expect(data.result[0].states[0].cities[0].city).to.eql("amritsar1");
                expect(data.result[0].states[0].cities[1].city).to.eql("bathinda");
                expect(data.result[0].states[0].cities[0].schools).to.length(2);
                expect(data.result[0].states[0].cities[0].schools[0].school).to.eql("guru nanak school");
                expect(data.result[0].states[0].cities[0].schools[1].school).to.eql("happy public school");

                expect(data.result[0].states[1].state).to.eql("gurgoan");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("update with nested  Array on the basis of query", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {country:"India", code:"91", "states":[
                            {state:"haryana", "cities":[
                                {"city":"hisar", "schools":[
                                    {"school":"vdjs"},
                                    {"school":"model"}
                                ]},
                                {"city":"sirsa", "schools":[
                                    {"school":"jindal"},
                                    {"school":"modern"}
                                ]}
                            ]},
                            { state:"punjab", "cities":[
                                {"city":"amritsar", "schools":[
                                    {"school":"sant kabir"},
                                    {"school":"guru nanak"}
                                ]},
                                {"city":"patiala", "schools":[
                                    {"school":"bhagat singh school"},
                                    {"school":"sukhdev singh school"}
                                ]}
                            ]}
                        ]}
                    ] }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>>>data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].states).to.have.length(2);
                expect(data.result[0].states[0].cities).to.have.length(2);
                expect(data.result[0].states[0].cities[0].schools).to.have.length(2);
                expect(data.result[0].states[1].cities).to.have.length(2);
                expect(data.result[0].states[1].cities[1].schools).to.have.length(2);
                var arrayUpdates = [
                    {$collection:{collection:COUNTRIES, fields:[
                        {field:"states", type:"object", multiple:true, fields:[
                            {field:"cities", type:"object", multiple:true, fields:[
                                {field:"schools", type:"object", multiple:true, fields:[
                                    {field:"school", type:"string"}
                                ]}
                            ]}
                        ]}
                    ]}, $update:[
                        {
                            _id:data.result[0]._id,
                            $set:{states:{$insert:[
                                {state:"gurgoan"}
                            ], $delete:[
                                {$query:{state:"haryana"}}
                            ], $update:[
                                {_id:data.result[0].states[1]._id, $set:{state:"punjab1", cities:{"$insert":[
                                    { "city":"bathinda"}
                                ], "$delete":[
                                    {$query:{city:"patiala"}}
                                ], "$update":[
                                    {"$query":{"_id":data.result[0].states[1].cities[0]._id},
                                        "$set":{"city":"amritsar1", "schools":{"$insert":[
                                            {"school":"happy public school"}
                                        ], "$delete":[
                                            {$query:{school:"sant kabir"}}
                                        ], "$update":[
                                            {$query:{"_id":data.result[0].states[1].cities[0].schools[1]._id}, "$set":{"school":"guru nanak school"}}
                                        ]}}}
                                ]}
                                }}
                            ]}}}
                    ]}
                ]
                return db.update(arrayUpdates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("data>>>>>>>in countries table after update" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].states).to.have.length(2);
                expect(data.result[0].states[0].state).to.eql("punjab1");
                expect(data.result[0].states[0].cities).to.length(2);
                expect(data.result[0].states[0].cities[0].city).to.eql("amritsar1");
                expect(data.result[0].states[0].cities[1].city).to.eql("bathinda");
                expect(data.result[0].states[0].cities[0].schools).to.length(2);
                expect(data.result[0].states[0].cities[0].schools[0].school).to.eql("guru nanak school");
                expect(data.result[0].states[0].cities[0].schools[1].school).to.eql("happy public school");

                expect(data.result[0].states[1].state).to.eql("gurgoan");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("dollar updates with single dollar", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        { "country":"india", "states":[
                            {"state":"haryana"}
                        ]}
                        ,
                        {"country":"USA", "states":[
                            {"state":"New York"},
                            {"state":"haryana"},
                            {"state":"haryana"}
                        ]}
                    ]}

                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>>>data after insert>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[1].states).to.have.length(1);
                expect(data.result[0].states).to.have.length(3);
                var arrayUpdates = [
                    {$collection:COUNTRIES, "$update":[
                        {"$query":{"states.state":"haryana"}, "$set":{"states.$.state":"haryana1"}
                        }
                    ]}
                ]
                return db.mongoUpdate(arrayUpdates, {multi:true});
            }).then(
            function () {
                return db.query({$collection:"countries", $sort:{country:1}});
            }).then(
            function (data) {
                console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].states).to.have.length(3);
                expect(data.result[0].states[0].state).to.eql("New York");
                expect(data.result[0].states[1].state).to.eql("haryana1");
                expect(data.result[0].states[2].state).to.eql("haryana1");


                expect(data.result[1].country).to.eql("india");
                expect(data.result[1].states).to.have.length(1);
                expect(data.result[1].states[0].state).to.eql("haryana1");
                done();
            }).fail(function (err) {
                done(err);
            });
    });


    it("dollar updates with single dollar", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        { "country":"india", "states":[
                            {"state":"haryana"}
                        ]}
                        ,
                        {"country":"USA", "states":[
                            {"state":"New York"},
                            {"state":"haryana"},
                            {"state":"haryana"}
                        ]}
                    ]}

                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>>>data after insert>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[1].states).to.have.length(1);
                expect(data.result[0].states).to.have.length(3);
                var arrayUpdates = [
                    {$collection:COUNTRIES, "$update":[
                        {"$query":{"states.state":"haryana"}, "$set":{"states.$.state":"haryana1"}
                        }
                    ]}
                ]
                return db.mongoUpdate(arrayUpdates, {multi:true});
            }).then(
            function () {
                return db.query({$collection:"countries", $sort:{country:1}});
            }).then(
            function (data) {
                console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].states).to.have.length(3);
                expect(data.result[0].states[0].state).to.eql("New York");
                expect(data.result[0].states[1].state).to.eql("haryana1");
                expect(data.result[0].states[2].state).to.eql("haryana1");


                expect(data.result[1].country).to.eql("india");
                expect(data.result[1].states).to.have.length(1);
                expect(data.result[1].states[0].state).to.eql("haryana1");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("dollar updates with single dollar and unset operation", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        { "country":"india", "states":[
                            {"state":"haryana", "stateno":"h1"}
                        ]}
                        ,
                        {"country":"USA", "states":[
                            {"state":"New York", "stateno":"ny1"},
                            {"state":"haryana", "stateno":"h1"},
                            {"state":"haryana", "stateno":"h1"}
                        ]}
                    ]}

                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>>>data after insert>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[1].states).to.have.length(1);
                expect(data.result[0].states).to.have.length(3);
                var arrayUpdates = [
                    {$collection:COUNTRIES, "$update":[
                        {"$query":{"states.state":"haryana"}, "$unset":{"states.$.stateno":""}
                        }
                    ]}
                ]
                return db.mongoUpdate(arrayUpdates, {multi:true});
            }).then(
            function () {
                return db.query({$collection:"countries", $sort:{country:1}});
            }).then(
            function (data) {
                console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].states).to.have.length(3);
                expect(data.result[0].states[0].state).to.eql("New York");
                expect(data.result[0].states[0].stateno).to.eql("ny1");
                expect(data.result[0].states[1].state).to.eql("haryana");
                expect(data.result[0].states[1].stateno).to.eql(undefined);
                expect(data.result[0].states[2].state).to.eql("haryana");
                expect(data.result[0].states[2].stateno).to.eql(undefined);


                expect(data.result[1].country).to.eql("india");
                expect(data.result[1].states).to.have.length(1);
                expect(data.result[1].states[0].state).to.eql("haryana");
                expect(data.result[1].states[0].stateno).to.eql(undefined);
                done();
            }).fail(function (err) {
                done(err);
            });
    });


    it("second dollar updates with single level", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {"country":"india", "states":[
                            {"state":"haryana", "cityid":{"city":"hisar"}
                            },
                            {"state":"bihar", "cityid":{ "city":"sirsa"}
                            },
                            {"state":"gujrat", "cityid":{ "city":"hisar"}
                            }
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>>>data after insert>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].states).to.have.length(3);
                expect(data.result[0].states[0].state).to.eql("haryana");
                expect(data.result[0].states[1].state).to.eql("bihar");
                expect(data.result[0].states[2].state).to.eql("gujrat");
                var arrayUpdates = [
                    {$collection:COUNTRIES, "$update":[
                        {"$query":{"states.cityid.city":"hisar"}, "$set":{"states.$.cityid.city":"goa"}
                        }
                    ]}
                ]
                return db.mongoUpdate(arrayUpdates, {multi:true});
            }).then(
            function () {

                return db.query({$collection:"countries"});
            }).then(
            function (data) {
//                console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].states).to.have.length(3);
                expect(data.result[0].states[0].state).to.eql("haryana");
                expect(data.result[0].states[0].cityid.city).to.eql("goa");
                expect(data.result[0].states[1].state).to.eql("bihar");
                expect(data.result[0].states[1].cityid.city).to.eql("sirsa");
                expect(data.result[0].states[2].state).to.eql("gujrat");
                expect(data.result[0].states[2].cityid.city).to.eql("goa");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("nested dollar updates", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {"country":"india", "states":[
                            {"state":"haryana", "cities":[
                                {"cityid":{"city":"sirsa"}},
                                {"cityid":{"city":"hisar"}},
                                {"cityid":{"city":"sirsa"}}

                            ]},
                            {"_id":"gujrat", "state":"gujrat", "cities":[
                                {"cityid":{"city":"sirsa"}},
                                {"cityid":{"city":"ahmedabad"}},
                                {"cityid":{"city":"sirsa"}}

                            ]}
                        ]},
                        {"country":"USA", "states":[
                            {"state":"canada", "cities":[
                                {"cityid":{"city":"hisar"}},
                                {"cityid":{"city":"sirsa"}}
                            ]}
                        ]},
                        { "country":"pakistan", "states":[
                            {"state":"lahore", "cities":[
                                {"cityid":{"city":"hisar"}},
                                {"cityid":{"city":"sirsa"}}
                            ]},
                            { "state":"multan", "cities":[
                                {"cityid":{"city":"hisar"}},
                                {"cityid":{"city":"sirsa"}}
                            ]}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>>>data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(3);
                expect(data.result[0].states).to.have.length(1);
                expect(data.result[1].states).to.have.length(2);
                expect(data.result[2].states).to.have.length(2);
                var arrayUpdates = [
                    {$collection:COUNTRIES, "$update":[
                        {"$query":{"states.cities.cityid.city":"sirsa"}, "$set":{"states.$.cities.$.cityid.city":"sirsa1"}
                        }
                    ]}
                ]
                return db.mongoUpdate(arrayUpdates, {multi:true});
            }).then(
            function () {
                return db.query({$collection:"countries", $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(3);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].states).to.have.length(1);
                expect(data.result[0].states[0].cities).to.have.length(2);
                expect(data.result[0].states[0].cities[0].cityid.city).to.eql("hisar");
                expect(data.result[0].states[0].cities[1].cityid.city).to.eql("sirsa1");

                expect(data.result[1].country).to.eql("india");
                expect(data.result[1].states).to.have.length(2);
                expect(data.result[1].states[0].cities).to.have.length(3);
                expect(data.result[1].states[0].cities[0].cityid.city).to.eql("sirsa1");
                expect(data.result[1].states[0].cities[1].cityid.city).to.eql("hisar");
                expect(data.result[1].states[0].cities[2].cityid.city).to.eql("sirsa1");

                expect(data.result[1].states[1].cities).to.have.length(3);
                expect(data.result[1].states[1].cities[0].cityid.city).to.eql("sirsa1");
                expect(data.result[1].states[1].cities[1].cityid.city).to.eql("ahmedabad");
                expect(data.result[1].states[1].cities[2].cityid.city).to.eql("sirsa1");

                expect(data.result[2].country).to.eql("pakistan");
                expect(data.result[2].states).to.have.length(2);
                expect(data.result[2].states[0].cities).to.have.length(2);
                expect(data.result[2].states[0].cities[0].cityid.city).to.eql("hisar");
                expect(data.result[2].states[0].cities[1].cityid.city).to.eql("sirsa1");
                expect(data.result[2].states[1].cities).to.have.length(2);
                expect(data.result[2].states[1].cities[0].cityid.city).to.eql("hisar");
                expect(data.result[2].states[1].cities[1].cityid.city).to.eql("sirsa1");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("nested dollar updates with unset", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {"country":"india", "states":[
                            {"state":"haryana", "cities":[
                                {"cityid":{"city":"sirsa", "cityno":"s1"}},
                                {"cityid":{"city":"hisar", "cityno":"h1"}},
                                {"cityid":{"city":"sirsa", "cityno":"s1"}}

                            ]},
                            {"_id":"gujrat", "state":"gujrat", "cities":[
                                {"cityid":{"city":"sirsa", "cityno":"s1"}},
                                {"cityid":{"city":"ahmedabad", "cityno":"a1"}},
                                {"cityid":{"city":"sirsa", "cityno":"s1"}}

                            ]}
                        ]},
                        {"country":"USA", "states":[
                            {"state":"canada", "cities":[
                                {"cityid":{"city":"hisar", "cityno":"h1"}},
                                {"cityid":{"city":"sirsa", "cityno":"s1"}}
                            ]}
                        ]},
                        { "country":"pakistan", "states":[
                            {"state":"lahore", "cities":[
                                {"cityid":{"city":"hisar", "cityno":"h1"}},
                                {"cityid":{"city":"sirsa", "cityno":"s1"}}
                            ]},
                            { "state":"multan", "cities":[
                                {"cityid":{"city":"hisar", "cityno":"h1"}},
                                {"cityid":{"city":"sirsa", "cityno":"s1"}}
                            ]}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>>>data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(3);
                expect(data.result[0].states).to.have.length(1);
                expect(data.result[1].states).to.have.length(2);
                expect(data.result[2].states).to.have.length(2);
                var arrayUpdates = [
                    {$collection:COUNTRIES, "$update":[
                        {"$query":{"states.cities.cityid.city":"sirsa"}, "$unset":{"states.$.cities.$.cityid.cityno":""}
                        }
                    ]}
                ]
                return db.mongoUpdate(arrayUpdates, {multi:true});
            }).then(
            function () {
                return db.query({$collection:"countries", $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(3);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].states).to.have.length(1);
                expect(data.result[0].states[0].cities).to.have.length(2);
                expect(data.result[0].states[0].cities[0].cityid.city).to.eql("hisar");
                expect(data.result[0].states[0].cities[0].cityid.cityno).to.eql("h1");
                expect(data.result[0].states[0].cities[1].cityid.city).to.eql("sirsa");
                expect(data.result[0].states[0].cities[1].cityid.cityno).to.eql(undefined);

                expect(data.result[1].country).to.eql("india");
                expect(data.result[1].states).to.have.length(2);
                expect(data.result[1].states[0].cities).to.have.length(3);
                expect(data.result[1].states[0].cities[0].cityid.city).to.eql("sirsa");
                expect(data.result[1].states[0].cities[0].cityid.cityno).to.eql(undefined);
                expect(data.result[1].states[0].cities[1].cityid.city).to.eql("hisar");
                expect(data.result[1].states[0].cities[1].cityid.cityno).to.eql("h1");
                expect(data.result[1].states[0].cities[2].cityid.city).to.eql("sirsa");
                expect(data.result[1].states[0].cities[2].cityid.cityno).to.eql(undefined);

                expect(data.result[1].states[1].cities).to.have.length(3);
                expect(data.result[1].states[1].cities[0].cityid.city).to.eql("sirsa");
                expect(data.result[1].states[1].cities[0].cityid.cityno).to.eql(undefined);
                expect(data.result[1].states[1].cities[1].cityid.city).to.eql("ahmedabad");
                expect(data.result[1].states[1].cities[1].cityid.cityno).to.eql("a1");
                expect(data.result[1].states[1].cities[2].cityid.city).to.eql("sirsa");
                expect(data.result[1].states[1].cities[2].cityid.cityno).to.eql(undefined);

                expect(data.result[2].country).to.eql("pakistan");
                expect(data.result[2].states).to.have.length(2);
                expect(data.result[2].states[0].cities).to.have.length(2);
                expect(data.result[2].states[0].cities[0].cityid.city).to.eql("hisar");
                expect(data.result[2].states[0].cities[0].cityid.cityno).to.eql("h1");
                expect(data.result[2].states[0].cities[1].cityid.city).to.eql("sirsa");
                expect(data.result[2].states[0].cities[1].cityid.cityno).to.eql(undefined);
                expect(data.result[2].states[1].cities).to.have.length(2);
                expect(data.result[2].states[1].cities[0].cityid.city).to.eql("hisar");
                expect(data.result[2].states[1].cities[0].cityid.cityno).to.eql("h1");
                expect(data.result[2].states[1].cities[1].cityid.city).to.eql("sirsa");
                expect(data.result[2].states[1].cities[1].cityid.cityno).to.eql(undefined);
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("nested  3 dollar updates", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {"country":"india", "states":[
                            {"state":"haryana", "cities":[
                                {"city":"hisar", "schools":[
                                    {"school":"vdjs"},
                                    {"school":"nyps"},
                                    {"school":"nehru"}
                                ]},
                                {"city":"sirsa", "schools":[
                                    {"school":"jindal"},
                                    {"school":"nehru"}
                                ]}
                            ]}
                        ]},
                        {"country":"pakistan", "states":[
                            { "state":"lahore", "cities":[
                                {"id":"hisar", "city":"hisar", "schools":[
                                    {"id":"vdjs", "school":"vdjs"},
                                    {"id":"nyps", "school":"nyps"},
                                    {"id":"nehru", "school":"nehru"}
                                ]},
                                {"id":"sirsa", "city":"sirsa", "schools":[
                                    {"id":"jindal", "school":"jindal"},
                                    {"id":"nehru", "school":"nehru"}
                                ]}
                            ]},
                            {"_id":"multan", "state":"multan", "cities":[
                                {"id":"hisar", "city":"hisar", "schools":[
                                    {"id":"vdjs", "school":"vdjs"},
                                    {"id":"nyps", "school":"nyps"},
                                    {"id":"nehru", "school":"nehru"}
                                ]},
                                {"id":"sirsa", "city":"sirsa", "schools":[
                                    {"id":"jindal", "school":"jindal"},
                                    {"id":"nehru", "school":"nehru"}
                                ]}
                            ]}
                        ]},
                        { "country":"usa", "states":[
                            {"_id":"amsterdam", "state":"amsterdam", "cities":[
                                {"id":"hisar", "city":"hisar", "schools":[
                                    {"id":"vdjs", "school":"vdjs"},
                                    {"id":"nyps", "school":"nyps"},
                                    {"id":"nehru", "school":"nehru"}
                                ]},
                                {"id":"sirsa", "city":"sirsa", "schools":[
                                    {"id":"jindal", "school":"jindal"},
                                    {"id":"nehru", "school":"nehru"}
                                ]}
                            ]}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return   db.query({$collection:"countries"});
            }).then(
            function (data) {
//                console.log(">>>>>data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(3);
                expect(data.result[0].states).to.have.length(1);
                expect(data.result[0].states[0].cities).to.have.length(2);
                expect(data.result[0].states[0].cities[0].schools).to.have.length(3);
                expect(data.result[0].states[0].cities[1].schools).to.have.length(2);
                var arrayUpdates = [
                    {$collection:COUNTRIES, "$update":[
                        {"$query":{"states.cities.schools.school":"nehru"}, "$set":{"states.$.cities.$.schools.$.school":"nehru1"}
                        }
                    ]}
                ]
                return db.mongoUpdate(arrayUpdates, {multi:true});
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(3);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].states).to.have.length(1);
                expect(data.result[0].states[0].state).to.eql("haryana");
                expect(data.result[0].states[0].cities).to.have.length(2);
                expect(data.result[0].states[0].cities[0].city).to.eql("hisar");
                expect(data.result[0].states[0].cities[1].city).to.eql("sirsa");
                expect(data.result[0].states[0].cities[0].schools).to.have.length(3);
                expect(data.result[0].states[0].cities[0].schools).to.have.length(3);
                expect(data.result[0].states[0].cities[0].schools[0].school).to.eql("vdjs");
                expect(data.result[0].states[0].cities[0].schools[1].school).to.eql("nyps");
                expect(data.result[0].states[0].cities[0].schools[2].school).to.eql("nehru1");
                expect(data.result[0].states[0].cities[1].schools).to.have.length(2);
                expect(data.result[0].states[0].cities[1].schools[0].school).to.eql("jindal");
                expect(data.result[0].states[0].cities[1].schools[1].school).to.eql("nehru1");


                expect(data.result[1].country).to.eql("pakistan");
                expect(data.result[1].states).to.have.length(2);
                expect(data.result[1].states[0].state).to.eql("lahore");
                expect(data.result[1].states[0].cities).to.have.length(2);
                expect(data.result[1].states[0].cities[0].city).to.eql("hisar");
                expect(data.result[1].states[0].cities[1].city).to.eql("sirsa");
                expect(data.result[1].states[0].cities[0].schools).to.have.length(3);
                expect(data.result[1].states[0].cities[0].schools).to.have.length(3);
                expect(data.result[1].states[0].cities[0].schools[0].school).to.eql("vdjs");
                expect(data.result[1].states[0].cities[0].schools[1].school).to.eql("nyps");
                expect(data.result[1].states[0].cities[0].schools[2].school).to.eql("nehru1");
                expect(data.result[1].states[0].cities[1].schools).to.have.length(2);
                expect(data.result[1].states[0].cities[1].schools[0].school).to.eql("jindal");
                expect(data.result[1].states[0].cities[1].schools[1].school).to.eql("nehru1");

                expect(data.result[1].states[1].state).to.eql("multan");
                expect(data.result[1].states[1].cities).to.have.length(2);
                expect(data.result[1].states[1].cities[0].city).to.eql("hisar");
                expect(data.result[1].states[1].cities[1].city).to.eql("sirsa");
                expect(data.result[1].states[1].cities[0].schools).to.have.length(3);
                expect(data.result[1].states[1].cities[0].schools).to.have.length(3);
                expect(data.result[1].states[1].cities[0].schools[0].school).to.eql("vdjs");
                expect(data.result[1].states[1].cities[0].schools[1].school).to.eql("nyps");
                expect(data.result[1].states[1].cities[0].schools[2].school).to.eql("nehru1");
                expect(data.result[1].states[1].cities[1].schools).to.have.length(2);
                expect(data.result[1].states[1].cities[1].schools[0].school).to.eql("jindal");
                expect(data.result[1].states[1].cities[1].schools[1].school).to.eql("nehru1");


                expect(data.result[2].country).to.eql("usa");
                expect(data.result[2].states).to.have.length(1);
                expect(data.result[2].states[0].state).to.eql("amsterdam");
                expect(data.result[2].states[0].cities).to.have.length(2);
                expect(data.result[2].states[0].cities[0].city).to.eql("hisar");
                expect(data.result[2].states[0].cities[1].city).to.eql("sirsa");
                expect(data.result[2].states[0].cities[0].schools).to.have.length(3);
                expect(data.result[2].states[0].cities[0].schools).to.have.length(3);
                expect(data.result[2].states[0].cities[0].schools[0].school).to.eql("vdjs");
                expect(data.result[2].states[0].cities[0].schools[1].school).to.eql("nyps");
                expect(data.result[2].states[0].cities[0].schools[2].school).to.eql("nehru1");
                expect(data.result[2].states[0].cities[1].schools).to.have.length(2);
                expect(data.result[2].states[0].cities[1].schools[0].school).to.eql("jindal");
                expect(data.result[2].states[0].cities[1].schools[1].school).to.eql("nehru1");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("test case by sachin bansal", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"address", type:"object", multiple:true, fields:[
                                {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city"]}
                            ]}
                        ]},
                        $insert:[
                            {name:"Pawan", address:[
                                {address:"212", cityid:{$query:{city:"sirsa"}}}
                            ]},
                            { name:"Rohit", address:[
                                {address:"23123", cityid:{$query:{city:"hisar"}}}
                            ]},
                            {name:"Sachin", address:[
                                {address:"1234", cityid:{$query:{city:"hisar"}}},
                                {address:"2132", cityid:{$query:{city:"sirsa"}}} ,
                                {address:"213211", cityid:{$query:{city:"hisar"}}}
                            ]}
                        ]

                    }
                ];
                return db.update(updates);
            }).then(
            function () {

                return db.query({$collection:"persons", $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("data after insert>>>>>>>>>>>" + JSON.stringify(data));
                return db.query({$collection:"cities"});
            }).then(
            function (data) {
//                console.log("data after insert>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                var arrayUpdates = {"$collection":"persons", "$update":[
                    {"$query":{"address.cityid._id":data.result[1]._id}, "$set":{"address.$.cityid.city":"hisar1"}}
                ]};
                return db.mongoUpdate(arrayUpdates, {multi:true});
            }).then(
            function () {
                return      db.query({$collection:"persons"});
            }).then(
            function (data) {
//                console.log(">>>data>>>after update>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(3);
                expect(data.result[0].name).to.eql("Pawan");
                expect(data.result[0].address).to.have.length(1);
                expect(data.result[0].address[0].cityid.city).to.eql("sirsa");
                expect(data.result[1].name).to.eql("Rohit");
                expect(data.result[1].address).to.have.length(1);
                expect(data.result[1].address[0].cityid.city).to.eql("hisar1");
                expect(data.result[2].name).to.eql("Sachin");
                expect(data.result[2].address).to.have.length(3);
                expect(data.result[2].address[0].cityid.city).to.eql("hisar1");
                expect(data.result[2].address[1].cityid.city).to.eql("sirsa");
                expect(data.result[2].address[2].cityid.city).to.eql("hisar1");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("inc and set in object case array", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"countries", $insert:[
                        {country:"USA", code:"01", "score":1000, address:{city:"hisar", state:"haryana", "lineno":1}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"countries"});
            }).then(
            function (data) {
                var arrayUpdates = [
                    {$collection:"countries", $update:[
                        {_id:data.result[0]._id, $set:{"country":"India", address:{$set:{city:"Hisar1"}, $inc:{lineno:12}}}, $inc:{score:10}}
                    ]}
                ];
                ;
                return db.update(arrayUpdates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("result>>." + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].score).to.eql(1010);
                done();
            }).fail(function (err) {
                done(err);
            });
    })

    it("update fk column case from dhirender", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:{collection:"countries", fields:[
                        {field:"artistid", type:"fk", upsert:true, collection:"artists"}
                    ]}, $insert:[
                        { country:"USA", artistid:{$query:{_id:1}, $set:{name:"dhirender"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("data>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].artistid._id).to.eql(1);
                var arrayUpdates = [
                    {$collection:{collection:"countries", fields:[
                        {field:"artistid", type:"fk", upsert:true, collection:"artists"}
                    ]}, $update:[
                        {_id:data.result[0]._id, $set:{artistid:{$query:{_id:2}, $set:{name:"dhirender2"}}}}
                    ]}
                ];
                return db.update(arrayUpdates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("data>>>>>>>>>>>after update>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].artistid._id).to.eql(2);
                done();
            }).fail(function (err) {
                done(err);
            });
    })

    it("update nested object with inc and set", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"countries", $insert:[
                        { "country":"USA", "code":1, "state":{"state":"haryana", "rank":100, "city":{"city":"hisar", "score":200, "address":{"lineno":300, "area":"near ketarpaul hospital"}}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"countries"});
            }).then(
            function (data) {
                var arrayUpdates = [
                    {$collection:"countries", $update:[
                        {"_id":data.result[0]._id, "$inc":{"code":10}, "$set":{"country":"india", "state":{"$set":{"state":"LA", "city":{"$set":{"city":"toronto", "address":{"$inc":{"lineno":10}, "$set":{"area":"daffodil"}}}, "$inc":{"score":10}}}, "$inc":{"rank":10}}}}
                    ]}
                ]
                return db.update(arrayUpdates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("data>>>>>>>>>>>after update>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].code).to.eql(11);
                expect(data.result[0].state.state).to.eql("LA");
                expect(data.result[0].state.rank).to.eql(110);
                expect(data.result[0].state.city.city).to.eql("toronto");
                expect(data.result[0].state.city.score).to.eql(210);
                expect(data.result[0].state.city.address.area).to.eql("daffodil");
                expect(data.result[0].state.city.address.lineno).to.eql(310);
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("override in array level 3", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"tasks", "$insert":[
                        {"task":"newtasks", progress:[
                            {progress:"completed", efforts:[
                                {"time":10}
                            ]}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"tasks"});
            }).then(
            function (data) {
                var arrayUpdates = [
                    {$collection:"tasks", "$update":[
                        {_id:data.result[0]._id, $set:{progress:{$update:[
                            {_id:data.result[0].progress[0]._id, $set:{ efforts:[
                                {time:"5"},
                                {time:"5"}
                            ]}}
                        ]}} }
                    ]}
                ]
                return db.update(arrayUpdates);
            }).then(
            function () {
                return db.query({$collection:"tasks", $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("data of tasks after update>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].progress).to.have.length(1);
                expect(data.result[0].progress[0].efforts).to.have.length(2);
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("case of file type column", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"todos", $insert:[
                        {todo:"say hello"}
                    ]
                    }
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"todos"});
            }).then(
            function (data) {
//                console.log("data insert after todos");
                expect(data.result).to.have.length(1);
                expect(data.result[0].todo).to.eql("say hello");
                var arrayUpdates = [
                    {$collection:{collection:"todos", fields:[
                        {field:"photo", type:"file"}
                    ]}, $update:[
                        {"$set":{"photo":{"key":"536b54c7c8e4a734150002f8", "name":"Desert.jpg"}}, "_id":data.result[0]._id}
                    ]}
                ]
                return db.update(arrayUpdates);
            }).then(
            function () {
                return db.query({$collection:"todos"});
            }).then(
            function (data) {
//                console.log("data after update>>>>>." + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].todo).to.eql("say hello");
                expect(data.result[0].photo.key).to.eql("536b54c7c8e4a734150002f8");
                expect(data.result[0].photo.name).to.eql("Desert.jpg");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("case of single dollar to run multiple times", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = {$collection:"countries", $insert:[
                    { "country":"india", "states":[
                        {"state":"haryana", info:{"city":"hansi"}},
                        {"state":"haryana"},
                        {"state":"haryana"},
                        {"state":"haryana"},
                        {"state":"haryana"},
                        {"state":"haryana"},
                        {"state":"haryana"},
                        {"state":"haryana"},
                        {"state":"haryana"},
                        {"state":"haryana"},
                        {"state":"haryana"},
                        {"state":"delhi"}
                    ]}
                ]};
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"countries"});
            }).then(
            function (data) {
//                console.log("data insert after todos");
                expect(data.result).to.have.length(1);
                var arrayUpdates = [
                    {$collection:"countries", "$update":[
                        {"$query":{"states.state":"haryana"}, "$set":{"states.$.state":"haryana1", "states.$.code":"xyz", "states.$.info.code":"002"}
                        }
                    ]}
                ];
                return db.mongoUpdate(arrayUpdates, {multi:true});
            }).then(
            function () {
                return db.query({$collection:"countries"});
            }).then(
            function (data) {
//                console.log("data in logs >>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].states[0].state).to.eql("haryana1");
                expect(data.result[0].states[1].state).to.eql("haryana1");
                expect(data.result[0].states[2].state).to.eql("haryana1");
                expect(data.result[0].states[3].state).to.eql("haryana1");
                expect(data.result[0].states[4].state).to.eql("haryana1");
                expect(data.result[0].states[5].state).to.eql("haryana1");
                expect(data.result[0].states[6].state).to.eql("haryana1");
                expect(data.result[0].states[7].state).to.eql("haryana1");
                expect(data.result[0].states[8].state).to.eql("haryana1");
                expect(data.result[0].states[9].state).to.eql("haryana1");
                expect(data.result[0].states[10].state).to.eql("haryana1");
                expect(data.result[0].states[11].state).to.eql("delhi");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("case when unset in not working", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:{collection:"users", fields:[
                        {field:"artistid", type:"fk", upsert:true, collection:"artists" }
                    ]}, "$insert":[
                        {artistid:{_id:"123123"}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"users"});
            }).then(
            function (data) {
//                console.log("data after insert>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].artistid._id).to.eql("123123");
                var newUpdates = [
                    {$collection:{collection:"users", fields:[
                        {field:"artistid", type:"fk", upsert:true, collection:"artists" }
                    ]}, "$update":[
                        {_id:data.result[0]._id, $unset:{"artistid":1}}
                    ]}
                ];
                return db.update(newUpdates);
            }).then(
            function () {
                return db.query({$collection:"users"});
            }).then(
            function (data) {
//                console.log("Data afterupdate>>>>>>>>>." + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].artistid).to.eql(undefined);
                done();
            }).fail(function (err) {
                done(err);
            });
    })

    it("sort while updating in array", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:{collection:"myusers", fields:[
                        {field:"followers", type:"object", multiple:true, sort:"likes"}
                    ]}, "$insert":[
                        {"name":"ashish", followers:[
                            { follower:"manjeet", likes:15},
                            {follower:"sachin", likes:12},
                            {follower:"naveen", likes:3}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"myusers"});
            }).then(
            function (data) {
//                console.log("data after insert>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                var newUpdates = [
                    {$collection:{collection:"myusers", fields:[
                        {field:"followers", type:"object", multiple:true, sort:"likes"}
                    ]}, "$update":[
                        {_id:data.result[0]._id, $set:{followers:{$insert:[
                            {follower:"ashu", likes:87},
                            {follower:"rajit", likes:55},
                            {follower:"sudeep", likes:1}
                        ]}} }
                    ]}
                ];
                return db.update(newUpdates);
            }).then(
            function () {
                return db.query({$collection:"myusers"});
            }).then(
            function (data) {
//                console.log("data of myusers after update>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].followers).to.have.length(6);
                expect(data.result[0].followers[0].follower).to.eql("sudeep");
                expect(data.result[0].followers[1].follower).to.eql("naveen");
                expect(data.result[0].followers[2].follower).to.eql("sachin");
                expect(data.result[0].followers[3].follower).to.eql("manjeet");
                expect(data.result[0].followers[4].follower).to.eql("rajit");
                expect(data.result[0].followers[5].follower).to.eql("ashu");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("override a fk columns in update", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:{collection:"states", fields:[
                        {field:"countryid", upsert:true, type:"fk", collection:{collection:"countries"}, set:["countryname"]},
                        {field:"cityid", type:"object", fields:[
                            {field:"cityname", type:"string"},
                            {field:"code", type:"string"}
                        ]}
                    ]}, "$insert":[
                        {_id:"UP", "state":"UP", "countryid":{$query:{_id:"india", "countryname":"india"}, $set:{isfree:true}}, "cityid":{"cityname":"luchnow", code:"20"} }
                    ]},
                    {$collection:{collection:"states1", fields:[
                        {field:"countryid", type:"fk", collection:{collection:"countries"}, set:["countryname"]},
                        {field:"cityid", type:"object", fields:[
                            {field:"cityname", type:"string"},
                            {field:"code", type:"string"}
                        ]}
                    ]}, "$insert":[
                        {_id:"UP"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                var newUpdates = [
                    {$collection:{collection:"states1", fields:[
                        {field:"countryid", type:"fk", upsert:true, collection:{collection:"countries"}, set:["countryname", "isfree"]},
                        {field:"cityid", type:"object", fields:[
                            {field:"cityname", type:"string"},
                            {field:"code", type:"string"}
                        ]}
                    ]}, "$update":[
                        {_id:"UP", $set:{state:"UP", countryid:{$set:{countryname:"india", isfree:true}}, cityid:{$set:{"cityname":"luchnow", code:"20"}} }}
                    ]}
                ];
                return db.update(newUpdates);
            }).then(
            function () {
                var newUpdates = [
                    {$collection:{collection:"states1", fields:[
                        {field:"countryid", type:"fk", upsert:true, collection:{collection:"countries"}, set:["countryname", "isfree"]},
                        {field:"cityid", type:"object", fields:[
                            {field:"cityname", type:"string"},
                            {field:"code", type:"string"}
                        ]}
                    ]}, "$update":[
                        {_id:"UP", $set:{countryid:{$set:{_id:"india1", countryname:"pakistan1"}} }}
                    ]}
                ]
                return db.update(newUpdates);
            }).then(
            function () {
                return db.query({$collection:"states1"});
            }).then(
            function (data) {
//                console.log("data in states1 after second update>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].countryid.countryname).to.eql("pakistan1");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("update in nested array using dollar insert", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:{collection:"invoice"}, "$insert":[
                        {"invoiceno":"12" }
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
//                console.log("data after insert>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                var newUpdates = [
                    {$collection:{collection:"invoice"}, "$update":[
                        {_id:data.result[0]._id, $set:{lineitems:{$insert:[
                            {amount:100, deductions:{$insert:[
                                {_id:"31"}
                            ]}}
                        ]}}}
                    ]}
                ];
                return db.update(newUpdates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
//                console.log("data of invoice after update>>>>" + JSON.stringify(data));


                expect(data.result).to.have.length(1);
                expect(data.result[0].lineitems[0].deductions).to.have.length(1);
                expect(data.result[0].lineitems[0].deductions[0]._id).to.eql("31");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("unset a object  multiple field", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"employees", $insert:[
                        {_id:"manjeet", name:"manjeet", direct_reporting_to_id:[
                            {_id:"manjeet", "name":"manjeet"}
                        ] }
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"employees"});
            }).then(
            function (data) {
//                console.log("data >>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("manjeet");
                expect(data.result[0].direct_reporting_to_id[0].name).to.eql("manjeet");
                var arrayUpdates = [
                    {$collection:"employees", "$update":[
                        {"_id":"manjeet", "$unset":{direct_reporting_to_id:""}}
                    ]}
                ];
                return db.update(arrayUpdates);
            }).then(
            function () {
                return db.query({$collection:"employees"});
            }).then(
            function (data) {
//                console.log("data >>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("manjeet");
                expect(data.result[0].direct_reporting_to_id).to.eql(undefined);
                done();

            }).fail(function (err) {
                done(err);
            });
    })
    it("set  a object  multiple field to null", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:{collection:"employees", fields:[
                        {field:"name", type:"string"},
                        {field:"direct_reporting_to_id", type:"object", multiple:true}
                    ]}, $insert:[
                        {_id:"manjeet", name:"manjeet", direct_reporting_to_id:null }
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"employees"});
            }).then(
            function (data) {
//                console.log("data >>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("manjeet");
            }).then(
            function (data) {
                done();
            }).fail(function (err) {
                done(err);
            });
    })
    it("mongoRemoveTestCase", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"employees", $insert:[
                        {name:"Rajit", state:"Delhi", age:25},
                        {name:"Manjeet", state:"Haryana", age:25},
                        {name:"Ashu", state:"Himachal", age:25},
                        {name:"Naveen", state:"Haryana", age:25}
                    ]}
                ]
                return db.mongoUpdate(updates);
            }).then(
            function () {
                return db.query({$collection:"employees"});
            }).then(
            function (data) {
                var updates = [
                    {$collection:"employees", $delete:[
                        {_id:data.result[0]._id}
                    ]}
                ];
                return db.mongoUpdate(updates);
            }).then(
            function (data) {
                expect(data.employees.$delete).to.eql([1]);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it.skip("update with Array of literals", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:COUNTRIES, $insert:[
                        {country:"India", code:"91", "states":["haryana", "punjab", "gujrat", "himachal"
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return  db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
//                console.log(">>>>>data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].states).to.have.length(4);
                var arrayUpdates = [
                    {$collection:COUNTRIES, $update:[
                        {
                            _id:data.result[0]._id,
                            $set:{states:{$insert:[
                                "bihar"
                            ], $delete:["haryana", "punjab", "himachal"]
                            }}}
                    ]}
                ]
                return db.update(arrayUpdates);
            }).then(
            function () {
                return db.query({$collection:COUNTRIES, $sort:{country:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].states).to.have.length(2);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    });

    it("update nochange documents nested array", function (done) {
        var db = undefined;
        var noChange = {   name:"noChange", source:"NorthwindTestCase/lib/VoucherJob"};
        var event = [
            {
                function:noChange,
                event:"onSave",
                pre:true
            }
        ];
        var voucherDef = {"collection":"vouchers", "events":event, fields:[
            {field:"voucherno", "type":"string"},
            {field:"voucherdate", "type":"date"},
            {field:"accountid", type:"fk", collection:{collection:"accounts", fields:[
                {field:"account", type:"string"}
            ]}, set:["type"]},
            {field:"vli", "type":"object", multiple:true, fields:[
                {field:"accountid", type:"fk", collection:{collection:"accounts", fields:[
                    {field:"account", type:"string"}
                ]}, set:["type"]},
                {field:"deductions", type:"object", "multiple":true, fields:[
                    {field:"accountid", type:"fk", collection:"accounts", set:["type"]}
                ]}
            ]}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return ApplaneDB.registerCollection(voucherDef);
            }).then(
            function () {
                return ApplaneDB.registerFunction(noChange);
            }).then(
            function () {
                var updates = [
                    {$collection:voucherDef, $insert:[
                        {
                            voucherno:"001",
                            voucherdate:"2013-12-10",
                            vli:[
                                { vlinumber:"1", deductions:[
                                    {deductionnumber:"3"},
                                    {deductionnumber:"4"}
                                ]},
                                { vlinumber:"2", deductions:[
                                    {deductionnumber:"5"},
                                    {deductionnumber:"6"}
                                ]}
                            ]
                        }
                    ]}
                ]
                return db.update(updates);
            }).then(
            function (updateResult) {
                return db.query({$collection:"vouchers"});
            }).then(
            function (data) {
//                console.log("data after insert>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].voucherno).to.eql("001");
                expect(data.result[0].vli).to.have.length(2);
                expect(data.result[0].vli[0].vlinumber).to.eql("1");
                expect(data.result[0].vli[0].deductions).to.have.length(2);
                expect(data.result[0].vli[0].deductions[0].deductionnumber).to.eql("3");
                expect(data.result[0].vli[0].deductions[1].deductionnumber).to.eql("4");
                expect(data.result[0].vli[1].vlinumber).to.eql("2");
                expect(data.result[0].vli[1].deductions).to.have.length(2);
                expect(data.result[0].vli[1].deductions[0].deductionnumber).to.eql("5");
                expect(data.result[0].vli[1].deductions[1].deductionnumber).to.eql("6");
                var updates = [
                    {$collection:voucherDef, $update:[
                        {
                            _id:data.result[0]._id,
                            $set:{
                                vli:{$update:[
                                    {_id:data.result[0].vli[0]._id, $set:{amount:100, deductions:{$update:[
                                        {_id:data.result[0].vli[0].deductions[0]._id, $set:{amount:200}}
                                    ]}}}
                                ]}
                            }
                        }
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"vouchers"});
            }).then(
            function (data) {
//                console.log("data after update>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].vli).to.have.length(2);
                expect(data.result[0].vli[0].amount).to.eql(100);
                expect(data.result[0].vli[0].vamount).to.eql(100);
                expect(data.result[0].vli[1].vamount).to.eql(100);
                expect(data.result[0].vli[0].deductions).to.have.length(2);
                expect(data.result[0].vli[0].deductions[0].ddamount).to.eql(200);
                expect(data.result[0].vli[0].deductions[1].ddamount).to.eql(200);
                expect(data.result[0].vli[1].deductions).to.have.length(2);
                expect(data.result[0].vli[1].deductions[0].ddamount).to.eql(200);
                expect(data.result[0].vli[1].deductions[1].ddamount).to.eql(200);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    });


    it("Error when no keys in update", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates =
                    [
                        {$collection:{collection:"countries", fields:[
                            {field:"country", type:"string"},
                            {field:"states", type:"object", multiple:true}
                        ]}, $insert:[
                            {
                                country:"india", states:[
                                {_id:"haryana"},
                                {_id:"delhi"}
                            ]
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection":"countries"});
            }).then(
            function (data) {
//                console.log("countires>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].states).to.have.length(2);
                var updates = [
                    {$collection:"countries", $update:[
                        {_id:data.result[0]._id, $set:{states:{$update:[
                            {_id:data.result[0].states[0]._id, $set:{}}
                        ]}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"countries"});
            }).then(
            function (data) {
//                console.log("data after update>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].states).to.have.length(2);
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("delete a fk multiple columns", function (done) {
        var COUNTRIES = "countries";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:{collection:"states", fields:[
                        {field:"countryid", upsert:true, type:"fk", multiple:true, collection:{collection:"countries"}, set:["countryname"]},
                        {field:"cityid", type:"object", fields:[
                            {field:"cityname", type:"string"},
                            {field:"code", type:"string"}
                        ]}
                    ]}, "$insert":[
                        {"state":"UP", "countryid":[
                            {$query:{"countryname":"india"}},
                            {$query:{"countryname":"pak"}}
                        ], "cityid":{"cityname":"luchnow", code:"20"} }
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"states"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].countryid).to.have.length(2);
                var newUpdates = [
                    {$collection:{collection:"states", fields:[
                        {field:"countryid", type:"fk", multiple:true, upsert:true, collection:{collection:"countries"}, set:["countryname"]}
                    ]}, "$update":[
                        {_id:data.result[0]._id, $set:{countryid:{$delete:[
                            {_id:data.result[0].countryid[0]._id}
                        ] } }}
                    ]}
                ];
                return db.update(newUpdates);
            }).then(
            function () {
                return db.query({$collection:"states"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].countryid).to.have.length(1);
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("set a value in a object after its value is set to null", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:{collection:"states"}, "$insert":[
                        {"state":"UP", "address":null, districts:[
                            {district:"lucknow", address:null}
                        ]}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"states"});
            }).then(
            function (data) {
                var updates = {$collection:"states", $update:[
                    {_id:data.result[0]._id, $set:{"address":{line1:"1234"}, districts:{$update:[
                        {_id:data.result[0].districts[0]._id, $set:{"address":{lineno:1}}}
                    ]}}}
                ]}
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"states"});
            }).then(
            function (data) {
                console.log("data>>>" + JSON.stringify(data));
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("dollar all filter", function (done) {
        var COUNTRIES = "tasks";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"},
                        {collection:"tags"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{"collection":"tasks"}}},
                        {field:"tag", type:"string", collectionid:{$query:{"collection":"tags"}}} ,
                        {field:"tagid", type:"fk", collectionid:{$query:{"collection":"tasks"}}, collection:"tags", "set":["tag"], "upsert":true, multiple:true}
                    ]},
                    {$collection:"tasks", "$insert":[
                        {task:"7 wonder task1 s1", "tagid":[
                            {$query:{"tag":"7 wonder"}},
                            {$query:{"tag":"s1"}}
                        ]},
                        {task:"7 wonder task1 s2", "tagid":[
                            {$query:{"tag":"7 wonder"}},
                            {$query:{"tag":"s2"}}
                        ]},
                        {task:"7 wonder task2 s3", "tagid":[
                            {$query:{"tag":"7 wonder"}},
                            {$query:{"tag":"s3"}}
                        ]} ,
                        {task:"8 wonder task1 s1", "tagid":[
                            {$query:{"tag":"8 wonder"}},
                            {$query:{"tag":"s1"}}
                        ]}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"tasks"});
            }).then(
            function (tasks) {
                expect(tasks.result).to.have.length(4);
                expect(tasks.result[0].task).to.eql("7 wonder task1 s1");
                expect(tasks.result[1].task).to.eql("7 wonder task1 s2");
                expect(tasks.result[2].task).to.eql("7 wonder task2 s3");
                expect(tasks.result[3].task).to.eql("8 wonder task1 s1");
                return db.query({$collection:"tags"});
            }).then(
            function (tags) {
                expect(tags.result).to.have.length(5);
                var wonder7tagid = tags.result[0]._id;
                var s1tagid = tags.result[1]._id;
                return db.query({"$collection":"tasks", $filter:{"tagid":{"$all":[
                    wonder7tagid, s1tagid
                ]}}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].task).to.eql("7 wonder task1 s1");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    // for the issue while saving query in object type field in qview fields.
    it("query saving in field and updation", function (done) {
        var COUNTRIES = "tasks";
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"tasks"}
                    ]},
                    {$collection:"tasks", $insert:[
                        {"task":"testing", progress:[
                            {result:"test", "query":JSON.stringify({"$collection":"tasks"})}
                        ]}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"tasks"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].task).to.eql("testing");
                expect(data.result[0].progress).to.have.length(1);
                var query = JSON.parse(data.result[0].progress[0].query);
                expect(query.$collection).to.eql("tasks");
                return db.update({$collection:"tasks", $update:{_id:data.result[0]._id, $set:{progress:{$update:[
                    {_id:data.result[0].progress[0]._id, $set:{"query":JSON.stringify({"$collection":"newtasks"})}}
                ]}}}});
            }).then(
            function () {
                return db.query({$collection:"tasks"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].task).to.eql("testing");
                expect(data.result[0].progress).to.have.length(1);
                var query = JSON.parse(data.result[0].progress[0].query);
                expect(query.$collection).to.eql("newtasks");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });

})






