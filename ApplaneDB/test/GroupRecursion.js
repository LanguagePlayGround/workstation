/**
 *
 * mocha --recursive --timeout 150000 -g "Grouprecursion testcase" --reporter spec
 *
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 14/11/14
 * Time: 1:09 PM
 * To change this template use File | Settings | File Templates.
 *
 *
 * accountsss
 *  name :string
 *  code : string
 *  parent_account_id  :accountsss, setfield:name
 *
 * voucherlineitemsss
 *      account_id
 *      amount : currency
 *
 *
 *   accountsss
 *   name           code            parent_account_id
 *    asset          asset1          null
 *   current asset                   asset
 *   cash                           current asset
 *   bank                           current asset
 *   fixed asset                    asset
 *   building                       fixed asset
 *   furniture                      fixed asset
 *   liab                           null
 *   current liab                   liab
 *   creditors                      current liab
 *   bank over draft                current liab
 *   fixed liab                     liab
 *   debentures                     fixed liab
 *   loan                           fixed liab
 *
 *
 * *   liab : 1020      code:liab1
 *      currnet liab      950
 *          bank overdraft     700 inr
 *          creditors          250 inr
 *
 *      fixed liab             70
 *          loan                50
 *          debentures          20
 *   asset   450 inr
 *      fixed asset 300 in
 *          furniture     200 inr
 *          bulding       100 inr
 *      current asset 150 inr
 *           bank   100 inr
 *           cash : 50 inr

 voucherlineitemsss : $collection : vlis
 account_id  :fk accountsss, setname : name,displayField:name
 code : parent -> account_id
 amount  :currency

 query
 $collection  :"vouhcerlineitems"
 $group : {
            _id:$account_id
            amount :{$sum:"$amount"}
            $recursion
                {
                     "account_id.parent_account_id":"_id"
                      $rollup:[{amount:{$sum:"$amount"},type:{$first:"$type"}}]
                        $sort :{amount.total.amount:-1}
                }
            $fields:false
        }

 *
 *

 *
 *  voucherlineitemsss
 *      accountid               amount
 *      cash                    20 inr
 *      cash                    30 inr
 *      bank                    50 inr
 *      bank                    50 inr
 *      builidng                100 inr
 *      furniture               200 inr
 *      creditors               100 inr
 *      creditor                100 inr
 *      creditrs                50 inr
 *      bank overdraft          200 inr
 *      bank overdrat           500 inr
 *      loan                    50 inr
 *      debenruew               10 inr
 *      debenture               10 inr
 *
 */
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require("./NorthwindDb.js");
var expect = require('chai').expect;
var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../lib/Constants.js");
var Testcases = require("./TestCases.js");

describe("Grouprecursion testcase", function () {

    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    afterEach(function (done) {
        Testcases.afterEach(done);
    })


    it("Recursion with sort", function (done) {
        var db = undefined;
        var rohitDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefinition = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "accountsss"},
                        {collection: "voucherlineitemsss"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "name", type: "string", collectionid: {$query: {collection: "accountsss"}}, visibility: true},
                        {field: "code", type: "string", collectionid: {$query: {collection: "accountsss"}}, visibility: true},
                        {field: "parent_account_id", type: "fk", collectionid: {$query: {collection: "accountsss"}}, collection: "accountsss", set: ["name"]},
                        {field: "account_id", label: "Location", type: "fk", collectionid: {$query: {collection: "voucherlineitemsss"}}, collection: "accountsss", displayField: "name", set: ["name"], visibility: true},
                        {field: "code", type: "string", parentfieldid: {$query: {field: "account_id", collectionid: {$query: {collection: "voucherlineitemsss"}}}}, collectionid: {$query: {collection: "voucherlineitemsss"}}, visibility: true},
                        {field: "amount", type: "currency", collectionid: {$query: {collection: "voucherlineitemsss"}}, visibility: true}

                    ]}
                ];
                return db.update(collectionDefinition);
            }).then(
            function () {
                return db.update({$collection: "pl.currencies", $insert: [
                    {type: "INR"}
                ]});
            }).then(
            function () {
                return db.update({$collection: "accountsss", $insert: [
                    {"name": "asset", "code": "asset1"},
                    {"name": "current asset", "code": "asset2", parent_account_id: {$query: {name: "asset"}}},
                    {"name": "cash", "code": "asset3", parent_account_id: {$query: {name: "current asset"}}},
                    {"name": "bank", "code": "asset4", parent_account_id: {$query: {name: "current asset"}}},
                    {"name": "fixed asset", "code": "asset5", parent_account_id: {$query: {name: "asset"}}},
                    {"name": "building", "code": "asset6", parent_account_id: {$query: {name: "fixed asset"}}},
                    {"name": "furniture", "code": "asset7", parent_account_id: {$query: {name: "fixed asset"}}},
                    {"name": "liabilities", "code": "liab1"},
                    {"name": "current liabilities", "code": "liab2", parent_account_id: {$query: {name: "liabilities"}}},
                    {"name": "creditors", "code": "liab3", parent_account_id: {$query: {name: "current liabilities"}}},
                    {"name": "bank overdraft", "code": "liab4", parent_account_id: {$query: {name: "current liabilities"}}},
                    {"name": "fixed liabilities", "code": "liab5", parent_account_id: {$query: {name: "liabilities"}}},
                    {"name": "loan", "code": "liab6", parent_account_id: {$query: {name: "fixed liabilities"}}},
                    {"name": "debentures", "code": "liab7", parent_account_id: {$query: {name: "fixed liabilities"}}}
                ]});
            }).then(
            function () {
                return db.update({$collection: "voucherlineitemsss", $insert: [
                    {"amount": {"amount": 20, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "cash"}}},
                    {"amount": {"amount": 30, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "cash"}}},
                    {"amount": {"amount": 50, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "bank"}}},
                    {"amount": {"amount": 50, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "bank"}}},
                    {"amount": {"amount": 100, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "building"}}},
                    {"amount": {"amount": 200, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "furniture"}}},
                    {"amount": {"amount": 100, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "creditors"}}},
                    {"amount": {"amount": 100, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "creditors"}}},
                    {"amount": {"amount": 50, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "creditors"}}},
                    {"amount": {"amount": 200, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "bank overdraft"}}},
                    {"amount": {"amount": 500, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "bank overdraft"}}},
                    {"amount": {"amount": 50, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "loan"}}},
                    {"amount": {"amount": 10, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "debentures"}}},
                    {"amount": {"amount": 10, type: {$query: {currency: "INR"}}}, account_id: {$query: {"name": "debentures"}}}
                ]});
            }).then(
            function () {
                return db.query({
                    $collection: "voucherlineitemsss",
                    $group: {
                        "_id": "$account_id",
                        "amount": {"$sum": "$amount"},
                        "$fields": false,
                        account_id:{$first:"$account_id"},
                        "$recursion": {
                            "account_id.parent_account_id": "_id",
                            "$alias": "children",
                            "$rollup": [
                                {"amount":{amount:{$sum:"$amount"}, type:{$first:"$type"}}}
                            ],
                            "$sort": {"amount.total.amount": -1},
                            "$rootFilter": {parent_account_id: null}
                        }
                    }
                });
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].account_id.name).to.eql("liabilities");
                expect(data.result[0].account_id.code).to.eql("liab1");
                expect(data.result[0].amount.total.amount).to.eql(1020);

                expect(data.result[0].children).to.have.length(2);
                expect(data.result[0].children[0].account_id.name).to.eql("current liabilities");
                expect(data.result[0].children[0].account_id.code).to.eql("liab2");
                expect(data.result[0].children[0].amount.total.amount).to.eql(950);
                expect(data.result[0].children[0].children).to.have.length(2);
                expect(data.result[0].children[0].children[0].account_id.name).to.eql("bank overdraft");
                expect(data.result[0].children[0].children[0].account_id.code).to.eql("liab4");
                expect(data.result[0].children[0].children[0].amount.total.amount).to.eql(700);
                expect(data.result[0].children[0].children[0].amount.self.amount).to.eql(700);
                expect(data.result[0].children[0].children[1].account_id.name).to.eql("creditors");
                expect(data.result[0].children[0].children[1].account_id.code).to.eql("liab3");
                expect(data.result[0].children[0].children[1].amount.total.amount).to.eql(250);
                expect(data.result[0].children[0].children[1].amount.self.amount).to.eql(250);

                expect(data.result[0].children[1].account_id.name).to.eql("fixed liabilities");
                expect(data.result[0].children[1].account_id.code).to.eql("liab5");
                expect(data.result[0].children[1].amount.total.amount).to.eql(70);
                expect(data.result[0].children[1].children).to.have.length(2);
                expect(data.result[0].children[1].children[0].account_id.name).to.eql("loan");
                expect(data.result[0].children[1].children[0].account_id.code).to.eql("liab6");
                expect(data.result[0].children[1].children[0].amount.total.amount).to.eql(50);
                expect(data.result[0].children[1].children[0].amount.self.amount).to.eql(50);
                expect(data.result[0].children[1].children[1].account_id.name).to.eql("debentures");
                expect(data.result[0].children[1].children[1].account_id.code).to.eql("liab7");
                expect(data.result[0].children[1].children[1].amount.total.amount).to.eql(20);
                expect(data.result[0].children[1].children[1].amount.self.amount).to.eql(20);

                expect(data.result[1].account_id.name).to.eql("asset");
                expect(data.result[1].account_id.code).to.eql("asset1");
                expect(data.result[1].amount.total.amount).to.eql(450);
                expect(data.result[1].children).to.have.length(2);
                expect(data.result[1].children[0].account_id.name).to.eql("fixed asset");
                expect(data.result[1].children[0].account_id.code).to.eql("asset5");
                expect(data.result[1].children[0].amount.total.amount).to.eql(300);
                expect(data.result[1].children[0].children).to.have.length(2);
                expect(data.result[1].children[0].children[0].account_id.name).to.eql("furniture");
                expect(data.result[1].children[0].children[0].account_id.code).to.eql("asset7");
                expect(data.result[1].children[0].children[0].amount.total.amount).to.eql(200);
                expect(data.result[1].children[0].children[0].amount.self.amount).to.eql(200);
                expect(data.result[1].children[0].children[1].account_id.name).to.eql("building");
                expect(data.result[1].children[0].children[1].account_id.code).to.eql("asset6");
                expect(data.result[1].children[0].children[1].amount.total.amount).to.eql(100);
                expect(data.result[1].children[0].children[1].amount.self.amount).to.eql(100);

                expect(data.result[1].children[1].account_id.name).to.eql("current asset");
                expect(data.result[1].children[1].account_id.code).to.eql("asset2");
                expect(data.result[1].children[1].amount.total.amount).to.eql(150);
                expect(data.result[1].children[1].children).to.have.length(2);
                expect(data.result[1].children[1].children[0].account_id.name).to.eql("bank");
                expect(data.result[1].children[1].children[0].account_id.code).to.eql("asset4");
                expect(data.result[1].children[1].children[0].amount.total.amount).to.eql(100);
                expect(data.result[1].children[1].children[0].amount.self.amount).to.eql(100);
                expect(data.result[1].children[1].children[1].account_id.name).to.eql("cash");
                expect(data.result[1].children[1].children[1].account_id.code).to.eql("asset3");
                expect(data.result[1].children[1].children[1].amount.total.amount).to.eql(50);
                expect(data.result[1].children[1].children[1].amount.self.amount).to.eql(50);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Recursion in fk column and group by on that column", function (done) {
        var db = undefined;
        var rohitDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefinition = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "activitiesss"},
                        {collection: "locationss"},
                        {collection: "employeesss"} ,
                        {collection: "business_unitss"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "name", type: "string", collectionid: {$query: {collection: "business_unitss"}}, visibility: true},
                        {field: "name", type: "string", collectionid: {$query: {collection: "employeesss"}}, visibility: true},
                        {field: "code", type: "string", collectionid: {$query: {collection: "employeesss"}}, visibility: true},
                        {field: "reporting_to_id", type: "fk", collectionid: {$query: {collection: "employeesss"}}, collection: "employeesss"},
                        {field: "userid", type: "fk", collectionid: {$query: {collection: "employeesss"}}, collection: "pl.users"},
                        {field: "name", type: "string", collectionid: {$query: {collection: "locationss"}}, visibility: true} ,
                        {field: "name", type: "string", index: 1, collectionid: {$query: {collection: "activitiesss"}}, visibility: true},
                        {field: "date", type: "date", index: 3, collectionid: {$query: {collection: "activitiesss"}}, visibility: true},
                        {field: "ownerid", label: "owner", type: "fk", collectionid: {$query: {collection: "activitiesss"}}, collection: "employeesss", displayField: "name", set: ["name"], visibility: true, recursion: JSON.stringify({"ownerid.reporting_to_id": "_id", "$rootFilter": {"userid": "$$CurrentUser"}, "$selected": true})},
                        {field: "code", type: "string", parentfieldid: {$query: {field: "ownerid", collectionid: {$query: {collection: "activitiesss"}}}}, collectionid: {$query: {collection: "activitiesss"}}, visibility: true},
                        {field: "amount", type: "currency", index: 2, collectionid: {$query: {collection: "activitiesss"}}, ui: "currency", visibility: true, aggregate: "sum", aggregatable: true},
                        {field: "location_id", label: "Location", type: "fk", collectionid: {$query: {collection: "activitiesss"}}, collection: "locationss", displayField: "name", set: ["name"], visibility: true},
                        {field: "profit_center_id", label: "Unit", type: "fk", collectionid: {$query: {collection: "activitiesss"}}, collection: "business_unitss", displayField: "name", set: ["name"], visibility: true}

                    ]},
                    {$collection: "pl.qviews", $insert: [
                        {label: "Activities", id: "activities", collection: {$query: {collection: "activitiesss"}}, mainCollection: {$query: {collection: "activitiesss"}}, sort:JSON.stringify({_id:-1}), group: JSON.stringify(["profit_center_id", "location_id", "ownerid"])}
                    ]}
                ];
                return db.update(collectionDefinition);


            }).then(
            function () {
                return db.update({$collection: "pl.currencies", $insert: [
                    {type: "INR"}
                ]});
            }).then(
            function () {
                return db.update({$collection: "business_unitss", $insert: [
                    {"name": "Applane"}
                ]});
            }).then(
            function () {
                return db.update({$collection: "pl.users", $insert: [
                    {"username": "rohit.bansal@daffodil.com", password: "rohit"},
                    {"username": "sachin.bansal@daffodil.com", password: "rohit"},
                    {"username": "ritesh.bansal@daffodil.com", password: "rohit"}
                ]});
            }).then(
            function () {
                return db.update({$collection: "locationss", $insert: [
                    {"name": "Gurgaon"},
                    {"name": "Hisar"}
                ]});
            }).then(
            function () {
                return db.update({$collection: "employeesss", $insert: [
                    {"name": "rohit", "code": "rohit", "userid": {$query: {"username": "rohit.bansal@daffodil.com"}}},
                    {"name": "sachin", "code": "sachin", "reporting_to_id": {$query: {"name": "rohit"}}, "userid": {$query: {"username": "sachin.bansal@daffodil.com"}}},
                    {"name": "ritesh", "code": "ritesh", "reporting_to_id": {$query: {"name": "sachin"}}, "userid": {$query: {"username": "ritesh.bansal@daffodil.com"}}}
                ]});
            }).then(
            function () {
                return db.update({$collection: "activitiesss", $insert: [
                    {"amount": {"amount": 1000, type: {$query: {currency: "INR"}}}, "name": "Activity1", "ownerid": {$query: {"name": "rohit"}}, "location_id": {$query: {"name": "Hisar"}}, "profit_center_id": {$query: {"name": "Applane"}}},
                    {"amount": {"amount": 2000, type: {$query: {currency: "INR"}}}, "name": "Activity2", "ownerid": {$query: {"name": "sachin"}}, "location_id": {$query: {"name": "Gurgaon"}}, "profit_center_id": {$query: {"name": "Applane"}}},
                    {"amount": {"amount": 4000, type: {$query: {currency: "INR"}}}, "name": "Activity2", "ownerid": {$query: {"name": "sachin"}}, "location_id": {$query: {"name": "Gurgaon"}}, "profit_center_id": {$query: {"name": "Applane"}}},
                    {"amount": {"amount": 3000, type: {$query: {currency: "INR"}}}, "name": "Activity3", "ownerid": {$query: {"name": "ritesh"}}, "location_id": {$query: {"name": "Gurgaon"}}, "profit_center_id": {$query: {"name": "Applane"}}}
                ]});
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username: "rohit.bansal@daffodil.com", password: "rohit"});
            }).then(
            function (rdb) {
                rohitDb = rdb;
                return rohitDb.invokeFunction("view.getView", [
                    {id: "activities"}
                ]);
            }).then(
            function (viewResult) {
                var result = viewResult.data.result;
                //  console.log("data>>>>>>>" + JSON.stringify(result));
                expect(result).to.have.length(1);
                expect(result[0].profit_center_id.name).to.eql("Applane");
                expect(result[0].amount.amount).to.eql(10000);
                expect(result[0].amount.type.currency).to.eql("INR");
                expect(result[0].count).to.eql(4);
                expect(result[0].__groupLevel).to.eql(0);
                expect(result[0].__depth).to.eql(0);
                expect(result[0].children).to.have.length(2);
                expect(result[0].children[0].location_id.name).to.eql("Gurgaon");
                expect(result[0].children[0].amount.amount).to.eql(9000);
                expect(result[0].children[0].amount.type.currency).to.eql("INR");
                expect(result[0].children[0].count).to.eql(3);
                expect(result[0].children[0].__groupLevel).to.eql(1);
                expect(result[0].children[0].__depth).to.eql(1);
                expect(result[0].children[0].children).to.have.length(1);

                expect(result[0].children[0].children[0].ownerid.name).to.eql("rohit & Team");
                expect(result[0].children[0].children[0].amount.amount).to.eql(9000);
                expect(result[0].children[0].children[0].amount.type.currency).to.eql("INR");
                expect(result[0].children[0].children[0].count).to.eql(3);
                expect(result[0].children[0].children[0].__groupLevel).to.eql(2);
                expect(result[0].children[0].children[0].__depth).to.eql(2);
                expect(result[0].children[0].children[0].children).to.have.length(1);

                expect(result[0].children[0].children[0].children[0].ownerid.name).to.eql("sachin & Team");
                expect(result[0].children[0].children[0].children[0].amount.amount).to.eql(9000);
                expect(result[0].children[0].children[0].children[0].amount.type.currency).to.eql("INR");
                expect(result[0].children[0].children[0].children[0].count).to.eql(3);
                expect(result[0].children[0].children[0].children[0].__groupLevel).to.eql(2);
                expect(result[0].children[0].children[0].children[0].__depth).to.eql(3);
                expect(result[0].children[0].children[0].children[0].children).to.have.length(2);

                expect(result[0].children[0].children[0].children[0].children[0].ownerid.name).to.eql("sachin");
                expect(result[0].children[0].children[0].children[0].children[0].ownerid.code).to.eql("sachin");
                expect(result[0].children[0].children[0].children[0].children[0].amount.amount).to.eql(6000);
                expect(result[0].children[0].children[0].children[0].children[0].amount.type.currency).to.eql("INR");
                expect(result[0].children[0].children[0].children[0].children[0].count).to.eql(2);
                expect(result[0].children[0].children[0].children[0].children[0].__groupLevel).to.eql(2);
                expect(result[0].children[0].children[0].children[0].children[0].__depth).to.eql(4);
                expect(result[0].children[0].children[0].children[0].children[0].children).to.have.length(2);

                expect(result[0].children[0].children[0].children[0].children[0].children[0].ownerid.name).to.eql("sachin");
                expect(result[0].children[0].children[0].children[0].children[0].children[0].amount.amount).to.eql(4000);
                expect(result[0].children[0].children[0].children[0].children[0].children[0].amount.type.currency).to.eql("INR");
                expect(result[0].children[0].children[0].children[0].children[0].children[0].location_id.name).to.eql("Gurgaon");
                expect(result[0].children[0].children[0].children[0].children[0].children[0].profit_center_id.name).to.eql("Applane");
                expect(result[0].children[0].children[0].children[0].children[0].children[0].name).to.eql("Activity2");

                expect(result[0].children[0].children[0].children[0].children[0].children[1].ownerid.name).to.eql("sachin");
                expect(result[0].children[0].children[0].children[0].children[0].children[1].amount.amount).to.eql(2000);
                expect(result[0].children[0].children[0].children[0].children[0].children[1].amount.type.currency).to.eql("INR");
                expect(result[0].children[0].children[0].children[0].children[0].children[1].location_id.name).to.eql("Gurgaon");
                expect(result[0].children[0].children[0].children[0].children[0].children[1].profit_center_id.name).to.eql("Applane");
                expect(result[0].children[0].children[0].children[0].children[0].children[1].name).to.eql("Activity2");

                expect(result[0].children[0].children[0].children[0].children[1].ownerid.name).to.eql("ritesh");
                expect(result[0].children[0].children[0].children[0].children[1].ownerid.code).to.eql("ritesh");
                expect(result[0].children[0].children[0].children[0].children[1].amount.amount).to.eql(3000);
                expect(result[0].children[0].children[0].children[0].children[1].amount.type.currency).to.eql("INR");
                expect(result[0].children[0].children[0].children[0].children[1].count).to.eql(1);
                expect(result[0].children[0].children[0].children[0].children[1].__groupLevel).to.eql(2);
                expect(result[0].children[0].children[0].children[0].children[1].__depth).to.eql(4);
                expect(result[0].children[0].children[0].children[0].children[1].children).to.have.length(1);

                expect(result[0].children[0].children[0].children[0].children[1].children[0].ownerid.name).to.eql("ritesh");
                expect(result[0].children[0].children[0].children[0].children[1].children[0].amount.amount).to.eql(3000);
                expect(result[0].children[0].children[0].children[0].children[1].children[0].amount.type.currency).to.eql("INR");
                expect(result[0].children[0].children[0].children[0].children[1].children[0].location_id.name).to.eql("Gurgaon");
                expect(result[0].children[0].children[0].children[0].children[1].children[0].profit_center_id.name).to.eql("Applane");
                expect(result[0].children[0].children[0].children[0].children[1].children[0].name).to.eql("Activity3");


                expect(result[0].children[1].location_id.name).to.eql("Hisar");
                expect(result[0].children[1].amount.amount).to.eql(1000);
                expect(result[0].children[1].amount.type.currency).to.eql("INR");
                expect(result[0].children[1].count).to.eql(1);
                expect(result[0].children[1].__groupLevel).to.eql(1);
                expect(result[0].children[1].__depth).to.eql(1);
                expect(result[0].children[1].children).to.have.length(1);

                expect(result[0].children[1].children[0].ownerid.name).to.eql("rohit");
                expect(result[0].children[1].children[0].amount.amount).to.eql(1000);
                expect(result[0].children[1].children[0].amount.type.currency).to.eql("INR");
                expect(result[0].children[1].children[0].count).to.eql(1);
                expect(result[0].children[1].children[0].__groupLevel).to.eql(2);
                expect(result[0].children[1].children[0].__depth).to.eql(2);
                expect(result[0].children[1].children[0].children).to.have.length(1);

                expect(result[0].children[1].children[0].children[0].ownerid.name).to.eql("rohit");
                expect(result[0].children[1].children[0].children[0].location_id.name).to.eql("Hisar");
                expect(result[0].children[1].children[0].children[0].profit_center_id.name).to.eql("Applane");
                expect(result[0].children[1].children[0].children[0].name).to.eql("Activity1");
                expect(result[0].children[1].children[0].children[0].amount.amount).to.eql(1000);
                expect(result[0].children[1].children[0].children[0].amount.type.currency).to.eql("INR");


                var finalData = [
                    {"_id": "546c4c4e0b30d31c1899fdf6", "profit_center_id": {"name": "Applane", "_id": "546c4c4e0b30d31c1899fdf6"}, "amount": {"amount": 10000, "type": {"_id": "546c4c4ef1bfee9c8d6ac6cf", "currency": "INR"}}, "count": 4, "children": [
                        {"_id": "546c4c4e0b30d31c1899fdfa", "location_id": {"name": "Gurgaon", "_id": "546 c4c4e0b30d31c1899fdfa"}, "children": [
                            {"_id": "546c4c4e0b30d31c1899fdfc_children", "ownerid": {"_id": "546c4c4e0b30d31c1899fdfc", "name": "rohit & Team"}, "amount": {"amount": 9000, "type": {"_id": "546c4c4ef1bfee9c8d6ac6cf", "currency": "INR"}}, "count": 3, "__groupLevel": 2, "__depth": 2, "__children": true, "__self_id": " 546c4c4e0b30d31c1899fdfc", "processed": true, "children": [
                                {"_id": "546c4c4e0b30d31c1899fdfd_children", "ownerid": {"_id": "546c4c4e0b30d31c1899fdfd", "name": "sachin & Team"}, "children": [
                                    {"_id": "546c4c4e0b30d31c1899fdfd", "ownerid": {"_id": "546c4c4e0b30d31c1899fdfd", "name": "sachin"}, "children": [
                                        {"_id": "546c4c4 e0b30d31c1899fe01", "amount": {"amount": 4000, "type": {"_id": "546c4c4ef1bfee9c8d6ac6cf", "currency": "INR"}}, "name": "Activity2", "location_id": {"name": "Gurgaon", "_id": "546c4c4e0b30d31c1899fdfa"}, "ownerid": {"name": "sachin", "_id": "546c4c4e0b30d31c1899fdfd"}, "profit_center_id": {"name": "Applane", "_id": "546c4c4 e0b30d31c1899fdf6"}},
                                        {"_id": "546c4c4e0b30d31c1899fe00", "amount": {"amount": 2000, "type": {"_id": "546c4c4ef1bfee9c8d6ac6cf", "currency": "INR"}}, "name": "Activity2", "location_id": {"name": "Gurgaon", "_id": "546c4c4e0b30d31c1899fdfa"}, "ownerid": {"name": "sachin", "_id": "546c4c4e0b30d31c1899fdfd"}, "profit_center_ id": {"name": "Applane", "_id": "546c4c4e0b30d31c1899fdf6"}}
                                    ], "profit_center_id": {"name": "Applane", "_id": "546c4c4e0b30d31c1899fdf6"}, "location_id": {"name": "Gurgaon", "_id": "546c4c4e0b30d31c1899fdfa"}, "amount": {"amount": 6000, "type": {"_id": "546c4c4ef1bfee9c8d6ac6cf", "currency": "INR"}}, "count": 2, "__recursiv eParent": true, "__groupLevel": 2, "__depth": 4},
                                    {"_id": "546c4c4e0b30d31c1899fdfe", "ownerid": {"_id": "546c4c4e0b30d31c1899fdfe", "name": "ritesh"}, "children": [
                                        {"_id": "546c4c4e0b30d31c1899fe02", "amount": {"amount": 3000, "type": {"_id": "546c4c4ef1bfee9c8d6ac6cf", "currency": "INR"}}, "name": "Activity3", "location_id ": {"name": "Gurgaon", "_id": "546c4c4e0b30d31c1899fdfa"}, "ownerid": {"name": "ritesh", "_id": "546c4c4e0b30d31c1899fdfe"}, "profit_center_id": {"name": "Applane", "_id": "546c4c4e0b30d31c1899fdf6"}}
                                    ], "profit_center_id": {"name": "Applane", "_id": "546c4c4e0b30d31c1899fdf6"}, "location_id": {"name": "Gurgaon", "_id": "54 6c4c4e0b30d31c1899fdfa"}, "amount": {"amount": 3000, "type": {"_id": "546c4c4ef1bfee9c8d6ac6cf", "currency": "INR"}}, "count": 1, "__groupLevel": 2, "__depth": 4}
                                ], "profit_center_id": {"name": "Applane", "_id": "546c4c4e0b30d31c1899fdf6"}, "location_id": {"name": "Gurgaon", "_id": "546c4c4e0b30d31c1899fdfa"}, "amount": {"am ount": 9000, "type": {"_id": "546c4c4ef1bfee9c8d6ac6cf", "currency": "INR"}}, "count": 3, "__children": true, "__self_id": "546c4c4e0b30d31c1899fdfd", "processed": true, "__groupLevel": 2, "__depth": 3}
                            ]}
                        ], "profit_center_id": {"name": "Applane", "_id": "546c4c4e0b30d31c1899fdf6"}, "amount": {"amount": 9000, "type": {"_id": "54 6c4c4ef1bfee9c8d6ac6cf", "currency": "INR"}}, "count": 3, "__groupLevel": 1, "__depth": 1},
                        {"_id": "546c4c4e0b30d31c1899fdfb", "location_id": {"name": "Hisar", "_id": "546c4c4e0b30d31c1899fdfb"}, "children": [
                            {"_id": "546c4c4e0b30d31c1899fdfc", "ownerid": {"_id": "546c4c4e0b30d31c1899fdfc", "name": "rohit"}, "children": [
                                { "_id": "546c4c4e0b30d31c1899fdff", "amount": {"amount": 1000, "type": {"_id": "546c4c4ef1bfee9c8d6ac6cf", "currency": "INR"}}, "name": "Activity1", "location_id": {"name": "Hisar", "_id": "546c4c4e0b30d31c1899fdfb"}, "ownerid": {"name": "rohit", "_id": "546c4c4e0b30d31c1899fdfc"}, "profit_center_id": {"name": "Applane", "_i d": "546c4c4e0b30d31c1899fdf6"}}
                            ], "profit_center_id": {"name": "Applane", "_id": "546c4c4e0b30d31c1899fdf6"}, "location_id": {"name": "Hisar", "_id": "546c4c4e0b30d31c1899fdfb"}, "amount": {"amount": 1000, "type": {"_id": "546c4c4ef1bfee9c8d6ac6cf", "currency": "INR"}}, "count": 1, "__groupLevel": 2, "__depth": 2}
                        ], "profit _center_id": {"name": "Applane", "_id": "546c4c4e0b30d31c1899fdf6"}, "amount": {"amount": 1000, "type": {"_id": "546c4c4ef1bfee9c8d6ac6cf", "currency": "INR"}}, "count": 1, "__groupLevel": 1, "__depth": 1}
                    ], "__groupLevel": 0, "__depth": 0}
                ]
            }).then(function () {
                return rohitDb.invokeFunction("view.getView", [
                    {id: "activities", $group: ["ownerid"]}
                ]);
            }).then(function (result) {
                expect(result.data.aggregateResult.amount.amount).to.eql(10000);
                expect(result.data.aggregateResult.amount.type.currency).to.eql("INR");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
})
