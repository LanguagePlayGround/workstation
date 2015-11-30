var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var OPTIONS = {};
var Testcases = require("./TestCases.js");

describe("SubQueryAggregationtestcase", function () {
    /*   after(function (done) {
     ApplaneDB.removeCollections(["entities", "orders", "invoices", "businessunit"]);
     done();
     });
     */
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    it("subqueryaggregation", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var dataQuery = undefined;
                var aggregateQuery = undefined;

                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "entities"},
                        {collection: "businessunit"},
                        {collection: "orders"},
                        {collection: "invoices"}
                    ]},
                    {"$collection": "pl.fields", $insert: [
                        {field: "name", type: "string", collectionid: {$query: {collection: "businessunit"}}},

                        {visibility: true, field: "name", type: "string", collectionid: {$query: {collection: "entities"}}},
                        {visibility: true, field: "unit", type: "fk", collectionid: {$query: {collection: "entities"}}, collection: "businessunit", set: ["name"]},
                        {visibility: true, aggregate: "sum", field: "orderAmount", type: "object", collectionid: {$query: {collection: "entities"}}, query: JSON.stringify({"$query": {"$collection": "orders", "$group": {"_id": null, "order_amount": {"$sum": "$order_amount"}}}, "$fk": "entity_id", "$type": {"scalar": "order_amount"}})},
                        {visibility: true, aggregate: "sum", field: "invoiceAmount", type: "object", collectionid: {$query: {collection: "entities"}}, query: JSON.stringify({"$query": {"$collection": "invoices", "$group": {"_id": null, "invoice_amount_base_currency": {"$sum": "$invoice_amount_base_currency"}}}, "$fk": "entity_id", "$type": {"scalar": "invoice_amount_base_currency"}})},

                        {field: "invoice_amount_base_currency", type: "number", collectionid: {$query: {collection: "invoices"}}},
                        {field: "entity_id", type: "fk", collectionid: {$query: {collection: "invoices"}}, collection: "entities", set: ["name"]},

                        {field: "order_amount", type: "number", collectionid: {$query: {collection: "orders"}}},
                        {field: "entity_id", type: "fk", collectionid: {$query: {collection: "orders"}}, collection: "entities", set: ["name"]}
                    ]}
                ]);

            }).then(function () {
                return  db.update([
                    {$collection: "businessunit", "$insert": [
                        {name: "Applane"},
                        { "name": "Daffodil"}
                    ]},
                    {$collection: "entities", $insert: [
                        {name: "Darcl Logistics Ltd.", "unit": {$query: {name: "Applane"}}},
                        {name: "Radcliffe Foundation", "unit": {$query: {name: "Applane"}}},
                        {name: "St. Mary's Educational Trust", "unit": {$query: {name: "Applane"}}},
                        {name: "Torero Corporation Pvt. Ltd.", "unit": {$query: {name: "Applane"}}},
                        {name: "Manav Sthali School", "unit": {$query: {name: "Applane"}}},
                        {name: "Educomp Solutions Ltd.", "unit": {$query: {name: "Daffodil"}}},
                        {name: "Shiksha Bharti Public School", "unit": {$query: {name: "Daffodil"}}},
                        {name: "St. John's Matriculation School", "unit": {$query: {name: "Daffodil"}}},
                        {name: "CAN innovate solutions", "unit": {$query: {name: "Daffodil"}}},
                        {name: "HITKARINI SABHA", "unit": {$query: {name: "Daffodil"}}},
                        {name: "Kanchi Global School", "unit": {$query: {name: "Daffodil"}}},
                        {name: "Neev Trust", "unit": {$query: {name: "Daffodil"}}}
                    ]},
                    {"$collection": "orders", $insert: [
                        {order_amount: 100, "entity_id": {"$query": {name: "Darcl Logistics Ltd."}}},
                        {order_amount: 200, "entity_id": {"$query": {name: "Darcl Logistics Ltd."}}},
                        {order_amount: 300, "entity_id": {"$query": {name: "Radcliffe Foundation"}}},
                        {order_amount: 400, "entity_id": {"$query": {name: "Radcliffe Foundation"}}},
                        {order_amount: 500, "entity_id": {"$query": {name: "Shiksha Bharti Public School"}}},
                        {order_amount: 600, "entity_id": {"$query": {name: "HITKARINI SABHA"}}},
                        {order_amount: 700, "entity_id": {"$query": {name: "Neev Trust"}}},
                        {order_amount: 100, "entity_id": {"$query": {name: "Manav Sthali School"}}},
                        {order_amount: 300, "entity_id": {"$query": {name: "St. Mary's Educational Trust"}}},
                        {order_amount: 400, "entity_id": {"$query": {name: "St. Mary's Educational Trust"}}},
                        {order_amount: 500, "entity_id": {"$query": {name: "Educomp Solutions Ltd."}}},
                        {order_amount: 600, "entity_id": {"$query": {name: "Educomp Solutions Ltd."}}},
                        {order_amount: 700, "entity_id": {"$query": {name: "Torero Corporation Pvt. Ltd."}}},
                        {order_amount: 200, "entity_id": {"$query": {name: "Torero Corporation Pvt. Ltd."}}},
                        {order_amount: 200, "entity_id": {"$query": {name: "CAN innovate solutions"}}}
                    ]},
                    {"$collection": "invoices", $insert: [
                        {invoice_amount_base_currency: 100, "entity_id": {"$query": {name: "Darcl Logistics Ltd."}}},
                        {invoice_amount_base_currency: 200, "entity_id": {"$query": {name: "Darcl Logistics Ltd."}}},
                        {invoice_amount_base_currency: 300, "entity_id": {"$query": {name: "Radcliffe Foundation"}}},
                        {invoice_amount_base_currency: 400, "entity_id": {"$query": {name: "Radcliffe Foundation"}}},
                        {invoice_amount_base_currency: 500, "entity_id": {"$query": {name: "Shiksha Bharti Public School"}}},
                        {invoice_amount_base_currency: 600, "entity_id": {"$query": {name: "HITKARINI SABHA"}}},
                        {invoice_amount_base_currency: 700, "entity_id": {"$query": {name: "Neev Trust"}}},
                        {invoice_amount_base_currency: 100, "entity_id": {"$query": {name: "Manav Sthali School"}}},
                        {invoice_amount_base_currency: 300, "entity_id": {"$query": {name: "St. Mary's Educational Trust"}}},
                        {invoice_amount_base_currency: 400, "entity_id": {"$query": {name: "St. Mary's Educational Trust"}}},
                        {invoice_amount_base_currency: 500, "entity_id": {"$query": {name: "Educomp Solutions Ltd."}}},
                        {invoice_amount_base_currency: 600, "entity_id": {"$query": {name: "Educomp Solutions Ltd."}}},
                        {invoice_amount_base_currency: 700, "entity_id": {"$query": {name: "Torero Corporation Pvt. Ltd."}}},
                        {invoice_amount_base_currency: 200, "entity_id": {"$query": {name: "Torero Corporation Pvt. Ltd."}}},
                        {invoice_amount_base_currency: 200, "entity_id": {"$query": {name: "CAN innovate solutions"}}}
                    ]}
                ]);
            }).then(function () {
                return db.update({$collection: {collection: "pl.qviews", fields: [
                    {field: "id", type: "string"},
                    {"field": "collection", type: "fk", collection: "pl.collections", displayField: "collection", set: ["collection"]},
                    {"field": "mainCollection", type: "fk", collection: "pl.collections", displayField: "collection", set: ["collection"]}
                ]}, "$insert": [
                    {"id": "customers", "collection": {$query: {collection: "entities"}}, mainCollection: {$query: {collection: "entities"}}}
                ]});
            }).then(function () {
                return db.invokeFunction("view.getView", [
                    {"id": "customers", "$limit": 3, "$parameters": {"unit": "Applane"}, "fetchCount": true}
                ])
            }).then(function (result) {
                expect(result.data.result).to.have.length(3);
                expect(result.data.aggregateResult.invoiceAmount).to.eql(5800);
                expect(result.data.aggregateResult.orderAmount).to.eql(5800);
                expect(result.data.aggregateResult.__count).to.eql(12);
            }).then(function () {
                return db.invokeFunction("view.getView", [
                    {"id": "customers", "$limit": 3, "$filter": {"unit.name": "$unit"}, "$parameters": {"unit": "Applane"}, "fetchCount": true}
                ])
            }).then(function (result) {
                dataQuery = result.viewOptions.queryGrid;
                aggregateQuery = result.viewOptions.aggregateQueryGrid;
                expect(result.data.result).to.have.length(3);
                expect(result.data.result[0].name).to.eql("Manav Sthali School");
                expect(result.data.result[0].invoiceAmount).to.eql(100);
                expect(result.data.result[0].orderAmount).to.eql(100);
                expect(result.data.result[1].name).to.eql("Torero Corporation Pvt. Ltd.");
                expect(result.data.result[1].invoiceAmount).to.eql(900);
                expect(result.data.result[1].orderAmount).to.eql(900);
                expect(result.data.result[2].name).to.eql("St. Mary's Educational Trust");
                expect(result.data.result[2].invoiceAmount).to.eql(700);
                expect(result.data.result[2].orderAmount).to.eql(700);
                expect(result.data.aggregateResult.invoiceAmount).to.eql(2700)
                expect(result.data.aggregateResult.orderAmount).to.eql(2700)
                expect(result.data.aggregateResult.__count).to.eql(5)
            }).then(function () {
                var batchQuery = {};
                dataQuery.$skip = 3;
                batchQuery.data = dataQuery;
                batchQuery.aggregateData = {$query: aggregateQuery, $parent: "data", $aggregate: true};
                return db.batchQuery(batchQuery);
            }).then(function (result) {
                expect(result.data.result).to.have.length(2);
                expect(result.data.result[0].name).to.eql("Radcliffe Foundation");
                expect(result.data.result[0].invoiceAmount).to.eql(700);
                expect(result.data.result[0].orderAmount).to.eql(700);
                expect(result.data.result[1].name).to.eql("Darcl Logistics Ltd.");
                expect(result.data.result[1].invoiceAmount).to.eql(300);
                expect(result.data.result[1].orderAmount).to.eql(300);
                expect(result.aggregateData.result[0].invoiceAmount).to.eql(2700)
                expect(result.aggregateData.result[0].orderAmount).to.eql(2700)
                expect(result.aggregateData.result[0].__count).to.eql(5)
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    });
});