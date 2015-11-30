/**
 *
 *  mocha --recursive --timeout 150000 -g "Cascadetestcase" --reporter spec
 *
 *
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js")

describe("Cascadetestcase", function () {

    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    afterEach(function (done) {
        Testcases.afterEach(done);
    })

    it("simple reference fail at top level", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"entities"},
                        {collection:"relationships"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"entities"}}},
                        {field:"id", type:"string", collectionid:{$query:{collection:"relationships"}}},
                        {field:"entityid", type:"fk", collection:"entities", set:["name"], collectionid:{$query:{collection:"relationships"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection:"entities", $insert:[
                        {name:"Entity1"},
                        {name:"Entity2"},
                        {name:"Entity3"}
                    ]},
                    {$collection:"relationships", $insert:[
                        {id:"1", entityid:{$query:{name:"Entity1"}}},
                        {id:"2", entityid:{$query:{name:"Entity3"}}},
                        {id:"3", entityid:{$query:{name:"Entity2"}}},
                        {id:"4", entityid:{$query:{name:"Entity1"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.update({$collection:"entities", $delete:[
                    {$query:{name:"Entity1"}}
                ]});
            }).then(
            function () {
                done("Not Ok.");
            }).fail(function (err) {
                var cascadeErrror = err.toString().indexOf("Record cannot be deleted as it is referred in collection") != -1;
                if (cascadeErrror) {
                    done();
                } else {
                    done(err);
                }
            })
    })

    it("simple reference at top level", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"entities"},
                        {collection:"relationships"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"entities"}}},
                        {field:"id", type:"string", collectionid:{$query:{collection:"relationships"}}},
                        {field:"entityid", type:"fk", collection:"entities", set:["name"], collectionid:{$query:{collection:"relationships"}}, cascade:true}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection:"entities", $insert:[
                        {name:"Entity1"},
                        {name:"Entity2"},
                        {name:"Entity3"}
                    ]},
                    {$collection:"relationships", $insert:[
                        {id:"1", entityid:{$query:{name:"Entity1"}}},
                        {id:"2", entityid:{$query:{name:"Entity3"}}},
                        {id:"3", entityid:{$query:{name:"Entity2"}}},
                        {id:"4", entityid:{$query:{name:"Entity1"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.update({$collection:"entities", $delete:[
                    {$query:{name:"Entity1"}}
                ]});
            }).then(
            function () {
                return db.query({$collection:"relationships", $sort:{id:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].entityid.name).to.eql("Entity3");
                expect(data.result[1].entityid.name).to.eql("Entity2");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("simple reference multiple at top level", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"entities"},
                        {collection:"relationships"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"entities"}}},
                        {field:"id", type:"string", collectionid:{$query:{collection:"relationships"}}},
                        {field:"entityid", type:"fk", collection:"entities", set:["name"], collectionid:{$query:{collection:"relationships"}}, cascade:true, multiple:true}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection:"entities", $insert:[
                        {name:"Entity1"},
                        {name:"Entity2"},
                        {name:"Entity3"}
                    ]},
                    {$collection:"relationships", $insert:[
                        {id:"1", entityid:[
                            {$query:{name:"Entity1"}},
                            {$query:{name:"Entity2"}}
                        ]},
                        {id:"2", entityid:[
                            {$query:{name:"Entity2"}},
                            {$query:{name:"Entity3"}}
                        ]},
                        {id:"3", entityid:[
                            {$query:{name:"Entity3"}}
                        ]},
                        {id:"4", entityid:[
                            {$query:{name:"Entity1"}},
                            {$query:{name:"Entity3"}}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.update({$collection:"entities", $delete:[
                    {$query:{name:"Entity1"}}
                ]});
            }).then(
            function () {
                return db.query({$collection:"relationships", $sort:{id:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Two Level reference at top level", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"entities"},
                        {collection:"relationships"},
                        {collection:"opportunities"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"entities"}}},
                        {field:"id", type:"string", collectionid:{$query:{collection:"relationships"}}},
                        {field:"entityid", type:"fk", collection:"entities", set:["name"], collectionid:{$query:{collection:"relationships"}}, cascade:true},
                        {field:"id", type:"string", collectionid:{$query:{collection:"opportunities"}}},
                        {field:"relationshipid", type:"fk", collection:"relationships", set:["id"], collectionid:{$query:{collection:"opportunities"}}, cascade:true}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection:"entities", $insert:[
                        {name:"Entity1"},
                        {name:"Entity2"},
                        {name:"Entity3"}
                    ]},
                    {$collection:"relationships", $insert:[
                        {id:"1", entityid:{$query:{name:"Entity1"}}},
                        {id:"2", entityid:{$query:{name:"Entity3"}}},
                        {id:"3", entityid:{$query:{name:"Entity2"}}},
                        {id:"4", entityid:{$query:{name:"Entity1"}}}
                    ]} ,
                    {$collection:"opportunities", $insert:[
                        {id:"1", relationshipid:{$query:{id:"1"}}},
                        {id:"2", relationshipid:{$query:{id:"1"}}},
                        {id:"3", relationshipid:{$query:{id:"2"}}},
                        {id:"4", relationshipid:{$query:{id:"4"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.update({$collection:"entities", $delete:[
                    {$query:{name:"Entity1"}}
                ]});
            }).then(
            function () {
                return db.query({$collection:"relationships", $sort:{id:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].entityid.name).to.eql("Entity3");
                expect(data.result[1].entityid.name).to.eql("Entity2");
                return db.query({$collection:"opportunities", $sort:{id:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].relationshipid.id).to.eql("2");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Two Level reference Error Cascade false at top level", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"entities"},
                        {collection:"relationships"},
                        {collection:"opportunities"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"entities"}}},
                        {field:"id", type:"string", collectionid:{$query:{collection:"relationships"}}},
                        {field:"entityid", type:"fk", collection:"entities", set:["name"], collectionid:{$query:{collection:"relationships"}}, cascade:true},
                        {field:"id", type:"string", collectionid:{$query:{collection:"opportunities"}}},
                        {field:"relationshipid", type:"fk", collection:"relationships", set:["id"], collectionid:{$query:{collection:"opportunities"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection:"entities", $insert:[
                        {name:"Entity1"},
                        {name:"Entity2"},
                        {name:"Entity3"}
                    ]},
                    {$collection:"relationships", $insert:[
                        {id:"1", entityid:{$query:{name:"Entity1"}}},
                        {id:"2", entityid:{$query:{name:"Entity3"}}},
                        {id:"3", entityid:{$query:{name:"Entity2"}}},
                        {id:"4", entityid:{$query:{name:"Entity1"}}}
                    ]} ,
                    {$collection:"opportunities", $insert:[
                        {id:"1", relationshipid:{$query:{id:"1"}}},
                        {id:"2", relationshipid:{$query:{id:"1"}}},
                        {id:"3", relationshipid:{$query:{id:"2"}}},
                        {id:"4", relationshipid:{$query:{id:"4"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.update({$collection:"entities", $delete:[
                    {$query:{name:"Entity1"}}
                ]});
            }).then(
            function () {
                done("Not Ok.");
            }).fail(function (err) {
                var cascadeErrror = err.toString().indexOf("Record cannot be deleted as it is referred in collection") != -1;
//                console.log("Err>>>>>>>>>>" + err.toString());
                if (cascadeErrror) {
                    return db.query({$collection:"relationships", $sort:{id:1}}).then(
                        function (data) {
                            expect(data.result).to.have.length(4);
                            return db.query({$collection:"opportunities", $sort:{id:1}}).then(
                                function (data) {
                                    expect(data.result).to.have.length(4);
                                    done();
                                })
                        })
                } else {
                    done(err);
                }
            })
    })

    it("nested table reference", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"accounts"},
                        {collection:"invoices"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"accounts"}}},
                        {field:"invoice_no", type:"string", collectionid:{$query:{collection:"invoices"}}},
                        {field:"vlis", type:"object", collectionid:{$query:{collection:"invoices"}}, multiple:true},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"invoices"}}, cascade:true, parentfieldid:{$query:{field:"vlis", collectionid:{$query:{collection:"invoices"}}}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection:"accounts", $insert:[
                        {name:"Account1"},
                        {name:"Account2"},
                        {name:"Account3"}
                    ]},
                    {$collection:"invoices", $insert:[
                        {invoice_no:"123213", vlis:[
                            {accountid:{$query:{name:"Account1"}}},
                            {accountid:{$query:{name:"Account2"}}}
                        ]},
                        {invoice_no:"1232213", vlis:[
                            {accountid:{$query:{name:"Account3"}}}
                        ]},
                        {invoice_no:"1232313", vlis:[
                            {accountid:{$query:{name:"Account1"}}},
                            {accountid:{$query:{name:"Account1"}}},
                            {accountid:{$query:{name:"Account3"}}}
                        ]},
                        {invoice_no:"12322313", vlis:[
                            {accountid:{$query:{name:"Account2"}}},
                            {accountid:{$query:{name:"Account2"}}},
                            {accountid:{$query:{name:"Account3"}}}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.update({$collection:"accounts", $delete:[
                    {$query:{name:"Account2"}},
                    {$query:{name:"Account1"}}
                ]});
            }).then(
            function () {
                return db.query({$collection:"invoices", $sort:{id:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Object type column single at top level", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"accounts"},
                        {collection:"invoices"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"accounts"}}},
                        {field:"invoice_no", type:"string", collectionid:{$query:{collection:"invoices"}}},
                        {field:"vlis", type:"object", collectionid:{$query:{collection:"invoices"}}},
                        {field:"accountid", type:"fk", collection:"accounts", set:["name"], collectionid:{$query:{collection:"invoices"}}, cascade:true, parentfieldid:{$query:{field:"vlis", collectionid:{$query:{collection:"invoices"}}}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection:"accounts", $insert:[
                        {name:"Account1"},
                        {name:"Account2"},
                        {name:"Account3"}
                    ]},
                    {$collection:"invoices", $insert:[
                        {invoice_no:"123213", vlis:{accountid:{$query:{name:"Account1"}}}},
                        {invoice_no:"1232113", vlis:{accountid:{$query:{name:"Account2"}}}},
                        {invoice_no:"12312113", vlis:{accountid:{$query:{name:"Account3"}}}},
                        {invoice_no:"12321113", vlis:{accountid:{$query:{name:"Account3"}}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.update({$collection:"accounts", $delete:[
                    {$query:{name:"Account2"}},
                    {$query:{name:"Account1"}}
                ]});
            }).then(
            function () {
                return db.query({$collection:"invoices", $sort:{id:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Merging Fields with admin and local", function (done) {
        var db = undefined;
        var adminDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.getGlobalDB();
            }).then(
            function (adminDb1) {
                adminDb = adminDb1;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {_id:"entities", collection:"entities"},
                        {collection:"relationships"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"entities"}}},
                        {field:"id", type:"string", collectionid:{$query:{collection:"relationships"}}},
                        {field:"entityid", type:"fk", collection:"entities", set:["name"], collectionid:{$query:{collection:"relationships"}}, cascade:true}
                    ]}
                ];
                return adminDb.update(updates);
            }).then(
            function () {
                return adminDb.query({$collection:"pl.collections", $filter:{collection:"entities"}});
            }).then(
            function (data) {
                var collectionId = data.result[0]._id;
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {_id:collectionId, collection:"entities"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{_id:collectionId}}
                    ]}
                ];
                return db.mongoUpdate(updates);
            }).then(
            function (data) {
                var updates = [
                    {$collection:"pl.collections", $insert:[
                        {_id:"opportunities", collection:"opportunities"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"id", type:"string", collectionid:{_id:"opportunities"}},
                        {field:"relationshipid", type:"fk", collection:"relationships", set:["id"], collectionid:{_id:"opportunities"}, cascade:true}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                var updates = [
                    {$collection:"entities", $insert:[
                        {name:"Entity1"},
                        {name:"Entity2"},
                        {name:"Entity3"}
                    ]},
                    {$collection:"relationships", $insert:[
                        {id:"1", entityid:{$query:{name:"Entity1"}}},
                        {id:"2", entityid:{$query:{name:"Entity3"}}},
                        {id:"3", entityid:{$query:{name:"Entity2"}}},
                        {id:"4", entityid:{$query:{name:"Entity1"}}}
                    ]} ,
                    {$collection:"opportunities", $insert:[
                        {id:"1", relationshipid:{$query:{id:"1"}}},
                        {id:"2", relationshipid:{$query:{id:"1"}}},
                        {id:"3", relationshipid:{$query:{id:"2"}}},
                        {id:"4", relationshipid:{$query:{id:"4"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.update({$collection:"entities", $delete:[
                    {$query:{name:"Entity1"}}
                ]});
            }).then(
            function () {
                return db.query({$collection:"relationships", $sort:{id:1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].entityid.name).to.eql("Entity3");
                expect(data.result[1].entityid.name).to.eql("Entity2");
                return db.query({$collection:"opportunities", $sort:{id:1}});
            }).then(
            function (data) {
                console.log("data>>>>>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0].relationshipid.id).to.eql("2");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

})