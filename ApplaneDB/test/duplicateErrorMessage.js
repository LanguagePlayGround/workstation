/**
 * Created by sourabh on 30/7/15.
 */

var expect = require('chai').expect;
var Config = require("./config.js").config;
var Document = require("../public/js/Document.js");
var ApplaneDB = require("../lib/DB.js");
var Testcases = require("./TestCases.js");
var Q = require("q");

describe("duplicate error message", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })


    it("display from pl.indexes for insert", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "countries"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "country", type: "string", collectionid: {$query: {collection: "countries"}}}
                    ]}
                ]);
                return db.update(updates);
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $insert: [
                            {
                                country: "india"
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(function () {
                var updateIndex =
                    [
                        {$collection: "pl.indexes", $insert: [
                            {name: "countryunique", indexes: JSON.stringify({country: 1}), message: "two countries cant have same name", unique: true, background: true, collectionid: {$query: {collection: "countries"}}}
                        ]}
                    ];
                return db.update(updateIndex);
            }).then(function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data: {commit: true}}
                ]);
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $insert: [
                            {
                                country: "india"
                            }
                        ]}
                    ];
                return db.update(updates);
            }).fail(function (err) {
                expect(err.message).to.eql('two countries cant have same name');
                expect(err.detailMessage).to.eql('Duplicate index error in db [northwindtestcases] for collection [countries] having fields ["country"] with value ["india"]');
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("display custom message for insert", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "countries"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "country", label : "Country", type: "string", collectionid: {$query: {collection: "countries"}}}
                    ]}
                ]);
                return db.update(updates);
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $insert: [
                            {
                                country: "india"
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(function () {
                var updateIndex =
                    [
                        {$collection: "pl.indexes", $insert: [
                            {name: "Country Unique", indexes: JSON.stringify({country: 1}), unique: true, background: true, collectionid: {$query: {collection: "countries"}}}
                        ]}
                    ];
                return db.update(updateIndex);
            }).then(function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data: {commit: true}}
                ]);
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $insert: [
                            {
                                country: "india"
                            }
                        ]}
                    ];
                return db.update(updates);
                done();
            }).fail(function (err) {
                expect(err.message).to.eql('Country ["india"] already exists');
                expect(err.detailMessage).to.eql('Duplicate index error in db [northwindtestcases] for collection [countries] having fields ["country"] with value ["india"]');
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("display from pl.indexes for update", function (done) {
        var db = undefined;
        var recordId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "countries"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "country", type: "string", collectionid: {$query: {collection: "countries"}}}
                    ]}
                ]);
                return db.update(updates);
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $insert: [
                            {
                                country: "india"
                            }
                        ]},
                        {$collection: "countries", $insert: [
                            {
                                country: "USA"
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(function () {
                var updateIndex =
                    [
                        {$collection: "pl.indexes", $insert: [
                            {name: "countryunique", indexes: JSON.stringify({country: 1}), message: "two countries cant have same name", unique: true, background: true, collectionid: {$query: {collection: "countries"}}}
                        ]}
                    ];
                return db.update(updateIndex);
            }).then(function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data: {commit: true}}
                ]);
            }).then(function () {
                return db.query({$collection: "countries", $filter: {country: "india"}});
            }).then(function (result) {
                recordId = result.result[0]._id;
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $update: [
                            {
                                _id: recordId,
                                $set: {country: "USA"}
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(function () {
                done();
            }).fail(function (err) {
                expect(err.message).to.eql('two countries cant have same name');
                expect(err.detailMessage).to.eql('Duplicate index error in db [northwindtestcases] for collection [countries] having fields ["country"] with value ["USA"]');
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("display from pl.indexes for upsert insert", function (done) {
        var db = undefined;
        var recordId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "countries"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "country", type: "string", collectionid: {$query: {collection: "countries"}}},
                        {field: "code", type: "number", collectionid: {$query: {collection: "countries"}}}
                    ]}
                ]);
                return db.update(updates);
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $insert: [
                            {
                                country: "india",
                                code: 91
                            }
                        ]},
                        {$collection: "countries", $insert: [
                            {
                                country: "USA",
                                code: 88
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(function () {
                var updateIndex =
                    [
                        {$collection: "pl.indexes", $insert: [
                            {name: "countryunique", indexes: JSON.stringify({country: 1}), message: "two countries cant have same name", unique: true, background: true, collectionid: {$query: {collection: "countries"}}}
                        ]}
                    ];
                return db.update(updateIndex);
            }).then(function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data: {commit: true}}
                ]);
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $upsert: [
                            {$query: {code: 90}, $set: {country: "USA"}
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(function () {
                done();
            }).fail(function (err) {
                expect(err.message).to.eql('two countries cant have same name');
                expect(err.detailMessage).to.eql('Duplicate index error in db [northwindtestcases] for collection [countries] having fields ["country"] with value ["USA"]');
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("display from pl.indexes for upsert update", function (done) {
        var db = undefined;
        var recordId = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "countries"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "country", type: "string", collectionid: {$query: {collection: "countries"}}},
                        {field: "code", type: "number", collectionid: {$query: {collection: "countries"}}}
                    ]}
                ]);
                return db.update(updates);
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $insert: [
                            {
                                country: "india",
                                code: 91
                            }
                        ]},
                        {$collection: "countries", $insert: [
                            {
                                country: "USA",
                                code: 88
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(function () {
                var updateIndex =
                    [
                        {$collection: "pl.indexes", $insert: [
                            {name: "countryunique", indexes: JSON.stringify({country: 1}), message: "two countries cant have same name", unique: true, background: true, collectionid: {$query: {collection: "countries"}}}
                        ]}
                    ];
                return db.update(updateIndex);
            }).then(function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data: {commit: true}}
                ]);
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $upsert: [
                            {$query: {code: 91}, $set: {country: "USA"}
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(function () {
                done();
            }).fail(function (err) {
                expect(err.message).to.eql('two countries cant have same name');
                expect(err.detailMessage).to.eql('Duplicate index error in db [northwindtestcases] for collection [countries] having fields ["country"] with value ["USA"]');
                done();
            }).fail(function (err) {
                done(err);
            });
    });
//    it("update one resolve after reject ", function (done) {
//        var db = undefined;
//        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
//            function (db1) {
//                db = db1;
//                var mongoCollection=db.db.collection("student__");
//                var d = Q.defer();
//                mongoCollection.createIndex({name:1}, {unique:true},function (err, result) {
//                    if (err) {
//                        d.reject(err);
//                        return;
//                    }
//                   mongoCollection.insertMany([{"name":"Sachin"},{"name":"Sourabh"}], {w:1}, function (err, result) {
//                        if (err) {
//                            d.reject(err);
//                            return;
//                        }
//                       mongoCollection.updateOne({name:"Sourabh"},{"name":"Sachin"}, {w:1}, function (err, result) {
//                           console.log("err>>>>>" + err);
//                           console.log("result>>>>>" + result);
//                           if (err) {
//                               d.reject(err);
//                               return;
//                           }
//                           d.resolve();
//                       });
//                    });
//                });
//                return d.promise;
//            }).then(function(){
//                done();
//            }).fail(function(err){
//                done(err);
//            })
//    });
    it("mesage for two or more indexes fields and dotted index", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "countries"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "country", label: "Country", type: "object", collectionid: {$query: {collection: "countries"}},fields : [
                            {field: "state", label: "State", type: "string"}
                        ]},
                        {field: "code", label: "Country Code", type: "number", collectionid: {$query: {collection: "countries"}}}
                    ]}
                ]);
                return db.update(updates);
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $insert: [
                            {
                                "country": {state :"haryana"},
                                code: 91
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(function () {
                var updateIndex =
                    [
                        {$collection: "pl.indexes", $insert: [
                            {name: "countryunique", indexes: JSON.stringify({'country.state': 1,code : 1}), unique: true, background: true, collectionid: {$query: {collection: "countries"}}}
                        ]}
                    ];
                return db.update(updateIndex);
            }).then(function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data: {commit: true}}
                ]);
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $insert: [
                            {
                                "country": {state :"haryana"},
                                code: 91
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(function () {
                done();
            }).fail(function (err) {
                expect(err.message).to.eql('Country.State ["haryana"], Country Code [91] already exists');
                expect(err.detailMessage).to.eql('Duplicate index error in db [northwindtestcases] for collection [countries] having fields ["country.state","code"] with value ["haryana",91]');
                done();
            }).fail(function (err) {
                done(err);
            });
    });
    it("mesage for two or more indexes fields", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.update([
                    {$collection: "pl.collections", $insert: [
                        {collection: "countries"}
                    ]},
                    {$collection: "pl.fields", $insert: [
                        {field: "country", label: "Country", type: "string", collectionid: {$query: {collection: "countries"}}},
                        {field: "code", label: "Country Code", type: "number", collectionid: {$query: {collection: "countries"}}}
                    ]}
                ]);
                return db.update(updates);
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $insert: [
                            {
                                country: "india",
                                code: 91
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(function () {
                var updateIndex =
                    [
                        {$collection: "pl.indexes", $insert: [
                            {name: "countryunique", indexes: JSON.stringify({country: 1, code: 1}), unique: true, background: true, collectionid: {$query: {collection: "countries"}}}
                        ]}
                    ];
                return db.update(updateIndex);
            }).then(function () {
                return db.invokeFunction("Commit.commitProcess", [
                    {data: {commit: true}}
                ]);
            }).then(function () {
                var updates =
                    [
                        {$collection: "countries", $insert: [
                            {
                                country: "india",
                                code: 91
                            }
                        ]}
                    ];
                return db.update(updates);
            }).then(function () {
                done();
            }).fail(function (err) {
                expect(err.message).to.eql('Country ["india"], Country Code [91] already exists');
                expect(err.detailMessage).to.eql('Duplicate index error in db [northwindtestcases] for collection [countries] having fields ["country","code"] with value ["india",91]');
                done();
            }).fail(function (err) {
                done(err);
            });
    });
});