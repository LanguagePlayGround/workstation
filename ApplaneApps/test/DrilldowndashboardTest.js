var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");


describe("Drilldowntestcase", function () {
    beforeEach(function (done) {
        return Testcases.beforeEach(done);
    });
    afterEach(function (done) {
        return Testcases.afterEach(done);
    });
    it("Drilldowndashboard TestCase", function (done) {
        var db = undefined;
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "invoices"},
                        {collection: "deliveries"},
                        {collection: "products"},
                        {collection: "customers"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection: "pl.fields", $insert: [
                        {field: "name", type: "string", collectionid: {$query: {collection: "customers"}}},
                        {filterable: true, drillDownEnabled: true, drillDownValue: "amount_converted", field: "customerid", type: "fk", "collection": "customers", "displayField": "name", "set": ["name"], collectionid: {$query: {collection: "invoices"}}},
                        {"aggregate": "sum", "visibility": true, visibilityGrid: true, field: "amount_converted", collectionid: {$query: {collection: "invoices"}}, "type": "currency", "ui": "currency"},
                        {field: "invoicedetails", type: "object", multiple: true, ui: "grid", collectionid: {$query: {collection: "invoices"}}},
                        { field: "invoiceno", type: "string", collectionid: {$query: {collection: "invoices"}}},
                        {field: "deliveryno", type: "string", collectionid: {$query: {collection: "deliveries"}}},
                        {field: "name", type: "string", collectionid: {$query: {collection: "products"}}},
                        {filterable: true, field: "productid", type: "fk", "collection": "products", "displayField": "name", "set": ["name"], collectionid: {$query: {collection: "deliveries"}}},
                        {field: "deliveryid", type: "fk", collection: "deliveries", parentfieldid: {$query: {"field": "invoicedetails", collectionid: {$query: {"collection": "invoices"}}}}, ui: "autocomplete", displayField: "deliveryno", set: ["productid"], collectionid: {$query: {collection: "invoices"}}},
                        {drillDownEnabled: true, drillDownValue: "invoicedetails.amount_converted", drillDownUnwind: "invoicedetails", field: "productid", type: "fk", collection: "products", parentfieldid: {$query: {"field": "deliveryid", collectionid: {$query: {"collection": "invoices"}}}}, ui: "autocomplete", displayField: "name", collectionid: {$query: {collection: "invoices"}}},
                        {alias: "invoicedetails_amount_converted", "aggregate": "sum", "visibility": true, visibilityGrid: true, field: "amount_converted", parentfieldid: {"$query": {"field": "invoicedetails", collectionid: {$query: {"collection": "invoices"}}}}, collectionid: {$query: {collection: "invoices"}}, "type": "currency", "ui": "currency"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.update([
                    {$collection: "pl.currencies", $insert: [
                        {currency: "INR"}
                    ]},
                    {$collection: "customers", $insert: [
                        {name: "Avento a"},
                        {name: "Finesse Technology Trading LLC"},
                        {name: "Eatability Pty Ltd"},
                        {name: "Dangerfield Brothers Ltd"},
                        {name: "Avneet Technology Solution"}
                    ]},

                    {$collection: "products", $insert: [
                        {name: "Iphone"},
                        {name: "nodejs"},
                        {name: "mongodb"},
                        {name: "angularjs"},
                        {name: "elasticsearch"}
                    ]},
                    {$collection: "deliveries", $insert: [
                        {
                            productid: {$query: {name: "Iphone"}}, "deliveryno": "1"
                        },
                        {
                            productid: {$query: {name: "nodejs"}}, "deliveryno": "2"
                        },
                        {
                            productid: {$query: {name: "mongodb"}}, "deliveryno": "3"
                        },
                        {
                            productid: {$query: {name: "angularjs"}}, "deliveryno": "4"
                        },
                        {
                            productid: {$query: {name: "elasticsearch"}}, "deliveryno": "5"
                        }
                    ]},
                    {"$collection": "invoices", "$insert": [
                        {"invoiceno": "12134", "customerid": {$query: {name: "Avento a"}}, "amount_converted": {"amount": 1000, type: {$query: {"currency": "INR"}}}, invoicedetails: [
                            {"deliveryid": {"$query": {"deliveryno": "1"}}, "amount_converted": {"amount": 1000, type: {$query: {"currency": "INR"}}}}
                        ]},
                        {"invoiceno": "12345", "customerid": {$query: {name: "Finesse Technology Trading LLC"}}, "amount_converted": {"amount": 2000, type: {$query: {"currency": "INR"}}}, invoicedetails: [
                            {"deliveryid": {"$query": {"deliveryno": "2"}}, "amount_converted": {"amount": 2000, type: {$query: {"currency": "INR"}}}}
                        ]},
                        {"invoiceno": "32145", "customerid": {$query: {name: "Eatability Pty Ltd"}}, "amount_converted": {"amount": 3000, type: {$query: {"currency": "INR"}}}, invoicedetails: [
                            {"deliveryid": {"$query": {"deliveryno": "3"}}, "amount_converted": {"amount": 3000, type: {$query: {"currency": "INR"}}}}
                        ]},
                        {"invoiceno": "43124", "customerid": {$query: {name: "Dangerfield Brothers Ltd"}}, "amount_converted": {"amount": 5000, type: {$query: {"currency": "INR"}}}, invoicedetails: [
                            {"deliveryid": {"$query": {"deliveryno": "4"}}, "amount_converted": {"amount": 4000, type: {$query: {"currency": "INR"}}}}
                        ]},
                        {"invoiceno": "54213", "customerid": {$query: {name: "Avneet Technology Solution"}}, "amount_converted": {"amount": 5000, type: {$query: {"currency": "INR"}}}, invoicedetails: [
                            {"deliveryid": {"$query": {"deliveryno": "5"}}, "amount_converted": {"amount": 5000, type: {$query: {"currency": "INR"}}}}
                        ]}
                    ]}
                ]);
            }).then(function () {
                return db.invokeFunction("Fields.populateDrillDownView", [
                    {collection: "invoices"}
                ]);
            }).then(function () {
                var v = {};
                v.id = "invoices__drilldowndashboard";
                return db.invokeFunction("view.getView", [v]);
            }).then(
            function (result) {
                expect(result.viewOptions.views).to.have.length(2);
                expect(result.viewOptions.id).to.eql("invoices__drilldowndashboard");
                expect(result.viewOptions.ui).to.eql("dashboard")
                expect(result.viewOptions.executeOnClient).to.eql(true);
                expect(result.viewOptions.runAsBatchQuery).to.eql(true);
                expect(result.viewOptions.dashboardType).to.eql("AdvanceDashboard");
                expect(result.viewOptions.dashboardLayout).to.eql("2 Columns");
                expect(result.viewOptions.reloadViewOnFilterChange).to.eql(true);
                expect(result.viewOptions.views[0].id).to.eql("invoices__drilldown");

                expect(result.viewOptions.views[0].view.viewOptions.alias).to.eql("customerid");
                expect(result.viewOptions.views[0].view.viewOptions.fields).to.have.length(2);
                expect(result.viewOptions.views[0].view.viewOptions.fields[0].field).to.eql("amount_converted");
                expect(result.viewOptions.views[0].view.viewOptions.fields[0].index).to.eql(2);
                expect(result.viewOptions.views[0].view.viewOptions.fields[0].indexGrid).to.eql(2);
                expect(result.viewOptions.views[0].view.viewOptions.fields[0].width).to.eql("200px");
                expect(result.viewOptions.views[0].view.viewOptions.fields[0].visibility).to.eql(true);
                expect(result.viewOptions.views[0].view.viewOptions.fields[1].field).to.eql("customerid");
                expect(result.viewOptions.views[0].view.viewOptions.fields[1].index).to.eql(1);
                expect(result.viewOptions.views[0].view.viewOptions.fields[1].indexGrid).to.eql(1);
                expect(result.viewOptions.views[0].view.viewOptions.fields[1].width).to.eql("0px");
                expect(result.viewOptions.views[0].view.viewOptions.fields[1].visibilityGrid).to.eql(true);
                expect(result.viewOptions.views[0].view.viewOptions.queryGrid.$group._id.customerid).to.eql("$customerid");
                expect(result.viewOptions.views[0].view.viewOptions.queryGrid.$group.$fields).to.eql(false);
                expect(result.viewOptions.views[0].view.viewOptions.queryGrid.$group.customerid.$first).to.eql("$customerid");
                expect(result.viewOptions.views[0].view.viewOptions.queryGrid.$group.amount_converted.$sum).to.eql("$amount_converted");
//                expect(result.viewOptions.views[0].view.viewOptions.queryGrid.$filter).to.eql({"$and":[{"customerid":{"$$whenDefined":{"key":"$customerid"}}}]});
                expect(result.viewOptions.views[0].view.viewOptions.queryGrid.$filter).to.eql({"customerid":{"$$whenDefined":{"key":"$customerid"}}});


                expect(result.viewOptions.views[1].id).to.eql("invoices__drilldown");
                expect(result.viewOptions.views[1].view.viewOptions.alias).to.eql("productid");
                expect(result.viewOptions.views[1].view.viewOptions.fields).to.have.length(1);
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].field).to.eql("invoicedetails");
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].visibility).to.eql(false);
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].visibilityGrid).to.eql(false);
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].visibilityForm).to.eql(false);

                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields).to.have.length(2);
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[0].field).to.eql("amount_converted");
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[0].alias).to.eql("invoicedetails_amount_converted");
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[0].index).to.eql(2);
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[0].visibilityGrid).to.eql(true);
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[0].width).to.eql("200px");
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[1].field).to.eql("deliveryid");
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[1].visibilityGrid).to.eql(false);
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[1].visibilityForm).to.eql(false);
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[1].visibility).to.eql(false);
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[1].fields).to.have.length(1);
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[1].fields[0].field).to.eql("productid");
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[1].fields[0].alias).to.eql("invoicedetails_deliveryid_productid");
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[1].fields[0].width).to.eql("0px");
                expect(result.viewOptions.views[1].view.viewOptions.fields[0].fields[1].fields[0].visibilityGrid).to.eql(true);

                expect(result.viewOptions.views[1].view.viewOptions.queryGrid.$group._id.invoicedetails_deliveryid_productid).to.eql("$invoicedetails.deliveryid.productid");
                expect(result.viewOptions.views[1].view.viewOptions.queryGrid.$group.$fields).to.eql(false);
                expect(result.viewOptions.views[1].view.viewOptions.queryGrid.$group.invoicedetails_deliveryid_productid.$first).to.eql("$invoicedetails.deliveryid.productid");
                expect(result.viewOptions.views[1].view.viewOptions.queryGrid.$group.invoicedetails_amount_converted.$sum).to.eql("$invoicedetails.amount_converted");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
})