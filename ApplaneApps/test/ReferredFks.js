/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 26/3/15
 * Time: 6:09 PM
 * To change this template use File | Settings | File Templates.
 */

/**
 *
 * mocha --recursive --timeout 150000 -g "ReferredFks" --reporter spec
 */

var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");
var Commit = require("../lib/apps/Commit.js");
var ReferredFks = require("../lib/apps/triggers/ReferredFks.js");

describe("ReferredFks", function () {

    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    afterEach(function (done) {
        Testcases.afterEach(done);
    })

    it("Referredfks not save for child fks", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"orders"},
                        {collection:"deliveries"},
                        {collection:"accounts"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"accounts"}}},
                        {field:"order_no", type:"string", collectionid:{$query:{collection:"orders"}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"orders"}}},
                        {field:"lineitems", type:"object", multiple:true, collectionid:{$query:{collection:"orders"}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"orders"}}, parentfieldid:{$query:{"field":"lineitems", collectionid:{$query:{"collection":"orders"}}}}},
                        {field:"delivery_no", type:"string", collectionid:{$query:{collection:"deliveries"}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"deliveries"}}},
                        {field:"orderid", type:"fk", collection:"orders", set:["order_no"], collectionid:{$query:{collection:"deliveries"}}},
                        {field:"lineitems", type:"object", multiple:true, collectionid:{$query:{collection:"deliveries"}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"deliveries"}}, parentfieldid:{$query:{"field":"lineitems", collectionid:{$query:{"collection":"deliveries"}}}}},
                        {field:"deliveries", type:"object", collectionid:{$query:{collection:"orders"}}, multiple:true, query:JSON.stringify({$type:"child", $query:{$collection:"deliveries"}, $fk:"orderid"})}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"pl.referredfks", $filter:{"collectionid.collection":"orders"}, $events:false});
            }).then(
            function (result) {
                expect(result.result).to.have.length(2);
            }).then(
            function () {
                return ReferredFks.repopulateReferredFks({collection:"orders"}, db);
            }).then(
            function () {
                return db.query({$collection:"pl.referredfks", $filter:{"collectionid.collection":"orders"}, $events:false});
            }).then(
            function (result) {
                expect(result.result).to.have.length(2);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Referredfks not save for Fks inner Fields", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"orders"},
                        {collection:"deliveries"},
                        {collection:"accounts"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"accounts"}}},
                        {field:"order_no", type:"string", collectionid:{$query:{collection:"orders"}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"orders"}}},
                        {field:"lineitems1", type:"object", multiple:true, collectionid:{$query:{collection:"orders"}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"orders"}}, parentfieldid:{$query:{"field":"lineitems1", collectionid:{$query:{"collection":"orders"}}}}},
                        {field:"delivery_no", type:"string", collectionid:{$query:{collection:"deliveries"}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"deliveries"}}},
                        {field:"orderid", type:"fk", collection:"orders", set:["order_no"], collectionid:{$query:{collection:"deliveries"}}},
                        {field:"lineitems", type:"object", multiple:true, collectionid:{$query:{collection:"deliveries"}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"deliveries"}}, parentfieldid:{$query:{field:"lineitems", collectionid:{$query:{collection:"deliveries"}}}}},
                        {field:"deliveryid", type:"fk", collection:"deliveries", set:["delivery_no"], collectionid:{$query:{collection:"orders"}}},
                        {field:"delivery_no", type:"string", collectionid:{$query:{collection:"orders"}}, parentfieldid:{$query:{field:"deliveryid", collectionid:{$query:{collection:"orders"}}}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"orders"}}, parentfieldid:{$query:{field:"deliveryid", collectionid:{$query:{collection:"orders"}}}}},
                        {field:"lineitems", type:"object", multiple:true, collectionid:{$query:{collection:"orders"}}, parentfieldid:{$query:{field:"deliveryid", collectionid:{$query:{collection:"orders"}}}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"orders"}}, parentfieldid:{$query:{field:"lineitems", collectionid:{$query:{collection:"orders"}}}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"pl.referredfks", $filter:{"collectionid.collection":"orders"}, $events:false});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);
            }).then(
            function () {
                return ReferredFks.repopulateReferredFks({collection:"orders"}, db);
            }).then(
            function () {
                return db.query({$collection:"pl.referredfks", $filter:{"collectionid.collection":"orders"}, $events:false});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Cascade not required for fk column in set fields", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"accounts"},
                        {collection:"orders"},
                        {collection:"deliveries"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"accounts"}}},
                        {field:"order_no", type:"string", collectionid:{$query:{collection:"orders"}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"orders"}}, cascade:true},
                        {field:"delivery_no", type:"string", collectionid:{$query:{collection:"deliveries"}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"deliveries"}}, cascade:true},
                        {field:"deliveryid", type:"fk", collection:"deliveries", set:["delivery_no", "accountid"], collectionid:{$query:{collection:"orders"}}, cascade:true}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"pl.referredfks", $filter:{"referredcollectionid.collection":"accounts"}, $events:false});
            }).then(
            function (result) {
                expect(result.result).to.have.length(2);
            }).then(
            function () {
                return db.query({$collection:"pl.referredfks", $filter:{"referredcollectionid.collection":"accounts", field:"deliveryid.accountid"}, $events:false});
            }).then(
            function (result) {
                expect(result.result).to.have.length(0);
            }).then(
            function () {
                return ReferredFks.repopulateReferredFks({collection:"orders"}, db);
            }).then(
            function () {
                return db.query({$collection:"pl.referredfks", $filter:{"referredcollectionid.collection":"accounts"}, $events:false});
            }).then(
            function (result) {
                expect(result.result).to.have.length(2);
            }).then(
            function () {
                return db.query({$collection:"pl.referredfks", $filter:{"referredcollectionid.collection":"accounts", field:"deliveryid.accountid"}, $events:false});
            }).then(
            function (result) {
                expect(result.result).to.have.length(0);
            }).then(
            function () {
                return db.update({$collection:"accounts", $insert:[
                    {name:"Salary"},
                    {name:"Saving"}
                ]})
            }).then(
            function () {
                return db.update({$collection:"deliveries", $insert:[
                    {delivery_no:"d1", accountid:{$query:{name:"Salary"}}},
                    {delivery_no:"d2", accountid:{$query:{name:"Saving"}}}
                ]})
            }).then(
            function () {
                return db.update({$collection:"orders", $insert:[
                    {order_no:"o1", deliveryid:{$query:{delivery_no:"d1"}}},
                    {order_no:"o2", deliveryid:{$query:{delivery_no:"d2"}}}
                ]})
            }).then(
            function () {
                db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"accounts", $sort:{name:1}});
            }).then(
            function (acocunts) {
                var batchUpdates = [
                    {
                        $collection:"accounts",
                        $update:[
                            {
                                _id:acocunts.result[0]._id,
                                $set:{name:"Salary1"}
                            }
                        ]

                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.query({$collection:"deliveries", $sort:{delivery_no:1}});
            }).then(
            function (deliveries) {
                var batchUpdates = [
                    {
                        $collection:"deliveries",
                        $update:[
                            {
                                _id:deliveries.result[0]._id,
                                $set:{delivery_no:"d11"}
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
                return db.query({$collection:"orders", $filter:{order_no:"o1"}, $fields:{"deliveryid.delivery_no":1, "deliveryid.accountid.name":1}});
            }).then(
            function (result) {
                expect(result.result[0].deliveryid.delivery_no).to.eql("d11");
                expect(result.result[0].deliveryid.accountid.name).to.eql("Salary1");
            }).then(
            function () {
                return db.query({$collection:"orders", $filter:{order_no:"o1"}, $fields:{"deliveryid":1}});
            }).then(
            function (result) {
                expect(result.result[0].deliveryid.delivery_no).to.eql("d11");
                expect(result.result[0].deliveryid.accountid.name).to.eql("Salary");
            }).then(
            function () {
                db.mongoTime = {};
            }).then(
            function () {
                return db.query({$collection:"accounts", $sort:{name:1}});
            }).then(
            function (acocunts) {
                var batchUpdates = [
                    {
                        $collection:"accounts",
                        $delete:[
                            {
                                _id:acocunts.result[0]._id
                            }
                        ]
                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                expect(db.mongoTime.mongoCount).to.eql(3);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Cascade not required for fk column in dotted field in set fields", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"accounts"},
                        {collection:"orders"},
                        {collection:"deliveries"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"accounts"}}},
                        {field:"order_no", type:"string", collectionid:{$query:{collection:"orders"}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"orders"}}, cascade:true},
                        {field:"delivery_no", type:"string", collectionid:{$query:{collection:"deliveries"}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"deliveries"}}, cascade:true},
                        {field:"deliveryid", type:"fk", collection:"deliveries", set:["delivery_no", "accountid._id", "accountid.name"], collectionid:{$query:{collection:"orders"}}, cascade:true}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"pl.referredfks", $filter:{"referredcollectionid.collection":"accounts"}, $events:false});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);
            }).then(
            function () {
                return db.query({$collection:"pl.referredfks", $filter:{"referredcollectionid.collection":"accounts", field:"deliveryid.accountid"}, $events:false});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].replicate).to.eql(true);
                expect(result.result[0].set).to.eql(["name"]);
            }).then(
            function () {
                return ReferredFks.repopulateReferredFks({collection:"orders"}, db);
            }).then(
            function () {
                return db.query({$collection:"pl.referredfks", $filter:{"referredcollectionid.collection":"accounts"}, $events:false});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);
            }).then(
            function () {
                return db.query({$collection:"pl.referredfks", $filter:{"referredcollectionid.collection":"accounts", field:"deliveryid.accountid"}, $events:false});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].replicate).to.eql(true);
                expect(result.result[0].set).to.eql(["name"]);
            }).then(
            function () {
                return db.update({$collection:"accounts", $insert:[
                    {name:"Salary"},
                    {name:"Saving"}
                ]})
            }).then(
            function () {
                return db.update({$collection:"deliveries", $insert:[
                    {delivery_no:"d1", accountid:{$query:{name:"Salary"}}},
                    {delivery_no:"d2", accountid:{$query:{name:"Saving"}}}
                ]})
            }).then(
            function () {
                return db.update({$collection:"orders", $insert:[
                    {order_no:"o1", deliveryid:{$query:{delivery_no:"d1"}}},
                    {order_no:"o2", deliveryid:{$query:{delivery_no:"d2"}}}
                ]})
            }).then(
            function () {
                db.startTransaction();
            }).then(
            function () {
                return db.query({$collection:"accounts", $sort:{name:1}});
            }).then(
            function (acocunts) {
                var batchUpdates = [
                    {
                        $collection:"accounts",
                        $update:[
                            {
                                _id:acocunts.result[0]._id,
                                $set:{name:"Salary1"}
                            }
                        ]
                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                return db.query({$collection:"deliveries", $sort:{delivery_no:1}});
            }).then(
            function (deliveries) {
                var batchUpdates = [
                    {
                        $collection:"deliveries",
                        $update:[
                            {
                                _id:deliveries.result[0]._id,
                                $set:{delivery_no:"d11"}
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
                return db.query({$collection:"orders", $filter:{order_no:"o1"}});
            }).then(
            function (result) {
                expect(result.result[0].deliveryid.delivery_no).to.eql("d11");
                expect(result.result[0].deliveryid.accountid.name).to.eql("Salary1");
            }).then(
            function () {
                db.mongoTime = {};
            }).then(
            function () {
                return db.query({$collection:"accounts", $sort:{name:1}});
            }).then(
            function (acocunts) {
                var batchUpdates = [
                    {
                        $collection:"accounts",
                        $delete:[
                            {
                                _id:acocunts.result[0]._id
                            }
                        ]
                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                expect(db.mongoTime.mongoCount).to.eql(3);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Repopulate Set Fields for field in object type multiple", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        { collection:"cities"},
                        {collection:"languages"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"languages"}}},
                        {field:"code", type:"string", collectionid:{$query:{collection:"languages"}}},
                        {field:"address", type:"object", collection:"languages", collectionid:{$query:{collection:"cities"}}, multiple:true},
                        {field:"languageid", type:"fk", collection:"languages", collectionid:{$query:{collection:"cities"}}, set:["name"], parentfieldid:{$query:{field:"address", collectionid:{$query:{collection:"cities"}}}}}
                    ]},
                    {$collection:"languages", $insert:[
                        {name:"Hindi", code:"10"},
                        {name:"English", code:"11"} ,
                        {name:"Gujrati", code:"12"}
                    ]},
                    {$collection:"cities", $insert:[
                        {city:"hisar", address:{$insert:[
                            {houseno:"12", languageid:{$query:{name:"English"}}},
                            {houseno:"14", languageid:{$query:{name:"Hindi"}}}
                        ]}},
                        {city:"goa", address:{$insert:[
                            {houseno:"13", languageid:{$query:{name:"Gujrati"}}},
                            {houseno:"15", languageid:{$query:{name:"English"}}}
                        ]}},
                        {city:"sirsa", address:{$insert:[
                            {houseno:"16", languageid:{$query:{name:"Gujrati"}}},
                            {houseno:"17", languageid:{$query:{name:"Hindi"}}},
                            {houseno:"18", languageid:{$query:{name:"English"}}}
                        ]}}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{field:"languageid", "collectionid.collection":"cities"}});
            }).then(
            function (fieldResult) {
                var updates = [
                    {$collection:"pl.fields", $update:[
                        {_id:fieldResult.result[0]._id, $set:{set:["name", "code"]}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var asyncDB = db.asyncDB();
                var options = {processName: "SetFields"};
                return asyncDB.createProcess(options);
            }).then(
            function (process) {
                db.invokeFunction("Porting.repopulateSetFields", [
                    {collection:"cities", field:"address.languageid", db:db.db.databaseName}
                ],{processid : process.processid});
                return require("q").delay(500);
            }).then(
            function () {
                return db.query({$collection:"cities", $sort:{city:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].city).to.eql("goa");
                expect(data.result[0].address).to.have.length(2);
                expect(data.result[0].address[0].languageid.name).to.eql("Gujrati");
                expect(data.result[0].address[0].languageid.code).to.eql("12");
                expect(data.result[0].address[1].languageid.name).to.eql("English");
                expect(data.result[0].address[1].languageid.code).to.eql("11");
                expect(data.result[1].city).to.eql("hisar");
                expect(data.result[1].address).to.have.length(2);
                expect(data.result[1].address[0].languageid.name).to.eql("English");
                expect(data.result[1].address[0].languageid.code).to.eql("11");
                expect(data.result[1].address[1].languageid.name).to.eql("Hindi");
                expect(data.result[1].address[1].languageid.code).to.eql("10");
                expect(data.result[2].city).to.eql("sirsa");
                expect(data.result[2].address).to.have.length(3);
                expect(data.result[2].address[0].languageid.name).to.eql("Gujrati");
                expect(data.result[2].address[0].languageid.code).to.eql("12");
                expect(data.result[2].address[1].languageid.name).to.eql("Hindi");
                expect(data.result[2].address[1].languageid.code).to.eql("10");
                expect(data.result[2].address[2].languageid.name).to.eql("English");
                expect(data.result[2].address[2].languageid.code).to.eql("11");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    })

})




