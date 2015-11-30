/**
 *  mocha --recursive --timeout 150000 -g "FK merging testcase" --reporter spec
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require('./NorthwindDb.js');
var Testcases = require("./TestCases.js");

describe("FK merging testcase", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });

    it("fk single and nested with set and delete", function (done) {
        var sbiid = undefined, salaryid = undefined, statebankid = undefined;
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefination = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "Account"},
                        {collection: "Invoice"},
                        {collection: "Vendor"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "acc_name", type: "string", collectionid: {$query: {collection: "Account"}}} ,
                        {field: "acc_number", type: "number", collectionid: {$query: {collection: "Account"}}} ,
                        {field: "vendor_name", type: "string", collectionid: {$query: {collection: "Vendor"}}} ,
                        {field: "vendor_amount", type: "number", collectionid: {$query: {collection: "Vendor"}}} ,
                        {field: "vendor_account", type: "fk", collectionid: {$query: {collection: "Vendor"}}, collection: "Account", set: ["acc_name"]},
                        {field: "invoice_Type", type: "string", collectionid: {$query: {collection: "Invoice"}}} ,
                        {field: "invoice_reference", type: "number", collectionid: {$query: {collection: "Invoice"}}} ,
                        {field: "invoice_lineItems", type: "object", multiple: true, collectionid: {$query: {collection: "Invoice"}}},
                        {field: "Payee", type: "fk", collection: "Account", set: ["acc_name", "acc_number"], parentfieldid: {$query: {collectionid: {$query: {collection: "Invoice"}}, field: "invoice_lineItems"}}, collectionid: {$query: {collection: "Invoice"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var accounts = {$collection: "Account", $insert: [
                    {acc_name: "SBI", acc_number: 1111},
                    {acc_name: "Salary", acc_number: 2222},
                    {acc_name: "State Bank", acc_number: 3333}
                ]};
                return db.update(accounts);
            }).then(
            function () {
                return db.query({$collection: "Account", $sort: {acc_number: 1}});
            }).then(
            function (data) {
                data = data.result;
                sbiid = data[0]._id;
                salaryid = data[1]._id;
                statebankid = data[2]._id;
            }).then(
            function () {
                var vendors = {$collection: "Vendor", $insert: [
                    {vendor_name: "Calcutta's Chef", vendor_account: {_id: sbiid}, vendor_amount: 123},
                    {vendor_name: "Uttam Lal", vendor_account: {_id: salaryid}, vendor_amount: 234},
                    {vendor_name: "Vijay & Co", vendor_account: {_id: sbiid}, vendor_amount: 456},
                    {vendor_name: "ERNET India", vendor_account: {_id: statebankid}, vendor_amount: 678}
                ]};
                return db.update(vendors);
            }).then(
            function () {
                var invoices = {$collection: "Invoice", $insert: [
                    {invoice_Type: "Expense", invoice_reference: 234, invoice_lineItems: [
                        { Payee: {_id: sbiid}}
                    ]},
                    {invoice_Type: "Expense", invoice_reference: 456, invoice_lineItems: [
                        { Payee: {_id: salaryid}}
                    ]},
                    {invoice_Type: "Expense", invoice_reference: 768, invoice_lineItems: [
                        { Payee: {_id: statebankid}}
                    ]}
                ]};
                return db.update(invoices);
            }).then(
            function () {
                return db.asyncDB().invokeFunction("Porting.mergeFkDataInProcess", [
                    {data: {collection: "Account", _id: sbiid.toString(), target: {_id: statebankid}, delete: true}}
                ]);
            }).then(
            function () {
                return db.query({$collection: "Account", $filter: {_id: sbiid}});
            }).then(
            function (data) {
                data = data.result;
                expect(data).to.have.length(0);
            }).then(
            function () {
                return db.query({$collection: "Vendor", $sort: {vendor_amount: 1}});
            }).then(
            function (data) {
                data = data.result;
                expect(data).to.have.length(4);
                expect(data[0].vendor_account._id.toString()).to.eql(statebankid.toString());
                expect(data[1].vendor_account._id.toString()).to.eql(salaryid.toString());
                expect(data[2].vendor_account._id.toString()).to.eql(statebankid.toString());
                expect(data[3].vendor_account._id.toString()).to.eql(statebankid.toString());
                expect(data[0].vendor_account.acc_name).to.eql("State Bank");
                expect(data[1].vendor_account.acc_name).to.eql("Salary");
                expect(data[2].vendor_account.acc_name).to.eql("State Bank");
                expect(data[3].vendor_account.acc_name).to.eql("State Bank");
                expect(data[0].vendor_name).to.eql("Calcutta's Chef");
                expect(data[1].vendor_name).to.eql("Uttam Lal");
                expect(data[2].vendor_name).to.eql("Vijay & Co");
                expect(data[3].vendor_name).to.eql("ERNET India");
            }).then(
            function () {
                return db.query({$collection: "Invoice", $sort: {invoice_reference: 1}});
            }).then(
            function (data) {
                data = data.result;
                expect(data).to.have.length(3);
                expect(data[0].invoice_lineItems[0].Payee._id.toString()).to.eql(statebankid.toString());
                expect(data[1].invoice_lineItems[0].Payee._id.toString()).to.eql(salaryid.toString());
                expect(data[2].invoice_lineItems[0].Payee._id.toString()).to.eql(statebankid.toString());
                expect(data[0].invoice_lineItems[0].Payee.acc_name).to.eql("State Bank");
                expect(data[1].invoice_lineItems[0].Payee.acc_name).to.eql("Salary");
                expect(data[2].invoice_lineItems[0].Payee.acc_name).to.eql("State Bank");
                expect(data[0].invoice_lineItems[0].Payee.acc_number).to.eql(3333);
                expect(data[1].invoice_lineItems[0].Payee.acc_number).to.eql(2222);
                expect(data[2].invoice_lineItems[0].Payee.acc_number).to.eql(3333);
                expect(data[0].invoice_reference).to.eql(234);
                expect(data[1].invoice_reference).to.eql(456);
                expect(data[2].invoice_reference).to.eql(768);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it("fk multiple and without set and delete", function (done) {
        var sbiid = undefined, salaryid = undefined, statebankid = undefined;
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefination = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "Account"},
                        {collection: "Invoice"},
                        {collection: "Vendor"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "acc_name", type: "string", collectionid: {$query: {collection: "Account"}}} ,
                        {field: "acc_number", type: "number", collectionid: {$query: {collection: "Account"}}} ,
                        {field: "vendor_name", type: "string", collectionid: {$query: {collection: "Vendor"}}} ,
                        {field: "vendor_amount", type: "number", collectionid: {$query: {collection: "Vendor"}}} ,
                        {field: "vendor_account", type: "fk", multiple: true, collectionid: {$query: {collection: "Vendor"}}, collection: "Account"},
                        {field: "invoice_Type", type: "string", collectionid: {$query: {collection: "Invoice"}}} ,
                        {field: "invoice_reference", type: "number", collectionid: {$query: {collection: "Invoice"}}} ,
                        {field: "invoice_lineItems", type: "object", multiple: true, collectionid: {$query: {collection: "Invoice"}}},
                        {field: "Payee", type: "fk", multiple: true, collection: "Account", set: ["acc_name"], parentfieldid: {$query: {collectionid: {$query: {collection: "Invoice"}}, field: "invoice_lineItems"}}, collectionid: {$query: {collection: "Invoice"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                var accounts = {$collection: "Account", $insert: [
                    {acc_name: "SBI", acc_number: 1111},
                    {acc_name: "Salary", acc_number: 2222},
                    {acc_name: "State Bank", acc_number: 3333}
                ]};
                return db.update(accounts);
            }).then(
            function () {
                return db.query({$collection: "Account", $sort: {acc_number: 1}});
            }).then(
            function (data) {
                data = data.result;
                sbiid = data[0]._id;
                salaryid = data[1]._id;
                statebankid = data[2]._id;
            }).then(
            function () {
                var vendors = {$collection: "Vendor", $insert: [
                    {vendor_name: "Calcutta's Chef", vendor_account: [
                        {_id: sbiid},
                        {_id: salaryid}
                    ], vendor_amount: 123},
                    {vendor_name: "Uttam Lal", vendor_account: [
                        {_id: salaryid}
                    ], vendor_amount: 234},
                    {vendor_name: "Vijay & Co", vendor_account: [
                        {_id: sbiid}
                    ], vendor_amount: 456},
                    {vendor_name: "ERNET India", vendor_account: [
                        {_id: statebankid}
                    ], vendor_amount: 678}
                ]};
                return db.update(vendors);
            }).then(
            function () {
                var invoices = {$collection: "Invoice", $insert: [
                    {invoice_Type: "Expense", invoice_reference: 234, invoice_lineItems: [
                        { Payee: [
                            {_id: sbiid},
                            {_id: salaryid}
                        ]}
                    ]},
                    {invoice_Type: "Expense", invoice_reference: 456, invoice_lineItems: [
                        { Payee: [
                            {_id: salaryid}
                        ]}
                    ]},
                    {invoice_Type: "Expense", invoice_reference: 768, invoice_lineItems: [
                        { Payee: [
                            {_id: statebankid}
                        ]}
                    ]}
                ]};
                return db.update(invoices);
            }).then(
            function () {
                return db.asyncDB().invokeFunction("Porting.mergeFkDataInProcess", [
                    {data: {collection: "Account", _id: sbiid.toString(), target: {_id: statebankid}}}
                ]);
            }).then(
            function () {
                return db.query({$collection: "Account", $filter: {_id: sbiid}});
            }).then(
            function (data) {
                data = data.result;
                expect(data).to.have.length(1);
            }).then(
            function () {
                return db.query({$collection: "Vendor", $sort: {vendor_amount: 1}});
            }).then(
            function (data) {
                data = data.result;
                expect(data).to.have.length(4);
                expect(data[0].vendor_account[0]._id.toString()).to.eql(statebankid.toString());
                expect(data[0].vendor_account[1]._id.toString()).to.eql(salaryid.toString());
                expect(data[1].vendor_account[0]._id.toString()).to.eql(salaryid.toString());
                expect(data[2].vendor_account[0]._id.toString()).to.eql(statebankid.toString());
                expect(data[3].vendor_account[0]._id.toString()).to.eql(statebankid.toString());
                expect(data[0].vendor_name).to.eql("Calcutta's Chef");
                expect(data[1].vendor_name).to.eql("Uttam Lal");
                expect(data[2].vendor_name).to.eql("Vijay & Co");
                expect(data[3].vendor_name).to.eql("ERNET India");
            }).then(
            function () {
                return db.query({$collection: "Invoice", $sort: {invoice_reference: 1}});
            }).then(
            function (data) {
                data = data.result;
                expect(data).to.have.length(3);
                expect(data[0].invoice_lineItems[0].Payee[0]._id.toString()).to.eql(statebankid.toString());
                expect(data[0].invoice_lineItems[0].Payee[1]._id.toString()).to.eql(salaryid.toString());
                expect(data[1].invoice_lineItems[0].Payee[0]._id.toString()).to.eql(salaryid.toString());
                expect(data[2].invoice_lineItems[0].Payee[0]._id.toString()).to.eql(statebankid.toString());
                expect(data[0].invoice_lineItems[0].Payee[0].acc_name).to.eql("State Bank");
                expect(data[0].invoice_lineItems[0].Payee[1].acc_name).to.eql("Salary");
                expect(data[1].invoice_lineItems[0].Payee[0].acc_name).to.eql("Salary");
                expect(data[2].invoice_lineItems[0].Payee[0].acc_name).to.eql("State Bank");
                expect(data[0].invoice_reference).to.eql(234);
                expect(data[1].invoice_reference).to.eql(456);
                expect(data[2].invoice_reference).to.eql(768);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it("fk unique", function (done) {
        var sbiid = undefined, salaryid = undefined, statebankid = undefined;
        var db = undefined;
        var processid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefination = [
                    {$collection: "pl.collections", $insert: [
                        {collection: "Account"},
                        {collection: "Invoice"},
                        {collection: "Vendor"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "acc_name", type: "string", collectionid: {$query: {collection: "Account"}}} ,
                        {field: "acc_number", type: "number", collectionid: {$query: {collection: "Account"}}} ,
                        {field: "vendor_name", type: "string", collectionid: {$query: {collection: "Vendor"}}} ,
                        {field: "vendor_amount", type: "number", collectionid: {$query: {collection: "Vendor"}}} ,
                        {field: "vendor_account", type: "fk", collectionid: {$query: {collection: "Vendor"}}, collection: "Account", set: ["acc_name"]},
                        {field: "invoice_Type", type: "string", collectionid: {$query: {collection: "Invoice"}}} ,
                        {field: "invoice_reference", type: "number", collectionid: {$query: {collection: "Invoice"}}} ,
                        {field: "invoice_lineItems", type: "object", multiple: true, collectionid: {$query: {collection: "Invoice"}}},
                        {field: "Payee", type: "fk", collection: "Account", set: ["acc_name", "acc_number"], parentfieldid: {$query: {collectionid: {$query: {collection: "Invoice"}}, field: "invoice_lineItems"}}, collectionid: {$query: {collection: "Invoice"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return db.collection("Vendor");
            }).then(
            function (vendorCollection) {
                return vendorCollection.ensureIndex({"vendor_account._id": 1}, {unique: true});
            }).then(function () {
                var accounts = {$collection: "Account", $insert: [
                    {acc_name: "SBI", acc_number: 1111},
                    {acc_name: "Salary", acc_number: 2222},
                    {acc_name: "State Bank", acc_number: 3333}
                ]};
                return db.update(accounts);
            }).then(
            function () {
                return db.query({$collection: "Account", $sort: {acc_number: 1}});
            }).then(
            function (data) {
                data = data.result;
                sbiid = data[0]._id;
                salaryid = data[1]._id;
                statebankid = data[2]._id;
            }).then(
            function () {
                var vendors = {$collection: "Vendor", $insert: [
                    {vendor_name: "Calcutta's Chef", vendor_account: {_id: sbiid}, vendor_amount: 123},
                    {vendor_name: "Uttam Lal", vendor_account: {_id: salaryid}, vendor_amount: 234},
                    {vendor_name: "ERNET India", vendor_account: {_id: statebankid}, vendor_amount: 678}
                ]};
                return db.update(vendors);
            }).then(
            function () {
                var invoices = {$collection: "Invoice", $insert: [
                    {invoice_Type: "Expense", invoice_reference: 234, invoice_lineItems: [
                        { Payee: {_id: sbiid}}
                    ]},
                    {invoice_Type: "Expense", invoice_reference: 456, invoice_lineItems: [
                        { Payee: {_id: salaryid}}
                    ]}
                ]};
                return db.update(invoices);
            }).then(function(){
                return db.update({$collection: "pl.processes", $insert: {name: "Merge data"}});
            }).then(
            function (update) {
                processid= update["pl.processes"].$insert[0]._id;
                return db.asyncDB().invokeFunction("Porting.mergeFkDataInProcess", [
                    {data: {collection: "Account", _id: sbiid.toString(), target: {_id: statebankid}, delete: true}}
                ],{processid:processid});
            }).fail(function (err) {
                if (err.toString().indexOf("Failed in Some Records") < 0) {
                    throw err;
                }else{
                    return db.query({$collection: "pl.processes", $filter: {_id: processid}}).then(function(result){
                        expect(result.result[0].detail).to.have.length(1);
                        expect(result.result[0].detail[0].status).to.eql("Failed");
                        expect(result.result[0].detail[0].error).to.not.eql(undefined);
                    })
                }
            }).then(
            function () {
                return db.query({$collection: "Account", $filter: {_id: sbiid}});
            }).then(
            function (data) {
                data = data.result;
                expect(data).to.have.length(1);
            }).then(
            function () {
                return db.query({$collection: "Invoice", $sort: {invoice_reference: 1}});
            }).then(
            function (data) {
                data = data.result;
                expect(data).to.have.length(2);
                expect(data[0].invoice_lineItems[0].Payee._id.toString()).to.eql(statebankid.toString());
                expect(data[1].invoice_lineItems[0].Payee._id.toString()).to.eql(salaryid.toString());
                expect(data[0].invoice_lineItems[0].Payee.acc_name).to.eql("State Bank");
                expect(data[1].invoice_lineItems[0].Payee.acc_name).to.eql("Salary");
                expect(data[0].invoice_reference).to.eql(234);
                expect(data[1].invoice_reference).to.eql(456);
            }).then(
            function () {
                return ApplaneDB.getLogDB();
            }).then(
            function (logDb) {
                return logDb.query({$collection: "pl.logs", $filter: {type: "MergeRecord", status: "Failed"}});
            }).then(
            function (data) {
                data = data.result;
                expect(data).to.have.length(1);
                expect(data[0].logs).to.have.length(1);
                expect(data[0].logs[0].status).to.eql("Failed");
                expect(data[0].logs[0].error).to.contain("E11000 duplicate key error index");
                var innerLog = JSON.parse(data[0].logs[0].log);
                expect(innerLog.$collection).to.eql("Vendor");
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });
});