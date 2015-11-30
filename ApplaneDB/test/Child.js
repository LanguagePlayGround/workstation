/**
 *
 *  mocha --recursive --timeout 150000 -g "ChildModule testcase" --reporter spec
 *
 *  mocha --recursive --timeout 150000 -g "Collection and fields recursive with change alias" --reporter spec
 *
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require("./NorthwindDb.js");
var Constants = require("../lib/Constants.js");
var Q = require("q");
var Testcases = require("./TestCases.js")
var collectionsToRegister = [
    {
        collection:"myorders",
        fields:[
            {field:"order_no", type:"string"}     ,
            {field:"deliveries", type:"object", multiple:true, query:JSON.stringify({$type:"child", $query:{$collection:"mydeliveries"}, $fk:"orderid"})}
        ]
    },
    {
        collection:"mydeliveries",
        fields:[
            {field:"orderid", collection:"myorders", type:"fk", set:["order_no"], upsert:true},
            {field:"delivery_no", type:"string"},
            {field:"delivery_accountid", collection:"accountss", type:"fk", set:["account"], upsert:true},
            {field:"dli", type:"object", multiple:true,
                fields:[
                    {field:"dli_no", type:"string"},
                    {field:"dli_accountid", type:"fk", collection:"accountss", set:["account"], upsert:true},
                    {field:"deductions", type:"object", multiple:true,
                        fields:[
                            {field:"deductions_no", type:"string"},
                            {field:"deductions_accountid", type:"fk", collection:"accountss", set:["account"], upsert:true}
                        ]
                    }
                ]
            }
        ]
    },
    {
        collection:"orderss",
        fields:[
            {field:"order_no", type:"string"}     ,
            {field:"deliveries", type:"object", multiple:true, query:JSON.stringify({$type:"child", $query:{$collection:"deliveriess"}, $fk:"orderid"})}
        ]
    },
    {
        collection:"accounts",
        fields:[
            {field:"account", type:"string"}
        ]
    },
    {
        collection:"deliveriess",
        fields:[
            {field:"orderid", collection:"orderss", type:"fk", set:["order_no"]},
            {field:"delivery_no", type:"string"},
            {field:"delivery_accountid", collection:"accountss", type:"fk", set:["account"], upsert:true},
            {field:"dli", type:"object", multiple:true,
                fields:[
                    {field:"dli_no", type:"string"},
                    {field:"dli_accountid", type:"fk", collection:"accountss", set:["account"], upsert:true},
                    {field:"deductions", type:"object", multiple:true,
                        fields:[
                            {field:"deductions_no", type:"string"},
                            {field:"deductions_accountid", type:"fk", collection:"accountss", set:["account"], upsert:true}
                        ]
                    }
                ]
            }
        ]
    },
    {
        collection:"deliveries",
        fields:[
            {field:"orderid", collection:"orders", type:"fk", set:["order_no"]}
        ]
    },
    {
        collection:"invoices",
        fields:[
            {field:"orderid", collection:"orders", type:"fk", set:["order_no"]}
        ]
    },
    {
        collection:"accounts",
        fields:[
            {field:"orderid", collection:"orders", type:"fk", set:["order_no"]}
        ]
    },
    {
        collection:"orders",
        fields:[
            {field:"deliveries", type:"object", multiple:true, query:JSON.stringify({$type:"child", $query:{$collection:"deliveries"}, $fk:"orderid"})},
            {field:"invoices", type:"object", multiple:true, query:JSON.stringify({$type:"child", $query:{$collection:"invoices"}, $fk:"orderid"})},
            {field:"accounts", type:"object", multiple:true, query:JSON.stringify({$type:"child", $query:{$collection:"accounts"}, $fk:"orderid"})}
        ], events:[
        {event:"onSave", function:{ name:"onAfterSave", source:"NorthwindTestCase/lib/Orders"}, post:true}
    ]
    } ,
    {collection:"collections", fields:[
        {field:Constants.Admin.Collections.COLLECTION, type:Constants.Admin.Fields.Type.STRING, mandatory:true},
        {field:"fields", type:"object", multiple:true, query:JSON.stringify({$type:"child", $query:{$collection:"fields", $filter:{parentfieldid:null}, $recursion:{parentfieldid:"_id", $alias:"fields"}}, $fk:Constants.Admin.Fields.COLLECTION_ID})}
    ]},
    {collection:"fields", fields:[
        {field:Constants.Admin.Fields.FIELD, type:Constants.Admin.Fields.Type.STRING, mandatory:true},
        {field:Constants.Admin.Fields.COLLECTION_ID, type:Constants.Admin.Fields.Type.FK, "collection":"collections", set:[Constants.Admin.Collections.COLLECTION], mandatory:true},
        {field:Constants.Admin.Fields.PARENT_FIELD_ID, type:Constants.Admin.Fields.Type.FK, "collection":"fields", set:[Constants.Admin.Fields.FIELD]},
        {field:Constants.Admin.Fields.QUERY, type:Constants.Admin.Fields.Type.STRING},
        {field:"fields", type:"object", multiple:true, query:JSON.stringify({$type:"child", $query:{$collection:"fields"}, $fk:Constants.Admin.Fields.PARENT_FIELD_ID, $otherfk:[
            {fk:Constants.Admin.Fields.COLLECTION_ID, parent:Constants.Admin.Fields.COLLECTION_ID}
        ]})}
    ]}
];


describe("ChildModule testcase", function () {
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

    it("Orders and Deliveries and milestones", function (done) {
        var db = undefined;
        var orderid = undefined;
        var deliveryid = undefined;
        var milestoneid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"__orders"},
                        {collection:"__deliveries"},
                        {collection:"__milestones"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"order_no", type:"string", collectionid:{$query:{collection:"__orders"}}},
                        {field:"deliveries", type:"object", multiple:true, collectionid:{$query:{collection:"__orders"}}, query:JSON.stringify({$type:"child", $query:{$collection:"__deliveries"}, $fk:"orderid"})},

                        {field:"orderid", collection:"__orders", type:"fk", set:["order_no"], displayFiels:"order_no", upsert:true, collectionid:{$query:{collection:"__deliveries"}}},
                        {field:"delivery_no", type:"string", collectionid:{$query:{collection:"__deliveries"}}},
                        {field:"milestones", type:"object", multiple:true, query:JSON.stringify({$type:"child", $query:{$collection:"__milestones"}, $fk:"deliveryid", $otherfk:[
                            {fk:"orderid", parent:"orderid"}
                        ]}), collectionid:{$query:{collection:"__deliveries"}}},

                        {field:"orderid", collection:"__orders", type:"fk", set:["order_no"], upsert:true, displayFiels:"deliver_no", collectionid:{$query:{collection:"__milestones"}}},
                        {field:"deliveryid", collection:"__deliveries", type:"fk", set:["delivery_no"], upsert:true, collectionid:{$query:{collection:"__milestones"}}, cascade:true},
                        {field:"milestone_no", type:"string", collectionid:{$query:{collection:"__milestones"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var orderUpdates = [
                    {$collection:"__orders", $insert:[
                        {order_no:"123", deliveries:{$insert:[
                            {delivery_no:"xx1", milestones:{
                                $insert:[
                                    {milestone_no:"mm1"},
                                    {milestone_no:"mm2"}
                                ] }
                            },
                            {delivery_no:"xx2", milestones:{ $insert:[
                                {milestone_no:"mm1"},
                                {milestone_no:"mm2"}
                            ]}}
                        ]}}
                    ]}
                ];
                return db.update(orderUpdates);

            }).then(
            function () {
                return db.query({$collection:"__orders", $modules:false})
            }).then(
            function (data) {
                var orders = data.result;
                orderid = orders[0]._id;
                expect(orders).to.have.length(1);
                expect(orders[0].order_no).to.eql("123");
                expect(orders[0].deliveries).to.eql(undefined);

                return db.query({$collection:"__deliveries", $modules:false});
            }).then(
            function (data) {
                var deliveries = data.result;
                expect(deliveries).to.have.length(2);
                expect(deliveries[0].delivery_no).to.eql("xx1");
                expect(deliveries[0].orderid.order_no).to.eql("123");
                expect(deliveries[0].milestones).to.eql(undefined);
                expect(deliveries[1].delivery_no).to.eql("xx2");
                expect(deliveries[1].orderid.order_no).to.eql("123");
                expect(deliveries[1].milestones).to.eql(undefined);

                return db.query({$collection:"__milestones", $modules:false})
            }).then(
            function (data) {
                var milestones = data.result;
                expect(milestones).to.have.length(4);
                expect(milestones[0].milestone_no).to.eql("mm1");
                expect(milestones[0].deliveryid.delivery_no).to.equal("xx1");
                expect(milestones[0].orderid.order_no).to.equal("123");
                expect(milestones[1].milestone_no).to.eql("mm2");
                expect(milestones[1].deliveryid.delivery_no).to.equal("xx1");
                expect(milestones[1].orderid.order_no).to.equal("123");
                expect(milestones[2].milestone_no).to.eql("mm1");
                expect(milestones[2].deliveryid.delivery_no).to.equal("xx2");
                expect(milestones[2].orderid.order_no).to.equal("123");
                expect(milestones[3].milestone_no).to.eql("mm2");
                expect(milestones[3].deliveryid.delivery_no).to.equal("xx2");
                expect(milestones[3].orderid.order_no).to.equal("123");
            }).then(
            function () {

                //inserting new delivery
                var updates = {$collection:"__orders", $update:{_id:orderid, $set:{"deliveries":{$insert:{"delivery_no":"xx3", "milestones":[
                    {"milestone_no":"mm5"}
                ]}}}}}
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"__deliveries", $modules:false})
            }).then(
            function (deliveryData) {
                var deliveries = deliveryData.result;
                expect(deliveries).to.have.length(3);
                expect(deliveries[0].delivery_no).to.eql("xx1");
                expect(deliveries[0].orderid.order_no).to.eql("123");
                expect(deliveries[0].milestones).to.eql(undefined);
                expect(deliveries[1].delivery_no).to.eql("xx2");
                expect(deliveries[1].orderid.order_no).to.eql("123");
                expect(deliveries[1].milestones).to.eql(undefined);
                expect(deliveries[2].delivery_no).to.eql("xx3");
                expect(deliveries[2].orderid.order_no).to.eql("123");
                expect(deliveries[2].milestones).to.eql(undefined);

                return db.query({$collection:"__milestones", $modules:false})
            }).then(
            function (milestonesData) {
                var milestones = milestonesData.result;
                expect(milestones).to.have.length(5);
                expect(milestones[0].milestone_no).to.eql("mm1");
                expect(milestones[0].deliveryid.delivery_no).to.equal("xx1");
                expect(milestones[0].orderid.order_no).to.equal("123");
                expect(milestones[1].milestone_no).to.eql("mm2");
                expect(milestones[1].deliveryid.delivery_no).to.equal("xx1");
                expect(milestones[1].orderid.order_no).to.equal("123");
                expect(milestones[2].milestone_no).to.eql("mm1");
                expect(milestones[2].deliveryid.delivery_no).to.equal("xx2");
                expect(milestones[2].orderid.order_no).to.equal("123");
                expect(milestones[3].milestone_no).to.eql("mm2");
                expect(milestones[3].deliveryid.delivery_no).to.equal("xx2");
                expect(milestones[3].orderid.order_no).to.equal("123");
                expect(milestones[4].milestone_no).to.eql("mm5");
                expect(milestones[4].deliveryid.delivery_no).to.equal("xx3");
                expect(milestones[4].orderid.order_no).to.equal("123");
                return db.query({$collection:"__deliveries", $filter:{"delivery_no":"xx1"}, $fields:{_id:1}, $modules:false})
            }).then(
            function (data) {
                deliveryid = data.result[0]._id;

                //inserting new milestone in an existing delivery
                var updates = {$collection:"__orders", $update:{_id:orderid, $set:{"deliveries":{$update:{_id:deliveryid, $set:{"milestones":{$insert:{"milestone_no":"mm6"}}}}}}}}
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"__milestones", $modules:false})
            }).then(
            function (data) {
                var milestones = data.result;
                expect(milestones).to.have.length(6);
                expect(milestones[5].milestone_no).to.eql("mm6");
                expect(milestones[5].deliveryid.delivery_no).to.equal("xx1");
                expect(milestones[5].orderid.order_no).to.equal("123");

                //updating a delivery_no of delivery
                var deliveryUpdate = {$collection:"__orders", $update:{_id:orderid, $set:{"deliveries":{$update:{_id:deliveryid, $set:{"delivery_no":"newxx1"}}}}}}
                return db.update(deliveryUpdate);
            }).then(
            function () {
                return db.query({$collection:"__deliveries", $modules:false})
            }).then(
            function (queryResult) {
                var deliveries = queryResult.result;
                expect(deliveries).to.have.length(3);
                expect(deliveries[0].delivery_no).to.eql("newxx1");
                expect(deliveries[0].orderid.order_no).to.eql("123");
                expect(deliveries[0].milestones).to.eql(undefined);
                expect(deliveries[1].delivery_no).to.eql("xx2");
                expect(deliveries[1].orderid.order_no).to.eql("123");
                expect(deliveries[1].milestones).to.eql(undefined);
                expect(deliveries[2].delivery_no).to.eql("xx3");
                expect(deliveries[2].orderid.order_no).to.eql("123");
                expect(deliveries[2].milestones).to.eql(undefined);

                return db.query({$collection:"__milestones", $filter:{"milestone_no":"mm6", "deliveryid.delivery_no":"xx1"}, $modules:false});

            }).then(
            function (data) {
                milestoneid = data.result[0]._id;

                //updating a milestone_no of milestone
                var milestoneUpdate = {$collection:"__orders", $update:{_id:orderid, $set:{"deliveries":{$update:{_id:deliveryid, $set:{"milestones":{$update:{_id:milestoneid, $set:{"milestone_no":"mmm7"}}}} }}}}}
                return db.update(milestoneUpdate);
            }).then(
            function () {
                return db.query({$collection:"__milestones", $filter:{"milestone_no":"mmm7"}, $modules:false});
            }).then(
            function (data) {
                var miledata = data.result;
                expect(miledata[0].milestone_no).to.eql("mmm7");

                return db.update({$collection:"__orders", $update:{_id:orderid, $set:{"deliveries":{$delete:{_id:deliveryid}}}}})
            }).then(
            function () {
                return db.query({$collection:"__deliveries", $filter:{"delivery_no":"xx1"}, $modules:false})
            }).then(
            function (result) {
                var deliveryData = result.result;
                expect(deliveryData).to.have.length(0);
                return db.query({$collection:"__milestones", $filter:{"deliveryid.delivery_no":"xx1"}})

            }).then(
            function (result) {
                var datas = result.result;
                expect(datas).to.have.length(0);

            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    })

    it("Orders and Deliveries and milestones with qview", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"__orders"},
                        {collection:"__deliveries"},
                        {collection:"__milestones"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"order_no", type:"string", collectionid:{$query:{collection:"__orders"}}},
                        {field:"deliveries", type:"object", multiple:true, collectionid:{$query:{collection:"__orders"}}, query:JSON.stringify({$type:"child", $query:{$collection:"__deliveries"}, $fk:"orderid"})},

                        {field:"orderid", collection:"__orders", type:"fk", set:["order_no"], displayFiels:"order_no", upsert:true, collectionid:{$query:{collection:"__deliveries"}}},
                        {field:"delivery_no", type:"string", collectionid:{$query:{collection:"__deliveries"}}},
                        {field:"milestones", type:"object", multiple:true, query:JSON.stringify({$type:"child", $query:{$collection:"__milestones"}, $fk:"deliveryid", $otherfk:[
                            {fk:"orderid", parent:"orderid"}
                        ]}), collectionid:{$query:{collection:"__deliveries"}}},

                        {field:"orderid", collection:"__orders", type:"fk", set:["order_no"], upsert:true, displayFiels:"deliver_no", collectionid:{$query:{collection:"__milestones"}}},
                        {field:"deliveryid", collection:"__deliveries", type:"fk", set:["delivery_no"], upsert:true, collectionid:{$query:{collection:"__milestones"}}},
                        {field:"milestone_no", type:"string", collectionid:{$query:{collection:"__milestones"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var orderUpdates = [
                    {$collection:"__orders", $insert:[
                        {order_no:"123", deliveries:{$insert:[
                            {delivery_no:"xx1", milestones:{
                                $insert:[
                                    {milestone_no:"mm1"},
                                    {milestone_no:"mm2"}
                                ] }
                            },
                            {delivery_no:"xx2", milestones:{ $insert:[
                                {milestone_no:"mm1"},
                                {milestone_no:"mm2"}
                            ]}}
                        ]}}
                    ]}
                ];
                return db.update(orderUpdates);

            }).then(
            function () {
                var inserts = {$collection:"pl.qviews", $insert:[
                    {label:"Orders View", id:"__orders", collection:{$query:{collection:"__orders"}}, mainCollection:{$query:{collection:"__orders"}}}
                ]};
                return db.update(inserts);
            }).then(
            function () {
                return db.query({$collection:"__orders", $modules:false})
            }).then(
            function (data) {
                var orders = data.result;
                expect(orders).to.have.length(1);
                expect(orders[0].order_no).to.eql("123");
                expect(orders[0].deliveries).to.eql(undefined);

                return db.query({$collection:"__deliveries", $modules:false});
            }).then(
            function (data) {
                var deliveries = data.result;
                expect(deliveries).to.have.length(2);
                expect(deliveries[0].delivery_no).to.eql("xx1");
                expect(deliveries[0].orderid.order_no).to.eql("123");
                expect(deliveries[0].milestones).to.eql(undefined);
                expect(deliveries[1].delivery_no).to.eql("xx2");
                expect(deliveries[1].orderid.order_no).to.eql("123");
                expect(deliveries[1].milestones).to.eql(undefined);

                return db.query({$collection:"__milestones", $modules:false})
            }).then(
            function (data) {
                var milestones = data.result;
                expect(milestones).to.have.length(4);
                expect(milestones[0].milestone_no).to.eql("mm1");
                expect(milestones[0].deliveryid.delivery_no).to.equal("xx1");
                expect(milestones[0].orderid.order_no).to.equal("123");
                expect(milestones[1].milestone_no).to.eql("mm2");
                expect(milestones[1].deliveryid.delivery_no).to.equal("xx1");
                expect(milestones[1].orderid.order_no).to.equal("123");
                expect(milestones[2].milestone_no).to.eql("mm1");
                expect(milestones[2].deliveryid.delivery_no).to.equal("xx2");
                expect(milestones[2].orderid.order_no).to.equal("123");
                expect(milestones[3].milestone_no).to.eql("mm2");
                expect(milestones[3].deliveryid.delivery_no).to.equal("xx2");
                expect(milestones[3].orderid.order_no).to.equal("123");
            }).then(
            function () {
                return db.query({$collection:"pl.qviews", $filter:{id:"__orders"}});
            }).then(
            function (data) {
                view = data.result[0];
            }).then(
            function () {
                return db.invokeFunction("view.getView", [view]);
            }).then(
            function (data) {
                expect(data.viewOptions.fields).to.have.length(2);
                expect(data.viewOptions.fields[0].field).to.eql("deliveries");
                expect(data.viewOptions.fields[0].fields).to.have.length(2);
                expect(data.viewOptions.fields[0].fields[0].field).to.eql("delivery_no")
                expect(data.viewOptions.fields[0].fields[1].field).to.eql("milestones")
                expect(data.viewOptions.fields[0].fields[1].fields).to.have.length(1)
                expect(data.viewOptions.fields[0].fields[1].fields[0].field).to.eql("milestone_no")
                expect(data.viewOptions.fields[1].field).to.eql("order_no");
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    })

    it("Orders and Deliveries with override deliveries", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var orderUpdates = [
                    {$collection:"orders", $insert:[
                        {_id:1, order_no:"123",
                            deliveries:[
                                {code:"xx1", amount:100},
                                {code:"xx2", amount:200}
                            ]
                        }
                    ]
                    }
                ];
                return db.update(orderUpdates);
            }).then(
            function () {
                var d = Q.defer();
                db.db.collection("orders").find().toArray(function (err, orders) {
                    if (err) {
                        throw err;
                    }
//                    console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                    expect(orders).to.have.length(1);
                    expect(orders[0].order_no).to.eql("123");
                    expect(orders[0].deliveries).to.eql(undefined);
                    db.db.collection("deliveries").find().toArray(function (err, deliveries) {
                        if (err) {
                            throw err;
                        }
//                        console.log("deliveries >>>>>>>>>>>>>>>>>" + JSON.stringify(deliveries));
                        expect(deliveries).to.have.length(2);
                        expect(deliveries[0].code).to.eql("xx1");
                        expect(deliveries[0].amount).to.eql(100);
                        expect(deliveries[0].orderid._id).to.eql(1);
                        expect(deliveries[1].code).to.eql("xx2");
                        expect(deliveries[1].amount).to.eql(200);
                        expect(deliveries[1].orderid._id).to.eql(1);
                        return db.query({$collection:"orders", $sort:{order_no:1}}).then(
                            function (result) {
                                d.resolve(result);
                            }).fail(function (err) {
                                throw err;
                            });
                    })
                })
                return d.promise;
            }).then(
            function (orders) {
//                console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                expect(orders.result).to.have.length(1);
                expect(orders.result[0].order_no).to.eql("123");
                expect(orders.result[0].deliveries).to.have.length(2);
                expect(orders.result[0].deliveries[0].code).to.eql("xx1");
                expect(orders.result[0].deliveries[0].amount).to.eql(100);
                expect(orders.result[0].deliveries[0].orderid._id).to.eql(1);
                expect(orders.result[0].deliveries[1].code).to.eql("xx2");
                expect(orders.result[0].deliveries[1].amount).to.eql(200);
                expect(orders.result[0].deliveries[1].orderid._id).to.eql(1);
                return db.query({$collection:"orders", $fields:{"deliveries":1}, $sort:{order_no:1}});
            }).then(
            function (orders) {
//                console.log(">>>>>>>>>>>>>>>>>>>>>>>>orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                expect(orders.result).to.have.length(1);
                expect(orders.result[0].order_no).to.eql("123");
                expect(orders.result[0].deliveries).to.have.length(2);
                expect(orders.result[0].deliveries[0].code).to.eql("xx1");
                expect(orders.result[0].deliveries[0].amount).to.eql(100);
                expect(orders.result[0].deliveries[0].orderid._id).to.eql(1);
                expect(orders.result[0].deliveries[1].code).to.eql("xx2");
                expect(orders.result[0].deliveries[1].amount).to.eql(200);
                expect(orders.result[0].deliveries[1].orderid._id).to.eql(1);
                return db.query({$collection:"orders", $fields:{"deliveries":0}, $sort:{order_no:1}});
            }).then(
            function (orders) {
//                console.log(">>>>>>>>>>>>>>>>>>>>>>>>orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                expect(orders.result).to.have.length(1);
                expect(orders.result[0].order_no).to.eql("123");
                expect(orders.result[0].deliveries).to.eql(undefined);
                return db.query({$collection:"orders", $fields:{"deliveries1":"$deliveries"}, $sort:{order_no:1}});
            }).then(
            function (orders) {
//                console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                expect(orders.result).to.have.length(1);
                expect(orders.result[0].order_no).to.eql("123");
                expect(orders.result[0].deliveries1).to.have.length(2);
                expect(orders.result[0].deliveries1[0].code).to.eql("xx1");
                expect(orders.result[0].deliveries1[0].amount).to.eql(100);
                expect(orders.result[0].deliveries1[0].orderid._id).to.eql(1);
                expect(orders.result[0].deliveries1[1].code).to.eql("xx2");
                expect(orders.result[0].deliveries1[1].amount).to.eql(200);
                expect(orders.result[0].deliveries1[1].orderid._id).to.eql(1);
                return db.query({$collection:"orders", $fields:{"deliveries1":"$deliveries", "deliveries2":"$deliveries"}, $sort:{order_no:1}});
            }).then(
            function (orders) {
//                console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                expect(orders.result).to.have.length(1);
                expect(orders.result[0].order_no).to.eql("123");
                expect(orders.result[0].deliveries1).to.have.length(2);
                expect(orders.result[0].deliveries1[0].code).to.eql("xx1");
                expect(orders.result[0].deliveries1[0].amount).to.eql(100);
                expect(orders.result[0].deliveries1[0].orderid._id).to.eql(1);
                expect(orders.result[0].deliveries1[1].code).to.eql("xx2");
                expect(orders.result[0].deliveries1[1].amount).to.eql(200);
                expect(orders.result[0].deliveries1[1].orderid._id).to.eql(1);
                expect(orders.result[0].deliveries2).to.have.length(2);
                expect(orders.result[0].deliveries2[0].code).to.eql("xx1");
                expect(orders.result[0].deliveries2[0].amount).to.eql(100);
                expect(orders.result[0].deliveries2[0].orderid._id).to.eql(1);
                expect(orders.result[0].deliveries2[1].code).to.eql("xx2");
                expect(orders.result[0].deliveries2[1].amount).to.eql(200);
                expect(orders.result[0].deliveries2[1].orderid._id).to.eql(1);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            })
    })

    it.skip("on order update delivery not update or delete by trigger", function (done) {
        done();
    })

    it("Orders and Deliveries", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var orderUpdates = [
                    {$collection:"orders", $insert:[
                        {_id:1, order_no:"123",
                            deliveries:{
                                $insert:[
                                    {_id:"xx1", code:"xx1", amount:100},
                                    {_id:"xx2", code:"xx2", amount:200} ,
                                    {_id:"xx3", code:"xx3", amount:300}
                                ]
                            }
                        }
                    ]
                    }
                ];
                return db.update(orderUpdates);
            }).then(
            function () {
                var d = require("q").defer();
                db.db.collection("orders").find().toArray(function (err, orders) {
                    if (err) {
                        throw err;
                    }
                    expect(orders).to.have.length(1);
                    expect(orders[0].order_no).to.eql("123");
                    expect(orders[0].deliveries).to.eql(undefined);
                    db.db.collection("deliveries").find().toArray(function (err, deliveries) {
                        if (err) {
                            throw err;
                        }
                        expect(deliveries).to.have.length(3);
                        expect(deliveries[0].code).to.eql("xx1");
                        expect(deliveries[0].amount).to.eql(100);
                        expect(deliveries[0].orderid._id).to.eql(1);
                        expect(deliveries[1].code).to.eql("xx2");
                        expect(deliveries[1].amount).to.eql(200);
                        expect(deliveries[1].orderid._id).to.eql(1);
                        expect(deliveries[2].code).to.eql("xx3");
                        expect(deliveries[2].amount).to.eql(300);
                        expect(deliveries[2].orderid._id).to.eql(1);
                        d.resolve();
                    })
                })
                return d.promise;
            }).then(
            function (e) {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("Orders and Deliveries with use child on post job", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var orderUpdates = [
                    {$collection:"orders", $insert:[
                        {_id:1, order_no:"123",
                            deliveries:{
                                $insert:[
                                    {_id:"xx1", code:"xx1", amount:100},
                                    {_id:"xx2", code:"xx2", amount:200} ,
                                    {_id:"xx3", code:"xx3", amount:300}
                                ]
                            }
                        }
                    ]
                    }
                ];
                return db.update(orderUpdates);
            }).then(
            function () {
                var d = require("q").defer();
                db.db.collection("orders").find().toArray(function (err, orders) {
                    if (err) {
                        throw err;
                    }
                    expect(orders).to.have.length(1);
                    expect(orders[0].order_no).to.eql("123");
                    expect(orders[0].deliveriesCount).to.equal(3);
                    expect(orders[0].deliveries).to.eql(undefined);
                    db.db.collection("deliveries").find().toArray(function (err, deliveries) {
                        if (err) {
                            throw err;
                        }
                        expect(deliveries).to.have.length(3);
                        expect(deliveries[0].code).to.eql("xx1");
                        expect(deliveries[0].amount).to.eql(100);
                        expect(deliveries[0].orderid._id).to.eql(1);
                        expect(deliveries[1].code).to.eql("xx2");
                        expect(deliveries[1].amount).to.eql(200);
                        expect(deliveries[1].orderid._id).to.eql(1);
                        expect(deliveries[2].code).to.eql("xx3");
                        expect(deliveries[2].amount).to.eql(300);
                        expect(deliveries[2].orderid._id).to.eql(1);
                        d.resolve();
                    })
                })
                return d.promise;
            }).then(
            function (e) {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("Orders and Deliveries and invoices and accounts", function (done) {

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var orderUpdates = [
                    {$collection:"orders", $insert:[
                        {_id:1, order_no:"123",
                            deliveries:{
                                $insert:[
                                    {_id:"xx1", code:"xx1", amount:100},
                                    {_id:"xx2", code:"xx2", amount:200},
                                    {_id:"xx3", code:"xx3", amount:300}
                                ]
                            }, invoices:{
                            $insert:[
                                {_id:"xx1", code:"xx1", amount:100},
                                {_id:"xx2", code:"xx2", amount:200},
                                {_id:"xx3", code:"xx3", amount:300}
                            ]
                        }, accounts:{
                            $insert:[
                                {_id:"xx1", code:"xx1", amount:100},
                                {_id:"xx2", code:"xx2", amount:200},
                                {_id:"xx3", code:"xx3", amount:300}
                            ]
                        }
                        }
                    ]
                    }
                ];
                return db.update(orderUpdates);
            }).then(
            function () {
                var d = Q.defer();
                db.db.collection("orders").find().toArray(function (err, orders) {
                    if (err) {
                        throw err;
                    }
//                    console.log(">>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                    expect(orders).to.have.length(1);
                    expect(orders[0].order_no).to.eql("123");
                    expect(orders[0].deliveries).to.eql(undefined);
                    expect(orders[0].invoices).to.eql(undefined);
                    expect(orders[0].accounts).to.eql(undefined);
                    db.db.collection("deliveries").find().toArray(function (err, deliveries) {
                        if (err) {
                            throw err;
                        }
//                        console.log("deliveries >>>>>>>>>>>>>>>>>" + JSON.stringify(deliveries));
                        expect(deliveries).to.have.length(3);
                        expect(deliveries[0].code).to.eql("xx1");
                        expect(deliveries[0].amount).to.eql(100);
                        expect(deliveries[0].orderid._id).to.eql(1);
                        expect(deliveries[1].code).to.eql("xx2");
                        expect(deliveries[1].amount).to.eql(200);
                        expect(deliveries[1].orderid._id).to.eql(1);
                        expect(deliveries[2].code).to.eql("xx3");
                        expect(deliveries[2].amount).to.eql(300);
                        expect(deliveries[2].orderid._id).to.eql(1);
                        db.db.collection("invoices").find().toArray(function (err, invoices) {
                            if (err) {
                                throw err;
                            }
//                            console.log("invoices >>>>>>>>>>>>>>>>>" + JSON.stringify(invoices));
                            expect(invoices).to.have.length(3);
                            expect(invoices[0].code).to.eql("xx1");
                            expect(invoices[0].amount).to.eql(100);
                            expect(invoices[0].orderid._id).to.eql(1);
                            expect(invoices[1].code).to.eql("xx2");
                            expect(invoices[1].amount).to.eql(200);
                            expect(invoices[1].orderid._id).to.eql(1);
                            expect(invoices[2].code).to.eql("xx3");
                            expect(invoices[2].amount).to.eql(300);
                            expect(invoices[2].orderid._id).to.eql(1);
                            db.db.collection("accounts").find().toArray(function (err, accounts) {
                                if (err) {
                                    throw err;
                                }
//                                console.log("accounts >>>>>>>>>>>>>>>>>" + JSON.stringify(accounts));
                                expect(accounts).to.have.length(3);
                                expect(accounts[0].code).to.eql("xx1");
                                expect(accounts[0].amount).to.eql(100);
                                expect(accounts[0].orderid._id).to.eql(1);
                                expect(accounts[1].code).to.eql("xx2");
                                expect(accounts[1].amount).to.eql(200);
                                expect(accounts[1].orderid._id).to.eql(1);
                                expect(accounts[2].code).to.eql("xx3");
                                expect(accounts[2].amount).to.eql(300);
                                expect(accounts[2].orderid._id).to.eql(1);
                                return db.query({$collection:"orders", $sort:{order_no:1}}).then(
                                    function (result) {
                                        d.resolve(result);
                                    }).fail(function (err) {
                                        throw err;
                                    });
                            })
                        })
                    })
                })
                return d.promise;
            }).then(
            function (orders) {
//                console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                expect(orders.result).to.have.length(1);
                expect(orders.result[0].order_no).to.eql("123");
                expect(orders.result[0].deliveries).to.have.length(3);
                expect(orders.result[0].invoices).to.have.length(3);
                expect(orders.result[0].accounts).to.have.length(3);
                return db.query({$collection:"orders", $fields:{"deliveries":1}, $sort:{order_no:1}});
            }).then(
            function (orders) {
//                console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                expect(orders.result).to.have.length(1);
                expect(orders.result[0].order_no).to.eql("123");
                expect(orders.result[0].deliveries).to.have.length(3);
                expect(orders.result[0].invoices).to.eql(undefined);
                expect(orders.result[0].accounts).to.eql(undefined);
                return db.query({$collection:"orders", $fields:{"deliveries":1, accounts:1}, $sort:{order_no:1}});
            }).then(
            function (orders) {
//                console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                expect(orders.result).to.have.length(1);
                expect(orders.result[0].order_no).to.eql("123");
                expect(orders.result[0].deliveries).to.have.length(3);
                expect(orders.result[0].invoices).to.eql(undefined);
                expect(orders.result[0].accounts).to.have.length(3);
                return db.query({$collection:"orders", $fields:{"invoices":0}, $sort:{order_no:1}});
            }).then(
            function (orders) {
//                console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                expect(orders.result).to.have.length(1);
                expect(orders.result[0].order_no).to.eql("123");
                expect(orders.result[0].deliveries).to.have.length(3);
                expect(orders.result[0].invoices).to.eql(undefined);
                expect(orders.result[0].accounts).to.have.length(3);
                return db.query({$collection:"orders", $fields:{"invoices":0, "deliveries":0, "accounts":0}, $sort:{order_no:1}});
            }).then(
            function (orders) {
//                console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                expect(orders.result).to.have.length(1);
                expect(orders.result[0].order_no).to.eql("123");
                expect(orders.result[0].deliveries).to.eql(undefined);
                expect(orders.result[0].accounts).to.eql(undefined);
                expect(orders.result[0].invoices).to.eql(undefined);
            }).then(
            function () {
                done()
            }).fail(function (e) {
                done(e);
            })
    })

    it("Orders and Deliveries Update", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var orderUpdates = [
                    {$collection:"orders", $insert:[
                        {_id:1, order_no:"123",
                            deliveries:{
                                $insert:[
                                    {_id:"xx1", code:"xx1", amount:100},
                                    {_id:"xx2", code:"xx2", amount:200} ,
                                    {_id:"xx3", code:"xx3", amount:300}
                                ]
                            }
                        }
                    ]
                    }
                ];
                return db.update(orderUpdates);
            }).then(
            function () {
                var update = [
                    {$collection:"orders", $update:[
                        {_id:1,
                            $set:{deliveries:{
                                $insert:[
                                    {_id:"xx4", code:"xx4", amount:400}
                                ],
                                $update:[
                                    {_id:"xx1", $set:{code:"XX1"}}
                                ], $delete:[
                                    {_id:"xx2"}
                                ]
                            }}
                        }
                    ]
                    }
                ];
                return db.update(update);
            }).then(
            function () {
                db.db.collection("orders").find().toArray(function (err, orders) {
                    if (err) {
                        throw err;
                    }
//                    console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                    expect(orders).to.have.length(1);
                    expect(orders[0].order_no).to.eql("123");
                    expect(orders[0].deliveries).to.eql(undefined);
                    db.db.collection("deliveries").find().toArray(function (err, deliveries) {
                        if (err) {
                            throw err;
                        }
//                        console.log("deliveries >>>>>>>>>>>>>>>>>" + JSON.stringify(deliveries));
                        expect(deliveries).to.have.length(3);
                        expect(deliveries[0].code).to.eql("XX1");
                        expect(deliveries[0].amount).to.eql(100);
                        expect(deliveries[0].orderid._id).to.eql(1);
                        expect(deliveries[1].code).to.eql("xx3");
                        expect(deliveries[1].amount).to.eql(300);
                        expect(deliveries[1].orderid._id).to.eql(1);
                        expect(deliveries[2].code).to.eql("xx4");
                        expect(deliveries[2].amount).to.eql(400);
                        expect(deliveries[2].orderid._id).to.eql(1);
                        done();
                    })
                })
            }).fail(function (e) {
                done(e);
            })
    })

    it("Orders and Deliveries unset deliveries", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var orderUpdates = [
                    {$collection:"orders", $insert:[
                        {_id:1, order_no:"123",
                            deliveries:{
                                $insert:[
                                    {_id:"xx1", code:"xx1", amount:100},
                                    {_id:"xx2", code:"xx2", amount:200} ,
                                    {_id:"xx3", code:"xx3", amount:300}
                                ]
                            }
                        }
                    ]
                    }
                ];
                return db.update(orderUpdates);
            }).then(
            function () {
                var update = [
                    {$collection:"orders", $update:[
                        {_id:1,
                            $unset:{deliveries:1}
                        }
                    ]
                    }
                ];
                return db.update(update);
            }).then(
            function () {
                db.db.collection("orders").find().toArray(function (err, orders) {
                    if (err) {
                        throw err;
                    }
//                    console.log("orders >>>>>>>>>>>>>>>>>" + JSON.stringify(orders));
                    expect(orders).to.have.length(1);
                    expect(orders[0].order_no).to.eql("123");
                    expect(orders[0].deliveries).to.eql(undefined);
                    db.db.collection("deliveries").find().toArray(function (err, deliveries) {
                        if (err) {
                            throw err;
                        }
//                        console.log("deliveries >>>>>>>>>>>>>>>>>" + JSON.stringify(deliveries));
                        expect(deliveries).to.have.length(0);
                        done();
                    })
                })
            }).fail(function (err) {
                done(err);
            })
    })

    it("Collection and fields recursive", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:"collections",
                        $insert:[
                            {_id:"vouchers", collection:"vouchers", fields:{$insert:[
                                {field:"voucherno", type:"string"},
                                {field:"voucherlineitems", type:"object", multiple:true, fields:[
                                    {field:"amount", type:"decimal"},
                                    {field:"accountid", type:"fk", collection:"accounts"},
                                    {field:"ilis", type:"object", multiple:true, fields:[
                                        {"field":"id", type:"string"}
                                    ]}
                                ]}
                            ]}}
                        ]

//                    $insert:[
//                        {_id:"vouchers", collection:"vouchers", fields:[
//                            {field:"voucherno", type:"string"},
//                            {field:"voucherlineitems", type:"object", multiple:true, fields:[
//                                {field:"amount", type:"decimal"},
//                                {field:"accountid", type:"fk", collection:"accounts"}
//                            ]}
//                        ]}
//                    ]
                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var d = Q.defer();
                db.db.collection("collections").find().toArray(function (err, collections) {
                    if (err) {
                        throw err;
                    }
//                    console.log("************collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                    expect(collections).to.have.length(1);
                    expect(collections[0]._id).to.eql("vouchers");
                    expect(collections[0].collection).to.eql("vouchers");
                    expect(collections[0].fields).to.eql(undefined);
                    db.db.collection("fields").find({}, {sort:{field:1, parentfieldid:1}}).toArray(function (err, fields) {
                        if (err) {
                            throw err;
                        }
//                        console.log("fields >>>>>>>>>>>>>>>>>" + JSON.stringify(fields));
                        expect(fields).to.have.length(6);
                        expect(fields[0].field).to.eql("accountid");
                        expect(fields[0].collectionid.collection).to.eql("vouchers");
                        expect(fields[0].parentfieldid.field).to.eql("voucherlineitems");
                        expect(fields[1].field).to.eql("amount");
                        expect(fields[1].collectionid.collection).to.eql("vouchers");
                        expect(fields[1].parentfieldid.field).to.eql("voucherlineitems");
                        expect(fields[2].field).to.eql("id");
                        expect(fields[2].collectionid.collection).to.eql("vouchers");
                        expect(fields[2].parentfieldid.field).to.eql("ilis");
                        expect(fields[3].field).to.eql("ilis");
                        expect(fields[3].collectionid.collection).to.eql("vouchers");
                        expect(fields[3].parentfieldid.field).to.eql("voucherlineitems");
                        expect(fields[4].field).to.eql("voucherlineitems");
                        expect(fields[4].collectionid.collection).to.eql("vouchers");
                        expect(fields[4].parentfieldid).to.eql(undefined);
                        expect(fields[5].field).to.eql("voucherno");
                        expect(fields[5].collectionid.collection).to.eql("vouchers");
                        expect(fields[5].parentfieldid).to.eql(undefined);

                        var expResult = [
                            {"field":"accountid", "type":"fk", "collection":"accounts", "collectionid":{"_id":"vouchers", "collection":"vouchers"}, "parentfieldid":{"field":"voucherlineitems", "_id":"535e2a9c7cd7c3c41c1e6edd"}, "_id":"535e2a9c7cd7c3c41c1e6ee5"},
                            {"field":"amount", "type":"decimal", "co llectionid":{"_id":"vouchers", "collection":"vouchers"}, "parentfieldid":{"field":"voucherlineitems", "_id":"535e2a9c7cd7c3c41c1e6edd"}, "_id":"535e2a9c7cd7c3c41c1e6ee1"},
                            {"field":"id", "type":"string", "parentfieldid":{"field":"ilis", "_id":"535e2a9c7cd7c3c41c1e6ee9"}, "_id":"535e2a9c7cd7c3c41c1e6eee"},
                            {"f ield":"ilis", "type":"object", "multiple":true, "collectionid":{"_id":"vouchers", "collection":"vouchers"}, "parentfieldid":{"field":"voucherlineitems", "_id":"535e2a9c7cd7c3c41c1e6edd"}, "_id":"535e2a9c7cd7c3c41c1e6ee9"},
                            {"field":"voucherlineitems", "type":"object", "multiple":true, "collectionid":{"_id":"vo uchers", "collection":"vouchers"}, "_id":"535e2a9c7cd7c3c41c1e6edd"},
                            {"field":"voucherno", "type":"string", "collectionid":{"_id":"vouchers", "collection":"vouchers"}, "_id":"535e2a9c7cd7c3c41c1e6eda"}
                        ];
                        db.query({$collection:"collections", $sort:{collection:1}}).then(
                            function (result) {
                                d.resolve(result);
                            }).fail(function (err) {
                                throw err;
                            })
                    })
                })
                return d.promise;
            }).then(
            function (collections) {
//                console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                expect(collections.result).to.have.length(1);
                expect(collections.result[0]._id).to.eql("vouchers");
                expect(collections.result[0].collection).to.eql("vouchers");
                expect(collections.result[0].fields).to.have.length(2);
                expect(collections.result[0].fields[0].field).to.eql("voucherno");
                expect(collections.result[0].fields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields).to.have.length(3);
                expect(collections.result[0].fields[1].fields[0].field).to.eql("amount");
                expect(collections.result[0].fields[1].fields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields[0].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].fields[1].field).to.eql("accountid");
                expect(collections.result[0].fields[1].fields[1].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields[1].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].fields[2].field).to.eql("ilis");
                expect(collections.result[0].fields[1].fields[2].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields[2].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].fields[2].fields).to.have.length(1);
                expect(collections.result[0].fields[1].fields[2].fields[0].field).to.eql("id");
                expect(collections.result[0].fields[1].fields[2].fields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields[2].fields[0].parentfieldid.field).to.eql("ilis");
                return db.query({$collection:"collections", $fields:{fields:1}, $sort:{collection:1}});
            }).then(
            function (collections) {
//                console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                expect(collections.result).to.have.length(1);
                expect(collections.result[0]._id).to.eql("vouchers");
                expect(collections.result[0].collection).to.eql("vouchers");
                expect(collections.result[0].fields).to.have.length(2);
                expect(collections.result[0].fields[0].field).to.eql("voucherno");
                expect(collections.result[0].fields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields).to.have.length(3);
                expect(collections.result[0].fields[1].fields[0].field).to.eql("amount");
                expect(collections.result[0].fields[1].fields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields[0].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].fields[1].field).to.eql("accountid");
                expect(collections.result[0].fields[1].fields[1].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields[1].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].fields[2].field).to.eql("ilis");
                expect(collections.result[0].fields[1].fields[2].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields[2].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].fields[2].fields).to.have.length(1);
                expect(collections.result[0].fields[1].fields[2].fields[0].field).to.eql("id");
                expect(collections.result[0].fields[1].fields[2].fields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields[2].fields[0].parentfieldid.field).to.eql("ilis");
                return db.query({$collection:"collections", $fields:{_id:1, fields:1}, $sort:{collection:1}});
            }).then(
            function (collections) {
//                console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                expect(collections.result).to.have.length(1);
                expect(collections.result[0]._id).to.eql("vouchers");
                expect(collections.result[0].collection).to.eql(undefined);
                expect(collections.result[0].fields).to.have.length(2);
                expect(collections.result[0].fields[0].field).to.eql("voucherno");
                expect(collections.result[0].fields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields).to.have.length(3);
                expect(collections.result[0].fields[1].fields[0].field).to.eql("amount");
                expect(collections.result[0].fields[1].fields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields[0].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].fields[1].field).to.eql("accountid");
                expect(collections.result[0].fields[1].fields[1].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields[1].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].fields[2].field).to.eql("ilis");
                expect(collections.result[0].fields[1].fields[2].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields[2].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].fields[2].fields).to.have.length(1);
                expect(collections.result[0].fields[1].fields[2].fields[0].field).to.eql("id");
                expect(collections.result[0].fields[1].fields[2].fields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields[2].fields[0].parentfieldid.field).to.eql("ilis");
                return db.query({$collection:"collections", $fields:{_id:1}, $sort:{collection:1}});
            }).then(
            function (collections) {
//                console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                expect(collections.result).to.have.length(1);
                expect(collections.result[0]._id).to.eql("vouchers");
                expect(collections.result[0].collection).to.eql(undefined);
                expect(collections.result[0].fields).to.eql(undefined);
                return db.query({$collection:"collections", $fields:{fields:0}, $sort:{collection:1}});
            }).then(
            function (collections) {
//                console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                expect(collections.result).to.have.length(1);
                expect(collections.result[0]._id).to.eql("vouchers");
                expect(collections.result[0].collection).to.eql("vouchers");
                expect(collections.result[0].fields).to.eql(undefined);
            }).then(
            function () {
                done();
            }).fail(
            function (e) {
                done(e);
            })
    })

    it("Collection and fields recursive with change alias", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var batchUpdates = [
                    {
                        $collection:"collections",
                        $insert:[
                            {_id:"vouchers", collection:"vouchers", fields:{$insert:[
                                {field:"voucherno", type:"string"},
                                {field:"voucherlineitems", type:"object", multiple:true, fields:[
                                    {field:"amount", type:"decimal"},
                                    {field:"accountid", type:"fk", collection:"accounts"},
                                    {field:"ilis", type:"object", multiple:true, fields:[
                                        {"field":"id", type:"string"}
                                    ]}
                                ]}
                            ]}}
                        ]

//                    $insert:[
//                        {_id:"vouchers", collection:"vouchers", fields:[
//                            {field:"voucherno", type:"string"},
//                            {field:"voucherlineitems", type:"object", multiple:true, fields:[
//                                {field:"amount", type:"decimal"},
//                                {field:"accountid", type:"fk", collection:"accounts"}
//                            ]}
//                        ]}
//                    ]
                    }
                ];
                return db.update(batchUpdates);
            }).then(
            function () {
                var d = Q.defer();
                db.db.collection("collections").find().toArray(function (err, collections) {
                    if (err) {
                        throw err;
                    }
//                    console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                    expect(collections).to.have.length(1);
                    expect(collections[0]._id).to.eql("vouchers");
                    expect(collections[0].collection).to.eql("vouchers");
                    expect(collections[0].fields).to.eql(undefined);
                    db.db.collection("fields").find({}, {sort:{field:1, parentfieldid:1}}).toArray(function (err, fields) {
                        if (err) {
                            throw err;
                        }
//                        console.log("fields >>>>>>>>>>>>>>>>>" + JSON.stringify(fields));
                        expect(fields).to.have.length(6);
                        expect(fields[0].field).to.eql("accountid");
                        expect(fields[0].collectionid.collection).to.eql("vouchers");
                        expect(fields[0].parentfieldid.field).to.eql("voucherlineitems");
                        expect(fields[1].field).to.eql("amount");
                        expect(fields[1].collectionid.collection).to.eql("vouchers");
                        expect(fields[1].parentfieldid.field).to.eql("voucherlineitems");
                        expect(fields[2].field).to.eql("id");
                        expect(fields[2].collectionid.collection).to.eql("vouchers");
                        expect(fields[2].parentfieldid.field).to.eql("ilis");
                        expect(fields[3].field).to.eql("ilis");
                        expect(fields[3].collectionid.collection).to.eql("vouchers");
                        expect(fields[3].parentfieldid.field).to.eql("voucherlineitems");
                        expect(fields[4].field).to.eql("voucherlineitems");
                        expect(fields[4].collectionid.collection).to.eql("vouchers");
                        expect(fields[4].parentfieldid).to.eql(undefined);
                        expect(fields[5].field).to.eql("voucherno");
                        expect(fields[5].collectionid.collection).to.eql("vouchers");
                        expect(fields[5].parentfieldid).to.eql(undefined);

                        var expResult = [
                            {"field":"accountid", "type":"fk", "collection":"accounts", "collectionid":{"_id":"vouchers", "collection":"vouchers"}, "parentfieldid":{"field":"voucherlineitems", "_id":"535e2a9c7cd7c3c41c1e6edd"}, "_id":"535e2a9c7cd7c3c41c1e6ee5"},
                            {"field":"amount", "type":"decimal", "co llectionid":{"_id":"vouchers", "collection":"vouchers"}, "parentfieldid":{"field":"voucherlineitems", "_id":"535e2a9c7cd7c3c41c1e6edd"}, "_id":"535e2a9c7cd7c3c41c1e6ee1"},
                            {"field":"id", "type":"string", "parentfieldid":{"field":"ilis", "_id":"535e2a9c7cd7c3c41c1e6ee9"}, "_id":"535e2a9c7cd7c3c41c1e6eee"},
                            {"f ield":"ilis", "type":"object", "multiple":true, "collectionid":{"_id":"vouchers", "collection":"vouchers"}, "parentfieldid":{"field":"voucherlineitems", "_id":"535e2a9c7cd7c3c41c1e6edd"}, "_id":"535e2a9c7cd7c3c41c1e6ee9"},
                            {"field":"voucherlineitems", "type":"object", "multiple":true, "collectionid":{"_id":"vo uchers", "collection":"vouchers"}, "_id":"535e2a9c7cd7c3c41c1e6edd"},
                            {"field":"voucherno", "type":"string", "collectionid":{"_id":"vouchers", "collection":"vouchers"}, "_id":"535e2a9c7cd7c3c41c1e6eda"}
                        ];
                        db.query({$collection:{collection:"collections", fields:[
                            {field:"fields", type:"object", multiple:true, query:JSON.stringify({$type:"child", $query:{$collection:"fields", $filter:{parentfieldid:null}, $recursion:{parentfieldid:"_id", $alias:"parentfields"}}, $fk:Constants.Admin.Fields.COLLECTION_ID})}
                        ]}, $sort:{collection:1}}).then(
                            function (result) {
                                d.resolve(result);
                            }).fail(function (err) {
                                throw err;
                            })
                    })
                })
                return d.promise;
            }).then(
            function (collections) {
//                console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                expect(collections.result).to.have.length(1);
                expect(collections.result[0]._id).to.eql("vouchers");
                expect(collections.result[0].collection).to.eql("vouchers");
                expect(collections.result[0].fields).to.have.length(2);
                expect(collections.result[0].fields[0].field).to.eql("voucherno");
                expect(collections.result[0].fields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].collectionid.collection).to.eql("vouchers");
//                            expect(collections.result[0].fields[1].fields).to.eql(undefined);
                expect(collections.result[0].fields[1].parentfields).to.have.length(3);
                expect(collections.result[0].fields[1].parentfields[0].field).to.eql("amount");
                expect(collections.result[0].fields[1].parentfields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].parentfields[0].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].parentfields[1].field).to.eql("accountid");
                expect(collections.result[0].fields[1].parentfields[1].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].parentfields[1].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].parentfields[2].field).to.eql("ilis");
                expect(collections.result[0].fields[1].parentfields[2].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].parentfields[2].parentfieldid.field).to.eql("voucherlineitems");
//                            expect(collections.result[0].fields[1].parentfields[2].fields).to.eql(undefined);
                expect(collections.result[0].fields[1].parentfields[2].parentfields).to.have.length(1);
                expect(collections.result[0].fields[1].parentfields[2].parentfields[0].field).to.eql("id");
                expect(collections.result[0].fields[1].parentfields[2].parentfields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].parentfields[2].parentfields[0].parentfieldid.field).to.eql("ilis");
                return db.query({$collection:{collection:"collections", fields:[
                    {field:"fields", type:"object", multiple:true, query:JSON.stringify({$type:"child", $query:{$collection:"fields", $fields:{fields:0}, $filter:{parentfieldid:null}, $recursion:{parentfieldid:"_id", $alias:"parentfields"}}, $fk:Constants.Admin.Fields.COLLECTION_ID})}
                ]}, $sort:{collection:1}});
            }).then(
            function (collections) {
//                console.log("collections >>>>>>>>>>>>>>>>>" + JSON.stringify(collections));
                expect(collections.result).to.have.length(1);
                expect(collections.result[0]._id).to.eql("vouchers");
                expect(collections.result[0].collection).to.eql("vouchers");
                expect(collections.result[0].fields).to.have.length(2);
                expect(collections.result[0].fields[0].field).to.eql("voucherno");
                expect(collections.result[0].fields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].fields).to.eql(undefined);
                expect(collections.result[0].fields[1].parentfields).to.have.length(3);
                expect(collections.result[0].fields[1].parentfields[0].field).to.eql("amount");
                expect(collections.result[0].fields[1].parentfields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].parentfields[0].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].parentfields[1].field).to.eql("accountid");
                expect(collections.result[0].fields[1].parentfields[1].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].parentfields[1].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].parentfields[2].field).to.eql("ilis");
                expect(collections.result[0].fields[1].parentfields[2].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].parentfields[2].parentfieldid.field).to.eql("voucherlineitems");
                expect(collections.result[0].fields[1].parentfields[2].fields).to.eql(undefined);
                expect(collections.result[0].fields[1].parentfields[2].parentfields).to.have.length(1);
                expect(collections.result[0].fields[1].parentfields[2].parentfields[0].field).to.eql("id");
                expect(collections.result[0].fields[1].parentfields[2].parentfields[0].collectionid.collection).to.eql("vouchers");
                expect(collections.result[0].fields[1].parentfields[2].parentfields[0].parentfieldid.field).to.eql("ilis");
            }).then(
            function () {
                done();
            }).fail(
            function (e) {
                done(e);
            })
    })

    it("Order with Deliveries as Child and with fk fields", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var orderUpdates = [
                    {$collection:"orderss", $insert:[
                        { order_no:"123",
                            deliveries:{
                                $insert:[
                                    {delivery_no:"1234", delivery_accountid:{$query:{account:"MYBANK"}}, dli:{$insert:[
                                        { dli_no:"xx1", dli_accountid:{$query:{account:"SBI"}}, deductions:[
                                            { deductions_no:"ddd1", deductions_accountid:{$query:{account:"SBP"}}},
                                            { deductions_no:"ddd2", deductions_accountid:{$query:{account:"IB"}}}
                                        ]
                                        }
                                    ]}},
                                    {delivery_no:"4321", delivery_accountid:{$query:{account:"MYBANK"}}, dli:{$insert:[
                                        { dli_no:"xx2", dli_accountid:{$query:{account:"SBI"}}, deductions:[
                                            { deductions_no:"ddd3", deductions_accountid:{$query:{account:"SBP"}}},
                                            { deductions_no:"ddd4", deductions_accountid:{$query:{account:"IB"}}}
                                        ]
                                        }
                                    ]}}
                                ]}}
                    ]
                    }
                ];

                return db.update(orderUpdates);
            }).then(
            function () {
                return db.query({$collection:"orderss"});
            }).then(
            function (data) {
//                console.log("data>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].order_no).to.eql("123");
                expect(data.result[0].deliveries).to.have.length(2);
                expect(data.result[0].deliveries[0].delivery_no).to.eql("1234");
                expect(data.result[0].deliveries[0].delivery_accountid.account).to.eql("MYBANK");
                expect(data.result[0].deliveries[0].dli).to.have.length(1);
                expect(data.result[0].deliveries[0].dli[0].dli_no).to.eql("xx1");
                expect(data.result[0].deliveries[0].dli[0].dli_accountid.account).to.eql("SBI");
                expect(data.result[0].deliveries[0].dli[0].deductions).to.have.length(2);
                expect(data.result[0].deliveries[0].dli[0].deductions[0].deductions_no).to.eql("ddd1");
                expect(data.result[0].deliveries[0].dli[0].deductions[0].deductions_accountid.account).to.eql("SBP");
                expect(data.result[0].deliveries[0].dli[0].deductions[1].deductions_no).to.eql("ddd2");
                expect(data.result[0].deliveries[0].dli[0].deductions[1].deductions_accountid.account).to.eql("IB");


                expect(data.result[0].deliveries[1].delivery_no).to.eql("4321");
                expect(data.result[0].deliveries[1].delivery_accountid.account).to.eql("MYBANK");
                expect(data.result[0].deliveries[1].dli).to.have.length(1);
                expect(data.result[0].deliveries[1].dli[0].dli_no).to.eql("xx2");
                expect(data.result[0].deliveries[1].dli[0].dli_accountid.account).to.eql("SBI");
                expect(data.result[0].deliveries[1].dli[0].deductions).to.have.length(2);
                expect(data.result[0].deliveries[1].dli[0].deductions[0].deductions_no).to.eql("ddd3");
                expect(data.result[0].deliveries[1].dli[0].deductions[0].deductions_accountid.account).to.eql("SBP");
                expect(data.result[0].deliveries[1].dli[0].deductions[1].deductions_no).to.eql("ddd4");
                expect(data.result[0].deliveries[1].dli[0].deductions[1].deductions_accountid.account).to.eql("IB");

                return db.query({$collection:"deliveriess"});
            }).then(
            function (data) {
//                console.log("deliveries data>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].delivery_no).to.eql("1234");
                expect(data.result[0].delivery_accountid.account).to.eql("MYBANK");
                expect(data.result[0].dli).to.have.length(1);
                expect(data.result[0].dli[0].dli_no).to.eql("xx1");
                expect(data.result[0].dli[0].dli_accountid.account).to.eql("SBI");
                expect(data.result[0].dli[0].deductions).to.have.length(2);
                expect(data.result[0].dli[0].deductions[0].deductions_no).to.eql("ddd1");
                expect(data.result[0].dli[0].deductions[0].deductions_accountid.account).to.eql("SBP");
                expect(data.result[0].dli[0].deductions[1].deductions_no).to.eql("ddd2");
                expect(data.result[0].dli[0].deductions[1].deductions_accountid.account).to.eql("IB");


                expect(data.result[1].delivery_no).to.eql("4321");
                expect(data.result[1].delivery_accountid.account).to.eql("MYBANK");
                expect(data.result[1].dli).to.have.length(1);
                expect(data.result[1].dli[0].dli_no).to.eql("xx2");
                expect(data.result[1].dli[0].dli_accountid.account).to.eql("SBI");
                expect(data.result[1].dli[0].deductions).to.have.length(2);
                expect(data.result[1].dli[0].deductions[0].deductions_no).to.eql("ddd3");
                expect(data.result[1].dli[0].deductions[0].deductions_accountid.account).to.eql("SBP");
                expect(data.result[1].dli[0].deductions[1].deductions_no).to.eql("ddd4");
                expect(data.result[1].dli[0].deductions[1].deductions_accountid.account).to.eql("IB");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("Order with Deliveries as Child and with fk fields update case", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var orderUpdates = [
                    {$collection:"orderss", $insert:[
                        { order_no:"123",
                            deliveries:{
                                $insert:[
                                    {delivery_no:"1234", delivery_accountid:{$query:{account:"MYBANK"}}, dli:{$insert:[
                                        { dli_no:"xx1", dli_accountid:{$query:{account:"SBI"}}, deductions:[
                                            { deductions_no:"ddd1", deductions_accountid:{$query:{account:"SBP"}}},
                                            { deductions_no:"ddd2", deductions_accountid:{$query:{account:"IB"}}}
                                        ]
                                        }
                                    ]}}
                                ]}}
                    ]
                    }
                ];

                return db.update(orderUpdates);
            }).then(
            function () {
                return db.query({$collection:"orderss"});
            }).then(
            function (data) {
                var orderUpdates = [
                    {$collection:"orderss", $update:[
                        {_id:data.result[0]._id, $set:{ order_no:"1234546",
                            deliveries:{
                                $update:[
                                    {$query:{_id:data.result[0].deliveries[0]._id}, $set:{delivery_no:"12346894", delivery_accountid:{$query:{account:"YES BANK"}}, dli:{$update:[
                                        {$query:{_id:data.result[0].deliveries[0].dli[0]._id}, $set:{ dli_no:"XXXxx1", dli_accountid:{$query:{account:"DENA BANK"}}, deductions:{$update:[
                                            {$query:{_id:data.result[0].deliveries[0].dli[0].deductions[0]._id}, $set:{ deductions_no:"ddddddd1", deductions_accountid:{$query:{account:"NO BANK"}}}}

                                        ]       }
                                        }
                                        }
                                    ]}}
                                    }
                                ]}}
                        }
                    ]
                    }
                ]
                return db.update(orderUpdates);
            }).then(
            function (data) {
                return db.query({$collection:"orderss"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].order_no).to.eql("1234546");
                expect(data.result[0].deliveries).to.have.length(1);
                expect(data.result[0].deliveries[0].delivery_no).to.eql("12346894");
                expect(data.result[0].deliveries[0].delivery_accountid.account).to.eql("YES BANK");
                expect(data.result[0].deliveries[0].dli).to.have.length(1);
                expect(data.result[0].deliveries[0].dli[0].dli_no).to.eql("XXXxx1");
                expect(data.result[0].deliveries[0].dli[0].dli_accountid.account).to.eql("DENA BANK");
                expect(data.result[0].deliveries[0].dli[0].deductions).to.have.length(2);
                expect(data.result[0].deliveries[0].dli[0].deductions[0].deductions_no).to.eql("ddddddd1");
                expect(data.result[0].deliveries[0].dli[0].deductions[0].deductions_accountid.account).to.eql("NO BANK");

            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Order with Deliveries as Child and with fk fields and upsert true", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var orderUpdates = [
                    {$collection:"myorders", $insert:[
                        { order_no:"123",
                            deliveries:{
                                $insert:[
                                    {delivery_no:"1234", delivery_accountid:{$query:{account:"MYBANK"}}, dli:{$insert:[
                                        { dli_no:"xx1", dli_accountid:{$query:{account:"SBI"}}, deductions:[
                                            { deductions_no:"ddd1", deductions_accountid:{$query:{account:"SBP"}}},
                                            { deductions_no:"ddd2", deductions_accountid:{$query:{account:"IB"}}}
                                        ]
                                        }
                                    ]}},
                                    {delivery_no:"4321", delivery_accountid:{$query:{account:"MYBANK"}}, dli:{$insert:[
                                        { dli_no:"xx2", dli_accountid:{$query:{account:"SBI"}}, deductions:[
                                            { deductions_no:"ddd3", deductions_accountid:{$query:{account:"SBP"}}},
                                            { deductions_no:"ddd4", deductions_accountid:{$query:{account:"IB"}}}
                                        ]
                                        }
                                    ]}}
                                ]}}
                    ]
                    }
                ];
                return db.update(orderUpdates);
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                var duplicateError = err.toString().indexOf("Child Saving with upsert true is not allowed for field [ orderid]") != -1;
                console.log(duplicateError);
                if (duplicateError) {
                    done();
                } else {
                    done(err);
                }
            }).fail(function (err) {
                done(err);
            })
    })

    it("Order with Deliveries as Child", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"__orders"},
                        {collection:"__deliveries"},
                        {collection:"__milestones"}       ,
                        {collection:"__employees"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"__employees"}}},
                        {field:"code", type:"string", collectionid:{$query:{collection:"__employees"}}},
                        {field:"email", type:"string", collectionid:{$query:{collection:"__employees"}}} ,
                        {field:"order_no", type:"string", collectionid:{$query:{collection:"__orders"}}},
                        {field:"order_date", type:"date", collectionid:{$query:{collection:"__orders"}}},
                        {field:"delivery_no", type:"string", collectionid:{$query:{collection:"__deliveries"}}},
                        {field:"orderid", collection:"__orders", type:"fk", set:["order_no"], displayField:"order_no", collectionid:{$query:{collection:"__deliveries"}}},
                        {field:"delivery_date", type:"date", collectionid:{$query:{collection:"__deliveries"}}},
                        {field:"delivery_owner", type:"fk", "collection":"__employees", displayField:"name", set:["name", "email"], collectionid:{$query:{collection:"__deliveries"}}},
                        {field:"code", type:"string", collectionid:{$query:{collection:"__deliveries"}}, "parentfieldid":{$query:{"field":"delivery_owner", collectionid:{$query:{"collection":"__deliveries"}}}}},
                        {field:"deliveries", type:"object", multiple:true, collectionid:{$query:{collection:"__orders"}}, query:JSON.stringify({$type:"child", $query:{$collection:"__deliveries"}, $fk:"orderid"})}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                console.log("field and collection is saved");
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__employees", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (employeefields) {
                expect(employeefields.result).to.have.length(3);
                expect(employeefields.result[0].field).to.eql("name");
                expect(employeefields.result[1].field).to.eql("code");
                expect(employeefields.result[2].field).to.eql("email");
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__deliveries", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (deliveryfields) {
                expect(deliveryfields.result).to.have.length(4);
                expect(deliveryfields.result[0].field).to.eql("delivery_no");
                expect(deliveryfields.result[1].field).to.eql("orderid");
                expect(deliveryfields.result[2].field).to.eql("delivery_date");
                expect(deliveryfields.result[3].field).to.eql("delivery_owner");
                expect(deliveryfields.result[3].fields).to.have.length(1);
                expect(deliveryfields.result[3].fields[0].field).to.eql("code");
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__orders", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (orderfields) {
                expect(orderfields.result).to.have.length(3);
                expect(orderfields.result[0].field).to.eql("order_no");
                expect(orderfields.result[1].field).to.eql("order_date");
                expect(orderfields.result[2].field).to.eql("deliveries");
                expect(orderfields.result[2].fields).to.have.length(4);
                expect(orderfields.result[2].fields[0].field).to.eql("delivery_no");
                expect(orderfields.result[2].fields[1].field).to.eql("orderid");
                expect(orderfields.result[2].fields[2].field).to.eql("delivery_date");
                expect(orderfields.result[2].fields[3].field).to.eql("delivery_owner");
                expect(orderfields.result[2].fields[3].fields).to.have.length(1);
                expect(orderfields.result[2].fields[3].fields[0].field).to.eql("code");

            }).then(
            function () {
                var update = {$collection:"pl.fields", $insert:[
                    {field:"delivery_comments", type:"object", multiple:true, collectionid:{$query:{collection:"__deliveries"}}},
                    {field:"comment", type:"string", collectionid:{$query:{collection:"__deliveries"}}, parentfieldid:{$query:{"field":"delivery_comments", collectionid:{$query:{"collection":"__deliveries"}}}}},
                    {field:"commentdate", type:"date", collectionid:{$query:{collection:"__deliveries"}}, parentfieldid:{$query:{"field":"delivery_comments", collectionid:{$query:{"collection":"__deliveries"}}}}},
                    {field:"amount", type:"currency", collectionid:{$query:{collection:"__deliveries"}}, parentfieldid:{$query:{"field":"delivery_comments", collectionid:{$query:{"collection":"__deliveries"}}}}},
                    {field:"deliveryefforts", type:"duration", collectionid:{$query:{collection:"__deliveries"}}}
                ]}
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__deliveries", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (deliveryfields) {
                expect(deliveryfields.result).to.have.length(6);
                expect(deliveryfields.result[0].field).to.eql("delivery_no");
                expect(deliveryfields.result[1].field).to.eql("orderid");
                expect(deliveryfields.result[2].field).to.eql("delivery_date");
                expect(deliveryfields.result[3].field).to.eql("delivery_owner");
                expect(deliveryfields.result[3].fields).to.have.length(1);
                expect(deliveryfields.result[3].fields[0].field).to.eql("code");
                expect(deliveryfields.result[4].field).to.eql("delivery_comments");
                expect(deliveryfields.result[4].fields).to.have.length(3);
                expect(deliveryfields.result[4].fields[0].field).to.eql("comment");
                expect(deliveryfields.result[4].fields[1].field).to.eql("commentdate");
                expect(deliveryfields.result[4].fields[2].field).to.eql("amount");
                expect(deliveryfields.result[4].fields[2].fields).to.have.length(2);
                expect(deliveryfields.result[4].fields[2].fields[0].field).to.eql("amount");
                expect(deliveryfields.result[4].fields[2].fields[1].field).to.eql("type");
                expect(deliveryfields.result[5].field).to.eql("deliveryefforts");
                expect(deliveryfields.result[5].fields).to.have.length(3);
                expect(deliveryfields.result[5].fields[0].field).to.eql("time");
                expect(deliveryfields.result[5].fields[1].field).to.eql("unit");
                expect(deliveryfields.result[5].fields[2].field).to.eql("convertedvalue");
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__orders", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (orderfields) {
                expect(orderfields.result).to.have.length(3);
                expect(orderfields.result[0].field).to.eql("order_no");
                expect(orderfields.result[1].field).to.eql("order_date");
                expect(orderfields.result[2].field).to.eql("deliveries");
                expect(orderfields.result[2].fields).to.have.length(4);
                expect(orderfields.result[2].fields[0].field).to.eql("delivery_no");
                expect(orderfields.result[2].fields[1].field).to.eql("orderid");
                expect(orderfields.result[2].fields[2].field).to.eql("delivery_date");
                expect(orderfields.result[2].fields[3].field).to.eql("delivery_owner");
                expect(orderfields.result[2].fields[3].fields).to.have.length(1);
                expect(orderfields.result[2].fields[3].fields[0].field).to.eql("code");
            }).then(
            function () {
                return db.invokeFunction("Fields.synchChild", [
                    {"collection":"__orders"}
                ]);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__orders", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (orderfields) {
                expect(orderfields.result).to.have.length(3);
                expect(orderfields.result[0].field).to.eql("order_no");
                expect(orderfields.result[1].field).to.eql("order_date");
                expect(orderfields.result[2].field).to.eql("deliveries");
                expect(orderfields.result[2].fields).to.have.length(6);
                expect(orderfields.result[2].fields[0].field).to.eql("delivery_no");
                expect(orderfields.result[2].fields[1].field).to.eql("orderid");
                expect(orderfields.result[2].fields[2].field).to.eql("delivery_date");
                expect(orderfields.result[2].fields[3].field).to.eql("delivery_owner");
                expect(orderfields.result[2].fields[3].fields).to.have.length(1);
                expect(orderfields.result[2].fields[3].fields[0].field).to.eql("code");
                expect(orderfields.result[2].fields[4].field).to.eql("delivery_comments");
                expect(orderfields.result[2].fields[4].fields).to.have.length(3);
                expect(orderfields.result[2].fields[4].fields[0].field).to.eql("comment");
                expect(orderfields.result[2].fields[4].fields[1].field).to.eql("commentdate");
                expect(orderfields.result[2].fields[4].fields[2].field).to.eql("amount");
                expect(orderfields.result[2].fields[4].fields[2].fields).to.have.length(2);
                expect(orderfields.result[2].fields[4].fields[2].fields[0].field).to.eql("amount");
                expect(orderfields.result[2].fields[4].fields[2].fields[1].field).to.eql("type");
                expect(orderfields.result[2].fields[5].field).to.eql("deliveryefforts");
                expect(orderfields.result[2].fields[5].fields).to.have.length(3);
                expect(orderfields.result[2].fields[5].fields[0].field).to.eql("time");
                expect(orderfields.result[2].fields[5].fields[1].field).to.eql("unit");
                expect(orderfields.result[2].fields[5].fields[2].field).to.eql("convertedvalue");
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__deliveries", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (deliveryfields) {
                var deliveryCommentsField = deliveryfields.result[4].fields;
                var update = {$collection:"pl.fields", $insert:[
                    {field:"email", type:"string", collectionid:{$query:{collection:"__deliveries"}}, parentfieldid:{$query:{"field":"delivery_owner", collectionid:{$query:{"collection":"__deliveries"}}}}}
                ], $delete:[
                    {_id:deliveryCommentsField[0]._id}
                ]};
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__deliveries", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (deliveryfields) {
                expect(deliveryfields.result).to.have.length(6);
                expect(deliveryfields.result[0].field).to.eql("delivery_no");
                expect(deliveryfields.result[1].field).to.eql("orderid");
                expect(deliveryfields.result[2].field).to.eql("delivery_date");
                expect(deliveryfields.result[3].field).to.eql("delivery_owner");
                expect(deliveryfields.result[3].fields).to.have.length(2);
                expect(deliveryfields.result[3].fields[0].field).to.eql("code");
                expect(deliveryfields.result[3].fields[1].field).to.eql("email");
                expect(deliveryfields.result[4].field).to.eql("delivery_comments");
                expect(deliveryfields.result[4].fields).to.have.length(2);

                expect(deliveryfields.result[4].fields[0].field).to.eql("commentdate");
                expect(deliveryfields.result[4].fields[1].field).to.eql("amount");
                expect(deliveryfields.result[4].fields[1].fields).to.have.length(2);
                expect(deliveryfields.result[4].fields[1].fields[0].field).to.eql("amount");
                expect(deliveryfields.result[4].fields[1].fields[1].field).to.eql("type");

                expect(deliveryfields.result[5].field).to.eql("deliveryefforts");
                expect(deliveryfields.result[5].fields).to.have.length(3);
                expect(deliveryfields.result[5].fields[0].field).to.eql("time");
                expect(deliveryfields.result[5].fields[1].field).to.eql("unit");
                expect(deliveryfields.result[5].fields[2].field).to.eql("convertedvalue");
            }).then(
            function () {
//                console.log("calling sync.....................................................................................");
                return db.invokeFunction("Fields.synchChild", [
                    {"collection":"__orders"}
                ]);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__orders", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (orderfields) {
//                console.log("order fields after second synch>>>" + JSON.stringify(orderfields));
                expect(orderfields.result).to.have.length(3);
                expect(orderfields.result[0].field).to.eql("order_no");
                expect(orderfields.result[1].field).to.eql("order_date");
                expect(orderfields.result[2].field).to.eql("deliveries");
                expect(orderfields.result[2].fields).to.have.length(6);
                expect(orderfields.result[2].fields[0].field).to.eql("delivery_no");
                expect(orderfields.result[2].fields[1].field).to.eql("orderid");
                expect(orderfields.result[2].fields[2].field).to.eql("delivery_date");
                expect(orderfields.result[2].fields[3].field).to.eql("delivery_owner");
                expect(orderfields.result[2].fields[3].fields).to.have.length(2);
                expect(orderfields.result[2].fields[3].fields[0].field).to.eql("code");
                expect(orderfields.result[2].fields[4].field).to.eql("delivery_comments");
                expect(orderfields.result[2].fields[4].fields).to.have.length(2);
                expect(orderfields.result[2].fields[4].fields[0].field).to.eql("commentdate");
                expect(orderfields.result[2].fields[4].fields[1].field).to.eql("amount");
                expect(orderfields.result[2].fields[4].fields[1].fields).to.have.length(2);
                expect(orderfields.result[2].fields[4].fields[1].fields[0].field).to.eql("amount");
                expect(orderfields.result[2].fields[4].fields[1].fields[1].field).to.eql("type");
                expect(orderfields.result[2].fields[5].field).to.eql("deliveryefforts");
                expect(orderfields.result[2].fields[5].fields).to.have.length(3);
                expect(orderfields.result[2].fields[5].fields[0].field).to.eql("time");
                expect(orderfields.result[2].fields[5].fields[1].field).to.eql("unit");
                expect(orderfields.result[2].fields[5].fields[2].field).to.eql("convertedvalue");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    })
    it("Order with Deliveries as Child and Deliveries with milestones as child", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"__orders"},
                        {collection:"__deliveries"},
                        {collection:"__milestones"},
                        {collection:"__employees"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"__employees"}}},
                        {field:"code", type:"string", collectionid:{$query:{collection:"__employees"}}},
                        {field:"email", type:"string", collectionid:{$query:{collection:"__employees"}}} ,
                        {field:"order_no", type:"string", collectionid:{$query:{collection:"__orders"}}},
                        {field:"order_date", type:"date", collectionid:{$query:{collection:"__orders"}}},
                        {field:"delivery_no", type:"string", collectionid:{$query:{collection:"__deliveries"}}},
                        {field:"orderid", collection:"__orders", type:"fk", set:["order_no"], displayField:"order_no", collectionid:{$query:{collection:"__deliveries"}}},
                        {field:"delivery_date", type:"date", collectionid:{$query:{collection:"__deliveries"}}},
                        {field:"delivery_owner", type:"fk", "collection":"__employees", displayField:"name", set:["name", "email"], collectionid:{$query:{collection:"__deliveries"}}},
                        {field:"code", type:"string", collectionid:{$query:{collection:"__deliveries"}}, "parentfieldid":{$query:{"field":"delivery_owner", collectionid:{$query:{"collection":"__deliveries"}}}}},
                        {field:"deliveries", type:"object", multiple:true, collectionid:{$query:{collection:"__orders"}}, query:JSON.stringify({$type:"child", $query:{$collection:"__deliveries"}, $fk:"orderid"})},
                        {"field":"mstatus", "type":"string", "collectionid":{"$query":{collection:"__milestones"}}} ,
                        {"field":"mdate", "type":"string", "collectionid":{"$query":{collection:"__milestones"}}},
                        {"field":"deliveryid", "type":"fk", collection:"__deliveries", displayField:"delivery_no", "collectionid":{"$query":{collection:"__milestones"}}},
                        {"field":"milestones", "type":"object", "multiple":true, "collectionid":{"$query":{collection:"__deliveries"}}, "query":JSON.stringify({"$type":"child", $query:{"$collection":"__milestones"}, "$fk":"deliveryid"})}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__employees", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (employeefields) {
                expect(employeefields.result).to.have.length(3);
                expect(employeefields.result[0].field).to.eql("name");
                expect(employeefields.result[1].field).to.eql("code");
                expect(employeefields.result[2].field).to.eql("email");
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__milestones", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (milestonesfields) {
                expect(milestonesfields.result).to.have.length(3);
                expect(milestonesfields.result[0].field).to.eql("mstatus");
                expect(milestonesfields.result[1].field).to.eql("mdate");
                expect(milestonesfields.result[2].field).to.eql("deliveryid");
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__deliveries", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (deliveryfields) {
                expect(deliveryfields.result).to.have.length(5);
                expect(deliveryfields.result[0].field).to.eql("delivery_no");
                expect(deliveryfields.result[1].field).to.eql("orderid");
                expect(deliveryfields.result[2].field).to.eql("delivery_date");
                expect(deliveryfields.result[3].field).to.eql("delivery_owner");
                expect(deliveryfields.result[3].fields).to.have.length(1);
                expect(deliveryfields.result[3].fields[0].field).to.eql("code");
                expect(deliveryfields.result[4].field).to.eql("milestones");
                expect(deliveryfields.result[4].fields).to.have.length(3);
                expect(deliveryfields.result[4].fields[0].field).to.eql("mstatus");
                expect(deliveryfields.result[4].fields[1].field).to.eql("mdate");
                expect(deliveryfields.result[4].fields[2].field).to.eql("deliveryid");
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__orders", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (orderfields) {
                expect(orderfields.result).to.have.length(3);
                expect(orderfields.result[0].field).to.eql("order_no");
                expect(orderfields.result[1].field).to.eql("order_date");
                expect(orderfields.result[2].field).to.eql("deliveries");
                expect(orderfields.result[2].fields).to.have.length(4);
                expect(orderfields.result[2].fields[0].field).to.eql("delivery_no");
                expect(orderfields.result[2].fields[1].field).to.eql("orderid");
                expect(orderfields.result[2].fields[2].field).to.eql("delivery_date");
                expect(orderfields.result[2].fields[3].field).to.eql("delivery_owner");
                expect(orderfields.result[2].fields[3].fields).to.have.length(1);
                expect(orderfields.result[2].fields[3].fields[0].field).to.eql("code");
            }).then(
            function () {
                return db.invokeFunction("Fields.synchChild", [
                    {"collection":"__orders"}
                ]);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__orders", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (orderfields) {
//                console.log("2222order fields>>>>" + JSON.stringify(orderfields))
                expect(orderfields.result).to.have.length(3);
                expect(orderfields.result[0].field).to.eql("order_no");
                expect(orderfields.result[1].field).to.eql("order_date");
                expect(orderfields.result[2].field).to.eql("deliveries");
                expect(orderfields.result[2].fields).to.have.length(5);
                expect(orderfields.result[2].fields[0].field).to.eql("delivery_no");
                expect(orderfields.result[2].fields[1].field).to.eql("orderid");
                expect(orderfields.result[2].fields[2].field).to.eql("delivery_date");
                expect(orderfields.result[2].fields[3].field).to.eql("delivery_owner");
                expect(orderfields.result[2].fields[3].fields).to.have.length(1);
                expect(orderfields.result[2].fields[3].fields[0].field).to.eql("code");
                expect(orderfields.result[2].fields[4].field).to.eql("milestones");
                expect(orderfields.result[2].fields[4].fields).to.have.length(3);
                expect(orderfields.result[2].fields[4].fields[0].field).to.eql("mstatus");
                expect(orderfields.result[2].fields[4].fields[1].field).to.eql("mdate");
                expect(orderfields.result[2].fields[4].fields[2].field).to.eql("deliveryid");
            }).then(
            function () {
                var update = {$collection:"pl.fields", $insert:[
                    {field:"milestone_comments", type:"object", multiple:true, collectionid:{$query:{collection:"__milestones"}}},
                    {field:"comment", type:"string", collectionid:{$query:{collection:"__milestones"}}, parentfieldid:{$query:{"field":"milestone_comments", collectionid:{$query:{"collection":"__milestones"}}}}},
                    {field:"commentdate", type:"date", collectionid:{$query:{collection:"__milestones"}}, parentfieldid:{$query:{"field":"milestone_comments", collectionid:{$query:{"collection":"__milestones"}}}}},
                    {field:"amount", type:"currency", collectionid:{$query:{collection:"__milestones"}}, parentfieldid:{$query:{"field":"milestone_comments", collectionid:{$query:{"collection":"__milestones"}}}}}
                ]}
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__milestones", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (milestonesfields) {
//                console.log("milestonesfields>>>" + JSON.stringify(milestonesfields));
                expect(milestonesfields.result).to.have.length(4);
                expect(milestonesfields.result[0].field).to.eql("mstatus");
                expect(milestonesfields.result[1].field).to.eql("mdate");
                expect(milestonesfields.result[2].field).to.eql("deliveryid");
                expect(milestonesfields.result[3].field).to.eql("milestone_comments");
                expect(milestonesfields.result[3].fields).to.have.length(3);
                expect(milestonesfields.result[3].fields[0].field).to.eql("comment");
                expect(milestonesfields.result[3].fields[1].field).to.eql("commentdate");
                expect(milestonesfields.result[3].fields[2].field).to.eql("amount");
                expect(milestonesfields.result[3].fields[2].fields).to.have.length(2);
                expect(milestonesfields.result[3].fields[2].fields[0].field).to.eql("amount");
                expect(milestonesfields.result[3].fields[2].fields[1].field).to.eql("type");
            }).then(
            function () {
                return db.invokeFunction("Fields.synchChild", [
                    {"collection":"__deliveries"}
                ]);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__deliveries", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (deliveryfields) {
//                console.log("deliveryfields>>>" + JSON.stringify(deliveryfields));
                expect(deliveryfields.result).to.have.length(5);
                expect(deliveryfields.result[0].field).to.eql("delivery_no");
                expect(deliveryfields.result[1].field).to.eql("orderid");
                expect(deliveryfields.result[2].field).to.eql("delivery_date");
                expect(deliveryfields.result[3].field).to.eql("delivery_owner");
                expect(deliveryfields.result[3].fields).to.have.length(1);
                expect(deliveryfields.result[3].fields[0].field).to.eql("code");
                expect(deliveryfields.result[4].field).to.eql("milestones");
                expect(deliveryfields.result[4].fields).to.have.length(4);
                expect(deliveryfields.result[4].fields[0].field).to.eql("mstatus");
                expect(deliveryfields.result[4].fields[1].field).to.eql("mdate");
                expect(deliveryfields.result[4].fields[2].field).to.eql("deliveryid");
                expect(deliveryfields.result[4].fields[3].field).to.eql("milestone_comments");
                expect(deliveryfields.result[4].fields[3].fields).to.have.length(3);
                expect(deliveryfields.result[4].fields[3].fields[0].field).to.eql("comment");
                expect(deliveryfields.result[4].fields[3].fields[1].field).to.eql("commentdate");
                expect(deliveryfields.result[4].fields[3].fields[2].field).to.eql("amount");
                expect(deliveryfields.result[4].fields[3].fields[2].fields).to.have.length(2);
                expect(deliveryfields.result[4].fields[3].fields[2].fields[0].field).to.eql("amount");
                expect(deliveryfields.result[4].fields[3].fields[2].fields[1].field).to.eql("type");
            }).then(
            function () {
                return db.invokeFunction("Fields.synchChild", [
                    {"collection":"__orders"}
                ]);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__orders", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (orderfields) {
//                console.log("orderfields>>>" + JSON.stringify(orderfields));
                expect(orderfields.result).to.have.length(3);
                expect(orderfields.result[0].field).to.eql("order_no");
                expect(orderfields.result[1].field).to.eql("order_date");
                expect(orderfields.result[2].field).to.eql("deliveries");
                expect(orderfields.result[2].fields).to.have.length(5);
                expect(orderfields.result[2].fields[0].field).to.eql("delivery_no");
                expect(orderfields.result[2].fields[1].field).to.eql("orderid");
                expect(orderfields.result[2].fields[2].field).to.eql("delivery_date");
                expect(orderfields.result[2].fields[3].field).to.eql("delivery_owner");
                expect(orderfields.result[2].fields[3].fields).to.have.length(1);
                expect(orderfields.result[2].fields[3].fields[0].field).to.eql("code");
                expect(orderfields.result[2].fields[4].field).to.eql("milestones");
                expect(orderfields.result[2].fields[4].fields).to.have.length(4);
                expect(orderfields.result[2].fields[4].fields[0].field).to.eql("mstatus");
                expect(orderfields.result[2].fields[4].fields[1].field).to.eql("mdate");
                expect(orderfields.result[2].fields[4].fields[2].field).to.eql("deliveryid");
                expect(orderfields.result[2].fields[4].fields[3].field).to.eql("milestone_comments");
                expect(orderfields.result[2].fields[4].fields[3].fields).to.have.length(3);
                expect(orderfields.result[2].fields[4].fields[3].fields[0].field).to.eql("comment");
                expect(orderfields.result[2].fields[4].fields[3].fields[1].field).to.eql("commentdate");
                expect(orderfields.result[2].fields[4].fields[3].fields[2].field).to.eql("amount");
                expect(orderfields.result[2].fields[4].fields[3].fields[2].fields).to.have.length(2);
                expect(orderfields.result[2].fields[4].fields[3].fields[2].fields[0].field).to.eql("amount");
                expect(orderfields.result[2].fields[4].fields[3].fields[2].fields[1].field).to.eql("type");
                expect(orderfields.result[2].fields[4].fields[3].fields[2].fields).to.have.length(2);

            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__milestones", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (milestonefields) {
                var milestoneCommentsField = milestonefields.result[3].fields;
                var update = {$collection:"pl.fields", $delete:[
                    {_id:milestoneCommentsField[0]._id}
                ]};

                return db.update(update);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__milestones", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (milestonesfields) {
//                console.log("milestonefields>>" + JSON.stringify(milestonesfields));
                expect(milestonesfields.result).to.have.length(4);
                expect(milestonesfields.result[0].field).to.eql("mstatus");
                expect(milestonesfields.result[1].field).to.eql("mdate");
                expect(milestonesfields.result[2].field).to.eql("deliveryid");
                expect(milestonesfields.result[3].field).to.eql("milestone_comments");
                expect(milestonesfields.result[3].fields).to.have.length(2);
                expect(milestonesfields.result[3].fields[0].field).to.eql("commentdate");
                expect(milestonesfields.result[3].fields[1].field).to.eql("amount");
                expect(milestonesfields.result[3].fields[1].fields).to.have.length(2);
                expect(milestonesfields.result[3].fields[1].fields[0].field).to.eql("amount");
                expect(milestonesfields.result[3].fields[1].fields[1].field).to.eql("type");
            }).then(
            function () {
                return db.invokeFunction("Fields.synchChild", [
                    {"collection":"__deliveries"}
                ]);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__deliveries", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (deliveryfields) {
//                console.log("deliveryfields>>>" + JSON.stringify(deliveryfields));
                expect(deliveryfields.result).to.have.length(5);
                expect(deliveryfields.result[0].field).to.eql("delivery_no");
                expect(deliveryfields.result[1].field).to.eql("orderid");
                expect(deliveryfields.result[2].field).to.eql("delivery_date");
                expect(deliveryfields.result[3].field).to.eql("delivery_owner");
                expect(deliveryfields.result[3].fields).to.have.length(1);
                expect(deliveryfields.result[3].fields[0].field).to.eql("code");
                expect(deliveryfields.result[4].field).to.eql("milestones");
                expect(deliveryfields.result[4].fields).to.have.length(4);
                expect(deliveryfields.result[4].fields[0].field).to.eql("mstatus");
                expect(deliveryfields.result[4].fields[1].field).to.eql("mdate");
                expect(deliveryfields.result[4].fields[2].field).to.eql("deliveryid");
                expect(deliveryfields.result[4].fields[3].field).to.eql("milestone_comments");
                expect(deliveryfields.result[4].fields[3].fields).to.have.length(2);
                expect(deliveryfields.result[4].fields[3].fields[0].field).to.eql("commentdate");
                expect(deliveryfields.result[4].fields[3].fields[1].field).to.eql("amount");
                expect(deliveryfields.result[4].fields[3].fields[1].fields).to.have.length(2);
                expect(deliveryfields.result[4].fields[3].fields[1].fields[0].field).to.eql("amount");
                expect(deliveryfields.result[4].fields[3].fields[1].fields[1].field).to.eql("type");
            }).then(
            function () {
                return db.invokeFunction("Fields.synchChild", [
                    {"collection":"__orders"}
                ]);
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"__orders", "parentfieldid":null}, $recursion:{"parentfieldid":"_id", "$alias":"fields"}});
            }).then(
            function (orderfields) {
//                console.log("order fields after second synch>>>" + JSON.stringify(orderfields));
                expect(orderfields.result).to.have.length(3);
                expect(orderfields.result[0].field).to.eql("order_no");
                expect(orderfields.result[1].field).to.eql("order_date");
                expect(orderfields.result[2].field).to.eql("deliveries");
                expect(orderfields.result[2].fields).to.have.length(5);
                expect(orderfields.result[2].fields[0].field).to.eql("delivery_no");
                expect(orderfields.result[2].fields[1].field).to.eql("orderid");
                expect(orderfields.result[2].fields[2].field).to.eql("delivery_date");
                expect(orderfields.result[2].fields[3].field).to.eql("delivery_owner");
                expect(orderfields.result[2].fields[3].fields).to.have.length(1);
                expect(orderfields.result[2].fields[3].fields[0].field).to.eql("code");
                expect(orderfields.result[2].fields[4].field).to.eql("milestones");
                expect(orderfields.result[2].fields[4].fields).to.have.length(4);
                expect(orderfields.result[2].fields[4].fields[0].field).to.eql("mstatus");
                expect(orderfields.result[2].fields[4].fields[1].field).to.eql("mdate");
                expect(orderfields.result[2].fields[4].fields[2].field).to.eql("deliveryid");
                expect(orderfields.result[2].fields[4].fields[3].field).to.eql("milestone_comments");
                expect(orderfields.result[2].fields[4].fields[3].fields).to.have.length(2);
                expect(orderfields.result[2].fields[4].fields[3].fields[0].field).to.eql("commentdate");
                expect(orderfields.result[2].fields[4].fields[3].fields[1].field).to.eql("amount");
                expect(orderfields.result[2].fields[4].fields[3].fields[1].fields).to.have.length(2);
                expect(orderfields.result[2].fields[4].fields[3].fields[1].fields[0].field).to.eql("amount");
                expect(orderfields.result[2].fields[4].fields[3].fields[1].fields[1].field).to.eql("type");
                expect(orderfields.result[2].fields[4].fields[3].fields[1].fields).to.have.length(2);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    })
})
