/**
 * mocha --recursive --timeout 150000 -g "Transactiontestcase" --reporter spec
 * mocha --recursive --timeout 150000 -g "simple insert transaction commit" --reporter spec
 * mocha --recursive --timeout 150000 -g "simple insert transaction rollback" --reporter spec
 * mocha --recursive --timeout 150000 -g "required values in old record rollback transaction" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert operation with object multiple type field transaction rollback" --reporter spec
 * mocha --recursive --timeout 150000 -g "insert operation with object multiple type field  multiple operations in same transaction with transaction commit" --reporter spec
 *
 *
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var TestCases = require("./TestCases.js");


describe("Transactiontestcase", function () {
    afterEach(function (done) {
        TestCases.afterEach().then(
            function () {
                return ApplaneDB.connect(Config.URL, "db1", Config.OPTIONS);
            }).then(
            function (db) {
                return db.dropDatabase();
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "db2", Config.OPTIONS);
            }).then(
            function (db) {
                return db.dropDatabase();
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    beforeEach(function (done) {
        TestCases.beforeEach(done);
    });
    it("simple insert transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {country: "USA", code: "01"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data of countries>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].status).to.eql("pending");
                expect(data.result[0].user.username).to.eql("guest");
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.delete).to.have.property("_id");
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
//                console.log("data in pl.txs after commit " + JSON.stringify(data));
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("simple insert transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        { country: "USA", code: "01"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
//                console.log("data >>>>>>>>>>>>>>>>.transaction insert" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.delete).to.have.property("_id");
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data >>>>>>>>>>>>>>>>.after rollback" + JSON.stringify(data));
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("simple delete transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var deleteUpdates = [
                    {$collection: "countries", $delete: [
                        {_id: 1}
                    ]}
                ];
                return db.update(deleteUpdates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.insert.country).to.eql("USA");
                expect(data.result[0].tx.insert.code).to.eql("01");
                return db.commitTransaction();
            }).then(
            function (data) {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("simple delete transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var deleteUpdates = [
                    {$collection: "countries", $delete: [
                        {_id: 1}
                    ]}
                ];
                return db.update(deleteUpdates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "countries"});
            }).then(
            function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.insert.country).to.eql("USA");
                expect(data.result[0].tx.insert.code).to.eql("01");
                return db.rollbackTransaction();
            }).then(
            function (data) {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "pl.txs", $filter: {"_id": txid}});
            }).then(
            function (data) {
//                console.log("data of pl.txs after rollback" + JSON.stringify(data));
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("simple update transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01"}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"country": "India"}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data of countries after update>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(data.result[0]._id);
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
//                console.log("data of pl.txs after update>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("simple update transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01"}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"country": "India"}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data of countries after >>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(data.result[0]._id);
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
//                console.log("data of p.tx after >>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("countries data after rollback>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("update with inc operator transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000}

                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"country": "India"}, $inc: {score: 10}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.inc).to.have.length(1);
                expect(tx.inc[0].key).to.eql("score");
                expect(tx.inc[0].value).to.eql(-10);
            }).then(
            function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return  db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].__txs__).to.eql({});
            }).then(
            function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("update with inc operator transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000}

                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"country": "India"}, $inc: {score: 10}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.inc).to.have.length(1);
                expect(tx.inc[0].key).to.eql("score");
                expect(tx.inc[0].value).to.eql(-10);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].score).to.eql(1000);
                expect(data.result[0].__txs__).to.eql({});
            }).then(
            function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("insert operation with object type field transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: {lineno: 12}}}, $inc: {score: 10}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.set).to.have.length(2);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");
                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(-12);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-10);
            }).then(
            function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return  db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).eql("India");
                expect(data.result[0].score).eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].__txid__).to.eql(undefined);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("insert operation with object type field transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: {lineno: 12}}}, $inc: {score: 10}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.set).to.have.length(2);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");
                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(-12);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-10);
            }).then(
            function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return   db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                expect(data.result[0].score).to.eql(1000);
                expect(data.result[0].address.city).to.eql("hisar");
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].address.lineno).to.eql(1);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"_id": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });


    it("update voucherlineitem in voucher", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        var recordId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {"$collection": {"collection": "voucher", "fields": [
                        {"field": "voucherlineitems", "type": "object", "multiple": true, "fields": [
                            {"field": "amount", "type": "number"},
                            {"field": "account", "type": "string"}
                        ]}
                    ]}, $insert: [
                        {voucherno: "001", voucherlineitems: [
                            {account: "sbi", amount: 100}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                return db.query({$collection: "voucher"});
            }).then(function (result) {
                recordId = result.result[0]._id;
                var vli_id = result.result[0].voucherlineitems[0]._id;
                var update = [
                    {$collection: {"collection": "voucher", "fields": [
                        {"field": "voucherlineitems", "type": "object", "multiple": true, "fields": [
                            {"field": "amount", "type": "number"},
                            {"field": "account", "type": "string"}
                        ]}
                    ]}, $update: [
                        {_id: recordId, $set: {voucherlineitems: {
                            $update: [
                                {_id: vli_id, $set: {"type": "credit"}},
                            ]
                        }
                        }
                        }
                    ], $modules: {"HistoryLogs": 0}
                    }
                ]
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "voucher"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].voucherno).to.eql("001");
                expect(data.result[0].voucherlineitems).to.have.length(1);
                expect(data.result[0].voucherlineitems[0].amount).to.eql(100);
                expect(data.result[0].voucherlineitems[0].account).to.eql("sbi");
                expect(data.result[0].voucherlineitems[0].type).to.eql("credit");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
//                console.log("data in pl.txs>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("voucher");
                expect(data.result[0].tx.update._id).to.eql(recordId);
                return  db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "voucher"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].voucherno).to.eql("001");

                expect(data.result[0].voucherlineitems).to.have.length(1);

                expect(data.result[0].voucherlineitems[0].amount).to.eql(100);
                expect(data.result[0].voucherlineitems[0].account).to.eql("sbi");
                expect(data.result[0].voucherlineitems[0].type).to.eql(undefined);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"_id": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });


    it("insert operation with object multiple type field  multiple operations in same transaction with transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {"$collection": {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                            {state: "jammu", _id: "jammu", rank: 1},
                            {state: "delhi", _id: "delhi", rank: 2},
                            {state: "himachal", _id: "himachal", rank: 3},
                            {state: "punjab", _id: "punjab", rank: 4}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                            {"state": "bihar", _id: "bihar", rank: 6}
                        ],
                            $update: [
                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                            ],
                            $delete: [
                                {_id: "punjab"}
                            ]
                        }
                        }, $inc: {
                            score: 10
                        }
                        }
                    ], $modules: {"HistoryLogs": 0}
                    }
                ]
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);

                expect(data.result[0].states[0].state).to.eql("bihar");
                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[3].state).to.eql("JK");

                expect(data.result[0].states[2].state).to.eql("HP");
                expect(data.result[0].states[4].state).to.eql("rajasthan");

                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[2].rank).to.eql(23);
                expect(data.result[0].states[4].rank).to.eql(5);
                expect(data.result[0].states[0].rank).to.eql(6);

                var tx = data.result[0].__txs__[txid].tx;
                expect(tx.set).to.have.length(2);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");

                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(-12);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-10);


//                console.log("***********array****************" + JSON.stringify(tx.array.length));
                expect(tx.array).to.have.length(5);

//                console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                expect(tx.array[0].field).to.eql("states");
                expect(tx.array[0].type).to.eql("update");
                expect(tx.array[0]._id).to.eql("jammu");
                expect(tx.array[0].inc).to.have.length(1);
                expect(tx.array[0].inc[0].key).to.eql("rank");
                expect(tx.array[0].inc[0].value).to.eql(-10);
                expect(tx.array[0].set).to.have.length(1);
                expect(tx.array[0].set[0].key).to.eql("state");
                expect(tx.array[0].set[0].value).to.eql("jammu");
//                console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                expect(tx.array[1].field).to.eql("states");
                expect(tx.array[1].type).to.eql("update");
                expect(tx.array[1]._id).to.eql("himachal");
                expect(tx.array[1].inc).to.have.length(1);
                expect(tx.array[1].inc[0].key).to.eql("rank");
                expect(tx.array[1].inc[0].value).to.eql(-20);
                expect(tx.array[1].set).to.have.length(1);
                expect(tx.array[1].set[0].key).to.eql("state");
                expect(tx.array[1].set[0].value).to.eql("himachal");
//                console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                expect(tx.array[2].field).to.eql("states");
                expect(tx.array[2].type).to.eql("insert");
                expect(tx.array[2]._id).to.eql("punjab");
                expect(tx.array[2].value.state).to.eql("punjab");
                expect(tx.array[2].value._id).to.eql("punjab");
                expect(tx.array[2].value.rank).to.eql(4);

//                console.log("***********array3****************" + JSON.stringify(tx.array[3]));
                expect(tx.array[3].field).to.eql("states");
                expect(tx.array[3].type).to.eql("delete");
                expect(tx.array[3]._id).to.eql("rajasthan");

//                console.log("***********array4****************" + JSON.stringify(tx.array[4]));
                expect(tx.array[4].field).to.eql("states");
                expect(tx.array[4].type).to.eql("delete");
                expect(tx.array[4]._id).to.eql("bihar");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
//                console.log("data in pl.txs>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                var newUpdate = [
                    {$collection: {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"country": "New India", address: {$set: {city: "New Hisar"}, $inc: { lineno: -20}}, states: {$insert: [
                            {"state": "kerela", _id: "kerela", rank: 7}
                        ],
                            $update: [
                                {_id: "rajasthan", $set: {"state": "RJ"}, $inc: {rank: 100}},
                                {_id: "himachal", $set: {"state": "NEW HP"}, $inc: {rank: 50}}
                            ],
                            $delete: [
                                {_id: "bihar"}
                            ]
                        }
                        }, $inc: {
                            score: 10
                        }
                        }
                    ], $modules: {"HistoryLogs": 0}
                    }
                ];
                return db.update(newUpdate);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("New India");
                expect(data.result[0].score).to.eql(1020);
                expect(data.result[0].address.city).to.eql("New Hisar");
                expect(data.result[0].address.lineno).to.eql(-7);
                expect(data.result[0].states).to.have.length(5);

                expect(data.result[0].states[2].state).to.eql("JK");
                expect(data.result[0].states[0].state).to.eql("delhi");
                expect(data.result[0].states[1].state).to.eql("NEW HP");
                expect(data.result[0].states[4].state).to.eql("RJ");
                expect(data.result[0].states[3].state).to.eql("kerela");
                expect(data.result[0].states[2].rank).to.eql(11);
                expect(data.result[0].states[0].rank).to.eql(2);
                expect(data.result[0].states[1].rank).to.eql(73);
                expect(data.result[0].states[4].rank).to.eql(105);
                expect(data.result[0].states[3].rank).to.eql(7);

                var tx = data.result[0].__txs__[txid].tx;
//                console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                expect(tx.set).to.have.length(2);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");

                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(8);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-20);


//                console.log("***********array****************" + JSON.stringify(tx.array.length));
                expect(tx.array).to.have.length(6);

//                console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                expect(tx.array[0].field).to.eql("states");
                expect(tx.array[0].type).to.eql("update");
                expect(tx.array[0]._id).to.eql("jammu");
                expect(tx.array[0].inc).to.have.length(1);
                expect(tx.array[0].inc[0].key).to.eql("rank");
                expect(tx.array[0].inc[0].value).to.eql(-10);
                expect(tx.array[0].set).to.have.length(1);
                expect(tx.array[0].set[0].key).to.eql("state");
                expect(tx.array[0].set[0].value).to.eql("jammu");
//                console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                expect(tx.array[1].field).to.eql("states");
                expect(tx.array[1].type).to.eql("update");
                expect(tx.array[1]._id).to.eql("himachal");
                expect(tx.array[1].inc).to.have.length(1);
                expect(tx.array[1].inc[0].key).to.eql("rank");
                expect(tx.array[1].inc[0].value).to.eql(-70);
                expect(tx.array[1].set).to.have.length(1);
                expect(tx.array[1].set[0].key).to.eql("state");
                expect(tx.array[1].set[0].value).to.eql("himachal");
//                console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                expect(tx.array[2].field).to.eql("states");
                expect(tx.array[2].type).to.eql("insert");
                expect(tx.array[2]._id).to.eql("punjab");
                expect(tx.array[2].value.state).to.eql("punjab");
                expect(tx.array[2].value._id).to.eql("punjab");
                expect(tx.array[2].value.rank).to.eql(4);

//                console.log("***********array3****************" + JSON.stringify(tx.array[3]));
                expect(tx.array[3].field).to.eql("states");
                expect(tx.array[3].type).to.eql("delete");
                expect(tx.array[3]._id).to.eql("rajasthan");

//                console.log("***********array4****************" + JSON.stringify(tx.array[4]));
                expect(tx.array[4].field).to.eql("states");
                expect(tx.array[4].type).to.eql("delete");
                expect(tx.array[4]._id).to.eql("bihar");
//                console.log("***********array5****************" + JSON.stringify(tx.array[5]));
                expect(tx.array[5].field).to.eql("states");
                expect(tx.array[5].type).to.eql("delete");
                expect(tx.array[5]._id).to.eql("kerela");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
//                console.log("data in pl.txs after second time update on same record>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return  db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("New India");
                expect(data.result[0].score).to.eql(1020);
                expect(data.result[0].address.city).to.eql("New Hisar");
                expect(data.result[0].address.lineno).to.eql(-7);
                expect(data.result[0].states).to.have.length(5);

                expect(data.result[0].states[2].state).to.eql("JK");
                expect(data.result[0].states[0].state).to.eql("delhi");
                expect(data.result[0].states[1].state).to.eql("NEW HP");
                expect(data.result[0].states[4].state).to.eql("RJ");
                expect(data.result[0].states[3].state).to.eql("kerela");
                expect(data.result[0].states[2].rank).to.eql(11);
                expect(data.result[0].states[0].rank).to.eql(2);
                expect(data.result[0].states[1].rank).to.eql(73);
                expect(data.result[0].states[4].rank).to.eql(105);
                expect(data.result[0].states[3].rank).to.eql(7);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"_id": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("insert operation with object multiple type field  multiple operations in same transaction with transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {"$collection": {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                            {state: "jammu", _id: "jammu", rank: 1},
                            {state: "delhi", _id: "delhi", rank: 2},
                            {state: "himachal", _id: "himachal", rank: 3},
                            {state: "punjab", _id: "punjab", rank: 4}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                            {"state": "bihar", _id: "bihar", rank: 6}
                        ],
                            $update: [
                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                            ],
                            $delete: [
                                {_id: "punjab"}
                            ]
                        }
                        }, $inc: {
                            score: 10
                        }
                        }
                    ], $modules: {"HistoryLogs": 0}
                    }
                ]
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);

                expect(data.result[0].states[0].state).to.eql("bihar");
                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[3].state).to.eql("JK");

                expect(data.result[0].states[2].state).to.eql("HP");
                expect(data.result[0].states[4].state).to.eql("rajasthan");

                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[2].rank).to.eql(23);
                expect(data.result[0].states[4].rank).to.eql(5);
                expect(data.result[0].states[0].rank).to.eql(6);

                var tx = data.result[0].__txs__[txid].tx;
//                console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                expect(tx.set).to.have.length(2);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");

                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(-12);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-10);


//                console.log("***********array****************" + JSON.stringify(tx.array.length));
                expect(tx.array).to.have.length(5);

//                console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                expect(tx.array[0].field).to.eql("states");
                expect(tx.array[0].type).to.eql("update");
                expect(tx.array[0]._id).to.eql("jammu");
                expect(tx.array[0].inc).to.have.length(1);
                expect(tx.array[0].inc[0].key).to.eql("rank");
                expect(tx.array[0].inc[0].value).to.eql(-10);
                expect(tx.array[0].set).to.have.length(1);
                expect(tx.array[0].set[0].key).to.eql("state");
                expect(tx.array[0].set[0].value).to.eql("jammu");
//                console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                expect(tx.array[1].field).to.eql("states");
                expect(tx.array[1].type).to.eql("update");
                expect(tx.array[1]._id).to.eql("himachal");
                expect(tx.array[1].inc).to.have.length(1);
                expect(tx.array[1].inc[0].key).to.eql("rank");
                expect(tx.array[1].inc[0].value).to.eql(-20);
                expect(tx.array[1].set).to.have.length(1);
                expect(tx.array[1].set[0].key).to.eql("state");
                expect(tx.array[1].set[0].value).to.eql("himachal");
//                console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                expect(tx.array[2].field).to.eql("states");
                expect(tx.array[2].type).to.eql("insert");
                expect(tx.array[2]._id).to.eql("punjab");
                expect(tx.array[2].value.state).to.eql("punjab");
                expect(tx.array[2].value._id).to.eql("punjab");
                expect(tx.array[2].value.rank).to.eql(4);

//                console.log("***********array3****************" + JSON.stringify(tx.array[3]));
                expect(tx.array[3].field).to.eql("states");
                expect(tx.array[3].type).to.eql("delete");
                expect(tx.array[3]._id).to.eql("rajasthan");

//                console.log("***********array4****************" + JSON.stringify(tx.array[4]));
                expect(tx.array[4].field).to.eql("states");
                expect(tx.array[4].type).to.eql("delete");
                expect(tx.array[4]._id).to.eql("bihar");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
//                console.log("data of transaxction>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                var newUpdate = [
                    {$collection: {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"country": "New India", address: {$set: {city: "New Hisar"}, $inc: { lineno: -20}}, states: {$insert: [
                            {"state": "kerela", _id: "kerela", rank: 7}
                        ],
                            $update: [
                                {_id: "rajasthan", $set: {"state": "RJ"}, $inc: {rank: 100}},
                                {_id: "himachal", $set: {"state": "NEW HP"}, $inc: {rank: 50}}
                            ],
                            $delete: [
                                {_id: "bihar"}
                            ]
                        }
                        }, $inc: {
                            score: 10
                        }
                        }
                    ], $modules: {"HistoryLogs": 0}
                    }
                ];
                return db.update(newUpdate);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("New India");
                expect(data.result[0].score).to.eql(1020);
                expect(data.result[0].address.city).to.eql("New Hisar");
                expect(data.result[0].address.lineno).to.eql(-7);
                expect(data.result[0].states).to.have.length(5);

                expect(data.result[0].states[2].state).to.eql("JK");
                expect(data.result[0].states[0].state).to.eql("delhi");
                expect(data.result[0].states[1].state).to.eql("NEW HP");
                expect(data.result[0].states[4].state).to.eql("RJ");
                expect(data.result[0].states[3].state).to.eql("kerela");
                expect(data.result[0].states[2].rank).to.eql(11);
                expect(data.result[0].states[0].rank).to.eql(2);
                expect(data.result[0].states[1].rank).to.eql(73);
                expect(data.result[0].states[4].rank).to.eql(105);
                expect(data.result[0].states[3].rank).to.eql(7);

                var tx = data.result[0].__txs__[txid].tx;
//                console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                expect(tx.set).to.have.length(2);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");

                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(8);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-20);


//                console.log("***********array****************" + JSON.stringify(tx.array.length));
                expect(tx.array).to.have.length(6);

//                console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                expect(tx.array[0].field).to.eql("states");
                expect(tx.array[0].type).to.eql("update");
                expect(tx.array[0]._id).to.eql("jammu");
                expect(tx.array[0].inc).to.have.length(1);
                expect(tx.array[0].inc[0].key).to.eql("rank");
                expect(tx.array[0].inc[0].value).to.eql(-10);
                expect(tx.array[0].set).to.have.length(1);
                expect(tx.array[0].set[0].key).to.eql("state");
                expect(tx.array[0].set[0].value).to.eql("jammu");
//                console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                expect(tx.array[1].field).to.eql("states");
                expect(tx.array[1].type).to.eql("update");
                expect(tx.array[1]._id).to.eql("himachal");
                expect(tx.array[1].inc).to.have.length(1);
                expect(tx.array[1].inc[0].key).to.eql("rank");
                expect(tx.array[1].inc[0].value).to.eql(-70);
                expect(tx.array[1].set).to.have.length(1);
                expect(tx.array[1].set[0].key).to.eql("state");
                expect(tx.array[1].set[0].value).to.eql("himachal");
//                console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                expect(tx.array[2].field).to.eql("states");
                expect(tx.array[2].type).to.eql("insert");
                expect(tx.array[2]._id).to.eql("punjab");
                expect(tx.array[2].value.state).to.eql("punjab");
                expect(tx.array[2].value._id).to.eql("punjab");
                expect(tx.array[2].value.rank).to.eql(4);

//                console.log("***********array3****************" + JSON.stringify(tx.array[3]));
                expect(tx.array[3].field).to.eql("states");
                expect(tx.array[3].type).to.eql("delete");
                expect(tx.array[3]._id).to.eql("rajasthan");

//                console.log("***********array4****************" + JSON.stringify(tx.array[4]));
                expect(tx.array[4].field).to.eql("states");
                expect(tx.array[4].type).to.eql("delete");
                expect(tx.array[4]._id).to.eql("bihar");
//                console.log("***********array5****************" + JSON.stringify(tx.array[5]));
                expect(tx.array[5].field).to.eql("states");
                expect(tx.array[5].type).to.eql("delete");
                expect(tx.array[5]._id).to.eql("kerela");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
//                console.log("data in pl.txs after second time update on same record>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("Data after rollback >>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                expect(data.result[0].score).to.eql(1000);
                expect(data.result[0].address.city).to.eql("hisar");
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].address.lineno).to.eql(1);
                expect(data.result[0].address.lineno).to.eql(1);
                expect(data.result[0].states).to.have.length(4);
                expect(data.result[0].states[2].state).to.eql("jammu");
                expect(data.result[0].states[2].rank).to.eql(1);
                expect(data.result[0].states[0].state).to.eql("delhi");
                expect(data.result[0].states[0].rank).to.eql(2);
                expect(data.result[0].states[1].state).to.eql("himachal");
                expect(data.result[0].states[1].rank).to.eql(3);
                expect(data.result[0].states[3].state).to.eql("punjab");
                expect(data.result[0].states[3].rank).to.eql(4);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("update operation on array with sort and then rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {"$collection": {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, sort: "rank", "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]}
                    ]}, $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                            {state: "jammu", _id: "jammu", rank: 1},
                            {state: "delhi", _id: "delhi", rank: 2},
                            {state: "himachal", _id: "himachal", rank: 3},
                            {state: "punjab", _id: "punjab", rank: 4}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, sort: "rank", "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                            {"state": "bihar", _id: "bihar", rank: 6}
                        ],
                            $update: [
                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                            ],
                            $delete: [
                                {_id: "punjab"}
                            ]
                        }
                        }, $inc: {
                            score: 10
                        }
                        }
                    ], $modules: {"HistoryLogs": 0}
                    }
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);

                expect(data.result[0].states[3].state).to.eql("JK");
                expect(data.result[0].states[0].state).to.eql("delhi");
                expect(data.result[0].states[4].state).to.eql("HP");
                expect(data.result[0].states[1].state).to.eql("rajasthan");
                expect(data.result[0].states[2].state).to.eql("bihar");
                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[0].rank).to.eql(2);
                expect(data.result[0].states[4].rank).to.eql(23);
                expect(data.result[0].states[1].rank).to.eql(5);
                expect(data.result[0].states[2].rank).to.eql(6);

                var tx = data.result[0].__txs__[txid].tx;
//                console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                expect(tx.set).to.have.length(2);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");

                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(-12);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-10);


//                console.log("***********array****************" + JSON.stringify(tx.array.length));
                expect(tx.array).to.have.length(5);

//                console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                expect(tx.array[0].field).to.eql("states");
                expect(tx.array[0].type).to.eql("update");
                expect(tx.array[0]._id).to.eql("jammu");
                expect(tx.array[0].inc).to.have.length(1);
                expect(tx.array[0].inc[0].key).to.eql("rank");
                expect(tx.array[0].inc[0].value).to.eql(-10);
                expect(tx.array[0].set).to.have.length(1);
                expect(tx.array[0].set[0].key).to.eql("state");
                expect(tx.array[0].set[0].value).to.eql("jammu");
//                console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                expect(tx.array[1].field).to.eql("states");
                expect(tx.array[1].type).to.eql("update");
                expect(tx.array[1]._id).to.eql("himachal");
                expect(tx.array[1].inc).to.have.length(1);
                expect(tx.array[1].inc[0].key).to.eql("rank");
                expect(tx.array[1].inc[0].value).to.eql(-20);
                expect(tx.array[1].set).to.have.length(1);
                expect(tx.array[1].set[0].key).to.eql("state");
                expect(tx.array[1].set[0].value).to.eql("himachal");
//                console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                expect(tx.array[2].field).to.eql("states");
                expect(tx.array[2].type).to.eql("insert");
                expect(tx.array[2]._id).to.eql("punjab");
                expect(tx.array[2].value.state).to.eql("punjab");
                expect(tx.array[2].value._id).to.eql("punjab");
                expect(tx.array[2].value.rank).to.eql(4);
//                console.log("***********array3****************" + JSON.stringify(tx.array[3]));

                expect(tx.array[3].field).to.eql("states");
                expect(tx.array[3].type).to.eql("delete");
                expect(tx.array[3]._id).to.eql("rajasthan");


                expect(tx.array[4].field).to.eql("states");
                expect(tx.array[4].type).to.eql("delete");
                expect(tx.array[4]._id).to.eql("bihar");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
//                console.log("data of transaxction>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                expect(data.result[0].score).to.eql(1000);
                expect(data.result[0].address.city).to.eql("hisar");
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].address.lineno).to.eql(1);
                expect(data.result[0].address.lineno).to.eql(1);
                expect(data.result[0].states).to.have.length(4);
                expect(data.result[0].states[0].state).to.eql("jammu");
                expect(data.result[0].states[0].rank).to.eql(1);
                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[2].state).to.eql("himachal");
                expect(data.result[0].states[2].rank).to.eql(3);
                expect(data.result[0].states[3].state).to.eql("punjab");
                expect(data.result[0].states[3].rank).to.eql(4);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("insert operation with object multiple type field transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {"$collection": {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                            {state: "jammu", _id: "jammu", rank: 1},
                            {state: "delhi", _id: "delhi", rank: 2},
                            {state: "himachal", _id: "himachal", rank: 3},
                            {state: "punjab", _id: "punjab", rank: 4}
                        ], languages: [
                            {language: "Hindi"},
                            {language: "English"},
                            {_id: "urdu", language: "Urdu"},
                            {language: "German"}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                            {"state": "bihar", _id: "bihar", rank: 6}
                        ],
                            $update: [
                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                            ],
                            $delete: [
                                {_id: "punjab"}
                            ]
                        }, languages: {$insert: [
                            {language: "Haryanvi"}
                        ], $delete: [
                            {$query: {language: "German"}}
                        ], $update: [
                            {_id: "urdu", $set: {language: "URDU", score: 100}}
                        ]
                        }
                        }, $inc: {
                            score: 10
                        }
                        }
                    ], $modules: {"HistoryLogs": 0}
                    }
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);

                expect(data.result[0].states[3].state).to.eql("JK");
                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[2].state).to.eql("HP");
                expect(data.result[0].states[4].state).to.eql("rajasthan");
                expect(data.result[0].states[0].state).to.eql("bihar");
                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[2].rank).to.eql(23);
                expect(data.result[0].states[4].rank).to.eql(5);
                expect(data.result[0].states[0].rank).to.eql(6);

                var tx = data.result[0].__txs__[txid].tx;
//                console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                expect(tx.set).to.have.length(2);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");

                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(-12);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-10);


//                console.log("***********array****************" + JSON.stringify(tx.array.length));
                expect(tx.array).to.have.length(8);

//                console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                expect(tx.array[0].field).to.eql("states");
                expect(tx.array[0].type).to.eql("update");
                expect(tx.array[0]._id).to.eql("jammu");
                expect(tx.array[0].inc).to.have.length(1);
                expect(tx.array[0].inc[0].key).to.eql("rank");
                expect(tx.array[0].inc[0].value).to.eql(-10);
                expect(tx.array[0].set).to.have.length(1);
                expect(tx.array[0].set[0].key).to.eql("state");
                expect(tx.array[0].set[0].value).to.eql("jammu");
//                console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                expect(tx.array[1].field).to.eql("states");
                expect(tx.array[1].type).to.eql("update");
                expect(tx.array[1]._id).to.eql("himachal");
                expect(tx.array[1].inc).to.have.length(1);
                expect(tx.array[1].inc[0].key).to.eql("rank");
                expect(tx.array[1].inc[0].value).to.eql(-20);
                expect(tx.array[1].set).to.have.length(1);
                expect(tx.array[1].set[0].key).to.eql("state");
                expect(tx.array[1].set[0].value).to.eql("himachal");
//                console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                expect(tx.array[2].field).to.eql("states");
                expect(tx.array[2].type).to.eql("insert");
                expect(tx.array[2]._id).to.eql("punjab");
                expect(tx.array[2].value.state).to.eql("punjab");
                expect(tx.array[2].value._id).to.eql("punjab");
                expect(tx.array[2].value.rank).to.eql(4);
//                console.log("***********array3****************" + JSON.stringify(tx.array[3]));

                expect(tx.array[3].field).to.eql("states");
                expect(tx.array[3].type).to.eql("delete");
                expect(tx.array[3]._id).to.eql("rajasthan");

//                console.log("***********array4****************" + JSON.stringify(tx.array[4]));
                expect(tx.array[4].field).to.eql("states");
                expect(tx.array[4].type).to.eql("delete");
                expect(tx.array[4]._id).to.eql("bihar");

//                console.log("***********array5****************" + JSON.stringify(tx.array[5]));
                expect(tx.array[5].field).to.eql("languages");
                expect(tx.array[5].type).to.eql("update");
                expect(tx.array[5]._id).to.eql("urdu");
                expect(tx.array[5].set).to.have.length(1);
                expect(tx.array[5].set[0].key).to.eql("language");
                expect(tx.array[5].set[0].value).to.eql("Urdu");
                expect(tx.array[5].unset).to.have.length(1);
                expect(tx.array[5].unset[0].key).to.eql("score");
                expect(tx.array[5].unset[0].value).to.eql(1);

//                console.log("tx>>>" + JSON.stringify(tx.array[6]))
                expect(tx.array[6].field).to.eql("languages");
                expect(tx.array[6].type).to.eql("insert");
                expect(tx.array[6].value.language).to.eql("German");

                expect(tx.array[7].field).to.eql("languages");
                expect(tx.array[7].type).to.eql("delete");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
//                console.log("data of transaxction>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("Data after comamit >>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);
                expect(data.result[0].states[3].state).to.eql("JK");
                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[2].state).to.eql("HP");
                expect(data.result[0].states[4].state).to.eql("rajasthan");
                expect(data.result[0].states[0].state).to.eql("bihar");
                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[2].rank).to.eql(23);
                expect(data.result[0].states[4].rank).to.eql(5);
                expect(data.result[0].states[0].rank).to.eql(6);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })

    })
    it("insert operation with object multiple type field transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {"$collection": {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                            {state: "jammu", _id: "jammu", rank: 1},
                            {state: "delhi", _id: "delhi", rank: 2},
                            {state: "himachal", _id: "himachal", rank: 3},
                            {state: "punjab", _id: "punjab", rank: 4}
                        ], languages: [
                            {language: "Hindi"},
                            {language: "English"},
                            {_id: "urdu", language: "Urdu"},
                            {language: "German"}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                            {"state": "bihar", _id: "bihar", rank: 6}
                        ],
                            $update: [
                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                            ],
                            $delete: [
                                {_id: "punjab"}
                            ]
                        }, languages: {$insert: [
                            {language: "Haryanvi"}
                        ], $delete: [
                            {$query: {language: "German"}}
                        ], $update: [
                            {_id: "urdu", $set: {language: "URDU", score: 100}}
                        ]
                        }
                        }, $inc: {
                            score: 10
                        }
                        }
                    ], $modules: {"HistoryLogs": 0}
                    }
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);

                expect(data.result[0].states[3].state).to.eql("JK");
                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[2].state).to.eql("HP");
                expect(data.result[0].states[4].state).to.eql("rajasthan");
                expect(data.result[0].states[0].state).to.eql("bihar");
                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[2].rank).to.eql(23);
                expect(data.result[0].states[4].rank).to.eql(5);
                expect(data.result[0].states[0].rank).to.eql(6);

                var tx = data.result[0].__txs__[txid].tx;
//                console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                expect(tx.set).to.have.length(2);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");

                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(-12);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-10);


//                console.log("***********array****************" + JSON.stringify(tx.array.length));
                expect(tx.array).to.have.length(8);

//                console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                expect(tx.array[0].field).to.eql("states");
                expect(tx.array[0].type).to.eql("update");
                expect(tx.array[0]._id).to.eql("jammu");
                expect(tx.array[0].inc).to.have.length(1);
                expect(tx.array[0].inc[0].key).to.eql("rank");
                expect(tx.array[0].inc[0].value).to.eql(-10);
                expect(tx.array[0].set).to.have.length(1);
                expect(tx.array[0].set[0].key).to.eql("state");
                expect(tx.array[0].set[0].value).to.eql("jammu");
//                console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                expect(tx.array[1].field).to.eql("states");
                expect(tx.array[1].type).to.eql("update");
                expect(tx.array[1]._id).to.eql("himachal");
                expect(tx.array[1].inc).to.have.length(1);
                expect(tx.array[1].inc[0].key).to.eql("rank");
                expect(tx.array[1].inc[0].value).to.eql(-20);
                expect(tx.array[1].set).to.have.length(1);
                expect(tx.array[1].set[0].key).to.eql("state");
                expect(tx.array[1].set[0].value).to.eql("himachal");
//                console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                expect(tx.array[2].field).to.eql("states");
                expect(tx.array[2].type).to.eql("insert");
                expect(tx.array[2]._id).to.eql("punjab");
                expect(tx.array[2].value.state).to.eql("punjab");
                expect(tx.array[2].value._id).to.eql("punjab");
                expect(tx.array[2].value.rank).to.eql(4);
//                console.log("***********array3****************" + JSON.stringify(tx.array[3]));

                expect(tx.array[3].field).to.eql("states");
                expect(tx.array[3].type).to.eql("delete");
                expect(tx.array[3]._id).to.eql("rajasthan");

//                console.log("***********array4****************" + JSON.stringify(tx.array[4]));
                expect(tx.array[4].field).to.eql("states");
                expect(tx.array[4].type).to.eql("delete");
                expect(tx.array[4]._id).to.eql("bihar");

//                console.log("***********array5****************" + JSON.stringify(tx.array[5]));
                expect(tx.array[5].field).to.eql("languages");
                expect(tx.array[5].type).to.eql("update");
                expect(tx.array[5]._id).to.eql("urdu");
                expect(tx.array[5].set).to.have.length(1);
                expect(tx.array[5].set[0].key).to.eql("language");
                expect(tx.array[5].set[0].value).to.eql("Urdu");
                expect(tx.array[5].unset).to.have.length(1);
                expect(tx.array[5].unset[0].key).to.eql("score");
                expect(tx.array[5].unset[0].value).to.eql(1);

//                console.log("tx>>>" + JSON.stringify(tx.array[6]))
                expect(tx.array[6].field).to.eql("languages");
                expect(tx.array[6].type).to.eql("insert");
                expect(tx.array[6].value.language).to.eql("German");

                expect(tx.array[7].field).to.eql("languages");
                expect(tx.array[7].type).to.eql("delete");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("Data after rollback>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                expect(data.result[0].score).to.eql(1000);
                expect(data.result[0].address.city).to.eql("hisar");
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].address.lineno).to.eql(1);
                expect(data.result[0].address.lineno).to.eql(1);
                expect(data.result[0].states).to.have.length(4);
                expect(data.result[0].states[2].state).to.eql("jammu");
                expect(data.result[0].states[2].rank).to.eql(1);
                expect(data.result[0].states[0].state).to.eql("delhi");
                expect(data.result[0].states[0].rank).to.eql(2);
                expect(data.result[0].states[1].state).to.eql("himachal");
                expect(data.result[0].states[1].rank).to.eql(3);
                expect(data.result[0].states[3].state).to.eql("punjab");
                expect(data.result[0].states[3].rank).to.eql(4);

                expect(data.result[0].languages).to.have.length(4);
                expect(data.result[0].languages[1].language).to.eql("Hindi");
                expect(data.result[0].languages[2].language).to.eql("English");
                expect(data.result[0].languages[0].language).to.eql("Urdu");
                expect(data.result[0].languages[3].language).to.eql("German");
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })

    })
    it("insert operation with nested array field transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {"$collection": {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"},
                            {"field": "districts", "type": "object", multiple: true, fields: [
                                {field: "district", type: "string"},
                                {field: "code", type: "number"}
                            ]}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]},
                        {"field": "sports", "type": "object", "multiple": true, "fields": [
                            {"field": "sport", "type": "string"},
                            {"field": "score", "type": "number"},
                            {"field": "club", "type": "string"}
                        ]},
                        {"field": "profile", "type": "object", "fields": [
                            {"field": "username", "type": "string"},
                            {"field": "tweets", "type": "object", multiple: true, fields: [
                                {field: "tweet", type: "string"}
                            ]}
                        ]}
                    ]}, $insert: [
                        {_id: 1, country: "india", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                            {state: "jammu", _id: "jammu", rank: 1, districts: [
                                {district: "katra", code: 11},
                                {district: "pahalgaon", code: 22}
                            ]},
                            {state: "delhi", _id: "delhi", rank: 2, districts: [
                                {district: "north", code: 111},
                                {district: "south", code: 222}
                            ]},
                            {state: "himachal", _id: "himachal", rank: 3, districts: [
                                {district: "kullu", code: 1111},
                                {district: "manali", code: 2222}
                            ]},
                            {state: "punjab", _id: "punjab", rank: 4, districts: [
                                {district: "amritsar", code: 11111},
                                {district: "patiala", code: 22222}
                            ]}
                        ], languages: [
                            {language: "Hindi"},
                            {language: "English"},
                            {_id: "urdu", language: "Urdu"},
                            {language: "German"}
                        ], sports: [
                            {sport: "cricket", "score": 100, club: "Kings X1 punjab"},
                            {sport: "cricket", "score": 95, club: "super kings"},
                            {sport: "cricket", "score": 85, club: "royals"}
                        ], profile: {
                            username: "maxwell", tweets: [
                                {tweet: "super player"},
                                {"tweet": "awesome player"},
                                {"tweet": "Man of the series"}
                            ]
                        }}
                    ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"},
                            {"field": "districts", "type": "object", multiple: true, fields: [
                                {field: "district", type: "string"},
                                {field: "code", type: "number"}
                            ]}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]},
                        {"field": "sports", "type": "object", "multiple": true, "fields": [
                            {"field": "sport", "type": "string"},
                            {"field": "score", "type": "number"},
                            {"field": "club", "type": "string"}
                        ]},
                        {"field": "profile", "type": "object", "fields": [
                            {"field": "username", "type": "string"},
                            {"field": "tweets", "type": "object", multiple: true, fields: [
                                {field: "tweet", type: "string"}
                            ]}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                            {"state": "rajasthan", _id: "rajasthan", rank: 5, districts: [
                                {district: "jaipur", code: 4444}
                            ]},
                            {"state": "bihar", _id: "bihar", rank: 6, districts: [
                                {district: "patna", code: 5555}
                            ]}
                        ],
                            $update: [
                                {_id: "jammu", $set: {"state": "JK", districts: {$insert: [
                                    {"district": "ladakh", code: 6666}
                                ], $update: [
                                    {$query: {district: "katra"}, $set: {district: "newKatra"}}
                                ], $delete: [
                                    {$query: {district: "pahalgaon"}}
                                ]}}, $inc: {rank: 10}},
                                {_id: "himachal", $set: {"state": "HP", districts: {$insert: [
                                    {district: "shimla", code: 7777}
                                ], $update: [
                                    {$query: {district: "kullu"}, $set: {district: "newKullu"}}
                                ], $delete: [
                                    {$query: {district: "manali"}}
                                ]}}, $inc: {rank: 20}}
                            ],
                            $delete: [
                                {$query: {state: "punjab"}}
                            ]
                        }, languages: {$insert: [
                            {language: "Haryanvi"}
                        ], $delete: [
                            {$query: {language: "German"}}
                        ], $update: [
                            {_id: "urdu", $set: {language: "URDU", score: 100}}
                        ]
                        }, sports: {$insert: [
                            {sport: "football", score: 1000, club: "manchester"}
                        ], $update: [
                            {$query: {club: "royals"}, $set: {club: "ROYALS"}, $inc: {score: -5}}
                        ], $delete: [
                            {$query: {club: "super kings"}}
                        ]}, profile: {$set: {username: "kingmaxwell", tweets: {$insert: [
                            {tweet: "king of kings"}
                        ], $update: [
                            {$query: {tweet: "awesome player"}, $set: {tweet: "mast hai"}}
                        ], $delete: [
                            {$query: {tweet: "Man of the series"}}
                        ]}}}
                        }, $inc: {
                            score: 10
                        }
                        }
                    ], $modules: {"HistoryLogs": 0}
                    }
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);
//                console.log("data of states3>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data.result[0].states[3]));
                expect(data.result[0].states[3].state).to.eql("JK");
                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[3].districts).to.have.length(2);
                expect(data.result[0].states[3].districts[0].district).to.eql("newKatra");
                expect(data.result[0].states[3].districts[1].district).to.eql("ladakh");
                expect(data.result[0].states[3].districts[1].code).to.eql(6666);
//                console.log("data of states1>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data.result[0].states[1]));
                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[1].districts).to.have.length(2);
                expect(data.result[0].states[1].districts[0].district).to.eql("north");
                expect(data.result[0].states[1].districts[0].code).to.eql(111);
                expect(data.result[0].states[1].districts[1].district).to.eql("south");
                expect(data.result[0].states[1].districts[1].code).to.eql(222);
//                console.log("data of states2>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data.result[0].states[2]));
                expect(data.result[0].states[2].state).to.eql("HP");
                expect(data.result[0].states[2].rank).to.eql(23);
                expect(data.result[0].states[2].districts).to.have.length(2);
                expect(data.result[0].states[2].districts[0].district).to.eql("newKullu");
                expect(data.result[0].states[2].districts[1].district).to.eql("shimla");
                expect(data.result[0].states[2].districts[1].code).to.eql(7777);
//                console.log("data of states4>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data.result[0].states[4]));
                expect(data.result[0].states[4].state).to.eql("rajasthan");
                expect(data.result[0].states[4].rank).to.eql(5);
                expect(data.result[0].states[4].districts).to.have.length(1);
                expect(data.result[0].states[4].districts[0].district).to.eql("jaipur");
                expect(data.result[0].states[4].districts[0].code).to.eql(4444);

//                console.log("data of states0>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data.result[0].states[0]));
                expect(data.result[0].states[0].state).to.eql("bihar");
                expect(data.result[0].states[0].rank).to.eql(6);
                expect(data.result[0].states[0].districts).to.have.length(1);
                expect(data.result[0].states[0].districts[0].district).to.eql("patna");
                expect(data.result[0].states[0].districts[0].code).to.eql(5555);


                expect(data.result[0].sports).to.have.length(3);
                expect(data.result[0].sports[0].sport).to.eql("cricket");
                expect(data.result[0].sports[0].score).to.eql(100);
                expect(data.result[0].sports[0].club).to.eql("Kings X1 punjab");

                expect(data.result[0].sports[1].sport).to.eql("cricket");
                expect(data.result[0].sports[1].score).to.eql(80);
                expect(data.result[0].sports[1].club).to.eql("ROYALS");

                expect(data.result[0].sports[2].sport).to.eql("football");
                expect(data.result[0].sports[2].score).to.eql(1000);
                expect(data.result[0].sports[2].club).to.eql("manchester");

                expect(data.result[0].profile.username).to.eql("kingmaxwell");
                expect(data.result[0].profile.tweets).to.have.length(3);
                expect(data.result[0].profile.tweets[0].tweet).to.eql("super player");
                expect(data.result[0].profile.tweets[1].tweet).to.eql("mast hai");
                expect(data.result[0].profile.tweets[2].tweet).to.eql("king of kings");

                var tx = data.result[0].__txs__[txid].tx;
//                console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                expect(tx.set).to.have.length(3);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("india");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");
                expect(tx.set[2].key).to.eql("profile.username");
                expect(tx.set[2].value).to.eql("maxwell");

                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(-12);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-10);


//                console.log("***********array****************" + JSON.stringify(tx.array.length));
                expect(tx.array).to.have.length(14);

//                console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("Data after comamit >>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);

                expect(data.result[0].states[3].state).to.eql("JK");
                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[3].districts).to.have.length(2);
                expect(data.result[0].states[3].districts[0].district).to.eql("newKatra");
                expect(data.result[0].states[3].districts[1].district).to.eql("ladakh");
                expect(data.result[0].states[3].districts[1].code).to.eql(6666);

                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[1].districts).to.have.length(2);
                expect(data.result[0].states[1].districts[0].district).to.eql("north");
                expect(data.result[0].states[1].districts[0].code).to.eql(111);
                expect(data.result[0].states[1].districts[1].district).to.eql("south");
                expect(data.result[0].states[1].districts[1].code).to.eql(222);

                expect(data.result[0].states[2].state).to.eql("HP");
                expect(data.result[0].states[2].rank).to.eql(23);
                expect(data.result[0].states[2].districts).to.have.length(2);
                expect(data.result[0].states[2].districts[0].district).to.eql("newKullu");
                expect(data.result[0].states[2].districts[1].district).to.eql("shimla");
                expect(data.result[0].states[2].districts[1].code).to.eql(7777);

                expect(data.result[0].states[4].state).to.eql("rajasthan");
                expect(data.result[0].states[4].rank).to.eql(5);
                expect(data.result[0].states[4].districts).to.have.length(1);
                expect(data.result[0].states[4].districts[0].district).to.eql("jaipur");
                expect(data.result[0].states[4].districts[0].code).to.eql(4444);


                expect(data.result[0].states[0].state).to.eql("bihar");
                expect(data.result[0].states[0].rank).to.eql(6);
                expect(data.result[0].states[0].districts).to.have.length(1);
                expect(data.result[0].states[0].districts[0].district).to.eql("patna");
                expect(data.result[0].states[0].districts[0].code).to.eql(5555);


                expect(data.result[0].sports).to.have.length(3);
                expect(data.result[0].sports[0].sport).to.eql("cricket");
                expect(data.result[0].sports[0].score).to.eql(100);
                expect(data.result[0].sports[0].club).to.eql("Kings X1 punjab");

                expect(data.result[0].sports[1].sport).to.eql("cricket");
                expect(data.result[0].sports[1].score).to.eql(80);
                expect(data.result[0].sports[1].club).to.eql("ROYALS");

                expect(data.result[0].sports[2].sport).to.eql("football");
                expect(data.result[0].sports[2].score).to.eql(1000);
                expect(data.result[0].sports[2].club).to.eql("manchester");

                expect(data.result[0].profile.username).to.eql("kingmaxwell");
                expect(data.result[0].profile.tweets).to.have.length(3);
                expect(data.result[0].profile.tweets[0].tweet).to.eql("super player");
                expect(data.result[0].profile.tweets[1].tweet).to.eql("mast hai");
                expect(data.result[0].profile.tweets[2].tweet).to.eql("king of kings");
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })


    });
    it("insert operation with nested array field transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {"$collection": {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"},
                            {"field": "districts", "type": "object", multiple: true, fields: [
                                {field: "district", type: "string"},
                                {field: "code", type: "number"}
                            ]}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]},
                        {"field": "sports", "type": "object", "multiple": true, "fields": [
                            {"field": "sport", "type": "string"},
                            {"field": "score", "type": "number"},
                            {"field": "club", "type": "string"}
                        ]},
                        {"field": "profile", "type": "object", "fields": [
                            {"field": "username", "type": "string"},
                            {"field": "tweets", "type": "object", multiple: true, fields: [
                                {field: "tweet", type: "string"}
                            ]}
                        ]}
                    ]}, $insert: [
                        {_id: 1, country: "india", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                            {state: "jammu", _id: "jammu", rank: 1, districts: [
                                {district: "katra", code: 11},
                                {district: "pahalgaon", code: 22}
                            ]},
                            {state: "delhi", _id: "delhi", rank: 2, districts: [
                                {district: "north", code: 111},
                                {district: "south", code: 222}
                            ]},
                            {state: "himachal", _id: "himachal", rank: 3, districts: [
                                {district: "kullu", code: 1111},
                                {district: "manali", code: 2222}
                            ]},
                            {state: "punjab", _id: "punjab", rank: 4, districts: [
                                {district: "amritsar", code: 11111},
                                {district: "patiala", code: 22222}
                            ]}
                        ], languages: [
                            {language: "Hindi"},
                            {language: "English"},
                            {_id: "urdu", language: "Urdu"},
                            {language: "German"}
                        ], sports: [
                            {sport: "cricket", "score": 100, club: "Kings X1 punjab"},
                            {sport: "cricket", "score": 95, club: "super kings"},
                            {sport: "cricket", "score": 85, club: "royals"}
                        ], profile: {
                            username: "maxwell", tweets: [
                                {tweet: "super player"},
                                {"tweet": "awesome player"},
                                {"tweet": "Man of the series"}
                            ]
                        }}
                    ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"},
                            {"field": "districts", "type": "object", multiple: true, fields: [
                                {field: "district", type: "string"},
                                {field: "code", type: "number"}
                            ]}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]},
                        {"field": "sports", "type": "object", "multiple": true, "fields": [
                            {"field": "sport", "type": "string"},
                            {"field": "score", "type": "number"},
                            {"field": "club", "type": "string"}
                        ]},
                        {"field": "profile", "type": "object", "fields": [
                            {"field": "username", "type": "string"},
                            {"field": "tweets", "type": "object", multiple: true, fields: [
                                {field: "tweet", type: "string"}
                            ]}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                            {"state": "rajasthan", _id: "rajasthan", rank: 5, districts: [
                                {district: "jaipur", code: 4444}
                            ]},
                            {"state": "bihar", _id: "bihar", rank: 6, districts: [
                                {district: "patna", code: 5555}
                            ]}
                        ],
                            $update: [
                                {_id: "jammu", $set: {"state": "JK", districts: {$insert: [
                                    {"district": "ladakh", code: 6666}
                                ], $update: [
                                    {$query: {district: "katra"}, $set: {district: "newKatra"}}
                                ], $delete: [
                                    {$query: {district: "pahalgaon"}}
                                ]}}, $inc: {rank: 10}},
                                {_id: "himachal", $set: {"state": "HP", districts: {$insert: [
                                    {district: "shimla", code: 7777}
                                ], $update: [
                                    {$query: {district: "kullu"}, $set: {district: "newKullu"}}
                                ], $delete: [
                                    {$query: {district: "manali"}}
                                ]}}, $inc: {rank: 20}}
                            ],
                            $delete: [
                                {$query: {state: "punjab"}}
                            ]
                        }, languages: {$insert: [
                            {language: "Haryanvi"}
                        ], $delete: [
                            {$query: {language: "German"}}
                        ], $update: [
                            {_id: "urdu", $set: {language: "URDU", score: 100}}
                        ]
                        }, sports: {$insert: [
                            {sport: "football", score: 1000, club: "manchester"}
                        ], $update: [
                            {$query: {club: "royals"}, $set: {club: "ROYALS"}, $inc: {score: -5}}
                        ], $delete: [
                            {$query: {club: "super kings"}}
                        ]}, profile: {$set: {username: "kingmaxwell", tweets: {$insert: [
                            {tweet: "king of kings"}
                        ], $update: [
                            {$query: {tweet: "awesome player"}, $set: {tweet: "mast hai"}}
                        ], $delete: [
                            {$query: {tweet: "Man of the series"}}
                        ]}}}
                        }, $inc: {
                            score: 10
                        }
                        }
                    ], $modules: {"HistoryLogs": 0}
                    }
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);

                expect(data.result[0].states[3].state).to.eql("JK");
                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[3].districts).to.have.length(2);
                expect(data.result[0].states[3].districts[0].district).to.eql("newKatra");
                expect(data.result[0].states[3].districts[1].district).to.eql("ladakh");
                expect(data.result[0].states[3].districts[1].code).to.eql(6666);

                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[1].districts).to.have.length(2);
                expect(data.result[0].states[1].districts[0].district).to.eql("north");
                expect(data.result[0].states[1].districts[0].code).to.eql(111);
                expect(data.result[0].states[1].districts[1].district).to.eql("south");
                expect(data.result[0].states[1].districts[1].code).to.eql(222);

                expect(data.result[0].states[2].state).to.eql("HP");
                expect(data.result[0].states[2].rank).to.eql(23);
                expect(data.result[0].states[2].districts).to.have.length(2);
                expect(data.result[0].states[2].districts[0].district).to.eql("newKullu");
                expect(data.result[0].states[2].districts[1].district).to.eql("shimla");
                expect(data.result[0].states[2].districts[1].code).to.eql(7777);

                expect(data.result[0].states[4].state).to.eql("rajasthan");
                expect(data.result[0].states[4].rank).to.eql(5);
                expect(data.result[0].states[4].districts).to.have.length(1);
                expect(data.result[0].states[4].districts[0].district).to.eql("jaipur");
                expect(data.result[0].states[4].districts[0].code).to.eql(4444);


                expect(data.result[0].states[0].state).to.eql("bihar");
                expect(data.result[0].states[0].rank).to.eql(6);
                expect(data.result[0].states[0].districts).to.have.length(1);
                expect(data.result[0].states[0].districts[0].district).to.eql("patna");
                expect(data.result[0].states[0].districts[0].code).to.eql(5555);


                expect(data.result[0].sports).to.have.length(3);
                expect(data.result[0].sports[0].sport).to.eql("cricket");
                expect(data.result[0].sports[0].score).to.eql(100);
                expect(data.result[0].sports[0].club).to.eql("Kings X1 punjab");

                expect(data.result[0].sports[1].sport).to.eql("cricket");
                expect(data.result[0].sports[1].score).to.eql(80);
                expect(data.result[0].sports[1].club).to.eql("ROYALS");

                expect(data.result[0].sports[2].sport).to.eql("football");
                expect(data.result[0].sports[2].score).to.eql(1000);
                expect(data.result[0].sports[2].club).to.eql("manchester");

                expect(data.result[0].profile.username).to.eql("kingmaxwell");
                expect(data.result[0].profile.tweets).to.have.length(3);
                expect(data.result[0].profile.tweets[0].tweet).to.eql("super player");
                expect(data.result[0].profile.tweets[1].tweet).to.eql("mast hai");
                expect(data.result[0].profile.tweets[2].tweet).to.eql("king of kings");

                var tx = data.result[0].__txs__[txid].tx;
//                console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                expect(tx.set).to.have.length(3);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("india");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");
                expect(tx.set[2].key).to.eql("profile.username");
                expect(tx.set[2].value).to.eql("maxwell");

                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(-12);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-10);


//                console.log("***********array****************" + JSON.stringify(tx.array.length));
                expect(tx.array).to.have.length(14);

//                console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("Data after rollback >>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].code).to.eql("01");
                expect(data.result[0].score).to.eql(1000);
                expect(data.result[0].address.city).to.eql("hisar");
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].address.lineno).to.eql(1);
                expect(data.result[0].address.lineno).to.eql(1);
                expect(data.result[0].states).to.have.length(4);
                expect(data.result[0].states[2].state).to.eql("jammu");
                expect(data.result[0].states[2].rank).to.eql(1);
                expect(data.result[0].states[2].districts).to.have.length(2);

                expect(data.result[0].states[2].districts[0].district).to.eql("katra");
                expect(data.result[0].states[2].districts[0].code).to.eql(11);
                expect(data.result[0].states[2].districts[1].district).to.eql("pahalgaon");
                expect(data.result[0].states[2].districts[1].code).to.eql(22);

                expect(data.result[0].states[0].state).to.eql("delhi");
                expect(data.result[0].states[0].rank).to.eql(2);
                expect(data.result[0].states[0].districts).to.have.length(2);
                expect(data.result[0].states[0].districts[0].district).to.eql("north");
                expect(data.result[0].states[0].districts[0].code).to.eql(111);
                expect(data.result[0].states[0].districts[1].district).to.eql("south");
                expect(data.result[0].states[0].districts[1].code).to.eql(222);

                expect(data.result[0].states[1].state).to.eql("himachal");
                expect(data.result[0].states[1].rank).to.eql(3);
                expect(data.result[0].states[1].districts).to.have.length(2);
                expect(data.result[0].states[1].districts[0].district).to.eql("kullu");
                expect(data.result[0].states[1].districts[0].code).to.eql(1111);
                expect(data.result[0].states[1].districts[1].district).to.eql("manali");
                expect(data.result[0].states[1].districts[1].code).to.eql(2222);
                expect(data.result[0].states[3].state).to.eql("punjab");
                expect(data.result[0].states[3].rank).to.eql(4);
                expect(data.result[0].states[3].districts).to.have.length(2);
                expect(data.result[0].states[3].districts[0].district).to.eql("amritsar");
                expect(data.result[0].states[3].districts[0].code).to.eql(11111);
                expect(data.result[0].states[3].districts[1].district).to.eql("patiala");
                expect(data.result[0].states[3].districts[1].code).to.eql(22222);

                expect(data.result[0].languages).to.have.length(4);
                expect(data.result[0].languages[1].language).to.eql("Hindi");
                expect(data.result[0].languages[2].language).to.eql("English");
                expect(data.result[0].languages[0].language).to.eql("Urdu");
                expect(data.result[0].languages[3].language).to.eql("German");

                expect(data.result[0].sports).to.have.length(3);
                expect(data.result[0].sports[0].sport).to.eql("cricket");
                expect(data.result[0].sports[0].club).to.eql("Kings X1 punjab");
                expect(data.result[0].sports[0].score).to.eql(100);
                expect(data.result[0].sports[1].sport).to.eql("cricket");
                expect(data.result[0].sports[1].club).to.eql("super kings");
                expect(data.result[0].sports[1].score).to.eql(95);
                expect(data.result[0].sports[2].sport).to.eql("cricket");
                expect(data.result[0].sports[2].club).to.eql("royals");
                expect(data.result[0].sports[2].score).to.eql(85);

                expect(data.result[0].profile.username).to.eql("maxwell");
                expect(data.result[0].profile.tweets).to.have.length(3);
                expect(data.result[0].profile.tweets[0].tweet).to.eql("super player");
                expect(data.result[0].profile.tweets[1].tweet).to.eql("awesome player");
                expect(data.result[0].profile.tweets[2].tweet).to.eql("Man of the series");
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })


    });
    it("insert operation with object multiple type field override case transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {"$collection": {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                            {state: "jammu", _id: "jammu", rank: 1},
                            {state: "delhi", _id: "delhi", rank: 2},
                            {state: "himachal", _id: "himachal", rank: 3},
                            {state: "punjab", _id: "punjab", rank: 4}
                        ], languages: [
                            {language: "Hindi"},
                            {language: "English"},
                            {_id: "urdu", language: "Urdu"},
                            {language: "German"}
                        ]}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                            {"state": "bihar", _id: "bihar", rank: 6}
                        ],
                            $update: [
                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                            ],
                            $delete: [
                                {_id: "punjab"}
                            ]
                        }, languages: [
                            {language: "marathi"},
                            {language: "gujrati"}
                        ]
                        }, $inc: {
                            score: 10
                        }
                        }


                    ], $modules: {"HistoryLogs": 0}
                    }
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);

                expect(data.result[0].states[3].state).to.eql("JK");
                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[2].state).to.eql("HP");
                expect(data.result[0].states[4].state).to.eql("rajasthan");
                expect(data.result[0].states[0].state).to.eql("bihar");
                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[2].rank).to.eql(23);
                expect(data.result[0].states[4].rank).to.eql(5);
                expect(data.result[0].states[0].rank).to.eql(6);

                expect(data.result[0].languages).to.have.length(2);
                expect(data.result[0].languages[0].language).to.eql("marathi");
                expect(data.result[0].languages[1].language).to.eql("gujrati");

                var tx = data.result[0].__txs__[txid].tx;
//                console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                expect(tx.set).to.have.length(3);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");
                expect(tx.set[2].key).to.eql("languages");
                expect(tx.set[2].value).to.have.length(4);

                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(-12);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-10);


//                console.log("***********array****************" + JSON.stringify(tx.array.length));
                expect(tx.array).to.have.length(5);

//                console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                expect(tx.array[0].field).to.eql("states");
                expect(tx.array[0].type).to.eql("update");
                expect(tx.array[0]._id).to.eql("jammu");
                expect(tx.array[0].inc).to.have.length(1);
                expect(tx.array[0].inc[0].key).to.eql("rank");
                expect(tx.array[0].inc[0].value).to.eql(-10);
                expect(tx.array[0].set).to.have.length(1);
                expect(tx.array[0].set[0].key).to.eql("state");
                expect(tx.array[0].set[0].value).to.eql("jammu");
//                console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                expect(tx.array[1].field).to.eql("states");
                expect(tx.array[1].type).to.eql("update");
                expect(tx.array[1]._id).to.eql("himachal");
                expect(tx.array[1].inc).to.have.length(1);
                expect(tx.array[1].inc[0].key).to.eql("rank");
                expect(tx.array[1].inc[0].value).to.eql(-20);
                expect(tx.array[1].set).to.have.length(1);
                expect(tx.array[1].set[0].key).to.eql("state");
                expect(tx.array[1].set[0].value).to.eql("himachal");

                expect(tx.array[2].field).to.eql("states");
                expect(tx.array[2].type).to.eql("insert");
                expect(tx.array[2]._id).to.eql("punjab");
                expect(tx.array[2].value.state).to.eql("punjab");
                expect(tx.array[2].value._id).to.eql("punjab");
                expect(tx.array[2].value.rank).to.eql(4);
                expect(tx.array[3].field).to.eql("states");
                expect(tx.array[3].type).to.eql("delete");
                expect(tx.array[3]._id).to.eql("rajasthan");
                expect(tx.array[4].field).to.eql("states");
                expect(tx.array[4].type).to.eql("delete");
                expect(tx.array[4]._id).to.eql("bihar");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
//                console.log("data of transaxction>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("Data after comamit >>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);
                expect(data.result[0].states[3].state).to.eql("JK");
                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[2].state).to.eql("HP");
                expect(data.result[0].states[4].state).to.eql("rajasthan");
                expect(data.result[0].states[0].state).to.eql("bihar");
                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[2].rank).to.eql(23);
                expect(data.result[0].states[4].rank).to.eql(5);
                expect(data.result[0].states[0].rank).to.eql(6);
                expect(data.result[0].languages).to.have.length(2);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("insert operation with object multiple type field override case transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {"$collection": {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                            {state: "jammu", _id: "jammu", rank: 1},
                            {state: "delhi", _id: "delhi", rank: 2},
                            {state: "himachal", _id: "himachal", rank: 3},
                            {state: "punjab", _id: "punjab", rank: 4}
                        ], languages: [
                            {language: "Hindi"},
                            {language: "English"},
                            {_id: "urdu", language: "Urdu"},
                            {language: "German"}
                        ]}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                            {"state": "bihar", _id: "bihar", rank: 6}
                        ],
                            $update: [
                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                            ],
                            $delete: [
                                {_id: "punjab"}
                            ]
                        }, languages: [
                            {language: "marathi"},
                            {language: "gujrati"}
                        ]
                        }, $inc: {
                            score: 10
                        }
                        }


                    ], $modules: {"HistoryLogs": 0}
                    }
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);

                expect(data.result[0].states[3].state).to.eql("JK");
                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[2].state).to.eql("HP");
                expect(data.result[0].states[4].state).to.eql("rajasthan");
                expect(data.result[0].states[0].state).to.eql("bihar");
                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[2].rank).to.eql(23);
                expect(data.result[0].states[4].rank).to.eql(5);
                expect(data.result[0].states[0].rank).to.eql(6);

                expect(data.result[0].languages).to.have.length(2);
                expect(data.result[0].languages[0].language).to.eql("marathi");
                expect(data.result[0].languages[1].language).to.eql("gujrati");

                var tx = data.result[0].__txs__[txid].tx;
//                console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                expect(tx.set).to.have.length(3);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");
                expect(tx.set[2].key).to.eql("languages");
                expect(tx.set[2].value).to.have.length(4);

                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(-12);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-10);


//                console.log("***********array****************" + JSON.stringify(tx.array.length));
                expect(tx.array).to.have.length(5);

//                console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                expect(tx.array[0].field).to.eql("states");
                expect(tx.array[0].type).to.eql("update");
                expect(tx.array[0]._id).to.eql("jammu");
                expect(tx.array[0].inc).to.have.length(1);
                expect(tx.array[0].inc[0].key).to.eql("rank");
                expect(tx.array[0].inc[0].value).to.eql(-10);
                expect(tx.array[0].set).to.have.length(1);
                expect(tx.array[0].set[0].key).to.eql("state");
                expect(tx.array[0].set[0].value).to.eql("jammu");
//                console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                expect(tx.array[1].field).to.eql("states");
                expect(tx.array[1].type).to.eql("update");
                expect(tx.array[1]._id).to.eql("himachal");
                expect(tx.array[1].inc).to.have.length(1);
                expect(tx.array[1].inc[0].key).to.eql("rank");
                expect(tx.array[1].inc[0].value).to.eql(-20);
                expect(tx.array[1].set).to.have.length(1);
                expect(tx.array[1].set[0].key).to.eql("state");
                expect(tx.array[1].set[0].value).to.eql("himachal");

                expect(tx.array[2].field).to.eql("states");
                expect(tx.array[2].type).to.eql("insert");
                expect(tx.array[2]._id).to.eql("punjab");
                expect(tx.array[2].value.state).to.eql("punjab");
                expect(tx.array[2].value._id).to.eql("punjab");
                expect(tx.array[2].value.rank).to.eql(4);


                expect(tx.array[3].field).to.eql("states");
                expect(tx.array[3].type).to.eql("delete");
                expect(tx.array[3]._id).to.eql("rajasthan");


                expect(tx.array[4].field).to.eql("states");
                expect(tx.array[4].type).to.eql("delete");
                expect(tx.array[4]._id).to.eql("bihar");


            }).then(
            function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
//                console.log("data of transaxction>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return  db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("Data after rollback >>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                expect(data.result[0].score).to.eql(1000);
                expect(data.result[0].address.city).to.eql("hisar");
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].address.lineno).to.eql(1);
                expect(data.result[0].address.lineno).to.eql(1);
                expect(data.result[0].states).to.have.length(4);
                expect(data.result[0].states[2].state).to.eql("jammu");
                expect(data.result[0].states[2].rank).to.eql(1);
                expect(data.result[0].states[0].state).to.eql("delhi");
                expect(data.result[0].states[0].rank).to.eql(2);
                expect(data.result[0].states[1].state).to.eql("himachal");
                expect(data.result[0].states[1].rank).to.eql(3);
                expect(data.result[0].states[3].state).to.eql("punjab");
                expect(data.result[0].states[3].rank).to.eql(4);

                expect(data.result[0].languages).to.have.length(4);
                expect(data.result[0].languages[0].language).to.eql("Hindi");
                expect(data.result[0].languages[1].language).to.eql("English");
                expect(data.result[0].languages[2].language).to.eql("Urdu");
                expect(data.result[0].languages[3].language).to.eql("German");
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("upsert operation transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: {collection: "cities", fields: [
                        {field: "city", type: "string"},
                        {field: "state", type: "fk", upsert: true, set: ["state", "country"], collection: {"collection": "states", fields: [
                            {field: "country", type: "fk", set: ["country"], upsert: true, collection: {"collection": "countries"}}
                        ]}}
                    ]}, $insert: [
                        {_id: 1, city: "hisar", state: {$query: {_id: "haryana"}, $set: {"state": "haryana", country: {"$query": {_id: "india"}, $set: {country: "india"}}}}}
                    ], $modules: {"HistoryLogs": 0}
                    }
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "cities"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].city).to.eql("hisar");
                expect(data.result[0].state.state).to.eql("haryana");
                expect(data.result[0].state.country.country).to.eql("india");
                var recordTxid = data.result[0].txid;
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
//                console.log("datain pl .txs >>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(3);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[1].txid).to.eql(txid);
                expect(data.result[2].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[1].tx.collection).to.eql("states");
                expect(data.result[2].tx.collection).to.eql("cities");
                return  db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "cities"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].city).to.eql("hisar");
                expect(data.result[0].state.state).to.eql("haryana");
                expect(data.result[0].state.country.country).to.eql("india");
                return db.query({$collection: "states"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].state).to.eql("haryana");
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("upsert operation transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: {collection: "cities", fields: [
                        {field: "city", type: "string"},
                        {field: "state", type: "fk", upsert: true, set: ["state", "country"], collection: {"collection": "states", fields: [
                            {field: "country", type: "fk", set: ["country"], upsert: true, collection: {"collection": "countries"}}
                        ]}}
                    ]}, $insert: [
                        {_id: 1, city: "hisar", state: {$query: {_id: "haryana"}, $set: {"state": "haryana", country: {"$query": {_id: "india"}, $set: {country: "india"}}}}}
                    ], $modules: {"HistoryLogs": 0}
                    }
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "cities"});
            }).then(
            function (data) {
//                console.log("cites data after insert>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].city).to.eql("hisar");
                expect(data.result[0].state.state).to.eql("haryana");
                expect(data.result[0].state.country.country).to.eql("india");
                var recordTxid = data.result[0].txid;
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[1].txid).to.eql(txid);
                expect(data.result[2].txid).to.eql(txid);
                expect(data.result[2].tx.collection).to.eql("cities");
                expect(data.result[1].tx.collection).to.eql("states");
                expect(data.result[0].tx.collection).to.eql("countries");
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "cities"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "states"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("increment 2 times transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"country": "India"}, $inc: {score: 10}}
                    ], $modules: {"HistoryLogs": 0}},
                    {$collection: "countries", $update: [
                        {_id: 1, $inc: {score: -25}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).eql("India");
                expect(data.result[0].score).to.eql(985);
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.inc).to.have.length(1);
                expect(tx.inc[0].key).to.eql("score");
                expect(tx.inc[0].value).to.eql(15);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                console.log("data in countries collections >>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(985);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("increment 2 times transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"country": "India"}, $inc: {score: 10}}
                    ], $modules: {"HistoryLogs": 0}},
                    {$collection: "countries", $update: [
                        {_id: 1, $inc: {score: -25}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).eql("India");
                expect(data.result[0].score).to.eql(985);
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.inc).to.have.length(1);
                expect(tx.inc[0].key).to.eql("score");
                expect(tx.inc[0].value).to.eql(15);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return  db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].score).to.eql(1000);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("update 3 times transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000}

                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"country": "India"}, $inc: {score: 10}}
                    ], $modules: {"HistoryLogs": 0}},
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {country: "pakistan"}}
                    ], $modules: {"HistoryLogs": 0}},
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {country: "hindustan"}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("hindustan");
                expect(data.result[0].score).to.eql(1010);
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.inc).to.have.length(1);
                expect(tx.inc[0].key).to.eql("score");
                expect(tx.inc[0].value).to.eql(-10);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("hindustan");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("update 3 times transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        { country: "USA", code: "01", "score": 1000}

                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                var update = [
                    {$collection: "countries", $update: [
                        {_id: data.result[0]._id, $set: {"country": "India"}, $inc: {score: 10}}
                    ], $modules: {"HistoryLogs": 0}},
                    {$collection: "countries", $update: [
                        {_id: data.result[0]._id, $set: {country: "pakistan"}}
                    ], $modules: {"HistoryLogs": 0}},
                    {$collection: "countries", $update: [
                        {_id: data.result[0]._id, $set: {country: "hindustan"}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("hindustan");
                expect(data.result[0].score).to.eql(1010);
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.inc).to.have.length(1);
                expect(tx.inc[0].key).to.eql("score");
                expect(tx.inc[0].value).to.eql(-10);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                return   db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                expect(data.result[0].score).to.eql(1000);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("update same record from  2 instances of same db both rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        var db1 = undefined;
        var db2 = undefined;
        var db1txid = undefined;
        var db2txid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "india", code: "01"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
            }).then(
            function (db) {
                db1 = db;
                return db1.startTransaction();
            }).then(
            function (db1txid1) {
                db1txid = db1txid1;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {country: "bharat"}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db1.update(update);
            }).then(
            function () {
                return db1.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("bharat");
                var txs = data.result[0].__txs__;
                var tx = data.result[0].__txs__[db1txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("india");
                return db1.query({$collection: "pl.txs", $filter: {"txid": db1txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(db1txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
            }).then(
            function (db) {
                db2 = db;
                return db2.startTransaction();
            }).then(
            function (db2txid2) {
                db2txid = db2txid2;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {country: "bharat"}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db2.update(update);
            }).then(
            function () {
                return db2.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("bharat");
                var tx = data.result[0].__txs__[db2txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("bharat");
                return db2.query({$collection: "pl.txs", $filter: {"txid": db2txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return    db1.rollbackTransaction();
            }).then(
            function () {
                return db1.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                return db1.query({$collection: "pl.txs", $filter: {"txid": db1txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db2.rollbackTransaction();
            }).then(
            function () {
                return db2.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("bharat");
                expect(data.result[0].__txs__).to.eql({});
                return db2.query({$collection: "pl.txs", $filter: {"txid": db2txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("inc from  2 instances of same db both rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        var db1 = undefined;
        var db2 = undefined;
        var db1txid = undefined;
        var db2txid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "india", rank: 22}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
            }).then(
            function (db) {
                db1 = db;
                return db1.startTransaction();
            }).then(
            function (db1txid1) {
                db1txid = db1txid1;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $inc: {rank: 10}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db1.update(update);
            }).then(
            function () {
                return db1.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].rank).to.eql(32);
                var tx = data.result[0].__txs__[db1txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.inc).to.have.length(1);
                expect(tx.inc[0].key).to.eql("rank");
                expect(tx.inc[0].value).to.eql(-10);
                return db1.query({$collection: "pl.txs", $filter: {"txid": db1txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(db1txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
            }).then(
            function (db) {
                db2 = db;
                return db2.startTransaction();
            }).then(
            function (db2txid2) {
                db2txid = db2txid2;
                var newUpdate = [
                    {$collection: "countries", $update: [
                        {_id: 1, $inc: {rank: -50}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db2.update(newUpdate);
            }).then(
            function () {
                return db2.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].rank).to.eql(-18);
                var tx = data.result[0].__txs__[db2txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.inc).to.have.length(1);
                expect(tx.inc[0].key).to.eql("rank");
                expect(tx.inc[0].value).to.eql(50);
                return db2.query({$collection: "pl.txs", $filter: {"txid": db2txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(db2txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db1.rollbackTransaction();
            }).then(
            function () {
                return db1.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].rank).to.eql(-28);
                return db1.query({$collection: "pl.txs", $filter: {"txid": db1txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db2.rollbackTransaction();
            }).then(
            function () {
                return db2.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].rank).to.eql(22);
                expect(data.result[0].__txs__).to.eql({});
                return db2.query({$collection: "pl.txs", $filter: {"txid": db2txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("inc from  2 instances of same db one commit and one  rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        var db1 = undefined;
        var db2 = undefined;
        var db1txid = undefined;
        var db2txid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "india", rank: 22}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
            }).then(
            function (db) {
                db1 = db;
                return db1.startTransaction();
            }).then(
            function (db1txid1) {
                db1txid = db1txid1;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $inc: {rank: 10}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db1.update(update);
            }).then(
            function () {
                return db1.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].rank).to.eql(32);
                var tx = data.result[0].__txs__[db1txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.inc).to.have.length(1);
                expect(tx.inc[0].key).to.eql("rank");
                expect(tx.inc[0].value).to.eql(-10);
                return db1.query({$collection: "pl.txs", $filter: {"txid": db1txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(db1txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
            }).then(
            function (db) {
                db2 = db;
                return db2.startTransaction();
            }).then(
            function (db2txid2) {
                db2txid = db2txid2;
                var newUpdate = [
                    {$collection: "countries", $update: [
                        {_id: 1, $inc: {rank: -50}}
                    ]}
                ];
                return db2.update(newUpdate);
            }).then(
            function () {
                return db2.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].rank).to.eql(-18);
                var tx = data.result[0].__txs__[db2txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.inc).to.have.length(1);
                expect(tx.inc[0].key).to.eql("rank");
                expect(tx.inc[0].value).to.eql(50);
                return db2.query({$collection: "pl.txs", $filter: {"txid": db2txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(db2txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db1.commitTransaction();
            }).then(
            function () {
                return db1.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].rank).to.eql(-18);
                return db1.query({$collection: "pl.txs", $filter: {"txid": db1txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db2.rollbackTransaction();
            }).then(
            function () {
                return db2.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].rank).to.eql(32);
                expect(data.result[0].__txs__).to.eql({});
                return db2.query({$collection: "pl.txs", $filter: {"txid": db1txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("multiple inserts transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01"}
                    ]},
                    {$collection: "states", $insert: [
                        {_id: 1, country: "LA", code: "11"}
                    ]},
                    {$collection: "city", $insert: [
                        {_id: 1, country: "HISAR", code: "22"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data of countries after insert>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "states"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("LA");
                expect(data.result[0].code).to.eql("11");
                return db.query({$collection: "city"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("HISAR");
                expect(data.result[0].code).to.eql("22");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[1].tx.collection).to.eql("states");
                expect(data.result[2].tx.collection).to.eql("city");
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "states"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("LA");
                expect(data.result[0].code).to.eql("11");
                return db.query({$collection: "city"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("HISAR");
                expect(data.result[0].code).to.eql("22");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    })
    it("multiple inserts transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01"}
                    ]},
                    {$collection: "states", $insert: [
                        {_id: 1, country: "LA", code: "11"}
                    ]},
                    {$collection: "city", $insert: [
                        {_id: 1, country: "HISAR", code: "22"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "states"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("LA");
                expect(data.result[0].code).to.eql("11");
                return db.query({$collection: "city"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("HISAR");
                expect(data.result[0].code).to.eql("22");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[1].tx.collection).to.eql("states");
                expect(data.result[2].tx.collection).to.eql("city");
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "states"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "city"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("insert then update transaction commit", function (done) {

        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01"}
                    ]},
                    {$collection: "countries", $update: [
                        {_id: 1, $set: { "country": "india"}}
                    ]}

                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.delete).to.have.property("_id");
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                console.log("data in countries collection >>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].code).to.eql("01");
                expect(data.result[0].__txs__).to.eql(undefined);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert then update transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01"}
                    ]},
                    {$collection: "countries", $update: [
                        {_id: 1, $set: { "country": "india"}}
                    ]}

                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.delete).to.have.property("_id");
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("insert then update nested object transaction commit", function (done) {

        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {"_id": 1, "country": "USA", "code": 1, "state": {"state": "haryana", "rank": 100, "city": {"city": "hisar", "score": 200, "address": {"lineno": 300, "area": "near ketarpaul hospital"}}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $update: [
                        {"_id": 1, "$inc": {"code": 10}, "$set": { "country": "india", "state": {"$set": {"state": "LA", "city": {"$set": {"city": "toronto", "address": {"$set": {"area": "daffodil"}, "$inc": {"lineno": 10}}}, "$inc": {"score": 10}}}, "$inc": {"rank": 10}}}}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].code).to.eql(11);
                expect(data.result[0].state.state).to.eql("LA");
                expect(data.result[0].state.rank).to.eql(110);
                expect(data.result[0].state.city.city).to.eql("toronto");
                expect(data.result[0].state.city.score).to.eql(210);
                expect(data.result[0].state.city.address.area).to.eql("daffodil");
                expect(data.result[0].state.city.address.lineno).to.eql(310);

                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(data.result[0]._id);
                expect(tx.set).to.have.length(4);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("state.state");
                expect(tx.set[1].value).to.eql("haryana");
                expect(tx.set[2].key).to.eql("state.city.city");
                expect(tx.set[2].value).to.eql("hisar");
                expect(tx.set[3].key).to.eql("state.city.address.area");
                expect(tx.set[3].value).to.eql("near ketarpaul hospital");

                expect(tx.inc).to.have.length(4);
                expect(tx.inc[3].key).to.eql("code");
                expect(tx.inc[3].value).to.eql(-10);
                expect(tx.inc[2].key).to.eql("state.rank");
                expect(tx.inc[2].value).to.eql(-10);
                expect(tx.inc[1].key).to.eql("state.city.score");
                expect(tx.inc[1].value).to.eql(-10);
                expect(tx.inc[0].key).to.eql("state.city.address.lineno");
                expect(tx.inc[0].value).to.eql(-10);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return   db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].code).to.eql(11);
                expect(data.result[0].state.state).to.eql("LA");
                expect(data.result[0].state.rank).to.eql(110);
                expect(data.result[0].state.city.city).to.eql("toronto");
                expect(data.result[0].state.city.score).to.eql(210);
                expect(data.result[0].state.city.address.area).to.eql("daffodil");
                expect(data.result[0].state.city.address.lineno).to.eql(310);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it("insert then update nested object transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {"_id": 1, "country": "USA", "code": 1, "state": {"state": "haryana", "rank": 100, "city": {"city": "hisar", "score": 200, "address": {"lineno": 300, "area": "near ketarpaul hospital"}}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $update: [
                        {"_id": 1, "$inc": {"code": 10}, "$set": { "country": "india", "state": {"$set": {"state": "LA", "city": {"$set": {"city": "toronto", "address": {"$set": {"area": "daffodil"}, "$inc": {"lineno": 10}}}, "$inc": {"score": 10}}}, "$inc": {"rank": 10}}}}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].code).to.eql(11);
                expect(data.result[0].state.state).to.eql("LA");
                expect(data.result[0].state.rank).to.eql(110);
                expect(data.result[0].state.city.city).to.eql("toronto");
                expect(data.result[0].state.city.score).to.eql(210);
                expect(data.result[0].state.city.address.area).to.eql("daffodil");
                expect(data.result[0].state.city.address.lineno).to.eql(310);
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(data.result[0]._id);
                expect(tx.set).to.have.length(4);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("state.state");
                expect(tx.set[1].value).to.eql("haryana");
                expect(tx.set[2].key).to.eql("state.city.city");
                expect(tx.set[2].value).to.eql("hisar");
                expect(tx.set[3].key).to.eql("state.city.address.area");
                expect(tx.set[3].value).to.eql("near ketarpaul hospital");

                expect(tx.inc).to.have.length(4);
                expect(tx.inc[3].key).to.eql("code");
                expect(tx.inc[3].value).to.eql(-10);
                expect(tx.inc[2].key).to.eql("state.rank");
                expect(tx.inc[2].value).to.eql(-10);
                expect(tx.inc[1].key).to.eql("state.city.score");
                expect(tx.inc[1].value).to.eql(-10);
                expect(tx.inc[0].key).to.eql("state.city.address.lineno");
                expect(tx.inc[0].value).to.eql(-10);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return  db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql(1);
                expect(data.result[0].state.state).to.eql("haryana");
                expect(data.result[0].state.rank).to.eql(100);
                expect(data.result[0].state.city.city).to.eql("hisar");
                expect(data.result[0].state.city.score).to.eql(200);
                expect(data.result[0].state.city.address.area).to.eql("near ketarpaul hospital");
                expect(data.result[0].state.city.address.lineno).to.eql(300);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });


    it("update with unset operator transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: 01, "score": 1000}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $update: [
                        {"_id": 1, "$inc": {"code": 10}, "$set": { "country": "india", "state": {"$set": {"state": "LA", "city": {"$set": {"city": "toronto", "address": {"$set": {"area": "daffodil"}, "$inc": {"lineno": 10}}}, "$inc": {"score": 10}}}, "$inc": {"rank": 10}}}}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].score).to.eql(1000);
                expect(data.result[0].code).to.eql(11);
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.unset).to.have.length(3);
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.inc).to.have.length(4);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].code).to.eql(11);
                expect(data.result[0].state.rank).to.eql(10);
                expect(data.result[0].state.state).to.eql("LA");
                expect(data.result[0].state.city.city).to.eql("toronto");
                expect(data.result[0].state.city.score).to.eql(10);
                expect(data.result[0].state.city.address.area).to.eql("daffodil");
                expect(data.result[0].state.city.address.lineno).to.eql(10);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("update with unset operator transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: 01, "score": 1000}
                    ]}
                ];
                ;
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $update: [
                        {"_id": 1, "$inc": {"code": 10}, "$set": { "country": "india", "state": {"$set": {"state": "LA", "city": {"$set": {"city": "toronto", "address": {"$set": {"area": "daffodil"}, "$inc": {"lineno": 10}}}, "$inc": {"score": 10}}}, "$inc": {"rank": 10}}}}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("india");
                expect(data.result[0].score).to.eql(1000);
                expect(data.result[0].code).to.eql(11);

                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(1);
                expect(tx.unset).to.have.length(3);
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.inc).to.have.length(4);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql(01);
                expect(data.result[0].__txs__).to.eql({});
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it.skip("parallel transaction case when updating txs in document -- on the basis of count", function (done) {
        function whenDone(done) {
            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                function (db1) {
                    return db1.query({$collection: "countries"});
                }).then(
                function (data) {
//                    console.log("data in countries>>>>>>>>>>>>>>>>>>>>>>.." + JSON.stringify(data));
                    expect(data.result).to.have.length(1);
                    expect(data.result[0].country).to.eql("pakistan");
                    expect(data.result[0].code).to.eql("92");
                    expect(data.result[0]._id).to.eql("india");
                    done();
                }).fail(function () {
                    done(err);
                });
        }

        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        var db1 = undefined;
        var db1txid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: "india", country: "india", code: "91"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
            }).then(
            function (db1) {
                db1 = db1;
                return db1.startTransaction();
            }).then(
            function (txid) {
                db1txid = txid;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update1 = [
                    {$collection: "countries", $update: [
                        {_id: "india", $set: {country: "pakistan"}}
                    ]}
                ];
                var update2 = [
                    {$collection: "countries", $update: [
                        {_id: "india", $set: {code: "92"}}
                    ]}
                ];
                db.update(update1).then(
                    function () {
                        return db.commitTransaction();
                    }).then(function () {
                        count = count + 1;
                        if (count == 2) {
                            whenDone(done);
                        }
                    });
                db1.update(update2).then(
                    function () {
                        return db.commitTransaction();
                    }).then(function () {
                        count = count + 1;
                        if (count == 2) {
                            whenDone(done);
                        }
                    });
            }).fail(function (err) {
                done(err);
            });
    });
    it("duplicate error while rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = {$collection: "countries", $insert: [
                    {_id: "india", country: "india"},
                    {_id: "usa", country: "usa"}
                ], $modules: {"HistoryLogs": 0}};
                return db.update(update);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var newUpdate = [
                    {$collection: "countries", $delete: [
                        {_id: "india"}
                    ], $modules: {"HistoryLogs": 0}},
                    {$collection: "countries", $update: [
                        {_id: "usa", $set: {country: "USA"}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(newUpdate);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(data.result[0]._id);
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("usa");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
//                console.log("pl.txs>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[1].txid).to.eql(txid);
                expect(data.result[1].tx.collection).to.eql("countries");
                expect(data.result[1].tx.insert._id).to.eql("india");
                expect(data.result[0].tx.update._id).to.eql("usa");
                var update = {$collection: "countries", $insert: [
                    {_id: "india", country: "india"}
                ]}
                return db.mongoUpdate(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].country).to.eql("usa");
                expect(data.result[0]._id).to.eql("usa");
                expect(data.result[1].country).to.eql("india");
                expect(data.result[1]._id).to.eql("india");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    // trigger based transactions

    it("required values in old record rollback transaction", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        var event = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var modifyPerson = {   name: "transactionJob", source: "NorthwindTestCase/lib/PersonJob"};
                event = [
                    {
                        function: modifyPerson,
                        event: "onSave",
                        pre: true,
                        requiredfields: {"accountid.code": 1 }
                    }
                ];

                var updates = [
                    {$collection: "accounts", $insert: [
                        {"name": "bank", code: "c1" },
                        {"name": "cash", code: "c2" }
                    ]},
                    {$collection: {collection: "vouchers", "events": event, fields: [
                        {field: "accountid", type: "fk", upsert: false, collection: {collection: "accounts"}}
                    ]}, $insert: [
                        {"_id": 1, "voucherNo": "1221", "accountid": {$query: {name: "bank"}} }
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "vouchers"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].code).to.eql("c1");
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var newUpdates = [
                    {$collection: {collection: "vouchers", "events": event, fields: [
                        {field: "accountid", type: "fk", upsert: false, collection: {collection: "accounts"}}
                    ]}, $update: [
                        {"_id": 1, $set: {"voucherNo": "2112", "accountid": {$query: {name: "cash"}}}}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(newUpdates);
            }).then(
            function () {
                return db.query({$collection: "vouchers"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].voucherNo).to.eql("2112");
                expect(data.result[0].code).to.eql("c2");
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx._id).to.eql(data.result[0]._id);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("vouchers");
                expect(data.result[0].tx.update._id).to.eql(1);
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "vouchers"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].code).to.eql("c1");
                expect(data.result[0].accountid.code).to.eql(undefined);
                expect(data.result[0].__txid__).to.eql(undefined);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("required values in old record delete case rollback transaction", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        var event = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var modifyPerson = {   name: "transactionJob", source: "NorthwindTestCase/lib/PersonJob"};
                event = [
                    {
                        function: modifyPerson,
                        event: "onSave",
                        pre: true,
                        requiredfields: {"accountid.code": 1 }
                    }
                ];
                var updates = [
                    {$collection: "accounts", $insert: [
                        {"name": "bank", code: "c1" },
                        {"name": "cash", code: "c2" }
                    ]},
                    {$collection: {collection: "vouchers", "events": event, fields: [
                        {field: "accountid", type: "fk", upsert: false, collection: {collection: "accounts"}}
                    ]}, $insert: [
                        {"_id": 1, "voucherNo": "1221", "accountid": {$query: {name: "bank"}} }
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "vouchers"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].code).to.eql("c1");
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var newUpdates = [
                    {$collection: {collection: "vouchers", "events": event, fields: [
                        {field: "accountid", type: "fk", upsert: false, collection: {collection: "accounts"}}
                    ]}, $delete: [
                        {"_id": 1}
                    ]}
                ]
                return db.update(newUpdates);
            }).then(
            function () {
                return db.query({$collection: "vouchers"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("vouchers");
                expect(data.result[0].tx.insert._id).to.eql(1);
                expect(data.result[0].tx.insert.voucherNo).to.eql("1221");
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "vouchers"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].code).to.eql("c1");
                expect(data.result[0].accountid.code).to.eql(undefined);
                expect(data.result[0].__txid__).to.eql(undefined);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("update by business logic transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        var event = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var modifyPerson = {   name: "personJob", source: "NorthwindTestCase/lib/PersonJob"};
                event = [
                    {
                        function: modifyPerson,
                        event: "onSave",
                        pre: true
                    }
                ];
                var updates = [
                    {$collection: {"collection": "Persons", "events": event}, $insert: [
                        {_id: 1, "lastname": "Sangwan", "firstname": "Manjeet"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "Persons"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].fullname).to.eql("Manjeet Sangwan");
                record_id = data.result[0]._id;
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
//                console.log("data in pl.txs>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("Persons");
                expect(data.result[0].tx.delete._id).to.eql(record_id);
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "Persons"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].firstname).to.eql("Manjeet");
                expect(data.result[0].lastname).to.eql("Sangwan");
                expect(data.result[0].fullname).to.eql("Manjeet Sangwan");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("update by business logic transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var record_id = undefined;
        var event = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var modifyPerson = {   name: "personJob", source: "NorthwindTestCase/lib/PersonJob"};
                event = [
                    {
                        function: modifyPerson,
                        event: "onSave",
                        pre: true
                    }
                ];
                var updates = [
                    {$collection: {"collection": "Persons", "events": event}, $insert: [
                        {_id: 1, "lastname": "Sangwan", "firstname": "Manjeet"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "Persons"});
            }).then(
            function (data) {
//                console.log("data after savingg person>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].fullname).to.eql("Manjeet Sangwan");
                record_id = data.result[0]._id;
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("Persons");
                expect(data.result[0].tx.delete._id).to.eql(record_id);
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "Persons"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("update  self and another  collection  by business logic transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var invoiceRecord_id = undefined;
        var voucherRecord_id = undefined;
        var event = undefined;
        var invoiceId = undefined;
        var voucherid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var modifyPerson = {   name: "job", source: "NorthwindTestCase/lib/InvoiceJob"};
                var event = [
                    {
                        function: modifyPerson,
                        event: "onSave",
                        post: true
                    }
                ]

                var updates = [
                    {$collection: {"collection": "invoices", "events": event}, $insert: [
                        {
                            _id: 001,
                            invoiceno: "001",
                            date: "2013-12-10",
                            customer: {_id: "pawan", customer: "pawan"},
                            invoicelineitems: [
                                {
                                    deliveryid: {_id: "001", deliveryno: "001"},
                                    amount: 20000
                                },
                                {
                                    deliveryid: {_id: "002", deliveryno: "002"},
                                    amount: 30000
                                }
                            ]
                        }
                    ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "invoices"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].customer.customer).to.eql("pawan");
                expect(data.result[0].invoicelineitems).to.have.length(2);
                expect(data.result[0].invoicelineitems[0].deliveryid.deliveryno).to.eql("001");
                expect(data.result[0].invoicelineitems[0].amount).to.eql(20000);
                expect(data.result[0].invoicelineitems[1].deliveryid.deliveryno).to.eql("002");
                expect(data.result[0].invoicelineitems[1].amount).to.eql(30000);
                invoiceRecord_id = data.result[0]._id;
                voucherid = data.result[0].voucherid;
                invoiceId = data.result[0]._id;
                return db.query({$collection: "vouchers"});
            }).then(
            function (voucherData) {
//                console.log("vouchers data after update" + JSON.stringify(voucherData));
                expect(voucherData.result).to.have.length(1);
                expect(voucherData.result[0].voucherno).to.eql("001");
                expect(voucherData.result[0].invoiceid).to.eql(invoiceId);
                expect(voucherData.result[0]._id).to.eql(voucherid);
                voucherRecord_id = voucherData.result[0]._id;
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
//                console.log("transactions data after update in pl.txs>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("invoices");
                expect(data.result[0].tx.delete._id).to.eql(invoiceRecord_id);
                expect(data.result[1].tx.collection).to.eql("vouchers");
                expect(data.result[1].tx.delete._id).to.eql(voucherRecord_id);
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "invoices"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].customer.customer).to.eql("pawan");
                expect(data.result[0].invoicelineitems).to.have.length(2);
                expect(data.result[0].invoicelineitems[0].deliveryid.deliveryno).to.eql("001");
                expect(data.result[0].invoicelineitems[0].amount).to.eql(20000);
                expect(data.result[0].invoicelineitems[1].deliveryid.deliveryno).to.eql("002");
                expect(data.result[0].invoicelineitems[1].amount).to.eql(30000);
                return db.query({$collection: "vouchers"});
            }).then(
            function (voucherData) {
//                console.log("voucherDAta data after commit >>>>" + JSON.stringify(voucherData));
//                console.log("voucherid>>>>>>>>>>>>>>>." + voucherid);
                expect(voucherData.result).to.have.length(1);
                expect(voucherData.result[0].voucherno).to.eql("001");
                expect(voucherData.result[0].invoiceid).to.eql(invoiceId);
                expect(voucherData.result[0]._id).to.eql(voucherid);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("update  self and another  collection  by business logic transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var invoiceRecord_id = undefined;
        var voucherRecord_id = undefined;
        var event = undefined;
        var invoiceId = undefined;
        var voucherid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var modifyPerson = {   name: "job", source: "NorthwindTestCase/lib/InvoiceJob"};
                var event = [
                    {
                        function: modifyPerson,
                        event: "onSave",
                        post: true
                    }
                ]

                var updates = [
                    {$collection: {"collection": "invoices", "events": event}, $insert: [
                        {
                            _id: 001,
                            invoiceno: "001",
                            date: "2013-12-10",
                            customer: {_id: "pawan", customer: "pawan"},
                            invoicelineitems: [
                                {
                                    deliveryid: {_id: "001", deliveryno: "001"},
                                    amount: 20000
                                },
                                {
                                    deliveryid: {_id: "002", deliveryno: "002"},
                                    amount: 30000
                                }
                            ]
                        }
                    ]
                    }
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "invoices"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].customer.customer).to.eql("pawan");
                expect(data.result[0].invoicelineitems).to.have.length(2);
                expect(data.result[0].invoicelineitems[0].deliveryid.deliveryno).to.eql("001");
                expect(data.result[0].invoicelineitems[0].amount).to.eql(20000);
                expect(data.result[0].invoicelineitems[1].deliveryid.deliveryno).to.eql("002");
                expect(data.result[0].invoicelineitems[1].amount).to.eql(30000);
                invoiceRecord_id = data.result[0]._id;
                voucherid = data.result[0].voucherid;
                invoiceId = data.result[0]._id;
                return db.query({$collection: "vouchers"});
            }).then(
            function (voucherData) {
//                console.log("vouchers data after update" + JSON.stringify(voucherData));
                expect(voucherData.result).to.have.length(1);
                expect(voucherData.result[0].voucherno).to.eql("001");
                expect(voucherData.result[0].invoiceid).to.eql(invoiceId);
                expect(voucherData.result[0]._id).to.eql(voucherid);
                voucherRecord_id = voucherData.result[0]._id;
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("invoices");
                expect(data.result[0].tx.delete._id).to.eql(invoiceRecord_id);
                expect(data.result[1].tx.collection).to.eql("vouchers");
                expect(data.result[1].tx.delete._id).to.eql(voucherRecord_id);
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "invoices"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "vouchers"});
            }).then(
            function (voucherData) {
                expect(voucherData.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });


    it("server restart transaction handling case", function (done) {
        var db = undefined;
        var txid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: {"collection": "RollbackTransactions"}, $insert: [
                        {name: "Rohit"},
                        {name: "Sachin"},
                        {name: "Manjeet"},
                        {name: "Naveen"},
                        {name: "Ashu"},
                        {name: "Rajit"},
                        {name: "Bhuvnesh"},
                        {name: "Sudeep"},
                        {name: "pankaj"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection": "RollbackTransactions"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(9);
                return db.query({"$collection": "pl.txs", $filter: {txid: txid}});
            }).then(
            function (data) {
                console.log("data in pl.txs>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(9);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].status).to.eql("pending");
                expect(data.result[3].txid).to.eql(txid);
                expect(data.result[3].status).to.eql("pending");
                expect(data.result[8].txid).to.eql(txid);
                expect(data.result[8].status).to.eql("pending");
                return db.invokeFunction("Porting.manageTxs", [
                    {"rollback": true}
                ]);
            }).then(
            function () {
                return db.query({"$collection": "RollbackTransactions"});
            }).then(
            function (data) {
                console.log("data after rollbackk >>" + JSON.stringify(data));
                expect(data.result).to.have.length(0);
                return db.query({"$collection": "pl.txs", $filter: {txid: txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("server restart transaction handling case in more than one databases", function (done) {
        var db = undefined;
        var db1 = undefined;
        var db2 = undefined;
        var txid = undefined;
        var txid1 = undefined;
        var txid2 = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db11) {
                db = db11;
                return db.getAdminDB();
            }).then(
            function (adminDB) {
                return adminDB.update({$collection: "pl.dbs", $insert: [
                    {db: "db1", globalUserName: Config.OPTIONS.username, globalPassword: Config.OPTIONS.password, globalUserAdmin: true},
                    {db: "db2", globalUserName: Config.OPTIONS.username, globalPassword: Config.OPTIONS.password, globalUserAdmin: true}
                ]});
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: {"collection": "RollbackTransactions"}, $insert: [
                        {name: "Rohit"},
                        {name: "Sachin"},
                        {name: "Manjeet"},
                        {name: "Naveen"},
                        {name: "Ashu"},
                        {name: "Rajit"},
                        {name: "Bhuvnesh"},
                        {name: "Sudeep"},
                        {name: "pankaj"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection": "RollbackTransactions"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(9);
                return db.query({"$collection": "pl.txs", $filter: {txid: txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(9);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].status).to.eql("pending");
                return ApplaneDB.connect(Config.URL, "db1", Config.OPTIONS);
            }).then(
            function (db11) {
                db1 = db11;
                return db1.startTransaction();
            }).then(
            function (dbtxid) {
                txid1 = dbtxid;
                var updates = [
                    {$collection: {"collection": "RollbackTransactions1"}, $insert: [
                        {name: "Rohit"},
                        {name: "Sachin"},
                        {name: "Manjeet"},
                        {name: "Naveen"},
                        {name: "Ashu"},
                        {name: "Rajit"},
                        {name: "Bhuvnesh"},
                        {name: "Sudeep"},
                        {name: "pankaj"}
                    ]}
                ]
                return db1.update(updates);
            }).then(
            function () {
                return db1.query({"$collection": "RollbackTransactions1"});
            }).then(
            function (data) {
//                console.log("Data in rollback transactions1>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(9);
                return db1.query({"$collection": "pl.txs", $filter: {txid: txid1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(9);
                expect(data.result[0].txid).to.eql(txid1);
                expect(data.result[0].status).to.eql("pending");
                return ApplaneDB.connect(Config.URL, "db2", Config.OPTIONS);
            }).then(
            function (db11) {
                db2 = db11;
                return db2.startTransaction();
            }).then(
            function (dbtxid) {
                txid2 = dbtxid;
                var updates = [
                    {$collection: {"collection": "RollbackTransactions2"}, $insert: [
                        {name: "Rohit"},
                        {name: "Sachin"},
                        {name: "Manjeet"},
                        {name: "Naveen"},
                        {name: "Ashu"},
                        {name: "Rajit"},
                        {name: "Bhuvnesh"},
                        {name: "Sudeep"},
                        {name: "pankaj"}
                    ]}
                ]
                return db2.update(updates);
            }).then(
            function () {
                return db2.query({"$collection": "RollbackTransactions2"});
            }).then(
            function (data) {
//                console.log("Data in rollback transactions2>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(9);
                return db2.query({"$collection": "pl.txs", $filter: {txid: txid2}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(9);
                expect(data.result[0].txid).to.eql(txid2);
                expect(data.result[0].status).to.eql("pending");
                return db.invokeFunction("Porting.manageTxs", [
                    {"rollback": true}
                ]);
            }).then(
            function () {
                return db.query({"$collection": "RollbackTransactions"});
            }).then(
            function (data) {
//                console.log("data of rollback transaction after invoke function >>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {txid: txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
            }).then(
            function () {
                return db1.query({"$collection": "RollbackTransactions1"});
            }).then(
            function (data) {
//                console.log("data of rollback transaction after invoke function >>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {txid: txid1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
            }).then(
            function () {
                return db2.query({"$collection": "RollbackTransactions2"});
            }).then(
            function (data) {
//                console.log("data of rollback transaction after invoke function >>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {txid: txid2}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
            }).then(
            function () {
                return db1.dropDatabase();
            }).then(
            function () {
                return db2.dropDatabase();
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("server restart transaction handling case in more than one servers", function (done) {
        var db = undefined;
        var txid = undefined;
        var db1 = undefined;
        var txid1 = undefined;
        var CONFIG = require("../Config.js").config;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db11) {
                db = db11;
                CONFIG.SERVER_NAME = "alpha";
                return db.getAdminDB();
            }).then(
            function (adminDB) {
                return adminDB.update({$collection: "pl.dbs", $insert: [
                    {db: "db1", globalUserName: Config.OPTIONS.username, globalPassword: Config.OPTIONS.password, globalUserAdmin: true}
                ]});
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
//                console.log("txid>>>" + txid);
                var updates = [
                    {$collection: {"collection": "RollbackTransactions"}, $insert: [
                        {name: "Rohit"},
                        {name: "Sachin"},
                        {name: "Manjeet"},
                        {name: "Naveen"},
                        {name: "Ashu"},
                        {name: "Rajit"},
                        {name: "Bhuvnesh"},
                        {name: "Sudeep"},
                        {name: "pankaj"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection": "RollbackTransactions"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(9);
                return db.query({"$collection": "pl.txs", $filter: {txid: txid}});
            }).then(
            function (data) {
//                console.log("data in pl.txs in alpha server >>>" + JSON.stringify(data));
                expect(data.result).to.have.length(9);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].status).to.eql("pending");
                expect(data.result[0].serverName).to.eql("alpha");
                CONFIG.SERVER_NAME = "beta";
                return ApplaneDB.connect(Config.URL, "db1", Config.OPTIONS)
            }).then(
            function (db11) {
                db1 = db11;
                return db1.startTransaction();
            }).then(
            function (dbtxid) {
                txid1 = dbtxid;
//                console.log("txid1>" + txid1);
                var updates = [
                    {$collection: {"collection": "RollbackTransactions1"}, $insert: [
                        {name: "Rohit"},
                        {name: "Sachin"},
                        {name: "Manjeet"},
                        {name: "Naveen"},
                        {name: "Ashu"},
                        {name: "Rajit"},
                        {name: "Bhuvnesh"},
                        {name: "Sudeep"},
                        {name: "pankaj"}
                    ]}
                ]
                return db1.update(updates);
            }).then(
            function () {
                return db1.query({"$collection": "RollbackTransactions1"});
            }).then(
            function (data) {
//                console.log("Data in rollback transactions1>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(9);
                return db1.query({"$collection": "pl.txs", $filter: {txid: txid1}});
            }).then(
            function (data) {
//                console.log("Data in pl.txs>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(9);
                expect(data.result[1].txid).to.eql(txid1);
                expect(data.result[1].status).to.eql("pending");
                expect(data.result[1].serverName).to.eql("beta");
                return db1.invokeFunction("Porting.manageTxs", [
                    {"rollback": true}
                ]);
            }).then(
            function () {
                return db.query({"$collection": "RollbackTransactions1"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({"$collection": "pl.txs", $filter: {txid: txid1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                db.rollbackTransaction();
            }).then(
            function (data) {
                return db.query({$collection: "pl.txs", $filter: {txid: txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
            }).then(
            function () {
                return db.query({"$collection": "RollbackTransactions"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("insert operation with object multiple type field transaction rollback and array index not decrementing", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {"$collection": {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                            {state: "jammu", _id: "jammu", rank: 1},
                            {state: "delhi", _id: "delhi", rank: 2},
                            {state: "himachal", _id: "himachal", rank: 3},
                            {state: "punjab", _id: "punjab", rank: 4}
                        ], languages: [
                            {language: "Hindi"},
                            {language: "English"},
                            {_id: "urdu", language: "Urdu"},
                            {language: "German"}
                        ]}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: {"collection": "countries", "fields": [
                        {"field": "states", "type": "object", "multiple": true, "fields": [
                            {"field": "state", "type": "string"},
                            {"field": "rank", "type": "number"}
                        ]},
                        {"field": "languages", "type": "object", "multiple": true, "fields": [
                            {"field": "language", "type": "string"}
                        ]}
                    ]}, $update: [
                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                            {"state": "bihar", _id: "bihar", rank: 6}
                        ],
                            $update: [
                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                            ],
                            $delete: [
                                {_id: "punjab"}
                            ]
                        }, languages: {$insert: [
                            {language: "Haryanvi"}
                        ], $delete: [
                            {$query: {language: "German"}}
                        ], $update: [
                            {_id: "urdu", $set: {language: "URDU", score: 100}}
                        ]
                        }
                        }, $inc: {
                            score: 10
                        }
                        }
                    ], $modules: {"HistoryLogs": 0}
                    }
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);

                expect(data.result[0].states[3].state).to.eql("JK");
                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[2].state).to.eql("HP");
                expect(data.result[0].states[4].state).to.eql("rajasthan");
                expect(data.result[0].states[0].state).to.eql("bihar");
                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[2].rank).to.eql(23);
                expect(data.result[0].states[4].rank).to.eql(5);
                expect(data.result[0].states[0].rank).to.eql(6);

                var tx = data.result[0].__txs__[txid].tx;
//                console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                expect(tx.set).to.have.length(2);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("USA");
                expect(tx.set[1].key).to.eql("address.city");
                expect(tx.set[1].value).to.eql("hisar");

                expect(tx.inc).to.have.length(2);
                expect(tx.inc[0].key).to.eql("address.lineno");
                expect(tx.inc[0].value).to.eql(-12);
                expect(tx.inc[1].key).to.eql("score");
                expect(tx.inc[1].value).to.eql(-10);


//                console.log("***********array****************" + JSON.stringify(tx.array.length));
                expect(tx.array).to.have.length(8);

//                console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                expect(tx.array[0].field).to.eql("states");
                expect(tx.array[0].type).to.eql("update");
                expect(tx.array[0]._id).to.eql("jammu");
                expect(tx.array[0].inc).to.have.length(1);
                expect(tx.array[0].inc[0].key).to.eql("rank");
                expect(tx.array[0].inc[0].value).to.eql(-10);
                expect(tx.array[0].set).to.have.length(1);
                expect(tx.array[0].set[0].key).to.eql("state");
                expect(tx.array[0].set[0].value).to.eql("jammu");
//                console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                expect(tx.array[1].field).to.eql("states");
                expect(tx.array[1].type).to.eql("update");
                expect(tx.array[1]._id).to.eql("himachal");
                expect(tx.array[1].inc).to.have.length(1);
                expect(tx.array[1].inc[0].key).to.eql("rank");
                expect(tx.array[1].inc[0].value).to.eql(-20);
                expect(tx.array[1].set).to.have.length(1);
                expect(tx.array[1].set[0].key).to.eql("state");
                expect(tx.array[1].set[0].value).to.eql("himachal");
//                console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                expect(tx.array[2].field).to.eql("states");
                expect(tx.array[2].type).to.eql("insert");
                expect(tx.array[2]._id).to.eql("punjab");
                expect(tx.array[2].value.state).to.eql("punjab");
                expect(tx.array[2].value._id).to.eql("punjab");
                expect(tx.array[2].value.rank).to.eql(4);
//                console.log("***********array3****************" + JSON.stringify(tx.array[3]));

                expect(tx.array[3].field).to.eql("states");
                expect(tx.array[3].type).to.eql("delete");
                expect(tx.array[3]._id).to.eql("rajasthan");

//                console.log("***********array4****************" + JSON.stringify(tx.array[4]));
                expect(tx.array[4].field).to.eql("states");
                expect(tx.array[4].type).to.eql("delete");
                expect(tx.array[4]._id).to.eql("bihar");

//                console.log("***********array5****************" + JSON.stringify(tx.array[5]));
                expect(tx.array[5].field).to.eql("languages");
                expect(tx.array[5].type).to.eql("update");
                expect(tx.array[5]._id).to.eql("urdu");
                expect(tx.array[5].set).to.have.length(1);
                expect(tx.array[5].set[0].key).to.eql("language");
                expect(tx.array[5].set[0].value).to.eql("Urdu");
                expect(tx.array[5].unset).to.have.length(1);
                expect(tx.array[5].unset[0].key).to.eql("score");
                expect(tx.array[5].unset[0].value).to.eql(1);

//                console.log("tx>>>" + JSON.stringify(tx.array[6]))
                expect(tx.array[6].field).to.eql("languages");
                expect(tx.array[6].type).to.eql("insert");
                expect(tx.array[6].value.language).to.eql("German");

                expect(tx.array[7].field).to.eql("languages");
                expect(tx.array[7].type).to.eql("delete");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
//                console.log("data of transaxction>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.update._id).to.eql(1);
                var set = {};
                set["__txs__." + txid + ".tx._id"] = "1234";
                var update = [
                    {$collection: {"collection": "countries"}, $update: [
                        {$query: {_id: 1}, $set: set}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.mongoUpdate(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data after changes  are done in transaction manually" + JSON.stringify(data));
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("Data after rollback >>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("India");
                expect(data.result[0].score).to.eql(1010);
                expect(data.result[0].address.city).to.eql("Hisar1");
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].address.lineno).to.eql(13);
                expect(data.result[0].states).to.have.length(5);
                expect(data.result[0].states[3].state).to.eql("JK");
                expect(data.result[0].states[1].state).to.eql("delhi");
                expect(data.result[0].states[2].state).to.eql("HP");
                expect(data.result[0].states[4].state).to.eql("rajasthan");
                expect(data.result[0].states[0].state).to.eql("bihar");
                expect(data.result[0].states[3].rank).to.eql(11);
                expect(data.result[0].states[1].rank).to.eql(2);
                expect(data.result[0].states[2].rank).to.eql(23);
                expect(data.result[0].states[4].rank).to.eql(5);
                expect(data.result[0].states[0].rank).to.eql(6);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(
            function (err) {
                var invalidFilterError = err.toString().indexOf("Unable to rollback array updates in record   as array count is not getting decrementing in updates array") != -1;
                if (invalidFilterError) {
                    done();
                }
                else {
                    done(err);
                }
            }).fail(function (err) {
                done(err);
            })

    })


    it("Field name duplication not allowed with modifier error", function (done) {
        var db = undefined;
        var txid = undefined;
        var personId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "persons", $insert: [
                        {name: "Rohit"}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection": "persons"});
            }).then(
            function (persons) {
                personId = persons.result[0]._id;
                var updates = [
                    {$collection: "persons", $update: [
                        {_id: personId, $set: {age: 30}}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(
            function (persons) {
                var updates = [
                    {$collection: "persons", $update: [
                        {_id: personId, $unset: {age: 1}}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({"$collection": "persons"});
            }).then(
            function (persons) {
                return db.query({"$collection": "persons"});
            }).then(
            function () {
                return db.query({$collection: "pl.txs", $filter: {txid: txid}});
            }).then(
            function (txs) {
                return db.mongoUpdate({"$collection": "pl.txs", $delete: [
                    {_id: txs.result[0]._id}
                ]});
            }).then(
            function () {
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({"$collection": "persons"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("Rohit");
                expect(data.result[0].age).to.eql(undefined);
                return db.query({$collection: "pl.txs", $filter: {txid: txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })

    });


    it("override an object case transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, "address": {"city": "hisar", "state": "haryana"}}

                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"address": {city: "hansi"}}, $inc: {score: 10}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].address.city).to.eql("hansi");
                expect(data.result[0].address.state).to.eql(undefined);
                expect(data.result[0].country).to.eql("USA");
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("address");
                expect(tx.set[0].value.city).to.eql("hisar");
                expect(tx.set[0].value.state).to.eql("haryana");
                return db.query({$collection: "pl.txs", $filter: {txid: txid}});
            }).then(
            function (transactions) {
                expect(transactions.result).to.have.length(1);
                expect(transactions.result[0].txid).to.eql(txid);
                expect(transactions.result[0].tx.collection).to.eql("countries");
                expect(transactions.result[0].tx.update._id).to.eql(1);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].address.city).to.eql("hansi");
                expect(data.result[0].address.state).to.eql(undefined);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {txid: txid}});
            }).then(
            function (transactions) {
                expect(transactions.result).to.have.length(0);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            })
    })
    it("override an object case transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, "address": {"city": "hisar", "state": "haryana"}}

                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"address": {city: "hansi"}}, $inc: {score: 10}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].address.city).to.eql("hansi");
                expect(data.result[0].address.state).to.eql(undefined);
                expect(data.result[0].country).to.eql("USA");
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("address");
                expect(tx.set[0].value.city).to.eql("hisar");
                expect(tx.set[0].value.state).to.eql("haryana");
                return db.query({$collection: "pl.txs", $filter: {txid: txid}});
            }).then(
            function (transactions) {
                expect(transactions.result).to.have.length(1);
                expect(transactions.result[0].txid).to.eql(txid);
                expect(transactions.result[0].tx.collection).to.eql("countries");
                expect(transactions.result[0].tx.update._id).to.eql(1);
            }).then(
            function () {
                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].address.city).to.eql("hisar");
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {txid: txid}});
            }).then(
            function (transactions) {
                expect(transactions.result).to.have.length(0);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            })
    })

    it("First Set and then unset a object and transaction commit", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: { "address": {"city": "hisar", "state": "haryana"}}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].address.city).to.eql("hisar");
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].country).to.eql("USA");
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx.unset).to.have.length(1);
                expect(tx.unset[0].key).to.eql("address");
                expect(tx.unset[0].value).to.eql(1);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (transactions) {
                expect(transactions.result).to.have.length(1);
                expect(transactions.result[0].txid).to.eql(txid);
                expect(transactions.result[0].tx.collection).to.eql("countries");
                expect(transactions.result[0].tx.update._id).to.eql(1);
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $unset: {"address": 1}, $inc: {score: 10}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].address).to.eql(undefined);
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx.unset).to.have.length(1);
                expect(tx.unset[0].key).to.eql("address");
                expect(tx.unset[0].value).to.eql(1);
                return  db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].address).to.eql(undefined);
                expect(data.result[0].country).to.eql("USA");
            }).then(
            function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });

    it("update while unset object and its attributes in multi updates", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, "address": {"city": "hisar", "state": "haryana"}}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"address": {$unset: {"city": 1}}}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].address.city).to.eql(undefined);
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].country).to.eql("USA");
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("address.city");
                expect(tx.set[0].value).to.eql("hisar");
            }).then(
            function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (transactions) {
                expect(transactions.result).to.have.length(1);
                expect(transactions.result[0].txid).to.eql(txid);
                expect(transactions.result[0].tx.collection).to.eql("countries");
                expect(transactions.result[0].tx.update._id).to.eql(1);
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $unset: {"address": 1} }
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].address).to.eql(undefined);
                expect(data.result[0].country).to.eql("USA");
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx.set).to.have.length(2);
                expect(tx.set[0].key).to.eql("address.city");
                expect(tx.set[0].value).to.eql("hisar");
                expect(tx.set[1].key).to.eql("address");
                expect(tx.set[1].value.state).to.eql("haryana");
            }).then(
            function () {
                return  db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].address.city).to.eql("hisar");
                expect(data.result[0].address.state).to.eql("haryana");
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].__txs__).to.eql({});
            }).then(
            function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });

    it("update error while unset object and unset its attributes in a single transaction", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01", "score": 1000, "address": {"city": "hisar", "state": "haryana"}}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: "countries", $update: [
                        {_id: 1, $set: {"address": {$unset: {"city": 1}}}, $unset: {"address": 1}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                console.log("Data>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].address).to.eql(undefined);
                var tx = data.result[0].__txs__[txid].tx;
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("address");
                expect(tx.set[0].value.city).to.eql("hisar");
                expect(tx.set[0].value.state).to.eql("haryana");
            }).then(
            function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function () {
                return  db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                console.log("data in countries collection after rollback" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].address.city).to.eql("hisar")
                expect(data.result[0].address.state).to.eql("haryana")
                expect(data.result[0].__txs__).to.eql({})
            }).then(
            function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });

    it("case when set  __txs__ and unset  __txs__.xxxx are in same updates ", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection: "newcountries", $insert: [
                        {_id: 1, country: "USA", "__txs__": {}},
                        {_id: 2, country: "India", "__txs__": {}}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.collection("newcountries");
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (txid1) {
                txid = txid1;
                return db.collection("newcountries");
            }).then(
            function () {
                var update = [
                    {$collection: "newcountries", $update: [
                        {_id: 2, $set: { "country": "USA", __txs__: 1}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection: "newcountries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[1].country).to.eql("USA");
                var tx = data.result[1].__txs__[txid].tx;
                expect(tx.set).to.have.length(1);
                expect(tx.set[0].key).to.eql("country");
                expect(tx.set[0].value).to.eql("India");
            }).then(
            function () {
                return  db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "newcountries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[1].country).to.eql("India");
                expect(data.result[1].__txs__).to.eql({});
                return db.query({$collection: "pl.txs"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
            }).then(
            function (data) {
                done();
            }).fail(function (err) {
                done(err);
            })

    })

    it("insert multiple records with same _id and record should not be deleted", function (done) {
        var db = undefined;
        var txid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].status).to.eql("pending");
                expect(data.result[0].user.username).to.eql("guest");
                expect(data.result[0].tx.collection).to.eql("countries");
                expect(data.result[0].tx.delete).to.have.property("_id");
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.startTransaction();
            }).then(
            function (txid1) {
                txid = txid1;
                var updates = [
                    {$collection: "countries", $insert: [
                        {_id: 1, country: "USA", code: "01"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                if (err.toString().indexOf("MongoError: insertDocument :: caused by :: 11000 E11000 duplicate key error index: northwindtestcases.countries") !== -1) {
                    return db.query({$collection: "countries"}).then(function (data) {
                        expect(data.result).to.have.length(1);
                        done();
                    })
                } else {
                    done(err);
                }
            }).fail(function (err) {
                done(err);
            });
    });


    it("set efforts at update and then set efforts.time transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: {collection: "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "efforts", type: "duration"}
                    ]}, $insert: [
                        {_id: 1, task: "testing"}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: {collection: "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "efforts", type: "duration"}
                    ]}, $update: [
                        {_id: 1, $set: {efforts: {time: 10, unit: "Hrs"}}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                var update = [
                    {$collection: {collection: "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "efforts", type: "duration"}
                    ]}, $update: [
                        {_id: 1, $set: {efforts: {$set: {time: 20}}}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(function () {
                return db.query({$collection: "tasks"});
            }).then(
            function (data) {
//                console.log("data of countries after update>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].task).to.eql("testing");
                expect(data.result[0].efforts.time).to.eql(20);
                expect(data.result[0].efforts.unit).to.eql("Hrs");
                expect(data.result[0].efforts.convertedvalue).to.eql(1200);

                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "tasks"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].task).to.eql("testing");
                expect(data.result[0].efforts).to.eql(undefined);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("set efforts.time and then set efforts transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: {collection: "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "efforts", type: "duration"}
                    ]}, $insert: [
                        {_id: 1, task: "testing", efforts: {time: 10, unit: "Hrs"}}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: {collection: "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "efforts", type: "duration"}
                    ]}, $update: [
                        {_id: 1, $set: {efforts: {$set: {time: 20}}}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                var update = [
                    {$collection: {collection: "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "efforts", type: "duration"}
                    ]}, $update: [
                        {_id: 1, $set: {efforts: {time: 30, unit: "Hrs"}}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(function () {
                return db.query({$collection: "tasks"});
            }).then(
            function (data) {
//                console.log("data of countries after update>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].task).to.eql("testing");
                expect(data.result[0].efforts.time).to.eql(30);
                expect(data.result[0].efforts.unit).to.eql("Hrs");
                expect(data.result[0].efforts.convertedvalue).to.eql(1800);

                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "tasks"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].task).to.eql("testing");
                expect(data.result[0].efforts.time).to.eql(10);
                expect(data.result[0].efforts.unit).to.eql("Hrs");
                expect(data.result[0].efforts.convertedvalue).to.eql(600);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("set efforts and then set efforts.time transaction rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: {collection: "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "efforts", type: "duration"}
                    ]}, $insert: [
                        {_id: 1, task: "testing", efforts: {time: 10, unit: "Hrs"}}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.commitTransaction();
            }).then(
            function () {
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var update = [
                    {$collection: {collection: "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "efforts", type: "duration"}
                    ]}, $update: [
                        {_id: 1, $set: {efforts: {time: 30, unit: "Hrs"}}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(
            function () {
                var update = [
                    {$collection: {collection: "tasks", fields: [
                        {field: "task", type: "string"},
                        {field: "efforts", type: "duration"}
                    ]}, $update: [
                        {_id: 1, $set: {efforts: {$set: {time: 20}}}}
                    ], $modules: {"HistoryLogs": 0}}
                ];
                return db.update(update);
            }).then(function () {
                return db.query({$collection: "tasks"});
            }).then(
            function (data) {
//                console.log("data of countries after update>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].task).to.eql("testing");
                expect(data.result[0].efforts.time).to.eql(20);
                expect(data.result[0].efforts.unit).to.eql("Hrs");
                expect(data.result[0].efforts.convertedvalue).to.eql(1200);

                return db.rollbackTransaction();
            }).then(
            function () {
                return db.query({$collection: "tasks"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].task).to.eql("testing");
                expect(data.result[0].efforts.time).to.eql(10);
                expect(data.result[0].efforts.unit).to.eql("Hrs");
                expect(data.result[0].efforts.convertedvalue).to.eql(600);
                expect(data.result[0].__txs__).to.eql({});
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });


    it.skip("cancel document testcase in insert case pre job", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        var eent = undefined;
        AppaneDBconnect(Config.URL, Config.DB, Config.OPTIONS).hen(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var modifyPerson = {   name: "cancelDocument", source: "NorthwindTestCase/lib/PersonJob"};
                var event = [
                    {
                        function: modifyPerson,
                        event: "onSave",
                        pre: true
                    }
                ];
                var updates = [
                    {$collection: {collection: "countries", events: event}, $insert: [
                        {_id: 1, country: "USA", code: "01"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data after insert>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"_id": txid}});
            }).then(
            function (data) {
//                console.log("data in transactoins>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].updates).to.have.length(0)
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"_id": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it.skip("cancel document testcase in update case", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordTxid = undefined;
        var event = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var modifyPerson = {   name: "cancelDocumentUpdate", source: "NorthwindTestCase/lib/PersonJob"};
                var event = [
                    {
                        functionName: modifyPerson,
                        event: "onSave",
                        pre: true
                    }
                ];
                var updates = [
                    {$collection: {collection: "countries", events: event}, $insert: [
                        {_id: 1, country: "USA", code: "01"}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("data after insert>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                return db.query({$collection: "pl.txs", $filter: {"_id": txid}});
            }).then(
            function (data) {
//                console.log("data in transactions>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].txid).to.eql(txid);
                expect(data.result[0].updates).to.have.length(1);
                var txUpdates = data.result[0].updates;
                var tx = txUpdates[0].tx;
//                console.log("tx>>>>>" + JSON.stringify(tx));
                expect(tx.collection).to.eql("countries");
                var updates = [
                    {$collection: {collection: "countries", triggers: trigger}, $update: [
                        {_id: 1, $set: {country: "INDIA"}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("Data after updation>>>>>>>>>>>>>>>>>>>>>." + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].country).to.eql("USA");
                return db.query({$collection: "pl.txs", $filter: {"_id": txid}});
            }).then(
            function (data) {
//                console.log("transaction>>>>>>>>>>>.." + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "countries"});
            }).then(
            function (data) {
//                console.log("Data after updation>>>>>>>>>>>>>>>>>>>>>." + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                return db.query({$collection: "pl.txs", $filter: {"_id": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });

        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var modifyPerson = {   name: "cancelDocumentUpdate", source: "NorthwindTestCase/lib/PersonJob"};
            var event = [
                {
                    functionName: modifyPerson,
                    event: "onSave",
                    pre: true
                }
            ];
            var updates = [
                {$collection: {collection: "countries", events: event}, $insert: [
                    {_id: 1, country: "USA", code: "01"}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.update(updates, function (err) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return
                        }
//                        console.log("data after insert>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);

                        db.query({$collection: "pl.txs"}, function (err, data) {
                            if (err) {
                                done(err);
                                return;
                            }
//                            console.log("data in transactions>>>" + JSON.stringify(data));
                            expect(data.result).to.have.length(1);
                            expect(data.result[0].txid).to.eql(txid);
                            expect(data.result[0].updates).to.have.length(1);
                            var txUpdates = data.result[0].updates;
                            var tx = txUpdates[0].tx;
//                            console.log("tx>>>>>" + JSON.stringify(tx));
                            expect(tx.collection).to.eql("countries");
                            var updates = [
                                {$collection: {collection: "countries", triggers: trigger}, $update: [
                                    {_id: 1, $set: {country: "INDIA"}}
                                ]}
                            ];
                            db.update(updates, function (err) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                db.query({$collection: "countries"}, function (err, data) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
//                                    console.log("Data after updation>>>>>>>>>>>>>>>>>>>>>." + JSON.stringify(data));
                                    expect(data.result).to.have.length(1);
                                    expect(data.result[0].country).to.eql("USA");
                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
//                                        console.log("transaction>>>>>>>>>>>.." + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        db.commitTransaction(function (err) {
                                            if (err) {
                                                done(err);
                                                return
                                            }
                                            db.query({$collection: "countries"}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }
//                                                console.log("Data after updation>>>>>>>>>>>>>>>>>>>>>." + JSON.stringify(data));
                                                expect(data.result).to.have.length(1);
                                                db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
//                                                    console.log("transaction>>>>>>>>>>>.." + JSON.stringify(data));
                                                    expect(data.result).to.have.length(0);
                                                    done();
                                                });
                                            });
                                        });
                                    });
                                });
                            });


                        });
                    });
                });
            });
        })
    });
// array
    it.skip("insert and delete  2 instances of same db both rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "india", rank: 22, states: [
                        {"_id": "haryana", state: "haryana"},
                        {"_id": "punjab", state: "punjab"},
                        {"_id": "bihar", state: "bihar"}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.update(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("india");
                        expect(data.result[0].rank).to.eql(22);
                        expect(data.result[0].states).to.have.length(3);
                        expect(data.result[0].states[0].state).to.eql("haryana");
                        expect(data.result[0].states[1].state).to.eql("punjab");
                        expect(data.result[0].states[2].state).to.eql("bihar");


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS, function (err, db1) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {states: {$insert: [
                                            {state: "jammu", _id: "jammu"},
                                            {state: "gujrat", _id: "gujrat"}
                                        ], $delete: [
                                            {_id: "bihar"}
                                        ]}}}
                                    ]}
                                ];
                                db1.startTransaction(function (err, txid) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db1.update(update, function (err, result) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        db1.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].states).to.eql(4);


                                            var expectedUpdates = [
                                                {$collection: "countries", $update: [
                                                    {_id: 1, $set: {states: {$insert: [
                                                        {state: "jammu", _id: "jammu"},
                                                        {state: "gujrat", _id: "gujrat"}
                                                    ], $delete: [
                                                        {_id: "bihar"}
                                                    ]}}}
                                                ], $push: {__txs__: {$each: [
                                                    {txid: txid, tx: {_id: 1, $set: {states: {$insert: [
                                                        {_id: "bihar", state: "bihar"}
                                                    ], $delete: [
                                                        {_id: "gujrat"},
                                                        {_id: "jammu"}
                                                    ]}}}}
                                                ]}}}
                                            ];


                                            expect(data.result[0].__txs__).to.have.length(1);
                                            expect(data.result[0].__txs__[0].txid).to.eql(txid);
                                            var tx = JSON.parse(data.result[0].__txs__[0].tx);
                                            expect(tx._id).to.eql(1);
                                            expect(tx.$set.states.$insert).to.have.length(1);
                                            expect(tx.$set.states.$insert[0]._id).to.eql("bihar");
                                            expect(tx.$set.states.$insert[0].state).to.eql("bihar");
                                            expect(tx.$set.states.$delete).to.have.length(2);
                                            expect(tx.$set.states.$delete[1]._id).to.eql("gujart");
                                            expect(tx.$set.states.$delete[0]._id).to.eql("jammu");

                                            db1.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }

                                                var expectedTransactions =
                                                {_id: "1", txid: txid, updates: [
                                                    {tx: {$collection: "countries", $update: [
                                                        {_id: 1}
                                                    ]}}
                                                ]};
                                                expect(data.result).to.have.length(1);
                                                expect(data.result[0].txid).to.eql(txid);
                                                expect(data.result[0].updates).to.have.length(1);
                                                var txUpdates = data.result[0].updates;
                                                var tx = JSON.parse(txUpdates[0].tx);
                                                expect(tx.$collection).to.eql("countries");
                                                expect(tx.$update).to.have.length(1);
                                                expect(tx.$update[0]._id).to.eql(1);
                                                ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS, function (err, db2) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    db2.startTransaction(function (err, txid2) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        var newUpdate = [
                                                            {$collection: "countries", $update: [
                                                                {_id: 1, $set: {states: {$insert: [
                                                                    {_id: "chennai", state: "chennai"},
                                                                    {_id: "mumbai", state: "mumbai"}
                                                                ], $delete: [
                                                                    {_id: "punjab"}
                                                                ]}}}
                                                            ]}
                                                        ];

                                                        db2.update(newUpdate, function (err, result) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            db2.query({$collection: "countries"}, function (err, data) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                expect(data.result).to.have.length(1);
                                                                expect(data.result[0].states).to.eql(5);

                                                                var expectedUpdates = [
                                                                    {$collection: "countries", $update: [
                                                                        {_id: 1, $set: {states: {$insert: [
                                                                            {_id: "chennai", state: "chennai"},
                                                                            {_id: "mumbai", state: "mumbai"}
                                                                        ], $delete: [
                                                                            {_id: "punjab"}
                                                                        ]}}}
                                                                    ], $push: {__txs__: {$each: [
                                                                        {txid: txid, tx: {_id: 1, $set: {states: {$insert: [
                                                                            {_id: "punjab", state: "punjab"}
                                                                        ], $delete: [
                                                                            {_id: "chennai"},
                                                                            {_id: "mumbai"}
                                                                        ]}}}}
                                                                    ]}}}
                                                                ];


                                                                expect(data.result[0].__txs__).to.have.length(2);
                                                                expect(data.result[0].__txs__[1].txid).to.eql(txid2);
                                                                var tx = JSON.parse(data.result[0].__txs__[1].tx);
                                                                expect(tx._id).to.eql(1);
                                                                expect(tx.$set.states.$insert).to.have.length(1);
                                                                expect(tx.$set.states.$insert[0]._id).to.eql("punjab");
                                                                expect(tx.$set.states.$insert[0].state).to.eql("punjab");
                                                                expect(tx.$set.states.$delete).to.have.length(2);
                                                                expect(tx.$set.states.$delete[0]._id).to.eql("chennai");
                                                                expect(tx.$set.states.$delete[1]._id).to.eql("mumbai");


                                                                db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                    if (err) {
                                                                        done(err);
                                                                        return;
                                                                    }
                                                                    var transactions =
                                                                    {_id: "1", txid: txid, updates: [
                                                                        {tx: {$collection: "countries", $update: [
                                                                            {_id: 1}
                                                                        ]}}
                                                                    ]};

                                                                    expect(data.result).to.have.length(2);
                                                                    expect(data.result[1].txid).to.eql(txid2);
                                                                    expect(data.result[1].updates).to.have.length(1);
                                                                    var txUpdates = data.result[1].updates;
                                                                    var tx = JSON.parse(txUpdates[0].tx);
                                                                    expect(tx.$collection).to.eql("countries");
                                                                    expect(tx.$update).to.have.length(1);
                                                                    expect(tx.$update[0]._id).to.eql(1);


                                                                    db1.commitTransaction(function (err) {
                                                                        if (err) {
                                                                            done(err);
                                                                            return;
                                                                        }
                                                                        db1.query({$collection: "countries"}, function (err, data) {
                                                                            if (err) {
                                                                                done(err);
                                                                                return;
                                                                            }
                                                                            expect(data.result).to.have.length(1);
                                                                            expect(data.result[0].states).to.have.length(4);
                                                                            db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                if (err) {
                                                                                    done(err);
                                                                                    return;
                                                                                }
                                                                                expect(data.result).to.have.length(0);
                                                                                expect(data.result[0].states).to.have.length(3);
                                                                                expect(data.result[0].states[0].state).to.eql("haryana")
                                                                                expect(data.result[0].states[1].state).to.eql("punjab")
                                                                                expect(data.result[0].states[2].state).to.eql("bihar")

                                                                                db2.rollbackTransaction(function (err) {
                                                                                    if (err) {
                                                                                        done(err);
                                                                                        return;
                                                                                    }
                                                                                    db2.query({$collection: "countries"}, function (err, data) {
                                                                                        if (err) {
                                                                                            done(err);
                                                                                            return;
                                                                                        }
                                                                                        expect(data.result).to.have.length(1);
                                                                                        expect(data.result[0].states).to.have.length(3);
                                                                                        expect(data.result[0].states[0].state).to.eql("haryana")
                                                                                        expect(data.result[0].states[1].state).to.eql("punjab")
                                                                                        expect(data.result[0].states[2].state).to.eql("bihar");

                                                                                        db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                            if (err) {
                                                                                                done(err);
                                                                                                return;
                                                                                            }
                                                                                            expect(data.result).to.have.length(0);
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });


                                                                    })
                                                                });
                                                            })
                                                        });

                                                    });
                                                });
                                            });
                                        });
                                    })
                                })
                            });
                        });
                    });
                })
            });
        });
    });
    it.skip("insert and delete from  2 instances of same db one commit and one  rollback", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "india", rank: 22, states: [
                        {"_id": "haryana", state: "haryana"},
                        {"_id": "punjab", state: "punjab"},
                        {"_id": "bihar", state: "bihar"}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.update(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("india");
                        expect(data.result[0].rank).to.eql(22);
                        expect(data.result[0].states).to.have.length(3);
                        expect(data.result[0].states[0].state).to.eql("haryana");
                        expect(data.result[0].states[1].state).to.eql("punjab");
                        expect(data.result[0].states[2].state).to.eql("bihar");


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS, function (err, db1) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {states: {$insert: [
                                            {state: "jammu", _id: "jammu"},
                                            {state: "gujrat", _id: "gujrat"}
                                        ], $delete: [
                                            {_id: "bihar"}
                                        ]}}}
                                    ]}
                                ];
                                db1.startTransaction(function (err, txid) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db1.update(update, function (err, result) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        db1.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].states).to.eql(4);


                                            var expectedUpdates = [
                                                {$collection: "countries", $update: [
                                                    {_id: 1, $set: {states: {$insert: [
                                                        {state: "jammu", _id: "jammu"},
                                                        {state: "gujrat", _id: "gujrat"}
                                                    ], $delete: [
                                                        {_id: "bihar"}
                                                    ]}}}
                                                ], $push: {__txs__: {$each: [
                                                    {txid: txid, tx: {_id: 1, $set: {states: {$insert: [
                                                        {_id: "bihar", state: "bihar"}
                                                    ], $delete: [
                                                        {_id: "gujrat"},
                                                        {_id: "jammu"}
                                                    ]}}}}
                                                ]}}}
                                            ];


                                            expect(data.result[0].__txs__).to.have.length(1);
                                            expect(data.result[0].__txs__[0].txid).to.eql(txid);
                                            var tx = JSON.parse(data.result[0].__txs__[0].tx);
                                            expect(tx._id).to.eql(1);
                                            expect(tx.$set.states.$insert).to.have.length(1);
                                            expect(tx.$set.states.$insert[0]._id).to.eql("bihar");
                                            expect(tx.$set.states.$insert[0].state).to.eql("bihar");
                                            expect(tx.$set.states.$delete).to.have.length(2);
                                            expect(tx.$set.states.$delete[0]._id).to.eql("gujart");
                                            expect(tx.$set.states.$delete[1]._id).to.eql("jammu");

                                            db1.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }

                                                var expectedTransactions =
                                                {_id: "1", txid: txid, updates: [
                                                    {tx: {$collection: "countries", $update: [
                                                        {_id: 1}
                                                    ]}}
                                                ]};
                                                expect(data.result).to.have.length(1);
                                                expect(data.result[0].txid).to.eql(txid);
                                                expect(data.result[0].updates).to.have.length(1);
                                                var txUpdates = data.result[0].updates;
                                                var tx = JSON.parse(txUpdates[0].tx);
                                                expect(tx.$collection).to.eql("countries");
                                                expect(tx.$update).to.have.length(1);
                                                expect(tx.$update[0]._id).to.eql(1);
                                                ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS, function (err, db2) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    db2.startTransaction(function (err, txid2) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        var newUpdate = [
                                                            {$collection: "countries", $update: [
                                                                {_id: 1, $set: {states: {$insert: [
                                                                    {_id: "chennai", state: "chennai"},
                                                                    {_id: "mumbai", state: "mumbai"}
                                                                ], $delete: [
                                                                    {_id: "punjab"}
                                                                ]}}}
                                                            ]}
                                                        ];

                                                        db2.update(newUpdate, function (err, result) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            db2.query({$collection: "countries"}, function (err, data) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                expect(data.result).to.have.length(1);
                                                                expect(data.result[0].states).to.eql(5);

                                                                var expectedUpdates = [
                                                                    {$collection: "countries", $update: [
                                                                        {_id: 1, $set: {states: {$insert: [
                                                                            {_id: "chennai", state: "chennai"},
                                                                            {_id: "mumbai", state: "mumbai"}
                                                                        ], $delete: [
                                                                            {_id: "punjab"}
                                                                        ]}}}
                                                                    ], $push: {__txs__: {$each: [
                                                                        {txid: txid, tx: {_id: 1, $set: {states: {$insert: [
                                                                            {_id: "punjab", state: "punjab"}
                                                                        ], $delete: [
                                                                            {_id: "chennai"},
                                                                            {_id: "mumbai"}
                                                                        ]}}}}
                                                                    ]}}}
                                                                ];


                                                                expect(data.result[0].__txs__).to.have.length(2);
                                                                expect(data.result[0].__txs__[1].txid).to.eql(txid2);
                                                                var tx = JSON.parse(data.result[0].__txs__[1].tx);
                                                                expect(tx._id).to.eql(1);
                                                                expect(tx.$set.states.$insert).to.have.length(1);
                                                                expect(tx.$set.states.$insert[0]._id).to.eql("punjab");
                                                                expect(tx.$set.states.$insert[0].state).to.eql("punjab");
                                                                expect(tx.$set.states.$delete).to.have.length(2);
                                                                expect(tx.$set.states.$delete[0]._id).to.eql("chennai");
                                                                expect(tx.$set.states.$delete[1]._id).to.eql("mumbai");


                                                                db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                    if (err) {
                                                                        done(err);
                                                                        return;
                                                                    }
                                                                    var transactions =
                                                                    {_id: "1", txid: txid, updates: [
                                                                        {tx: {$collection: "countries", $update: [
                                                                            {_id: 1}
                                                                        ]}}
                                                                    ]};

                                                                    expect(data.result).to.have.length(2);
                                                                    expect(data.result[1].txid).to.eql(txid2);
                                                                    expect(data.result[1].updates).to.have.length(1);
                                                                    var txUpdates = data.result[1].updates;
                                                                    var tx = JSON.parse(txUpdates[0].tx);
                                                                    expect(tx.$collection).to.eql("countries");
                                                                    expect(tx.$update).to.have.length(1);
                                                                    expect(tx.$update[0]._id).to.eql(1);


                                                                    db1.commitTransaction(function (err) {
                                                                        if (err) {
                                                                            done(err);
                                                                            return;
                                                                        }
                                                                        db1.query({$collection: "countries"}, function (err, data) {
                                                                            if (err) {
                                                                                done(err);
                                                                                return;
                                                                            }
                                                                            expect(data.result).to.have.length(1);
                                                                            expect(data.result[0].states).to.have.length(4);
                                                                            db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                if (err) {
                                                                                    done(err);
                                                                                    return;
                                                                                }
                                                                                expect(data.result).to.have.length(0);
                                                                                expect(data.result[0].states).to.have.length(4);
                                                                                expect(data.result[0].states[0].state).to.eql("haryana")
                                                                                expect(data.result[0].states[1].state).to.eql("punjab")
                                                                                expect(data.result[0].states[2].state).to.eql("gujrat")
                                                                                expect(data.result[0].states[3].state).to.eql("jammu")
                                                                                db2.rollbackTransaction(function (err) {
                                                                                    if (err) {
                                                                                        done(err);
                                                                                        return;
                                                                                    }
                                                                                    db2.query({$collection: "countries"}, function (err, data) {
                                                                                        if (err) {
                                                                                            done(err);
                                                                                            return;
                                                                                        }
                                                                                        expect(data.result).to.have.length(1);
                                                                                        expect(data.result[0].states).to.have.length(4);
                                                                                        expect(data.result[0].states[0].state).to.eql("haryana")
                                                                                        expect(data.result[0].states[1].state).to.eql("punjab")
                                                                                        expect(data.result[0].states[2].state).to.eql("gujrat")
                                                                                        expect(data.result[0].states[3].state).to.eql("jammu")


                                                                                        db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                            if (err) {
                                                                                                done(err);
                                                                                                return;
                                                                                            }
                                                                                            expect(data.result).to.have.length(0);
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });


                                                                    })
                                                                });
                                                            })
                                                        });

                                                    });
                                                });
                                            });
                                        });
                                    })
                                })
                            });
                        });
                    });
                })
            });
        });
    });
    it.skip("insert and delete  2 instances of same db both commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var updates = [
                {$collection: "countries", $insert: [
                    {_id: 1, country: "india", rank: 22, states: [
                        {"_id": "haryana", state: "haryana"},
                        {"_id": "punjab", state: "punjab"},
                        {"_id": "bihar", state: "bihar"}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                db.update(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("india");
                        expect(data.result[0].rank).to.eql(22);
                        expect(data.result[0].states).to.have.length(3);
                        expect(data.result[0].states[0].state).to.eql("haryana");
                        expect(data.result[0].states[1].state).to.eql("punjab");
                        expect(data.result[0].states[2].state).to.eql("bihar");


                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS, function (err, db1) {
                                if (err) {
                                    done(err);
                                    return;
                                }
                                var update = [
                                    {$collection: "countries", $update: [
                                        {_id: 1, $set: {states: {$insert: [
                                            {state: "jammu", _id: "jammu"},
                                            {state: "gujrat", _id: "gujrat"}
                                        ], $delete: [
                                            {_id: "bihar"}
                                        ]}}}
                                    ]}
                                ];
                                db1.startTransaction(function (err, txid) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db1.update(update, function (err, result) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
                                        db1.query({$collection: "countries"}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].states).to.eql(4);


                                            var expectedUpdates = [
                                                {$collection: "countries", $update: [
                                                    {_id: 1, $set: {states: {$insert: [
                                                        {state: "jammu", _id: "jammu"},
                                                        {state: "gujrat", _id: "gujrat"}
                                                    ], $delete: [
                                                        {_id: "bihar"}
                                                    ]}}}
                                                ], $push: {__txs__: {$each: [
                                                    {txid: txid, tx: {_id: 1, $set: {states: {$insert: [
                                                        {_id: "bihar", state: "bihar"}
                                                    ], $delete: [
                                                        {_id: "jammu"},
                                                        {_id: "gujrat"}
                                                    ]}}}}
                                                ]}}}
                                            ];


                                            expect(data.result[0].__txs__).to.have.length(1);
                                            expect(data.result[0].__txs__[0].txid).to.eql(txid);
                                            var tx = JSON.parse(data.result[0].__txs__[0].tx);
                                            expect(tx._id).to.eql(1);
                                            expect(tx.$set.states.$insert).to.have.length(1);
                                            expect(tx.$set.states.$insert[0]._id).to.eql("bihar");
                                            expect(tx.$set.states.$insert[0].state).to.eql("bihar");
                                            expect(tx.$set.states.$delete).to.have.length(2);
                                            expect(tx.$set.states.$delete[1]._id).to.eql("gujart");
                                            expect(tx.$set.states.$delete[0]._id).to.eql("jammu");

                                            db1.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                if (err) {
                                                    done(err);
                                                    return;
                                                }

                                                var expectedTransactions =
                                                {_id: "1", txid: txid, updates: [
                                                    {tx: {$collection: "countries", $update: [
                                                        {_id: 1}
                                                    ]}}
                                                ]};
                                                expect(data.result).to.have.length(1);
                                                expect(data.result[0].txid).to.eql(txid);
                                                expect(data.result[0].updates).to.have.length(1);
                                                var txUpdates = data.result[0].updates;
                                                var tx = JSON.parse(txUpdates[0].tx);
                                                expect(tx.$collection).to.eql("countries");
                                                expect(tx.$update).to.have.length(1);
                                                expect(tx.$update[0]._id).to.eql(1);
                                                ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS, function (err, db2) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
                                                    db2.startTransaction(function (err, txid2) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        var newUpdate = [
                                                            {$collection: "countries", $update: [
                                                                {_id: 1, $set: {states: {$insert: [
                                                                    {_id: "chennai", state: "chennai"},
                                                                    {_id: "mumbai", state: "mumbai"}
                                                                ], $delete: [
                                                                    {_id: "punjab"}
                                                                ]}}}
                                                            ]}
                                                        ];

                                                        db2.update(newUpdate, function (err, result) {
                                                            if (err) {
                                                                done(err);
                                                                return;
                                                            }
                                                            db2.query({$collection: "countries"}, function (err, data) {
                                                                if (err) {
                                                                    done(err);
                                                                    return;
                                                                }
                                                                expect(data.result).to.have.length(1);
                                                                expect(data.result[0].states).to.eql(5);

                                                                var expectedUpdates = [
                                                                    {$collection: "countries", $update: [
                                                                        {_id: 1, $set: {states: {$insert: [
                                                                            {_id: "chennai", state: "chennai"},
                                                                            {_id: "mumbai", state: "mumbai"}
                                                                        ], $delete: [
                                                                            {_id: "punjab"}
                                                                        ]}}}
                                                                    ], $push: {__txs__: {$each: [
                                                                        {txid: txid, tx: {_id: 1, $set: {states: {$insert: [
                                                                            {_id: "punjab", state: "punjab"}
                                                                        ], $delete: [
                                                                            {_id: "chennai"},
                                                                            {_id: "mumbai"}
                                                                        ]}}}}
                                                                    ]}}}
                                                                ];


                                                                expect(data.result[0].__txs__).to.have.length(2);
                                                                expect(data.result[0].__txs__[1].txid).to.eql(txid2);
                                                                var tx = JSON.parse(data.result[0].__txs__[1].tx);
                                                                expect(tx._id).to.eql(1);
                                                                expect(tx.$set.states.$insert).to.have.length(1);
                                                                expect(tx.$set.states.$insert[0]._id).to.eql("punjab");
                                                                expect(tx.$set.states.$insert[0].state).to.eql("punjab");
                                                                expect(tx.$set.states.$delete).to.have.length(2);
                                                                expect(tx.$set.states.$delete[0]._id).to.eql("chennai");
                                                                expect(tx.$set.states.$delete[1]._id).to.eql("mumbai");


                                                                db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                    if (err) {
                                                                        done(err);
                                                                        return;
                                                                    }
                                                                    var transactions =
                                                                    {_id: "1", txid: txid, updates: [
                                                                        {tx: {$collection: "countries", $update: [
                                                                            {_id: 1}
                                                                        ]}}
                                                                    ]};

                                                                    expect(data.result).to.have.length(2);
                                                                    expect(data.result[1].txid).to.eql(txid2);
                                                                    expect(data.result[1].updates).to.have.length(1);
                                                                    var txUpdates = data.result[1].updates;
                                                                    var tx = JSON.parse(txUpdates[0].tx);
                                                                    expect(tx.$collection).to.eql("countries");
                                                                    expect(tx.$update).to.have.length(1);
                                                                    expect(tx.$update[0]._id).to.eql(1);


                                                                    db1.commitTransaction(function (err) {
                                                                        if (err) {
                                                                            done(err);
                                                                            return;
                                                                        }
                                                                        db1.query({$collection: "countries"}, function (err, data) {
                                                                            if (err) {
                                                                                done(err);
                                                                                return;
                                                                            }
                                                                            expect(data.result).to.have.length(1);
                                                                            expect(data.result[0].states).to.have.length(4);
                                                                            db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                if (err) {
                                                                                    done(err);
                                                                                    return;
                                                                                }
                                                                                expect(data.result).to.have.length(0);
                                                                                expect(data.result[0].states).to.have.length(4);
                                                                                expect(data.result[0].states[0].state).to.eql("haryana")
                                                                                expect(data.result[0].states[1].state).to.eql("punjab")
                                                                                expect(data.result[0].states[3].state).to.eql("gujrat")
                                                                                expect(data.result[0].states[2].state).to.eql("jammu")
                                                                                db2.commitTransaction(function (err) {
                                                                                    if (err) {
                                                                                        done(err);
                                                                                        return;
                                                                                    }
                                                                                    db2.query({$collection: "countries"}, function (err, data) {
                                                                                        if (err) {
                                                                                            done(err);
                                                                                            return;
                                                                                        }
                                                                                        expect(data.result).to.have.length(1);
                                                                                        expect(data.result[0].states).to.have.length(5);
                                                                                        expect(data.result[0].states[0].state).to.eql("haryana")
                                                                                        expect(data.result[0].states[2].state).to.eql("gujrat")
                                                                                        expect(data.result[0].states[1].state).to.eql("jammu")
                                                                                        expect(data.result[0].states[3].state).to.eql("chennai")
                                                                                        expect(data.result[0].states[4].state).to.eql("mumbai")


                                                                                        db2.query({$collection: "pl.txs", $filter: {"_id": txid2}}, function (err, data) {
                                                                                            if (err) {
                                                                                                done(err);
                                                                                                return;
                                                                                            }
                                                                                            expect(data.result).to.have.length(0);
                                                                                        });
                                                                                    });
                                                                                });
                                                                            });
                                                                        });


                                                                    })
                                                                });
                                                            })
                                                        });

                                                    });
                                                });
                                            });
                                        });
                                    })
                                })
                            });
                        });
                    });
                })
            });
        });
    });
    it.skip("throw error when inc in array with insert or delete");
    it.skip("first insert and then delete in same transaction in array");
    it.skip("insert and delete  operation from trigger in object multiple type field transaction commit", function (done) {
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS, function (err, db) {
            if (err) {
                done(err);
                return;
            }
            var onInsert = {   name: "onInsert", code: "preInsert", source: "NorthwindTestCase/lib/PersonJob"};
            var trigger = [
                {
                    functionName: onInsert,
                    operations: ["update"],
                    when: "pre"
                }
            ];
            var updates = [
                {"$collection": {"collection": "countries", triggers: trigger, "fields": [
                    {"field": "states", "type": "object", "multiple": true, sort: "rank", "fields": [
                        {"field": "state", "type": "string"},
                        {"field": "rank", "type": "number"}
                    ]}
                ]}, $insert: [
                    {_id: 1, country: "USA", code: "01", "score": 1000, address: {city: "hisar", state: "haryana", "lineno": 1}, states: [
                        {state: "jammu", _id: "jammu", rank: 1},
                        {state: "delhi", _id: "delhi", rank: 2},
                        {state: "himachal", _id: "himachal", rank: 3},
                        {state: "punjab", _id: "punjab", rank: 4}
                    ]}
                ]}
            ];
            db.startTransaction(function (err, txid) {
                if (err) {
                    done(err);
                    return;
                }
                db.update(updates, function (err, result) {
                    if (err) {
                        done(err);
                        return;
                    }
                    db.query({$collection: "countries"}, function (err, data) {
                        if (err) {
                            done(err);
                            return;
                        }
//                        console.log("data>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].country).to.eql("USA");
                        expect(data.result[0].code).to.eql("01");
                        expect(data.result[0].score).to.eql(1000);
                        expect(data.result[0].address.city).to.eql("hisar");
                        expect(data.result[0].address.state).to.eql("haryana");
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].address.lineno).to.eql(1);
                        expect(data.result[0].states).to.have.length(4);
                        expect(data.result[0].states[0].state).to.eql("jammu");
                        expect(data.result[0].states[0].rank).to.eql(1);
                        expect(data.result[0].states[1].state).to.eql("delhi");
                        expect(data.result[0].states[1].rank).to.eql(2);
                        expect(data.result[0].states[2].state).to.eql("himachal");
                        expect(data.result[0].states[2].rank).to.eql(3);
                        expect(data.result[0].states[3].state).to.eql("punjab");
                        expect(data.result[0].states[3].rank).to.eql(4);
                        db.commitTransaction(function (err) {
                            if (err) {
                                done(err);
                                return;
                            }
                            db.startTransaction(function (err, txid) {
                                var update = [
                                    {$collection: {"collection": "countries", triggers: trigger, "fields": [
                                        {"field": "states", "type": "object", "multiple": true, "fields": [
                                            {"field": "state", "type": "string"},
                                            {"field": "rank", "type": "number"}
                                        ]}
                                    ]}, $update: [
                                        {_id: 1, $set: {"country": "India", address: {$set: {city: "Hisar1"}, $inc: { lineno: 12}}, states: {$insert: [
                                            {"state": "rajasthan", _id: "rajasthan", rank: 5},
                                            {"state": "bihar", _id: "bihar", rank: 6}
                                        ],
                                            $update: [
                                                {_id: "jammu", $set: {"state": "JK"}, $inc: {rank: 10}},
                                                {_id: "himachal", $set: {"state": "HP"}, $inc: {rank: 20}}
                                            ],
                                            $delete: [
                                                {_id: "punjab"}
                                            ]
                                        }
                                        }, $inc: {
                                            score: 10
                                        }
                                        }
                                    ]
                                    }
                                ];
                                db.update(update, function (err, result) {
                                    if (err) {
                                        done(err);
                                        return;
                                    }
                                    db.query({$collection: "countries"}, function (err, data) {
                                        if (err) {
                                            done(err);
                                            return;
                                        }
//                                        console.log("data of countries after update>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(data));
                                        expect(data.result).to.have.length(1);
                                        expect(data.result[0].country).to.eql("India");
                                        expect(data.result[0].score).to.eql(1010);
                                        expect(data.result[0].address.city).to.eql("Hisar1");
                                        expect(data.result[0].address.lineno).to.eql(13);
                                        expect(data.result[0].states).to.have.length(5);

                                        expect(data.result[0].states[0].state).to.eql("JK");
                                        expect(data.result[0].states[1].state).to.eql("delhi");
                                        expect(data.result[0].states[2].state).to.eql("HP");
                                        expect(data.result[0].states[3].state).to.eql("rajasthan");
                                        expect(data.result[0].states[4].state).to.eql("bihar");
                                        expect(data.result[0].states[0].rank).to.eql(11);
                                        expect(data.result[0].states[1].rank).to.eql(2);
                                        expect(data.result[0].states[2].rank).to.eql(23);
                                        expect(data.result[0].states[3].rank).to.eql(5);
                                        expect(data.result[0].states[4].rank).to.eql(6);

                                        var tx = data.result[0].__txs__[txid].tx;
//                                        console.log("*********tx>>>>>>>>>>>>>>>>>>" + JSON.stringify(tx));

                                        expect(tx.set).to.have.length(2);
                                        expect(tx.set[0].key).to.eql("country");
                                        expect(tx.set[0].value).to.eql("USA");
                                        expect(tx.set[1].key).to.eql("address.city");
                                        expect(tx.set[1].value).to.eql("hisar");

                                        expect(tx.inc).to.have.length(2);
                                        expect(tx.inc[0].key).to.eql("address.lineno");
                                        expect(tx.inc[0].value).to.eql(-12);
                                        expect(tx.inc[1].key).to.eql("score");
                                        expect(tx.inc[1].value).to.eql(-10);


//                                        console.log("***********array****************" + JSON.stringify(tx.array.length));
                                        expect(tx.array).to.have.length(8);

//                                        console.log("***********array0****************" + JSON.stringify(tx.array[0]));
                                        expect(tx.array[0].field).to.eql("states");
                                        expect(tx.array[0].type).to.eql("update");
                                        expect(tx.array[0]._id).to.eql("jammu");
                                        expect(tx.array[0].inc).to.have.length(1);
                                        expect(tx.array[0].inc[0].key).to.eql("rank");
                                        expect(tx.array[0].inc[0].value).to.eql(-10);
                                        expect(tx.array[0].set).to.have.length(1);
                                        expect(tx.array[0].set[0].key).to.eql("state");
                                        expect(tx.array[0].set[0].value).to.eql("jammu");
//                                        console.log("***********array1****************" + JSON.stringify(tx.array[1]));
                                        expect(tx.array[1].field).to.eql("states");
                                        expect(tx.array[1].type).to.eql("update");
                                        expect(tx.array[1]._id).to.eql("himachal");
                                        expect(tx.array[1].inc).to.have.length(1);
                                        expect(tx.array[1].inc[0].key).to.eql("rank");
                                        expect(tx.array[1].inc[0].value).to.eql(-20);
                                        expect(tx.array[1].set).to.have.length(1);
                                        expect(tx.array[1].set[0].key).to.eql("state");
                                        expect(tx.array[1].set[0].value).to.eql("himachal");
//                                        console.log("***********array2****************" + JSON.stringify(tx.array[2]));
                                        expect(tx.array[2].field).to.eql("states");
                                        expect(tx.array[2].type).to.eql("insert");
                                        expect(tx.array[2]._id).to.eql("punjab");
                                        expect(tx.array[2].value.state).to.eql("punjab");
                                        expect(tx.array[2].value._id).to.eql("punjab");
                                        expect(tx.array[2].value.rank).to.eql(4);
//                                        console.log("***********array3****************" + JSON.stringify(tx.array[3]));

                                        expect(tx.array[3].field).to.eql("states");
                                        expect(tx.array[3].type).to.eql("delete");
                                        expect(tx.array[3]._id).to.eql("rajasthan");


                                        expect(tx.array[4].field).to.eql("states");
                                        expect(tx.array[4].type).to.eql("delete");
                                        expect(tx.array[4]._id).to.eql("bihar");


                                        expect(tx.array[5].field).to.eql("languages");
                                        expect(tx.array[5].type).to.eql("update");
                                        expect(tx.array[5]._id).to.eql("urdu");
                                        expect(tx.array[5].set).to.have.length(2);
                                        expect(tx.array[5].set[0].key).to.eql("language");
                                        expect(tx.array[5].set[0].value).to.eql("Urdu");
                                        expect(tx.array[5].set[1].key).to.eql("score");
                                        expect(tx.array[5].set[1].value).to.eql(null);

//                                        console.log("tx>>>" + JSON.stringify(tx.array[6]))
                                        expect(tx.array[6].field).to.eql("languages");
                                        expect(tx.array[6].type).to.eql("insert");
                                        expect(tx.array[6].value.language).to.eql("German");

                                        expect(tx.array[7].field).to.eql("languages");
                                        expect(tx.array[7].type).to.eql("delete");

                                        db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                            if (err) {
                                                done(err);
                                                return;
                                            }
                                            var transactions =
                                            {_id: "1", txid: "1", updates: [
                                                {tx: {$collection: "countries", $update: [
                                                    {_id: 1}
                                                ]}}
                                            ]};
//                                            console.log("data of transaxction>>>" + JSON.stringify(data));
                                            expect(data.result).to.have.length(1);
                                            expect(data.result[0].txid).to.eql(txid);
                                            expect(data.result[0].updates).to.have.length(1);
                                            var txUpdates = data.result[0].updates;
                                            var tx = txUpdates[0].tx;
                                            expect(tx.collection).to.eql("countries");
                                            expect(tx.update._id).to.eql(1);


                                            db.commitTransaction(function (err) {
                                                db.query({$collection: "countries"}, function (err, data) {
                                                    if (err) {
                                                        done(err);
                                                        return;
                                                    }
//                                                    console.log("Data after comamit >>>" + JSON.stringify(data));
                                                    expect(data.result).to.have.length(1);
                                                    expect(data.result[0].country).to.eql("India");
                                                    expect(data.result[0].score).to.eql(1010);
                                                    expect(data.result[0].address.city).to.eql("Hisar1");
                                                    expect(data.result[0].address.state).to.eql("haryana");
                                                    expect(data.result[0].address.lineno).to.eql(13);
                                                    expect(data.result[0].states).to.have.length(5);
                                                    expect(data.result[0].states[0].state).to.eql("JK");
                                                    expect(data.result[0].states[1].state).to.eql("delhi");
                                                    expect(data.result[0].states[2].state).to.eql("HP");
                                                    expect(data.result[0].states[3].state).to.eql("rajasthan");
                                                    expect(data.result[0].states[4].state).to.eql("bihar");
                                                    expect(data.result[0].states[0].rank).to.eql(11);
                                                    expect(data.result[0].states[1].rank).to.eql(2);
                                                    expect(data.result[0].states[2].rank).to.eql(23);
                                                    expect(data.result[0].states[3].rank).to.eql(5);
                                                    expect(data.result[0].states[4].rank).to.eql(6);
                                                    db.query({$collection: "pl.txs", $filter: {"_id": txid}}, function (err, data) {
                                                        if (err) {
                                                            done(err);
                                                            return;
                                                        }
                                                        expect(data.result).to.have.length(0);
                                                        done();
                                                    });
                                                });
                                            });
                                        });
                                    });
                                })
                            });
                        })
                    });
                });

            })
        })
        ;
    })
    it("checking for transaction testcases  insert.. commit..", function (done) {
        var db = undefined;
        var txid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "computers", $insert: [
                        {"manufacture": "hp", code: "01"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "computers"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].manufacture).to.eql("hp");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].status).to.eql("pending");
                expect(data.result[0].user.username).to.eql("guest");
                expect(data.result[0].tx.collection).to.eql("computers");
                expect(data.result[0].tx.delete).to.have.property("_id");
                return db.commitTransaction();
            }).then(
            function () {
                return db.query({$collection: "computers"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].manufacture).to.eql("hp");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("checking for transaction testcases  insert.. rollback..", function (done) {
        var db = undefined;
        var txid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "computers", $insert: [
                        {"manufacture": "hp", code: "01"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection: "computers"});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].manufacture).to.eql("hp");
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].status).to.eql("pending");
                expect(data.result[0].user.username).to.eql("guest");
                expect(data.result[0].tx.collection).to.eql("computers");
                expect(data.result[0].tx.delete).to.have.property("_id");
                return db.rollbackTransaction();
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("checking for transaction testcases  delete.. commit..", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "computers", $insert: [
                        {manufacture: {name: "hp", location: "delhi"}, code: "01"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].code).to.eql("01");
                recordId = data.result[0]._id;
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                return db.commitTransaction();
            }).then(function () {
                return db.startTransaction();
            }).then(function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "computers", $delete: [
                        {_id: recordId}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].tx.collection).to.eql("computers");
                expect(data.result[0].tx).to.have.property("insert");
                expect(data.result[0].tx.insert.code).to.eql("01");
                expect(data.result[0].tx.insert.manufacture.location).to.eql("delhi");

                return db.commitTransaction();
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("checking for transaction testcases  delete.. rollback..", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "computers", $insert: [
                        {manufacture: {name: "hp", location: "delhi"}, code: "01"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].code).to.eql("01");
                recordId = data.result[0]._id;
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                return db.commitTransaction();
            }).then(function () {
                return db.startTransaction();
            }).then(function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "computers", $delete: [
                        {_id: recordId}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].tx.collection).to.eql("computers");
                expect(data.result[0].tx).to.have.property("insert");
                expect(data.result[0].tx.insert.code).to.eql("01");
                expect(data.result[0].tx.insert.manufacture.location).to.eql("delhi");

                return db.rollbackTransaction();
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].code).to.eql("01");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("checking for transaction testcases  update.. commit..", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "computers", $insert: [
                        {manufacture: {name: "hp", location: "delhi"}, code: "01"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].code).to.eql("01");
                recordId = data.result[0]._id;
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                return db.commitTransaction();
            }).then(function () {
                return db.startTransaction();
            }).then(function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "computers", $update: [
                        {_id: recordId,
                            $set: {manufacture: {$set: {location: "noida"}}}}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].code).to.eql("01");
                recordId = data.result[0]._id;
                expect(data.result[0].manufacture.location).to.eql("noida");
                expect(data.result[0]).to.have.property("__txs__");
                expect(data.result[0].__txs__).to.have.property(txid);
                expect(data.result[0].__txs__[txid].tx._id).to.eql(recordId);
                expect(data.result[0].__txs__[txid].tx.set).to.have.length(1);
                expect(data.result[0].__txs__[txid].tx.set[0].key).to.eql("manufacture.location");
                expect(data.result[0].__txs__[txid].tx.set[0].value).to.eql("delhi");

                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].tx.collection).to.eql("computers");
                expect(data.result[0].tx.update._id).to.eql(recordId);

                return db.commitTransaction();
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].manufacture.location).to.eql("noida");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("checking for transaction testcases  update.. rollback..", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "computers", $insert: [
                        {manufacture: {name: "hp", location: "delhi"}, code: "01"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].code).to.eql("01");
                recordId = data.result[0]._id;
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                return db.commitTransaction();
            }).then(function () {
                return db.startTransaction();
            }).then(function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "computers", $update: [
                        {_id: recordId,
                            $set: {manufacture: {$set: {location: "noida"}}}}
                    ], $modules: {"HistoryLogs": 0}}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].code).to.eql("01");
                recordId = data.result[0]._id;
                expect(data.result[0].manufacture.location).to.eql("noida");
                expect(data.result[0]).to.have.property("__txs__");
                expect(data.result[0].__txs__).to.have.property(txid);
                expect(data.result[0].__txs__[txid].tx._id).to.eql(recordId);
                expect(data.result[0].__txs__[txid].tx.set).to.have.length(1);
                expect(data.result[0].__txs__[txid].tx.set[0].key).to.eql("manufacture.location");
                expect(data.result[0].__txs__[txid].tx.set[0].value).to.eql("delhi");

                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].tx.collection).to.eql("computers");
                expect(data.result[0].tx.update._id).to.eql(recordId);

                return db.rollbackTransaction();
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].manufacture.location).to.eql("delhi");
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("checking for two transaction - both insert - one commit one is rollback", function (done) {
        var db = undefined;
        var db2 = undefined;
        var txid1 = undefined;
        var txid2 = undefined;
        var recordId1 = undefined;
        var recordId2 = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid1 = dbtxid;
                var updates = [
                    {$collection: "computers", $insert: [
                        {manufacture: {name: "hp", location: "delhi"}, code: "01"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                recordId1 = data.result[0]._id;
                ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
                    function (db1) {
                        db2 = db1;
                        return db2.startTransaction();
                    }).then(
                    function (dbtxid) {
                        txid2 = dbtxid;
                        var updates = [
                            {$collection: "computers", $insert: [
                                {manufacture: {name: "dell", location: "noida"}, code: "02"}
                            ]}
                        ]
                        return db2.update(updates);
                    }).then(function () {
                        return db.query({$collection: "computers", $filter: {code: "02"}});
                    }).then(function (data) {
                        recordId1 = data.result[0]._id;
                        expect(data.result).to.have.length(1);
                        return db.query({$collection: "pl.txs", $filter: {"txid": txid1}});
                    }).then(function (data) {
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].tx).to.have.property("delete");
                        return db.query({$collection: "pl.txs"});
                    }).then(function (data) {
                        expect(data.result).to.have.length(2);
                        expect(data.result[0].tx).to.have.property("delete");
                        return db.commitTransaction();
                    }).then(function () {
                        return db.query({$collection: "computers"});
                    }).then(function (data) {
                        expect(data.result).to.have.length(2);
                        expect(data.result[0].code).to.eql("01");
                        return db.query({$collection: "pl.txs"});
                    }).then(function (data) {
                        expect(data.result).to.have.length(1);
                        return db2.rollbackTransaction();
                    }).then(function () {
                        return db.query({$collection: "computers"});
                    }).then(function (data) {
                        expect(data.result).to.have.length(1);
                        expect(data.result[0].code).to.eql("01");
                        return db.query({$collection: "pl.txs"});
                    }).then(function (data) {
                        expect(data.result).to.have.length(0);
                        done();
                    }).fail(function (err) {
                        done(err);
                    })
            });

    });
    it("one transaction create then update then remove then rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "computers", $insert: [
                        {manufacture: {name: "hp", location: "delhi"}, code: "01"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].code).to.eql("01");
                recordId = data.result[0]._id;
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                var updates = [
                    {$collection: "computers", $update: [
                        {_id: recordId, $set: {manufacture: {$set: {location: "noida"}}}}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);   //update is not saved in case of insetion on same transaction.
                var updates = [
                    {$collection: "computers", $delete: [
                        {_id: recordId}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
//                console.log("data  >>>" + JSON.stringify(data));
                expect(data.result).to.have.length(2);   //both txs save for insert and delete
                return db.rollbackTransaction();
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("checking for two transaction both inc one one - one commit one is rollback", function (done) {
        var db = undefined;
        var db1 = undefined;
        var db2 = undefined;
        var txid = undefined;
        var txid1 = undefined;
        var txid2 = undefined;
        var recordId1 = undefined;
        var recordId2 = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var updates = [
                    {$collection: "computers", $insert: [
                        {manufacture: {name: "hp", branches: 8}, code: "01"}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
//                console.log("data >>>" + JSON.stringify(data));
                recordId1 = data.result[0]._id;
                return db.commitTransaction();
            }).then(function () {
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
            }).then(function (db12) {
                db1 = db12;
                return db1.startTransaction();
            }).then(
            function (dbtxid) {
                txid1 = dbtxid;
                var updates = [
                    {$collection: "computers", $update: [
                        {_id: recordId1, $set: {manufacture: {$inc: { branches: 5}}}}
                    ]}
                ]
                return db1.update(updates);
            }).then(function () {
                return db1.query({$collection: "computers"});
            }).then(function (data) {
//                console.log("data :::::" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].manufacture.branches).to.eql(13);
                expect(data.result[0].__txs__[txid1].tx.inc[0].value).to.eql(-5);
                return db1.query({$collection: "pl.txs", $filter: {"txid": txid1}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].tx).to.have.property("update");
                return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
            }).then(
            function (db13) {
                db2 = db13;
                return db2.startTransaction();
            }).then(
            function (dbtxid) {
                txid2 = dbtxid;
                var updates = [
                    {$collection: "computers", $update: [
                        {_id: recordId1, $set: {manufacture: {$inc: { branches: -2}}}}
                    ]}
                ]
                return db2.update(updates);
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
//                console.log("data :::::" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].manufacture.branches).to.eql(11);
                expect(data.result[0].__txs__[txid2].tx.inc[0].value).to.eql(2);
                return db2.query({$collection: "pl.txs"});
            }).then(function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[1].tx).to.have.property("update");
                return db1.rollbackTransaction();
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
//                console.log("data >>>"+JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].manufacture.branches).to.eql(6);
                expect(data.result[0].__txs__[txid1]).to.eql(undefined);
                return db2.query({$collection: "pl.txs"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                return db2.commitTransaction();
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].manufacture.branches).to.eql(6);
                expect(data.result[0].__txs__[txid2]).to.eql(undefined);
                return db2.query({$collection: "pl.txs"});
            }).then(function (data) {
//                console.log("data"+JSON.stringify(data));
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
    it("one transaction array insert then update then delete then rollback", function (done) {
        var db = undefined;
        var txid = undefined;
        var recordId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.startTransaction();
            }).then(
            function (dbtxid) {
                txid = dbtxid;
                var insert = [
                    {$collection: "computers", $insert: [
                        {manufacture: [{_id :"hp", name: "hp", location: "delhi"},
                            {_id :"hcl", name: "hcl", location: "noida"},
                            {_id :"dell", name: "dell", location: "gudgaon"}], code: "01"}
                    ]}
                ]
                return db.update(insert);
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].code).to.eql("01");
                recordId = data.result[0]._id;
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                var updates = [
                    {$collection: "computers", $update: [
                        {_id: recordId, $set: {manufacture: {
                            $insert:[
                                {name : "LG", location :"jaipur"}
                            ],
                            $update : [{_id :"hp", $set:{location : "banglore"}}]
                        }}}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(1);
                return db.query({$collection: "computers", $filter: {"_id": recordId}});
            }).then(function (data) {
//                console.log("data after update"+JSON.stringify(data));
                expect(data.result[0].__txs__).to.eql(undefined);
                expect(data.result[0].manufacture.length).to.eql(4);

                var updates = [
                    {$collection: "computers", $update: [
                        {_id: recordId, $set: {manufacture: {
                            $delete : [{_id : "dell"}]
                        }}}
                    ]}
                ]
                return db.update(updates);
            }).then(function () {
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
//                console.log("data  >>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                return db.query({$collection: "computers", $filter: {"_id": recordId}});
            }).then(function (data) {
//                console.log("data after delete "+JSON.stringify(data));
                expect(data.result[0].manufacture.length).to.eql(3);
                return db.rollbackTransaction();
            }).then(function () {
                return db.query({$collection: "computers"});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                return db.query({$collection: "pl.txs", $filter: {"txid": txid}});
            }).then(function (data) {
                expect(data.result).to.have.length(0);
                done();
            }).fail(function (err) {
                done(err);
            })
    });
})


