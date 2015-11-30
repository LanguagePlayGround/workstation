/**
 *
 *  mocha --recursive --timeout 150000 -g SubQuerytestcase --reporter spec
 *  mocha --recursive --timeout 150000 -g "Subquery on array of fk with related column defined in query to get data" --reporter spec
 *
 *

 --------- Sachin 29-09-2014----------
 Sort on sub query - we will fetch first sub query result and then fetch main result
 $collection :"entities"
 $fields :{
 name : 1,
 total_invoice_value : {
 "$query":{
 "$collection":"invoices",
 "$group":{
 "_id":null,"invoice_amount_base_currency" :{"$sum":"$invoice_amount_base_currency"}}
 },
 "$fk":"entity_id",
 "$type":{"scalar":"invoice_amount_base_currency"},
 "$sort":{"invoice_amount_base_currency":-1}}    ----------------------------- Define sort here
 }

 Now enties will come as desc on the basis of total_invoice_value
 ---------


 *

 *
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require("./NorthwindDb.js");
var OPTIONS = {};
var Testcases = require("./TestCases.js");
describe("SubQuerytestcase", function () {
    describe("Employee Tasks Relation", function () {

        var collectionsToRegister = [
            {collection:"entities", historyEnabled:true, fields:[
                {field:"name", type:"string"}
            ]},
            {collection:"invoices", fields:[
                {field:"invoice_amount_base_currency", type:"currency"},
                {field:"entity_id", type:"fk", collectionid:{$query:{collection:"invoices"}}, collection:"entities", set:["name"]}
            ]},
            {collection:"orders", fields:[
                {field:"order_amount", type:"currency"},
                {field:"entity_id", type:"fk", collectionid:{$query:{collection:"orders"}}, collection:"entities", set:["name"]}
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
            ApplaneDB.removeCollections(["entities", "orders", "invoices"]);
            done();
        });

        afterEach(function (done) {
            Testcases.afterEach(done);
        })
        beforeEach(function (done) {
            Testcases.beforeEach(done);
        })

        // business function and total taskhrs

        it("sort on SubQuery defined but subquery sorted field part of set field", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                }).then(
                function () {
                    return db.update([
                        {$collection:"pl.collections", $insert:[
                            {collection:"entities__"},
                            {collection:"businessunits__"},
                            {collection:"invoices__"}
                        ]},
                        {$collection:"pl.fields", $insert:[
                            {field:"name", collectionid:{$query:{collection:"entities__"}}, type:"string"},
                            {field:"code", collectionid:{$query:{collection:"entities__"}}, type:"string"},
                            {field:"name", collectionid:{$query:{collection:"businessunits__"}}, type:"string"},
                            {field:"code", collectionid:{$query:{collection:"businessunits__"}}, type:"string"},
                            {field:"name", collectionid:{$query:{collection:"invoices__"}}, type:"string"},
                            {field:"entityid", collectionid:{$query:{collection:"invoices__"}}, type:"fk", collection:"entities__", set:["name"]},
                            {field:"businessunitid", collectionid:{$query:{collection:"invoices__"}}, type:"fk", collection:"businessunits__", set:["name"]}
//                            {field:"userid", collectionid:{$query:{collection:"invoices__"}}, type:"fk", collection:"pl.users", set:["username"]}
                        ]}
                    ]);
                }).then(
                function () {
                    return db.update([
                        {$collection:"entities__", $insert:[
                            {name:"E1", code:"E1"},
                            {name:"E2", code:"E2"},
                            {name:"E3", code:"E3"}
                        ]},
                        {$collection:"businessunits__", $insert:[
                            {name:"B1", code:"B1"},
                            {name:"B2", code:"B2"},
                            {name:"B3", code:"B3"}
                        ]},
                        {$collection:"invoices__", $insert:[
                            {name:"V1", entityid:{$query:{name:"E3"}}, businessunitid:{$query:{name:"B2"}}},
                            {name:"V2", entityid:{$query:{name:"E2"}}, businessunitid:{$query:{name:"B3"}}},
                            {name:"V3", entityid:{$query:{name:"E2"}}, businessunitid:{$query:{name:"B1"}}},
                            {name:"V4", entityid:{$query:{name:"E1"}}, businessunitid:{$query:{name:"B3"}}},
                            {name:"V5", entityid:{$query:{name:"E1"}}, businessunitid:{$query:{name:"B1"}}},
                            {name:"V6", entityid:{$query:{name:"E3"}}, businessunitid:{$query:{name:"B2"}}}
                        ]}
                    ]);
                }).then(
                function () {
                    return db.query({
                        $collection:"invoices__",
                        $fields:{name:1, "entityid.name":1, "entityid._id":1, "entityid.code":1, "businessunitid.name":1, "businessunitid.code":1, "userid.username":1},
                        $sort:{"entityid.name":1, "businessunitid.name":1}
                    });
                }).then(
                function (result) {
                    expect(result.result).to.have.length(6);
                    expect(result.result[0].name).to.eql("V5");
                    expect(result.result[1].name).to.eql("V4");
                    expect(result.result[2].name).to.eql("V3");
                    expect(result.result[3].name).to.eql("V2");
                    expect(result.result[4].name).to.eql("V1");
                    expect(result.result[5].name).to.eql("V6");

                }).then(
                function () {
                    return db.query({
                        $collection:"invoices__",
                        $fields:{name:1, "entityid.name":1, "entityid._id":1, "entityid.code":1, "businessunitid.name":1, "businessunitid.code":1, "userid.username":1},
                        $sort:{"entityid.name":1}
                    });
                }).then(
                function (result) {
                    expect(result.result).to.have.length(6);
                    expect(result.result[0].name).to.eql("V4");
                    expect(result.result[1].name).to.eql("V5");
                    expect(result.result[2].name).to.eql("V2");
                    expect(result.result[3].name).to.eql("V3");
                    expect(result.result[4].name).to.eql("V1");
                    expect(result.result[5].name).to.eql("V6");

                }).then(
                function () {
                    return db.query({
                        $collection:"invoices__",
                        $fields:{name:1, "entityid.name":1, "entityid._id":1, "entityid.code":1, "businessunitid.name":1, "businessunitid.code":1, "userid.username":1}
                    });
                }).then(
                function (result) {
                    expect(result.result).to.have.length(6);
                    expect(result.result[0].name).to.eql("V1");
                    expect(result.result[1].name).to.eql("V2");
                    expect(result.result[2].name).to.eql("V3");
                    expect(result.result[3].name).to.eql("V4");
                    expect(result.result[4].name).to.eql("V5");
                    expect(result.result[5].name).to.eql("V6");

                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        });

        it("sort on SubQuery defined with join right", function (done) {
            var entity1id = undefined, entity2id = undefined, entity3id = undefined, entity4id = undefined, entity5id = undefined;
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var inserts = [
                        {$collection:"entities", $insert:[
                            {name:"Entity1"},
                            {name:"Entity2"},
                            {name:"Entity3"},
                            {name:"Entity4"},
                            {name:"Entity5"}
                        ]}
                    ];
                    return db.update(inserts);
                }).then(
                function () {
                    return db.query({$collection:"entities"});
                }).then(
                function (data) {
                    data = data.result;
                    entity1id = data[0]._id;
                    entity2id = data[1]._id;
                    entity3id = data[2]._id;
                    entity4id = data[3]._id;
                    entity5id = data[4]._id;
                }).then(
                function () {
                    var inserts = [
                        {$collection:"invoices", $insert:[
                            {invoice_amount_base_currency:{amount:1500, type:{type:"INR"}}, entity_id:{_id:entity3id }},
                            {invoice_amount_base_currency:{amount:1500, type:{type:"INR"}}, entity_id:{_id:entity4id }},
                            {invoice_amount_base_currency:{amount:500, type:{type:"INR"}}, entity_id:{_id:entity3id }},
                            {invoice_amount_base_currency:{amount:500, type:{type:"INR"}}, entity_id:{_id:entity3id }},
                            {invoice_amount_base_currency:{amount:1000, type:{type:"INR"}}, entity_id:{_id:entity4id }},
                            {invoice_amount_base_currency:{amount:10000, type:{type:"INR"}}, entity_id:{_id:entity1id }},
                            {invoice_amount_base_currency:{amount:50000, type:{type:"INR"}}, entity_id:{_id:entity5id }},
                            {invoice_amount_base_currency:{amount:5000, type:{type:"INR"}}, entity_id:{_id:entity2id }},
                            {invoice_amount_base_currency:{amount:20000, type:{type:"INR"}}, entity_id:{_id:entity1id }},
                            {invoice_amount_base_currency:{amount:25000, type:{type:"INR"}}}
                        ]},
                        {$collection:"orders", $insert:[
                            {order_amount:{amount:1000, type:{type:"INR"}}, entity_id:{_id:entity1id }},
                            {order_amount:{amount:2000, type:{type:"INR"}}, entity_id:{_id:entity1id }},
                            {order_amount:{amount:2000, type:{type:"INR"}}, entity_id:{_id:entity5id }},
                            {order_amount:{amount:3000, type:{type:"INR"}}, entity_id:{_id:entity2id }},
                            {order_amount:{amount:3000, type:{type:"INR"}}, entity_id:{_id:entity2id }},
                            {order_amount:{amount:3000, type:{type:"INR"}}, entity_id:{_id:entity5id }},
                            {order_amount:{amount:2000, type:{type:"INR"}}, entity_id:{_id:entity2id }},
                            {order_amount:{amount:1000, type:{type:"INR"}}, entity_id:{_id:entity3id }},
                            {order_amount:{amount:1000, type:{type:"INR"}}, entity_id:{_id:entity3id }}
                        ]}
                    ];
                    return db.update(inserts);
                }).then(
                function () {
                    return db.query({"$collection":"entities", "$sort":{"total_invoice_value.amount":-1}, "$fields":{"name":1, "total_order_value":{"$query":{"$collection":"orders", "$group":{"_id":null, "order_amount":{"$sum":"$order_amount"}}}, "$fk":"entity_id", "$type":{"scalar":"order_amount"}}, "total_invoice_value":{"$query":{"$collection":"invoices", "$group":{"_id":null, "invoice_amount_base_currency":{"$sum":"$invoice_amount_base_currency"}}}, "$fk":"entity_id", "$type":{"scalar":"invoice_amount_base_currency"}, $join:"right"}}, "$limit":2});
                }).then(
                function (data) {
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id.toString()).to.eql(entity5id.toString());
                    expect(data.result[0].total_invoice_value.amount).to.eql(50000);
                    expect(data.result[0].total_order_value.amount).to.eql(5000);
                    expect(data.result[1]._id.toString()).to.eql(entity1id.toString());
                    expect(data.result[1].total_invoice_value.amount).to.eql(30000);
                    expect(data.result[1].total_order_value.amount).to.eql(3000);
                }).then(
                function () {
                    return db.query({"$collection":"entities", "$sort":{"total_invoice_value.invoice_amount_base_currency.amount":-1}, "$fields":{"name":1, "total_order_value":{"$query":{"$collection":"orders", "$group":{"_id":null, "order_amount":{"$sum":"$order_amount"}}}, "$fk":"entity_id", "$type":{"scalar":"order_amount"}}, "total_invoice_value":{"$query":{"$collection":"invoices", "$group":{"_id":null, "invoice_amount_base_currency":{"$sum":"$invoice_amount_base_currency"}}}, "$fk":"entity_id", "$type":"scalar", $join:"right"}}, "$limit":2, "$skip":2});
                }).then(
                function (data) {
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id.toString()).to.eql(entity2id.toString());
                    expect(data.result[0].total_invoice_value.invoice_amount_base_currency.amount).to.eql(5000);
                    expect(data.result[0].total_order_value.amount).to.eql(8000);
                    expect(data.result[1]._id.toString()).to.eql(entity4id.toString());
                    expect(data.result[1].total_invoice_value.invoice_amount_base_currency.amount).to.eql(2500);
                }).then(
                function () {
                    return db.query({"$collection":"entities", "$sort":{"total_invoice_value.amount":-1}, "$fields":{"name":1, "total_order_value":{"$query":{"$collection":"orders", "$group":{"_id":null, "order_amount":{"$sum":"$order_amount"}}}, "$fk":"entity_id", "$type":{"scalar":"order_amount"}}, "total_invoice_value":{"$query":{"$collection":"invoices", "$group":{"_id":null, "invoice_amount_base_currency":{"$sum":"$invoice_amount_base_currency"}}}, "$fk":"entity_id", "$type":{"scalar":"invoice_amount_base_currency"}, $join:"right"}}, "$limit":2, "$skip":4});
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id.toString()).to.eql(entity3id.toString());
                    expect(data.result[0].total_invoice_value.amount).to.eql(2500);
                    expect(data.result[0].total_order_value.amount).to.eql(2000);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        });

        it("sort on SubQuery defined without join right", function (done) {
            var entity1id = undefined, entity2id = undefined, entity3id = undefined, entity4id = undefined, entity5id = undefined, entity6id = undefined, entity7id = undefined;
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var inserts = [
                        {$collection:"entities", $insert:[
                            {name:"Entity1"},
                            {name:"Entity2"},
                            {name:"Entity3"},
                            {name:"Entity4"},
                            {name:"Entity5"},
                            {name:"Entity6"},
                            {name:"Entity7"}
                        ]}
                    ];
                    return db.update(inserts);
                }).then(
                function () {
                    return db.query({$collection:"entities", $sort:{name:1}});
                }).then(
                function (data) {
                    data = data.result;
                    entity1id = data[0]._id;
                    entity2id = data[1]._id;
                    entity3id = data[2]._id;
                    entity4id = data[3]._id;
                    entity5id = data[4]._id;
                    entity6id = data[5]._id;
                    entity7id = data[6]._id;
                }).then(
                function () {
                    var inserts = [
                        {$collection:"invoices", $insert:[
                            {invoice_amount_base_currency:{amount:1500, type:{type:"INR"}}, entity_id:{_id:entity3id }},
                            {invoice_amount_base_currency:{amount:1500, type:{type:"INR"}}, entity_id:{_id:entity4id }},
                            {invoice_amount_base_currency:{amount:500, type:{type:"INR"}}, entity_id:{_id:entity3id }},
                            {invoice_amount_base_currency:{amount:500, type:{type:"INR"}}, entity_id:{_id:entity3id }},
                            {invoice_amount_base_currency:{amount:1000, type:{type:"INR"}}, entity_id:{_id:entity4id }},
                            {invoice_amount_base_currency:{amount:10000, type:{type:"INR"}}, entity_id:{_id:entity1id }},
                            {invoice_amount_base_currency:{amount:50000, type:{type:"INR"}}, entity_id:{_id:entity5id }},
                            {invoice_amount_base_currency:{amount:5000, type:{type:"INR"}}, entity_id:{_id:entity2id }},
                            {invoice_amount_base_currency:{amount:20000, type:{type:"INR"}}, entity_id:{_id:entity1id }},
                            {invoice_amount_base_currency:{amount:25000, type:{type:"INR"}}, entity_id:{_id:entity7id}}
                        ]},
                        {$collection:"orders", $insert:[
                            {order_amount:{amount:1000, type:{type:"INR"}}, entity_id:{_id:entity1id }},
                            {order_amount:{amount:2000, type:{type:"INR"}}, entity_id:{_id:entity1id }},
                            {order_amount:{amount:2000, type:{type:"INR"}}, entity_id:{_id:entity5id }},
                            {order_amount:{amount:3000, type:{type:"INR"}}, entity_id:{_id:entity2id }},
                            {order_amount:{amount:3000, type:{type:"INR"}}, entity_id:{_id:entity2id }},
                            {order_amount:{amount:3000, type:{type:"INR"}}, entity_id:{_id:entity5id }},
                            {order_amount:{amount:2000, type:{type:"INR"}}, entity_id:{_id:entity2id }},
                            {order_amount:{amount:1000, type:{type:"INR"}}, entity_id:{_id:entity3id }},
                            {order_amount:{amount:1000, type:{type:"INR"}}, entity_id:{_id:entity3id }}
                        ]}
                    ];
                    return db.update(inserts);
                }).then(
                function () {
                    return db.query({"$collection":"entities", "$sort":{name:1, "total_invoice_value.amount":-1}, "$fields":{"name":1, "total_order_value":{"$query":{"$collection":"orders", "$group":{"_id":null, "order_amount":{"$sum":"$order_amount"}}}, "$fk":"entity_id", "$type":{"scalar":"order_amount"}}, "total_invoice_value":{"$query":{"$collection":"invoices", "$group":{"_id":null, "invoice_amount_base_currency":{"$sum":"$invoice_amount_base_currency"}}}, "$fk":"entity_id", "$type":{"scalar":"invoice_amount_base_currency"}}}, "$limit":2});
                }).then(
                function (data) {
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id.toString()).to.eql(entity5id.toString());
                    expect(data.result[0].total_invoice_value.amount).to.eql(50000);
                    expect(data.result[0].total_order_value.amount).to.eql(5000);
                    expect(data.result[1]._id.toString()).to.eql(entity1id.toString());
                    expect(data.result[1].total_invoice_value.amount).to.eql(30000);
                    expect(data.result[1].total_order_value.amount).to.eql(3000);
                    expect(data.dataInfo.hasNext).to.eql(true);
                }).then(
                function () {
                    return db.query({"$collection":"entities", "$sort":{name:1, "total_invoice_value.invoice_amount_base_currency.amount":-1}, "$fields":{"name":1, "total_order_value":{"$query":{"$collection":"orders", "$group":{"_id":null, "order_amount":{"$sum":"$order_amount"}}}, "$fk":"entity_id", "$type":{"scalar":"order_amount"}}, "total_invoice_value":{"$query":{"$collection":"invoices", "$group":{"_id":null, "invoice_amount_base_currency":{"$sum":"$invoice_amount_base_currency"}}}, "$fk":"entity_id", "$type":"scalar"}}, "$limit":2, "$skip":2});
                }).then(
                function (data) {
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id.toString()).to.eql(entity7id.toString());
                    expect(data.result[0].total_invoice_value.invoice_amount_base_currency.amount).to.eql(25000);
                    expect(data.result[1]._id.toString()).to.eql(entity2id.toString());
                    expect(data.result[1].total_invoice_value.invoice_amount_base_currency.amount).to.eql(5000);
                    expect(data.result[1].total_order_value.amount).to.eql(8000);
                    expect(data.dataInfo.hasNext).to.eql(true);
                }).then(
                function () {
                    return db.query({"$collection":"entities", "$sort":{name:1, "total_invoice_value.amount":-1}, "$fields":{"name":1, "total_order_value":{"$query":{"$collection":"orders", "$group":{"_id":null, "order_amount":{"$sum":"$order_amount"}}}, "$fk":"entity_id", "$type":{"scalar":"order_amount"}}, "total_invoice_value":{"$query":{"$collection":"invoices", "$group":{"_id":null, "invoice_amount_base_currency":{"$sum":"$invoice_amount_base_currency"}}}, "$fk":"entity_id", "$type":{"scalar":"invoice_amount_base_currency"}}}, "$limit":2, "$skip":4});
                }).then(
                function (data) {
                    expect(data.result).to.have.length(2);
                    expect(data.result[0]._id.toString()).to.eql(entity3id.toString());
                    expect(data.result[0].total_invoice_value.amount).to.eql(2500);
                    expect(data.result[0].total_order_value.amount).to.eql(2000);
                    expect(data.result[1]._id.toString()).to.eql(entity4id.toString());
                    expect(data.result[1].total_invoice_value.amount).to.eql(2500);
                    expect(data.dataInfo.hasNext).to.eql(true);
                }).then(
                function () {
                    return db.query({"$collection":"entities", "$sort":{name:1, "total_invoice_value.amount":-1}, "$fields":{"name":1, "total_order_value":{"$query":{"$collection":"orders", "$group":{"_id":null, "order_amount":{"$sum":"$order_amount"}}}, "$fk":"entity_id", "$type":{"scalar":"order_amount"}}, "total_invoice_value":{"$query":{"$collection":"invoices", "$group":{"_id":null, "invoice_amount_base_currency":{"$sum":"$invoice_amount_base_currency"}}}, "$fk":"entity_id", "$type":{"scalar":"invoice_amount_base_currency"}}}, "$limit":2, "$skip":6});
                }).then(
                function (data) {
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id.toString()).to.eql(entity6id.toString());
                    expect(data.dataInfo.hasNext).to.eql(false);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        });

        it("Subquerys", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection:NorthwindDb.BUSINESS_FUNCTION_TABLE, $insert:NorthwindDb.BusinessFunctions},
                        {$collection:NorthwindDb.TASK_TABLE, $insert:NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
//                    console.log("After update...");
                    var query = {
                        $collection:NorthwindDb.BUSINESS_FUNCTION_TABLE,
                        $fields:{
                            businessfunction:1,
                            tasks:{
                                $type:"scalar",
                                $query:{
                                    $collection:NorthwindDb.TASK_TABLE,
                                    $group:{
                                        _id:null,
                                        count:{$sum:1},
                                        estefforts:{$sum:"$estefforts"}
                                    }
                                },
                                $fk:"businessfunctionid._id", $parent:"_id"
                            }
                        },
                        $sort:{businessfunction:1}

                    };
//                    console.log("query>>>>>>>>>>>>>>>" + JSON.stringify(query));
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].businessfunction).to.eql("Accounts");
                    expect(data.result[0].tasks._id).to.eql("Accounts");
                    expect(data.result[0].tasks.count).to.eql(2);
                    expect(data.result[0].tasks.estefforts).to.eql(19);

                    expect(data.result[1]._id).to.eql("Delivery");
                    expect(data.result[1].businessfunction).to.eql("Delivery");
                    expect(data.result[1].tasks._id).to.eql("Delivery");
                    expect(data.result[1].tasks.count).to.eql(5);
                    expect(data.result[1].tasks.estefforts).to.eql(22);

                    expect(data.result[2]._id).to.eql("HR");
                    expect(data.result[2].businessfunction).to.eql("HR");
                    expect(data.result[2].tasks._id).to.eql("HR");
                    expect(data.result[2].tasks.count).to.eql(2);
                    expect(data.result[2].tasks.estefforts).to.eql(23);

                    expect(data.result[3]._id).to.eql("Sales");
                    expect(data.result[3].businessfunction).to.eql("Sales");
                    expect(data.result[3].tasks._id).to.eql("Sales");
                    expect(data.result[3].tasks.count).to.eql(3);
                    expect(data.result[3].tasks.estefforts).to.eql(14);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            //step1: get businessfunctions
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:"businessfunctions",
                $fields:{
                    businessfunction:1
                },
                $sort:{businessfunction:1}
            }
            //get business functions data
            var res = [
                {"_id":"Accounts", "businessfunction":"Accounts"},
                {"_id":"Delivery", "businessfunction":"Delivery"},
                {"_id":"HR", "businessfunction":"HR"},
                {"_id":"Sales", "businessfunction":"Sales"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                $collection:"tasks",
                $group:{
                    _id:"$businessfunctionid._id",
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid__id:{$first:"$businessfunctionid._id"}  //TODO alias name if dot contains
                },
                $filter:{"$businessfunctionid._id":{$in:["Delivery", "Sales", "Accounts", "HR"]}}
            }
            var subQueryResult = {"result":[
                {"_id":"HR", "count":2, "estefforts":23, "businessfunctionid__id":"HR"},
                {"_id":"Accounts", "count":2, "estefforts":19, "businessfunctionid__id":"Accounts"},
                {"_id":"Sales", "count":3, "estefforts":14, "businessfunctionid__id":"Sales"},
                {"_id":"Delivery", "count":5, "estefforts":22, "businessfunctionid__id":"Delivery"}
            ]};
            // divide result on base of bfid.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Accounts", "businessfunction":"Accounts", "tasks":{"_id":"Accounts", "count":2, "estefforts":19}},
                {"_id":"Delivery", "businessfunction":"Delivery", "tasks":{"_id":"Delivery", "count":5, "estefforts":22}},
                {"_id":"HR", "businessfunction":"HR", "tasks":{"_id":"HR", "count":2, "estefforts":23}},
                {"_id":"Sales", "businessfunction":"Sales", "tasks":{"_id":"Sales", "count":3, "estefforts":14}}
            ]};
        });

        it("Subquery not found", function (done) {

            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection:NorthwindDb.BUSINESS_FUNCTION_TABLE, $insert:NorthwindDb.BusinessFunctions},
                        {$collection:NorthwindDb.TASK_TABLE, $insert:NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection:NorthwindDb.BUSINESS_FUNCTION_TABLE,
                        $fields:{
                            businessfunction:1,
                            tasks:{
                                $type:"scalar",
                                $fk:"businessfunctionid._id", $parent:"_id"
                            }
                        },
                        $sort:{businessfunction:1}

                    };
                    return db.query(query);
                }).then(
                function (data) {
                    done("Not Ok")
                }).fail(function (err) {
//                    console.log("Subquery not provided .... Error : >>>>>>>>>>>>>>>>>>>     " + err);
                    var noSubqueryError = err.toString().indexOf("If query is not defined can't define Object in field") != -1;
                    if (noSubqueryError) {
                        done();
                    } else {
                        done(err);
                    }
                })
        })

        it("Subquery without dotted in Fk", function (done) {

            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection:NorthwindDb.BUSINESS_FUNCTION_TABLE, $insert:NorthwindDb.BusinessFunctions},
                        {$collection:NorthwindDb.TASK_TABLE, $insert:NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection:NorthwindDb.BUSINESS_FUNCTION_TABLE,
                        $fields:{
                            businessfunction:1,
                            tasks:{
                                $type:"scalar",
                                $query:{
                                    $collection:{collection:NorthwindDb.TASK_TABLE, fields:[
                                        {field:"businessfunctionid", type:"fk", collection:"businessfunctions"}
                                    ]},
                                    $group:{
                                        _id:null,
                                        count:{$sum:1},
                                        estefforts:{$sum:"$estefforts"}
                                    }
                                },
                                $fk:"businessfunctionid", $parent:"_id"
                            }
                        },
                        $sort:{businessfunction:1}
                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0]._id).to.eql("Accounts");
                    expect(data.result[0].businessfunction).to.eql("Accounts");
                    expect(data.result[0].tasks._id).to.eql("Accounts");
                    expect(data.result[0].tasks.count).to.eql(2);
                    expect(data.result[0].tasks.estefforts).to.eql(19);

                    expect(data.result[1]._id).to.eql("Delivery");
                    expect(data.result[1].businessfunction).to.eql("Delivery");
                    expect(data.result[1].tasks._id).to.eql("Delivery");
                    expect(data.result[1].tasks.count).to.eql(5);
                    expect(data.result[1].tasks.estefforts).to.eql(22);

                    expect(data.result[2]._id).to.eql("HR");
                    expect(data.result[2].businessfunction).to.eql("HR");
                    expect(data.result[2].tasks._id).to.eql("HR");
                    expect(data.result[2].tasks.count).to.eql(2);
                    expect(data.result[2].tasks.estefforts).to.eql(23);

                    expect(data.result[3]._id).to.eql("Sales");
                    expect(data.result[3].businessfunction).to.eql("Sales");
                    expect(data.result[3].tasks._id).to.eql("Sales");
                    expect(data.result[3].tasks.count).to.eql(3);
                    expect(data.result[3].tasks.estefforts).to.eql(14);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })


            //step1: get businessfunctions
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:"businessfunctions",
                $fields:{
                    businessfunction:1
                },
                $sort:{businessfunction:1}
            }
            //get business functions data
            var res = [
                {"_id":"Accounts", "businessfunction":"Accounts"},
                {"_id":"Delivery", "businessfunction":"Delivery"},
                {"_id":"HR", "businessfunction":"HR"},
                {"_id":"Sales", "businessfunction":"Sales"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                $collection:"tasks",
                $group:{
                    _id:"$businessfunctionid._id",
                    count:{$sum:1},
                    estefforts:{$sum:"$estefforts"},
                    businessfunctionid__id:{$first:"$businessfunctionid._id"}  //TODO alias name if dot contains
                },
                $filter:{"$businessfunctionid._id":{$in:["Delivery", "Sales", "Accounts", "HR"]}}
            }
            var subQueryResult = {"result":[
                {"_id":"HR", "count":2, "estefforts":23, "businessfunctionid__id":"HR"},
                {"_id":"Accounts", "count":2, "estefforts":19, "businessfunctionid__id":"Accounts"},
                {"_id":"Sales", "count":3, "estefforts":14, "businessfunctionid__id":"Sales"},
                {"_id":"Delivery", "count":5, "estefforts":22, "businessfunctionid__id":"Delivery"}
            ]};
            // divide result on base of bfid.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Accounts", "businessfunction":"Accounts", "tasks":{"_id":"Accounts", "count":2, "estefforts":19}},
                {"_id":"Delivery", "businessfunction":"Delivery", "tasks":{"_id":"Delivery", "count":5, "estefforts":22}},
                {"_id":"HR", "businessfunction":"HR", "tasks":{"_id":"HR", "count":2, "estefforts":23}},
                {"_id":"Sales", "businessfunction":"Sales", "tasks":{"_id":"Sales", "count":3, "estefforts":14}}
            ]};
        });


        // employees and total taskhrs
        it("Subquery on array of fk", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection:NorthwindDb.EMPLOYEES_TABLE, $insert:NorthwindDb.Employees},
                        {$collection:NorthwindDb.TASK_TABLE, $insert:NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection:NorthwindDb.EMPLOYEES_TABLE,
                        $fields:{
                            employee:1,
                            tasks:{
                                $type:"scalar",
                                $query:{
                                    $collection:NorthwindDb.TASK_TABLE,
                                    $unwind:["assignto"],
                                    $group:{_id:null,
                                        count:{$sum:1},
                                        estefforts:{$sum:"$estefforts"}
                                    }
                                },
                                $fk:"assignto._id", $parent:"_id"}
                        },
                        $sort:{employee:1}
                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0]._id).to.eql("Ashish");
                    expect(data.result[0].employee).to.eql("Ashish");
                    expect(data.result[0].tasks._id).to.eql("Ashish");
                    expect(data.result[0].tasks.count).to.eql(2);
                    expect(data.result[0].tasks.estefforts).to.eql(7);

                    expect(data.result[1]._id).to.eql("Pawan");
                    expect(data.result[1].employee).to.eql("Pawan");
                    expect(data.result[1].tasks._id).to.eql("Pawan");
                    expect(data.result[1].tasks.count).to.eql(7);
                    expect(data.result[1].tasks.estefforts).to.eql(50);

                    expect(data.result[2]._id).to.eql("Rohit");
                    expect(data.result[2].employee).to.eql("Rohit");
                    expect(data.result[2].tasks._id).to.eql("Rohit");
                    expect(data.result[2].tasks.count).to.eql(8);
                    expect(data.result[2].tasks.estefforts).to.eql(52);

                    expect(data.result[3]._id).to.eql("Sachin");
                    expect(data.result[3].employee).to.eql("Sachin");
                    expect(data.result[3].tasks._id).to.eql("Sachin");
                    expect(data.result[3].tasks.count).to.eql(4);
                    expect(data.result[3].tasks.estefforts).to.eql(22);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            //step1: get tasks
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:NorthwindDb.EMPLOYEES_TABLE,
                $fields:{
                    employee:1
                }
            }
            //get employee data
            var employees = [
                {_id:"Ashish", "employee":"Ashish"},
                {_id:"Pawan", "employee":"Pawan"},
                {_id:"Rohit", "employee":"Rohit"},
                {_id:"Sachin", "employee":"Sachin"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                $collection:NorthwindDb.TASK_TABLE,
                $unwind:["assignto"],
                "$group":{
                    "_id":"$assignto._id",
                    "count":{"$sum":1},
                    "estefforts":{"$sum":"$estefforts"},
                    "assignto__id":{"$first":"$assignto._id"}
                },
                "$filter":{"assignto._id":{"$in":["Pawan", "Rohit", "Sachin", "Ashish"]}}
            }

            var subQueryResult = {"result":[
                {"_id":"Sachin", "count":4, "estefforts":22, "assignto__id":"Sachin"},
                {"_id":"Ashish", "count":2, "estefforts":7, "assignto__id":"Ashish"},
                {"_id":"Rohit", "count":8, "estefforts":52, "assignto__id":"Rohit"},
                {"_id":"Pawan", "count":7, "estefforts":50, "assignto__id":"Pawan"}
            ]};
            // divide result on base of assignto.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Ashish", "employee":"Ashish", "tasks":{"_id":"Ashish", "count":2, "estefforts":7}},
                {"_id":"Pawan", "employee":"Pawan", "tasks":{"_id":"Pawan", "count":7, "estefforts":50}},
                {"_id":"Rohit", "employee":"Rohit", "tasks":{"_id":"Rohit", "count":8, "estefforts":52}},
                {"_id":"Sachin", "e mployee":"Sachin", "tasks":{"_id":"Sachin", "count":4, "estefforts":22}}
            ]};
        });

        it("Subquery on array of fk with related column defined in query to get data", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection:NorthwindDb.EMPLOYEES_TABLE, $insert:NorthwindDb.Employees},
                        {$collection:NorthwindDb.TASK_TABLE, $insert:NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection:NorthwindDb.EMPLOYEES_TABLE,
                        $fields:{
                            employee:1,
                            tasks:{
                                $type:"scalar",
                                $query:{
                                    $collection:NorthwindDb.TASK_TABLE,
                                    $unwind:["assignto"],
                                    $group:{_id:null,
                                        count:{$sum:1},
                                        estefforts:{$sum:"$estefforts"}
                                    }
                                },
                                $fk:"assignto._id", $parent:"_id"}
                        },
                        $sort:{employee:1}
                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0]._id).to.eql("Ashish");
                    expect(data.result[0].employee).to.eql("Ashish");
                    expect(data.result[0].tasks._id).to.eql("Ashish");
                    expect(data.result[0].tasks.count).to.eql(2);
                    expect(data.result[0].tasks.estefforts).to.eql(7);

                    expect(data.result[1]._id).to.eql("Pawan");
                    expect(data.result[1].employee).to.eql("Pawan");
                    expect(data.result[1].tasks._id).to.eql("Pawan");
                    expect(data.result[1].tasks.count).to.eql(7);
                    expect(data.result[1].tasks.estefforts).to.eql(50);

                    expect(data.result[2]._id).to.eql("Rohit");
                    expect(data.result[2].employee).to.eql("Rohit");
                    expect(data.result[2].tasks._id).to.eql("Rohit");
                    expect(data.result[2].tasks.count).to.eql(8);
                    expect(data.result[2].tasks.estefforts).to.eql(52);

                    expect(data.result[3]._id).to.eql("Sachin");
                    expect(data.result[3].employee).to.eql("Sachin");
                    expect(data.result[3].tasks._id).to.eql("Sachin");
                    expect(data.result[3].tasks.count).to.eql(4);
                    expect(data.result[3].tasks.estefforts).to.eql(22);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            //step1: get tasks
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:NorthwindDb.EMPLOYEES_TABLE,
                $fields:{
                    employee:1
                }
            }
            //get employee data
            var employees = [
                {_id:"Ashish", "employee":"Ashish"},
                {_id:"Pawan", "employee":"Pawan"},
                {_id:"Rohit", "employee":"Rohit"},
                {_id:"Sachin", "employee":"Sachin"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                $collection:NorthwindDb.TASK_TABLE,
                $unwind:["assignto"],
                "$group":{
                    "_id":"$assignto._id",
                    "count":{"$sum":1},
                    "estefforts":{"$sum":"$estefforts"},
                    "assignto__id":{"$first":"$assignto._id"}
                },
                "$filter":{"assignto._id":{"$in":["Pawan", "Rohit", "Sachin", "Ashish"]}}
            }

            var subQueryResult = {"result":[
                {"_id":"Sachin", "count":4, "estefforts":22, "assignto__id":"Sachin"},
                {"_id":"Ashish", "count":2, "estefforts":7, "assignto__id":"Ashish"},
                {"_id":"Rohit", "count":8, "estefforts":52, "assignto__id":"Rohit"},
                {"_id":"Pawan", "count":7, "estefforts":50, "assignto__id":"Pawan"}
            ]};
            // divide result on base of assignto.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Ashish", "employee":"Ashish", "tasks":{"_id":"Ashish", "count":2, "estefforts":7}},
                {"_id":"Pawan", "employee":"Pawan", "tasks":{"_id":"Pawan", "count":7, "estefforts":50}},
                {"_id":"Rohit", "employee":"Rohit", "tasks":{"_id":"Rohit", "count":8, "estefforts":52}},
                {"_id":"Sachin", "e mployee":"Sachin", "tasks":{"_id":"Sachin", "count":4, "estefforts":22}}
            ]};
        });

        it('Subquery with parent field defined in query fields and get whole data of parent field', function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    var createUsers = {$collection:"pl.users", $insert:[
                        {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com"},
                        {username:"Rohit_TeamLead", password:"rohit", emailid:"rohit.bansal@daffodilsw.com"}
                    ], $modules:{"Role":0}};
                    return db.update(createUsers);
                }).then(
                function () {
                    return db.query({"$collection":"pl.users", $modules:{"Role":0}});
                }).then(
                function (usersData) {
                    var collectionDefination = [
                        {$collection:"pl.collections", $insert:[
                            {collection:"tasks"}
                        ]},
                        {$collection:"pl.fields", $insert:[
                            {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                            {field:"duedate", type:"date", collectionid:{$query:{collection:"tasks"}}} ,
                            {field:"team_lead_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                            {field:"self_rating", type:"number", collectionid:{$query:{collection:"tasks"}}} ,
                            {field:"estefforts", type:"string", collectionid:{$query:{collection:"tasks"}}} ,
                            {field:"ownerid", type:"fk", collectionid:{$query:{collection:"tasks"}}, collection:"pl.users", set:["emailid"]}
                        ]}
                    ];
                    return db.update(collectionDefination);
                }).then(
                function () {
                    var tasks = {$collection:"tasks", $insert:[
                        {task:"task1", "duedate":"2014-09-08", estefforts:"20 Hrs", "self_rating":3, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"},
                        {task:"task2", "duedate":"2014-09-08", estefforts:"8 Hrs", "team_lead_rating":10, "self_rating":8, ownerid:{$query:{emailid:"rohit.bansal@daffodilsw.com"}}, "assigned_to":"rohit"},
                        {task:"task3", "duedate":"2014-09-08", estefforts:"10 Hrs", "self_rating":5, "team_lead_rating":6, ownerid:{$query:{emailid:"sachin.bansal@daffodilsw.com"}}, "assigned_to":"ashu"}
                    ]};
                    return db.update(tasks);
                }).then(
                function () {
                    return db.query({$collection:"tasks", $fields:{employees:{$query:{$collection:"pl.users"}, $fk:"_id", $parent:"ownerid"}, ownerid:1, task:1, estefforts:1}, $sort:{task:1}});
                }).then(
                function (taskData) {
                    expect(taskData.result).to.have.length(3);
                    expect(taskData.result[0].task).to.eql("task1");
                    expect(taskData.result[0].employees.username).to.eql("Sachin_Developer");
                    expect(taskData.result[0].ownerid.emailid).to.eql("sachin.bansal@daffodilsw.com");
                    expect(taskData.result[1].task).to.eql("task2");
                    expect(taskData.result[2].task).to.eql("task3");
                    expect(taskData.result[2].estefforts).to.eql("10 Hrs");
                }).then(
                function () {
                    done();
                }).catch(function (err) {
                    done(err);
                })
        });

        it("Subquery on array without dotted of fk", function (done) {
            //@TODO throw error if group on array column.
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection:NorthwindDb.EMPLOYEES_TABLE, $insert:NorthwindDb.Employees},
                        {$collection:NorthwindDb.TASK_TABLE, $insert:NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection:NorthwindDb.EMPLOYEES_TABLE,
                        $fields:{
                            employee:1,
                            tasks:{
                                $type:"scalar",
                                $query:{
                                    $collection:{collection:NorthwindDb.TASK_TABLE, fields:[
                                        {field:"assignto", type:"fk", collection:NorthwindDb.EMPLOYEES_TABLE}
                                    ]},
                                    $unwind:["assignto"],
                                    $group:{_id:null,
                                        count:{$sum:1},
                                        estefforts:{$sum:"$estefforts"}
                                    }
                                },
                                $fk:"assignto", $parent:"_id"}
                        },
                        $sort:{employee:1}
                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0]._id).to.eql("Ashish");
                    expect(data.result[0].employee).to.eql("Ashish");
                    expect(data.result[0].tasks._id).to.eql("Ashish");
                    expect(data.result[0].tasks.count).to.eql(2);
                    expect(data.result[0].tasks.estefforts).to.eql(7);

                    expect(data.result[1]._id).to.eql("Pawan");
                    expect(data.result[1].employee).to.eql("Pawan");
                    expect(data.result[1].tasks._id).to.eql("Pawan");
                    expect(data.result[1].tasks.count).to.eql(7);
                    expect(data.result[1].tasks.estefforts).to.eql(50);

                    expect(data.result[2]._id).to.eql("Rohit");
                    expect(data.result[2].employee).to.eql("Rohit");
                    expect(data.result[2].tasks._id).to.eql("Rohit");
                    expect(data.result[2].tasks.count).to.eql(8);
                    expect(data.result[2].tasks.estefforts).to.eql(52);

                    expect(data.result[3]._id).to.eql("Sachin");
                    expect(data.result[3].employee).to.eql("Sachin");
                    expect(data.result[3].tasks._id).to.eql("Sachin");
                    expect(data.result[3].tasks.count).to.eql(4);
                    expect(data.result[3].tasks.estefforts).to.eql(22);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            //step1: get tasks
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:NorthwindDb.EMPLOYEES_TABLE,
                $fields:{
                    employee:1
                }
            }
            //get employee data
            var employees = [
                {_id:"Ashish", "employee":"Ashish"},
                {_id:"Pawan", "employee":"Pawan"},
                {_id:"Rohit", "employee":"Rohit"},
                {_id:"Sachin", "employee":"Sachin"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                $collection:NorthwindDb.TASK_TABLE,
                $unwind:["assignto"],
                "$group":{
                    "_id":"$assignto._id",
                    "count":{"$sum":1},
                    "estefforts":{"$sum":"$estefforts"},
                    "assignto__id":{"$first":"$assignto._id"}
                },
                "$filter":{"assignto._id":{"$in":["Pawan", "Rohit", "Sachin", "Ashish"]}}
            }

            var subQueryResult = {"result":[
                {"_id":"Sachin", "count":4, "estefforts":22, "assignto__id":"Sachin"},
                {"_id":"Ashish", "count":2, "estefforts":7, "assignto__id":"Ashish"},
                {"_id":"Rohit", "count":8, "estefforts":52, "assignto__id":"Rohit"},
                {"_id":"Pawan", "count":7, "estefforts":50, "assignto__id":"Pawan"}
            ]};
            // divide result on base of assignto.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Ashish", "employee":"Ashish", "tasks":{"_id":"Ashish", "count":2, "estefforts":7}},
                {"_id":"Pawan", "employee":"Pawan", "tasks":{"_id":"Pawan", "count":7, "estefforts":50}},
                {"_id":"Rohit", "employee":"Rohit", "tasks":{"_id":"Rohit", "count":8, "estefforts":52}},
                {"_id":"Sachin", "e mployee":"Sachin", "tasks":{"_id":"Sachin", "count":4, "estefforts":22}}
            ]};
        });


        //@TODO cross join
        it("Subquery with n-rows", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection:NorthwindDb.EMPLOYEES_TABLE, $insert:NorthwindDb.Employees},
                        {$collection:NorthwindDb.TASK_TABLE, $insert:NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection:NorthwindDb.EMPLOYEES_TABLE,
                        $fields:{
                            employee:1,
                            tasks:{$type:"n-rows",
                                $query:{
                                    $collection:"tasks",
                                    $unwind:["assignto"],
                                    $group:{
                                        _id:"$status",
                                        count:{$sum:1},
                                        estefforts:{$sum:"$estefforts"},
                                        status:{$first:"$status"},
                                        $sort:{status:1}
                                    }
                                },
                                $fk:"assignto._id",
                                $parent:"_id"
                            }
                        },
                        $sort:{employee:1}
                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0]._id).to.eql("Ashish");
                    expect(data.result[0].employee).to.eql("Ashish");
                    expect(data.result[0].tasks).to.have.length(1);
                    expect(data.result[0].tasks[0]._id).to.eql("New");
                    expect(data.result[0].tasks[0].count).to.eql(2);
                    expect(data.result[0].tasks[0].estefforts).to.eql(7);

                    expect(data.result[1]._id).to.eql("Pawan");
                    expect(data.result[1].employee).to.eql("Pawan");
                    expect(data.result[1].tasks).to.have.length(3);
                    expect(data.result[1].tasks[0]._id).to.eql("Completed");
                    expect(data.result[1].tasks[0].count).to.eql(3);
                    expect(data.result[1].tasks[0].estefforts).to.eql(32);
                    expect(data.result[1].tasks[1]._id).to.eql("InProgress");
                    expect(data.result[1].tasks[1].count).to.eql(2);
                    expect(data.result[1].tasks[1].estefforts).to.eql(10);
                    expect(data.result[1].tasks[2]._id).to.eql("New");
                    expect(data.result[1].tasks[2].count).to.eql(2);
                    expect(data.result[1].tasks[2].estefforts).to.eql(8);

                    expect(data.result[2]._id).to.eql("Rohit");
                    expect(data.result[2].employee).to.eql("Rohit");
                    expect(data.result[2].tasks).to.have.length(3);
                    expect(data.result[2].tasks[0]._id).to.eql("Completed");
                    expect(data.result[2].tasks[0].count).to.eql(3);
                    expect(data.result[2].tasks[0].estefforts).to.eql(32);
                    expect(data.result[2].tasks[1]._id).to.eql("InProgress");
                    expect(data.result[2].tasks[1].count).to.eql(2);
                    expect(data.result[2].tasks[1].estefforts).to.eql(9);
                    expect(data.result[2].tasks[2]._id).to.eql("New");
                    expect(data.result[2].tasks[2].count).to.eql(3);
                    expect(data.result[2].tasks[2].estefforts).to.eql(11);

                    expect(data.result[3]._id).to.eql("Sachin");
                    expect(data.result[3].employee).to.eql("Sachin");
                    expect(data.result[3].tasks).to.have.length(3);
                    expect(data.result[3].tasks[0]._id).to.eql("Completed");
                    expect(data.result[3].tasks[0].count).to.eql(1);
                    expect(data.result[3].tasks[0].estefforts).to.eql(10);
                    expect(data.result[3].tasks[1]._id).to.eql("InProgress");
                    expect(data.result[3].tasks[1].count).to.eql(2);
                    expect(data.result[3].tasks[1].estefforts).to.eql(7);
                    expect(data.result[3].tasks[2]._id).to.eql("New");
                    expect(data.result[3].tasks[2].count).to.eql(1);
                    expect(data.result[3].tasks[2].estefforts).to.eql(5);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })


            //step1: get tasks
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:"employees",
                $fields:{
                    employee:1
                },
                $sort:{employee:1}
            }
            //get employee data
            var employees = [
                {_id:"Ashish", "employee":"Ashish"},
                {_id:"Pawan", "employee":"Pawan"},
                {_id:"Rohit", "employee":"Rohit"},
                {_id:"Sachin", "employee":"Sachin"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                "$collection":"tasks",
                "$unwind":["assignto"],
                "$group":{
                    _id:{status:"$status", assignto__id:"$assignto._id"},
                    "count":{"$sum":1},
                    "estefforts":{"$sum":"$estefforts"},
                    status:{$first:"$status"},
                    "assignto__id":{"$first":"$assignto._id"}
                },
                $sort:{"status":1},
                "$filter":{"assignto._id":{"$in":["Pawan", "Rohit", "Sachin", "Ashish"]}}
            }

            var res = {"result":[
                {"_id":{"status":"Completed", "assignto__id":"Sachin"}, "count":1, "estefforts":10, "status":"Completed", "assignto__id":"Sachin"},
                {"_id":{"status":"Completed", "assignto__id":"Rohit"}, "count":3, "estefforts":32, "status":"Completed", "assignto__id":"Rohit"},
                {"_id":{"status":"Completed", "assignto__id":"Pawan"}, "count":3, "estefforts":32, "status":"Completed", "assignto__id":"Pawan"},
                {"_id":{"status":"InProgress", "assignto__id":"Pawan"}, "count":2, "estefforts":10, "status":"InProgress", "assignto__id":"Pawan"},
                {"_id":{"stat us":"InProgress", "assignto__id":"Sachin"}, "count":2, "estefforts":7, "status":"InProgress", "assignto__id":"Sachin"},
                {"_id":{"status":"InProgress", "assignto__id":"Rohit"}, "count":2, "estefforts":9, "status":"InProgress", "assignto__id":"Rohit"},
                {"_id":{"status":"New", "assignto__id":"Sachin"}, "count":1, "estefforts":5, "status":"New", "assignto__id":"Sachin"},
                {"_id":{"status":"New", "assignto__id":"Ashish"}, "count":2, "estefforts":7, "status":"New", "assignto__id":"Ashish"},
                {"_id":{"status":"New", "assignto__id":"Rohit"}, "count":3, "estefforts":11, "status":"New", "assignto__id":"Rohit"},
                {"_id":{"status":"New", "assignto__id":"Pawan"}, "count":2, "estefforts":8, "st atus":"New", "assignto__id":"Pawan"}
            ]};
            // divide result on base of assignto.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Ashish", "employee":"Ashish", "tasks":[
                    {"_id":"New", "count":2, "estefforts":7, "status":"New"}
                ]},
                {"_id":"Pawan", "employee":"Pawan", "tasks":[
                    {"_id":"Completed", "count":3, "estefforts":32, "status":"Completed"},
                    {"_id":"InProgress", "count":2, "estefforts":10, "status":"InProgress"},
                    {"_id":"New", "count":2, "estefforts":8, "status":"New"}
                ]},
                {"_id":"Rohit", "employee":"Rohit", "tasks":[
                    {"_id":"Completed", "count":3, "estefforts":32, "status":"Completed"},
                    {"_id":"InProgress", "count":2, "estefforts":9, "status":"InProgress"},
                    {"_id":"New", "count":3, "estefforts":11, "status":"New"}
                ]},
                {"_i d":"Sachin", "employee":"Sachin", "tasks":[
                    {"_id":"Completed", "count":1, "estefforts":10, "status":"Completed"},
                    {"_id":"InProgress", "count":2, "estefforts":7, "status":"InProgress"},
                    {"_id":"New", "count":1, "estefforts":5, "status":"New"}
                ]}
            ]};
        });

        it("Subquery with n-rows without dotted fk", function (done) {

            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection:NorthwindDb.EMPLOYEES_TABLE, $insert:NorthwindDb.Employees},
                        {$collection:NorthwindDb.TASK_TABLE, $insert:NorthwindDb.Tasks}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection:NorthwindDb.EMPLOYEES_TABLE,
                        $fields:{
                            employee:1,
                            tasks:{$type:"n-rows",
                                $query:{
                                    $collection:{collection:"tasks", fields:[
                                        {field:"assignto", type:"fk", collection:NorthwindDb.EMPLOYEES_TABLE}
                                    ]},
                                    $unwind:["assignto"],
                                    $group:{
                                        _id:"$status",
                                        count:{$sum:1},
                                        estefforts:{$sum:"$estefforts"},
                                        status:{$first:"$status"},
                                        $sort:{status:1}
                                    }
                                },
                                $fk:"assignto",
                                $parent:"_id"
                            }
                        },
                        $sort:{employee:1}
                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);

                    expect(data.result[0]._id).to.eql("Ashish");
                    expect(data.result[0].employee).to.eql("Ashish");
                    expect(data.result[0].tasks).to.have.length(1);
                    expect(data.result[0].tasks[0]._id).to.eql("New");
                    expect(data.result[0].tasks[0].count).to.eql(2);
                    expect(data.result[0].tasks[0].estefforts).to.eql(7);

                    expect(data.result[1]._id).to.eql("Pawan");
                    expect(data.result[1].employee).to.eql("Pawan");
                    expect(data.result[1].tasks).to.have.length(3);
                    expect(data.result[1].tasks[0]._id).to.eql("Completed");
                    expect(data.result[1].tasks[0].count).to.eql(3);
                    expect(data.result[1].tasks[0].estefforts).to.eql(32);
                    expect(data.result[1].tasks[1]._id).to.eql("InProgress");
                    expect(data.result[1].tasks[1].count).to.eql(2);
                    expect(data.result[1].tasks[1].estefforts).to.eql(10);
                    expect(data.result[1].tasks[2]._id).to.eql("New");
                    expect(data.result[1].tasks[2].count).to.eql(2);
                    expect(data.result[1].tasks[2].estefforts).to.eql(8);

                    expect(data.result[2]._id).to.eql("Rohit");
                    expect(data.result[2].employee).to.eql("Rohit");
                    expect(data.result[2].tasks).to.have.length(3);
                    expect(data.result[2].tasks[0]._id).to.eql("Completed");
                    expect(data.result[2].tasks[0].count).to.eql(3);
                    expect(data.result[2].tasks[0].estefforts).to.eql(32);
                    expect(data.result[2].tasks[1]._id).to.eql("InProgress");
                    expect(data.result[2].tasks[1].count).to.eql(2);
                    expect(data.result[2].tasks[1].estefforts).to.eql(9);
                    expect(data.result[2].tasks[2]._id).to.eql("New");
                    expect(data.result[2].tasks[2].count).to.eql(3);
                    expect(data.result[2].tasks[2].estefforts).to.eql(11);

                    expect(data.result[3]._id).to.eql("Sachin");
                    expect(data.result[3].employee).to.eql("Sachin");
                    expect(data.result[3].tasks).to.have.length(3);
                    expect(data.result[3].tasks[0]._id).to.eql("Completed");
                    expect(data.result[3].tasks[0].count).to.eql(1);
                    expect(data.result[3].tasks[0].estefforts).to.eql(10);
                    expect(data.result[3].tasks[1]._id).to.eql("InProgress");
                    expect(data.result[3].tasks[1].count).to.eql(2);
                    expect(data.result[3].tasks[1].estefforts).to.eql(7);
                    expect(data.result[3].tasks[2]._id).to.eql("New");
                    expect(data.result[3].tasks[2].count).to.eql(1);
                    expect(data.result[3].tasks[2].estefforts).to.eql(5);
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })


            //step1: get tasks
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collection:"employees",
                $fields:{
                    employee:1
                },
                $sort:{employee:1}
            }
            //get employee data
            var employees = [
                {_id:"Ashish", "employee":"Ashish"},
                {_id:"Pawan", "employee":"Pawan"},
                {_id:"Rohit", "employee":"Rohit"},
                {_id:"Sachin", "employee":"Sachin"}
            ];
            // doresult of sub uqery module.
            var query2 = {
                "$collection":"tasks",
                "$unwind":["assignto"],
                "$group":{
                    _id:{status:"$status", assignto__id:"$assignto._id"},
                    "count":{"$sum":1},
                    "estefforts":{"$sum":"$estefforts"},
                    status:{$first:"$status"},
                    "assignto__id":{"$first":"$assignto._id"}
                },
                $sort:{"status":1},
                "$filter":{"assignto._id":{"$in":["Pawan", "Rohit", "Sachin", "Ashish"]}}
            }

            var res = {"result":[
                {"_id":{"status":"Completed", "assignto__id":"Sachin"}, "count":1, "estefforts":10, "status":"Completed", "assignto__id":"Sachin"},
                {"_id":{"status":"Completed", "assignto__id":"Rohit"}, "count":3, "estefforts":32, "status":"Completed", "assignto__id":"Rohit"},
                {"_id":{"status":"Completed", "assignto__id":"Pawan"}, "count":3, "estefforts":32, "status":"Completed", "assignto__id":"Pawan"},
                {"_id":{"status":"InProgress", "assignto__id":"Pawan"}, "count":2, "estefforts":10, "status":"InProgress", "assignto__id":"Pawan"},
                {"_id":{"stat us":"InProgress", "assignto__id":"Sachin"}, "count":2, "estefforts":7, "status":"InProgress", "assignto__id":"Sachin"},
                {"_id":{"status":"InProgress", "assignto__id":"Rohit"}, "count":2, "estefforts":9, "status":"InProgress", "assignto__id":"Rohit"},
                {"_id":{"status":"New", "assignto__id":"Sachin"}, "count":1, "estefforts":5, "status":"New", "assignto__id":"Sachin"},
                {"_id":{"status":"New", "assignto__id":"Ashish"}, "count":2, "estefforts":7, "status":"New", "assignto__id":"Ashish"},
                {"_id":{"status":"New", "assignto__id":"Rohit"}, "count":3, "estefforts":11, "status":"New", "assignto__id":"Rohit"},
                {"_id":{"status":"New", "assignto__id":"Pawan"}, "count":2, "estefforts":8, "st atus":"New", "assignto__id":"Pawan"}
            ]};
            // divide result on base of assignto.
            //remove assign to from result.
            var result = {"result":[
                {"_id":"Ashish", "employee":"Ashish", "tasks":[
                    {"_id":"New", "count":2, "estefforts":7, "status":"New"}
                ]},
                {"_id":"Pawan", "employee":"Pawan", "tasks":[
                    {"_id":"Completed", "count":3, "estefforts":32, "status":"Completed"},
                    {"_id":"InProgress", "count":2, "estefforts":10, "status":"InProgress"},
                    {"_id":"New", "count":2, "estefforts":8, "status":"New"}
                ]},
                {"_id":"Rohit", "employee":"Rohit", "tasks":[
                    {"_id":"Completed", "count":3, "estefforts":32, "status":"Completed"},
                    {"_id":"InProgress", "count":2, "estefforts":9, "status":"InProgress"},
                    {"_id":"New", "count":3, "estefforts":11, "status":"New"}
                ]},
                {"_i d":"Sachin", "employee":"Sachin", "tasks":[
                    {"_id":"Completed", "count":1, "estefforts":10, "status":"Completed"},
                    {"_id":"InProgress", "count":2, "estefforts":7, "status":"InProgress"},
                    {"_id":"New", "count":1, "estefforts":5, "status":"New"}
                ]}
            ]};
        });
    })

    //TODO Restrict field is mandatory in Filter sub query and it can only be one
    describe("State City Relation", function () {

        afterEach(function (done) {
            Testcases.afterEach(done);
        })

        beforeEach(function (done) {
            Testcases.beforeEach(done);
        })

        it("subquery in filter", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection:NorthwindDb.COUNTRIES_TABLE, $insert:NorthwindDb.Countries},
                        {$collection:NorthwindDb.STATES_TABLE, $insert:NorthwindDb.States},
                        {$collection:NorthwindDb.CITIES_TABLE, $insert:NorthwindDb.Cities}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection:"cities",
                        $fields:{city:1},
                        $filter:{
                            "stateid._id":{
                                $query:{
                                    $collection:"states",
                                    $fields:{"_id":1},
                                    $filter:{"countryid._id":"India"}
                                }
                            }
                        },
                        $sort:{city:1}

                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(4);
                    expect(data.result[0]._id).to.eql("Amritsar");
                    expect(data.result[0].city).to.eql("Amritsar");
                    expect(data.result[1]._id).to.eql("Bathinda");
                    expect(data.result[1].city).to.eql("Bathinda");
                    expect(data.result[2]._id).to.eql("Hisar");
                    expect(data.result[2].city).to.eql("Hisar");
                    expect(data.result[3]._id).to.eql("Sirsa");
                    expect(data.result[3].city).to.eql("Sirsa");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
            //step1: get state where countryid India in doQuery
            //subquery module check $fields has jsobobject of $query
            //query after sub query module
            var query1 = {
                $collcetion:"states",
                $fields:{"_id":1},
                $filter:{"countryid._id":"India"}
            }
            //get employee data
            var states = {"result":[
                {"_id":"Haryana"},
                {"_id":"Punjab"}
            ]};
            // doresult of sub uqery module.
            var query2 = {
                $collection:"cities",
                $fields:{city:1},
                $filter:{
                    "stateid._id":{$in:["Haryana", "Punjab"]}
                },
                $sort:{city:1}
            };

            var result = {"result":[
                {"_id":"Amritsar", "city":"Amritsar"},
                {"_id":"Bathinda", "city":"Bathinda"},
                {"_id":"Hisar", "city":"Hisar"},
                {"_id":"Sirsa", "city":"Sirsa"}
            ]};
        });

        it("subquery in filter with group", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection:NorthwindDb.COUNTRIES_TABLE, $insert:NorthwindDb.Countries},
                        {$collection:NorthwindDb.STATES_TABLE, $insert:NorthwindDb.States},
                        {$collection:NorthwindDb.CITIES_TABLE, $insert:NorthwindDb.Cities}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection:"cities",
                        $fields:{city:1},
                        $group:{_id:null, count:{$sum:1}},
                        $filter:{
                            "stateid._id":{
                                $query:{
                                    $collection:"states",
                                    $fields:{"_id":1},
                                    $filter:{"countryid._id":"India"}
                                }
                            }
                        },
                        $sort:{city:1}

                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0]._id).to.eql(null);
                    expect(data.result[0].count).to.eql(4);
                    expect(data.result[0].children).to.have.length(4);
                    expect(data.result[0].children[0]._id).to.eql("Amritsar");
                    expect(data.result[0].children[0].city).to.eql("Amritsar");
                    expect(data.result[0].children[1]._id).to.eql("Bathinda");
                    expect(data.result[0].children[1].city).to.eql("Bathinda");
                    expect(data.result[0].children[2]._id).to.eql("Hisar");
                    expect(data.result[0].children[2].city).to.eql("Hisar");
                    expect(data.result[0].children[3]._id).to.eql("Sirsa");
                    expect(data.result[0].children[3].city).to.eql("Sirsa");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })
        });

        it("subquery With blank fields", function (done) {
            var db = undefined;
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    db = db1;
                    return  db.mongoUpdate([
                        {$collection:NorthwindDb.COUNTRIES_TABLE, $insert:NorthwindDb.Countries},
                        {$collection:NorthwindDb.STATES_TABLE, $insert:NorthwindDb.States},
                        {$collection:NorthwindDb.CITIES_TABLE, $insert:NorthwindDb.Cities}
                    ])
                }).then(
                function () {
                    var query = {
                        $collection:"cities",
                        $fields:{},
                        $sort:{city:1}

                    };
                    return db.query(query);
                }).then(
                function (data) {
//                    console.log("data>>>>>>>>>>" + JSON.stringify(data));
                    expect(data.result).to.have.length(6);
                    expect(data.result[0]._id).to.eql("Amritsar");
                    expect(data.result[0].city).to.eql("Amritsar");
                    expect(data.result[1]._id).to.eql("Bathinda");
                    expect(data.result[1].city).to.eql("Bathinda");
                    expect(data.result[2]._id).to.eql("Hisar");
                    expect(data.result[2].city).to.eql("Hisar");
                    expect(data.result[3]._id).to.eql("Iceland");
                    expect(data.result[3].city).to.eql("Iceland");
                    expect(data.result[4]._id).to.eql("Sirsa");
                    expect(data.result[4].city).to.eql("Sirsa");
                    expect(data.result[5]._id).to.eql("Skyland");
                    expect(data.result[5].city).to.eql("Skyland");
                }).then(
                function () {
                    done();
                }).fail(function (e) {
                    done(e);
                })

            var expectedResult = {"result":[
                {"_id":"Amritsar", "city":"Amritsar", "code":"19992", "stateid":{"_id":"Punjab", "state":"Punjab"}},
                {"_id":"Bathinda", "city":"Bathinda", "code":"011", "stateid":{"_id":"Punjab", "state":"Punjab"}},
                {"_id":"Hisar", "city":"Hisar", "code":"01662", "stateid":{"_id":"Haryana", "state":"Hary ana"}},
                {"_id":"Iceland", "city":"Iceland", "code":"11111", "stateid":{"_id":"Newyork", "state":"Newyork"}},
                {"_id":"Sirsa", "city":"Sirsa", "code":"01662", "stateid":{"_id":"Haryana", "state":"Haryana"}},
                {"_id":"Skyland", "city":"Skyland", "code":"1101662", "stateid":{"_id":"Newyork", "state":"Newyork"}}
            ]};
        });

    })
})


// mocha --recursive --timeout 150000 -g "movie - single,person - single tag" --reporter spec
describe("State country test case", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("country state joining subquery timing test", function (done) {
        var db = undefined;
        var countrycount = 50;
        var statecount = countrycount * 5;
        var neighbourcount = countrycount - 2;

        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var countryCollectionsToRegister = [];
                for (var i = 1; i <= countrycount; i++) {
                    var record = {"_id":i, "countryName":"country" + i, countryCode:"+" + i};
                    countryCollectionsToRegister.push(record);
                }

                var stateCollectionsToRegister = [];
                var j = 1;
                for (var i = 1; i <= statecount; i++) {

                    var record = {"_id":i, "stateName":"state" + i, "stateCode":"0" + i, "countryID":{$query:{countryName:"country" + j}},
                        neighbourCountries:[
                            {$query:{countryName:"country" + ((j % neighbourcount) + 1)}},
                            {$query:{countryName:"country" + ((j % neighbourcount) + 2)}},
                            {$query:{countryName:"country" + ((j % neighbourcount) + 3)}}
                        ]};
                    stateCollectionsToRegister.push(record);

                    i++;

                    var record = {"_id":i, "stateName":"state" + i, "stateCode":"0" + i, "countryID":{$query:{countryName:"country" + j}},
                        neighbourCountries:[
                            {$query:{countryName:"country" + ((j % neighbourcount) + 1)}},
                            {$query:{countryName:"country" + ((j % neighbourcount) + 2)}},
                            {$query:{countryName:"country" + ((j % neighbourcount) + 3)}}
                        ]};
                    stateCollectionsToRegister.push(record);

                    i++;

                    var record = {"_id":i, "stateName":"state" + i, "stateCode":"0" + i, "countryID":{$query:{countryName:"country" + j}},
                        neighbourCountries:[
                            {$query:{countryName:"country" + ((j % neighbourcount) + 1)}},
                            {$query:{countryName:"country" + ((j % neighbourcount) + 2)}},
                            {$query:{countryName:"country" + ((j % neighbourcount) + 3)}}
                        ]};
                    stateCollectionsToRegister.push(record);

                    i++;

                    var record = {"_id":i, "stateName":"state" + i, "stateCode":"0" + i, "countryID":{$query:{countryName:"country" + j}},
                        neighbourCountries:[
                            {$query:{countryName:"country" + ((j % neighbourcount) + 1)}},
                            {$query:{countryName:"country" + ((j % neighbourcount) + 2)}},
                            {$query:{countryName:"country" + ((j % neighbourcount) + 3)}}
                        ]};
                    stateCollectionsToRegister.push(record);

                    i++;

                    var record = {"_id":i, "stateName":"state" + i, "stateCode":"0" + i, "countryID":{$query:{countryName:"country" + j}},
                        neighbourCountries:[
                            {$query:{countryName:"country" + ((j % neighbourcount) + 1)}},
                            {$query:{countryName:"country" + ((j % neighbourcount) + 2)}},
                            {$query:{countryName:"country" + ((j % neighbourcount) + 3)}}
                        ]};
                    stateCollectionsToRegister.push(record);


                    j++;
                }


                var updates =
                        [
                            {$collection:"countries", $insert:countryCollectionsToRegister},
                            {$collection:{collection:"states", fields:[
                                {field:"stateName", type:"string"},
                                {field:"code", type:"number"},
                                {field:"countryID", type:"fk", collection:"countries", set:["countryName"]},
                                {field:"neighbourCountries", type:"fk", collection:"countries", set:["countryName"], multiple:true}
                            ]}, $insert:stateCollectionsToRegister}
                        ]
                    ;
                return db.update(updates);
            }).then(
            function (data) {
                return db.query({"$collection":"countries", $sort:{"_uid":1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(countrycount);
//                console.log("result>>>>>>  " +JSON.stringify(data.result) )
                return db.query({"$collection":"states", $sort:{country:1}});
            }).then(
            function (data) {
//                console.log("result>>>>>>  " +JSON.stringify(data.result) )
                expect(data.result).to.have.length(statecount);
                expect(data.result[1].stateName).to.eql("state2");
                expect(data.result[1].countryID.countryName).to.eql("country1");

            }).then(
            function () {
                var collectionRegister = [
                    {$collection:"pl.collections", $insert:[
                        {"collection":"countries"},
                        {"collection":"states"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"countryName", type:"string", collectionid:{$query:{collection:"countries"}}},
                        {field:"countryCode", type:"number", collectionid:{$query:{collection:"countries"}}},
                        {field:"stateName", type:"string", collectionid:{$query:{collection:"states"}}},
                        {field:"code", type:"number", collectionid:{$query:{collection:"states"}}},
                        {field:"countryID", type:"fk", collectionid:{$query:{collection:"states"}}, collection:"countries", set:["countryName"]},
                        {field:"neighbourCountries", type:"fk", collectionid:{$query:{collection:"states"}}, collection:"countries", set:["countryName"], multiple:true}
                    ]}
                ]

                return db.update(collectionRegister);

            }).then(
            function (data) {
                //query 1:apply on states and print the country name & code through fk....
                db.mongoTime = {};
                return db.query({$collection:"states", $fields:{"countryID.countryName":1, "countryID.countryCode":1}});
            }).then(
            function () {
                console.log("query 1 timing>>>>>>" + JSON.stringify(db.mongoTime.SubQueryResultCount));
//                console.log("query 1 timing>>>>>>"+JSON.stringify(db.mongoTime));
                //exepectation of time taken by the subquery -- db.mongoTime.Subquery that is is less than 50ms
                // set the mongoTime  db.mongoTime = {}
                expect(db.mongoTime.SubQueryResultCount).to.be.below(50);
                db.mongoTime = {};
                //query 2: apply on states and print the neighbour country name & code through fk....
                return db.query({$collection:"states", $fields:{"neighbourCountries.countryName":1, "neighbourCountries.countryCode":1}});
            }).then(
            function () {
                console.log("query 2 timing>>>>>>" + JSON.stringify(db.mongoTime.SubQueryResultCount));
                expect(db.mongoTime.SubQueryResultCount).to.be.below(50);
                db.mongoTime = {};

                //query 3: query on country sub query on state for country name...
                return db.query({$collection:"countries", $fields:{"countryName":1, "countryCode":1,
                    "states":{$type:"n-rows", $query:{$collection:"states", $fields:{"stateName":1}}, $fk:"countryID"}
                }})
            }).then(
            function (data) {
//                console.log("query 3 >>>>>>"+JSON.stringify(data.result));
                console.log("query 3 timing>>>>>>" + JSON.stringify(db.mongoTime.SubQueryResultCount));
                expect(db.mongoTime.SubQueryResultCount).to.be.below(50);
                db.mongoTime = {};

                //query 4: query on country sub query on state for country name...
                return db.query({$collection:"countries", $fields:{"countryName":1,
                    "neighbours":{$query:{$collection:"states", $fields:{"neighbourCountries.countryName":1}, $type:"n-rows"}, $fk:"neighbourCountries"}
                }})
            }).then(
            function (data) {
//                console.log("query 4 >>>>>>"+JSON.stringify(data.result));
                console.log("query 4 timing>>>>>>" + JSON.stringify(db.mongoTime.SubQueryResultCount));
                expect(db.mongoTime.SubQueryResultCount).to.be.below(50);
                db.mongoTime = {};

                //query 5:
                return db.query({$collection:"countries", $fields:{"countryName":1,
                    "neighbours":{$query:{$collection:"states", $fields:{"neighbourCountries.countryName":1}}, $fk:"countryID"}
                }})
            }).then(
            function (data) {
//                console.log("query 5 >>>>>>"+JSON.stringify(data.result));
                console.log("query 5 timing>>>>>>" + JSON.stringify(db.mongoTime.SubQueryResultCount));
                expect(db.mongoTime.SubQueryResultCount).to.be.below(50);
                db.mongoTime = {};
//                console.log("query 1 >>>>>> " + JSON.stringify(data));
                done();
            }).fail(function (err) {
                done(err);
            });
    })
})


describe("find relation between person and movie using tag collection", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })


    it("movie - single,person - single tag", function (done) {
        db = undefined;
        var tagSchema = {collection:"tagscollection", fields:[
            {"field":"tag", "type":"string"}
        ]};

        var personSchema = {collection:"person", fields:[
            {"field":"name", "type":"string"},
            {"field":"tag", "type":"fk", collection:"tagscollection", set:["tag"]}
        ]};

        var movieSchema = {collection:"movies", fields:[
            {"field":"name", "type":"string"},
            {"field":"tags", "type":"fk", collection:"tagscollection", set:["tag"]}
        ]};

        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var datainsert = [
                    {$collection:tagSchema, $insert:[
                        {"_id":1, "tag":"awesome"},
                        {"_id":2, "tag":"dark"},
                        {"_id":3, "tag":"comedy"},
                        {"_id":4, "tag":"suspence"},
                        {"_id":5, "tag":"thriller"},
                        {"_id":6, "tag":"horror"},
                        {"_id":7, "tag":"adventure"},
                        {"_id":8, "tag":"classic"},
                        {'_id':9, "tag":"animation"},
                        {"_id":10, "tag":"romentic"}
                    ]},
                    {$collection:personSchema, $insert:[
                        {_id:"p1", name:"sourabh", tag:{$query:{"tag":"suspence"}}},
                        {_id:"p2", name:"shubham", tag:{$query:{"tag":"horror"}}},
                        {_id:"p3", name:"deepak", tag:{$query:{"tag":"comedy"}}},
                        {_id:"p4", name:"ritesh", tag:{$query:{"tag":"suspence"}}},
                        {_id:"p5", name:"naveen", tag:{$query:{"tag":"thriller"}}},
                        {_id:"p6", name:"manjeet", tag:{$query:{"tag":"animation"}}},
                        {_id:"p7", name:"ashu", tag:{$query:{"tag":"classic"}}},
                        {_id:"p8", name:"kapil", tag:{$query:{"tag":"dark"}}},
                        {_id:"p9", name:"praveen", tag:{$query:{"tag":"adventure"}}},
                        {_id:"p10", name:"rohit", tag:{$query:{"tag":"suspence"}}},
                        {_id:"p11", name:"sumit", tag:{$query:{"tag":"romentic"}}}
                    ]},
                    {$collection:movieSchema, $insert:[
                        {_id:"m1", name:"sherlok holmes", tags:{$query:{"tag":"suspence"}}},
                        {_id:"m2", name:"twilight", tags:{$query:{"tag":"romentic"}}},
                        {_id:"m3", name:"die hard", tags:{$query:{"tag":"adventure"}}},
                        {_id:"m4", name:"romeo", tags:{$query:{"tag":"classic"}}},
                        {_id:"m5", name:"batman", tags:{$query:{"tag":"dark"}}},
                        {_id:"m6", name:"the ring", tags:{$query:{"tag":"horror"}}},
                        {_id:"m7", name:"yes man", tags:{$query:{"tag":"comedy"}}},
                        {_id:"m8", name:"mirror", tags:{$query:{"tag":"horror"}}},
                        {_id:"m9", name:"national treasure", tags:{$query:{"tag":"suspence"}}},
                        {_id:"m10", name:"mind game", tags:{$query:{"tag":"suspence"}}},
                        {_id:"m11", name:"hitman", tags:{$query:{"tag":"dark"}}}
                    ]}
                ];

                return db.update(datainsert);
            }).then(
            function () {
                return db.query({$collection:personSchema });
            }).then(
            function (data) {
//                console.log("person data >>>>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(11);
                expect(data.result[0].name).to.eql("sourabh");
                expect(data.result[0].tag.tag).to.eql("suspence");
                expect(data.result[0].tag._id).to.eql(4);
                expect(data.result[3].name).to.eql("ritesh");
                expect(data.result[3].tag.tag).to.eql("suspence");
                expect(data.result[3].tag._id).to.eql(4);
                expect(data.result[10].name).to.eql("sumit");
                expect(data.result[10].tag.tag).to.eql("romentic");
                expect(data.result[10].tag._id).to.eql(10);

                return db.query({$collection:movieSchema });
            }).then(
            function (data) {
//                console.log("movie data >>>>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(11);
                expect(data.result[0].name).to.eql("sherlok holmes");
                expect(data.result[0].tags.tag).to.eql("suspence");
                expect(data.result[0].tags._id).to.eql(4);
                expect(data.result[5].name).to.eql("the ring");
                expect(data.result[5].tags.tag).to.eql("horror");
                expect(data.result[8].name).to.eql("national treasure");
                expect(data.result[8].tags.tag).to.eql("suspence");


                return db.query({$collection:personSchema, $fields:{name:1, tag:1,
                    movies:{$type:"n-rows", $query:{$collection:movieSchema, $fields:{name:1, "tags":1}, $sort:{"name":1}}, $fk:"tags", $parent:"tag"}}
                })

            }).then(
            function (data) {
//                console.log("query Result >>>>>>>>" + JSON.stringify(data.result));
                expect(data.result[0].movies).to.have.length(3);
                expect(data.result[0].movies[0].name).to.eql('mind game');
                expect(data.result[0].movies[1].name).to.eql('national treasure');
                expect(data.result[0].movies[2].name).to.eql('sherlok holmes');
                expect(data.result[1].movies).to.have.length(2);
                expect(data.result[1].movies[0].name).to.eql('mirror');
                expect(data.result[1].movies[1].name).to.eql('the ring');
                expect(data.result[2].movies).to.have.length(1);
                expect(data.result[2].movies[0].name).to.eql('yes man');
                expect(data.result[3].movies).to.have.length(3);
                expect(data.result[3].movies[0].name).to.eql('mind game');
                expect(data.result[3].movies[1].name).to.eql('national treasure');
                expect(data.result[3].movies[2].name).to.eql('sherlok holmes');
                expect(data.result[4].movies).to.have.empty;
                expect(data.result[5].movies).to.have.empty;
                expect(data.result[6].movies).to.have.length(1);
                expect(data.result[6].movies[0].name).to.eql('romeo');
                expect(data.result[7].movies).to.have.length(2);
                expect(data.result[7].movies[0].name).to.eql('batman');
                expect(data.result[7].movies[1].name).to.eql('hitman');
                expect(data.result[8].movies).to.have.length(1);
                expect(data.result[8].movies[0].name).to.eql('die hard')
                expect(data.result[9].movies).to.have.length(3);
                expect(data.result[9].movies[0].name).to.eql('mind game');
                expect(data.result[9].movies[1].name).to.eql('national treasure');
                expect(data.result[9].movies[2].name).to.eql('sherlok holmes');
                expect(data.result[10].movies).to.have.length(1);
                expect(data.result[10].movies[0].name).to.eql('twilight')

            }).then(
            function (data) {
                done();
            }).fail(function (err) {
                done(err);
            })

    });

    it("movie : multiple,person :single tag", function (done) {
        db = undefined;
        var tagSchema = {collection:"tagscollection", fields:[
            {"field":"tag", "type":"string"}
        ]};

        var personSchema = {collection:"person", fields:[
            {"field":"name", "type":"string"},
            {"field":"tag", "type":"fk", collection:"tagscollection", set:["tag"]}
        ]};

        var movieSchema = {collection:"movies", fields:[
            {"field":"name", "type":"string"},
            {"field":"tags", "type":"fk", collection:"tagscollection", set:["tag"], multiple:true}
        ]};

        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var datainsert = [
                    {$collection:tagSchema, $insert:[
                        {"_id":1, "tag":"awesome"},
                        {"_id":2, "tag":"dark"},
                        {"_id":3, "tag":"comedy"},
                        {"_id":4, "tag":"suspence"},
                        {"_id":5, "tag":"thriller"},
                        {"_id":6, "tag":"horror"},
                        {"_id":7, "tag":"adventure"},
                        {"_id":8, "tag":"classic"},
                        {'_id':9, "tag":"animation"},
                        {"_id":10, "tag":"romentic"}
                    ]},
                    {$collection:personSchema, $insert:[
                        {_id:"p1", name:"sourabh", tag:{$query:{"tag":"suspence"}}},
                        {_id:"p2", name:"shubham", tag:{$query:{"tag":"horror"}}},
                        {_id:"p3", name:"deepak", tag:{$query:{"tag":"comedy"}}},
                        {_id:"p4", name:"ritesh", tag:{$query:{"tag":"suspence"}}},
                        {_id:"p5", name:"naveen", tag:{$query:{"tag":"thriller"}}},
                        {_id:"p6", name:"manjeet", tag:{$query:{"tag":"animation"}}},
                        {_id:"p7", name:"ashu", tag:{$query:{"tag":"classic"}}},
                        {_id:"p8", name:"kapil", tag:{$query:{"tag":"dark"}}},
                        {_id:"p9", name:"praveen", tag:{$query:{"tag":"adventure"}}},
                        {_id:"p10", name:"rohit", tag:{$query:{"tag":"suspence"}}},
                        {_id:"p11", name:"sumit", tag:{$query:{"tag":"romentic"}}}
                    ]},
                    {$collection:movieSchema, $insert:[
                        {_id:"m1", name:"sherlok holmes", tags:[
                            {$query:{"tag":"suspence"}},
                            {$query:{"tag":"dark"}},
                            {$query:{"tag":"adventure"}}
                        ]},
                        {_id:"m2", name:"sherk", tags:[
                            {$query:{"tag":"romentic"}},
                            {$query:{"tag":"animation"}},
                            {$query:{"tag":"comedy"}}
                        ]},
                        {_id:"m3", name:"die hard", tags:[
                            {$query:{"tag":"adventure"}},
                            {$query:{"tag":"thriller"}}
                        ]},
                        {_id:"m4", name:"romeo", tags:[
                            {$query:{"tag":"romentic"}},
                            {$query:{"tag":"classic"}}
                        ]},
                        {_id:"m5", name:"batman", tags:[
                            {$query:{"tag":"adventure"}},
                            {$query:{"tag":"dark"}},
                            {$query:{"tag":"suspence"}},
                            {$query:{"tag":"classic"}},
                            {$query:{"tag":"romentic"}},
                            {$query:{"tag":"thriller"}}
                        ]},
                        {_id:"m6", name:"caption america", tags:[
                            {$query:{"tag":"adventure"}},
                            {$query:{"tag":"dark"}},
                            {$query:{"tag":"suspence"}},
                            {$query:{"tag":"thriller"}},
                            {$query:{"tag":"romentic"}},
                            {$query:{"tag":"comedy"}}
                        ]}
                    ]}
                ]


                return db.update(datainsert);
            }).then(
            function () {
                return db.query({$collection:personSchema });
            }).then(
            function (data) {
//                console.log("person data >>>>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(11);
                expect(data.result[0].name).to.eql("sourabh");
                expect(data.result[0].tag.tag).to.eql("suspence");
                expect(data.result[0].tag._id).to.eql(4);
                expect(data.result[3].name).to.eql("ritesh");
                expect(data.result[3].tag.tag).to.eql("suspence");
                expect(data.result[3].tag._id).to.eql(4);
                expect(data.result[10].name).to.eql("sumit");
                expect(data.result[10].tag.tag).to.eql("romentic");
                expect(data.result[10].tag._id).to.eql(10);

                return db.query({$collection:movieSchema });
            }).then(
            function (data) {
//                console.log("movie data >>>>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(6);
                expect(data.result[0].name).to.eql("sherlok holmes");
                expect(data.result[0].tags[0].tag).to.eql("suspence");
                expect(data.result[0].tags[0]._id).to.eql(4);
                expect(data.result[0].tags[2].tag).to.eql("adventure");
                expect(data.result[0].tags[2]._id).to.eql(7);
                expect(data.result[4].name).to.eql("batman");
                expect(data.result[4].tags[1].tag).to.eql("dark");
                expect(data.result[4].tags[1]._id).to.eql(2);
                expect(data.result[4].tags[4].tag).to.eql("romentic");
                expect(data.result[4].tags[4]._id).to.eql(10);

                return db.query({$collection:personSchema, $fields:{name:1, tag:1,
                    movies:{$type:"n-rows", $query:{$collection:movieSchema, $fields:{name:1, "tags":1}, $sort:"name"}, $fk:"tags", $parent:"tag"}
                }})

            }).then(
            function (data) {
//                console.log("query Result >>>>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(11);
                expect(data.result[0].movies).to.have.length(3);
                expect(data.result[0].movies[0].name).to.eql('batman');
                expect(data.result[0].movies[1].name).to.eql('caption america');
                expect(data.result[0].movies[2].name).to.eql('sherlok holmes');
                expect(data.result[1].movies).to.have.empty;
                expect(data.result[2].movies).to.have.length(2);
                expect(data.result[2].movies[0].name).to.eql('caption america');
                expect(data.result[2].movies[1].name).to.eql('sherk');
                expect(data.result[3].movies).to.have.length(3);
                expect(data.result[3].movies[0].name).to.eql('batman');
                expect(data.result[3].movies[1].name).to.eql('caption america');
                expect(data.result[3].movies[2].name).to.eql('sherlok holmes');
                expect(data.result[4].movies).to.have.length(3);
                expect(data.result[4].movies[0].name).to.eql('batman');
                expect(data.result[4].movies[1].name).to.eql('caption america');
                expect(data.result[4].movies[2].name).to.eql('die hard');
                expect(data.result[5].movies).to.have.length(1);
                expect(data.result[5].movies[0].name).to.eql('sherk');
                expect(data.result[6].movies).to.have.length(2);
                expect(data.result[6].movies[0].name).to.eql('batman');
                expect(data.result[6].movies[1].name).to.eql('romeo');
                expect(data.result[7].movies).to.have.length(3);
                expect(data.result[7].movies[0].name).to.eql('batman');
                expect(data.result[7].movies[1].name).to.eql('caption america');
                expect(data.result[7].movies[2].name).to.eql('sherlok holmes');
                expect(data.result[8].movies).to.have.length(4);
                expect(data.result[8].movies[0].name).to.eql('batman');
                expect(data.result[8].movies[1].name).to.eql('caption america');
                expect(data.result[8].movies[2].name).to.eql('die hard');
                expect(data.result[8].movies[3].name).to.eql('sherlok holmes');
                expect(data.result[9].movies).to.have.length(3);
                expect(data.result[9].movies[0].name).to.eql('batman');
                expect(data.result[9].movies[1].name).to.eql('caption america');
                expect(data.result[9].movies[2].name).to.eql('sherlok holmes');
                expect(data.result[10].movies).to.have.length(4);
                expect(data.result[10].movies[0].name).to.eql('batman');
                expect(data.result[10].movies[1].name).to.eql('caption america');
                expect(data.result[10].movies[2].name).to.eql('romeo');
                expect(data.result[10].movies[3].name).to.eql('sherk');

            }).then(
            function (data) {
                done();
            }).fail(function (err) {
                done(err);
            })

    });

    it("movie : multiple,person :multiple tag", function (done) {
        db = undefined;
        var tagSchema = {collection:"tagscollection", fields:[
            {"field":"tag", "type":"string"}
        ]};

        var personSchema = {collection:"person", fields:[
            {"field":"name", "type":"string"},
            {"field":"tags", "type":"fk", collection:"tagscollection", set:["tag"], multiple:true}
        ]};

        var movieSchema = {collection:"movies", fields:[
            {"field":"name", "type":"string"},
            {"field":"tags", "type":"fk", collection:"tagscollection", set:["tag"], multiple:true}
        ]};

        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var datainsert = [
                    {$collection:tagSchema, $insert:[
                        {"_id":1, "tag":"awesome"},
                        {"_id":2, "tag":"dark"},
                        {"_id":3, "tag":"comedy"},
                        {"_id":4, "tag":"suspence"},
                        {"_id":5, "tag":"thriller"},
                        {"_id":6, "tag":"horror"},
                        {"_id":7, "tag":"adventure"},
                        {"_id":8, "tag":"classic"},
                        {'_id':9, "tag":"animation"},
                        {"_id":10, "tag":"romentic"}
                    ]},
                    {$collection:personSchema, $insert:[
                        {_id:"p1", name:"sourabh", tags:[
                            {$query:{"tag":"suspence"}},
                            {$query:{"tag":"horror"}}
                        ]},
                        {_id:"p2", name:"shubham", tags:[
                            {$query:{"tag":"horror"}},
                            {$query:{"tag":"classic"}}
                        ]},
                        {_id:"p3", name:"deepak", tags:[
                            {$query:{"tag":"comedy"}},
                            {$query:{"tag":"romentic"}}
                        ]},
                        {_id:"p4", name:"ritesh", tags:[
                            {$query:{"tag":"suspence"}},
                            {$query:{"tag":"romentic"}}
                        ]},
                        {_id:"p5", name:"naveen", tags:[
                            {$query:{"tag":"thriller"}},
                            {$query:{"tag":"dark"}},
                            {$query:{"tag":"adventure"}}
                        ]},
                        {_id:"p6", name:"manjeet", tags:[
                            {$query:{"tag":"animation"}}
                        ]}
                    ]},
                    {$collection:movieSchema, $insert:[
                        {_id:"m1", name:"sherlok holmes", tags:[
                            {$query:{"tag":"suspence"}},
                            {$query:{"tag":"dark"}},
                            {$query:{"tag":"adventure"}}
                        ]},
                        {_id:"m2", name:"sherk", tags:[
                            {$query:{"tag":"romentic"}},
                            {$query:{"tag":"animation"}},
                            {$query:{"tag":"comedy"}}
                        ]},
                        {_id:"m3", name:"die hard", tags:[
                            {$query:{"tag":"adventure"}},
                            {$query:{"tag":"thriller"}}
                        ]},
                        {_id:"m4", name:"the ring", tags:[
                            {$query:{"tag":"horror"}},
                            {$query:{"tag":"suspence"}}
                        ]},
                        {_id:"m5", name:"batman", tags:[
                            {$query:{"tag":"adventure"}},
                            {$query:{"tag":"dark"}},
                            {$query:{"tag":"suspence"}},
                            {$query:{"tag":"classic"}},
                            {$query:{"tag":"romentic"}},
                            {$query:{"tag":"thriller"}}
                        ]}
                    ]}
                ]


                return db.update(datainsert);
            }).then(
            function () {
                return db.query({$collection:personSchema });
            }).then(
            function (data) {
//                console.log("person data >>>>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(6);
                expect(data.result[0].name).to.eql("sourabh");
                expect(data.result[0].tags[1].tag).to.eql("horror");
                expect(data.result[0].tags[0]._id).to.eql(4);
                expect(data.result[3].name).to.eql("ritesh");
                expect(data.result[3].tags[0].tag).to.eql("suspence");
                expect(data.result[3].tags[1]._id).to.eql(10);
                expect(data.result[5].name).to.eql("manjeet");
                expect(data.result[5].tags[0].tag).to.eql("animation");
                expect(data.result[5].tags[0]._id).to.eql(9);

                return db.query({$collection:movieSchema });
            }).then(
            function (data) {
//                console.log("movie data >>>>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(5);
                expect(data.result[0].name).to.eql("sherlok holmes");
                expect(data.result[0].tags[0].tag).to.eql("suspence");
                expect(data.result[0].tags[0]._id).to.eql(4);
                expect(data.result[0].tags[2].tag).to.eql("adventure");
                expect(data.result[0].tags[2]._id).to.eql(7);
                expect(data.result[4].name).to.eql("batman");
                expect(data.result[4].tags[1].tag).to.eql("dark");
                expect(data.result[4].tags[1]._id).to.eql(2);
                expect(data.result[4].tags[4].tag).to.eql("romentic");
                expect(data.result[4].tags[4]._id).to.eql(10);

                return db.query({$collection:personSchema, $fields:{name:1, tags:1,
                    movies:{$type:"n-rows", $query:{$collection:movieSchema, $fields:{name:1, "tags":1}, $sort:{name:1}}, $fk:"tags", $parent:"tags"}
                }});
            }).then(
            function (data) {
//                console.log("query Result >>>>>>>>" + JSON.stringify(data.result));

                expect(data.result).to.have.length(6);
                expect(data.result[0].movies).to.have.length(4);
                expect(data.result[0].movies[0].name).to.eql('batman');
                expect(data.result[0].movies[1].name).to.eql('sherlok holmes');
                expect(data.result[0].movies[2].name).to.eql('the ring');
                expect(data.result[0].movies[3].name).to.eql('the ring');
                expect(data.result[1].movies).to.have.length(2);
                expect(data.result[1].movies[0].name).to.eql('the ring');
                expect(data.result[1].movies[1].name).to.eql('batman');
                expect(data.result[2].movies).to.have.length(3);
                expect(data.result[2].movies[0].name).to.eql('sherk');
                expect(data.result[2].movies[1].name).to.eql('batman');
                expect(data.result[2].movies[2].name).to.eql('sherk');
                expect(data.result[3].movies).to.have.length(5);
                expect(data.result[3].movies[0].name).to.eql('batman');
                expect(data.result[3].movies[1].name).to.eql('sherlok holmes');
                expect(data.result[3].movies[2].name).to.eql('the ring');
                expect(data.result[3].movies[3].name).to.eql('batman');
                expect(data.result[3].movies[4].name).to.eql('sherk');
                expect(data.result[4].movies).to.have.length(7);
                expect(data.result[4].movies[0].name).to.eql('batman');
                expect(data.result[4].movies[1].name).to.eql('die hard');
                expect(data.result[4].movies[2].name).to.eql('batman');
                expect(data.result[4].movies[3].name).to.eql('sherlok holmes');
                expect(data.result[4].movies[4].name).to.eql('batman');
                expect(data.result[4].movies[5].name).to.eql('die hard');
                expect(data.result[4].movies[6].name).to.eql('sherlok holmes');
                expect(data.result[5].movies).to.have.length(1);
                expect(data.result[5].movies[0].name).to.eql('sherk');

            }).then(
            function (data) {
                done();
            }).fail(function (err) {
                done(err);
            })

    });
})