/**
 * mocha --recursive --timeout 150000 -g "Sequence testcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert sequence type field in collection, with series but no number" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert sequence type field in collection, with no record" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert sequence type field in collection, with no series, but have number" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert sequence type field in collection, with series and number, multiple record" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert sequence type field in collection, with series and start range" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert sequence type field in collection, with different series" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert sequence type field in collection, with series, same number build, error case" --reporter spec
 * mocha --recursive --timeout 150000 -g "Async insert sequence type field in collection, with series but no number" --reporter spec
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../lib/Constants.js");
describe("Sequence testcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it("insert sequence type field in collection, with series but no number", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"invoice"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"invoiceNo", type:"sequence", collectionid:{$query:{collection:"invoice"}}}
                ]});
            }).then(
            function () {
                var updates = [
                    {$collection:"invoice", $insert:[
                        {"name":"rajit", "invoiceNo":"daffodilsw"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql("daffodilsw1");
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"manjeet", "invoiceNo":"daffodilsw"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[1].name).to.eql("manjeet");
                expect(data.result[0].invoiceNo).to.eql("daffodilsw1");
                expect(data.result[1].invoiceNo).to.eql("daffodilsw2");
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"ashu", "invoiceNo":"daffodilsw"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[1].name).to.eql("manjeet");
                expect(data.result[2].name).to.eql("ashu");
                expect(data.result[0].invoiceNo).to.eql("daffodilsw1");
                expect(data.result[1].invoiceNo).to.eql("daffodilsw2");
                expect(data.result[2].invoiceNo).to.eql("daffodilsw3");
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"naveen", "invoiceNo":"daffodilsw"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(4);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[1].name).to.eql("manjeet");
                expect(data.result[2].name).to.eql("ashu");
                expect(data.result[3].name).to.eql("naveen");
                expect(data.result[0].invoiceNo).to.eql("daffodilsw1");
                expect(data.result[1].invoiceNo).to.eql("daffodilsw2");
                expect(data.result[2].invoiceNo).to.eql("daffodilsw3");
                expect(data.result[3].invoiceNo).to.eql("daffodilsw4");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert sequence type field in collection, with no record", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"invoice"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"invoiceNo", type:"sequence", collectionid:{$query:{collection:"invoice"}}}
                ]});
            }).then(
            function () {
                var updates = [
                    {$collection:"invoice", $insert:[
                        {"name":"rajit"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql("1");
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"ashu"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql("1");
                expect(data.result[1].name).to.eql("ashu");
                expect(data.result[1].invoiceNo).to.eql("2");
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"manjeet"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql("1");
                expect(data.result[1].name).to.eql("ashu");
                expect(data.result[1].invoiceNo).to.eql("2");
                expect(data.result[2].name).to.eql("manjeet");
                expect(data.result[2].invoiceNo).to.eql("3");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert sequence type field in collection, with no series, but have number", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"invoice"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"invoiceNo", type:"sequence", collectionid:{$query:{collection:"invoice"}}}
                ]});
            }).then(
            function () {
                var updates = [
                    {$collection:"invoice", $insert:[
                        {"name":"rajit", invoiceNo:10 }
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql(10);
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"manjeet", invoiceNo:20 }
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql(10);
                expect(data.result[1].name).to.eql("manjeet");
                expect(data.result[1].invoiceNo).to.eql(20);
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"ashu", invoiceNo:30 }
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql(10);
                expect(data.result[1].name).to.eql("manjeet");
                expect(data.result[1].invoiceNo).to.eql(20);
                expect(data.result[2].name).to.eql("ashu");
                expect(data.result[2].invoiceNo).to.eql(30);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert sequence type field in collection, with series and number, multiple record", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"invoice"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"invoiceNo", type:"sequence", collectionid:{$query:{collection:"invoice"}}}
                ]});
            }).then(
            function () {
                var updates = [
                    {$collection:"invoice", $insert:[
                        {"name":"rajit", invoiceNo:"daffodil10" }
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql("daffodil10");
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"manjeet", invoiceNo:"daffodil" }
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql("daffodil10");
                expect(data.result[1].name).to.eql("manjeet");
                expect(data.result[1].invoiceNo).to.eql("daffodil1");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert sequence type field in collection, with different series", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"invoice"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"invoiceNo", type:"sequence", collectionid:{$query:{collection:"invoice"}}}
                ]});
            }).then(
            function () {
                var updates = [
                    {$collection:"invoice", $insert:[
                        {"name":"rajit", invoiceNo:"daffodil" }
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql("daffodil1");
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"manjeet", invoiceNo:"daffodilsw" }
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql("daffodil1");
                expect(data.result[1].name).to.eql("manjeet");
                expect(data.result[1].invoiceNo).to.eql("daffodilsw1");
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"ashu", invoiceNo:"daffodilsw" }
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql("daffodil1");
                expect(data.result[1].name).to.eql("manjeet");
                expect(data.result[1].invoiceNo).to.eql("daffodilsw1");
                expect(data.result[2].name).to.eql("ashu");
                expect(data.result[2].invoiceNo).to.eql("daffodilsw2");
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"sachin", invoiceNo:"daffodil"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(4);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql("daffodil1");
                expect(data.result[1].name).to.eql("manjeet");
                expect(data.result[1].invoiceNo).to.eql("daffodilsw1");
                expect(data.result[2].name).to.eql("ashu");
                expect(data.result[2].invoiceNo).to.eql("daffodilsw2");
                expect(data.result[3].name).to.eql("sachin");
                expect(data.result[3].invoiceNo).to.eql("daffodil2");
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"bhuvnesh"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(5);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql("daffodil1");
                expect(data.result[1].name).to.eql("manjeet");
                expect(data.result[1].invoiceNo).to.eql("daffodilsw1");
                expect(data.result[2].name).to.eql("ashu");
                expect(data.result[2].invoiceNo).to.eql("daffodilsw2");
                expect(data.result[3].name).to.eql("sachin");
                expect(data.result[3].invoiceNo).to.eql("daffodil2");
                expect(data.result[4].name).to.eql("bhuvnesh");
                expect(data.result[4].invoiceNo).to.eql("1");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert sequence type field in collection, with series, same number build, error case", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.collections", $insert:[
                        {_id:1001, "collection":"invoice"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {_id:"111", field:"invoiceNo", type:"sequence", collectionid:{$query:{"collection":"invoice"}}}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"rajit", "invoiceNo":"daffodilsw3"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[0].invoiceNo).to.eql("daffodilsw3");
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"manjeet", "invoiceNo":"daffodilsw1"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[1].name).to.eql("manjeet");
                expect(data.result[0].invoiceNo).to.eql("daffodilsw3");
                expect(data.result[1].invoiceNo).to.eql("daffodilsw1");
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"ashu", "invoiceNo":"daffodilsw"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[1].name).to.eql("manjeet");
                expect(data.result[2].name).to.eql("ashu");
                expect(data.result[0].invoiceNo).to.eql("daffodilsw3");
                expect(data.result[1].invoiceNo).to.eql("daffodilsw1");
                expect(data.result[2].invoiceNo).to.eql("daffodilsw1");
                var updates = [
                    {$collection:{"collection":"invoice", fields:[
                        {field:"name", type:"string"},
                        {field:"invoiceNo", type:"sequence"}
                    ]}, $insert:[
                        {"name":"naveen", "invoiceNo":"daffodilsw"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"invoice"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(4);
                expect(data.result[0].name).to.eql("rajit");
                expect(data.result[1].name).to.eql("manjeet");
                expect(data.result[2].name).to.eql("ashu");
                expect(data.result[0].invoiceNo).to.eql("daffodilsw3");
                expect(data.result[1].invoiceNo).to.eql("daffodilsw1");
                expect(data.result[2].invoiceNo).to.eql("daffodilsw1");
                expect(data.result[3].invoiceNo).to.eql("daffodilsw2");
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert sequence type field in collection, dollar field, with series but no number", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"invoice"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"invoiceNo", type:"sequence", collectionid:{$query:{collection:"invoice"}}}
                ]});
            }).then(
            function () {
                var updates = [
                    {$collection:"invoice", $insert:[
                        {"$name":"rajit", "invoiceNo":"daffodilsw"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                if (err.message === "key $name must not start with '$'") {
                    done();
                } else {
                    done(err);
                }
            });
    });
    it("insert sequence type from job", function (done) {
        var db = undefined;
        var insertSeqNo = {   name:"insertSeqNo", source:"NorthwindTestCase/lib/VoucherJob"};
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection:"pl.collections", $insert:[
                        {collection:"voucher"}
                    ]},
                    {$collection:"pl.events", $insert:[
                        {
                            function:insertSeqNo,
                            event:"onSave",
                            pre:true,
                            collectionid:{$query:{collection:"voucher"}}
                        }
                    ]}
                ]);
            }).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"voucherno", type:"sequence", collectionid:{$query:{collection:"voucher"}}}
                ]});
            }).then(
            function () {
                ApplaneDB.registerFunction(insertSeqNo);
            }).then(
            function () {
                var updates = [
                    {$collection:"voucher", $insert:[
                        {"name":"rajit"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"voucher"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].voucherno).to.eql("a/b/c1");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    // sequence test case with transactions
    it("rollback from one transaction and commit from another", function (done) {
        var db = undefined;
        var db1 = undefined;
        var txid = undefined;
        var txid1 = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"invoice"}
                ]});
            }).then(
            function (result) {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"invoiceno", type:"sequence", collectionid:{$query:{collection:"invoice"}}},
                    {field:"date", type:"date", collectionid:{$query:{collection:"invoice"}}},
                    {field:"type", type:"string", collectionid:{$query:{collection:"invoice"}}}
                ]});
            }).then(
            function () {
                var updates = [
                    {$collection:"invoice", $insert:[
                        {"date":new Date(), "invoiceno":"a/", "vendor":"Steve"}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                return db.startTransaction().then(
                    function (txidins) {
                        txid = txidins;
                        var updates = [
                            {$collection:"invoice", $insert:[
                                {"date":new Date(), "invoiceno":"a/", "vendor":"john"},
                                {"date":new Date(), "invoiceno":"a/", "vendor":"rickey"}
                            ]}
                        ];
                        return db.update(updates);
                    }).then(
                    function () {
                        return db.query({$collection:"invoice"});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(3);
                        expect(data.result[0].invoiceno).to.eql("a/1");
                        expect(data.result[1].invoiceno).to.eql("a/2");
                        expect(data.result[2].invoiceno).to.eql("a/3");
                    }).then(
                    function () {
                        return db.query({$collection:"pl.txs", $filter:{txid:txid}});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(4);
                    }).then(
                    function () {
                        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
                    }).then(
                    function (dbins) {
                        db1 = dbins;
                        return db1.startTransaction();
                    }).then(
                    function (txidins) {
                        txid1 = txidins;
                        return db1.update({$collection:"invoice", $insert:[
                            {data:new Date(), "invoiceno":"a/", "vendor":"mickey"}
                        ]});
                    }).then(
                    function () {
                        return db1.query({$collection:"invoice"});
                    }).then(
                    function (result) {
                        expect(result.result).to.have.length(4);
                        expect(result.result[3].invoiceno).to.eql("a/4");
                    }).then(
                    function () {
                        return db1.query({$collection:"pl.txs", $filter:{txid:txid1}});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(2);
                    }).then(
                    function (result) {
                        return db.rollbackTransaction();
                    }).then(
                    function () {
                        return db1.commitTransaction();
                    }).then(
                    function () {
                        return db.query({$collection:"pl.txs"});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(0);
                    }).then(
                    function () {
                        return db1.query({$collection:"pl.txs"});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(0);
                    }).then(
                    function () {
                        return db.query({$collection:"pl.series"});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].number).to.eql(4);
                        expect(data.result[0].series).to.eql("a/");
                        expect(data.result[0].collection).to.eql("invoice");
                    }).then(
                    function () {
                        done();
                    }).fail(function (err) {
                        done(err);
                    });
            });
    })
    it("rollback from one transaction", function (done) {
        var db = undefined;
        var db1 = undefined;
        var txid = undefined;
        var txid1 = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"invoice"}
                ]});
            }).then(
            function (result) {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"invoiceno", type:"sequence", collectionid:{$query:{collection:"invoice"}}},
                    {field:"date", type:"date", collectionid:{$query:{collection:"invoice"}}},
                    {field:"type", type:"string", collectionid:{$query:{collection:"invoice"}}}
                ]});
            }).then(
            function () {
                var updates = [
                    {$collection:"invoice", $insert:[
                        {"date":new Date(), "invoiceno":"a/", "vendor":"Steve"}
                    ]}
                ];
                return db.update(updates);
            }).then(function () {
                return db.startTransaction().then(
                    function (txidins) {
                        txid = txidins;
                        var updates = [
                            {$collection:"invoice", $insert:[
                                {"date":new Date(), "invoiceno":"a/", "vendor":"john"},
                                {"date":new Date(), "invoiceno":"a/", "vendor":"rickey"}
                            ]}
                        ];
                        return db.update(updates);
                    }).then(
                    function () {
                        return db.query({$collection:"invoice"});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(3);
                        expect(data.result[0].invoiceno).to.eql("a/1");
                        expect(data.result[1].invoiceno).to.eql("a/2");
                        expect(data.result[2].invoiceno).to.eql("a/3");
                    }).then(
                    function () {
                        return db.query({$collection:"pl.txs", $filter:{txid:txid}});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(4);
                    }).then(
                    function (result) {
                        return db.rollbackTransaction();
                    }).then(
                    function () {
                        return db.query({$collection:"pl.txs"});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(0);
                    }).then(
                    function () {
                        return db.query({$collection:"pl.series"});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].number).to.eql(1);
                        expect(data.result[0].series).to.eql("a/");
                        expect(data.result[0].collection).to.eql("invoice");
                    }).then(
                    function () {
                        done();
                    }).fail(function (err) {
                        done(err);
                    });
            });
    })
    it("rollback from one transaction with insert", function (done) {
        var db = undefined;
        var db1 = undefined;
        var txid = undefined;
        var txid1 = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"invoice"}
                ]});
            }).then(
            function (result) {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"invoiceno", type:"sequence", collectionid:{$query:{collection:"invoice"}}},
                    {field:"date", type:"date", collectionid:{$query:{collection:"invoice"}}},
                    {field:"type", type:"string", collectionid:{$query:{collection:"invoice"}}}
                ]});
            }).then(function () {
                return db.startTransaction().then(
                    function (txidins) {
                        txid = txidins;
                        var updates = [
                            {$collection:"invoice", $insert:[
                                {"date":new Date(), "invoiceno":"a/", "vendor":"Steve"},
                                {"date":new Date(), "invoiceno":"a/", "vendor":"john"},
                                {"date":new Date(), "invoiceno":"a/", "vendor":"rickey"}
                            ]}
                        ];
                        return db.update(updates);
                    }).then(
                    function () {
                        return db.query({$collection:"invoice"});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(3);
                        expect(data.result[0].invoiceno).to.eql("a/1");
                        expect(data.result[1].invoiceno).to.eql("a/2");
                        expect(data.result[2].invoiceno).to.eql("a/3");
                    }).then(
                    function () {
                        return db.query({$collection:"pl.txs", $filter:{txid:txid}});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(6);
                    }).then(
                    function (result) {
                        return db.rollbackTransaction();
                    }).then(
                    function () {
                        return db.query({$collection:"pl.txs"});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(0);
                    }).then(
                    function () {
                        return db.query({$collection:"pl.series"});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].number).to.eql(0);
                        expect(data.result[0].series).to.eql("a/");
                        expect(data.result[0].collection).to.eql("invoice");
                    }).then(
                    function () {
                        done();
                    }).fail(function (err) {
                        done(err);
                    });
            });
    })
    it("commit from one transaction with insert", function (done) {
        var db = undefined;
        var db1 = undefined;
        var txid = undefined;
        var txid1 = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update({$collection:"pl.collections", $insert:[
                    {collection:"invoice"}
                ]});
            }).then(
            function (result) {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"invoiceno", type:"sequence", collectionid:{$query:{collection:"invoice"}}},
                    {field:"date", type:"date", collectionid:{$query:{collection:"invoice"}}},
                    {field:"type", type:"string", collectionid:{$query:{collection:"invoice"}}}
                ]});
            }).then(function () {
                return db.startTransaction().then(
                    function (txidins) {
                        txid = txidins;
                        var updates = [
                            {$collection:"invoice", $insert:[
                                {"date":new Date(), "invoiceno":"a/", "vendor":"Steve"},
                                {"date":new Date(), "invoiceno":"a/", "vendor":"john"},
                                {"date":new Date(), "invoiceno":"a/", "vendor":"rickey"}
                            ]}
                        ];
                        return db.update(updates);
                    }).then(
                    function () {
                        return db.query({$collection:"invoice"});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(3);
                        expect(data.result[0].invoiceno).to.eql("a/1");
                        expect(data.result[1].invoiceno).to.eql("a/2");
                        expect(data.result[2].invoiceno).to.eql("a/3");
                    }).then(
                    function () {
                        return db.query({$collection:"pl.txs", $filter:{txid:txid}});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(6);
                    }).then(
                    function (result) {
                        return db.commitTransaction();
                    }).then(
                    function () {
                        return db.query({$collection:"pl.txs"});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(0);
                    }).then(
                    function () {
                        return db.query({$collection:"pl.series"});
                    }).then(
                    function (data) {
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].number).to.eql(3);
                        expect(data.result[0].series).to.eql("a/");
                        expect(data.result[0].collection).to.eql("invoice");
                    }).then(
                    function () {
                        done();
                    }).fail(function (err) {
                        done(err);
                    });
            });
    })
})

