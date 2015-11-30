var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");


describe("FieldAlias testcase", function () {
    beforeEach(function (done) {
        return Testcases.beforeEach(done);
    });
    afterEach(function (done) {
        return Testcases.afterEach(done);
    });
    it("FieldAlias TestCase", function (done) {
        var db = undefined;
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "invoices"},
                        {collection: "deliveries"},
                        {collection: "products"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection: "pl.fields", $insert: [
                        {field: "invoicedetails", type: "object", multiple: true, ui: "grid", collectionid: {$query: {collection: "invoices"}}},
                        { field: "invoiceno", type: "string", collectionid: {$query: {collection: "invoices"}}},
                        {field: "deliveryno", type: "string", collectionid: {$query: {collection: "deliveries"}}},
                        {field: "name", type: "string", collectionid: {$query: {collection: "products"}}},
                        {field: "productid", type: "fk", "collection": "products", "displayField": "name", "set": ["name"], collectionid: {$query: {collection: "deliveries"}}},
                        {field: "deliveryid", type: "fk", collection: "deliveries", parentfieldid: {$query: {"field": "invoicedetails", collectionid: {$query: {"collection": "invoices"}}}}, ui: "autocomplete", displayField: "deliveryno", set: ["productid"], collectionid: {$query: {collection: "invoices"}}},
                        {field: "productid", type: "fk", collection: "products", parentfieldid: {$query: {"field": "deliveryid", collectionid: {$query: {"collection": "invoices"}}}}, ui: "autocomplete", displayField: "name", collectionid: {$query: {collection: "invoices"}}},
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
                        {"invoiceno": "12134", invoicedetails: [
                            {"deliveryid": {"$query": {"deliveryno": "1"}}, "amount_converted": {"amount": 1000, type: {$query: {"currency": "INR"}}}},
                            {"deliveryid": {"$query": {"deliveryno": "2"}}, "amount_converted": {"amount": 2000, type: {$query: {"currency": "INR"}}}},
                            {"deliveryid": {"$query": {"deliveryno": "3"}}, "amount_converted": {"amount": 3000, type: {$query: {"currency": "INR"}}}},
                            {"deliveryid": {"$query": {"deliveryno": "4"}}, "amount_converted": {"amount": 4000, type: {$query: {"currency": "INR"}}}},
                            {"deliveryid": {"$query": {"deliveryno": "5"}}, "amount_converted": {"amount": 5000, type: {$query: {"currency": "INR"}}}}
                        ]}
                    ]}
                ]);
            }).then(
            function () {
                var updates = [
                    {$collection: {collection: "pl.qviews", fields: [
                        {field: "id", type: "string"},
                        {"field": "collection", type: "fk", collection: "pl.collections", displayField: "collection", set: ["collection"]},
                        {"field": "mainCollection", type: "fk", collection: "pl.collections", displayField: "collection", set: ["collection"]}
                    ]}, $insert: [
                        {id: "productwise", collection: {$query: {collection: "invoices"}}, mainCollection: {$query: {collection: "invoices"}}, "group": JSON.stringify({
                            _id: {"invoicedetails_deliveryid_productid": "$invoicedetails.deliveryid.productid"},
                            "invoicedetails_deliveryid_productid": {"$first": "$invoicedetails.deliveryid.productid"},
                            "invoicedetails_amount_converted": {"$sum": "$invoicedetails.amount_converted"},
                            $fields: false,
                            $sort: {"invoicedetails.amount_converted": -1}
                        }), "unwind": JSON.stringify(["invoicedetails"])}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var v = {};
                v.id = "productwise";
                return db.invokeFunction("view.getView", [v]);
            }).then(
            function (result) {
                var data = result.data.result;

                expect(data).to.have.length(5);
                expect(data[0].invoicedetails_deliveryid_productid.name).to.eql("elasticsearch");
                expect(data[0].invoicedetails_amount_converted.amount).to.eql(5000);
                expect(data[0].invoicedetails_amount_converted.type.currency).to.eql("INR");

                expect(data[1].invoicedetails_deliveryid_productid.name).to.eql("angularjs");
                expect(data[1].invoicedetails_amount_converted.amount).to.eql(4000);
                expect(data[1].invoicedetails_amount_converted.type.currency).to.eql("INR");

                expect(data[2].invoicedetails_deliveryid_productid.name).to.eql("mongodb");
                expect(data[2].invoicedetails_amount_converted.amount).to.eql(3000);
                expect(data[2].invoicedetails_amount_converted.type.currency).to.eql("INR");

                expect(data[3].invoicedetails_deliveryid_productid.name).to.eql("nodejs");
                expect(data[3].invoicedetails_amount_converted.amount).to.eql(2000);
                expect(data[3].invoicedetails_amount_converted.type.currency).to.eql("INR");

                expect(data[4].invoicedetails_deliveryid_productid.name).to.eql("Iphone");
                expect(data[4].invoicedetails_amount_converted.amount).to.eql(1000);
                expect(data[4].invoicedetails_amount_converted.type.currency).to.eql("INR");

                var aggregateResult = result.data.aggregateResult;
                expect(aggregateResult.invoicedetails_amount_converted.amount).to.eql(15000);
                expect(aggregateResult.invoicedetails_amount_converted.type.currency).to.eql("INR");

            }).then(function () {
                var v = {};
                v.id = "productwise";
                v.$limit = 2;
                return db.invokeFunction("view.getView", [v]);
            }).then(function (result) {
                var data = result.data.result;

                expect(data).to.have.length(2);
                expect(data[0].invoicedetails_deliveryid_productid.name).to.eql("elasticsearch");
                expect(data[0].invoicedetails_amount_converted.amount).to.eql(5000);
                expect(data[0].invoicedetails_amount_converted.type.currency).to.eql("INR");

                expect(data[1].invoicedetails_deliveryid_productid.name).to.eql("angularjs");
                expect(data[1].invoicedetails_amount_converted.amount).to.eql(4000);
                expect(data[1].invoicedetails_amount_converted.type.currency).to.eql("INR");

                var aggregateResult = result.data.aggregateResult;
                expect(aggregateResult.invoicedetails_amount_converted.amount).to.eql(15000);
                expect(aggregateResult.invoicedetails_amount_converted.type.currency).to.eql("INR");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
})