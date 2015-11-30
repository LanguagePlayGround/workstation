/**
 *
 * mocha --recursive --timeout 150000 -g "ExportView testcase" --reporter spec
 *
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 8/10/14
 * Time: 6:12 PM
 * To change this template use File | Settings | File Templates.
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");
var moment = require("moment");

describe("ExportView testcase", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("ledger Report", function (done) {

        var db = undefined;
        var val = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefination = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "voucherss"},
                        {collection: "locationss"},
                        {collection: "accountss"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "name", type: "string", collectionid: {$query: {collection: "accountss"}}, ui: "text", visibility: true, index: 2},
                        {field: "name", type: "string", collectionid: {$query: {collection: "locationss"}}, ui: "text", visibility: true, index: 2},
                        {field: "voucher_no", type: "string", collectionid: {$query: {collection: "voucherss"}}, ui: "text", visibility: true, index: 2},
                        {field: "voucher_date", type: "date", collectionid: {$query: {collection: "voucherss"}}, ui: "date", visibility: true, index: 3},
                        {field: "account_id", type: "fk", collectionid: {$query: {collection: "voucherss"}}, ui: "autocomplete", visibility: true, index: 4, displayField: "name", collection: "accountss", set: ["name"]},
                        {field: "voucher_line_item", type: "object", collectionid: {$query: {collection: "voucherss"}}, ui: "grid", visibility: false, index: 4, multiple: true},
                        {field: "cr_amount", type: "currency", toFixedAggregate: 2, aggregate: "sum", collectionid: {$query: {collection: "voucherss"}}, ui: "currency", visibility: false, visibilityGrid: true, index: 5, parentfieldid: {$query: {field: "voucher_line_item", collectionid: {$query: {collection: "voucherss"}}}}},
                        {field: "dr_amount", type: "currency", toFixedAggregate: 2, aggregate: "sum", collectionid: {$query: {collection: "voucherss"}}, ui: "currency", visibility: false, visibilityGrid: true, index: 6, parentfieldid: {$query: {field: "voucher_line_item", collectionid: {$query: {collection: "voucherss"}}}}},
                        {field: "balance", type: "currency", toFixedAggregate: 2, collectionid: {$query: {collection: "voucherss"}}, ui: "currency", visibility: false, visibilityGrid: true, index: 7, parentfieldid: {$query: {field: "voucher_line_item", collectionid: {$query: {collection: "voucherss"}}}}},
                        {field: "locationid", type: "fk", collectionid: {$query: {collection: "voucherss"}}, ui: "autocomplete", displayField: "name", collection: "locationss", set: ["name"], visibility: false, visibilityGrid: true, index: 8, parentfieldid: {$query: {field: "voucher_line_item", collectionid: {$query: {collection: "voucherss"}}}}},
                        {field: "voucher_type", type: "string", collectionid: {$query: {collection: "voucherss"}}, ui: "text", visibility: true, index: 9}
                    ]},
                    {$collection: "pl.qviews", $insert: [
                        {label: "Ledger", id: "ledger", collection: {$query: {collection: "voucherss"}}, mainCollection: {$query: {collection: "voucherss"}}, unwind: JSON.stringify(["voucher_line_item"]), sort: JSON.stringify({voucher_no: 1, "voucher_line_item.locationid.name": 1})}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return db.update({$collection: "pl.currencies", $insert: [
                    {type: "INR"}
                ]});
            }).then(
            function () {
                return db.update({$collection: "accountss", $insert: [
                    {name: "State Bank Of India"},
                    {name: "SBI"},
                    {name: "Salary"}
                ]});
            }).then(
            function () {
                return db.update({$collection: "locationss", $insert: [
                    {name: "Silokhera"},
                    {name: "Sec33"},
                    {name: "Hisar"}
                ]});
            }).then(
            function () {
                return db.update({$collection: "voucherss", $insert: [
                    {voucher_no: "DSL/1", "voucher_date": "10/10/2014", account_id: {$query: {name: "State Bank Of India"}}, voucher_line_item: [
                        {cr_amount: {amount: 1000, type: {$query: {currency: "INR"}}}, balance: {amount: 1000, type: {$query: {currency: "INR"}}}, locationid: {$query: {name: "Silokhera"}}},
                        {dr_amount: {amount: 10000, type: {$query: {currency: "INR"}}}, balance: {amount: -10000, type: {$query: {currency: "INR"}}}, locationid: {$query: {name: "Sec33"}}}
                    ], "voucher_type": "General Voucher"},
                    {voucher_no: "DSL/2", "voucher_date": "10/10/2014", account_id: {$query: {name: "SBI"}}, voucher_line_item: [
                        {cr_amount: {amount: 5000, type: {$query: {currency: "INR"}}}, balance: {amount: 5000, type: {$query: {currency: "INR"}}}, locationid: {$query: {name: "Silokhera"}}},
                        {dr_amount: {amount: 20000, type: {$query: {currency: "INR"}}}, balance: {amount: -20000, type: {$query: {currency: "INR"}}}, locationid: {$query: {name: "Sec33"}}}
                    ], "voucher_type": "General Voucher"},
                    {voucher_no: "DSL/3", "voucher_date": "10/10/2014", account_id: {$query: {name: "Salary"}}, "voucher_type": "General Voucher"}
                ]});
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id: "ledger"}
                ]);
            }).then(
            function (view) {
                if (view.viewOptions.dataError) {
                    throw view.viewOptions.dataError;
                }
                return db.invokeFunction("ExportViewService.populateWorksheetData", [
                    view, true
                ]);
            }).then(
            function (worksheetData) {
                expect(worksheetData.data).to.have.length(6);
                expect(worksheetData.data[0]).to.have.length(8);
                expect(worksheetData.data[0][0].value).to.eql("voucher_no");
                expect(worksheetData.data[0][0].bold).to.eql(true);
                expect(worksheetData.data[0][1].value).to.eql("voucher_date");
                expect(worksheetData.data[0][2].value).to.eql("account_id");
                expect(worksheetData.data[0][3].value).to.eql("cr_amount");
                expect(worksheetData.data[0][4].value).to.eql("dr_amount");
                expect(worksheetData.data[0][5].value).to.eql("balance");
                expect(worksheetData.data[0][6].value).to.eql("locationid");
                expect(worksheetData.data[0][7].value).to.eql("voucher_type");

                expect(worksheetData.data[1]).to.have.length(8);
                expect(worksheetData.data[1][0].value).to.eql("DSL/1");
                val = moment(worksheetData.data[1][1].value.toString()).format("DD/MM/YYYY");
                expect(val).to.eql("10/10/2014");
                expect(worksheetData.data[1][2].value).to.eql("State Bank Of India");
                expect(worksheetData.data[1][3].value).to.eql("");
                expect(worksheetData.data[1][4].value).to.eql("10000.00 INR");
                expect(worksheetData.data[1][5].value).to.eql("-10000.00 INR");
                expect(worksheetData.data[1][6].value).to.eql("Sec33");
                expect(worksheetData.data[1][7].value).to.eql("General Voucher");

                expect(worksheetData.data[2]).to.have.length(8);
                expect(worksheetData.data[2][0].value).to.eql("DSL/1");
                val = moment(worksheetData.data[2][1].value.toString()).format("DD/MM/YYYY");
                expect(val).to.eql("10/10/2014");
                expect(worksheetData.data[2][2].value).to.eql("State Bank Of India");
                expect(worksheetData.data[2][3].value).to.eql("1000.00 INR");
                expect(worksheetData.data[2][4].value).to.eql("");
                expect(worksheetData.data[2][5].value).to.eql("1000.00 INR");
                expect(worksheetData.data[2][6].value).to.eql("Silokhera");
                expect(worksheetData.data[2][7].value).to.eql("General Voucher");

                expect(worksheetData.data[3]).to.have.length(8);
                expect(worksheetData.data[3][0].value).to.eql("DSL/2");
                val = moment(worksheetData.data[3][1].value.toString()).format("DD/MM/YYYY");
                expect(val).to.eql("10/10/2014");
                expect(worksheetData.data[3][2].value).to.eql("SBI");
                expect(worksheetData.data[3][3].value).to.eql("");
                expect(worksheetData.data[3][4].value).to.eql("20000.00 INR");
                expect(worksheetData.data[3][5].value).to.eql("-20000.00 INR");
                expect(worksheetData.data[3][6].value).to.eql("Sec33");
                expect(worksheetData.data[3][7].value).to.eql("General Voucher");

                expect(worksheetData.data[4]).to.have.length(8);
                expect(worksheetData.data[4][0].value).to.eql("DSL/2");
                val = moment(worksheetData.data[4][1].value.toString()).format("DD/MM/YYYY");
                expect(val).to.eql("10/10/2014");
                expect(worksheetData.data[4][2].value).to.eql("SBI");
                expect(worksheetData.data[4][3].value).to.eql("5000.00 INR");
                expect(worksheetData.data[4][4].value).to.eql("");
                expect(worksheetData.data[4][5].value).to.eql("5000.00 INR");
                expect(worksheetData.data[4][6].value).to.eql("Silokhera");
                expect(worksheetData.data[4][7].value).to.eql("General Voucher");

                expect(worksheetData.data[5]).to.have.length(8);
                expect(worksheetData.data[5][0].value).to.eql("");
                expect(worksheetData.data[5][1].value).to.eql("");
                expect(worksheetData.data[5][2].value).to.eql("");
                expect(worksheetData.data[5][3].value).to.eql("6000.00 INR");
                expect(worksheetData.data[5][3].bold).to.eql(true);
                expect(worksheetData.data[5][3].hAlign).to.eql("right");
                expect(worksheetData.data[5][4].value).to.eql("30000.00 INR");
                expect(worksheetData.data[5][4].bold).to.eql(true);
                expect(worksheetData.data[5][4].hAlign).to.eql("right");
                expect(worksheetData.data[5][5].value).to.eql("");
                expect(worksheetData.data[5][6].value).to.eql("");
                expect(worksheetData.data[5][7].value).to.eql("");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("nested field of fk column in grid view", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefination = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "voucherss"},
                        {collection: "locationss"},
                        {collection: "accountss"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "name", type: "string", collectionid: {$query: {collection: "accountss"}}, ui: "text", visibility: true, index: 2},
                        {field: "type", type: "string", collectionid: {$query: {collection: "accountss"}}, ui: "text", visibility: true, index: 3},
                        {field: "voucher_no", type: "string", collectionid: {$query: {collection: "voucherss"}}, ui: "text", visibility: true, index: 1},
                        {field: "account_id", type: "fk", collectionid: {$query: {collection: "voucherss"}}, ui: "autocomplete", visibility: true, index: 4, displayField: "name", collection: "accountss", set: ["name"]},
                        {field: "type", type: "string", collectionid: {$query: {collection: "voucherss"}}, ui: "text", visibility: true, index: 9, parentfieldid: {$query: {field: "account_id", collectionid: {$query: {collection: "voucherss"}}}}}
                    ]},
                    {$collection: "pl.qviews", $insert: [
                        {label: "Ledger", id: "ledger", collection: {$query: {collection: "voucherss"}}, mainCollection: {$query: {collection: "voucherss"}}, sort: JSON.stringify({voucher_no: 1})}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return db.update({$collection: "pl.currencies", $insert: [
                    {type: "INR"}
                ]});
            }).then(
            function () {
                return db.update({$collection: "accountss", $insert: [
                    {name: "State Bank Of India", "type": "Account"},
                    {name: "SBI", "type": "Account"},
                    {name: "Salary", "type": "Salary"}
                ]});
            }).then(
            function () {
                return db.update({$collection: "voucherss", $insert: [
                    {voucher_no: "DSL/1", account_id: {$query: {name: "State Bank Of India"}}},
                    {voucher_no: "DSL/2", account_id: {$query: {name: "SBI"}}},
                    {voucher_no: "DSL/3", account_id: {$query: {name: "Salary"}}}
                ]});
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id: "ledger"}
                ]);
            }).then(
            function (view) {
                if (view.viewOptions.dataError) {
                    throw view.viewOptions.dataError;
                }
                return db.invokeFunction("ExportViewService.populateWorksheetData", [
                    view, true
                ]);
            }).then(
            function (worksheetData) {
                expect(worksheetData.data).to.have.length(4);
                expect(worksheetData.data[0]).to.have.length(3);
                expect(worksheetData.data[0][0].value).to.eql("voucher_no");
                expect(worksheetData.data[0][0].bold).to.eql(true);
                expect(worksheetData.data[0][1].value).to.eql("account_id");
                expect(worksheetData.data[0][2].value).to.eql("type");

                expect(worksheetData.data[1]).to.have.length(3);
                expect(worksheetData.data[1][0].value).to.eql("DSL/1");
                expect(worksheetData.data[1][1].value).to.eql("State Bank Of India");
                expect(worksheetData.data[1][2].value).to.eql("Account");

                expect(worksheetData.data[2]).to.have.length(3);
                expect(worksheetData.data[2][0].value).to.eql("DSL/2");
                expect(worksheetData.data[2][1].value).to.eql("SBI");
                expect(worksheetData.data[2][2].value).to.eql("Account");

                expect(worksheetData.data[3]).to.have.length(3);
                expect(worksheetData.data[3][0].value).to.eql("DSL/3");
                expect(worksheetData.data[3][1].value).to.eql("Salary");
                expect(worksheetData.data[3][2].value).to.eql("Salary");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("html report with group by 3", function (done) {
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
                        {field: "reporting_to_id", type: "fk", collectionid: {$query: {collection: "employeesss"}}, collection: "employeesss"},
                        {field: "userid", type: "fk", collectionid: {$query: {collection: "employeesss"}}, collection: "pl.users"},
                        {field: "name", type: "string", collectionid: {$query: {collection: "locationss"}}, visibility: true} ,
                        {field: "name", type: "string", index: 1, collectionid: {$query: {collection: "activitiesss"}}, visibility: true},
                        {field: "date", type: "date", index: 3, collectionid: {$query: {collection: "activitiesss"}}, visibility: true},
                        {field: "amount", type: "currency", index: 2, collectionid: {$query: {collection: "activitiesss"}}, ui: "currency", visibility: true, aggregate: "sum", aggregatable: true},
                        {field: "ownerid", label: "owner", type: "fk", collectionid: {$query: {collection: "activitiesss"}}, collection: "employeesss", displayField: "name", set: ["name"], visibility: true, recursion: JSON.stringify({"ownerid.reporting_to_id": "_id", "$rootFilter": {"userid": "$$CurrentUser"}, "$selected": true})},
                        {field: "location_id", label: "Location", type: "fk", collectionid: {$query: {collection: "activitiesss"}}, collection: "locationss", displayField: "name", set: ["name"], visibility: true},
                        {field: "profit_center_id", label: "Unit", type: "fk", collectionid: {$query: {collection: "activitiesss"}}, collection: "business_unitss", displayField: "name", set: ["name"], visibility: true}

                    ]},
                    {$collection: "pl.qviews", $insert: [
                        {label: "Activities", id: "activities", collection: {$query: {collection: "activitiesss"}}, mainCollection: {$query: {collection: "activitiesss"}}, group: JSON.stringify(["profit_center_id", "location_id", "ownerid"])}
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
                    {"name": "rohit", "userid": {$query: {"username": "rohit.bansal@daffodil.com"}}},
                    {"name": "sachin", "reporting_to_id": {$query: {"name": "rohit"}}, "userid": {$query: {"username": "sachin.bansal@daffodil.com"}}},
                    {"name": "ritesh", "reporting_to_id": {$query: {"name": "sachin"}}, "userid": {$query: {"username": "ritesh.bansal@daffodil.com"}}}
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
                    {id: "activities", sort: {"profit_center_id": 1, "location_id": 1}}
                ]);
            }).then(
            function (view) {
                if (view.viewOptions.dataError) {
                    throw view.viewOptions.dataError;
                }
                return db.invokeFunction("ExportViewService.populateWorksheetData", [
                    view, true, true
                ]);
            }).then(
            function (worksheetData) {
                expect(worksheetData.data).to.have.length(14);
                expect(worksheetData.data[0]).to.have.length(6);
                expect(worksheetData.data[0][0].value).to.eql("");
                expect(worksheetData.data[0][1].value).to.eql("");
                expect(worksheetData.data[0][2].value).to.eql("");
                expect(worksheetData.data[0][3].value).to.eql("name");
                expect(worksheetData.data[0][4].value).to.eql("amount");
                expect(worksheetData.data[0][5].value).to.eql("date");
                expect(worksheetData.data[1]).to.have.length(1);
                expect(worksheetData.data[1][0].value).to.eql(" Unit : <b>Applane</b> (  amount : <b>10000.00 INR</b> Count : <b>4</b> )");
                expect(worksheetData.data[1][0].colSpan).to.eql(6);
                expect(worksheetData.data[1][0]._level).to.eql(0);
                expect(worksheetData.data[2]).to.have.length(1);
                expect(worksheetData.data[2][0].value).to.eql(".... Location : <b>Gurgaon</b> (  amount : <b>9000.00 INR</b> Count : <b>3</b> )");
                expect(worksheetData.data[2][0].colSpan).to.eql(6);
                expect(worksheetData.data[2][0]._level).to.eql(1);
                expect(worksheetData.data[3]).to.have.length(1);
                expect(worksheetData.data[3][0].value).to.eql("........ owner : <b>rohit & Team</b> (  amount : <b>9000.00 INR</b> Count : <b>3</b> )");
                expect(worksheetData.data[3][0].colSpan).to.eql(6);
                expect(worksheetData.data[3][0]._level).to.eql(2);
                expect(worksheetData.data[4]).to.have.length(1);
                expect(worksheetData.data[4][0].value).to.eql("............ owner : <b>sachin & Team</b> (  amount : <b>9000.00 INR</b> Count : <b>3</b> )");
                expect(worksheetData.data[4][0].colSpan).to.eql(6);
                expect(worksheetData.data[4][0]._level).to.eql(3);
                expect(worksheetData.data[5]).to.have.length(1);
                expect(worksheetData.data[5][0].value).to.eql("................ owner : <b>sachin</b> (  amount : <b>6000.00 INR</b> Count : <b>2</b> )");
                expect(worksheetData.data[5][0].colSpan).to.eql(6);
                expect(worksheetData.data[5][0]._level).to.eql(4);
                expect(worksheetData.data[6]).to.have.length(6);
                expect(worksheetData.data[7]).to.have.length(6);
                expect(worksheetData.data[8]).to.have.length(1);
                expect(worksheetData.data[8][0].value).to.eql("................ owner : <b>ritesh</b> (  amount : <b>3000.00 INR</b> Count : <b>1</b> )");
                expect(worksheetData.data[8][0].colSpan).to.eql(6);
                expect(worksheetData.data[8][0]._level).to.eql(4);
                expect(worksheetData.data[9]).to.have.length(6);
                expect(worksheetData.data[10]).to.have.length(1);
                expect(worksheetData.data[10][0].value).to.eql(".... Location : <b>Hisar</b> (  amount : <b>1000.00 INR</b> Count : <b>1</b> )");
                expect(worksheetData.data[10][0].colSpan).to.eql(6);
                expect(worksheetData.data[10][0]._level).to.eql(1);
                expect(worksheetData.data[11]).to.have.length(1);
                expect(worksheetData.data[11][0].value).to.eql("........ owner : <b>rohit</b> (  amount : <b>1000.00 INR</b> Count : <b>1</b> )");
                expect(worksheetData.data[11][0].colSpan).to.eql(6);
                expect(worksheetData.data[11][0]._level).to.eql(2);
                expect(worksheetData.data[12]).to.have.length(6);
                expect(worksheetData.data[13]).to.have.length(6);
                expect(worksheetData.data[13][0].value).to.eql("");
                expect(worksheetData.data[13][1].value).to.eql("");
                expect(worksheetData.data[13][2].value).to.eql("");
                expect(worksheetData.data[13][3].value).to.eql("");
                expect(worksheetData.data[13][4].value).to.eql("10000 INR");
                expect(worksheetData.data[13][5].value).to.eql("");

            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("html report with group by 2", function (done) {
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
                        {field: "reporting_to_id", type: "fk", collectionid: {$query: {collection: "employeesss"}}, collection: "employeesss"},
                        {field: "userid", type: "fk", collectionid: {$query: {collection: "employeesss"}}, collection: "pl.users"},
                        {field: "name", type: "string", collectionid: {$query: {collection: "locationss"}}, visibility: true} ,
                        {field: "name", type: "string", index: 1, collectionid: {$query: {collection: "activitiesss"}}, visibility: true},
                        {field: "date", type: "date", index: 3, collectionid: {$query: {collection: "activitiesss"}}, visibility: true},
                        {field: "amount", type: "currency", index: 2, collectionid: {$query: {collection: "activitiesss"}}, ui: "currency", visibility: true, aggregate: "sum", aggregatable: true},
                        {field: "ownerid", label: "owner", type: "fk", collectionid: {$query: {collection: "activitiesss"}}, collection: "employeesss", displayField: "name", set: ["name"], visibility: true, recursion: JSON.stringify({"ownerid.reporting_to_id": "_id", "$rootFilter": {"userid": "$$CurrentUser"}, "$selected": true})},
                        {field: "location_id", label: "Location", type: "fk", collectionid: {$query: {collection: "activitiesss"}}, collection: "locationss", displayField: "name", set: ["name"], visibility: true},
                        {field: "profit_center_id", label: "Unit", type: "fk", collectionid: {$query: {collection: "activitiesss"}}, collection: "business_unitss", displayField: "name", set: ["name"], visibility: true}

                    ]},
                    {$collection: "pl.qviews", $insert: [
                        {label: "Activities", id: "activities", collection: {$query: {collection: "activitiesss"}}, mainCollection: {$query: {collection: "activitiesss"}}, group: JSON.stringify(["profit_center_id", "ownerid"])}
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
                    {"name": "rohit", "userid": {$query: {"username": "rohit.bansal@daffodil.com"}}},
                    {"name": "sachin", "reporting_to_id": {$query: {"name": "rohit"}}, "userid": {$query: {"username": "sachin.bansal@daffodil.com"}}},
                    {"name": "ritesh", "reporting_to_id": {$query: {"name": "sachin"}}, "userid": {$query: {"username": "ritesh.bansal@daffodil.com"}}}
                ]});
            }).then(
            function () {
                return db.update({$collection: "activitiesss", $insert: [
                    {"amount": {"amount": 1000, type: {$query: {currency: "INR"}}}, "name": "Activity1", "ownerid": {$query: {"name": "rohit"}}, "location_id": {$query: {"name": "Hisar"}}, "profit_center_id": {$query: {"name": "Applane"}}},
                    {"amount": {"amount": 2000, type: {$query: {currency: "INR"}}}, "name": "Activity2", "ownerid": {$query: {"name": "sachin"}}, "location_id": {$query: {"name": "Gurgaon"}}, "profit_center_id": {$query: {"name": "Applane"}}},
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
            function (view) {
                if (view.viewOptions.dataError) {
                    throw view.viewOptions.dataError;
                }
                return db.invokeFunction("ExportViewService.populateWorksheetData", [
                    view, true, true
                ]);
            }).then(
            function (worksheetData) {
                expect(worksheetData.data).to.have.length(11);

                expect(worksheetData.data[0]).to.have.length(6);
                expect(worksheetData.data[1]).to.have.length(1);
                expect(worksheetData.data[1][0].value).to.eql(" Unit : <b>Applane</b> (  amount : <b>6000.00 INR</b> Count : <b>3</b> )");
                expect(worksheetData.data[2]).to.have.length(1);
                expect(worksheetData.data[2][0].value).to.eql(".... owner : <b>rohit & Team</b> (  amount : <b>6000.00 INR</b> Count : <b>3</b> )");
                expect(worksheetData.data[3]).to.have.length(1);
                expect(worksheetData.data[3][0].value).to.eql("........ owner : <b>rohit</b> (  amount : <b>1000.00 INR</b> Count : <b>1</b> )");
                expect(worksheetData.data[4]).to.have.length(6);   //rohit data
                expect(worksheetData.data[5]).to.have.length(1);
                expect(worksheetData.data[5][0].value).to.eql("........ owner : <b>sachin & Team</b> (  amount : <b>5000.00 INR</b> Count : <b>2</b> )");
                expect(worksheetData.data[6]).to.have.length(1);
                expect(worksheetData.data[6][0].value).to.eql("............ owner : <b>sachin</b> (  amount : <b>2000.00 INR</b> Count : <b>1</b> )");
                expect(worksheetData.data[7]).to.have.length(6);   //sachin data
                expect(worksheetData.data[8]).to.have.length(1);
                expect(worksheetData.data[8][0].value).to.eql("............ owner : <b>ritesh</b> (  amount : <b>3000.00 INR</b> Count : <b>1</b> )");
                expect(worksheetData.data[9]).to.have.length(6);
                expect(worksheetData.data[10]).to.have.length(6);


            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("html report with group by 1", function (done) {
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
                        {field: "reporting_to_id", type: "fk", collectionid: {$query: {collection: "employeesss"}}, collection: "employeesss"},
                        {field: "userid", type: "fk", collectionid: {$query: {collection: "employeesss"}}, collection: "pl.users"},
                        {field: "name", type: "string", collectionid: {$query: {collection: "locationss"}}, visibility: true} ,
                        {field: "name", type: "string", index: 1, collectionid: {$query: {collection: "activitiesss"}}, visibility: true},
                        {field: "date", type: "date", index: 3, collectionid: {$query: {collection: "activitiesss"}}, visibility: true},
                        {field: "amount", type: "currency", index: 2, collectionid: {$query: {collection: "activitiesss"}}, ui: "currency", visibility: true, aggregate: "sum", aggregatable: true},
                        {field: "ownerid", label: "owner", type: "fk", collectionid: {$query: {collection: "activitiesss"}}, collection: "employeesss", displayField: "name", set: ["name"], visibility: true, recursion: JSON.stringify({"ownerid.reporting_to_id": "_id", "$rootFilter": {"userid": "$$CurrentUser"}, "$selected": true})},
                        {field: "location_id", label: "Location", type: "fk", collectionid: {$query: {collection: "activitiesss"}}, collection: "locationss", displayField: "name", set: ["name"], visibility: true},
                        {field: "profit_center_id", label: "Unit", type: "fk", collectionid: {$query: {collection: "activitiesss"}}, collection: "business_unitss", displayField: "name", set: ["name"], visibility: true}

                    ]},
                    {$collection: "pl.qviews", $insert: [
                        {label: "Activities", id: "activities", collection: {$query: {collection: "activitiesss"}}, mainCollection: {$query: {collection: "activitiesss"}}, group: JSON.stringify(["ownerid"])}
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
                    {"name": "rohit", "userid": {$query: {"username": "rohit.bansal@daffodil.com"}}},
                    {"name": "sachin", "reporting_to_id": {$query: {"name": "rohit"}}, "userid": {$query: {"username": "sachin.bansal@daffodil.com"}}},
                    {"name": "ritesh", "reporting_to_id": {$query: {"name": "sachin"}}, "userid": {$query: {"username": "ritesh.bansal@daffodil.com"}}}
                ]});
            }).then(
            function () {
                return db.update({$collection: "activitiesss", $insert: [
                    {"amount": {"amount": 1000, type: {$query: {currency: "INR"}}}, "name": "Activity1", "ownerid": {$query: {"name": "rohit"}}, "location_id": {$query: {"name": "Hisar"}}, "profit_center_id": {$query: {"name": "Applane"}}},
                    {"amount": {"amount": 2000, type: {$query: {currency: "INR"}}}, "name": "Activity2", "ownerid": {$query: {"name": "sachin"}}, "location_id": {$query: {"name": "Gurgaon"}}, "profit_center_id": {$query: {"name": "Applane"}}},
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
            function (view) {
                if (view.viewOptions.dataError) {
                    throw view.viewOptions.dataError;
                }
                return db.invokeFunction("ExportViewService.populateWorksheetData", [
                    view, true, true
                ]);
            }).then(
            function (worksheetData) {
                expect(worksheetData.data).to.have.length(10);
                expect(worksheetData.data[0]).to.have.length(6);
                expect(worksheetData.data[1]).to.have.length(1);
                expect(worksheetData.data[1][0].value).to.eql(" owner : <b>rohit & Team</b> (  amount : <b>6000.00 INR</b> Count : <b>3</b> )");
                expect(worksheetData.data[2]).to.have.length(1);
                expect(worksheetData.data[2][0].value).to.eql(".... owner : <b>rohit</b> (  amount : <b>1000.00 INR</b> Count : <b>1</b> )");
                expect(worksheetData.data[3]).to.have.length(6);   //rohit data
                expect(worksheetData.data[4]).to.have.length(1);
                expect(worksheetData.data[4][0].value).to.eql(".... owner : <b>sachin & Team</b> (  amount : <b>5000.00 INR</b> Count : <b>2</b> )");
                expect(worksheetData.data[5]).to.have.length(1);
                expect(worksheetData.data[5][0].value).to.eql("........ owner : <b>sachin</b> (  amount : <b>2000.00 INR</b> Count : <b>1</b> )");
                expect(worksheetData.data[6]).to.have.length(6);   //sachin data
                expect(worksheetData.data[7]).to.have.length(1);
                expect(worksheetData.data[7][0].value).to.eql("........ owner : <b>ritesh</b> (  amount : <b>3000.00 INR</b> Count : <b>1</b> )");
                expect(worksheetData.data[8]).to.have.length(6);
                expect(worksheetData.data[9]).to.have.length(6);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
})
