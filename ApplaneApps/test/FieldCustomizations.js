/**
 *
 *  mocha --recursive --timeout 150000 -g "Field Customizations" --reporter spec
 *
 *
 */

var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Commit = require("../lib/apps/Commit.js");

describe("Field Customizations", function () {

    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })

    afterEach(function (done) {
        Testcases.afterEach(done);
    })

    it("admin level", function (done) {
        var db = undefined;
        var collection = undefined;
        var fields = undefined;
        var qviews = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"students"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", width:"100px", type:"string", collectionid:{$query:{collection:"students"}}, ui:"text", visibility:true, index:2},
                        {field:"age", width:"100px", type:"number", collectionid:{$query:{collection:"students"}}, ui:"number", visibility:true, index:3},
                        {field:"sex", width:"100px", type:"string", collectionid:{$query:{collection:"students"}}, ui:"text", visibility:true, index:4}
                    ]},
                    {$collection:"pl.qviews", $insert:[
                        {label:"Students", id:"students", collection:{$query:{collection:"students"}}, mainCollection:{$query:{collection:"students"}}},
                        {label:"Students Info", id:"studentsInfos", collection:{$query:{collection:"students"}}, mainCollection:{$query:{collection:"students"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return db.query({$collection:"pl.collections", $filter:{collection:"students"}});
            }).then(
            function (result) {
                collection = result.result[0];
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"students"}});
            }).then(
            function (result) {
                fields = result.result;
            }).then(
            function () {
                return db.query({$collection:"pl.qviews", $filter:{"collection.collection":"students"}});
            }).then(
            function (result) {
                qviews = result.result;
            }).then(
            function () {
                return db.invokeFunction("SaveUserState.saveFieldCustomization", [
                    {fieldCustomizations:[
                        {_id:fields[0]._id, collection:"students", width:"300px", visibility:false, visibilityGrid:false, indexGrid:10},
                        {_id:fields[1]._id, collection:"students", width:"300px", visibility:false, visibilityGrid:false, indexGrid:12},
                        {_id:fields[2]._id, collection:"students", width:"300px", visibilityGrid:false, indexGrid:15},
                        {_id:fields[0]._id, collection:"students", width:"400px", visibilityGrid:true, indexGrid:6, qview:"studentsInfos"},
                        {_id:fields[1]._id, collection:"students", visibility:true, visibilityGrid:true, qview:"studentsInfos"},
                        {_id:fields[2]._id, collection:"students", visibility:false, width:"700px", visibilityGrid:true, indexGrid:8, qview:"studentsInfos"},
                        {_id:fields[0]._id, collection:"students", visibilityGrid:true, visibility:true, qview:"studentsInfos", sourceid:"studentsInfoscopy"},
                        {_id:fields[1]._id, collection:"students", width:"900px", visibility:false, visibilityGrid:false, indexGrid:20, qview:"studentsInfos", sourceid:"studentsInfoscopy"},
                        {_id:fields[2]._id, collection:"students", width:"1000px", visibilityGrid:false, indexGrid:17, qview:"studentsInfos", sourceid:"studentsInfoscopy"}
                    ], scope:"admin"}
                ]);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"students", sourceid:"students"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(false);
                expect(fields[1].width).to.eql("300px");
                expect(fields[1].indexGrid).to.eql(10);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("300px");
                expect(fields[2].indexGrid).to.eql(15);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentInfos"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(true);
                expect(fields[0].visibilityGrid).to.eql(true);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(true);
                expect(fields[1].width).to.eql("400px");
                expect(fields[1].indexGrid).to.eql(6);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(false);
                expect(fields[2].visibilityGrid).to.eql(true);
                expect(fields[2].width).to.eql("700px");
                expect(fields[2].indexGrid).to.eql(8);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentsInfoscopy" }
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("900px");
                expect(fields[0].indexGrid).to.eql(20);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(true);
                expect(fields[1].visibilityGrid).to.eql(true);
                expect(fields[1].width).to.eql("400px");
                expect(fields[1].indexGrid).to.eql(6);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(false);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("1000px");
                expect(fields[2].indexGrid).to.eql(17);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("admin level for local and global db", function (done) {
        var db = undefined;
        var collection = undefined;
        var fields = undefined;
        var qviews = undefined;
        var globalDB = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                return db.getGlobalDB();
            }).then(
            function (gdb) {
                globalDB = gdb;
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"students"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", width:"100px", type:"string", collectionid:{$query:{collection:"students"}}, ui:"text", visibility:true, index:2},
                        {field:"age", width:"100px", type:"number", collectionid:{$query:{collection:"students"}}, ui:"number", visibility:true, index:3},
                        {field:"sex", width:"100px", type:"string", collectionid:{$query:{collection:"students"}}, ui:"text", visibility:true, index:4}
                    ]},
                    {$collection:"pl.qviews", $insert:[
                        {label:"Students", id:"students", collection:{$query:{collection:"students"}}, mainCollection:{$query:{collection:"students"}}},
                        {label:"Students Info", id:"studentsInfos", collection:{$query:{collection:"students"}}, mainCollection:{$query:{collection:"students"}}}
                    ]}
                ];
                return globalDB.update(collectionDefination);
            }).then(
            function () {
                return db.query({$collection:"pl.collections", $filter:{collection:"students"}});
            }).then(
            function (result) {
                collection = result.result[0];
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"students"}});
            }).then(
            function (result) {
                fields = result.result;
            }).then(
            function () {
                return db.query({$collection:"pl.qviews", $filter:{"collection.collection":"students"}});
            }).then(
            function (result) {
                qviews = result.result;
            }).then(
            function () {
                return globalDB.invokeFunction("SaveUserState.saveFieldCustomization", [
                    {fieldCustomizations:[
                        {_id:fields[0]._id, collection:"students", width:"300px", visibility:false, visibilityGrid:false, indexGrid:10},
                        {_id:fields[1]._id, collection:"students", width:"300px", visibility:false, visibilityGrid:false, indexGrid:12},
                        {_id:fields[2]._id, collection:"students", width:"300px", visibilityGrid:false, indexGrid:15},
                        {_id:fields[0]._id, collection:"students", width:"400px", visibilityGrid:true, indexGrid:6, qview:"studentsInfos"},
                        {_id:fields[1]._id, collection:"students", visibility:true, visibilityGrid:true, qview:"studentsInfos"},
                        {_id:fields[2]._id, collection:"students", visibility:false, width:"700px", visibilityGrid:true, indexGrid:8, qview:"studentsInfos"}
                    ], scope:"admin"}
                ]);
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, globalDB);
            }).then(
            function () {
                return db.invokeFunction("SaveUserState.saveFieldCustomization", [
                    {fieldCustomizations:[
                        {_id:fields[0]._id, collection:"students", width:"400px", visibilityGrid:true, indexGrid:6, qview:"studentsInfos"},
                        {_id:fields[1]._id, collection:"students", visibility:true, visibilityGrid:true, qview:"studentsInfos"},
                        {_id:fields[2]._id, collection:"students", visibility:false, width:"700px", visibilityGrid:true, indexGrid:8, qview:"studentsInfos"},
                        {_id:fields[0]._id, collection:"students", visibilityGrid:true, visibility:true, qview:"studentsInfos", sourceid:"studentsInfoscopy"},
                        {_id:fields[1]._id, collection:"students", width:"900px", visibility:false, visibilityGrid:false, indexGrid:20, qview:"studentsInfos", sourceid:"studentsInfoscopy"},
                        {_id:fields[2]._id, collection:"students", width:"1000px", visibilityGrid:false, indexGrid:17, qview:"studentsInfos", sourceid:"studentsInfoscopy"}
                    ], scope:"admin"}
                ]);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"students", sourceid:"students"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(view.viewOptions.dataError).to.eql(undefined);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(false);
                expect(fields[1].width).to.eql("300px");
                expect(fields[1].indexGrid).to.eql(10);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("300px");
                expect(fields[2].indexGrid).to.eql(15);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentInfos"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(true);
                expect(fields[0].visibilityGrid).to.eql(true);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(true);
                expect(fields[1].width).to.eql("400px");
                expect(fields[1].indexGrid).to.eql(6);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(false);
                expect(fields[2].visibilityGrid).to.eql(true);
                expect(fields[2].width).to.eql("700px");
                expect(fields[2].indexGrid).to.eql(8);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentsInfoscopy" }
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("900px");
                expect(fields[0].indexGrid).to.eql(20);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(true);
                expect(fields[1].visibilityGrid).to.eql(true);
                expect(fields[1].width).to.eql("400px");
                expect(fields[1].indexGrid).to.eql(6);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(false);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("1000px");
                expect(fields[2].indexGrid).to.eql(17);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("self level", function (done) {
        var db = undefined;
        var collection = undefined;
        var fields = undefined;
        var qviews = undefined;
        var sachinDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"students"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", width:"100px", type:"string", collectionid:{$query:{collection:"students"}}, ui:"text", visibility:true, index:2},
                        {field:"age", width:"100px", type:"number", collectionid:{$query:{collection:"students"}}, ui:"number", visibility:true, index:3},
                        {field:"sex", width:"100px", type:"string", collectionid:{$query:{collection:"students"}}, ui:"text", visibility:true, index:4}
                    ]},
                    {$collection:"pl.qviews", $insert:[
                        {label:"Students", id:"students", collection:{$query:{collection:"students"}}, mainCollection:{$query:{collection:"students"}}},
                        {label:"Students Info", id:"studentsInfos", collection:{$query:{collection:"students"}}, mainCollection:{$query:{collection:"students"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return db.query({$collection:"pl.collections", $filter:{collection:"students"}});
            }).then(
            function (result) {
                collection = result.result[0];
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"students"}});
            }).then(
            function (result) {
                fields = result.result;
            }).then(
            function () {
                return db.query({$collection:"pl.qviews", $filter:{"collection.collection":"students"}});
            }).then(
            function (result) {
                qviews = result.result;
            }).then(
            function () {
                return db.invokeFunction("SaveUserState.saveFieldCustomization", [
                    {fieldCustomizations:[
                        {_id:fields[0]._id, collection:"students", width:"400px", visibilityGrid:true, indexGrid:6, qview:"studentsInfos"},
                        {_id:fields[1]._id, collection:"students", visibility:true, visibilityGrid:true, qview:"studentsInfos"},
                        {_id:fields[2]._id, collection:"students", visibility:false, width:"700px", visibilityGrid:true, indexGrid:8, qview:"studentsInfos"},
                        {_id:fields[0]._id, collection:"students", visibilityGrid:true, visibility:true, qview:"studentsInfos", sourceid:"studentsInfoscopy"},
                        {_id:fields[1]._id, collection:"students", width:"900px", visibility:false, visibilityGrid:false, indexGrid:20, qview:"studentsInfos", sourceid:"studentsInfoscopy"},
                        {_id:fields[2]._id, collection:"students", width:"1000px", visibilityGrid:false, indexGrid:17, qview:"studentsInfos", sourceid:"studentsInfoscopy"}
                    ]}
                ]);
            }).then(
            function () {
                return db.invokeFunction("SaveUserState.saveFieldCustomization", [
                    {fieldCustomizations:[
                        {_id:fields[0]._id, collection:"students", width:"300px", visibility:false, visibilityGrid:false, indexGrid:10},
                        {_id:fields[1]._id, collection:"students", width:"300px", visibility:false, visibilityGrid:false, indexGrid:12},
                        {_id:fields[2]._id, collection:"students", width:"300px", visibilityGrid:false, indexGrid:15}
                    ], "scope":"admin"}
                ]);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"students", sourceid:"students"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(false);
                expect(fields[1].width).to.eql("300px");
                expect(fields[1].indexGrid).to.eql(10);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("300px");
                expect(fields[2].indexGrid).to.eql(15);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentInfos"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(true);
                expect(fields[0].visibilityGrid).to.eql(true);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(true);
                expect(fields[1].width).to.eql("400px");
                expect(fields[1].indexGrid).to.eql(6);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(false);
                expect(fields[2].visibilityGrid).to.eql(true);
                expect(fields[2].width).to.eql("700px");
                expect(fields[2].indexGrid).to.eql(8);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentsInfoscopy" }
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("900px");
                expect(fields[0].indexGrid).to.eql(20);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(true);
                expect(fields[1].visibilityGrid).to.eql(true);
                expect(fields[1].width).to.eql("400px");
                expect(fields[1].indexGrid).to.eql(6);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(false);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("1000px");
                expect(fields[2].indexGrid).to.eql(17);
            }).then(
            function () {
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Developer"}
                ]};
                return db.update(createRoles);
            }).then(
            function (rolesData) {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (dbName) {
                sachinDb = dbName;
            }).then(
            function () {
                return sachinDb.invokeFunction("view.getView", [
                    {id:"students", sourceid:"students"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(false);
                expect(fields[1].width).to.eql("300px");
                expect(fields[1].indexGrid).to.eql(10);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("300px");
                expect(fields[2].indexGrid).to.eql(15);
            }).then(
            function () {
                return sachinDb.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentInfos"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(false);
                expect(fields[1].width).to.eql("300px");
                expect(fields[1].indexGrid).to.eql(10);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("300px");
                expect(fields[2].indexGrid).to.eql(15);
            }).then(
            function () {
                return sachinDb.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentsInfoscopy" }
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(false);
                expect(fields[1].width).to.eql("300px");
                expect(fields[1].indexGrid).to.eql(10);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("300px");
                expect(fields[2].indexGrid).to.eql(15);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Remove Customization", function (done) {
        var db = undefined;
        var collection = undefined;
        var fields = undefined;
        var qviews = undefined;
        var globalDB = undefined;
        var adminDB = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
            }).then(
            function () {
                return db.getGlobalDB();
            }).then(
            function (gdb) {
                globalDB = gdb;
            }).then(
            function () {
                return db.getAdminDB();
            }).then(
            function (adb) {
                adminDB = adb;
                return adminDB.query({$collection:"pl.dbs", $filter:{db:db.db.databaseName}});
            }).then(
            function (result) {
                return adminDB.update({$collection:"pl.dbs", $update:{_id:result.result[0]._id, $set:{admindb:globalDB.db.databaseName}}});
            }).then(
            function () {
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"students"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", width:"100px", type:"string", collectionid:{$query:{collection:"students"}}, ui:"text", visibility:true, index:2},
                        {field:"age", width:"100px", type:"number", collectionid:{$query:{collection:"students"}}, ui:"number", visibility:true, index:3},
                        {field:"sex", width:"100px", type:"string", collectionid:{$query:{collection:"students"}}, ui:"text", visibility:true, index:4}
                    ]},
                    {$collection:"pl.qviews", $insert:[
                        {label:"Students", id:"students", collection:{$query:{collection:"students"}}, mainCollection:{$query:{collection:"students"}}},
                        {label:"Students Info", id:"studentsInfos", collection:{$query:{collection:"students"}}, mainCollection:{$query:{collection:"students"}}}
                    ]}
                ];
                return globalDB.update(collectionDefination);
            }).then(
            function () {
                return db.query({$collection:"pl.collections", $filter:{collection:"students"}});
            }).then(
            function (result) {
                collection = result.result[0];
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"students"}});
            }).then(
            function (result) {
                fields = result.result;
            }).then(
            function () {
                return db.query({$collection:"pl.qviews", $filter:{"collection.collection":"students"}});
            }).then(
            function (result) {
                qviews = result.result;
            }).then(
            function () {
                return globalDB.invokeFunction("SaveUserState.saveFieldCustomization", [
                    {fieldCustomizations:[
                        {_id:fields[0]._id, collection:"students", width:"300px", visibility:false, visibilityGrid:false, indexGrid:10},
                        {_id:fields[1]._id, collection:"students", width:"300px", visibility:false, visibilityGrid:false, indexGrid:12},
                        {_id:fields[2]._id, collection:"students", width:"300px", visibilityGrid:false, indexGrid:15},
                        {_id:fields[0]._id, collection:"students", width:"400px", visibilityGrid:true, indexGrid:6, qview:"studentsInfos"},
                        {_id:fields[1]._id, collection:"students", visibility:true, visibilityGrid:true, qview:"studentsInfos"},
                        {_id:fields[2]._id, collection:"students", visibility:false, width:"700px", visibilityGrid:true, indexGrid:8, qview:"studentsInfos"}
                    ], scope:"admin"}
                ]);
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, globalDB);
            }).then(
            function () {
                return db.invokeFunction("SaveUserState.saveFieldCustomization", [
                    {fieldCustomizations:[
                        {_id:fields[0]._id, collection:"students", width:"400px", visibilityGrid:true, indexGrid:6, qview:"studentsInfos"},
                        {_id:fields[1]._id, collection:"students", visibility:true, visibilityGrid:true, qview:"studentsInfos"},
                        {_id:fields[2]._id, collection:"students", visibility:false, width:"700px", visibilityGrid:true, indexGrid:8, qview:"studentsInfos"},
                        {_id:fields[0]._id, collection:"students", visibilityGrid:true, visibility:true, qview:"studentsInfos", sourceid:"studentsInfoscopy"},
                        {_id:fields[1]._id, collection:"students", width:"900px", visibility:false, visibilityGrid:false, indexGrid:20, qview:"studentsInfos", sourceid:"studentsInfoscopy"},
                        {_id:fields[2]._id, collection:"students", width:"1000px", visibilityGrid:false, indexGrid:17, qview:"studentsInfos", sourceid:"studentsInfoscopy"}
                    ], scope:"admin"}
                ]);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"students", sourceid:"students"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(view.viewOptions.dataError).to.eql(undefined);
                expect(view.viewOptions.collectionLevelCustomization).to.eql(true);
                expect(view.viewOptions.qviewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.viewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.userLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.fieldCustomizationDatabases).to.eql(["northwindtestcases","northwindtestcaseglobal"]);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(false);
                expect(fields[1].width).to.eql("300px");
                expect(fields[1].indexGrid).to.eql(10);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("300px");
                expect(fields[2].indexGrid).to.eql(15);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentInfos"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(view.viewOptions.collectionLevelCustomization).to.eql(true);
                expect(view.viewOptions.qviewLevelCustomization).to.eql(true);
                expect(view.viewOptions.viewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.userLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.fieldCustomizationDatabases).to.eql(["northwindtestcases","northwindtestcaseglobal"]);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(true);
                expect(fields[0].visibilityGrid).to.eql(true);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(true);
                expect(fields[1].width).to.eql("400px");
                expect(fields[1].indexGrid).to.eql(6);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(false);
                expect(fields[2].visibilityGrid).to.eql(true);
                expect(fields[2].width).to.eql("700px");
                expect(fields[2].indexGrid).to.eql(8);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentsInfoscopy" }
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(view.viewOptions.collectionLevelCustomization).to.eql(true);
                expect(view.viewOptions.qviewLevelCustomization).to.eql(true);
                expect(view.viewOptions.viewLevelCustomization).to.eql(true);
                expect(view.viewOptions.userLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.fieldCustomizationDatabases).to.eql(["northwindtestcases","northwindtestcaseglobal"]);
                expect(fields).to.have.length(3);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("900px");
                expect(fields[0].indexGrid).to.eql(20);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(true);
                expect(fields[1].visibilityGrid).to.eql(true);
                expect(fields[1].width).to.eql("400px");
                expect(fields[1].indexGrid).to.eql(6);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(false);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("1000px");
                expect(fields[2].indexGrid).to.eql(17);
            }).then(
            function () {
                return db.invokeFunction("SaveUserState.deleteFieldCustomization", [
                    {"collection":"students", "qview":"studentsInfos", "sourceid":"studentsInfoscopy", scope:"admin"}
                ])
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentsInfoscopy"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(view.viewOptions.collectionLevelCustomization).to.eql(true);
                expect(view.viewOptions.qviewLevelCustomization).to.eql(true);
                expect(view.viewOptions.viewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.userLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.fieldCustomizationDatabases).to.eql(["northwindtestcases","northwindtestcaseglobal"]);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(true);
                expect(fields[0].visibilityGrid).to.eql(true);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(true);
                expect(fields[1].width).to.eql("400px");
                expect(fields[1].indexGrid).to.eql(6);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(false);
                expect(fields[2].visibilityGrid).to.eql(true);
                expect(fields[2].width).to.eql("700px");
                expect(fields[2].indexGrid).to.eql(8);
            }).then(
            function () {
                return db.invokeFunction("SaveUserState.deleteFieldCustomization", [
                    {"collection":"students", "qview":"studentsInfos", scope:"admin"}
                ])
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentsInfoscopy"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(view.viewOptions.dataError).to.eql(undefined);
                expect(view.viewOptions.collectionLevelCustomization).to.eql(true);
                expect(view.viewOptions.qviewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.viewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.userLevelCustomization).to.eql(undefined);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(false);
                expect(fields[1].width).to.eql("300px");
                expect(fields[1].indexGrid).to.eql(10);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("300px");
                expect(fields[2].indexGrid).to.eql(15);
            }).then(
            function () {
                return db.invokeFunction("SaveUserState.deleteFieldCustomization", [
                    {"collection":"students", scope:"admin"}
                ])
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentsInfoscopy"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(view.viewOptions.collectionLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.qviewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.viewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.userLevelCustomization).to.eql(undefined);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(true);
                expect(fields[0].visibilityGrid).to.eql(undefined);
                expect(fields[0].width).to.eql("100px");
                expect(fields[0].index).to.eql(3);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(true);
                expect(fields[1].visibilityGrid).to.eql(undefined);
                expect(fields[1].width).to.eql("100px");
                expect(fields[1].index).to.eql(2);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(undefined);
                expect(fields[2].width).to.eql("100px");
                expect(fields[2].index).to.eql(4);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Remove User Customization", function (done) {
        var db = undefined;
        var collection = undefined;
        var fields = undefined;
        var qviews = undefined;
        var sachinDb = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var collectionDefination = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"students"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", width:"100px", type:"string", collectionid:{$query:{collection:"students"}}, ui:"text", visibility:true, index:2},
                        {field:"age", width:"100px", type:"number", collectionid:{$query:{collection:"students"}}, ui:"number", visibility:true, index:3},
                        {field:"sex", width:"100px", type:"string", collectionid:{$query:{collection:"students"}}, ui:"text", visibility:true, index:4}
                    ]},
                    {$collection:"pl.qviews", $insert:[
                        {label:"Students", id:"students", collection:{$query:{collection:"students"}}, mainCollection:{$query:{collection:"students"}}},
                        {label:"Students Info", id:"studentsInfos", collection:{$query:{collection:"students"}}, mainCollection:{$query:{collection:"students"}}}
                    ]}
                ];
                return db.update(collectionDefination);
            }).then(
            function () {
                return db.query({$collection:"pl.collections", $filter:{collection:"students"}});
            }).then(
            function (result) {
                collection = result.result[0];
            }).then(
            function () {
                return db.query({$collection:"pl.fields", $filter:{"collectionid.collection":"students"}});
            }).then(
            function (result) {
                fields = result.result;
            }).then(
            function () {
                return db.query({$collection:"pl.qviews", $filter:{"collection.collection":"students"}});
            }).then(
            function (result) {
                qviews = result.result;
            }).then(
            function () {
                return db.invokeFunction("SaveUserState.saveFieldCustomization", [
                    {fieldCustomizations:[
                        {_id:fields[0]._id, collection:"students", width:"400px", visibilityGrid:true, indexGrid:6, qview:"studentsInfos"},
                        {_id:fields[1]._id, collection:"students", visibility:true, visibilityGrid:true, qview:"studentsInfos"},
                        {_id:fields[2]._id, collection:"students", visibility:false, width:"700px", visibilityGrid:true, indexGrid:8, qview:"studentsInfos"},
                        {_id:fields[0]._id, collection:"students", visibilityGrid:true, visibility:true, qview:"studentsInfos", sourceid:"studentsInfoscopy"},
                        {_id:fields[1]._id, collection:"students", width:"900px", visibility:false, visibilityGrid:false, indexGrid:20, qview:"studentsInfos", sourceid:"studentsInfoscopy"},
                        {_id:fields[2]._id, collection:"students", width:"1000px", visibilityGrid:false, indexGrid:17, qview:"studentsInfos", sourceid:"studentsInfoscopy"}
                    ]}
                ]);
            }).then(
            function () {
                return db.invokeFunction("SaveUserState.saveFieldCustomization", [
                    {fieldCustomizations:[
                        {_id:fields[0]._id, collection:"students", width:"300px", visibility:false, visibilityGrid:false, indexGrid:10},
                        {_id:fields[1]._id, collection:"students", width:"300px", visibility:false, visibilityGrid:false, indexGrid:12},
                        {_id:fields[2]._id, collection:"students", width:"300px", visibilityGrid:false, indexGrid:15}
                    ], "scope":"admin"}
                ]);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"students", sourceid:"students"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(view.viewOptions.collectionLevelCustomization).to.eql(true);
                expect(view.viewOptions.qviewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.viewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.userLevelCustomization).to.eql(undefined);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(false);
                expect(fields[1].width).to.eql("300px");
                expect(fields[1].indexGrid).to.eql(10);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("300px");
                expect(fields[2].indexGrid).to.eql(15);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentInfos"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(view.viewOptions.collectionLevelCustomization).to.eql(true);
                expect(view.viewOptions.qviewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.viewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.userLevelCustomization).to.eql(true);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(true);
                expect(fields[0].visibilityGrid).to.eql(true);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(true);
                expect(fields[1].width).to.eql("400px");
                expect(fields[1].indexGrid).to.eql(6);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(false);
                expect(fields[2].visibilityGrid).to.eql(true);
                expect(fields[2].width).to.eql("700px");
                expect(fields[2].indexGrid).to.eql(8);
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentsInfoscopy" }
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(view.viewOptions.collectionLevelCustomization).to.eql(true);
                expect(view.viewOptions.qviewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.viewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.userLevelCustomization).to.eql(true);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("900px");
                expect(fields[0].indexGrid).to.eql(20);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(true);
                expect(fields[1].visibilityGrid).to.eql(true);
                expect(fields[1].width).to.eql("400px");
                expect(fields[1].indexGrid).to.eql(6);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(false);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("1000px");
                expect(fields[2].indexGrid).to.eql(17);
            }).then(
            function () {
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"Developer"}
                ]};
                return db.update(createRoles);
            }).then(
            function (rolesData) {
                var createUsers = {$collection:"pl.users", $insert:[
                    {username:"Sachin_Developer", password:"sachin", emailid:"sachin.bansal@daffodilsw.com", roles:[
                        {role:{$query:{role:"Developer"}}}
                    ]}
                ], $modules:{"Role":0}};
                return db.update(createUsers);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {username:"Sachin_Developer", password:"sachin", roles:"Developer"});
            }).then(
            function (dbName) {
                sachinDb = dbName;
            }).then(
            function () {
                return sachinDb.invokeFunction("view.getView", [
                    {id:"students", sourceid:"students"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(false);
                expect(fields[1].width).to.eql("300px");
                expect(fields[1].indexGrid).to.eql(10);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("300px");
                expect(fields[2].indexGrid).to.eql(15);
            }).then(
            function () {
                return sachinDb.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentInfos"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(false);
                expect(fields[1].width).to.eql("300px");
                expect(fields[1].indexGrid).to.eql(10);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("300px");
                expect(fields[2].indexGrid).to.eql(15);
            }).then(
            function () {
                return sachinDb.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentsInfoscopy" }
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(false);
                expect(fields[1].width).to.eql("300px");
                expect(fields[1].indexGrid).to.eql(10);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("300px");
                expect(fields[2].indexGrid).to.eql(15);
            }).then(
            function () {
                return db.invokeFunction("SaveUserState.deleteFieldCustomization", [
                    {"collection":"students", "qview":"studentsInfos", "sourceid":"studentsInfoscopy"}
                ])
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentsInfoscopy"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(view.viewOptions.collectionLevelCustomization).to.eql(true);
                expect(view.viewOptions.qviewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.viewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.userLevelCustomization).to.eql(true);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(true);
                expect(fields[0].visibilityGrid).to.eql(true);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(true);
                expect(fields[1].width).to.eql("400px");
                expect(fields[1].indexGrid).to.eql(6);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(false);
                expect(fields[2].visibilityGrid).to.eql(true);
                expect(fields[2].width).to.eql("700px");
                expect(fields[2].indexGrid).to.eql(8);
            }).then(
            function () {
                return db.invokeFunction("SaveUserState.deleteFieldCustomization", [
                    {"collection":"students", "qview":"studentsInfos"}
                ])
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentsInfoscopy"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(view.viewOptions.dataError).to.eql(undefined);
                expect(view.viewOptions.collectionLevelCustomization).to.eql(true);
                expect(view.viewOptions.qviewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.viewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.userLevelCustomization).to.eql(undefined);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(false);
                expect(fields[0].visibilityGrid).to.eql(false);
                expect(fields[0].width).to.eql("300px");
                expect(fields[0].indexGrid).to.eql(12);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(false);
                expect(fields[1].visibilityGrid).to.eql(false);
                expect(fields[1].width).to.eql("300px");
                expect(fields[1].indexGrid).to.eql(10);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(false);
                expect(fields[2].width).to.eql("300px");
                expect(fields[2].indexGrid).to.eql(15);
            }).then(
            function () {
                return db.invokeFunction("SaveUserState.deleteFieldCustomization", [
                    {"collection":"students",scope:"admin"}
                ])
            }).then(
            function () {
                return db.invokeFunction("view.getView", [
                    {id:"studentsInfos", sourceid:"studentsInfoscopy"}
                ])
            }).then(
            function (view) {
                var fields = view.viewOptions.fields;
                expect(view.viewOptions.collectionLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.qviewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.viewLevelCustomization).to.eql(undefined);
                expect(view.viewOptions.userLevelCustomization).to.eql(undefined);
                expect(fields).to.have.length(3);
                expect(fields[0].field).to.eql("age");
                expect(fields[0].visibility).to.eql(true);
                expect(fields[0].visibilityGrid).to.eql(undefined);
                expect(fields[0].width).to.eql("100px");
                expect(fields[0].index).to.eql(3);
                expect(fields[1].field).to.eql("name");
                expect(fields[1].visibility).to.eql(true);
                expect(fields[1].visibilityGrid).to.eql(undefined);
                expect(fields[1].width).to.eql("100px");
                expect(fields[1].index).to.eql(2);
                expect(fields[2].field).to.eql("sex");
                expect(fields[2].visibility).to.eql(true);
                expect(fields[2].visibilityGrid).to.eql(undefined);
                expect(fields[2].width).to.eql("100px");
                expect(fields[2].index).to.eql(4);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
})