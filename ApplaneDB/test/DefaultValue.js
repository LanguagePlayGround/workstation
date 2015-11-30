/**
 *
 *  mocha --recursive --timeout 150000 -g "DefaultValuetestcase" --reporter spec
 *  mocha --recursive --timeout 150000 -g "complete default value with nested table and count no of times function executed" --reporter spec
 *  mocha --recursive --timeout 150000 -g "fk test case" --reporter spec
 *  mocha --recursive --timeout 150000 -g "set a fk value with only _id in on save pre and expect its set value" --reporter spec
 *
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Document = require("../public/js/Document.js");
var Q = require("q");


var billCollection = {collection:"bills", fields:[], events:[
    {event:"onInsert", function:"Bills.onInsert"},
    {event:"onInsert", function:"Bills.onInsert1"},
    {event:"onInsert", function:"Bills.onInsert2"},
    {event:"onValue:[\"qty\", \"rate\"]", function:"Bills.calculateAmt"},
    {event:"onValue:[\"qty\", \"rate\"]", fields:["qty", "rate"], function:"Bills.calculateTotalAmt"},
    {event:"onValue:[\"qty\"]", function:"Bills.calculateAmt1"},
    {event:"onValue:[\"rate\"]", function:"Bills.calculateAmt2"},
    {event:"onValue:[\"totalAmount\"]", function:"Bills.calculateConvertedAmount"},
    {event:"onValue:[\"convertedAmount\"]", function:"Bills.calculateServiceTax"},
    {event:"onSave", pre:true, function:"Bills.onPreSave"},
    {event:"onSave", post:true, function:"Bills.onPostSave"}
]};

var invoices1 = {
    collection:"invoices1", fields:[
        {field:"invoice_no", type:"string"},
        {field:"invoice_date", type:"date"},
        {field:"invoice_currency", type:"fk", collection:"pl.currencies", set:["currency"]},
        {field:"invoice_currency_rate", type:"decimal"},
        {field:"vendorid", type:"fk", collection:"vendors", set:["vendor"]} ,
        {field:"profitcenterid", type:"fk", collection:"profitcenters", set:["profitcenter"]},
        {field:"total_invoice_amt", type:"currency"},
        {field:"total_service_tax_amt", type:"currency"},
        {field:"total_other_deductions_amt", type:"currency"},
        {field:"total_other_deductions_staxamt", type:"currency"},
        {field:"net_amt", type:"currency"} ,
        {field:"invoicelineitems", type:"object", multiple:true, fields:[
            {field:"profitcenterid", type:"fk", collection:"profitcenters", set:["profitcenter"]},
            {field:"deliveryid", type:"fk", collection:"deliveries", set:["delivery_no"]},
            {field:"lineitemno", type:"number"},
            {field:"amount", type:"currency"},
            {field:"service_tax_amt", type:"currency"},
            {field:"total_other_deduction_amt", type:"currency"},
            {field:"total_other_deduction_staxamt", type:"currency"},
            {field:"net_amt", type:"currency"},
            {field:"other_deductions", type:"object", multiple:true, fields:[
                {field:"deduction_type", type:"string"},
                {field:"deduction_amt", type:"currency"},
                {field:"deduction_staxamt", type:"currency"},
                {field:"deduction_netamt", type:"currency"}
            ]}
        ]}
    ], events:[
        {event:'onInsert:[{"invoicelineitems":[]}]', function:"Invoices.onInsertLineItems"},
        {event:'onInsert:[{"invoicelineitems":[{"deduction":[]}]}]', function:"Invoices.onInsertDeductions"},
        {event:'onValue:[{"invoicelineitems":[{"deduction":["amount"]}]}]', function:"Invoices.serviceTaxOnDeductionAmount"},
        {event:'onValue:[{"invoicelineitems":[{"deduction":["amount","stax"]}]}]', function:"Invoices.netAmtOnDeductionServiceTax"},
        {event:'onValue:[{"invoicelineitems":[{"deduction":["amount"]}]}]', function:"Invoices.lineItemDeductionAmtOnDeductionAmount"},
        {event:'onValue:[{"invoicelineitems":[{"deduction":["stax"]}]}]', function:"Invoices.lineItemDeductionAmtOnDeductionAmount"},
        {event:'onValue:[{"invoicelineitems":["amount"]}]', function:"Invoices.serviceTaxOnLineItemAmount"},
        {event:'onValue:[{"invoicelineitems":["amount","service_tax_amt","total_other_deduction_amt","total_other_deduction_staxamt"]}]', function:"Invoices.lineItemNetAmount"},
        {event:'onValue:[{"invoicelineitems":["amount"]}]', function:"Invoices.calcaulateInvoiceAmt"},
        {event:'onValue:[{"invoicelineitems":["service_tax_amt"]}]', function:"Invoices.calcaulateInvoiceStaxAmt"},
        {event:'onValue:[{"invoicelineitems":["total_other_deduction_amt"]}]', function:"Invoices.calcaulateInvoiceOtherDeductionAmt"},
        {event:'onValue:[{"invoicelineitems":["total_other_deduction_staxamt"]}]', function:"Invoices.calcaulateInvoiceOtherDeductionStaxAmt"},
        {event:'onValue:[{"invoicelineitems":["total_invoice_amt","total_service_tax_amt","total_other_deductions_amt","total_other_deductions_staxamt"]}]', function:"Invoices.calculateInvoiceNetAmt"}
    ]
}

var invoices = {
    collection:"invoices", fields:[
        {field:"invoice_no", type:"string"},
        {field:"invoice_date", type:"date"},
        {field:"totalamt", type:"number"} ,
        {field:"totalstax", type:"number"} ,
        {field:"totalnet", type:"number"},
        {field:"damt", type:"number"},
        {field:"invoicelineitems", type:"object", multiple:true, fields:[
            {field:"line_no", type:"string"},
            {field:"amt", type:"number"},
            {field:"stax", type:"number"},
            {field:"net", type:"number"},
            {field:"damt", type:"number"},
            {field:"deductions", multiple:true, type:"object", fields:[
                {field:"deduction_no", type:"string"},
                {field:"damt", type:"number"}
            ]}
        ]},
        {field:"invoicelineitems1", type:"object", multiple:true, fields:[
            {field:"invoice_no", type:"string"},
            {field:"amt", type:"number"},
            {field:"stax", type:"number"},
            {field:"net", type:"number"}
        ]}
    ], events:[
        {event:'onInsert', function:"Invoicess.onInsertInvoice"},
        {event:'onInsert:[{"invoicelineitems":[]},{"invoicelineitems1":[]}]', function:"Invoicess.onInsertLineItems"},
        {event:'onInsert:[{"invoicelineitems":[{"deductions":[]}]}]', function:"Invoicess.onInsertDeductions"},
        {event:'onValue:[{"invoicelineitems":[{"deductions":["damt"]}]}]', function:"Invoicess.deductionVat"},
        {event:'onValue:[{"invoicelineitems":[{"deductions":["damt"]}]}]', function:"Invoicess.lineItemDamt"},
        {event:'onValue:[{"invoicelineitems":["damt"]}]', function:"Invoicess.lineItemDamt"},
        {event:'onValue:[{"invoicelineitems":[{"deductions":["vat"]}]}]', function:"Invoicess.deductionnetamt"},
        {event:'onValue:["totalstax"]', function:"Invoicess.invoiceNetAmt"},
        {event:'onValue:[{"invoicelineitems":["amt"]},{"invoicelineitems1":["amt"]}]', function:"Invoicess.lineItemStax"},
        {event:'onValue:[{"invoicelineitems":["stax"]},{"invoicelineitems1":["stax"]}]', function:"Invoicess.lineItemNet"},
        {event:'onValue:[{"invoicelineitems":["amt"]},{"invoicelineitems1":["amt"]}]', function:"Invoicess.invoiceAmt"},
        {event:'onValue:[{"invoicelineitems":["stax"]},{"invoicelineitems1":["stax"]}]', function:"Invoicess.invoiceStaxAmt"},
        {event:'onValue:[{"invoicelineitems":["net"]},{"invoicelineitems1":["net"]}]', function:"Invoicess.LineItemNetWord"},
        {event:'onValue:["totalnet"]', function:"Invoicess.NetWord"},
        {event:"onSave", pre:true, function:"Invoicess.onPreSave"},
        {event:"onSave", post:true, function:"Invoicess.onPostSave"}
    ]
}

var collectionsToRegister = [
    billCollection
    ,
    invoices,
    invoices1,
    {
        collection:"orders", fields:[
        {field:"order_no", type:"string"},
        {field:"vendorid", type:"fk", collection:"vendors", set:["vendor"]} ,
        {field:"profitcenterid", type:"fk", collection:"profitcenters", set:["profitcenter"]},
        {field:"currency", type:"fk", collection:"currencies", set:["currency"]} ,
        {field:"order_date", type:"date"},
        {field:"total_amt", type:"currency"},
        {field:"total_converted_amt", type:"currency"}
    ]
    } ,
    {
        collection:"deliveries", fields:[
        {field:"profitcenterid", type:"fk", collection:"profitcenters", set:["profitcenter"]},
        {field:"productid", type:"string"},
        {field:"delivery_no", type:"string"},
        {field:"orderid", type:"fk", collection:"orders", set:["order_no"]},
        {field:"vendorid", type:"fk", collection:"vendors", set:["vendor"]},
        {field:"quantity", type:"number"},
        {field:"rate", type:"decimal"},
        {field:"amount", type:"currency"},
        {field:"amount_base_currency", type:"currency"}
    ]
    },
    {
        collection:"vouchers", fields:[
        {field:"voucher_no", type:"string"},
        {field:"voucher_date", type:"date"},
        {field:"voucher_type", "type":"string"},
        {field:"profitcenterid", type:"fk", collection:"profitcenters", set:["profitcenter"]},
        {field:"cr_amt", type:"currency"},
        {field:"dr_amt", type:"currency"},
        {field:"voucherlineitems", type:"object", multiple:true, fields:[
            {field:"accountid", type:"fk", collection:"accounts", set:["account"]},
            {field:"cr_amt", type:"currency"},
            {field:"dr_amt", type:"currency"},
            {field:"amount", type:"currency"}
        ]}
    ]
    },
    {
        collection:"vendors", fields:[
        {field:"vendor", type:"string"}  ,
        {field:"accountid", type:"fk", collection:"accounts", set:["account"]},
        {field:"service_tax_in_percent", type:"decimal"}
    ]
    } ,
    {
        collection:"accounts", fields:[
        {field:"account", type:"string"}
    ]
    },
    {
        collection:"accountgroups", fields:[
        {field:"name", type:"string"}
    ]
    },
    {
        collection:"accountgrouptotals", fields:[
        {field:"accountgroupid", type:"fk", collection:"accountgroups", set:["name"]}
    ]
    } ,
    {collection:"profitcenters", fields:[
        {field:"profitcenter", type:"string"}
    ]} ,
    {collection:"currencies", fields:[
        {field:"currency", type:"string"}
    ]}

];

var functionsToRegister = [
    {name:"Bills", source:"NorthwindTestCase/lib", type:"js"},
    {name:"Invoices", source:"NorthwindTestCase/lib", type:"js"},
    {name:"Invoicess", source:"NorthwindTestCase/lib", type:"js"}
]

describe("DefaultValuetestcase", function () {

    before(function (done) {
        ApplaneDB.registerCollection(collectionsToRegister).then(
            function () {
                return ApplaneDB.registerFunction(functionsToRegister)
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    after(function (done) {
        ApplaneDB.removeCollections(["employees", "deliveries", "invoices"]);
        done();
    })

    beforeEach(function (done) {
        var configure = {URL:Config.URL, Admin:Config.Admin, MongoAdmin:Config.MongoAdmin, ENSURE_DB:false};
        var db = undefined;
        ApplaneDB.configure(configure).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS)
            }).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.currencies", $insert:[
                        {_id:"INR", currency:"INR"},
                        {currency:"USD"}
                    ]},
                    {$collection:"profitcenters", $insert:[
                        {_id:"Services", profitcenter:"Services"},
                        {profitcenter:"Applane"}
                    ]},
                    {$collection:"accounts", $insert:[
                        {account:"SBI"},
                        {account:"Applane"}
                    ]}
                ];
                return  db.update(updates);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    afterEach(function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db) {
                return db.dropDatabase()
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });
    })

    it.skip("when value is processed at client", function (done) {
        //$onValueProcessed
        done();
    })

    it("complete default value with nested table and count no of times function executed", function (done) {
        var paymentCollection = {collection:"payments", events:[
            {event:"onInsert", function:"Payments.onInsert"},
            {event:'onInsert:[{"payment_line_items":[]}]', function:"Payments.onPaymentLineItemInsert"},
            {event:'onInsert:[{"payment_line_items":[{"deductions":[]}]}]', function:"Payments.onDeductionInsert"},

            {event:'onValue:[{"payment_line_items":[{"deductions":["amount"]}]}]', function:"Payments.calculateDeductionTax"},
            {event:'onValue:[{"payment_line_items":[{"deductions":["amount"]}]}]', function:"Payments.calculateTotalPliDeduction"},
            {event:'onValue:[{"payment_line_items":[{"deductions":["amount","stax"]}]}]', function:"Payments.calculateDeductionNet"},

            {event:'onValue:[{"payment_line_items":["amount"]}]', function:"Payments.calculatePaymentTax"},
            {event:'onValue:[{"payment_line_items":["deduction_amount"]}]', function:"Payments.calculateTotalDeduction"},

            {event:'onValue:[{"payment_line_items":["amount","stax"]}]', function:"Payments.calculatePaymentNet"},

            {event:'onValue:["amount"]', function:"Payments.calculateTax"},
            {event:'onValue:["amount","stax"]', function:"Payments.calculateNet"},

            {event:'onValue:["deduction_amount"]', function:"Payments.calculateTotalDeductionTax"},
            {event:'onValue:["deduction_amount","deduction_stax"]', function:"Payments.calculateTotalDeductionNet"},

            {event:"onSave", pre:true, function:"Payments.onPreSave"},
            {event:"onSave", post:true, function:"Payments.onPostSave"}
        ], fields:[
            {field:"payment_no", type:"number"},
            {field:"vendor", type:"string"},
            {field:"amount", type:"number"},
            {field:"stax", type:"number"},
            {field:"deduction_amount", type:"number"},
            {field:"deduction_stax", type:"number"},
            {field:"deduction_net", type:"number"},
            {field:"net", type:"number"},
            {field:"payment_line_items", type:"object", multiple:true, fields:[
                {field:"pli_no", type:"number"},
                {field:"amount", type:"number"},
                {field:"stax", type:"number"},
                {field:"deduction_amount", type:"number"},
                {field:"deduction_stax", type:"number"},
                {field:"deduction_net", type:"number"},
                {field:"net", type:"number"},
                {field:"deductions", type:"object", multiple:true, fields:[
                    {field:"deduction_no", type:"number"},
                    {field:"amount", type:"number"},
                    {field:"stax", type:"number"},
                    {field:"net", type:"number"}
                ]}
            ]}

        ]};

        var paymentFunctions = [
            {name:"Payments", source:"NorthwindTestCase/lib", type:"js"}
        ];

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;
                return ApplaneDB.registerCollection(paymentCollection)
            }).then(
            function () {
                return ApplaneDB.registerFunction(paymentFunctions);
            }).then(
            function () {
                return db.update({$collection:"payments", $insert:{payment_no:1, vendor:"Rajit", amount:100, payment_line_items:[
                    {amount:1000, deductions:[
                        {amount:500},
                        {amount:100}
                    ]},
                    {amount:2000, deductions:[
                        {amount:100},
                        {amount:200},
                        {amount:500}
                    ]},
                    {amount:2500}
                ]}})
            }).then(
            function () {
                return db.query({$collection:"payments"})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].payment_no).to.eql(1);
                expect(data.result[0].vendor).to.eql("Rajit");
                expect(data.result[0].amount).to.eql(100);
                expect(data.result[0].insert_count).to.eql(1);
                expect(data.result[0].pre_save_count).to.eql(1);
                expect(data.result[0].post_save_count).to.eql(1);
                expect(data.result[0].payment_line_items).to.have.length(3);
                expect(data.result[0].pli_insert_count).to.eql(3);
                expect(data.result[0].payment_line_items[0].pli_no).to.eql(1);
                expect(data.result[0].payment_line_items[0].amount).to.eql(1000);
                expect(data.result[0].payment_line_items[0].deduction_insert_count).to.eql(2);

                expect(data.result[0].payment_line_items[0].deductions[0].stax).to.eql(50);
                expect(data.result[0].payment_line_items[0].deductions[0].net).to.eql(450);

                expect(data.result[0].payment_line_items[0].deduction_amount).to.eql(600);
                expect(data.result[0].payment_line_items[1].deduction_amount).to.eql(800);

                expect(data.result[0].deduction_amount).to.eql(1400);
                expect(data.result[0].deduction_stax).to.eql(140);
                expect(data.result[0].deduction_net).to.eql(1260);
                expect(data.result[0].stax).to.eql(10);
                expect(data.result[0].net).to.eql(90);
                return db.update({$collection:"payments", $update:[
                    {_id:data.result[0]._id, $set:{vendor:"Manjeet", amount:500, payment_line_items:{$update:[
                        {_id:data.result[0].payment_line_items[0]._id, $set:{amount:5000, deductions:[
                            {amount:1000},
                            {amount:200}
                        ]}}
                    ]}}}
                ]})
            }).then(
            function () {
                return db.query({$collection:"payments"})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].payment_no).to.eql(1);
                expect(data.result[0].vendor).to.eql("Manjeet");
                expect(data.result[0].amount).to.eql(500);
                expect(data.result[0].insert_count).to.eql(1);
                expect(data.result[0].pre_save_count).to.eql(2);
                expect(data.result[0].post_save_count).to.eql(2);
                expect(data.result[0].payment_line_items).to.have.length(3);
                expect(data.result[0].pli_insert_count).to.eql(3);
                expect(data.result[0].payment_line_items[0].pli_no).to.eql(1);
                expect(data.result[0].payment_line_items[0].amount).to.eql(5000);
                expect(data.result[0].payment_line_items[0].deduction_insert_count).to.eql(4);
                expect(data.result[0].payment_line_items[0].deductions[0].stax).to.eql(100);
                expect(data.result[0].payment_line_items[0].deductions[0].net).to.eql(900);
                expect(data.result[0].payment_line_items[0].deduction_amount).to.eql(1200);
                expect(data.result[0].payment_line_items[1].deduction_amount).to.eql(800);
                expect(data.result[0].deduction_amount).to.eql(2000);
                expect(data.result[0].deduction_stax).to.eql(200);
                expect(data.result[0].deduction_net).to.eql(1800);
                expect(data.result[0].stax).to.eql(50);
                expect(data.result[0].net).to.eql(450);
                return db.update({$collection:"payments", $update:[
                    {_id:data.result[0]._id, $set:{payment_line_items:{$delete:[
                        {_id:data.result[0].payment_line_items[0]._id}
                    ]}}}
                ]})
            }).then(
            function () {
                return db.query({$collection:"payments"})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].payment_no).to.eql(1);
                expect(data.result[0].vendor).to.eql("Manjeet");
                expect(data.result[0].amount).to.eql(500);
                expect(data.result[0].insert_count).to.eql(1);
                expect(data.result[0].pre_save_count).to.eql(3);
                expect(data.result[0].post_save_count).to.eql(3);
                expect(data.result[0].payment_line_items).to.have.length(2);
                expect(data.result[0].pli_insert_count).to.eql(3);
                expect(data.result[0].payment_line_items[0].pli_no).to.eql(2);
                expect(data.result[0].payment_line_items[0].amount).to.eql(2000);
                expect(data.result[0].payment_line_items[0].deduction_insert_count).to.eql(3);
                expect(data.result[0].payment_line_items[0].deductions[0].stax).to.eql(10);
                expect(data.result[0].payment_line_items[0].deductions[0].net).to.eql(90);
                expect(data.result[0].payment_line_items[0].deduction_amount).to.eql(800);
                expect(data.result[0].payment_line_items[1].deduction_amount).to.eql(undefined);
                expect(data.result[0].deduction_amount).to.eql(800);
                expect(data.result[0].deduction_stax).to.eql(80);
                expect(data.result[0].deduction_net).to.eql(720);
                expect(data.result[0].stax).to.eql(50);
                expect(data.result[0].net).to.eql(450);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });


    })
    it("fk test case", function (done) {
        var studentsCollection = {collection:"students", events:[
            {event:"onSave", pre:true, function:"Students.onPreSave"}
        ], fields:[
            {field:"classId", type:"fk", collection:"class", set:["className"], upsert:true }
        ]};

        var classCollection = {collection:"class", fields:[
            {field:"className", type:"string"}
        ]}

        var collectionsToRegister = [studentsCollection, classCollection];
        var functionsToRegister = [
            {name:"Students", source:"NorthwindTestCase/lib", "type":"js"}
        ]
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;
                return ApplaneDB.registerCollection(collectionsToRegister)
            }).then(
            function () {
                return ApplaneDB.registerFunction(functionsToRegister);
            }).then(
            function () {
                var updates = [
                    {$collection:"students", $insert:[
                        {name:"rajit"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"students"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].classId.className).to.eql("First");
                expect(data.result[0].name).to.eql("rajit");
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("set a fk value with only _id in on save pre and expect its set value", function (done) {
        var studentsCollection = {collection:"students", events:[
            {event:"onSave", pre:true, function:"Students.onPreSave2"}
        ], fields:[
            {field:"classId", type:"fk", collection:"class", set:["className"], upsert:false }
        ]};

        var classCollection = {collection:"class", fields:[
            {field:"className", type:"string"}
        ]}

        var collectionsToRegister = [studentsCollection, classCollection];
        var functionsToRegister = [
            {name:"Students", source:"NorthwindTestCase/lib", "type":"js"}
        ]
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;
                return ApplaneDB.registerCollection(collectionsToRegister)
            }).then(
            function () {
                return ApplaneDB.registerFunction(functionsToRegister);
            }).then(
            function () {
                var insert = [
                    {$collection:"class", $insert:[
                        {_id:"First", className:"First"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var updates = [
                    {$collection:"students", $insert:[
                        {name:"rajit"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"students"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].classId.className).to.eql("First");
                expect(data.result[0].classId._id).to.eql("First");
                expect(data.result[0].name).to.eql("rajit");
                done();
            }).fail(function (err) {
                done(err);
            })
    });

    it.skip("onBillCreate Server", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var bill1 = {rate:10, qty:200};
                return  db.update({$collection:"bills", $insert:bill1});
            }).then(
            function () {
                return db.query({$collection:"bills"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].rate).to.eql(10);
                expect(result.result[0].qty).to.eql(200);
                expect(result.result[0].amount).to.eql(2000);
                expect(result.result[0].amount3).to.eql(2000);
                expect(result.result[0].totalAmount).to.eql(2000);
                expect(result.result[0].amount1).to.eql(2000);
                expect(result.result[0].netAmount).to.eql(2000);
                expect(result.result[0].amount2).to.eql(2000);
                expect(result.result[0].convertedAmount).to.eql(2000);
                expect(result.result[0].serviceTax).to.eql(200);
                expect(result.result[0].netTax).to.eql(200);
                return db.update({$collection:"bills", $update:{_id:result.result[0]._id, $set:{qty:2500, rate:20}}})
            }).then(
            function () {
                return  db.query({$collection:"bills"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].rate).to.eql(20);
                expect(result.result[0].qty).to.eql(2500);
                expect(result.result[0].amount).to.eql(50000);
                expect(result.result[0].amount3).to.eql(2000);
                expect(result.result[0].totalAmount).to.eql(50000);
                expect(result.result[0].amount1).to.eql(50000);
                expect(result.result[0].netAmount).to.eql(50000);
                expect(result.result[0].amount2).to.eql(50000);
                expect(result.result[0].convertedAmount).to.eql(50000);
                expect(result.result[0].serviceTax).to.eql(5000);
                expect(result.result[0].netTax).to.eql(5000);
                return db.update({$collection:"bills", $delete:{_id:result.result[0]._id}});
            }).then(
            function () {
                return db.query({$collection:"bills"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(0);
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it.skip("invoice nested lineitems", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var invoice = {invoice_no:"1111", profitcenterid:{_id:"Services", profitcenter:"Services"}, invoicelineitems:{$insert:[
                    {lineitemno:1, amount:{amount:10000, type:{_id:"INR", currency:"INR"}}, other_deductions:{$insert:[
                        {deduction_amt:{amount:200, type:{_id:"INR", currency:"INR"}}}
                    ]}}
                ]}};
                return  db.update({$collection:"invoices", $insert:invoice});
            }).then(
            function () {
                return  db.query({$collection:"invoices"});
            }).then(
            function (result) {
                done();
            }).fail(function () {
                done(e);
            })
    })

    it("simple invoice nested lineitems without currency type", function (done) {

        var db = undefined;
        var insertResult = undefined;
        var updateResult = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var invoice = {invoice_no:1111, invoicelineitems:{$insert:[
                    {amt:1000, deductions:{$insert:[
                        {damt:50}
                    ]}},
                    {amt:5000, deductions:{$insert:[
                        {damt:1000},
                        {damt:200}
                    ]}}

                ]}, invoicelineitems1:{$insert:[
                    {amt:3000},
                    {amt:8000}
                ]}};
                return  db.update({$collection:"invoices", $insert:invoice});
            }).then(
            function () {
                return  db.query({$collection:"invoices"});
            }).then(
            function (result) {
                insertResult = result;
                expect(insertResult.result).to.have.length(1);
                expect(insertResult.result[0].invoice_no).to.eql("1111");
                expect(insertResult.result[0].invoice_date).to.not.eql(undefined);
                expect(insertResult.result[0].default_currency).to.eql("INR");
                expect(insertResult.result[0].totalamt).to.eql(18000);
                expect(insertResult.result[0].totalstax).to.eql(1800);
                expect(insertResult.result[0].totalnet).to.eql(16200);
                expect(insertResult.result[0].damt).to.eql(1250);
                expect(insertResult.result[0].netword).to.eql("Greater that 1000");
                expect(insertResult.result[0].invoicelineitems).to.have.length(2);

                expect(insertResult.result[0].invoicelineitems[0].line_no).to.eql("1111");
                expect(insertResult.result[0].invoicelineitems[0].damt).to.eql(50);
                expect(insertResult.result[0].invoicelineitems[0].amt).to.eql(1500);
                expect(insertResult.result[0].invoicelineitems[0].stax).to.eql(150);
                expect(insertResult.result[0].invoicelineitems[0].net).to.eql(1350);
                expect(insertResult.result[0].invoicelineitems[0].netword).to.eql("Greater that 1000");
                expect(insertResult.result[0].invoicelineitems[0].deductions).to.have.length(1);
                expect(insertResult.result[0].invoicelineitems[0].deductions[0].deduction_no).to.eql("1111");
                expect(insertResult.result[0].invoicelineitems[0].deductions[0].damt).to.eql(50);
                expect(insertResult.result[0].invoicelineitems[0].deductions[0].vat).to.eql(10);
                expect(insertResult.result[0].invoicelineitems[0].deductions[0].dnetamt).to.eql(60);

                expect(insertResult.result[0].invoicelineitems[1].line_no).to.eql("1111");
                expect(insertResult.result[0].invoicelineitems[1].damt).to.eql(1200);
                expect(insertResult.result[0].invoicelineitems[1].amt).to.eql(5500);
                expect(insertResult.result[0].invoicelineitems[1].stax).to.eql(550);
                expect(insertResult.result[0].invoicelineitems[1].net).to.eql(4950);
                expect(insertResult.result[0].invoicelineitems[1].netword).to.eql("Greater that 1000");
                expect(insertResult.result[0].invoicelineitems[1].deductions).to.have.length(2);
                expect(insertResult.result[0].invoicelineitems[1].deductions[0].deduction_no).to.eql("1111");
                expect(insertResult.result[0].invoicelineitems[1].deductions[0].damt).to.eql(1000);
                expect(insertResult.result[0].invoicelineitems[1].deductions[0].vat).to.eql(200);
                expect(insertResult.result[0].invoicelineitems[1].deductions[0].dnetamt).to.eql(1200);
                expect(insertResult.result[0].invoicelineitems[1].deductions[1].deduction_no).to.eql("1111");
                expect(insertResult.result[0].invoicelineitems[1].deductions[1].damt).to.eql(200);
                expect(insertResult.result[0].invoicelineitems[1].deductions[1].vat).to.eql(40);
                expect(insertResult.result[0].invoicelineitems[1].deductions[1].dnetamt).to.eql(240);

                expect(insertResult.result[0].invoicelineitems1).to.have.length(2);
                expect(insertResult.result[0].invoicelineitems1[0].line_no).to.eql("1111");
                expect(insertResult.result[0].invoicelineitems1[0].amt).to.eql(3000);
                expect(insertResult.result[0].invoicelineitems1[0].stax).to.eql(300);
                expect(insertResult.result[0].invoicelineitems1[0].net).to.eql(2700);
                expect(insertResult.result[0].invoicelineitems1[0].netword).to.eql("Greater that 1000");

                expect(insertResult.result[0].invoicelineitems1[1].line_no).to.eql("1111");
                expect(insertResult.result[0].invoicelineitems1[1].amt).to.eql(8000);
                expect(insertResult.result[0].invoicelineitems1[1].stax).to.eql(800);
                expect(insertResult.result[0].invoicelineitems1[1].net).to.eql(7200);
                expect(insertResult.result[0].invoicelineitems1[1].netword).to.eql("Greater that 1000");

                var updateInvoice = {_id:insertResult.result[0]._id, $set:{invoicelineitems:{$update:[
                    {_id:insertResult.result[0].invoicelineitems[0]._id, $set:{amt:3000, deductions:{$update:[
                        {_id:insertResult.result[0].invoicelineitems[0].deductions[0]._id, damt:100}
                    ], $insert:[
                        {damt:200}
                    ]}}},
                    {_id:insertResult.result[0].invoicelineitems[1]._id, $set:{amt:1000, deductions:{$update:[
                        {_id:insertResult.result[0].invoicelineitems[1].deductions[1]._id, damt:500}
                    ]}}}
                ], $insert:[
                    {amt:20000, deductions:[
                        {damt:2000}
                    ]}
                ]}, invoicelineitems1:{$update:[
                    {_id:insertResult.result[0].invoicelineitems1[1]._id, $set:{amt:10000}}
                ]}}};
                return db.update({$collection:"invoices", $update:updateInvoice});
            }).then(
            function () {
                return db.query({$collection:"invoices"});
            }).then(
            function (result) {
                updateResult = result;
                expect(updateResult.result).to.have.length(1);
                expect(updateResult.result[0].invoice_no).to.eql("1111");
                expect(updateResult.result[0].invoice_date).to.not.eql(undefined);
                expect(updateResult.result[0].default_currency).to.eql("INR");
                expect(updateResult.result[0].totalamt).to.eql(38500);
                expect(updateResult.result[0].totalstax).to.eql(3850);
                expect(updateResult.result[0].totalnet).to.eql(34650);
                expect(updateResult.result[0].damt).to.eql(3800);
                expect(updateResult.result[0].netword).to.eql("Greater that 1000");
                expect(updateResult.result[0].invoicelineitems).to.have.length(3);


                expect(updateResult.result[0].invoicelineitems[0].line_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems[0].damt).to.eql(300);
                expect(updateResult.result[0].invoicelineitems[0].amt).to.eql(3500);
                expect(updateResult.result[0].invoicelineitems[0].stax).to.eql(350);
                expect(updateResult.result[0].invoicelineitems[0].net).to.eql(3150);
                expect(updateResult.result[0].invoicelineitems[0].netword).to.eql("Greater that 1000");
                expect(updateResult.result[0].invoicelineitems[0].deductions).to.have.length(2);
                expect(updateResult.result[0].invoicelineitems[0].deductions[0].deduction_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems[0].deductions[0].damt).to.eql(100);
                expect(updateResult.result[0].invoicelineitems[0].deductions[0].vat).to.eql(20);
                expect(updateResult.result[0].invoicelineitems[0].deductions[0].dnetamt).to.eql(120);
                expect(updateResult.result[0].invoicelineitems[0].deductions[1].deduction_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems[0].deductions[1].damt).to.eql(200);
                expect(updateResult.result[0].invoicelineitems[0].deductions[1].vat).to.eql(40);
                expect(updateResult.result[0].invoicelineitems[0].deductions[1].dnetamt).to.eql(240);

                expect(updateResult.result[0].invoicelineitems[1].line_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems[1].damt).to.eql(1500);
                expect(updateResult.result[0].invoicelineitems[1].amt).to.eql(1500);
                expect(updateResult.result[0].invoicelineitems[1].stax).to.eql(150);
                expect(updateResult.result[0].invoicelineitems[1].net).to.eql(1350);
                expect(updateResult.result[0].invoicelineitems[1].netword).to.eql("Greater that 1000");
                expect(updateResult.result[0].invoicelineitems[1].deductions).to.have.length(2);
                expect(updateResult.result[0].invoicelineitems[1].deductions[0].deduction_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems[1].deductions[0].damt).to.eql(1000);
                expect(updateResult.result[0].invoicelineitems[1].deductions[0].vat).to.eql(200);
                expect(updateResult.result[0].invoicelineitems[1].deductions[0].dnetamt).to.eql(1200);
                expect(updateResult.result[0].invoicelineitems[1].deductions[1].deduction_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems[1].deductions[1].damt).to.eql(500);
                expect(updateResult.result[0].invoicelineitems[1].deductions[1].vat).to.eql(100);
                expect(updateResult.result[0].invoicelineitems[1].deductions[1].dnetamt).to.eql(600);

                expect(updateResult.result[0].invoicelineitems[2].line_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems[2].damt).to.eql(2000);
                expect(updateResult.result[0].invoicelineitems[2].amt).to.eql(20500);
                expect(updateResult.result[0].invoicelineitems[2].stax).to.eql(2050);
                expect(updateResult.result[0].invoicelineitems[2].net).to.eql(18450);
                expect(updateResult.result[0].invoicelineitems[2].netword).to.eql("Greater that 1000");
                expect(updateResult.result[0].invoicelineitems[2].deductions).to.have.length(1);
                expect(updateResult.result[0].invoicelineitems[2].deductions[0].deduction_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems[2].deductions[0].damt).to.eql(2000);
                expect(updateResult.result[0].invoicelineitems[2].deductions[0].vat).to.eql(400);
                expect(updateResult.result[0].invoicelineitems[2].deductions[0].dnetamt).to.eql(2400);


                expect(updateResult.result[0].invoicelineitems1).to.have.length(2);
                expect(updateResult.result[0].invoicelineitems1[0].line_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems1[0].amt).to.eql(3000);
                expect(updateResult.result[0].invoicelineitems1[0].stax).to.eql(300);
                expect(updateResult.result[0].invoicelineitems1[0].net).to.eql(2700);
                expect(updateResult.result[0].invoicelineitems1[0].netword).to.eql("Greater that 1000");

                expect(updateResult.result[0].invoicelineitems1[1].line_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems1[1].amt).to.eql(10000);
                expect(updateResult.result[0].invoicelineitems1[1].stax).to.eql(1000);
                expect(updateResult.result[0].invoicelineitems1[1].net).to.eql(9000);
                expect(updateResult.result[0].invoicelineitems1[1].netword).to.eql("Greater that 1000");

                var deleteUpdate = {_id:updateResult.result[0]._id, $set:{invoicelineitems1:{$delete:[
                    {_id:updateResult.result[0].invoicelineitems1[1]._id}
                ]}, invoicelineitems:{$update:[
                    {_id:updateResult.result[0].invoicelineitems[1]._id, deductions:{$delete:[
                        {_id:updateResult.result[0].invoicelineitems[1].deductions[0]._id}
                    ]}}
                ], $delete:[
                    {_id:updateResult.result[0].invoicelineitems[0]._id}
                ]}}};
                return db.update({$collection:"invoices", $update:deleteUpdate});
            }).then(
            function () {
                return  db.query({$collection:"invoices"});
            }).then(
            function (updateResult) {

                expect(updateResult.result).to.have.length(1);
                expect(updateResult.result[0].invoice_no).to.eql("1111");
                expect(updateResult.result[0].invoice_date).to.not.eql(undefined);
                expect(updateResult.result[0].default_currency).to.eql("INR");
                expect(updateResult.result[0].totalamt).to.eql(25500);
                expect(updateResult.result[0].totalstax).to.eql(2550);
                expect(updateResult.result[0].totalnet).to.eql(22950);
                expect(updateResult.result[0].damt).to.eql(2500);
                expect(updateResult.result[0].netword).to.eql("Greater that 1000");
                expect(updateResult.result[0].invoicelineitems).to.have.length(2);

                expect(updateResult.result[0].invoicelineitems[0].line_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems[0].damt).to.eql(500);
                expect(updateResult.result[0].invoicelineitems[0].amt).to.eql(2000);
                expect(updateResult.result[0].invoicelineitems[0].stax).to.eql(200);
                expect(updateResult.result[0].invoicelineitems[0].net).to.eql(1800);
                expect(updateResult.result[0].invoicelineitems[0].netword).to.eql("Greater that 1000");
                expect(updateResult.result[0].invoicelineitems[0].deductions).to.have.length(1);
                expect(updateResult.result[0].invoicelineitems[0].deductions[0].deduction_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems[0].deductions[0].damt).to.eql(500);
                expect(updateResult.result[0].invoicelineitems[0].deductions[0].vat).to.eql(100);
                expect(updateResult.result[0].invoicelineitems[0].deductions[0].dnetamt).to.eql(600);

                expect(updateResult.result[0].invoicelineitems[1].line_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems[1].damt).to.eql(2000);
                expect(updateResult.result[0].invoicelineitems[1].amt).to.eql(20500);
                expect(updateResult.result[0].invoicelineitems[1].stax).to.eql(2050);
                expect(updateResult.result[0].invoicelineitems[1].net).to.eql(18450);
                expect(updateResult.result[0].invoicelineitems[1].netword).to.eql("Greater that 1000");
                expect(updateResult.result[0].invoicelineitems[1].deductions).to.have.length(1);
                expect(updateResult.result[0].invoicelineitems[1].deductions[0].deduction_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems[1].deductions[0].damt).to.eql(2000);
                expect(updateResult.result[0].invoicelineitems[1].deductions[0].vat).to.eql(400);
                expect(updateResult.result[0].invoicelineitems[1].deductions[0].dnetamt).to.eql(2400);

                expect(updateResult.result[0].invoicelineitems1).to.have.length(1);
                expect(updateResult.result[0].invoicelineitems1[0].line_no).to.eql("1111");
                expect(updateResult.result[0].invoicelineitems1[0].amt).to.eql(3000);
                expect(updateResult.result[0].invoicelineitems1[0].stax).to.eql(300);
                expect(updateResult.result[0].invoicelineitems1[0].net).to.eql(2700);
                expect(updateResult.result[0].invoicelineitems1[0].netword).to.eql("Greater that 1000");
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it("set a fk value and set events equal to false", function (done) {
        var studentsCollection = {collection:"students", events:[
            {event:"onSave", pre:true, function:"Students.onSaving"}
        ], fields:[
            {field:"classId", type:"fk", collection:"class", set:["className"], upsert:false }
        ]};

        var classCollection = {collection:"class", fields:[
            {field:"className", type:"string"}
        ]}

        var collectionsToRegister = [studentsCollection, classCollection];
        var functionsToRegister = [
            {name:"Students", source:"NorthwindTestCase/lib", "type":"js"}
        ]
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;
                return ApplaneDB.registerCollection(collectionsToRegister)
            }).then(
            function () {
                return ApplaneDB.registerFunction(functionsToRegister);
            }).then(
            function () {
                var insert = [
                    {$collection:"class", $insert:[
                        {_id:"First", className:"First"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var updates = [
                    {$collection:"students", $insert:[
                        {name:"rajit", classId:{$query:{className:"First"}}}
                    ], $events:false}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"students"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].classId.className).to.eql("First");
                expect(data.result[0].classId._id).to.eql("First");
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].rollno).to.eql(undefined);
                done();
            }).fail(function (err) {
                done(err);
            })
    });

    it.skip("value as undefined and nan", function (done) {
        var studentsCollection = {collection:"studentss"};


        var collectionsToRegister = [studentsCollection];
        var functionsToRegister = [

        ]
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;
                return ApplaneDB.registerCollection(collectionsToRegister)
            }).then(
            function () {
                return ApplaneDB.registerFunction(functionsToRegister);
            }).then(
            function () {
                var updates = [
                    {$collection:"studentss", $insert:[
                        {name:"rajit", class:undefined, roll:10 * "Rohit", class1:null}
                    ]}
                ]

                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"studentss"});
            }).then(
            function (data) {

                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].roll).to.eql(NaN);
                expect(data.result[0].class).to.eql(null);
                expect(data.result[0].class1).to.eql(null);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("on value on two field simultaneously", function (done) {
        var employeesCollection = {collection:"employees", events:[
            {event:'onValue:["salary"]', function:"Employees.calculateTax"},
            {event:'onValue:["tax"]', function:"Employees.calculateSalary"}
        ], fields:[
            {field:"salary", type:"number"},
            {field:"tax", type:"number"}
        ]}

        var employeesFunctions = [
            {name:"Employees", source:"NorthwindTestCase/lib", type:"js"}
        ];

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;
                return ApplaneDB.registerCollection(employeesCollection)
            }).then(
            function () {
                return ApplaneDB.registerFunction(employeesFunctions);
            }).then(
            function () {
                return db.update({$collection:"employees", $insert:{salary:20000}})
            }).then(
            function () {
                return db.query({$collection:"employees"})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                var message = err.message
                if (message.indexOf("More than 50 retries, Recursion level") >= 0) {
                    done()
                } else {
                    done(err)
                }

            });


    })
    it("on value on two field in array simultaneously", function (done) {
        var employeesCollection = {collection:"employees", events:[
            {event:'onValue:[{"employees_salary_data":["salary"]}]', function:"Employees.calculateTax"},
            {event:'onValue:[{"employees_salary_data":["tax"]}]', function:"Employees.calculateSalary"}
        ], fields:[
            {field:"employee_name", type:"string"},
            {field:"designation", type:"string"},
            {field:"employees_salary_data", type:"object", multiple:true, fields:[
                {field:"code", type:"string"},
                {field:"salary", type:"number"},
                {field:"tax", type:"number"}
            ]}
        ]}

        var employeesFunctions = [
            {name:"Employees", source:"NorthwindTestCase/lib", type:"js"}
        ];

        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (connectedDB) {
                db = connectedDB;
                return ApplaneDB.registerCollection(employeesCollection)
            }).then(
            function () {
                return ApplaneDB.registerFunction(employeesFunctions);
            }).then(
            function () {
                return db.update({$collection:"employees", $insert:{employee_name:"Rajit", designation:"Junior-IT", employees_salary_data:[
                    {code:"01", salary:20000}
                ]}})
            }).then(
            function () {
                return db.query({$collection:"employees"})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                var message = err.message
                if (message.indexOf("More than 50 retries, Recursion level") >= 0) {
                    done()
                } else {
                    done(err)
                }

            });


    })
})
