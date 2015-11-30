/**
 * mocha --recursive --timeout 30000 -g "Applicationtestcase" --reporter spec
 * mocha --recursive --timeout 30000 -g "testcase" --reporter spec
 *  Created with IntelliJ IDEA.
 * User: Rajit
 * Date: 15/5/14
 * Time: 9:58 AM
 * To change this template use File | Settings | File Templates.
 */
var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("Applicationtestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    it("Application Test case 1", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.applications", $insert:[
                        {_id:11, "label":"TestingApp", "db":"MyTestApp"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.applications"});
            }).then(
            function (plappdata) {
                expect(plappdata.result).to.have.length(1);
                expect(plappdata.result[0].label).to.eql("TestingApp");
                expect(plappdata.result[0]._id).to.eql(11);
                expect(plappdata.result[0].db).to.eql("northwindtestcases");
                expect(plappdata.result[0].roles[0].role.role).to.eql("TestingApp");
                return db.query({$collection:"pl.roles"});
            }).then(
            function (plrolesdata) {
                expect(plrolesdata.result).to.have.length(1);
                expect(plrolesdata.result[0].role).to.eql("TestingApp");
                return db.query({$collection:"pl.users"});
            }).then(
            function (plusersdata) {
                expect(plusersdata.result[0].roles[0].role.role).to.eql("TestingApp");
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Update id in application error", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.applications", $insert:[
                        {_id:11, "label":"TestingApp", "db":"MyTestApp"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.applications"});
            }).then(
            function (plappdata) {
                expect(plappdata.result).to.have.length(1);
                return db.update({$collection:"pl.applications", $update:{_id:plappdata.result[0]._id, $set:{id:"test"}}});
            }).fail(
            function (err) {
                if (err.toString().indexOf("Update is not allowed in [ id ] in collection") === -1) {
                    throw err;
                }
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Application Test without DB", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.applications", $insert:[
                        {_id:11, "label":"TestingApp"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.applications"});
            }).then(
            function (plappdata) {
                expect(plappdata.result).to.have.length(1);
                expect(plappdata.result[0].label).to.eql("TestingApp");
                expect(plappdata.result[0]._id).to.eql(11);
                expect(plappdata.result[0].db).to.eql("northwindtestcases");
                expect(plappdata.result[0].roles[0].role.role).to.eql("TestingApp");
                return db.query({$collection:"pl.roles"});
            }).then(
            function (plrolesdata) {
                expect(plrolesdata.result).to.have.length(1);
                expect(plrolesdata.result[0].role).to.eql("TestingApp");
                return db.query({$collection:"pl.users"});
            }).then(
            function (plusersdata) {
                expect(plusersdata.result[0].roles[0].role.role).to.eql("TestingApp");
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("cancel document for contact support", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var modifyPerson = {   name:"cancelJob", source:"NorthwindTestCase/lib/PersonJob"};
                event = [
                    {
                        function:modifyPerson,
                        event:"onSave",
                        pre:true
                    }
                ];

                var updates = [
                    {$collection:{"collection":"pl.contactSupportssssss", "events":event}, $insert:[
                        {"subject":"hello", "description":"Hello Daffodilsw"}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function (data) {
                expect(data["pl.contactSupportssssss"].$insert[0].subject).to.eql("hello")
                expect(data["pl.contactSupportssssss"].$insert[0].description).to.eql("Hello Daffodilsw")
                done();
            }).fail(function (err) {
                done(err);
            });

    });

    it("Menu Insert", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.applications", $insert:[
                        {_id:11, "label":"TestingApp", "db":"MyTestApp"}
                    ]},
                    {$collection:"pl.menus", $insert:[
                        {"label":"Testing Menu", "collection":"menutesting", application:{$query:{"label":"TestingApp"}}}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"pl.menus", $modules:false, $events:false});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].label).to.eql("Testing Menu");
                expect(data.result[0].collection).to.eql("menutesting");
                expect(data.result[0].qviews).to.have.length(1);
                expect(data.result[0].qviews[0].id).to.eql("menutesting");
                expect(data.result[0].qviews[0].collection).to.eql("menutesting");
                expect(data.result[0].qviews[0].label).to.eql("Testing Menu");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("Menu Insert with qviews", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.applications", $insert:[
                        {_id:11, "label":"TestingApp", "db":"MyTestApp"}
                    ]},
                    {$collection:"pl.menus", $insert:[
                        {"label":"Testing Menu", "collection":"menutesting", application:{$query:{"label":"TestingApp"}}, qviews:[
                            {"id":"menutesting1", "collection":"menutesting1", label:"Testing Menu 1"}
                        ]}
                    ]}
                ];
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"pl.menus", $modules:false, $events:false});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].label).to.eql("Testing Menu");
                expect(data.result[0].collection).to.eql("menutesting");
                expect(data.result[0].qviews).to.have.length(1);
                expect(data.result[0].qviews[0].id).to.eql("menutesting1");
                expect(data.result[0].qviews[0].collection).to.eql("menutesting1");
                expect(data.result[0].qviews[0].label).to.eql("Testing Menu 1");
                done();
            }).fail(function (err) {
                done(err);
            });
    });

    it("Menu Update", function (done) {
        var db = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var updates = [
                    {$collection:"pl.applications", $insert:[
                        {_id:11, "label":"TestingApp", "db":"MyTestApp"}
                    ]},
                    {$collection:"pl.menus", $insert:[
                        {"label":"Testing Menu", "collection":"menutesting", application:{$query:{"label":"TestingApp"}}}
                    ]}
                ]
                return db.update(updates);
            }).then(
            function () {
                return db.query({$collection:"pl.menus", $modules:false, $events:false});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].label).to.eql("Testing Menu");
                expect(data.result[0].collection).to.eql("menutesting");
                expect(data.result[0].qviews).to.have.length(1);
                expect(data.result[0].qviews[0].id).to.eql("menutesting");
                expect(data.result[0].qviews[0].collection).to.eql("menutesting");
                expect(data.result[0].qviews[0].label).to.eql("Testing Menu");
                return db.update({$collection:"pl.menus", $update:{_id:data.result[0]._id, $set:{"collection":"menutesting2"}}});
            }).then(
            function (data) {
                expect(data).to.eql("not ok");
                done();
            }).fail(function (err) {
                if (err.message === "Collection name cannot be changed in menus . New collection [menutesting2] .. Old collection [menutesting]") {
                    done();
                } else {
                    done(err);
                }
            });
    });

    it("application , menu and qview insert and update to check identifier", function (done) {
        var db = undefined;
        var applicationid = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                var insert = [
                    {$collection:"pl.applications", $insert:[
                        {_id:11, "label":"Profit&Loss Account", "db":"MyTestApp"}
                    ]}
                ]
                return db.update(insert);
            }).then(
            function () {
                return db.query({$collection:"pl.applications"});
            }).then(
            function (plappdata) {
                expect(plappdata.result).to.have.length(1);
                expect(plappdata.result[0].label).to.eql("Profit&Loss Account");
                expect(plappdata.result[0].uri).to.eql("profit-loss-account");
                applicationid = plappdata.result[0]._id;
                return db.update({$collection:"pl.applications", $update:{_id:applicationid, $set:{label:"New Profit&Loss"}}});
            }).then(
            function () {
                return db.query({$collection:"pl.applications"});
            }).then(
            function (plappdata) {
                expect(plappdata.result).to.have.length(1);
                expect(plappdata.result[0].label).to.eql("New Profit&Loss");
                expect(plappdata.result[0].uri).to.eql("new-profit-loss");
                var update = {$collection:"pl.menus", $insert:[
                    {"label":"Me&My Company", "collection":"menutesting", application:{$query:{"label":"New Profit&Loss"}}}
                ]};
                return db.update(update);
            }).then(
            function () {
                return db.query({$collection:"pl.menus", $filter:{application:applicationid}});
            }).then(
            function (menus) {
                expect(menus.result).to.have.length(1);
                expect(menus.result[0].label).to.eql("Me&My Company");
                expect(menus.result[0].uri).to.eql("me-my-company");
                expect(menus.result[0].qviews).to.have.length(1);
                expect(menus.result[0].qviews[0].label).to.eql("Me&My Company");
                expect(menus.result[0].qviews[0].uri).to.eql("me-my-company");
                return db.update({$collection:"pl.menus", $update:{_id:menus.result[0]._id, $set:{label:"Sons&Sons company", qviews:{$update:[
                    {_id:menus.result[0].qviews[0]._id, $set:{"label":"Testing&Menu% Qviews"}}
                ], $insert:[
                    {id:"newqview", label:"My&#ThirdView", collection:"mycollection"}
                ]}}}})
            }).then(
            function () {
                return db.query({$collection:"pl.menus", $filter:{application:applicationid}});
            }).then(
            function (menus) {
                expect(menus.result).to.have.length(1);
                expect(menus.result[0].label).to.eql("Sons&Sons company");
                expect(menus.result[0].uri).to.eql("sons-sons-company");
                expect(menus.result[0].qviews).to.have.length(2);
                expect(menus.result[0].qviews[0].label).to.eql("Testing&Menu% Qviews");
                expect(menus.result[0].qviews[0].uri).to.eql("testing-menu-qviews");
                expect(menus.result[0].qviews[1].label).to.eql("My&#ThirdView");
                expect(menus.result[0].qviews[1].uri).to.eql("my-thirdview");
                return db.update({$collection:"pl.menus", $insert:[
                    {"label":"Second#$Menu", "collection":"mycollection", application:{$query:{"label":"New Profit&Loss"}},
                        qviews:[
                            {id:"myqview", label:"My#$Second*&Qview", collection:"mycollection"}
                        ]}
                ]})
            }).then(
            function () {
                return db.query({$collection:"pl.menus", $filter:{"collection":"mycollection", application:applicationid}})
            }).then(
            function (menus) {
                expect(menus.result).to.have.length(1);
                expect(menus.result[0].label).to.eql("Second#$Menu");
                expect(menus.result[0].uri).to.eql("second-menu");
                expect(menus.result[0].qviews).to.have.length(1);
                expect(menus.result[0].qviews[0].label).to.eql("My#$Second*&Qview");
                expect(menus.result[0].qviews[0].uri).to.eql("my-second-qview");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })

    })


})