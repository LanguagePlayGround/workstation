/**
 *  mocha --recursive --timeout 150000 -g "Replicate testcase" --reporter spec
 *  mocha --recursive --timeout 150000 -g "fk column in different collections" --reporter spec
 *  mocha --recursive --timeout 150000 -g "simple fk column" --reporter spec
 *
 *
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require('./NorthwindDb.js');
var Testcases = require("./TestCases.js");

describe("Replicate testcase", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("simple fk column", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city"]}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                cityid:{_id:"hisar", $set:{city:"hisar"}}
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                cityid:{_id:"sirsa", $set:{city:"sirsa"}}
                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                cityid:{_id:"hisar", $set:{city:"hisar"}}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
//                console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                var batchUpdates = [
                    {
                        $collection:{collection:"cities", referredfks:[
                            {collectionid:{collection:"persons"}, field:"cityid", set:["city"]}
                        ]},
                        $update:[
                            {
                                _id:cities.result[0]._id,
                                $set:{city:"hisar1"}
                            } ,
                            {
                                _id:cities.result[1]._id,
                                $set:{city:"sirsa1"}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}})
            }).then(
            function (cities) {
                expect(cities.result).to.have.length(2);
                expect(cities.result[0].city).to.eql("hisar1");
                expect(cities.result[1].city).to.eql("sirsa1");
                return db.query({$collection:"persons", $sort:{name:1}});
            }).then(
            function (persons) {
                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                expect(persons.result).to.have.length(3);
                expect(persons.result[0].name).to.eql("Pawan");
                expect(persons.result[1].name).to.eql("Rohit");
                expect(persons.result[2].name).to.eql("Sachin");
                expect(persons.result[0].cityid.city).to.eql("sirsa1");
                expect(persons.result[1].cityid.city).to.eql("hisar1");
                expect(persons.result[2].cityid.city).to.eql("hisar1");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("simple fk column with boolean in set Fields", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city", "exist"]}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                cityid:{_id:"hisar", $set:{city:"hisar", "exist":true}}
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                cityid:{_id:"sirsa", $set:{city:"sirsa", "exist":false}}
                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                cityid:{_id:"hisar", $set:{city:"hisar", "exist":true}}
                            },
                            {
                                _id:"Yogit",
                                name:"Yogit",
                                cityid:{_id:"thane", $set:{city:"thane"}}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
//                console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                var batchUpdates = [
                    {
                        $collection:{collection:"cities", referredfks:[
                            {collectionid:{collection:"persons"}, field:"cityid", set:["city", "exist"]}
                        ]},
                        $update:[
                            {
                                _id:cities.result[0]._id,
                                $set:{exist:false}
                            } ,
                            {
                                _id:cities.result[1]._id,
                                $set:{exist:true}
                            } ,
                            {
                                _id:cities.result[2]._id,
                                $set:{exist:false}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}})
            }).then(
            function (cities) {
                expect(cities.result).to.have.length(3);
                expect(cities.result[0].city).to.eql("hisar");
                expect(cities.result[0].exist).to.eql(false);
                expect(cities.result[1].city).to.eql("sirsa");
                expect(cities.result[1].exist).to.eql(true);
                expect(cities.result[2].city).to.eql("thane");
                expect(cities.result[2].exist).to.eql(false);
                return db.query({$collection:"persons", $sort:{name:1}});
            }).then(
            function (persons) {
                expect(persons.result).to.have.length(4);
                expect(persons.result[0].name).to.eql("Pawan");
                expect(persons.result[1].name).to.eql("Rohit");
                expect(persons.result[2].name).to.eql("Sachin");
                expect(persons.result[3].name).to.eql("Yogit");
                expect(persons.result[0].cityid.city).to.eql("sirsa");
                expect(persons.result[1].cityid.city).to.eql("hisar");
                expect(persons.result[2].cityid.city).to.eql("hisar");
                expect(persons.result[3].cityid.city).to.eql("thane");
                expect(persons.result[0].cityid.exist).to.eql(true);
                expect(persons.result[1].cityid.exist).to.eql(false);
                expect(persons.result[2].cityid.exist).to.eql(false);
                expect(persons.result[3].cityid.exist).to.eql(false);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("simple fk column with null value", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city"]}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                cityid:{_id:"hisar", $set:{city:"hisar"}}
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                cityid:{_id:"sirsa", $set:{city:"sirsa"}}
                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                cityid:{_id:"hisar", $set:{city:"hisar"}}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
//                console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                var batchUpdates = [
                    {
                        $collection:{collection:"cities", referredfks:[
                            {collectionid:{collection:"persons"}, field:"cityid", set:["city"]}
                        ]},
                        $update:[
                            {
                                _id:cities.result[0]._id,
                                $set:{city:""}
                            } ,
                            {
                                _id:cities.result[1]._id,
                                $set:{city:"sirsa1"}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return  db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
                expect(cities.result).to.have.length(2);
                expect(cities.result[0].city).to.eql("");
                expect(cities.result[1].city).to.eql("sirsa1");
                return db.query({$collection:"persons", $sort:{name:1}});
            }).then(
            function (persons) {
//                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                expect(persons.result).to.have.length(3);
                expect(persons.result[0].name).to.eql("Pawan");
                expect(persons.result[1].name).to.eql("Rohit");
                expect(persons.result[2].name).to.eql("Sachin");
                expect(persons.result[0].cityid.city).to.eql("sirsa1");
                expect(persons.result[1].cityid.city).to.eql("");
                expect(persons.result[2].cityid.city).to.eql("");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("simple fk column with two values in set", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city", "code"]}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                cityid:{_id:"hisar", $set:{city:"hisar", code:1662}}
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                cityid:{_id:"sirsa", $set:{city:"sirsa", code:1665}}
                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                cityid:{_id:"hisar", $set:{city:"hisar", code:1662}}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
//                console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                var batchUpdates = [
                    {
                        $collection:{collection:"cities", referredfks:[
                            {collectionid:{collection:"persons"}, field:"cityid", set:["city", "code"]}
                        ]},
                        $update:[
                            {
                                _id:cities.result[0]._id,
                                $set:{city:"hisar1", code:1663}
                            } ,
                            {
                                _id:cities.result[1]._id,
                                $set:{city:"sirsa1", code:1666}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
                expect(cities.result).to.have.length(2);
                expect(cities.result[0].city).to.eql("hisar1");
                expect(cities.result[0].code).to.eql(1663);
                expect(cities.result[1].city).to.eql("sirsa1");
                expect(cities.result[1].code).to.eql(1666);
                return db.query({$collection:"persons", $sort:{name:1}});
            }).then(
            function (persons) {
//                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                expect(persons.result).to.have.length(3);
                expect(persons.result[0].name).to.eql("Pawan");
                expect(persons.result[1].name).to.eql("Rohit");
                expect(persons.result[2].name).to.eql("Sachin");
                expect(persons.result[0].cityid.city).to.eql("sirsa1");
                expect(persons.result[0].cityid.code).to.eql(1666);
                expect(persons.result[1].cityid.city).to.eql("hisar1");
                expect(persons.result[1].cityid.code).to.eql(1663);
                expect(persons.result[2].cityid.city).to.eql("hisar1");
                expect(persons.result[2].cityid.code).to.eql(1663);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("simple fk column with multiple fk column in set", function (done) {
        var db = undefined;
        var entityid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection:"pl.collections", $insert:[
                        { collection:"relationships"},
                        { collection:"entities"},
                        { collection:"categories"}
                    ]}
                ]);
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"name", type:"string", collectionid:{$query:{collection:"categories"}}},
                    {field:"name", type:"string", collectionid:{$query:{collection:"entities"}}},
                    {field:"categoryid", type:"fk", multiple:true, collectionid:{$query:{collection:"entities"}}, set:["name"], collection:"categories"},
                    {field:"lead", type:"string", collectionid:{$query:{collection:"relationships"}}},
                    {field:"entityid", type:"fk", collectionid:{$query:{collection:"relationships"}}, set:["name", "categoryid"], collection:"entities"}
                ]})
            }).then(
            function () {
                return db.update([
                    {$collection:"categories", $insert:[
                        {name:"C1"},
                        {name:"C2"}
                    ]},
                    {$collection:"entities", $insert:[
                        {name:"E1", categoryid:{$insert:[
                            {$query:{name:"C1"}}
                        ]}}
                    ]},
                    {$collection:"relationships", $insert:[
                        {lead:"R1", entityid:{$query:{name:"E1"}}}
                    ]}

                ])
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"entities"});
            }).then(
            function (result) {
                entityid = result.result[0]._id;
                return db.update({$collection:"entities", $update:{_id:entityid, $set:{"categoryid":{$insert:[
                    {$query:{name:"C2"}}
                ]}}}});
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"relationships"});
            }).then(
            function (relationships) {
                relationships = relationships.result[0];
                expect(relationships.lead).to.eql("R1");
                expect(relationships.entityid.name).to.eql("E1");
                expect(relationships.entityid.categoryid).to.have.length(2);
                expect(relationships.entityid.categoryid[0].name).to.eql("C1");
                expect(relationships.entityid.categoryid[1].name).to.eql("C2");
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (result) {
                return db.update({$collection:"entities", $update:{_id:entityid, $set:{"categoryid":{$delete:[
                    {$query:{name:"C1"}}
                ]}}}});
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"relationships"});
            }).then(
            function (relationships) {
                relationships = relationships.result[0];
                expect(relationships.lead).to.eql("R1");
                expect(relationships.entityid.name).to.eql("E1");
                expect(relationships.entityid.categoryid).to.have.length(1);
                expect(relationships.entityid.categoryid[0].name).to.eql("C2");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("simple fk column with multiple Object column in set", function (done) {
        var db = undefined;
        var entityid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection:"pl.collections", $insert:[
                        { collection:"relationships"},
                        { collection:"entities"},
                    ]}
                ]);
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"name", type:"string", collectionid:{$query:{collection:"entities"}}},
                    {field:"contact_details", type:"object", collectionid:{$query:{collection:"entities"}}, multiple:true},
                    {field:"name", type:"string", collectionid:{$query:{collection:"entities"}}, parentfieldid:{$query:{field:"contact_details", collectionid:{$query:{collection:"entities"}}}}},
                    {field:"lead", type:"string", collectionid:{$query:{collection:"relationships"}}},
                    {field:"entityid", type:"fk", collectionid:{$query:{collection:"relationships"}}, set:["name", "contact_details"], collection:"entities"}
                ]})
            }).then(
            function () {
                return db.update([
                    {$collection:"entities", $insert:[
                        {name:"E1", contact_details:{$insert:[
                            {name:"C1"}
                        ]}}
                    ]},
                    {$collection:"relationships", $insert:[
                        {lead:"R1", entityid:{$query:{name:"E1"}}}
                    ]}

                ])
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"entities"});
            }).then(
            function (result) {
                entityid = result.result[0]._id;
                return db.update({$collection:"entities", $update:{_id:entityid, $set:{"contact_details":{$insert:[
                    {name:"C2"}
                ]}}}});
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"relationships"});
            }).then(
            function (relationships) {
                relationships = relationships.result[0];
                expect(relationships.lead).to.eql("R1");
                expect(relationships.entityid.name).to.eql("E1");
                expect(relationships.entityid.contact_details).to.have.length(2);
                expect(relationships.entityid.contact_details[0].name).to.eql("C1");
                expect(relationships.entityid.contact_details[1].name).to.eql("C2");
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (result) {
                return db.update({$collection:"entities", $update:{_id:entityid, $set:{"contact_details":{$delete:[
                    {$query:{name:"C1"}}
                ]}}}});
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"relationships"});
            }).then(
            function (relationships) {
                relationships = relationships.result[0];
                expect(relationships.lead).to.eql("R1");
                expect(relationships.entityid.name).to.eql("E1");
                expect(relationships.entityid.contact_details).to.have.length(1);
                expect(relationships.entityid.contact_details[0].name).to.eql("C2");
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (result) {
                return db.update({$collection:"entities", $update:{_id:entityid, $set:{"contact_details":{$update:[
                    {$query:{name:"C2"}, $set:{name:"C4"}}
                ]}}}});
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"relationships"});
            }).then(
            function (relationships) {
                relationships = relationships.result[0];
                expect(relationships.lead).to.eql("R1");
                expect(relationships.entityid.name).to.eql("E1");
                expect(relationships.entityid.contact_details).to.have.length(1);
                expect(relationships.entityid.contact_details[0].name).to.eql("C4");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("miltiple fk column", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"cityid", type:"fk", multiple:true, collection:"cities", upsert:true, set:["city"]}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                cityid:[
                                    {_id:"hisar", $set:{city:"hisar"}},
                                    {_id:"sirsa", $set:{city:"sirsa"}}
                                ]
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                cityid:[
                                    {_id:"sirsa", $set:{city:"sirsa"}}
                                ]
                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                cityid:[
                                    {_id:"hisar", $set:{city:"hisar"}}
                                ]
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
//                console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                var batchUpdates = [
                    {
                        $collection:{collection:"cities", referredfks:[
                            {collectionid:{collection:"persons"}, field:"cityid.$", set:["city"]}
                        ]},
                        $update:[
                            {
                                _id:cities.result[0]._id,
                                $set:{city:"hisar1"}
                            } ,
                            {
                                _id:cities.result[1]._id,
                                $set:{city:"sirsa1"}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
                expect(cities.result).to.have.length(2);
                expect(cities.result[0].city).to.eql("hisar1");
                expect(cities.result[1].city).to.eql("sirsa1");
                return db.query({$collection:"persons", $sort:{name:1}});
            }).then(
            function (persons) {
//                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                expect(persons.result).to.have.length(3);
                expect(persons.result[0].name).to.eql("Pawan");
                expect(persons.result[1].name).to.eql("Rohit");
                expect(persons.result[2].name).to.eql("Sachin");
                expect(persons.result[0].cityid).to.have.length(1);
                expect(persons.result[0].cityid[0].city).to.eql("sirsa1");
                expect(persons.result[1].cityid).to.have.length(1);
                expect(persons.result[1].cityid[0].city).to.eql("hisar1");
                expect(persons.result[2].cityid).to.have.length(2);
                expect(persons.result[2].cityid[0].city).to.eql("hisar1");
                expect(persons.result[2].cityid[1].city).to.eql("sirsa1");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("fk column in object single", function (done) {

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"address", type:"object", fields:[
                                {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city"]}
                            ]}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                address:{address:"1234", cityid:{_id:"hisar", $set:{city:"hisar"}}}
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                address:{address:"212", cityid:{_id:"sirsa", $set:{city:"sirsa"}}}

                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                address:{address:"23123", cityid:{_id:"hisar", $set:{city:"hisar"}}}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
//                console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                var batchUpdates = [
                    {
                        $collection:{collection:"cities", referredfks:[
                            {collectionid:{collection:"persons"}, field:"address.cityid", set:["city"]}
                        ]},
                        $update:[
                            {
                                _id:cities.result[0]._id,
                                $set:{city:"hisar1"}
                            } ,
                            {
                                _id:cities.result[1]._id,
                                $set:{city:"sirsa1"}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
                expect(cities.result).to.have.length(2);
                expect(cities.result[0].city).to.eql("hisar1");
                expect(cities.result[1].city).to.eql("sirsa1");
                return db.query({$collection:"persons", $sort:{name:1}});
            }).then(
            function (persons) {
//                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                expect(persons.result).to.have.length(3);
                expect(persons.result[0].name).to.eql("Pawan");
                expect(persons.result[1].name).to.eql("Rohit");
                expect(persons.result[2].name).to.eql("Sachin");
                expect(persons.result[0].address.cityid.city).to.eql("sirsa1");
                expect(persons.result[1].address.cityid.city).to.eql("hisar1");
                expect(persons.result[2].address.cityid.city).to.eql("hisar1");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("fk column in object multiple", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"address", type:"object", multiple:true, fields:[
                                {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city"]}
                            ]}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                address:[
                                    {address:"1234", cityid:{_id:"hisar", $set:{city:"hisar"}}},
                                    {address:"2132", cityid:{_id:"sirsa", $set:{city:"sirsa"}}} ,
                                    {address:"213211", cityid:{_id:"hisar", $set:{city:"hisar"}}}
                                ]
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                address:[
                                    {address:"212", cityid:{_id:"sirsa", $set:{city:"sirsa"}}}
                                ]

                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                address:[
                                    {address:"23123", cityid:{_id:"hisar", $set:{city:"hisar"}}}
                                ]
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
//                console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                var batchUpdates = [
                    {
                        $collection:{collection:"cities", referredfks:[
                            {collectionid:{collection:"persons"}, field:"address.$.cityid", set:["city"]}
                        ]},
                        $update:[
                            {
                                _id:cities.result[0]._id,
                                $set:{city:"hisar1"}
                            } ,
                            {
                                _id:cities.result[1]._id,
                                $set:{city:"sirsa1"}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
                expect(cities.result).to.have.length(2);
                expect(cities.result[0].city).to.eql("hisar1");
                expect(cities.result[1].city).to.eql("sirsa1");
                return db.query({$collection:"persons", $sort:{name:1}});
            }).then(
            function (persons) {
//                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                expect(persons.result).to.have.length(3);
                expect(persons.result[0].name).to.eql("Pawan");
                expect(persons.result[1].name).to.eql("Rohit");
                expect(persons.result[2].name).to.eql("Sachin");
                expect(persons.result[0].address).to.have.length(1);
                expect(persons.result[0].address[0].cityid.city).to.eql("sirsa1");
                expect(persons.result[1].address).to.have.length(1);
                expect(persons.result[1].address[0].cityid.city).to.eql("hisar1");
                expect(persons.result[2].address).to.have.length(3);
                expect(persons.result[2].address[0].cityid.city).to.eql("hisar1");
                expect(persons.result[2].address[1].cityid.city).to.eql("sirsa1");
                expect(persons.result[2].address[2].cityid.city).to.eql("hisar1");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("multiple fk column in object multiple", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"address", type:"object", multiple:true, fields:[
                                {field:"cityid", type:"fk", multiple:true, collection:"cities", upsert:true, set:["city"]}
                            ]}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                address:[
                                    {address:"1234", cityid:[
                                        {_id:"hisar", $set:{city:"hisar"}},
                                        {_id:"sirsa", $set:{city:"sirsa"}}
                                    ]},
                                    {address:"2132", cityid:[
                                        {_id:"sirsa", $set:{city:"sirsa"}}
                                    ]} ,
                                    {address:"213211", cityid:[
                                        {_id:"hisar", $set:{city:"hisar"}}
                                    ]}
                                ]
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                address:[
                                    {address:"212", cityid:[
                                        {_id:"sirsa", $set:{city:"sirsa"}},
                                        {_id:"hisar", $set:{city:"hisar"}}
                                    ]}
                                ]

                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                address:[
                                    {address:"23123", cityid:[
                                        {_id:"hisar", $set:{city:"hisar"}}
                                    ]}
                                ]
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
//                console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                var batchUpdates = [
                    {
                        $collection:{collection:"cities", referredfks:[
                            {collectionid:{collection:"persons"}, field:"address.$.cityid.$", set:["city"]}
                        ]},
                        $update:[
                            {
                                _id:cities.result[0]._id,
                                $set:{city:"hisar1"}
                            } ,
                            {
                                _id:cities.result[1]._id,
                                $set:{city:"sirsa1"}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
                expect(cities.result).to.have.length(2);
                expect(cities.result[0].city).to.eql("hisar1");
                expect(cities.result[1].city).to.eql("sirsa1");
                return db.query({$collection:"persons", $sort:{name:1}});
            }).then(
            function (persons) {
//                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                expect(persons.result).to.have.length(3);
                expect(persons.result[0].name).to.eql("Pawan");
                expect(persons.result[1].name).to.eql("Rohit");
                expect(persons.result[2].name).to.eql("Sachin");
                expect(persons.result[0].address).to.have.length(1);
                expect(persons.result[0].address[0].cityid).to.have.length(2);
                expect(persons.result[0].address[0].cityid[0].city).to.eql("sirsa1");
                expect(persons.result[0].address[0].cityid[1].city).to.eql("hisar1");
                expect(persons.result[1].address).to.have.length(1);
                expect(persons.result[1].address[0].cityid).to.have.length(1);
                expect(persons.result[1].address[0].cityid[0].city).to.eql("hisar1");
                expect(persons.result[2].address).to.have.length(3);
                expect(persons.result[2].address[0].cityid).to.have.length(2);
                expect(persons.result[2].address[0].cityid[0].city).to.eql("hisar1");
                expect(persons.result[2].address[0].cityid[1].city).to.eql("sirsa1");
                expect(persons.result[2].address[1].cityid).to.have.length(1);
                expect(persons.result[2].address[1].cityid[0].city).to.eql("sirsa1");
                expect(persons.result[2].address[2].cityid).to.have.length(1);
                expect(persons.result[2].address[2].cityid[0].city).to.eql("hisar1");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("fk column in Two level multiple", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"schools", type:"object", multiple:true, fields:[
                                {field:"address", type:"object", multiple:true, fields:[
                                    {field:"cityid", type:"fk", collection:"cities", upsert:true, set:["city"]}
                                ]}
                            ]}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                schools:[
                                    {name:"S", address:[
                                        {address:"1234", cityid:{_id:"hisar", $set:{city:"hisar"}}},
                                        {address:"2132", cityid:{_id:"sirsa", $set:{city:"sirsa"}}} ,
                                        {address:"213211", cityid:{_id:"hisar", $set:{city:"hisar"}}}
                                    ]}
                                ]
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                schools:[
                                    {name:"P", address:[
                                        {address:"212", cityid:{_id:"sirsa", $set:{city:"sirsa"}}}
                                    ]}
                                ]

                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                schools:[
                                    {name:"R", address:[
                                        {address:"23123", cityid:{_id:"hisar", $set:{city:"hisar"}}}
                                    ]}
                                ]

                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
//                console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                var batchUpdates = [
                    {
                        $collection:{collection:"cities", referredfks:[
                            {collectionid:{collection:"persons"}, field:"schools.$.address.$.cityid", set:["city"]}
                        ]},
                        $update:[
                            {
                                _id:cities.result[0]._id,
                                $set:{city:"hisar1"}
                            } ,
                            {
                                _id:cities.result[1]._id,
                                $set:{city:"sirsa1"}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
                expect(cities.result).to.have.length(2);
                expect(cities.result[0].city).to.eql("hisar1");
                expect(cities.result[1].city).to.eql("sirsa1");
                return db.query({$collection:"persons", $sort:{name:1}});
            }).then(
            function (persons) {
//                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                expect(persons.result).to.have.length(3);
                expect(persons.result[0].name).to.eql("Pawan");
                expect(persons.result[1].name).to.eql("Rohit");
                expect(persons.result[2].name).to.eql("Sachin");
                expect(persons.result[0].schools).to.have.length(1);
                expect(persons.result[0].schools[0].address).to.have.length(1);
                expect(persons.result[0].schools[0].address[0].cityid.city).to.eql("sirsa1");
                expect(persons.result[1].schools).to.have.length(1);
                expect(persons.result[1].schools[0].address).to.have.length(1);
                expect(persons.result[1].schools[0].address[0].cityid.city).to.eql("hisar1");
                expect(persons.result[2].schools).to.have.length(1);
                expect(persons.result[2].schools[0].address).to.have.length(3);
                expect(persons.result[2].schools[0].address[0].cityid.city).to.eql("hisar1");
                expect(persons.result[2].schools[0].address[1].cityid.city).to.eql("sirsa1");
                expect(persons.result[2].schools[0].address[2].cityid.city).to.eql("hisar1");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("multiple fk column in Two level multiple", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"schools", type:"object", multiple:true, fields:[
                                {field:"address", type:"object", multiple:true, fields:[
                                    {field:"cityid", type:"fk", collection:"cities", multiple:true, upsert:true, set:["city"]}
                                ]}
                            ]}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                schools:[
                                    {name:"S", address:[
                                        {address:"1234", cityid:[
                                            {_id:"hisar", $set:{city:"hisar", code:1662}},
                                            {_id:"sirsa", $set:{city:"sirsa", code:1663}}
                                        ]},
                                        {address:"2132", cityid:[
                                            {_id:"sirsa", $set:{city:"sirsa", code:1663}}
                                        ]} ,
                                        {address:"213211", cityid:[
                                            {_id:"hisar", $set:{city:"hisar", code:1662}}
                                        ]}
                                    ]}
                                ]
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                schools:[
                                    {name:"P", address:[
                                        {address:"212", cityid:[
                                            {_id:"sirsa", $set:{city:"sirsa", code:1663}},
                                            {_id:"hisar", $set:{city:"hisar", code:1662}}
                                        ]}
                                    ]}
                                ]

                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                schools:[
                                    {name:"R", address:[
                                        {address:"23123", cityid:[
                                            {_id:"hisar", $set:{city:"hisar", code:1662}}
                                        ]}
                                    ]}
                                ]

                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
                var batchUpdates = [
                    {
                        $collection:{collection:"cities", referredfks:[
                            {collectionid:{collection:"persons"}, field:"schools.$.address.$.cityid.$", set:["city", "code"]}
                        ]},
                        $update:[
                            {
                                _id:cities.result[0]._id,
                                $set:{city:"hisar1", code:1664}
                            } ,
                            {
                                _id:cities.result[1]._id,
                                $set:{city:"sirsa1", code:1665}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
//                console.log("cities data>>>>>>>>>>>>>after update>>>>>>>>>>>>.." + JSON.stringify(cities));
                expect(cities.result).to.have.length(2);
                expect(cities.result[0].city).to.eql("hisar1");
                expect(cities.result[1].city).to.eql("sirsa1");
                expect(cities.result[0].code).to.eql(1664);
                expect(cities.result[1].code).to.eql(1665);
                return db.query({$collection:"persons", $sort:{name:1}});
            }).then(
            function (persons) {
//                console.log("Persons >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                expect(persons.result).to.have.length(3);
                expect(persons.result[0].name).to.eql("Pawan");
                expect(persons.result[1].name).to.eql("Rohit");
                expect(persons.result[2].name).to.eql("Sachin");
                expect(persons.result[0].schools).to.have.length(1);
                expect(persons.result[0].schools[0].address).to.have.length(1);
                expect(persons.result[0].schools[0].address[0].cityid).to.have.length(2);
                expect(persons.result[0].schools[0].address[0].cityid[0].city).to.eql("sirsa1");
                expect(persons.result[0].schools[0].address[0].cityid[0].code).to.eql(1665);
                expect(persons.result[0].schools[0].address[0].cityid[1].city).to.eql("hisar1");
                expect(persons.result[0].schools[0].address[0].cityid[1].code).to.eql(1664);
                expect(persons.result[1].schools).to.have.length(1);
                expect(persons.result[1].schools[0].address).to.have.length(1);
                expect(persons.result[1].schools[0].address[0].cityid).to.have.length(1);
                expect(persons.result[1].schools[0].address[0].cityid[0].city).to.eql("hisar1");
                expect(persons.result[1].schools[0].address[0].cityid[0].code).to.eql(1664);
                expect(persons.result[2].schools).to.have.length(1);
                expect(persons.result[2].schools[0].address).to.have.length(3);
                expect(persons.result[2].schools[0].address[0].cityid).to.have.length(2);
                expect(persons.result[2].schools[0].address[0].cityid[0].city).to.eql("hisar1");
                expect(persons.result[2].schools[0].address[0].cityid[0].code).to.eql(1664);
                expect(persons.result[2].schools[0].address[0].cityid[1].city).to.eql("sirsa1");
                expect(persons.result[2].schools[0].address[0].cityid[1].code).to.eql(1665);
                expect(persons.result[2].schools[0].address[1].cityid).to.have.length(1);
                expect(persons.result[2].schools[0].address[1].cityid[0].city).to.eql("sirsa1");
                expect(persons.result[2].schools[0].address[1].cityid[0].code).to.eql(1665);
                expect(persons.result[2].schools[0].address[2].cityid).to.have.length(1);
                expect(persons.result[2].schools[0].address[2].cityid[0].city).to.eql("hisar1");
                expect(persons.result[2].schools[0].address[2].cityid[0].code).to.eql(1664);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("simple fk column with multiple or dotted values in set", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"cityid", type:"fk", collection:"cities", upsert:true}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                cityid:{_id:"hisar", $set:{city:"hisar", code:1662}}
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                cityid:{_id:"sirsa", $set:{city:"sirsa", code:1665}}
                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                cityid:{_id:"hisar", $set:{city:"hisar", code:1662}}
                            }
                        ]

                    },
                    {
                        $collection:{collection:"students", fields:[
                            {field:"personid", type:"fk", collection:{collection:"persons", fields:[
                                {field:"cityid", type:"fk", collection:"cities", upsert:true}
                            ]}, upsert:true, set:["name", "cityid.city", "cityid.code"]}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                personid:{_id:"Sachin"}
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                personid:{_id:"Pawan"}
                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                personid:{_id:"Rohit"}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"persons"})
            }).then(
            function (persons) {
//                console.log("persons>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                return db.query({$collection:"students"})
            }).then(
            function (students) {
//                console.log("studetns>>>>>>>>>>>>>>>>>>" + JSON.stringify(students));
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
//                console.log("cities>>>>>>>" + JSON.stringify(cities));
                var batchUpdates = [
                    {
                        $collection:{collection:"cities", referredfks:[
                            {collectionid:{collection:"students"}, field:"personid.cityid", set:["city", "code"]}
                        ]},
                        $update:[
                            {
                                _id:cities.result[0]._id,
                                $set:{city:"hisar1", code:1670}
                            } ,
                            {
                                _id:cities.result[1]._id,
                                $set:{city:"sirsa1", code:1671}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
                expect(cities.result).to.have.length(2);
                expect(cities.result[0].city).to.eql("hisar1");
                expect(cities.result[0].code).to.eql(1670);
                expect(cities.result[1].city).to.eql("sirsa1");
                expect(cities.result[1].code).to.eql(1671);
                return db.query({$collection:"students", $sort:{name:1}});
            }).then(
            function (students) {
//                console.log("students >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(students));
                expect(students.result).to.have.length(3);
                expect(students.result[0].name).to.eql("Pawan");
                expect(students.result[1].name).to.eql("Rohit");
                expect(students.result[2].name).to.eql("Sachin");
                expect(students.result[0].personid.cityid.city).to.eql("sirsa1");
                expect(students.result[0].personid.cityid.code).to.eql(1671);
                expect(students.result[1].personid.cityid.city).to.eql("hisar1");
                expect(students.result[1].personid.cityid.code).to.eql(1670);
                expect(students.result[2].personid.cityid.city).to.eql("hisar1");
                expect(students.result[2].personid.cityid.code).to.eql(1670);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("multiple fk column with multiple or dotted values in set", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"cityid", type:"fk", multiple:true, collection:"cities", upsert:true}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                cityid:[
                                    {_id:"hisar", $set:{city:"hisar"}}
                                ]
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                cityid:[
                                    {_id:"sirsa", $set:{city:"sirsa"}}
                                ]
                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                cityid:[
                                    {_id:"hisar", $set:{city:"hisar"}}
                                ]
                            }
                        ]

                    },
                    {
                        $collection:{collection:"students", fields:[
                            {field:"personid", type:"fk", multiple:true, collection:{collection:"persons", fields:[
                                {field:"cityid", type:"fk", multiple:true, collection:"cities", upsert:true}
                            ]}, upsert:true, set:["name", "cityid.city"]}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                personid:[
                                    {_id:"Sachin"}
                                ]
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                personid:[
                                    {_id:"Pawan"}
                                ]
                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                personid:[
                                    {_id:"Rohit"}
                                ]
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"students"});
            }).then(
            function (students) {
//                console.log("students>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(students));
                return db.query({$collection:"persons"});
            }).then(
            function (persons) {
//                console.log("persons>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(persons));
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
//                console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                var batchUpdates = [
                    {
                        $collection:{collection:"cities", referredfks:[
                            {collectionid:{collection:"students"}, field:"personid.$.cityid.$", set:["city"]}
                        ]},
                        $update:[
                            {
                                _id:cities.result[0]._id,
                                $set:{city:"hisar1"}
                            } ,
                            {
                                _id:cities.result[1]._id,
                                $set:{city:"sirsa1"}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
                expect(cities.result).to.have.length(2);
                expect(cities.result[0].city).to.eql("hisar1");
                expect(cities.result[1].city).to.eql("sirsa1");
                return db.query({$collection:"students", $sort:{name:1}});
            }).then(
            function (students) {
//                console.log("students >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(students));
                expect(students.result).to.have.length(3);
                expect(students.result[0].name).to.eql("Pawan");
                expect(students.result[1].name).to.eql("Rohit");
                expect(students.result[2].name).to.eql("Sachin");
                expect(students.result[0].personid).to.have.length(1);
                expect(students.result[0].personid[0].cityid).to.have.length(1);
                expect(students.result[0].personid[0].cityid[0].city).to.eql("sirsa1");
                expect(students.result[1].personid).to.have.length(1);
                expect(students.result[1].personid[0].cityid).to.have.length(1);
                expect(students.result[1].personid[0].cityid[0].city).to.eql("hisar1");
                expect(students.result[2].personid).to.have.length(1);
                expect(students.result[2].personid[0].cityid).to.have.length(1);
                expect(students.result[2].personid[0].cityid[0].city).to.eql("hisar1");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })

    it("fk column with Three level state,countries and cities multiple or dotted push", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:{collection:"persons", fields:[
                            {field:"cityid", type:"fk", multiple:true, collection:"cities", upsert:true}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                cityid:[
                                    {_id:"hisar", $set:{city:"hisar"}}
                                ]
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                cityid:[
                                    {_id:"sirsa", $set:{city:"sirsa"}}
                                ]
                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                cityid:[
                                    {_id:"hisar", $set:{city:"hisar"}}
                                ]
                            }
                        ]

                    },
                    {
                        $collection:{collection:"students", fields:[
                            {field:"personid", type:"fk", multiple:true, collection:{collection:"persons", fields:[
                                {field:"cityid", type:"fk", multiple:true, collection:"cities", upsert:true}
                            ]}, upsert:true, set:["name", "cityid.city"]}
                        ]},
                        $insert:[
                            {
                                _id:"Sachin",
                                name:"Sachin",
                                personid:[
                                    {_id:"Sachin"}
                                ]
                            },
                            {
                                _id:"Pawan",
                                name:"Pawan",
                                personid:[
                                    {_id:"Pawan"}
                                ]
                            },
                            {
                                _id:"Rohit",
                                name:"Rohit",
                                personid:[
                                    {_id:"Rohit"}
                                ]
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
//                console.log("cities >>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(cities));
                var batchUpdates = [
                    {
                        $collection:{collection:"cities", referredfks:[
                            {collectionid:{collection:"students"}, field:"personid.$.cityid.$", set:["city"]}
                        ]},
                        $update:[
                            {
                                _id:cities.result[0]._id,
                                $set:{city:"hisar1"}
                            } ,
                            {
                                _id:cities.result[1]._id,
                                $set:{city:"sirsa1"}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (cities) {
                expect(cities.result).to.have.length(2);
                expect(cities.result[0].city).to.eql("hisar1");
                expect(cities.result[1].city).to.eql("sirsa1");
                return db.query({$collection:"students", $sort:{name:1}});
            }).then(
            function (students) {
//                console.log("students >>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(students));
                expect(students.result).to.have.length(3);
                expect(students.result[0].name).to.eql("Pawan");
                expect(students.result[1].name).to.eql("Rohit");
                expect(students.result[2].name).to.eql("Sachin");
                expect(students.result[0].personid).to.have.length(1);
                expect(students.result[0].personid[0].cityid).to.have.length(1);
                expect(students.result[0].personid[0].cityid[0].city).to.eql("sirsa1");
                expect(students.result[1].personid).to.have.length(1);
                expect(students.result[1].personid[0].cityid).to.have.length(1);
                expect(students.result[1].personid[0].cityid[0].city).to.eql("hisar1");
                expect(students.result[2].personid).to.have.length(1);
                expect(students.result[2].personid[0].cityid).to.have.length(1);
                expect(students.result[2].personid[0].cityid[0].city).to.eql("hisar1");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })

    })
    it("fk column in different collections", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                        {$collection:"pl.collections", $insert:[
                            { collection:"countries"},
                            { collection:"states"},
                            { collection:"cities"},
                            {collection:"languages"}
                        ]},
                        {$collection:"pl.fields", $insert:[
                            {field:"languagename", type:"string", collectionid:{$query:{collection:"languages"}}},
                            {field:"languageid", type:"fk", collection:"languages", collectionid:{$query:{collection:"countries"}}, set:["languagename"], multiple:true},
                            {field:"languageid", type:"fk", collection:"languages", collectionid:{$query:{collection:"states"}}, set:["languagename"]},
                            {field:"address", type:"object", collection:"languages", collectionid:{$query:{collection:"cities"}}},
                            {field:"languageid", type:"fk", collection:"languages", collectionid:{$query:{collection:"cities"}}, set:["languagename"], parentfieldid:{$query:{field:"address", collectionid:{$query:{collection:"cities"}}}}}
                        ]},
                        {$collection:"languages", $insert:[
                            {languagename:"Hindi", languagecode:"10"},
                            {languagename:"English", languagecode:"11"} ,
                            {languagename:"Gujrati", languagecode:"12"}
                        ]},
                        {$collection:"countries", $insert:[
                            {country:"india", languageid:[
                                {$query:{languagename:"Hindi"}},
                                {$query:{languagename:"English"}}
                            ]},
                            {country:"pakistan", languageid:[
                                {$query:{languagename:"Hindi"}},
                                {$query:{languagename:"English"}},
                                {$query:{languagename:"Gujrati"}}
                            ]},
                            {country:"usa", languageid:[
                                {$query:{languagename:"English"}}
                            ]}
                        ]},
                        {$collection:"states", $insert:[
                            {state:"haryana", languageid:{$query:{languagename:"English"}}},
                            {state:"gujrat", languageid:{$query:{languagename:"Gujrati"}}},
                            {state:"punjab", languageid:{$query:{languagename:"English"}}}
                        ]},
                        {$collection:"cities", $insert:[
                            {city:"hisar", address:{houseno:"12", languageid:{$query:{languagename:"English"}}}},
                            {city:"goa", address:{houseno:"21", languageid:{$query:{languagename:"Gujrati"}}}},
                            {city:"sirsa", address:{houseno:"12", languageid:{$query:{languagename:"Hindi"}}}}
                        ]}
                    ]
                    ;
                return db.update(updates);
            }).then(
            function (res) {
                return db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"languages"});
            }).then(
            function (data) {
//                console.log("saving is complete>>>>>" + JSON.stringify(data));
                var updates = [
                    {$collection:"languages", $update:[
                        {_id:data.result[0]._id, $set:{ languagename:"Hindi+"}},
                        {_id:data.result[1]._id, $set:{ languagename:"English+"}} ,
                        {_id:data.result[2]._id, $set:{ languagename:"Gujrati+"}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction({sync:true});
            }).then(
            function () {
//                console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>commit Transaction complete>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>");
                return db.query({$collection:"languages"});
            }).then(
            function (data) {
//                console.log("languages data>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(3);
                expect(data.result[0].languagename).eql("Hindi+");
                expect(data.result[1].languagename).eql("English+");
                expect(data.result[2].languagename).eql("Gujrati+");
                return db.query({$collection:"countries", $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("countries data>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(3);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].languageid[0].languagename).to.eql("Hindi+");
                expect(data.result[0].languageid[1].languagename).to.eql("English+");
                expect(data.result[1].country).to.eql("pakistan");
                expect(data.result[1].languageid[0].languagename).to.eql("Hindi+");
                expect(data.result[1].languageid[1].languagename).to.eql("English+");
                expect(data.result[1].languageid[2].languagename).to.eql("Gujrati+");
                expect(data.result[2].country).to.eql("usa");
                expect(data.result[2].languageid[0].languagename).to.eql("English+");
                return db.query({$collection:"states", $sort:{state:1}});
            }).then(
            function (data) {
//                console.log("states data>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(3);
                expect(data.result[0].state).to.eql("gujrat");
                expect(data.result[0].languageid.languagename).to.eql("Gujrati+");
                expect(data.result[1].state).to.eql("haryana");
                expect(data.result[1].languageid.languagename).to.eql("English+");
                expect(data.result[2].state).to.eql("punjab");
                expect(data.result[2].languageid.languagename).to.eql("English+");
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].city).to.eql("goa");
                expect(data.result[0].address.languageid.languagename).to.eql("Gujrati+");
                expect(data.result[1].city).to.eql("hisar");
                expect(data.result[1].address.languageid.languagename).to.eql("English+");
                expect(data.result[2].city).to.eql("sirsa");
                expect(data.result[2].address.languageid.languagename).to.eql("Hindi+");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });
})
