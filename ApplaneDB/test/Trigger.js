/*
 * mocha --recursive --timeout 150000 -g "Triggertestcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "create another trigger with required fields in nested array" --reporter spec
 * mocha --recursive --timeout 150000 -g "create  trigger with required fields" --reporter spec
 *
 * mocha --recursive --timeout 150000 -g "create another case of update trigger with required fields in nested array" --reporter spec
 * mocha --recursive --timeout 150000 -g "required Field in post trigger" --reporter spec
 *
 *
 *
 * */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("Triggertestcase", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it("insert full name pre  trigger", function (done) {
        var db = undefined;
        var event = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var modifyPerson = {   name:"personJob", source:"NorthwindTestCase/lib/PersonJob"};
                event = [
                    {
                        function:modifyPerson,
                        event:"onSave",
                        pre:true
                    }
                ];

                var updates = [
                    {$collection:{"collection":"Persons", "events":event}, $insert:[
                        {"lastname":"Sangwan", "firstname":"Manjeet"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection":"Persons"});
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].fullname).to.eql("Manjeet Sangwan");
                done();
            }).fail(function (err) {
                done(err);
            });

    });

    it("update full name pre trigger", function (done) {
        var db = undefined;
        var event = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var modifyPerson = {   name:"personJob", source:"NorthwindTestCase/lib/PersonJob"};
                event = [
                    {
                        function:modifyPerson,
                        event:"onSave",
                        pre:true
                    }
                ]

                var updates = [
                    {$collection:{"collection":"Persons", "events":event}, $insert:[
                        {"lastname":"Sangwan", "firstname":"Manjeet"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection":"Persons"});
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].fullname).to.eql("Manjeet Sangwan");
                var newUpdates = [
                    {$collection:{"collection":"Persons", "events":event}, $update:[
                        {"_id":data.result[0]._id, $set:{"lastname":"Bansal", "firstname":"Sachin"}}
                    ]}
                ]
                return db.update(newUpdates);

            }).then(
            function () {
                return db.query({"$collection":"Persons"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].fullname).to.eql("Sachin Bansal");
                done();
            }).fail(function (err) {
                done(err);
            });

    });

    it("create voucher on invoice creation post trigger", function (done) {
        var db = undefined;
        var event = undefined;
        var voucherid = undefined;
        var invoiceid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var modifyPerson = {name:"job", source:"NorthwindTestCase/lib/InvoiceJob"};
                event = [
                    {
                        function:modifyPerson,
                        event:"onSave",
                        post:true
                    }
                ]

                var updates = [
                    {$collection:{"collection":"invoices", "events":event}, $insert:[
                        {
                            invoiceno:"001",
                            date:"2013-12-10",
                            customer:{_id:"pawan", customer:"pawan"},
                            invoicelineitems:[
                                {
                                    deliveryid:{_id:"001", deliveryno:"001"},
                                    amount:20000
                                },
                                {
                                    deliveryid:{_id:"002", deliveryno:"002"},
                                    amount:30000
                                }
                            ]
                        }
                    ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection":"invoices"});
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                voucherid = data.result[0].voucherid
                invoiceid = data.result[0]._id;
                return db.query({"$collection":"vouchers"});
            }).then(
            function (voucherData) {
                expect(voucherData.result).to.have.length(1);
                expect(voucherData.result[0].voucherno).to.eql("001");
                expect(voucherData.result[0].invoiceid).to.eql(invoiceid);
                expect(voucherData.result[0]._id).to.eql(voucherid);
                done();
            }).fail(function (err) {
                done(err);
            });

    });

    it("create  trigger with required fields", function (done) {
        var db = undefined;
        var event = undefined;
        var voucherid = undefined;
        var invoiceid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var modifyPerson = {   name:"preJob", source:"NorthwindTestCase/lib/InvoiceJob"};
                var event = [
                    {
                        function:modifyPerson,
                        event:"onSave",
                        pre:true,
                        requiredfields:{"customerid.accountid.account":1, "customerid.accountid.type":1, "customerid.name":1}
                    }
                ];

                var updates = [
                    {
                        $collection:"accounts",
                        $insert:[
                            {_id:"SBI", account:"SBI", "type":"Salary"},
                            {_id:"PA", account:"PA", "type":"Personal Account"}
                        ]
                    } ,
                    {
                        $collection:{"collection":"customers", fields:[
                            {field:"accountid", type:"fk", collection:"accounts" }
                        ]}, $insert:[
                        {_id:"customer1", "name":"bansal-and-sons", "accountid":{_id:"SBI"}},
                        {_id:"customer2", "name":"dalal-brothers", "accountid":{$query:{_id:"PA"}}}
                    ]
                    },
                    {$collection:{"collection":"invoices", "events":event, fields:[
                        {field:"customerid", type:"fk", collection:{collection:"customers", fields:[
                            {field:"accountid", type:"fk", collection:{collection:"accounts"}}
                        ]}}
                    ]}, $insert:[
                        {
                            invoiceno:"001",
                            date:"2013-12-10",
                            customerid:{_id:"customer1"},
                            invoicelineitems:[
                                {
                                    deliveryid:{_id:"001", deliveryno:"001"},
                                    amount:20000
                                },
                                {
                                    deliveryid:{_id:"002", deliveryno:"002"},
                                    amount:30000
                                }
                            ]
                        }
                    ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection":"invoices"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].customername).to.eql("bansal-and-sons");
                expect(data.result[0].accountname).to.eql("SBI");
                expect(data.result[0].accounttype).to.eql("Salary");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("create another trigger with required fields in nested array", function (done) {
        var db = undefined;
        var event = undefined;
        var voucherid = undefined;
        var invoiceid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var modifyPerson = {   name:"insertJob", source:"NorthwindTestCase/lib/InvoiceJob"};
                event = [
                    {
                        function:modifyPerson,
                        event:"onSave",
                        pre:true,
                        requiredfields:{"invoicelineitems.purchases.productid.accountid.accountgroupid.name":1, "invoicelineitems.purchases.productid.accountid.account":1, "invoicelineitems.purchases.productid.accountid.type":1, "invoicelineitems.purchases.productid.name":1, "invoicelineitems.purchases.productid.type":1}
                    }
                ];

                var updates = [
                    {
                        $collection:"accountgroups",
                        $insert:[
                            {_id:"Asset", name:"Asset"},
                            {_id:"Revenue", name:"Revenue"} ,
                            {_id:"Liability", name:"Liability"},
                            {_id:"Expense", name:"Expense"}
                        ]
                    } ,

                    {
                        $collection:"accounts",
                        $insert:[
                            {_id:"SBI", account:"SBI", "type":"asset", accountgroupid:{_id:"Asset"}},
                            {_id:"PNB", account:"PNB", "type":"expense", accountgroupid:{_id:"Expense"}},
                            {_id:"cashinhand", account:"cashinhand", "type":"revenue", accountgroupid:{_id:"Revenue"}},
                            {_id:"parking", account:"PNB", "type":"liability", accountgroupid:{_id:"Liability"}}
                        ]
                    } ,
                    {
                        $collection:"products",
                        $insert:[
                            {_id:"computer", name:"computer", "type":"device", accountid:{_id:"SBI"}},
                            {_id:"laptop", name:"laptop", "type":"portabledevice", accountid:{_id:"PNB"}},
                            {_id:"chairs", name:"chairs", "type":"comfortable", accountid:{_id:"cashinhand"}} ,
                            {_id:"ac", name:"ac", "type":"coolingdevice", accountid:{_id:"PNB"}}
                        ]
                    } ,
                    {$collection:{"collection":"invoices", "events":event, fields:[
                        {field:"invoiceno", type:"string"},
                        {field:"date", type:"date"},
                        {field:"invoicelineitems", type:"object", multiple:true, fields:[
                            {field:"purchases", type:"object", multiple:true, fields:[
                                {field:"productid", type:"fk", collection:{"collection":"products", fields:[
                                    {field:"accountid", type:"fk", collection:{"collection":"accounts", fields:[
                                        {field:"accountgroupid", type:"fk", "collection":"accountgroups"}
                                    ]}}
                                ]}}
                            ]}
                        ]}
                    ]}, $insert:[
                        {
                            invoiceno:"001",
                            date:"2013-12-10",
                            invoicelineitems:[
                                {
                                    lineitemno:"1",
                                    purchases:[
                                        {
                                            purchaseno:"1",
                                            productid:{"_id":"computer"}
                                        },
                                        {
                                            purchaseno:"2",
                                            productid:{"_id":"laptop"}
                                        }
                                    ],
                                    amount:20000
                                },
                                {
                                    lineitemno:"2",
                                    purchases:[
                                        {
                                            purchaseno:"3",
                                            productid:{"_id":"chairs"}
                                        },
                                        {
                                            purchaseno:"4",
                                            productid:{"_id":"ac"}
                                        }
                                    ],
                                    amount:50000
                                }
                            ]
                        }
                    ]
                    }
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection":"invoices"});
            }).then(
            function (data) {
//                console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].invoicelineitems).to.have.length(2);
                expect(data.result[0].invoicelineitems[0].purchases).to.have.length(2);

                expect(data.result[0].invoicelineitems[0].purchases[0].name).to.eql("computer");
                expect(data.result[0].invoicelineitems[0].purchases[0].type).to.eql("device");
                expect(data.result[0].invoicelineitems[0].purchases[0].accountid.name).to.eql("SBI");
                expect(data.result[0].invoicelineitems[0].purchases[0].accountid.type).to.eql("asset");
                expect(data.result[0].invoicelineitems[0].purchases[0].accountid.accountgroupid.name).to.eql("Asset");

                expect(data.result[0].invoicelineitems[0].purchases[1].name).to.eql("laptop");
                expect(data.result[0].invoicelineitems[0].purchases[1].type).to.eql("portabledevice");
                expect(data.result[0].invoicelineitems[0].purchases[1].accountid.name).to.eql("PNB");
                expect(data.result[0].invoicelineitems[0].purchases[1].accountid.type).to.eql("expense");
                expect(data.result[0].invoicelineitems[0].purchases[1].accountid.accountgroupid.name).to.eql("Expense");


                expect(data.result[0].invoicelineitems[1].purchases).to.have.length(2);

                expect(data.result[0].invoicelineitems[1].purchases[0].name).to.eql("chairs");
                expect(data.result[0].invoicelineitems[1].purchases[0].type).to.eql("comfortable");
                expect(data.result[0].invoicelineitems[1].purchases[0].accountid.name).to.eql("cashinhand");
                expect(data.result[0].invoicelineitems[1].purchases[0].accountid.type).to.eql("revenue");
                expect(data.result[0].invoicelineitems[1].purchases[0].accountid.accountgroupid.name).to.eql("Revenue");

                expect(data.result[0].invoicelineitems[1].purchases[1].name).to.eql("ac");
                expect(data.result[0].invoicelineitems[1].purchases[1].type).to.eql("coolingdevice");
                expect(data.result[0].invoicelineitems[1].purchases[1].accountid.name).to.eql("PNB");
                expect(data.result[0].invoicelineitems[1].purchases[1].accountid.type).to.eql("expense");
                expect(data.result[0].invoicelineitems[1].purchases[1].accountid.accountgroupid.name).to.eql("Expense");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("create another case of update trigger with required fields in nested array", function (done) {
        var db = undefined;
        var event = undefined;
        var voucherid = undefined;
        var invoiceid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var modifyPerson = {   name:"updateJob", source:"NorthwindTestCase/lib/InvoiceJob"};
                event = [
                    {
                        function:modifyPerson,
                        event:"onSave",
                        pre:true,
                        requiredfields:{"invoicelineitems.purchases.productid.accountid.accountgroupid.name":1, "invoicelineitems.purchases.productid.accountid.account":1, "invoicelineitems.purchases.productid.accountid.type":1, "invoicelineitems.purchases.productid.name":1, "invoicelineitems.purchases.productid.type":1}
                    }
                ];

                var updates = [
                    {
                        $collection:"accountgroups",
                        $insert:[
                            {_id:"Asset", name:"Asset"},
                            {_id:"Revenue", name:"Revenue"} ,
                            {_id:"Liability", name:"Liability"},
                            {_id:"Expense", name:"Expense"}
                        ]
                    } ,

                    {
                        $collection:"accounts",
                        $insert:[
                            {_id:"SBI", account:"SBI", "type":"asset", accountgroupid:{_id:"Asset"}},
                            {_id:"PNB", account:"PNB", "type":"expense", accountgroupid:{_id:"Expense"}},
                            {_id:"cashinhand", account:"cashinhand", "type":"revenue", accountgroupid:{_id:"Revenue"}},
                            {_id:"parking", account:"PNB", "type":"liability", accountgroupid:{_id:"Liability"}}
                        ]
                    } ,
                    {
                        $collection:"products",
                        $insert:[
                            {_id:"computer", name:"computer", "type":"device", accountid:{_id:"SBI"}},
                            {_id:"laptop", name:"laptop", "type":"portabledevice", accountid:{_id:"PNB"}},
                            {_id:"chairs", name:"chairs", "type":"comfortable", accountid:{_id:"cashinhand"}} ,
                            {_id:"ac", name:"ac", "type":"coolingdevice", accountid:{_id:"PNB"}}
                        ]
                    } ,
                    {$collection:{"collection":"invoices", "events":event, fields:[
                        {field:"invoiceno", type:"string"},
                        {field:"date", type:"date"},
                        {field:"invoicelineitems", type:"object", multiple:true, fields:[
                            {field:"purchases", type:"object", multiple:true, fields:[
                                {field:"productid", type:"fk", collection:{"collection":"products", fields:[
                                    {field:"accountid", type:"fk", collection:{"collection":"accounts", fields:[
                                        {field:"accountgroupid", type:"fk", "collection":"accountgroups"}
                                    ]}}
                                ]}}
                            ]}
                        ]}
                    ]}, $insert:[
                        {
                            _id:"myinvoice",
                            invoiceno:"001",
                            date:"2013-12-10",
                            invoicelineitems:[
                                {
                                    "_id":1,
                                    lineitemno:"1",
                                    purchases:[
                                        {  "_id":1,
                                            purchaseno:"1",
                                            productid:{"_id":"computer"}
                                        },
                                        {         "_id":2,
                                            purchaseno:"2",
                                            productid:{"_id":"laptop"}
                                        }
                                    ],
                                    amount:20000
                                },
                                {          "_id":2,
                                    lineitemno:"2",
                                    purchases:[
                                        {
                                            "_id":3,
                                            purchaseno:"3",
                                            productid:{"_id":"chairs"}
                                        },
                                        {
                                            "_id":4,
                                            purchaseno:"4",
                                            productid:{"_id":"ac"}
                                        }
                                    ],
                                    amount:50000
                                }
                            ]
                        }
                    ]
                    }
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection":"invoices"});
            }).then(
            function (data) {
//                console.log("data after insert>>>>>>>>>>>>.." + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                var newUpdates = [
                    {
                        $collection:"products",
                        $insert:[
                            {_id:"notebooks", name:"notebooks", "type":"utility", accountid:{_id:"SBI"}}
                        ]
                    } ,
                    {$collection:{"collection":"invoices", "events":event, fields:[
                        {field:"invoiceno", type:"string"},
                        {field:"date", type:"date"},
                        {field:"invoicelineitems", type:"object", multiple:true, fields:[
                            {field:"purchases", type:"object", multiple:true, fields:[
                                {field:"productid", type:"fk", collection:{"collection":"products", fields:[
                                    {field:"accountid", type:"fk", collection:{"collection":"accounts", fields:[
                                        {field:"accountgroupid", type:"fk", "collection":"accountgroups"}
                                    ]}}
                                ]}}
                            ]}
                        ]}
                    ]}, $update:[
                        {
                            _id:"myinvoice",
                            $set:{
                                invoicelineitems:{
                                    $insert:[
                                        {
                                            "_id":3,
                                            lineitemno:"3",
                                            purchases:[
                                                {
                                                    "_id":5,
                                                    purchaseno:"5",
                                                    productid:{"_id":"computer"}
                                                },
                                                {
                                                    "_id":6,
                                                    purchaseno:"6",
                                                    productid:{"_id":"notebooks"}
                                                }
                                            ],
                                            amount:20000
                                        }
                                    ],
                                    $update:[
                                        {   $query:{lineitemno:"2"},
                                            $set:{
                                                purchases:{
                                                    $insert:[
                                                        {
                                                            "_id":7,
                                                            purchaseno:"7",
                                                            productid:{"_id":"notebooks"}
                                                        }
                                                    ],
                                                    $update:[
                                                        {
                                                            $query:{purchaseno:"3"},
                                                            $set:{
                                                                productid:{_id:"computer"}
                                                            }
                                                        }
                                                    ]
                                                }
                                            }
                                        }
                                    ]
                                }
                            }
                        }
                    ]
                    }
                ];
                return db.update(newUpdates);
            }).then(
            function () {
                return db.query({"$collection":"invoices"});
            }).then(
            function (data) {
//                console.log("data>>>>>>>>>>>after >>>>>>>>>>>.update" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].invoicelineitems).to.have.length(3);
//                console.log("data>>>>>>>>>>>after >>>>>>>>>>>.data.result[0].invoicelineitems[0].purchases[0]" + JSON.stringify(data.result[0].invoicelineitems[0].purchases[0]));
                expect(data.result[0].invoicelineitems[0].purchases).to.have.length(2);
                expect(data.result[0].invoicelineitems[0].purchases[0].name).to.eql("computer");
                expect(data.result[0].invoicelineitems[0].purchases[0].type).to.eql("device");
                expect(data.result[0].invoicelineitems[0].purchases[0].accountid.name).to.eql("SBI");
                expect(data.result[0].invoicelineitems[0].purchases[0].accountid.type).to.eql("asset");
                expect(data.result[0].invoicelineitems[0].purchases[0].accountid.accountgroupid.name).to.eql("Asset");

//                console.log("data>>>>>>>>>>>after >>>>>>>>>>>.data.result[0].invoicelineitems[0].purchases[1]" + JSON.stringify(data.result[0].invoicelineitems[0].purchases[1]));
                expect(data.result[0].invoicelineitems[0].purchases[1].name).to.eql("laptop");
                expect(data.result[0].invoicelineitems[0].purchases[1].type).to.eql("portabledevice");
                expect(data.result[0].invoicelineitems[0].purchases[1].accountid.name).to.eql("PNB");
                expect(data.result[0].invoicelineitems[0].purchases[1].accountid.type).to.eql("expense");
                expect(data.result[0].invoicelineitems[0].purchases[1].accountid.accountgroupid.name).to.eql("Expense");


                expect(data.result[0].invoicelineitems[2].purchases).to.have.length(2);
//                console.log("data>>>>>>>>>>>after >>>>>>>>>>>.data.result[0].invoicelineitems[2].purchases[0]" + JSON.stringify(data.result[0].invoicelineitems[2].purchases[0]));
                expect(data.result[0].invoicelineitems[2].purchases[0].name).to.eql("computer");
                expect(data.result[0].invoicelineitems[2].purchases[0].type).to.eql("device");
                expect(data.result[0].invoicelineitems[2].purchases[0].accountid.name).to.eql("SBI");
                expect(data.result[0].invoicelineitems[2].purchases[0].accountid.type).to.eql("asset");
                expect(data.result[0].invoicelineitems[2].purchases[0].accountid.accountgroupid.name).to.eql("Asset");

//                console.log("data>>>>>>>>>>>after >>>>>>>>>>>.data.result[0].invoicelineitems[2].purchases[1]" + JSON.stringify(data.result[0].invoicelineitems[2].purchases[1]));
                expect(data.result[0].invoicelineitems[2].purchases[1].name).to.eql("notebooks");
                expect(data.result[0].invoicelineitems[2].purchases[1].type).to.eql("utility");
                expect(data.result[0].invoicelineitems[2].purchases[1].accountid.name).to.eql("SBI");
                expect(data.result[0].invoicelineitems[2].purchases[1].accountid.type).to.eql("asset");
                expect(data.result[0].invoicelineitems[2].purchases[1].accountid.accountgroupid.name).to.eql("Asset");
                //
//                console.log("data>>>>>>>>>>>after >>>>>>>>>>>.data.result[0].invoicelineitems[1].purchases[0]" + JSON.stringify(data.result[0].invoicelineitems[1].purchases[0]));
                expect(data.result[0].invoicelineitems[1].purchases).to.have.length(3);
                expect(data.result[0].invoicelineitems[1].purchases[0].name).to.eql("computer");
                expect(data.result[0].invoicelineitems[1].purchases[0].type).to.eql("device");
                expect(data.result[0].invoicelineitems[1].purchases[0].accountid.name).to.eql("SBI");
                expect(data.result[0].invoicelineitems[1].purchases[0].accountid.type).to.eql("asset");
                expect(data.result[0].invoicelineitems[1].purchases[0].accountid.accountgroupid.name).to.eql("Asset");
//                console.log("data>>>>>>>>>>>after >>>>>>>>>>>.data.result[0].invoicelineitems[1].purchases[1]" + JSON.stringify(data.result[0].invoicelineitems[1].purchases[1]));
                expect(data.result[0].invoicelineitems[1].purchases[1].name).to.eql("ac");
                expect(data.result[0].invoicelineitems[1].purchases[1].type).to.eql("coolingdevice");
                expect(data.result[0].invoicelineitems[1].purchases[1].accountid.name).to.eql("PNB");
                expect(data.result[0].invoicelineitems[1].purchases[1].accountid.type).to.eql("expense");
                expect(data.result[0].invoicelineitems[1].purchases[1].accountid.accountgroupid.name).to.eql("Expense");
//                console.log("data>>>>>>>>>>>after >>>>>>>>>>>.data.result[0].invoicelineitems[1].purchases[2]" + JSON.stringify(data.result[0].invoicelineitems[1].purchases[2]));
                expect(data.result[0].invoicelineitems[1].purchases[2].name).to.eql("notebooks");
                expect(data.result[0].invoicelineitems[1].purchases[2].type).to.eql("utility");
                expect(data.result[0].invoicelineitems[1].purchases[2].accountid.name).to.eql("SBI");
                expect(data.result[0].invoicelineitems[1].purchases[2].accountid.type).to.eql("asset");
                expect(data.result[0].invoicelineitems[1].purchases[2].accountid.accountgroupid.name).to.eql("Asset");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("required Field in post trigger", function (done) {
        var db = undefined;
        var event = undefined;
        var voucherid = undefined;
        var invoiceid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var modifyPerson = {   name:"postJob", source:"NorthwindTestCase/lib/InvoiceJob"};
                var event = [
                    {
                        function:modifyPerson,
                        event:"onSave",
                        post:true,
                        requiredfields:{"customerid.accountid.account":1, "customerid.accountid.type":1, "customerid.name":1}
                    }
                ];

                var updates = [
                    {
                        $collection:"accounts",
                        $insert:[
                            {_id:"SBI", account:"SBI", "type":"Salary"},
                            {_id:"PA", account:"PA", "type":"Personal Account"}
                        ]
                    } ,
                    {
                        $collection:{"collection":"customers", fields:[
                            {field:"accountid", type:"fk", collection:"accounts" }
                        ]}, $insert:[
                        {_id:"customer1", "name":"bansal-and-sons", "accountid":{_id:"SBI"}},
                        {_id:"customer2", "name":"dalal-brothers", "accountid":{$query:{_id:"PA"}}}
                    ]
                    },
                    {$collection:{"collection":"invoices", "events":event, fields:[
                        {field:"customerid", type:"fk", collection:{collection:"customers", fields:[
                            {field:"accountid", type:"fk", collection:{collection:"accounts"}}
                        ]}}
                    ]}, $insert:[
                        {
                            invoiceno:"001",
                            date:"2013-12-10",
                            customerid:{_id:"customer1"}
                        }
                    ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection":"invoices"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].customername).to.eql("bansal-and-sons");
                expect(data.result[0].accountname).to.eql("SBI");
                expect(data.result[0].accountype).to.eql("Salary");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("required fields testcase when nochange in required column", function (done) {
        var db = undefined;
        var createVoucher = {   name:"onPostSave", source:"NorthwindTestCase/lib/VoucherJob"};
        var event = [
            {
                function:createVoucher,
                event:"onSave",
                post:true,
                requiredfields:{"vli.accountid.type":1}
            }
        ];
        var voucherDef = {"collection":"vouchers", "events":event, fields:[
            {field:"voucherno", "type":"string"},
            {field:"voucherdate", "type":"date"},
            {field:"vli", "type":"object", multiple:true, fields:[
                {field:"accountid", type:"fk", collection:{collection:"accounts", fields:[
                    {field:"account", type:"string"}
                ]}},
                {field:"amount", type:"currency", fields:[
                    {field:"amount", "type":"decimal"},
                    {field:"type", "type":"fk", upsert:true, collection:{collection:"pl.currencies"}, fields:[
                        {field:"account", type:"string"}
                    ]}
                ]}
            ]}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;

                var updates = [
                    {$collection:"accounts", $insert:[
                        {_id:"SBI", account:"SBI", "type":"Salary"},
                        {_id:"PA", account:"PA", "type":"Personal Account"}
                    ]},
                    {$collection:voucherDef, $insert:[
                        {
                            voucherno:"001",
                            voucherdate:"2013-12-10",
                            vli:[
                                {amount:{"amount":"100", type:{$query:{currency:"INR"}}}, accountid:{$query:{account:"SBI"}}}
                            ]
                        }
                    ]
                    }
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"vouchers"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].vli[0].iaccounttype).to.eql("Salary");
                var update = [
                    {$collection:voucherDef, $update:[
                        {_id:data.result[0]._id, $set:{voucherno:"123356"}}
                    ]}
                ]
                return db.update(update);
            }).then(
            function (data) {
                return db.query({$collection:"vouchers"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].vli[0].uaccounttype).to.eql("Salary");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("resolve fk testcase", function (done) {
        var db = undefined;
        var createVoucher = {   name:"resolveFK", source:"NorthwindTestCase/lib/VoucherJob"};
        var event = [
            {
                function:createVoucher,
                event:"onSave",
                pre:true,
                requiredfields:{"accountid.type":1}
            }
        ];
        var voucherDef = {"collection":"vouchers", "events":event, fields:[
            {field:"voucherno", "type":"string"},
            {field:"voucherdate", "type":"date"},
            {field:"accountid", type:"fk", collection:{collection:"accounts", fields:[
                {field:"account", type:"string"}
            ]}, set:["type"]},
            {field:"vli", "type":"object", multiple:true, fields:[
                {field:"accountid", type:"fk", collection:{collection:"accounts", fields:[
                    {field:"account", type:"string"}
                ]}, set:["type"]},
                {field:"deductions", type:"object", "multiple":true, fields:[
                    {field:"accountid", type:"fk", collection:"accounts", set:["type"]}
                ]}
            ]}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return ApplaneDB.registerCollection(voucherDef);
            }).then(
            function () {
                return ApplaneDB.registerFunction(createVoucher);
            }).then(
            function () {
                var updates = [
                    {$collection:"accounts", $insert:[
                        {_id:"SBI", account:"SBI", "type":"Salary"},
                        {_id:"PA", account:"PA", "type":"Personal Account"}
                    ]},
                    {$collection:"vouchers", $insert:[
                        {
                            voucherno:"001",
                            voucherdate:"2013-12-10",
                            vli:[
                                { vlinumber:"1234", deductions:[
                                    {deductionnumber:"4321"}
                                ]}
                            ]
                        }
                    ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"vouchers"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].accountid._id).to.eql("SBI");
                expect(data.result[0].accountid.type).to.eql("Salary");
                expect(data.result[0].vli[0].accountid._id).to.eql("PA");
                expect(data.result[0].vli[0].accountid.type).to.eql("Personal Account");
                expect(data.result[0].vli[0].deductions[0].accountid._id).to.eql("SBI");
                expect(data.result[0].vli[0].deductions[0].accountid.type).to.eql("Salary");
            }).then(
            function () {
                return ApplaneDB.removeCollections(voucherDef);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    });

    it("resolve fk testcase with upsert true", function (done) {
        var db = undefined;
        var createVoucher = {   name:"resolveFKWithUpsert", source:"NorthwindTestCase/lib/VoucherJob"};
        var event = [
            {
                function:createVoucher,
                event:"onSave",
                pre:true,
                requiredfields:{"accountid.type":1}
            }
        ];
        var voucherDef = {"collection":"vouchers", "events":event, fields:[
            {field:"voucherno", "type":"string"},
            {field:"voucherdate", "type":"date"},
            {field:"accountid", type:"fk", collection:{collection:"accounts", fields:[
                {field:"account", type:"string"}
            ]}, set:["type", "account"]},
            {field:"vli", "type":"object", multiple:true, fields:[
                {field:"accountid", type:"fk", collection:{collection:"accounts", fields:[
                    {field:"account", type:"string"}
                ]}, set:["type", "account"]},
                {field:"deductions", type:"object", "multiple":true, fields:[
                    {field:"accountid", type:"fk", collection:"accounts", set:["type", "account"]}
                ]}
            ]}
        ]};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return ApplaneDB.registerCollection(voucherDef);
            }).then(
            function () {
                return ApplaneDB.registerFunction(createVoucher);
            }).then(
            function () {
                var updates = [
                    {$collection:"accounts", $insert:[
                        {_id:"SBI", account:"SBI", "type":"Salary"},
                        {_id:"PA", account:"PA", "type":"Personal Account"}
                    ]},
                    {$collection:"vouchers", $insert:[
                        {
                            voucherno:"001",
                            voucherdate:"2013-12-10",
                            vli:[
                                { vlinumber:"1234", deductions:[
                                    {deductionnumber:"4321"}
                                ]}
                            ]
                        }
                    ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"vouchers"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].accountid.account).to.eql("PNB");
                expect(data.result[0].vli[0].accountid.account).to.eql("SBP");
                expect(data.result[0].vli[0].deductions[0].accountid.account).to.eql("SBI");
                expect(data.result[0].vli[0].deductions[0].accountid.type).to.eql("Salary");
            }).then(
            function () {
                return ApplaneDB.removeCollections(voucherDef);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    });

    it("unset in pre job and check in post", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var modifyPersonBefore = {   name:"unsetJobBefore", source:"NorthwindTestCase/lib/PersonJob"};
                var modifyPersonAfter = {   name:"unsetJobAfter", source:"NorthwindTestCase/lib/PersonJob"};
                event = [
                    {
                        function:modifyPersonBefore,
                        event:"onSave",
                        pre:true
                    },
                    {
                        function:modifyPersonAfter,
                        event:"onSave",
                        post:true
                    }
                ];

                var updates = [
                    {$collection:{"collection":"Persons", "events":event}, $insert:[
                        {"lastname":"Sangwan", "firstname":"Manjeet", email:"manjeet.sangwan@daffodilsw.com", salary:10000}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection":"Persons"});
            }).then(
            function (data) {
//                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].email).to.eql("manjeet.sangwan@daffodilsw.com");
                expect(data.result[0].lastname).to.eql("Sangwan");
                expect(data.result[0].firstname).to.eql("Manjeet");
                var updates = [
                    {$collection:{"collection":"Persons", "events":event}, $update:[
                        {_id:data.result[0]._id, $set:{fullname:"Manjeet Sangwan"}}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection":"Persons"});
            }).then(
            function (data) {
                console.log("Data>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].email).to.eql(undefined);
                expect(data.result[0].salary).to.eql(undefined);
                expect(data.result[0].myemail).to.eql("abc@def.com");
                expect(data.result[0].fullname).to.eql("Manjeet Sangwan");
                done();
            }).fail(function (err) {
                done(err);
            });

    });

    it("domain in pre job", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var triggerParameters = {   name:"triggerParameters", source:"NorthwindTestCase/lib/Cities"};
                event = [
                    {
                        function:triggerParameters,
                        event:"onSave",
                        pre:true
                    }
                ];

                var updates = [
                    {$collection:{"collection":"Persons", "events":event}, $insert:[
                        {"lastname":"Sangwan", "firstname":"Manjeet", email:"manjeet.sangwan@daffodilsw.com", salary:1000000}
                    ]}
                ]
                return db.update(updates, {domain:"beta.business.applane.com"});
            }).then(
            function () {
                return db.query({"$collection":"Persons"});
            }).then(
            function (data) {
                console.log("data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].email).to.eql("manjeet.sangwan@daffodilsw.com");
                expect(data.result[0].lastname).to.eql("Sangwan");
                expect(data.result[0].firstname).to.eql("Manjeet");
                expect(data.result[0].domain).to.eql("beta.business.applane.com");
                done();
            }).fail(function (err) {
                done(err);
            });

    });

    it.skip("array override with reqired columns", function (done) {
        done();
    })

    it.skip("same query from onQuery in trigger", function (done) {
        var db = undefined;
        var event = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionsToRegister = [
                    {collection:"employees", events:[
                        {event:'onQuery', function:"EmployeeJob.onPreQuery", pre:true}
                    ]}
                ]
                return ApplaneDB.registerCollection(collectionsToRegister);
            }).then(
            function () {
                var functionsToRegister = [
                    {name:"EmployeeJob", source:"NorthwindTestCase/lib", type:"js"}
                ]
                return ApplaneDB.registerFunction(functionsToRegister);
            }).then(
            function () {
                var updates = [
                    {$collection:"employees", $insert:[
                        {"lastname":"Sangwan", "firstname":"Manjeet", name:"ManjeetSangwan"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"employees", $filter:{"name":"ManjeetSangwan"}});
            }).then(
            function (data) {
                expect(data.result).not.to.be.ok();
                done();
            }).fail(
            function (err) {
                expect(err).to.eql("Query in Recursion");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it.skip("same update from post trigger", function (done) {
        var db = undefined;
        var event = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionsToRegister = [
                    {collection:"employees", events:[
                        {event:'onSave', function:"EmployeeJob.onPostSave", pre:true}
                    ]}
                ]
                return ApplaneDB.registerCollection(collectionsToRegister);
            }).then(
            function () {
                var functionsToRegister = [
                    {name:"EmployeeJob", source:"NorthwindTestCase/lib", type:"js"}
                ]
                return ApplaneDB.registerFunction(functionsToRegister);
            }).then(
            function () {
                var updates = [
                    {$collection:"employees", $insert:[
                        {"lastname":"Sangwan", "firstname":"Manjeet", name:"ManjeetSangwan"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function (data) {
//                console.log("data>>>>>>>" + JSON.stringify(data));
                expect(data.result).not.to.be.ok();
                done();
            }).fail(
            function (err) {
//                console.log("err in testcase" + err);
                expect(err).to.eql("update in recursion with " + JSON.stringify([
                    {"_id":"manjeet", "$inc":{"employeecount":1}}
                ]));
                done();
            }).fail(function (err) {
                done(err);
            });
    });

})
;


