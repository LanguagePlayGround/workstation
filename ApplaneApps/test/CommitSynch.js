var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");
var Commit = require("../lib/apps/Commit.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Porting = require("../lib/apps/Porting.js");
var NewPorting = require("../lib/apps/NewPorting.js");
var Synch = require("../lib/apps/Synch.js");
//mocha --recursive --timeout 150000 -g "commit sync" --reporter spec


describe("commit sync testcases", function () {

    beforeEach(function (done) {
        Testcases.beforeEach().then(
            function () {
                return ApplaneDB.getAdminDB();
            }).then(
            function (adminDB) {
                var adminDb = adminDB;
                var insertDbs = {$collection: "pl.dbs", $insert: [
                    {"db": "afb", "sandboxDb": "afb_sb", "globalDb": "", "ensureDefaultCollections": true, "guestUserName": "afb", "globalUserName": "afb", "globalPassword": "afb", "globalUserAdmin": true, autoSynch: false},
                    {"db": "daffodil", "sandboxDb": "daffodil_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "daffodil", "globalUserName": "daffodil", "globalPassword": "daffodil", "globalUserAdmin": true, autoSynch: false}
                ]};
                return adminDb.update(insertDbs);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });
    })

    afterEach(function (done) {

        var dbs = {};
        dropDatabase1(dbs)
            .then(
            function () {
                var keys = Object.keys(dbs);
                return Utils.iterateArrayWithPromise(keys, function (index, dbName) {
                    var db = dbs[dbName]
                    return db.dropDatabase();
                })
            }).then(
            function () {
                return Testcases.afterEach();
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    // This testcases(2) are for appcenterDeveloper user

    it('commit test case for new appcenter pl_applications', function (done) {
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var daffodil_SbDb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl_applications", $insert: [
                    {"menus": JSON.stringify({name: "Task management"}), id: "user1"},
                    {"menus": JSON.stringify({name: "Book management"}), id: "user2"}
                ]});
            }).then(function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afbDb = dbName;
                return afbDb.query({$collection: "pl_applications", $sort: {id: 1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].id).to.eql("user1");
                expect(data.result[0].menus).to.eql(JSON.stringify({name: "Task management"}));
                expect(data.result[1].id).to.eql("user2");
                expect(data.result[1].menus).to.eql(JSON.stringify({name: "Book management"}));
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return daffodil_SbDb.query({$collection: "pl_applications", $sort: {id: 1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].id).to.eql("user1");
                expect(data.result[0].menus).to.eql(JSON.stringify({name: "Task management"}));
                expect(data.result[1].id).to.eql("user2");
                expect(data.result[1].menus).to.eql(JSON.stringify({name: "Book management"}));
                var update = {$collection: "pl_applications", $update: [
                    {_id: data.result[1]._id, $set: {"menus": JSON.stringify({name: "Books", label: "Books"})}}
                ]};
                return daffodil_SbDb.update(update);
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl_applications", $sort: {id: 1}})
            }).then(function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl_applications", $insert: [
                    {"menus": JSON.stringify({name: "Account management"}), id: "user3"}
                ]});
            }).then(function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return daffodil_SbDb.query({$collection: "pl_applications", $sort: {id: 1}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].id).to.eql("user1");
                expect(data.result[0].menus).to.eql(JSON.stringify({name: "Task management"}));
                expect(data.result[1].id).to.eql("user2");
                expect(data.result[1].menus).to.eql(JSON.stringify({name: "Books", label: "Books"}));
                expect(data.result[2].id).to.eql("user3");
                expect(data.result[2].menus).to.eql(JSON.stringify({name: "Account management"}));
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('commit test case for new appcenter pl_views', function (done) {
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var daffodil_SbDb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(function (dbName) {
                afb_SbDb = dbName;
            }).then(function () {
                return afb_SbDb.update({$collection: "pl_views", $insert: [
                    {"struct": JSON.stringify({name: 'Tasks'}), id: "user1"},
                    {"struct": JSON.stringify({name: 'GroupTasks'}), id: "user2"}
                ]});
            }).then(function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(function () {
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
            }).then(function (dbName) {
                afbDb = dbName;
                return afbDb.query({$collection: "pl_views", $sort: {id: 1}});
            }).then(function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].id).to.eql("user1");
                expect(data.result[0].struct).to.eql(JSON.stringify({name: 'Tasks'}));
                expect(data.result[1].id).to.eql("user2");
                expect(data.result[1].struct).to.eql(JSON.stringify({name: 'GroupTasks'}));
            }).then(function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(function (dbName) {
                daffodil_SbDb = dbName;
                return daffodil_SbDb.query({$collection: "pl_views", $sort: {id: 1}});
            }).then(function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].id).to.eql("user1");
                expect(data.result[0].struct).to.eql(JSON.stringify({name: 'Tasks'}));
                expect(data.result[1].id).to.eql("user2");
                expect(data.result[1].struct).to.eql(JSON.stringify({name: 'GroupTasks'}));
                var update = {$collection: "pl_views", $update: [
                    {_id: data.result[1]._id, $set: {"struct": JSON.stringify({name: "TeamTasks", label: "Team Tasks"})}}
                ]};
                return daffodil_SbDb.update(update);
            }).then(function () {
                return daffodil_SbDb.query({$collection: "pl_views", $sort: {id: 1}})
            }).then(function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(function (dbName) {
                afb_SbDb = dbName;
            }).then(function () {
                return afb_SbDb.update({$collection: "pl_views", $insert: [
                    {"struct": JSON.stringify({name: 'Project Tasks'}), id: "user3"}
                ]});
            }).then(function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(function (dbName) {
                daffodil_SbDb = dbName;
                return daffodil_SbDb.query({$collection: "pl_views", $sort: {id: 1}});
            }).then(function (data) {
                expect(data.result).to.have.length(3);
                expect(data.result[0].id).to.eql("user1");
                expect(data.result[0].struct).to.eql(JSON.stringify({name: 'Tasks'}));
                expect(data.result[1].id).to.eql("user2");
                expect(data.result[1].struct).to.eql(JSON.stringify({name: "TeamTasks", label: "Team Tasks"}));
                expect(data.result[2].id).to.eql("user3");
                expect(data.result[2].struct).to.eql(JSON.stringify({name: 'Project Tasks'}));
            }).then(function () {
                done();
            }).catch(function (err) {
                done(err);
            });
    });

    it("delete already deleted qviews", function (done) {
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var fieldid = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.collections", $insert: {collection: "tasks"}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.qviews", $insert: [
                    {id: "tasks", collection: {$query: {collection: "tasks"}}, mainCollection: {$query: {collection: "tasks"}}, label: "Tasks"},
                    {id: "task1", collection: {$query: {collection: "tasks"}}, mainCollection: {$query: {collection: "tasks"}}, label: "Task1"}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.qviews", $filter: {"collection.collection": "tasks", label: "Task1"}, $fields: {_id: 1}});
            }).then(
            function (result) {
                return afb_SbDb.update({$collection: "pl.qviews", $delete: [
                    {_id: result.result[0]._id}
                ]});
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.qviews", $filter: {"collection.collection": "tasks", label: "Task1"}, $fields: {_id: 1}});
            }).then(
            function (result) {
                return afb_SbDb.update({$collection: "pl.qviews", $delete: [
                    {_id: result.result[0]._id}
                ]});
            }).then(
            function () {
                done("Not Ok.");
            }).fail(
            function (err) {
                if (err.toString().indexOf("Record Already deleted for document") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    })

    it("delete parent child menu together", function (done) {
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var admindb = undefined;
        var applicationId = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.applications", $insert: [
                    {"label": "Task management"}
                ]})
            }).then(
            function () {
                var menuInsert = {$collection: "pl.menus", $insert: [
                    {label: "Issues", application: {$query: {label: "Task management"}}, collection: "issues", index: 10},
                    {label: "Child Issues", application: {$query: {label: "Task management"}}, collection: "issues", index: 10, parentmenu: {$query: {label: "Issues", application: {$query: {label: "Task management"}}}}}

                ]};
                return afb_SbDb.update(menuInsert);
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.query({$collection: "pl.applications", $sort: {label: 1}});
            }).then(
            function (applicationData) {
                applicationId = applicationData.result[0]._id;//bookmanagement
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}});
            }).then(
            function (menuData) {
                return afb_SbDb.update({$collection: "pl.menus",
                    $delete: [
                        {_id: menuData.result[0]._id},
                        {_id: menuData.result[1]._id}
                    ]
                })
            }).then(
            function () {
                done("Not Ok.");
            }).fail(
            function (err) {
                if (err.toString().indexOf("Record Already deleted for document") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    })

    it("update menu and parent menu and commit", function (done) {
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var admindb = undefined;
        var applicationId = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.applications", $insert: [
                    {"label": "Task management"}
                ]})
            }).then(
            function () {
                var menuInsert = {$collection: "pl.menus", $insert: [
                    {label: "Issues", application: {$query: {label: "Task management"}}, collection: "issues", index: 10},
                    {label: "Child Issues", application: {$query: {label: "Task management"}}, collection: "issues", index: 11}

                ]};
                return afb_SbDb.update(menuInsert);
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.query({$collection: "pl.applications", $sort: {label: 1}});
            }).then(
            function (applicationData) {
                applicationId = applicationData.result[0]._id;//bookmanagement
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, label: "Child Issues"}});
            }).then(
            function (menuData) {
                return afb_SbDb.update({$collection: "pl.menus",
                    $update: [
                        {_id: menuData.result[0]._id, $set: {label: "Issues", parentmenu: {$query: {label: "Issues", application: {$query: {label: "Task management"}}}}}}
                    ]
                })
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it('commit test case with set unset', function (done) {
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var daffodilDb = undefined;
        var collectionid = undefined;
        var version = undefined;
        var admindb = undefined;
        var recordCount = undefined;
        var daffodil_SbDb = undefined;
        var applicationId = undefined;
        var applicationId2 = undefined;
        var fieldId = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.applications", $insert: [
                    {"label": "Task management"},
                    {"label": "Book management"}
                ]})
            }).then(
            function () {
                var menuInsert = {$collection: "pl.menus", $insert: [
                    {label: "Issues", application: {$query: {label: "Task management"}}, collection: "issues", index: 10},
                    {label: "Features", application: {$query: {label: "Task management"}}, collection: "features", index: 20},
                    {label: "Roadmap", application: {$query: {label: "Task management"}}, collection: "roadmap", index: 30},
                    {label: "Comments", application: {$query: {label: "Task management"}}, collection: "comments", index: 40},
                    {label: "Account", application: {$query: {label: "Book management"}}, collection: "account", index: 50},
                    {label: "Account Groups", application: {$query: {label: "Book management"}}, collection: "accountGroups", index: 60},
                    {label: "Vouchers", application: {$query: {label: "Book management"}}, collection: "vouchers", index: 70},
                    {label: "Banks", application: {$query: {label: "Book management"}}, collection: "banks", index: 80}
                ]};
                return afb_SbDb.update(menuInsert);
            }).then(
            function () {
                var fields = {$collection: "pl.fields", $insert: [
                    {index: 10, field: "issue", label: "Issue", mandatory: true, filterable: true, type: "string", collectionid: {$query: {collection: "issues"}}} ,
                    {index: 20, field: "desc", label: "Desc", mandatory: true, filterable: true, type: "string", collectionid: {$query: {collection: "issues"}}} ,
                    {index: 30, field: "duedate", label: "DueDate", mandatory: true, filterable: true, type: "string", collectionid: {$query: {collection: "issues"}}} ,
                    {index: 40, field: "feature", label: "Feature", mandatory: true, filterable: true, type: "string", collectionid: {$query: {collection: "features"}}} ,
                    {index: 50, field: "desc", label: "Desc", mandatory: true, filterable: true, type: "string", collectionid: {$query: {collection: "features"}}} ,
                    {index: 60, field: "duedate", label: "DueDate", mandatory: true, filterable: true, type: "string", collectionid: {$query: {collection: "features"}}} ,
                    {index: 70, field: "roadmap", label: "Roadmap", mandatory: true, filterable: true, type: "string", collectionid: {$query: {collection: "roadmap"}}} ,
                    {index: 80, field: "desc", label: "Desc", mandatory: true, filterable: true, type: "string", collectionid: {$query: {collection: "roadmap"}}} ,
                    {index: 90, field: "duedate", label: "DueDate", mandatory: true, filterable: true, type: "string", collectionid: {$query: {collection: "roadmap"}}} ,
                    {index: 70, field: "comment", label: "Comment", mandatory: true, filterable: true, type: "string", collectionid: {$query: {collection: "comments"}}} ,
                    {index: 80, field: "date", label: "Date", mandatory: true, filterable: true, type: "string", collectionid: {$query: {collection: "comments"}}}
                ]};
                return afb_SbDb.update(fields);
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afbDb = dbName;
                return expectData(afbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return expectData(daffodil_SbDb);
            }).then(
            function () {
                var menuInsert = {$collection: "pl.menus", $insert: [
                    {label: "Projects", application: {$query: {label: "Task management"}}, collection: "projects", index: 90},
                    {label: "Invoices", application: {$query: {label: "Book management"}}, collection: "invoices", index: 100},
                    {label: "Receipts", application: {$query: {label: "Book management"}}, collection: "receipts", index: 110}
                ]};
                return daffodil_SbDb.update(menuInsert);
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.applications", $sort: {label: 1}})
            }).then(
            function (applicationData) {
                applicationId2 = applicationData.result[0]._id;//bookmanagement
                applicationId = applicationData.result[1]._id;//taskmanagemetn
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, label: {"$in": ["Comments", "Features"]}}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                return daffodil_SbDb.update({$collection: "pl.menus",
                    $update: {_id: menuData.result[1]._id, $set: {label: "Daffodil Features"}},
                    $delete: {_id: menuData.result[0]._id}
                })
            }).then(
            function () {
                return daffodil_SbDb.update({$collection: "pl.applications", $update: {_id: applicationId2, $set: {label: "Book Keeping"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId2, label: {"$in": ["Account", "Account Groups", "Vouchers", "Banks"]}}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                return daffodil_SbDb.update({$collection: "pl.menus", $update: [
                    {_id: menuData.result[0]._id, $set: {label: "Entities"}},
                    {_id: menuData.result[1]._id, $set: {label: "Entities Group"}}
                ], $delete: [
                    {_id: menuData.result[2]._id},
                    {_id: menuData.result[3]._id}
                ]})
            }).then(
            function () {
                return daffodil_SbDb.update({$collection: "pl.fields", $insert: [
                    {index: 90, field: "owner", label: "Owner", type: "string", collectionid: {$query: {collection: "issues"}}},
                    {index: 100, field: "featureOwner", label: "Feature Owner", type: "string", collectionid: {$query: {collection: "features"}}}
                ]});
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues", field: {"$in": ["issue", "duedate"]}}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields",
                    $update: {_id: fieldsData.result[1]._id, $set: {label: "Bug", fts: true}, $unset: {mandatory: ""}},
                    $delete: {_id: fieldsData.result[0]._id}
                })
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "features", field: "desc"}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {label: "Description", groupable: true, searchable: false}, $unset: {mandatory: "", filterable: ""}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "roadmap", field: {"$in": ["desc", "duedate"]}}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldsData.result[0]._id, $set: {label: "Description"}},
                    {_id: fieldsData.result[1]._id, $set: {label: "Delivery Date"}}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return daffodilDb.query({$collection: "pl.applications", $sort: {label: 1}})

            }).then(
            function (applicationData) {
                expect(applicationData.result).to.have.length(2);
                expect(applicationData.result[0].label).to.eql("Book Keeping")
                expect(applicationData.result[1].label).to.eql("Task management")
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(4);
                expect(menuData.result[0].label).to.eql("Daffodil Features");
                expect(menuData.result[1].label).to.eql("Issues");
                expect(menuData.result[2].label).to.eql("Projects");
                expect(menuData.result[3].label).to.eql("Roadmap");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId2}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(4);
                expect(menuData.result[0].label).to.eql("Entities");
                expect(menuData.result[1].label).to.eql("Entities Group");
                expect(menuData.result[2].label).to.eql("Invoices");
                expect(menuData.result[3].label).to.eql("Receipts");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(3);
                expect(fieldsData.result[0].label).to.eql("Desc");
                expect(fieldsData.result[0].field).to.eql("desc");
                expect(fieldsData.result[0].mandatory).to.eql(true);
                expect(fieldsData.result[0].filterable).to.eql(true);
                expect(fieldsData.result[1].label).to.eql("Bug");
                expect(fieldsData.result[1].field).to.eql("issue");
                expect(fieldsData.result[1].mandatory).to.eql(undefined);
                expect(fieldsData.result[1].filterable).to.eql(true);
                expect(fieldsData.result[1].fts).to.eql(true);
                expect(fieldsData.result[2].label).to.eql("Owner");
                expect(fieldsData.result[2].field).to.eql("owner");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "features"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(4);
                expect(fieldsData.result[0].label).to.eql("Description");
                expect(fieldsData.result[0].field).to.eql("desc");
                expect(fieldsData.result[0].mandatory).to.eql(undefined);
                expect(fieldsData.result[0].filterable).to.eql(undefined);
                expect(fieldsData.result[0].groupable).to.eql(true);
                expect(fieldsData.result[0].searchable).to.eql(false);
                expect(fieldsData.result[1].label).to.eql("DueDate");
                expect(fieldsData.result[1].field).to.eql("duedate");
                expect(fieldsData.result[1].mandatory).to.eql(true);
                expect(fieldsData.result[1].filterable).to.eql(true);
                expect(fieldsData.result[2].label).to.eql("Feature");
                expect(fieldsData.result[2].field).to.eql("feature");
                expect(fieldsData.result[2].mandatory).to.eql(true);
                expect(fieldsData.result[2].filterable).to.eql(true);
                expect(fieldsData.result[3].label).to.eql("Feature Owner");
                expect(fieldsData.result[3].field).to.eql("featureOwner");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "roadmap"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(3);
                expect(fieldsData.result[0].label).to.eql("Description");
                expect(fieldsData.result[0].field).to.eql("desc");
                expect(fieldsData.result[0].mandatory).to.eql(true);
                expect(fieldsData.result[0].filterable).to.eql(true);
                expect(fieldsData.result[1].label).to.eql("Delivery Date");
                expect(fieldsData.result[1].field).to.eql("duedate");
                expect(fieldsData.result[1].mandatory).to.eql(true);
                expect(fieldsData.result[1].filterable).to.eql(true);
                expect(fieldsData.result[2].label).to.eql("Roadmap");
                expect(fieldsData.result[2].field).to.eql("roadmap");
                expect(fieldsData.result[2].mandatory).to.eql(true);
                expect(fieldsData.result[2].filterable).to.eql(true);
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "roadmap", field: {"$in": ["desc", "duedate"]}}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $delete: [
                    {_id: fieldsData.result[0]._id},
                    {_id: fieldsData.result[1]._id}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "roadmap"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result[0].label).to.eql("Roadmap");
                expect(fieldsData.result[0].mandatory).to.eql(true);
                expect(fieldsData.result[0].filterable).to.eql(true);
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.applications", $update: [
                    {_id: applicationId, $set: {label: "Productivity"}},
                    {_id: applicationId2, $set: {label: "Book Keeping"}}
                ]})
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(4);
                expect(menuData.result[0].label).to.eql("Comments");
                expect(menuData.result[1].label).to.eql("Features");
                expect(menuData.result[2].label).to.eql("Issues");
                expect(menuData.result[3].label).to.eql("Roadmap");

                return afb_SbDb.update({$collection: "pl.menus", $update: [
                    {_id: menuData.result[1]._id, $set: {label: "All Features", index: 50, searchable: true}},
                    {_id: menuData.result[3]._id, $set: {label: "Future Tasks", index: 70}},
                    {_id: menuData.result[0]._id, $set: {label: "All Comments", index: 20}}
                ], $insert: [
                    {label: "Release", application: {$query: {label: "Productivity"}}, collection: "release"},
                    {label: "Backlogs", application: {$query: {label: "Productivity"}}, collection: "backlogs"}
                ], $delete: [
                    {_id: menuData.result[2]._id}
                ]})
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId2}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(4);
                expect(menuData.result[0].label).to.eql("Account");
                expect(menuData.result[1].label).to.eql("Account Groups");
                expect(menuData.result[2].label).to.eql("Banks");
                expect(menuData.result[3].label).to.eql("Vouchers");

                return afb_SbDb.update({$collection: "pl.menus", $update: [
                    {_id: menuData.result[0]._id, $set: {searchable: true, sortable: true}},
                    {_id: menuData.result[2]._id, $set: {searchable: true, sortable: true}},
                    {_id: menuData.result[3]._id, $set: {searchable: true, sortable: true}}
                ], $delete: [
                    {_id: menuData.result[1]._id}
                ]})

            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}})
            }).then(
            function (fieldsData) {
//                expect(fieldsData.result[0].label).to.eql("Desc");
//                expect(fieldsData.result[0].mandatory).to.eql(true);
//                expect(fieldsData.result[0].filterable).to.eql(true);
//                expect(fieldsData.result[1].label).to.eql("DueDate");
//                expect(fieldsData.result[1].mandatory).to.eql(true);
//                expect(fieldsData.result[1].filterable).to.eql(true);
//                expect(fieldsData.result[2].label).to.eql("Issue");
//                expect(fieldsData.result[2].mandatory).to.eql(true);
//                expect(fieldsData.result[2].filterable).to.eql(true);

                return afb_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldsData.result[2]._id, $set: {mandatory: false, fts: false, filterable: false, groupable: true}, $unset: {label: ""}},
                    {_id: fieldsData.result[0]._id, $set: {label: "Description", sortable: true}, $unset: {mandatory: "", filterable: ""}}
                ], $insert: [
                    {field: "issue_date", label: "Issue Date", type: "date", collectionid: {$query: {collection: "issues"}}} ,
                    {field: "issued_by", label: "Issued By", type: "string", collectionid: {$query: {collection: "issues"}}}
                ]})
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues", field: "issue"}})
            }).then(
            function (fieldsData) {
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {recursionEnabled: true, label: "All Issues"}}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.actions", $insert: [
                    {type: "invoke", id: "addIssue", label: "Add Issue", collectionid: {$query: {collection: "issues"}}},
                    {type: "invoke", id: "removeIssue", label: "Remove Issue", collectionid: {$query: {collection: "issues"}}}
                ] })
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "features"}, $sort: {label: 1}})
            }).then(
            function (fieldsData) {
//                expect(fieldsData.result).to.have.length(3);
//                expect(fieldsData.result[0].label).to.eql("Desc");
//                expect(fieldsData.result[0].mandatory).to.eql(true);
//                expect(fieldsData.result[0].filterable).to.eql(true);
//                expect(fieldsData.result[1].label).to.eql("DueDate");
//                expect(fieldsData.result[1].mandatory).to.eql(true);
//                expect(fieldsData.result[1].filterable).to.eql(true);
//                expect(fieldsData.result[2].label).to.eql("Feature");
//                expect(fieldsData.result[2].mandatory).to.eql(true);
//                expect(fieldsData.result[2].filterable).to.eql(true);

                return afb_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldsData.result[2]._id, $set: {label: "Features", groupable: true}}
                ], $delete: [
                    {_id: fieldsData.result[0]._id},
                    {_id: fieldsData.result[1]._id}
                ]})
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "features", field: "feature"}})
            }).then(
            function (fieldsData) {
                fieldId = fieldsData.result[0]._id;
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldId, $unset: {mandatory: "", filterable: ""}}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldId, $set: {mandatory: false}}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldId, $unset: {groupable: ""}}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldId, $set: {groupable: false}}})
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "features", field: "feature"}});
            }).then(
            function (fieldsData) {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.applications", $sort: {label: 1}});

            }).then(
            function (applicationData) {
                expect(applicationData.result).to.have.length(2);
                expect(applicationData.result[0].label).to.eql("Book Keeping");
                expect(applicationData.result[1].label).to.eql("Productivity");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                expect(menuData.result[0].label).to.eql("Backlogs");
                expect(menuData.result[1].label).to.eql("Daffodil Features");
                expect(menuData.result[1].index).to.eql(50);
                expect(menuData.result[1].searchable).to.eql(true);
                expect(menuData.result[2].label).to.eql("Future Tasks");
                expect(menuData.result[2].index).to.eql(70);
                expect(menuData.result[3].label).to.eql("Projects");
                expect(menuData.result[4].label).to.eql("Release");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId2}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                expect(menuData.result[0].label).to.eql("Entities");
                expect(menuData.result[0].sortable).to.eql(true);
                expect(menuData.result[0].searchable).to.eql(true);
                expect(menuData.result[1].label).to.eql("Invoices");
                expect(menuData.result[2].label).to.eql("Receipts");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(5);
                expect(fieldsData.result[0].label).to.eql("Description");
                expect(fieldsData.result[0].field).to.eql("desc");
                expect(fieldsData.result[0].mandatory).to.eql(undefined);
                expect(fieldsData.result[0].filterable).to.eql(undefined);
                expect(fieldsData.result[0].sortable).to.eql(true);
                expect(fieldsData.result[1].label).to.eql("Bug");
                expect(fieldsData.result[1].field).to.eql("issue");
                expect(fieldsData.result[1].mandatory).to.eql(undefined);
                expect(fieldsData.result[1].filterable).to.eql(false);
                expect(fieldsData.result[1].groupable).to.eql(true);
                expect(fieldsData.result[1].recursionEnabled).to.eql(true);
                expect(fieldsData.result[2].label).to.eql("Issue Date");
                expect(fieldsData.result[2].field).to.eql("issue_date");
                expect(fieldsData.result[3].label).to.eql("Issued By");
                expect(fieldsData.result[3].field).to.eql("issued_by");
                expect(fieldsData.result[4].field).to.eql("owner");
                expect(fieldsData.result[4].label).to.eql("Owner");
                return daffodilDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}});
            }).then(
            function (actionsData) {
                expect(actionsData.result).to.have.length(2);
                expect(actionsData.result[0].label).to.eql("Add Issue");
                expect(actionsData.result[1].label).to.eql("Remove Issue");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "features"}, $sort: {field: 1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].field).to.eql("feature");
                expect(fieldsData.result[0].label).to.eql("Features");
                expect(fieldsData.result[0].groupable).to.eql(false);
                expect(fieldsData.result[0].mandatory).to.eql(false);
                expect(fieldsData.result[0].filterable).to.eql(undefined);
                expect(fieldsData.result[1].label).to.eql("Feature Owner");
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})

            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "desc", label: "Desc", mandatory: true, filterable: true, type: "string", collectionid: {$query: {collection: "features"}}},
                    {field: "duedate", label: "Due Date", type: "date", mandatory: true, filterable: true, collectionid: {$query: {collection: "features"}}}
                ] })
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "features", field: "desc"}})
            }).then(
            function (fieldsData) {
                fieldId = fieldsData.result[0]._id;
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldId, $set: {mandatory: false, filterable: false}}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldId, $unset: {mandatory: "", label: ""}}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldId, $unset: {filterable: ""}}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldId, $set: {label: "Description", groupable: true, filterable: false}}})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "features"}, $sort: {field: 1}});
            }).then(function (fieldsData) {
                expect(fieldsData.result).to.have.length(4);
                expect(fieldsData.result[0].field).to.eql("desc");
                expect(fieldsData.result[0].label).to.eql("Description");
                expect(fieldsData.result[0].groupable).to.eql(true);
                expect(fieldsData.result[0].mandatory).to.eql(undefined);
                expect(fieldsData.result[0].filterable).to.eql(false);
                expect(fieldsData.result[1].label).to.eql("Due Date");
                expect(fieldsData.result[1].mandatory).to.eql(true);
                expect(fieldsData.result[1].filterable).to.eql(true);
                expect(fieldsData.result[2].field).to.eql("feature");
                expect(fieldsData.result[2].label).to.eql("Features");
                expect(fieldsData.result[2].groupable).to.eql(false);
                expect(fieldsData.result[2].mandatory).to.eql(false);
                expect(fieldsData.result[2].filterable).to.eql(undefined);
                expect(fieldsData.result[3].label).to.eql("Feature Owner");
            })
            .then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})

            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.collections", $insert: {collection: "milestones"}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "name", type: "string", label: "Name", searchable: true, groupable: true, collectionid: {$query: {collection: "milestones"}}},
                    {field: "dueDate", type: "date", label: "Due Date", searchable: true, groupable: true, collectionid: {$query: {collection: "milestones"}}}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return daffodilDb.query({$collection: "pl.collections", $filter: {collection: "milestones"}, $fields: {_id: 1}})
            }).then(
            function (collectionData) {
                expect(collectionData.result).to.have.length(1);
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "milestones"}, $sort: {field: 1}});

            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].field).to.eql("dueDate");
                expect(fieldsData.result[0].label).to.eql("Due Date");
                expect(fieldsData.result[0].groupable).to.eql(true);
                expect(fieldsData.result[0].searchable).to.eql(true);
                expect(fieldsData.result[1].field).to.eql("name");
                expect(fieldsData.result[1].label).to.eql("Name");
                expect(fieldsData.result[1].searchable).to.eql(true);
                expect(fieldsData.result[1].groupable).to.eql(true);
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "milestones"}, $sort: {field: 1}, $fields: {_id: 1}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldsData.result[0]._id, $set: {label: "Deliver Date"}, $unset: {searchable: "", groupable: ""}},
                    {_id: fieldsData.result[1]._id, $set: {label: "Milestone", searchable: false}, $unset: {groupable: ""}}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return daffodilDb.query({$collection: "pl.collections", $filter: {collection: "milestones"}, $fields: {_id: 1}})

            }).then(
            function (collectionData) {
                expect(collectionData.result).to.have.length(1);
                collectionid = collectionData.result[0]._id;
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "milestones"}, $sort: {field: 1}});

            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].field).to.eql("dueDate");
                expect(fieldsData.result[0].label).to.eql("Deliver Date");
                expect(fieldsData.result[0].groupable).to.eql(undefined);
                expect(fieldsData.result[0].searchable).to.eql(undefined);
                expect(fieldsData.result[1].field).to.eql("name");
                expect(fieldsData.result[1].label).to.eql("Milestone");
                expect(fieldsData.result[1].searchable).to.eql(false);
                expect(fieldsData.result[1].groupable).to.eql(undefined);
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "milestones"}, $sort: {field: 1}, $fields: {_id: 1}});
            }).then(
            function (fieldsData) {
                return afb_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldsData.result[0]._id, $set: {groupable: false}, $unset: {searchable: ""}},
                    {_id: fieldsData.result[1]._id, $set: {label: "New Milestone", groupable: false}, $unset: {searchable: ""}}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"});
            }).then(
            function (dbName) {
                afbDb = dbName;
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "milestones"}, $sort: {field: 1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].field).to.eql("dueDate");
                expect(fieldsData.result[0].label).to.eql("Due Date");
                expect(fieldsData.result[0].groupable).to.eql(false);
                expect(fieldsData.result[0].searchable).to.eql(undefined);
                expect(fieldsData.result[1].field).to.eql("name");
                expect(fieldsData.result[1].label).to.eql("New Milestone");
                expect(fieldsData.result[1].searchable).to.eql(undefined);
                expect(fieldsData.result[1].groupable).to.eql(false);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return daffodilDb.getAdminDB();

            }).then(
            function (adminDb) {
                admindb = adminDb;
                return admindb.query({$collection: "pl.changelogs", $filter: {mainCollection: "pl.collections", "mainFk._id": collectionid}, $group: {_id: null, version: {$max: "$version"}}})
            }).then(
            function (data) {
                version = data.result[0].version;
                return admindb.query({$collection: "pl.changelogs", $filter: {mainCollection: "pl.collections", "mainFk._id": collectionid}, $group: {_id: null, count: {$sum: 1}}})
            }).then(
            function (changeLogData) {
                recordCount = changeLogData.result[0].count;
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);

            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "milestones"}, $sort: {field: 1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].field).to.eql("dueDate");
                expect(fieldsData.result[0].label).to.eql("Deliver Date");
                expect(fieldsData.result[0].groupable).to.eql(undefined);
                expect(fieldsData.result[0].searchable).to.eql(undefined);
                expect(fieldsData.result[1].field).to.eql("name");
                expect(fieldsData.result[1].label).to.eql("Milestone");
                expect(fieldsData.result[1].searchable).to.eql(false);
                expect(fieldsData.result[1].groupable).to.eql(undefined);
            }).then(
            function () {
                return admindb.query({$collection: "pl.changelogs", $filter: {mainCollection: "pl.collections", "mainFk._id": collectionid}, $group: {_id: null, version: {$max: "$version"}}});
            }).then(
            function (data) {
                expect(data.result[0].version).to.eql((version + 1));
                return admindb.query({$collection: "pl.changelogs", $filter: {mainCollection: "pl.collections", "mainFk._id": collectionid}, $group: {_id: null, count: {$sum: 1}}});
            }).then(
            function (changeLogData) {
                expect(changeLogData.result[0].count).to.eql((recordCount + 1));

            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })

    });


    it('insert,update and delete in array case', function (done) {
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var daffodilDb = undefined;
        var applicationId = undefined;
        var menuId = undefined;
        var qviews = undefined;

        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.applications", $insert: [
                    {"label": "Productivity"}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.menus", $insert: [
                    {label: "Tasks", application: {$query: {label: "Productivity"}}, collection: "tasks", index: 10}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return daffodilDb.query({$collection: "pl.applications", $fields: {_id: 1}})
            }).then(
            function (applicationData) {
                applicationId = applicationData.result[0]._id;
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}});
            }).then(
            function (menuData) {
                menuId = menuData.result[0]._id;
                qviews = menuData.result[0].qviews;
                return daffodilDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {label: "Menu Task"}}})
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {qviews: {$insert: [
                    {label: "Overdue Tasks", id: "overdueTasks", collection: "tasks"}
                ]}}}})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}});
            }).then(
            function (menuData) {
                qviews = menuData.result[0].qviews;
                return afb_SbDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {qviews: {$update: [
                    {_id: qviews[1]._id, $set: {label: "Afb OverDue Tasks"}}
                ]}}}})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {qviews: {$delete: [
                    {_id: qviews[1]._id}
                ]
                }}}});
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}})
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("Menu Task");
                expect(menuData.result[0].qviews).to.have.length(1);
                expect(menuData.result[0].qviews[0].label).to.eql("Tasks");
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    })

    it('insert, update and delete in collection before sync', function (done) {
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var daffodilDb = undefined;
        var fieldid = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.collections", $insert: {collection: "tasks"}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: {field: "task", collectionid: {$query: {collection: "tasks"}}, label: "Task", type: "string"}})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks"}, $fields: {_id: 1}});
            }).then(
            function (fieldsData) {
                return daffodilDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {mandatory: true}}})
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.fields", $insert: {field: "date", collectionid: {$query: {collection: "tasks"}}, label: "Date", type: "date"}})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks", field: "date"}, $fields: {_id: 1}});
            }).then(
            function (fieldsData) {
                fieldid = fieldsData.result[0]._id;
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldid, $set: {label: "Due Date"}}})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $delete: {_id: fieldid}})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks"}, $sort: {field: 1}, $fields: {_id: 1, field: 1, mandatory: 1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].mandatory).to.eql(true);
                expect(fieldsData.result[0].field).to.eql("task");
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });


    it('test case with two level array', function (done) {
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var daffodilDb = undefined;
        var daffodil_SbDb = undefined;
        var roleId = undefined;
        var privilegeId = undefined;
        var operationInfoId = undefined;


        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"}).then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.collections", $insert: {collection: "tasks"}});
            }).then(
            function () {
                var createRoles = {$collection: "pl.roles", $insert: [
                    {role: "Developer", privileges: [
                        {type: "Collection", collection: "tasks", operationInfos: {$insert: [
                            {type: "find", sequence: 0},
                            {type: "update", sequence: 1}
                        ]}}
                    ]}
                ]
                };
                return afb_SbDb.update(createRoles);
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return daffodilDb.query({$collection: "pl.roles"});
            }).then(
            function (roleData) {

                expect(roleData.result).to.have.length(1);
                expect(roleData.result[0].role).to.eql("Developer")
                expect(roleData.result[0].privileges).to.have.length(1);
                expect(roleData.result[0].privileges[0].operationInfos).to.have.length(2);
                expect(roleData.result[0].privileges[0].operationInfos[0].type).to.eql("find");
                expect(roleData.result[0].privileges[0].operationInfos[1].type).to.eql("update");

                roleId = roleData.result[0]._id;
                privilegeId = roleData.result[0].privileges[0]._id;
                operationInfoId = roleData.result[0].privileges[0].operationInfos[0]._id;
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})

            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.roles", $update: {_id: roleId, $set: {privileges: {$update: {_id: privilegeId, $set: {fieldsAvailability: "Include"}}}}}})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return daffodil_SbDb.update({$collection: "pl.roles", $update: {_id: roleId, $set: {privileges: {$update: {_id: privilegeId, $set: {filterUI: "json"}}}}}})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.roles"})

            }).then(
            function (roleData) {
                expect(roleData.result).to.have.length(1);
                expect(roleData.result[0].role).to.eql("Developer")
                expect(roleData.result[0].privileges).to.have.length(1);
                expect(roleData.result[0].privileges[0].filterUI).to.eql("json");
                expect(roleData.result[0].privileges[0].fieldsAvailability).to.eql("Include");
                expect(roleData.result[0].privileges[0].operationInfos).to.have.length(2);
                expect(roleData.result[0].privileges[0].operationInfos[0].type).to.eql("find");
                expect(roleData.result[0].privileges[0].operationInfos[1].type).to.eql("update");
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;

                //updating an operationInfo
                var operationInfoUpdate = {$collection: "pl.roles",
                    $update: {_id: roleId,
                        $set: {privileges: {$update: [
                            {_id: privilegeId,
                                $set: {operationInfos: {$update: [
                                    {_id: operationInfoId, $set: {primaryFields: true}}
                                ]}}
                            }
                        ]}}
                    }};
                return daffodil_SbDb.update(operationInfoUpdate);
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.roles", $sort: {role: 1}})
            }).then(
            function (roleData) {
                expect(roleData.result).to.have.length(1);
                expect(roleData.result[0].role).to.eql("Developer")
                expect(roleData.result[0].privileges).to.have.length(1);

                expect(roleData.result[0].privileges[0].operationInfos).to.have.length(2);
                expect(roleData.result[0].privileges[0].operationInfos[0].type).to.eql("find");
                expect(roleData.result[0].privileges[0].operationInfos[0].primaryFields).to.eql(true);
                expect(roleData.result[0].privileges[0].operationInfos[1].type).to.eql("update");

                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                var operationInfoUpdate = {$collection: "pl.roles",
                    $update: {_id: roleId,
                        $set: {privileges: {$update: [
                            {_id: privilegeId,
                                $set: {viewsAvailability: "Include", operationInfos: {$update: [
                                    {_id: operationInfoId, $set: {primaryFields: false}}
                                ], $insert: [
                                    {type: "delete", sequence: 6}
                                ]} }
                            }
                        ]}}
                    }};
                return afb_SbDb.update(operationInfoUpdate);
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afbDb = dbName;
                return afbDb.query({$collection: "pl.roles", $sort: {role: 1}})
            }).then(
            function (roleData) {
                expect(roleData.result).to.have.length(1);
                expect(roleData.result[0].role).to.eql("Developer")
                expect(roleData.result[0].privileges).to.have.length(1);
                expect(roleData.result[0].privileges[0].viewsAvailability).to.eql("Include");
                expect(roleData.result[0].privileges[0].operationInfos).to.have.length(3);
                expect(roleData.result[0].privileges[0].operationInfos[0].type).to.eql("find");
                expect(roleData.result[0].privileges[0].operationInfos[0].primaryFields).to.eql(false);
                expect(roleData.result[0].privileges[0].operationInfos[1].type).to.eql("update");
                expect(roleData.result[0].privileges[0].operationInfos[2].type).to.eql("delete");
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.roles", $sort: {role: 1}})
            }).then(
            function (roleData) {
                expect(roleData.result).to.have.length(1);
                expect(roleData.result[0].role).to.eql("Developer")
                expect(roleData.result[0].privileges).to.have.length(1);
                expect(roleData.result[0].privileges[0].viewsAvailability).to.eql("Include");
                expect(roleData.result[0].privileges[0].operationInfos).to.have.length(2);
                expect(roleData.result[0].privileges[0].operationInfos[0].type).to.eql("find");
                expect(roleData.result[0].privileges[0].operationInfos[0].primaryFields).to.eql(true);
                expect(roleData.result[0].privileges[0].operationInfos[1].type).to.eql("update");

            }).then(
            function () {
                var operationInfoUpdate = {$collection: "pl.roles",
                    $update: {_id: roleId,
                        $set: {privileges: {$update: [
                            {_id: privilegeId,
                                $set: {actionsAvailability: "Include", operationInfos: {$update: [
                                    {_id: operationInfoId, $set: {primaryFields: false}}
                                ], $insert: [
                                    {type: "delete", sequence: 6}
                                ]} }
                            }
                        ]}}
                    }};
                return daffodilDb.update(operationInfoUpdate);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.roles", $sort: {role: 1}})
            }).then(
            function (roleData) {
                expect(roleData.result).to.have.length(1);
                expect(roleData.result[0].role).to.eql("Developer")
                expect(roleData.result[0].privileges).to.have.length(1);
                expect(roleData.result[0].privileges[0].viewsAvailability).to.eql("Include");
                expect(roleData.result[0].privileges[0].actionsAvailability).to.eql("Include");
                expect(roleData.result[0].privileges[0].operationInfos).to.have.length(3);
                expect(roleData.result[0].privileges[0].operationInfos[0].type).to.eql("find");
                expect(roleData.result[0].privileges[0].operationInfos[0].primaryFields).to.eql(false);
                expect(roleData.result[0].privileges[0].operationInfos[1].type).to.eql("update");
                expect(roleData.result[0].privileges[0].operationInfos[2].type).to.eql("delete");

            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    })


    it('field update test case', function (done) {
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var daffodilDb = undefined;
        var daffodil_SbDb = undefined;
        var fieldid = undefined;
        var fieldid2 = undefined;

        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.collections", $insert: {collection: "employees"}})
            }).then(
            function () {
                var fields = {$collection: "pl.fields", $insert: [
                    {index: 10, field: "effort_required", type: "duration", collectionid: {$query: {collection: "employees"}}},
                    {index: 20, field: "effort_done", type: "duration", collectionid: {$query: {collection: "employees"}}}
                ]};
                return afb_SbDb.update(fields);
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function (fieldsData) {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return  daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $sort: {field: 1, "parentfieldid.field": 1}})

            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(8);
                expect(fieldsData.result[0].field).to.eql("convertedvalue");
                expect(fieldsData.result[0].parentfieldid.field).to.eql("effort_done");
                expect(fieldsData.result[1].field).to.eql("convertedvalue");
                expect(fieldsData.result[1].parentfieldid.field).to.eql("effort_required");
                expect(fieldsData.result[2].field).to.eql("effort_done");
                expect(fieldsData.result[3].field).to.eql("effort_required");
                expect(fieldsData.result[4].field).to.eql("time");
                expect(fieldsData.result[4].parentfieldid.field).to.eql("effort_done");
                expect(fieldsData.result[5].field).to.eql("time");
                expect(fieldsData.result[5].parentfieldid.field).to.eql("effort_required");
                expect(fieldsData.result[6].field).to.eql("unit");
                expect(fieldsData.result[6].parentfieldid.field).to.eql("effort_done");
                expect(fieldsData.result[7].field).to.eql("unit");
                expect(fieldsData.result[7].parentfieldid.field).to.eql("effort_required");

                fieldid = fieldsData.result[3]._id;
                fieldid2 = fieldsData.result[2]._id;

                //update effort_required from type duration to currency
                return daffodil_SbDb.update({$collection: "pl.fields", $update: {_id: fieldid, $set: {type: "currency"}}})
            }).then(
            function () {
                return  daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(7);
                expect(fieldsData.result[0].field).to.eql("amount");
                expect(fieldsData.result[0].parentfieldid.field).to.eql("effort_required");
                expect(fieldsData.result[1].field).to.eql("convertedvalue");
                expect(fieldsData.result[1].parentfieldid.field).to.eql("effort_done");
                expect(fieldsData.result[2].field).to.eql("effort_done");
                expect(fieldsData.result[3].field).to.eql("effort_required");
                expect(fieldsData.result[4].field).to.eql("time");
                expect(fieldsData.result[4].parentfieldid.field).to.eql("effort_done");
                expect(fieldsData.result[5].field).to.eql("type");
                expect(fieldsData.result[5].parentfieldid.field).to.eql("effort_required");
                expect(fieldsData.result[6].field).to.eql("unit");
                expect(fieldsData.result[6].parentfieldid.field).to.eql("effort_done");
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;

                //update effort_done from type duration to currency
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldid2, $set: {type: "currency"}}})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);

            }).then(
            function () {
                return  daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(6);
                expect(fieldsData.result[0].field).to.eql("amount");
                expect(fieldsData.result[0].parentfieldid.field).to.eql("effort_required");
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[1].parentfieldid.field).to.eql("effort_done");
                expect(fieldsData.result[2].field).to.eql("effort_done");
                expect(fieldsData.result[3].field).to.eql("effort_required");
                expect(fieldsData.result[4].field).to.eql("type");
                expect(fieldsData.result[4].parentfieldid.field).to.eql("effort_required");
                expect(fieldsData.result[5].field).to.eql("type");
                expect(fieldsData.result[5].parentfieldid.field).to.eql("effort_done");
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                if (err.toString().indexOf("Type can not be updated in fields in db") === -1) {
                    done(err);
                } else {
                    done();
                }
            })
    })


    it('all constant collections test case', function (done) {

        var afb_SbDb = undefined;
        var afbDb = undefined;
        var daffodil_SbDb = undefined;
        var daffodilDb = undefined;
        var fieldid = undefined;
        var applicationId = undefined;
        var qviews = undefined;
        var qviewId1 = undefined;
        var qviewId2 = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
            .then(
            function (dbName) {
                writeLog("1........")
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.collections", $insert: {collection: "employees"}})
            }).then(
            function () {
                writeLog("2........")
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "name", label: "Name", type: "string", collectionid: {$query: {collection: "employees"}}},
                    {field: "status", label: "Status", type: "string", collectionid: {$query: {collection: "employees"}}}
                ]})
            }).then(
            function () {
                writeLog("3........")
                return afb_SbDb.update({$collection: "pl.functions", $insert: {name: "TaskBL", source: "NorthwindTestCase/lib", type: "js"}})
            }).then(
            function () {
                writeLog("4........")
                return afb_SbDb.update({$collection: "pl.events", $insert: {event: "onSave", function: "TaskBL.onSave", collectionid: {$query: {collection: "employees"}}, pre: true}});
            }).then(
            function () {
                writeLog("5........")
                return afb_SbDb.update({$collection: "pl.actions", $insert: [
                    {type: "invoke", id: "portEmployees", label: "Port Employees", collectionid: {$query: {collection: "employees"}}}
                ] })
            }).then(
            function () {
                writeLog("6........")
                return afb_SbDb.update({$collection: "pl.templates", $insert: {template: "Template", collectionid: {$query: {collection: "employees"}}}})
            }).then(
            function () {
                writeLog("7........")
                return afb_SbDb.update({$collection: "pl.indexes", $insert: {collectionid: {$query: {collection: "employees"}}, name: "Index1", indexes: {name: 1}}})

            }).then(
            function () {
                writeLog("8........")
                return afb_SbDb.update({$collection: "pl.formgroups", $insert: {collectionid: {$query: {collection: "employees"}}, title: "Address", showLabel: true}})
            }).then(
            function () {
                writeLog("9........")
                return afb_SbDb.update({$collection: "pl.workflowevents", $insert: {
                    event: "Workflowevent",
                    collectionid: {$query: {collection: "employees"}}
                }})
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $fields: {_id: 1}});
            }).then(
            function (fieldsdata) {
                fieldid = fieldsdata.result[0]._id;
                writeLog("10........")
                return afb_SbDb.update({$collection: "pl.fieldcustomizations",
                    $insert: {collectionid: {$query: {collection: "employees"}}, fieldid: {_id: fieldid }, visibility: false, visibilityGrid: false, visibilityForm: true}
                })
            }).then(
            function () {
                writeLog("11........");
                return afb_SbDb.update({$collection: "pl.filterspace", $insert: {space: "pcenter"}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.applications", $insert: {label: "Productivity"}});
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.menus", $insert: [
                    {label: "Issues", application: {$query: {label: "Productivity"}}, collection: "issues"}
                ]});
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.applications", $fields: {_id: 1}})
            }).then(
            function (appplicationData) {
                writeLog("7.....");
                applicationId = appplicationData.result[0]._id;
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "issues"}})
            }).then(
            function (menuData) {
                writeLog("8......");
                menuId = menuData.result[0]._id
                return afb_SbDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {qviews: {$insert: [
                    {label: "Bug", id: "bug", collection: "issues"},
                    {label: "Description", id: "description", collection: "issues"}
                ]}}}})
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "issues"}})
            }).then(
            function (menuData) {
                qviews = menuData.result[0].qviews;
                qviewId1 = menuData.result[0].qviews[0]._id;
                qviewId2 = menuData.result[0].qviews[1]._id;
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.qviewcustomizations", $upsert: [
                    {$query: {_id: qviewId1}, $set: {"status": "new"}},
                    {$query: {_id: qviewId2}, $set: {"display": false}}
                ]});
            }).then(function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            })

            .then(
            function () {
                return afb_SbDb.query({$collection: "pl.collections", $filter: {collection: {"$in": ["employees", "issues"]}}, $events: false})
            }).then(
            function (collectionData) {
                expect(collectionData.result).to.have.length(0);
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": {"$in": ["employees", "issues"]}}, $events: false})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(0);
                return afb_SbDb.query({$collection: "pl.applications", $filter: {"application": "Productivity"}, $events: false})
            }).then(
            function (applicationData) {
                expect(applicationData.result).to.have.length(0);
                return afb_SbDb.query({$collection: "pl.menus", $events: false, $filter: {"application._id": applicationId}})
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(0);
                return afb_SbDb.query({$collection: "pl.functions", $events: false, $filter: {"namne": "TaskBL"}})
            }).then(
            function (functionData) {
                expect(functionData.result).to.have.length(0);
                return afb_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "employees"}, $events: false})
            }).then(
            function (actionData) {
                expect(actionData.result).to.have.length(0);
                return afb_SbDb.query({$collection: "pl.events", $filter: {"collectionid.collection": "employees"}, $events: false})
            }).then(
            function (eventdata) {
                expect(eventdata.result).to.have.length(0);
                return afb_SbDb.query({$collection: "pl.templates", $filter: {"collectionid.collection": "employees"}, $events: false})
            }).then(
            function (templateData) {
                expect(templateData.result).to.have.length(0);
                return afb_SbDb.query({$collection: "pl.indexes", $filter: {"collectionid.collection": "employees"}, $events: false})
            }).then(
            function (indexData) {
                expect(indexData.result).to.have.length(0);
                return afb_SbDb.query({$collection: "pl.formgroups", $filter: {"collectionid.collection": "employees"}, $events: false})
            }).then(
            function (formgroupsData) {
                expect(formgroupsData.result).to.have.length(0);
                return afb_SbDb.query({$collection: "pl.workflowevents", $filter: {"collectionid.collection": "employees"}, $events: false})
            }).then(
            function (workflowData) {
                expect(workflowData.result).to.have.length(0);
                return afb_SbDb.query({$collection: "pl.qviewcustomizations", $events: false})
            }).then(
            function (qviewData) {
                expect(qviewData.result).to.have.length(0);
                return afb_SbDb.query({$collection: "pl.filterspace", $events: false})
            }).then(
            function (filterspaceData) {
                expect(filterspaceData.result).to.have.length(0);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})

            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
            }).then(
            function () {
                return daffodil_SbDb.update({$collection: "pl.qviewcustomizations", $update: [
                    {_id: qviewId1, $set: {"status": "old"}},
                    {_id: qviewId2, $set: {"status": "new"}}
                ]})
            }).then(
            function () {
                writeLog("12........")
                return daffodil_SbDb.update({$collection: "pl.collections", $insert: {collection: "tasks"}})
            }).then(
            function () {
                writeLog("13........")
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $fields: {_id: 1}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("14........")
                return daffodil_SbDb.update({$collection: "pl.fields",
                    $update: {_id: fieldsData.result[0]._id, $set: {label: "EName", mandatory: true}},
                    $insert: [
                        {field: "age", label: "Age", type: "number", collectionid: {$query: {collection: "employees"}}},
                        {field: "task", label: "Task", type: "string", collectionid: {$query: {collection: "tasks"}}}
                    ]})
            }).then(
            function () {
                writeLog("16........")
                return daffodil_SbDb.query({$collection: "pl.filterspace", $fields: {_id: 1}})
            }).then(
            function (filterSpaceData) {
                writeLog("17........")
                return daffodil_SbDb.update({$collection: "pl.filterspace",
                    $insert: {space: "pcenter1"},
                    $update: {_id: filterSpaceData.result[0]._id, $set: {space: "pcenter3"}}
                })
            }).then(
            function () {
                writeLog("18........")
                return daffodil_SbDb.query({$collection: "pl.indexes", $filter: {"collectionid.collection": "employees"}, $fields: {_id: 1}})
            }).then(
            function (indexsData) {
                writeLog("19........")
                return daffodil_SbDb.update({$collection: "pl.indexes",
                    $update: {_id: indexsData.result[0]._id, $set: {name: "Index2"}},
                    $insert: {collectionid: {$query: {collection: "tasks"}}, name: "Index3", indexes: {task: 1}}
                });
            }).then(
            function () {
                writeLog("20........")
                return daffodil_SbDb.query({$collection: "pl.events", $filter: {"collectionid.collection": "employees"}, $fields: {_id: 1}})
            }).then(
            function (eventsData) {
                writeLog("21........")
                return daffodil_SbDb.update({$collection: "pl.events", $update: {_id: eventsData.result[0]._id, $set: {pre: false, post: true}}})
            }).then(
            function () {
                writeLog("22........")
                return daffodil_SbDb.query({$collection: "pl.fieldcustomizations", $fields: {_id: 1}})
            }).then(
            function (data) {
                writeLog("23........")
                return daffodil_SbDb.update({$collection: "pl.fieldcustomizations", $update: {_id: data.result[0]._id, $set: {visibility: true}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.workflowevents", $filter: {"collectionid.collection": "employees"}, $fields: {_id: 1}})
            }).then(
            function (data) {
                return daffodil_SbDb.update({$collection: "pl.workflowevents",
                    $update: {_id: data.result[0]._id, $set: {event: "Workflowevent1"}},
                    $insert: {
                        event: "Workflowevent2",
                        collectionid: {$query: {collection: "employees"}}
                    }
                })
            }).then(
            function () {
                writeLog("24........")
                return daffodil_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "employees"}, $fields: {_id: 1}})
            }).then(
            function (actionData) {
                writeLog("25........")
                return daffodil_SbDb.update({$collection: "pl.actions", $insert: [
                    {type: "invoke", id: "syncEmployees", label: "Sync Employees", collectionid: {$query: {collection: "employees"}}}
                ], $update: {_id: actionData.result[0]._id, $set: {label: "Port"}}})
            }).then(
            function () {
                writeLog("26........")
                return daffodil_SbDb.update({$collection: "pl.templates",
                    $insert: {template: "Template2", collectionid: {$query: {collection: "employees"}}}})
            }).then(
            function () {
                writeLog("27........")
                return daffodil_SbDb.query({$collection: "pl.formgroups", $filter: {"collectionid.collection": "employees"}, $fields: {_id: 1}})
            }).then(
            function (formGroupData) {
                writeLog("28........")
                return daffodil_SbDb.update({$collection: "pl.formgroups",
                    $update: {_id: formGroupData.result[0]._id, $set: {title: "Daffodil Address"}},
                    $insert: {collectionid: {$query: {collection: "employees"}}, title: "New FormGroup", showLabel: true}
                })
            }).then(
            function () {
                writeLog("29........")
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                writeLog("30........")
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $fields: {_id: 1}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("31........")
                return afb_SbDb.update({$collection: "pl.fields",
                    $update: {_id: fieldsData.result[0]._id, $set: {name: "Employee Name", filterable: true}},
                    $insert: [
                        {field: "salary", label: "Salary", type: "number", collectionid: {$query: {collection: "employees"}}}
                    ], $delete: {_id: fieldsData.result[1]._id}});
            }).then(
            function () {
                writeLog("32........")
                return afb_SbDb.query({$collection: "pl.filterspace", $fields: {_id: 1}})
            }).then(
            function (filterSpaceData) {
                writeLog("33........")
                return afb_SbDb.update({$collection: "pl.filterspace",
                    $insert: {space: "pcenter2"},
                    $update: {_id: filterSpaceData.result[0]._id, $set: {space: "Afb pcenter"}}
                })
            }).then(
            function () {
                writeLog("34........")
                return afb_SbDb.query({$collection: "pl.indexes", $filter: {"collectionid.collection": "employees"}, $fields: {_id: 1}})
            }).then(
            function (indexsData) {
                writeLog("35........")
                return afb_SbDb.update({$collection: "pl.indexes",
                    $delete: {_id: indexsData.result[0]._id}
                });
            }).then(
            function () {
                writeLog("36........")
                return afb_SbDb.query({$collection: "pl.templates", $filter: {"collectionid.collection": "employees"}, $fields: {_id: 1}})
            }).then(
            function (templatesData) {
                writeLog("37........")
                return afb_SbDb.update({$collection: "pl.templates",
                    $update: {_id: templatesData.result[0]._id, $set: {template: "New Template"}},
                    $insert: {template: "Template3", collectionid: {$query: {collection: "employees"}}}})
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.fieldcustomizations", $fields: {_id: 1}})
            }).then(
            function (data) {
                return afb_SbDb.update({$collection: "pl.fieldcustomizations", $update: {_id: data.result[0]._id, $set: {visibilityGrid: true}}})
            }).then(
            function () {
                writeLog("38........")
                return afb_SbDb.query({$collection: "pl.formgroups", $filter: {"collectionid.collection": "employees"}, $fields: {_id: 1}})
            }).then(
            function (formGroupData) {
                writeLog("39........")
                return afb_SbDb.update({$collection: "pl.formgroups",
                    $update: {_id: formGroupData.result[0]._id, $set: {showLabel: false}},
                    $insert: {collectionid: {$query: {collection: "employees"}}, title: "New FormGroup1", showLabel: true}
                })
            }).then(
            function () {
                writeLog("40........")
                return afb_SbDb.query({$collection: "pl.workflowevents", $filter: {"collectionid.collection": "employees"}, $fields: {_id: 1}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.qviewcustomizations", $update: {_id: qviewId1, $set: {display: true}}})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.collections", $filter: {collection: {"$in": ["employees", "tasks"]}}, $sort: {collection: 1}});
            }).then(
            function (collectionData) {
                expect(collectionData.result).to.have.length(2);
                expect(collectionData.result[0].collection).to.eql("employees");
                expect(collectionData.result[1].collection).to.eql("tasks");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(3);
                expect(fieldsData.result[0].field).to.eql("age");
                expect(fieldsData.result[0].label).to.eql("Age");
                expect(fieldsData.result[1].field).to.eql("name");
                expect(fieldsData.result[1].label).to.eql("EName");
                expect(fieldsData.result[1].mandatory).to.eql(true);
                expect(fieldsData.result[1].filterable).to.eql(true);
                expect(fieldsData.result[2].field).to.eql("salary");
                expect(fieldsData.result[2].label).to.eql("Salary");
                return daffodilDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "employees"}, $sort: {id: 1}})
            }).then(
            function (actionData) {
                expect(actionData.result).to.have.length(2);
                expect(actionData.result[0].id).to.eql("portEmployees");
                expect(actionData.result[0].label).to.eql("Port");
                expect(actionData.result[1].id).to.eql("syncEmployees");
                expect(actionData.result[1].label).to.eql("Sync Employees");
                return daffodilDb.query({$collection: "pl.templates", $filter: {"collectionid.collection": "employees"}, $sort: {template: 1}, $fields: {template: 1}})
            }).then(
            function (templateData) {
                expect(templateData.result).to.have.length(3);
                expect(templateData.result[0].template).to.eql("New Template");
                expect(templateData.result[1].template).to.eql("Template2");
                expect(templateData.result[2].template).to.eql("Template3");
                return daffodilDb.query({$collection: "pl.indexes", $filter: {"collectionid.collection": "tasks"}})
            }).then(
            function (indexData) {
                expect(indexData.result).to.have.length(1);
                expect(indexData.result[0].name).to.eql("Index3");
                return daffodilDb.query({$collection: "pl.indexes", $filter: {"collectionid.collection": "employees"}})
            }).then(
            function (indexData) {
                expect(indexData.result).to.have.length(0);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.formgroups", $filter: {"collectionid.collection": "employees"}, $sort: {title: 1}})
            }).then(
            function (formGroupData) {
                expect(formGroupData.result).to.have.length(3);
                expect(formGroupData.result[0].title).to.eql("Daffodil Address");
                expect(formGroupData.result[0].showLabel).to.eql(false);
                expect(formGroupData.result[1].title).to.eql("New FormGroup");
                expect(formGroupData.result[1].showLabel).to.eql(true);
                expect(formGroupData.result[2].title).to.eql("New FormGroup1");
                expect(formGroupData.result[2].showLabel).to.eql(true);
                return daffodilDb.query({$collection: "pl.filterspace", $sort: {space: 1}, $fields: {space: 1}})
            }).then(
            function (filterspaceData) {
                expect(filterspaceData.result).to.have.length(3);
                expect(filterspaceData.result[0].space).to.eql("pcenter1");
                expect(filterspaceData.result[1].space).to.eql("pcenter2");
                expect(filterspaceData.result[2].space).to.eql("pcenter3");
                return daffodilDb.query({$collection: "pl.workflowevents", $sort: {event: 1}, $filter: {"collectionid.collection": "employees"}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(2);
                expect(data.result[0].event).to.eql("Workflowevent1");
                expect(data.result[1].event).to.eql("Workflowevent2");
                return daffodilDb.query({$collection: "pl.fieldcustomizations"})
            }).then(
            function (data) {

                expect(data.result).to.have.length(1);
                expect(data.result[0].visibility).to.eql(true)
                expect(data.result[0].visibilityGrid).to.eql(true)
                expect(data.result[0].visibilityForm).to.eql(true)
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.qviewcustomizations", $sort: {status: 1}})
            }).then(
            function (qviewData) {
                expect(qviewData.result).to.have.length(2)
                expect(qviewData.result[0].status).to.eql("new")
                expect(qviewData.result[0].display).to.eql(false)
                expect(qviewData.result[1].status).to.eql("old")
                expect(qviewData.result[1].display).to.eql(true)
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })

    })

    it('do not sync test case', function (done) {
        var afb_SbDb = undefined;
        var afbDb = undefined;
        var daffodil_SbDb = undefined;
        var daffodilDb = undefined;
        var productivityId = undefined;
        var accountId = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.applications", $insert: [
                    {label: "Productivity"},
                    {label: "Accounts", doNotSynch: true}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.menus", $insert: [
                    {label: "Accounts", application: {$query: {label: "Accounts"}}, collection: "accounts"},
                    {label: "Goals", application: {$query: {label: "Productivity"}}, collection: "goals"}
                ]});
            }).then(
            function () {
                return  afb_SbDb.update({$collection: "pl.collections", $insert: [
                    {collection: "employees"},
                    {collection: "issues", doNotSynch: true}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "name", collectionid: {$query: {collection: "employees"}}, label: "Name", type: "string"},
                    {field: "issue", collectionid: {$query: {collection: "issues"}}, label: "Issue", type: "string"}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return daffodil_SbDb.query({$collection: "pl.applications", $sort: {label: 1}})
            }).then(
            function (applicationData) {
                accountId = applicationData.result[0]._id;
                productivityId = applicationData.result[1]._id;
                return daffodil_SbDb.update({$collection: "pl.applications", $update: [
                    {_id: productivityId, $set: {label: "Task Management"}},
                    {_id: accountId, $set: {label: "Account Management"}}
                ]})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": productivityId}, $fields: {_id: 1}})
            }).then(
            function (menuData) {
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {label: "Targets"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": accountId}, $fields: {_id: 1}})
            }).then(
            function (menuData) {
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {label: "Daffodil Accounts"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees", field: "name"}, $fields: {_id: 1}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {label: "EName"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues", field: "issue"}, $fields: {_id: 1}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {label: "Bug"}}})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.applications", $update: [
                    {_id: productivityId, $set: {index: 100}},
                    {_id: accountId, $set: {index: 100}}
                ]})
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": productivityId, "label": "Goals"}, $fields: {_id: 1}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                return afb_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {index: 100}}});
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": accountId, "label": "Accounts"}, $fields: {_id: 1}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                return afb_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {index: 100}}});
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees", field: "name"}, $fields: {_id: 1}});
            }).then(
            function (fieldsData) {
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {mandatory: true}}});
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues", field: "issue"}, $fields: {_id: 1}});
            }).then(
            function (fieldsData) {
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {mandatory: true}}});
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.collections", $filter: {collection: ["employees", "issues"]}, $sort: {collection: 1}});
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.applications", $sort: {label: 1}});
            }).then(
            function (applicationData) {
                expect(applicationData.result[0].label).to.eql("Account Management");
                expect(applicationData.result[0].index).to.eql(undefined);
                expect(applicationData.result[1].label).to.eql("Task Management");
                expect(applicationData.result[1].index).to.eql(100);
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": productivityId}});
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("Targets");
                expect(menuData.result[0].index).to.eql(100);
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": accountId}});
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("Daffodil Accounts");
                expect(menuData.result[0].index).to.eql(undefined);
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].label).to.eql("EName");
                expect(fieldsData.result[0].mandatory).to.eql(true);
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].label).to.eql("Bug");
                expect(fieldsData.result[0].mandatory).to.eql(undefined);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    })

    it('commit test for pl.services', function (done) {
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var daffodilDb = undefined;
        var applicationId = undefined;
        var menuId = undefined;
        var qviews = undefined;

        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.collections", $insert: [
                    {collection: "tasks"}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "task", type: "string", collectionid: {$query: {collection: "tasks"}}},
                    {field: "assignTo", type: "string", collectionid: {$query: {collection: "tasks"}}}
                ]});
            }).then(function () {
                return afb_SbDb.update({$collection: "pl.services", $insert: [
                    {id: "first", type: "query", query: JSON.stringify({$collection: "tasks"})},
                    {id: "second", type: "function", function: {name: "checkService", source: "NorthwindTestCase/lib/ServiceTest", type: "js"}}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return daffodilDb.query({$collection: "pl.services"});
            }).then(
            function (serviceData) {
                serviceData = serviceData.result;
                expect(serviceData).to.have.length(2);
                expect(serviceData[0].type).to.eql("query");
                expect(JSON.parse(serviceData[0].query)).to.eql({$collection: "tasks"});
                expect(serviceData[1].type).to.eql("function");
                var serviceUpdate = {$collection: "pl.services", $update: [
                    {_id: serviceData[0]._id, $set: {query: JSON.stringify({$collection: "tasks", $filter: {assignTo: "Sachin"}})}}
                ]};
                return daffodilDb.update(serviceUpdate);
            }).then(function (updateResult) {
                return daffodilDb.update({$collection: "tasks", $insert: [
                    {task: "Task1", assignTo: "Sachin"},
                    {task: "Task2", assignTo: "Ritesh"},
                    {task: "Task3", assignTo: "Sachin"},
                    {task: "Task4", assignTo: "Naveen"},
                    {task: "Task5", assignTo: "Rajit"},
                    {task: "Task6", assignTo: "Rajit"},
                    {task: "Task7", assignTo: "Naveen"},
                    {task: "Task8", assignTo: "Ritesh"},
                    {task: "Task9", assignTo: "Sachin"},
                    {task: "Task10", assignTo: "Naveen"}
                ]});
            }).then(
            function () {
                return daffodilDb.executeService({"0": "first"});
            }).then(function (data) {
                data = data.result;
                expect(data).to.have.length(3);
                expect(data[0].task).to.eql("Task1");
                expect(data[1].task).to.eql("Task3");
                expect(data[2].task).to.eql("Task9");
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    })


    function dropDatabase1(dbs) {
        return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
            .then(
            function (afbDb) {
                dbs.afbDb = afbDb;
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (afb_sbDb) {
                dbs.afb_sbDb = afb_sbDb;
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (daffodilDb) {
                dbs.daffodilDb = daffodilDb;
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (daffodil_sbDb) {
                dbs.daffodil_sbDb = daffodil_sbDb;
            })
    }

    function expectData(db) {
        var applicationId = undefined
        var applicationId2 = undefined
        return db.query({$collection: "pl.applications", $sort: {label: 1}}).then(
            function (applicationData) {
                expect(applicationData.result).to.have.length(2);
                expect(applicationData.result[0].label).to.eql("Book management");
                expect(applicationData.result[1].label).to.eql("Task management");
                applicationId2 = applicationData.result[0]._id;
                applicationId = applicationData.result[1]._id;
                return db.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(4);
                expect(menuData.result[0].label).to.eql("Comments");
                expect(menuData.result[1].label).to.eql("Features");
                expect(menuData.result[2].label).to.eql("Issues");
                expect(menuData.result[3].label).to.eql("Roadmap");
                return db.query({$collection: "pl.menus", $filter: {"application._id": applicationId2}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(4);
                expect(menuData.result[0].label).to.eql("Account");
                expect(menuData.result[1].label).to.eql("Account Groups");
                expect(menuData.result[2].label).to.eql("Banks");
                expect(menuData.result[3].label).to.eql("Vouchers");
                return db.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(3);

                expect(fieldsData.result[0].label).to.eql("Desc");
                expect(fieldsData.result[0].mandatory).to.eql(true);
                expect(fieldsData.result[0].filterable).to.eql(true);
                expect(fieldsData.result[1].label).to.eql("DueDate");
                expect(fieldsData.result[1].mandatory).to.eql(true);
                expect(fieldsData.result[1].filterable).to.eql(true);
                expect(fieldsData.result[2].label).to.eql("Issue");
                expect(fieldsData.result[2].mandatory).to.eql(true);
                expect(fieldsData.result[2].filterable).to.eql(true);
                return db.query({$collection: "pl.fields", $filter: {"collectionid.collection": "features"}, $sort: {label: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(3);
                expect(fieldsData.result[0].label).to.eql("Desc");
                expect(fieldsData.result[0].mandatory).to.eql(true);
                expect(fieldsData.result[0].filterable).to.eql(true);
                expect(fieldsData.result[1].label).to.eql("DueDate");
                expect(fieldsData.result[1].mandatory).to.eql(true);
                expect(fieldsData.result[1].filterable).to.eql(true);
                expect(fieldsData.result[2].label).to.eql("Feature");
                expect(fieldsData.result[2].mandatory).to.eql(true);
                expect(fieldsData.result[2].filterable).to.eql(true);

                return db.query({$collection: "pl.fields", $filter: {"collectionid.collection": "roadmap"}, $sort: {label: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(3);
                expect(fieldsData.result[0].label).to.eql("Desc");
                expect(fieldsData.result[0].mandatory).to.eql(true);
                expect(fieldsData.result[0].filterable).to.eql(true);
                expect(fieldsData.result[1].label).to.eql("DueDate");
                expect(fieldsData.result[1].mandatory).to.eql(true);
                expect(fieldsData.result[1].filterable).to.eql(true);
                expect(fieldsData.result[2].label).to.eql("Roadmap");
                expect(fieldsData.result[2].mandatory).to.eql(true);
                expect(fieldsData.result[2].filterable).to.eql(true);
                return db.query({$collection: "pl.fields", $filter: {"collectionid.collection": "comments"}, $sort: {label: 1}})
            }).then(function (fieldsData) {
                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].label).to.eql("Comment");
                expect(fieldsData.result[0].mandatory).to.eql(true);
                expect(fieldsData.result[0].filterable).to.eql(true);
                expect(fieldsData.result[1].label).to.eql("Date");
                expect(fieldsData.result[1].mandatory).to.eql(true);
                expect(fieldsData.result[1].filterable).to.eql(true);
            })

    }

})
;
describe("commit sync manual", function () {

    beforeEach(function (done) {
        Testcases.beforeEach().then(
            function () {
                return ApplaneDB.getAdminDB();
            }).then(
            function (adminDB) {
                var adminDb = adminDB;
                var insertDbs = {$collection: "pl.dbs", $insert: [
                    {"db": "afb", "sandboxDb": "afb_sb", "globalDb": "", "ensureDefaultCollections": true, "guestUserName": "afb", "globalUserName": "afb", "globalPassword": "afb", "globalUserAdmin": true, autoSynch: false},
                    {"db": "daffodil", "sandboxDb": "daffodil_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "daffodil", "globalUserName": "daffodil", "globalPassword": "daffodil", "globalUserAdmin": true, autoSynch: false},
                    {"db": "daffodil_hsr", "globalDb": "daffodil", "ensureDefaultCollections": false, "guestUserName": "daffodil_hsr", "globalUserName": "daffodil_hsr", "globalPassword": "daffodil_hsr", "globalUserAdmin": true, autoSynch: false},
                    {"db": "daffodil_hsr_applane", "globalDb": "daffodil_hsr", "ensureDefaultCollections": false, "guestUserName": "daffodil_hsr_applane", "globalUserName": "daffodil_hsr_applane", "globalPassword": "daffodil_hsr_applane", "globalUserAdmin": true, autoSynch: false},
                    {"db": "darcl", "sandboxDb": "darcl_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "darcl", "globalUserName": "darcl", "globalPassword": "darcl", "globalUserAdmin": true, autoSynch: false, is_sandbox: false},
                    {"db": "girnarsoft", "sandboxDb": "girnarsoft_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "girnarsoft", "globalUserName": "girnarsoft", "globalPassword": "girnarsoft", "globalUserAdmin": true, autoSynch: false},
                    {"db": "daffodil_ggn", "globalDb": "daffodil", "ensureDefaultCollections": false, "guestUserName": "daffodil_ggn", "globalUserName": "daffodil_ggn", "globalPassword": "daffodil_ggn", "globalUserAdmin": true, autoSynch: false},
                    {"db": "daffodil_hsr_other", "globalDb": "daffodil_hsr", "ensureDefaultCollections": false, "guestUserName": "daffodil_hsr_other", "globalUserName": "daffodil_hsr_other", "globalPassword": "daffodil_hsr_other", "globalUserAdmin": true, autoSynch: false}
                ]};
                return adminDb.update(insertDbs);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });
    })

    afterEach(function (done) {
//        return;
        var dbs = {};
        dropDatabase(dbs)
            .then(
            function () {
                var keys = Object.keys(dbs);
                return Utils.iterateArrayWithPromise(keys, function (index, dbName) {
                    var db = dbs[dbName]
                    return db.dropDatabase();
                })
            }).then(
            function () {
                return Testcases.afterEach();
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it('commit and sync with multi times in multiple dbs', function (done) {
        var daf_hsr_applaneDb = undefined;
        var taskId = undefined;
        var applicationId = undefined;
        var applicationId2 = undefined;
        var daf_hsrDb = undefined;
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var daffodilDb = undefined;
        var daffodil_SbDb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                writeLog("1......");
                return afb_SbDb.update({$collection: "pl.applications", $insert: [
                    {"label": "Task management"}
                ]})
            }).then(
            function () {
                writeLog("2......");
                var menuInsert = {$collection: "pl.menus", $insert: [
                    {label: "Tasks", application: {$query: {label: "Task management"}}, collection: "tasks", index: 10}
                ]};
                return afb_SbDb.update(menuInsert);
            }).then(
            function () {
                writeLog("3......");
                return afb_SbDb.update({$collection: "pl.collections", $insert: [
                    {collection: "employees", index: 20}
                ]});
            }).then(
            function () {
                writeLog("4......");
                return afb_SbDb.update({$collection: "pl.currencies", $insert: [
                    {currency: "INR"}
                ]})
            }).then(
            function () {
                writeLog("5......");
                var fields = {$collection: "pl.fields", $insert: [
                    {index: 10, field: "name", type: "string", collectionid: {$query: {collection: "employees"}}} ,
                    {index: 20, field: "code", type: "string", collectionid: {$query: {collection: "employees"}}} ,
                    {index: 30, field: "age", type: "number", collectionid: {$query: {collection: "employees"}}} ,
                    {index: 40, field: "salary", type: "currency", collectionid: {$query: {collection: "employees"}}} ,
                    {index: 50, field: "task", type: "string", collectionid: {$query: {collection: "tasks"}}} ,
                    {index: 60, field: "employeeid", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"], displayField: "name"},
                    {index: 70, field: "effort", type: "duration", collectionid: {$query: {collection: "tasks"}}}
                ]};
                return afb_SbDb.update(fields);
            }).then(
            function () {

                //Committing from afb_sb to afb
                writeLog("6......");
                writeLog("Committing initial afbsb to afb......");
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                //connecting with afb
                writeLog("7......");
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", password: "afb"});
            }).then(
            function (dbName) {
                afbDb = dbName;
                writeLog("8......");
                return afbDb.query({$collection: "pl.applications", $fields: {label: 1, _id: 1}})
            }).then(
            function (queryResult) {
                writeLog("9......");
                var applications = queryResult.result;

                //expecting applications in afb
                expect(applications).to.have.length(1);
                expect(applications[0].label).to.eql("Task management");
                applicationId = applications[0]._id;
                return afbDb.query({$collection: "pl.roles"})
            }).then(
            function (roleData) {
                writeLog("10......");
                var roles = roleData.result;

                //expecting roles in afb
                expect(roles).to.have.length(1);
                expect(roles[0].role).to.eql("Task management");

                return afbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $fields: {label: 1}});
            }).then(
            function (menuData) {
                writeLog("11......");
                //expecting in pl.menus in afb
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("Tasks")

                return afbDb.query({$collection: "pl.collections", $fields: {collection: 1, _id: 1}, $filter: {"collection": {"$in": ["tasks", "employees"]}}, $events: false, $sort: {collection: 1}})
            }).then(
            function (collectionData) {
                writeLog("12......");
                expect(collectionData.result).to.have.length(2);
                expect(collectionData.result[0].collection).to.eql("employees");
                expect(collectionData.result[1].collection).to.eql("tasks");

                taskId = collectionData.result[1]._id;


                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $fields: {field: 1}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("13.....");
                expect(fieldsData.result).to.have.length(6);
                expect(fieldsData.result[0].field).to.eql("age");
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[2].field).to.eql("code");
                expect(fieldsData.result[3].field).to.eql("name");
                expect(fieldsData.result[4].field).to.eql("salary");
                expect(fieldsData.result[5].field).to.eql("type");

                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks"}, $fields: {field: 1}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("14......");
                expect(fieldsData.result).to.have.length(6);
                expect(fieldsData.result[0].field).to.eql("convertedvalue");
                expect(fieldsData.result[1].field).to.eql("effort");
                expect(fieldsData.result[2].field).to.eql("employeeid");
                expect(fieldsData.result[3].field).to.eql("task");
                expect(fieldsData.result[4].field).to.eql("time");
                expect(fieldsData.result[5].field).to.eql("unit");

                return afbDb.query({$collection: "pl.referredfks", $filter: {"collectionid._id": taskId}})
            }).then(
            function (referredFks) {
                writeLog("15......");
                expect(referredFks.result).to.have.length(1);
                expect(referredFks.result[0].collectionid.collection).to.eql("tasks");
                expect(referredFks.result[0].referredcollectionid.collection).to.eql("employees");
                expect(referredFks.result[0].referredfieldid.field).to.eql("employeeid");

            }).then(
            function () {
                writeLog("16......");
                return afbDb.update({$collection: "pl.currencies", $insert: {currency: "INR"}});
            }).then(
            function () {
                writeLog("17......");
                return afbDb.update({$collection: "employees", $insert: {name: "Ritesh afb", code: "ritesh afb", age: 22, salary: {amount: 10000, type: {$query: {currency: "INR"}}}}});
            }).then(
            function () {
                writeLog("18......");
                return afbDb.query({$collection: "employees"});
            }).then(
            function (employeeResult) {
                writeLog("19......");
                expect(employeeResult.result).to.have.length(1);
                expect(employeeResult.result[0].name).to.eql("Ritesh afb");
                expect(employeeResult.result[0].code).to.eql("ritesh afb");
                expect(employeeResult.result[0].age).to.eql(22);
                expect(employeeResult.result[0].salary.amount).to.eql(10000);
                expect(employeeResult.result[0].salary.type.currency).to.eql("INR");

                return afbDb.update({$collection: "tasks", $insert: {task: "t1", employeeid: {$query: {name: "Ritesh afb"}}, effort: {time: 60, unit: "Hrs"}}})
            }).then(
            function () {
                writeLog("20......");
                return afbDb.query({$collection: "tasks"});
            }).then(
            function (tasksResult) {
                writeLog("21......");
                expect(tasksResult.result).to.have.length(1);
                expect(tasksResult.result[0].employeeid.name).to.eql("Ritesh afb");
                expect(tasksResult.result[0].effort.time).to.eql(60);
                expect(tasksResult.result[0].effort.unit).to.eql("Hrs");
                expect(tasksResult.result[0].effort.convertedvalue).to.eql(3600);

                //connecting with afb_sb
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"});
            }).then(
            function (databaseName) {
                writeLog("22......");
                afb_SbDb = databaseName;
                return afb_SbDb.query({$collection: "pl.applications"})
            }).then(
            function (applicationData) {
                writeLog("23......");
                expect(applicationData.result).to.have.length(1);
                expect(applicationData.result[0].label).to.eql("Task management");

                applicationId = applicationData.result[0]._id;
                return afb_SbDb.update({$collection: "pl.applications", $update: {_id: applicationId, $set: {"label": "Productivity"}}});
            }).then(
            function () {
                writeLog("24......");
                var menuInsert = {$collection: "pl.menus", $insert: [
                    {label: "Goals", application: {$query: {label: "Productivity"}}, collection: "goals", index: 20}
                ]};
                return afb_SbDb.update(menuInsert)
            }).then(
            function () {
                writeLog("25......");
                //Committing from afb_sb to afb
                writeLog("Committing menu from  afbsb to afb......");
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                writeLog("26......");
                //connecting to afb
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", password: "afb"});
            }).then(
            function (dbName) {
                afbDb = dbName;
                writeLog("27......");
                return afbDb.query({$collection: "pl.applications", $fields: {label: 1, _id: 1}});
            }).then(
            function (applicationData) {
                writeLog("28......");
                expect(applicationData.result).to.have.length(1);
                expect(applicationData.result[0].label).to.eql("Productivity");
                applicationId = applicationData.result[0]._id;
                return afbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId }, $fields: {label: 1}, $sort: {index: 1}});
            }).then(
            function (menuData) {
                writeLog("29......");
                //expecting in pl.menus in afb
                expect(menuData.result).to.have.length(2);
                expect(menuData.result[0].label).to.eql("Tasks");
                expect(menuData.result[1].label).to.eql("Goals");

            }).then(
            function () {
                writeLog("30......");
                //connect with daffodil
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", password: "daffodil"});
            }).then(
            function (dbName) {
                daffodilDb = dbName;
//                return daffodilDb.update({$collection: "pl.users", $insert: { roles: {$insert: [
//                    {role: {$query: {role: "Task management"}}}
//                ]}}})
            }).then(
            function () {
                writeLog("31......");
                return daffodilDb.update({$collection: "pl.currencies", $insert: [
                    {currency: "INR"}
                ]})
            }).then(
            function () {
                writeLog("32......");
                return daffodilDb.update({$collection: "employees", $insert: [
                    {name: "Ritesh daffodil", code: "ritesh daffodil", age: 22, salary: {amount: 10000, type: {$query: {currency: "INR"}}}},
                    {name: "Rohit daffodil", code: "rohit daffodil", age: 22, salary: {amount: 10000, type: {$query: {currency: "INR"}}}}
                ]});
            }).then(
            function () {
                writeLog("33......");
                return daffodilDb.query({$collection: "employees"})
            }).then(
            function (employeeResult) {
                writeLog("34......");
                expect(employeeResult.result).to.have.length(2);
                expect(employeeResult.result[0].name).to.eql("Ritesh daffodil");
                expect(employeeResult.result[0].code).to.eql("ritesh daffodil");
                expect(employeeResult.result[0].age).to.eql(22);
                expect(employeeResult.result[0].salary.amount).to.eql(10000);
                expect(employeeResult.result[0].salary.type.currency).to.eql("INR");

                return daffodilDb.update({$collection: "tasks", $insert: {task: "Daffodil t1", employeeid: {$query: {name: "Ritesh daffodil"}}, effort: {time: 60, unit: "Hrs"}}})
            }).then(
            function () {
                writeLog("35......");
                return daffodilDb.query({$collection: "tasks"});
            }).then(
            function (tasksResult) {
                writeLog("36......");
                expect(tasksResult.result).to.have.length(1);
                expect(tasksResult.result[0].task).to.eql("Daffodil t1")
                expect(tasksResult.result[0].employeeid.name).to.eql("Ritesh daffodil");
                expect(tasksResult.result[0].effort.time).to.eql(60);
                expect(tasksResult.result[0].effort.unit).to.eql("Hrs");
                expect(tasksResult.result[0].effort.convertedvalue).to.eql(3600);

                //connect with daffodil_sb
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", password: "daffodil"});
            }).then(
            function (dbName) {
                writeLog("37......");
                daffodil_SbDb = dbName;
                return daffodil_SbDb.update({$collection: "pl.currencies", $insert: [
                    {currency: "INR"}
                ]})
            }).then(
            function () {
                writeLog("38......");
                return daffodil_SbDb.update({$collection: "employees", $insert: {name: "Ritesh daffodil_sb", code: "ritesh daffodil_sb", age: 22, salary: {amount: 10000, type: {$query: {currency: "INR"}}}}});
            }).then(
            function () {
                writeLog("39......");
                return daffodil_SbDb.query({$collection: "employees"})
            }).then(
            function (employeeResult) {
                writeLog("40......");
                expect(employeeResult.result).to.have.length(1);
                expect(employeeResult.result[0].name).to.eql("Ritesh daffodil_sb");
                expect(employeeResult.result[0].code).to.eql("ritesh daffodil_sb");
                expect(employeeResult.result[0].age).to.eql(22);
                expect(employeeResult.result[0].salary.amount).to.eql(10000);
                expect(employeeResult.result[0].salary.type.currency).to.eql("INR");
            }).then(
            function () {
                writeLog("41......");
                writeLog("update menu in daffodilsb");
                var menuInsert = {$collection: "pl.menus", $insert: [
                    {label: "Result", application: {$query: {label: "Productivity"}}, collection: "result", index: 30}
                ]};
                return daffodil_SbDb.update(menuInsert);
            }).then(
            function () {
                writeLog("42......");
                var fields = {$collection: "pl.fields", $insert: [
                    {index: 10, field: "comment", type: "string", collectionid: {$query: {collection: "result"}}} ,
                    {index: 20, field: "employeeid", type: "fk", collectionid: {$query: {collection: "result"}}, collection: "employees", set: ["name"]},
                    {index: 20, field: "taskid", type: "fk", collectionid: {$query: {collection: "result"}}, collection: "tasks"}
                ]};
                return daffodil_SbDb.update(fields)
            }).then(
            function () {
                writeLog("43......");
                return daffodil_SbDb.query({$collection: "pl.applications", $fields: {label: 1, _id: 1}});
            }).then(
            function (applicationData) {
                writeLog("44......");
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationData.result[0]._id}});
            }).then(
            function (menuData) {
                writeLog("45......");
                //changing Goals to Targets
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {label: "Targets"}}})
            }).then(
            function () {
                writeLog("46......");
                writeLog("Committing update menu daffodilsb to daffodil......");
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                writeLog("47......");
                //connect with daffodil
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", password: "daffodil"});
            }).then(
            function (dbName) {
                writeLog("48......");
                daffodilDb = dbName;
                return daffodilDb.query({$collection: "pl.applications", $fields: {_id: 1}})
            }).then(
            function (applicationData) {
                writeLog("49......");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationData.result[0]._id}, $fields: {label: 1}, $sort: {index: 1}});
            }).then(
            function (menuData) {
                writeLog("50......");
                expect(menuData.result).to.have.length(3);
                expect(menuData.result[0].label).to.eql("Tasks")
                expect(menuData.result[1].label).to.eql("Targets")
                expect(menuData.result[2].label).to.eql("Result")

                return daffodilDb.update({$collection: "result", $insert: {taskid: {$query: {task: "Daffodil t1"}}, employeeid: {$query: {"name": "Ritesh daffodil"}}, comment: "follow up"}})
            }).then(
            function () {
                writeLog("51......");
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"});

            }).then(
            function (dbName) {
                writeLog("52......");
                writeLog("add qviews in menu from afbsb");
                afb_SbDb = dbName;
                var qviewInsert = {$collection: "pl.qviews", $insert: [
                    {label: "My Tasks", id: "myTasks", collection: {$query: {collection: "tasks"}}, mainCollection: {$query: {collection: "tasks"}}},
                    {label: "All Tasks", id: "allTasks", collection: {$query: {collection: "tasks"}}, mainCollection: {$query: {collection: "tasks"}}}
                ]};
                return afb_SbDb.update(qviewInsert);
            }).then(
            function () {
                writeLog("53......");
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("54......");
                return afb_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {qviews: {$insert: [
                    {label: "My Tasks", id: "myTasks", collection: "tasks"},
                    {label: "All Tasks", id: "allTasks", collection: "tasks"}
                ]}}}})

            }).then(
            function () {
                writeLog("55......");
                writeLog("Committing menu qviews  afbsb to afb......");
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                writeLog("56......");
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", password: "afb"});
            }).then(
            function (dbName) {
                afbDb = dbName;
                writeLog("57......");
                return afbDb.query({$collection: "pl.qviews", $filter: {"collection.collection": "tasks"}, $sort: {id: 1}})
            }).then(
            function (qviewData) {
                writeLog("58......");
                expect(qviewData.result).to.have.length(3);
                expect(qviewData.result[0].id).to.eql("allTasks");
                expect(qviewData.result[0].label).to.eql("All Tasks");
                expect(qviewData.result[1].id).to.eql("myTasks");
                expect(qviewData.result[1].label).to.eql("My Tasks");
                expect(qviewData.result[2].id).to.eql("tasks")
            }).then(
            function () {
                writeLog("59......");
                return afbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("60......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].qviews).to.have.length(3);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[1].id).to.eql("myTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("My Tasks");
                expect(menuData.result[0].qviews[2].id).to.eql("allTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("All Tasks");

                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"});
            }).then(
            function (dbName) {
                writeLog("61......");
                afb_SbDb = dbName;
                var qviewInsert = {$collection: "pl.qviews", $insert: [
                    {label: "Overdue Tasks", id: "overduetasks", collection: {$query: {collection: "tasks"}}, mainCollection: {$query: {collection: "tasks"}}}
                ]};
                return afb_SbDb.update(qviewInsert)
            }).then(
            function () {
                writeLog("62......");
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("63......");
                var qviews = menuData.result[0].qviews;
                return afb_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {qviews: {$insert: [
                    {label: "Overdue Tasks", id: "overdueTasks", collection: "tasks"}
                ], $update: [
                    {_id: qviews[1]._id, $set: {label: "My Todos"}}
                ], $delete: [
                    {_id: qviews[2]._id}
                ]
                }}}})
            }).then(
            function () {
                writeLog("64......");
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("65......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].qviews).to.have.length(3);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Tasks");
                expect(menuData.result[0].qviews[1].id).to.eql("myTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("My Todos");
                expect(menuData.result[0].qviews[2].id).to.eql("overdueTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Overdue Tasks");
                writeLog("Committing menu qviews afbsb to afb......");
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                writeLog("66......");
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                writeLog("67......");
                afbDb = dbName;
                return afbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("68......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].qviews).to.have.length(3);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Tasks");
                expect(menuData.result[0].qviews[1].id).to.eql("myTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("My Todos");
                expect(menuData.result[0].qviews[2].id).to.eql("overdueTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Overdue Tasks");

                return ApplaneDB.connect(Config.URL, "daffodil_hsr_applane", {username: "daffodil_hsr_applane", password: "daffodil_hsr_applane"});
            }).then(
            function (dbName) {
                writeLog("69......");
                daf_hsr_applaneDb = dbName;
                return daf_hsr_applaneDb.query({$collection: "pl.applications"})
            }).then(
            function (applicationData) {
                writeLog("70......");
                expect(applicationData.result).to.have.length(1);
                expect(applicationData.result[0].label).to.eql("Productivity");
                return daf_hsr_applaneDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $sort: {index: 1}})
            }).then(
            function (menuData) {
                writeLog("71......");
                expect(menuData.result).to.have.length(3)
                expect(menuData.result[0].label).to.eql("Tasks")
                expect(menuData.result[1].label).to.eql("Targets")
                expect(menuData.result[2].label).to.eql("Result");
                writeLog("adding a field in task in daffodilhsrapplane in tasks collection");
                return daf_hsr_applaneDb.update({$collection: "pl.fields", $insert: [
                    {index: 80, field: "reporting_to", type: "fk", collectionid: {$query: {collection: "tasks"}}, collection: "employees", set: ["name"]}
                ]});
            }).then(
            function () {
                writeLog("72......");
                return daf_hsr_applaneDb.query({$collection: "pl.fields", $filter: {field: "task", "collectionid.collection": "tasks"}, $fields: {_id: 1}})
            }).then(
            function (fieldsData) {
                writeLog("73......");
                var fieldId = fieldsData.result[0]._id;
                writeLog("update a field in daffodilhisarapplane in tasks collection")
                return daf_hsr_applaneDb.update({$collection: "pl.fields", $update: {_id: fieldId, $set: {sortable: true}}})
            }).then(
            function () {
                writeLog("74......");
                return daf_hsr_applaneDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("75......");
                expect(fieldsData.result[0].field).to.eql("convertedvalue");
                expect(fieldsData.result[1].field).to.eql("effort");
                expect(fieldsData.result[2].field).to.eql("employeeid");
                expect(fieldsData.result[3].field).to.eql("reporting_to");
                expect(fieldsData.result[4].field).to.eql("task");
                expect(fieldsData.result[4].sortable).to.eql(true);
                expect(fieldsData.result[5].field).to.eql("time");
                expect(fieldsData.result[6].field).to.eql("unit");
                return daf_hsr_applaneDb.update({$collection: "pl.currencies", $insert: [
                    {currency: "INR"}
                ]})
            }).then(
            function () {
                writeLog("76......");
                return daf_hsr_applaneDb.update({$collection: "employees", $insert: [
                    {name: "Ritesh daffodil hisar applane", code: "ritesh daffodil hisar applane", age: 22, salary: {amount: 10000, type: {$query: {currency: "INR"}}}},
                    {name: "Sachin daffodil hisar applane", code: "sachin daffodil hisar applane", age: 25, salary: {amount: 10000, type: {$query: {currency: "INR"}}}}
                ]});
            }).then(
            function () {
                writeLog("77......");
                return daf_hsr_applaneDb.update({$collection: "tasks", $insert: {task: "t1", employeeid: {$query: {name: "Ritesh daffodil hisar applane"}}, effort: {time: 60, unit: "Hrs"}, reporting_to: {$query: {name: "Sachin daffodil hisar applane"}}}})
            }).then(
            function () {
                writeLog("78......");
                return daf_hsr_applaneDb.query({$collection: "tasks"})
            }).then(
            function (taskData) {
                writeLog("79......");
                expect(taskData.result).to.have.length(1);
                expect(taskData.result[0].employeeid.name).to.eql("Ritesh daffodil hisar applane");
                expect(taskData.result[0].reporting_to.name).to.eql("Sachin daffodil hisar applane");

            }).then(
            function () {
                writeLog("80......");
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"});

            }).then(
            function (dbName) {
                writeLog("81......");
                afb_SbDb = dbName;
                writeLog("add a field in tasks in afbsb effort_done");
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {index: 90, field: "effort_done", type: "duration", collectionid: {$query: {collection: "tasks"}}}
                ]});
            }).then(
            function () {
                writeLog("82......");
                return afb_SbDb.query({$collection: "pl.fields", $filter: {field: "task", "collectionid.collection": "tasks"}})
            }).then(
            function (fieldsData) {
                var fieldId = fieldsData.result[0]._id;
                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldId, $set: {sortable: false, filterable: true}}})
            }).then(
            function () {
                writeLog("83......");
                var menuInsert = {$collection: "pl.menus", $insert: [
                    {label: "Comments", application: {$query: {label: "Productivity"}}, collection: "comments", index: 30}
                ]};
                return afb_SbDb.update(menuInsert);
            }).then(
            function () {
                writeLog("84......");
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, label: "Goals"}})
            }).then(
            function (menuData) {
                writeLog("85......");
                return afb_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {label: "Achievements"}}})
            }).then(
            function () {
                writeLog("86......");
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, label: "Tasks"}})
            }).then(
            function (menuData) {
                writeLog("87......");
                return afb_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {label: "ToDos"}}})
            }).then(
            function () {
                writeLog("Committing field effort_done in ,along with menus afbsb to afb......");
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                writeLog("88......");
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afbDb = dbName;
                writeLog("89......");
                return afbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                writeLog("90......");
                expect(menuData.result).to.have.length(3);
                expect(menuData.result[0].label).to.eql("Achievements");
                expect(menuData.result[1].label).to.eql("Comments");
                expect(menuData.result[2].label).to.eql("ToDos");
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks"}, $sort: {field: 1}});
            }).then(function (fieldsData) {
                expect(fieldsData.result).to.have.length(10);
                expect(fieldsData.result[0].field).to.eql("convertedvalue");
                expect(fieldsData.result[1].field).to.eql("convertedvalue");
                expect(fieldsData.result[2].field).to.eql("effort");
                expect(fieldsData.result[3].field).to.eql("effort_done");
                expect(fieldsData.result[4].field).to.eql("employeeid");
                expect(fieldsData.result[5].field).to.eql("task");
                expect(fieldsData.result[6].field).to.eql("time");
                expect(fieldsData.result[7].field).to.eql("time");
                expect(fieldsData.result[8].field).to.eql("unit");
                expect(fieldsData.result[9].field).to.eql("unit");
            })
            .then(
            function () {
                writeLog("91......");
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                //synch daffodil
                writeLog("92......");
                writeLog("First synch daffodil " + new Date());
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);
            }).then(
            function () {
                writeLog("93......");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $sort: {label: 1}});
            }).then(
            function (menuData) {
                writeLog("94......");
                expect(menuData.result).to.have.length(4);
                expect(menuData.result[0].label).to.eql("Comments");
                expect(menuData.result[1].label).to.eql("Result");
                expect(menuData.result[2].label).to.eql("Targets");
                expect(menuData.result[3].label).to.eql("ToDos");
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks"}, $sort: {field: 1}});
            }).then(function (fieldsData) {
                expect(fieldsData.result).to.have.length(10);
            })
            .then(
            function () {
                writeLog("95......");
                return ApplaneDB.connect(Config.URL, "daffodil_hsr_applane", {username: "daffodil_hsr_applane", "password": "daffodil_hsr_applane"})
            }).then(
            function (dbName) {
                daf_hsr_applaneDb = dbName;
                //sync daffodil_hsr_applane
                writeLog("96......");
                writeLog("Synch daffodilhsrapplane " + new Date());
                return Synch.synchProcess({data: {synch: true}}, daf_hsr_applaneDb);
            }).then(
            function () {
                writeLog("97......");
                return daf_hsr_applaneDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                writeLog("98......");
                expect(menuData.result).to.have.length(4);
                expect(menuData.result[0].label).to.eql("Comments");
                expect(menuData.result[1].label).to.eql("Result");
                expect(menuData.result[2].label).to.eql("Targets");
                expect(menuData.result[3].label).to.eql("ToDos");
                return daf_hsr_applaneDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks"}, $sort: {field: 1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(11);
                return daf_hsr_applaneDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks", field: "task"}, $sort: {field: 1}});
            }).then(function (fieldsData) {
                expect(fieldsData.result[0].sortable).to.eql(true);
                expect(fieldsData.result[0].filterable).to.eql(true);
            })
            .then(
            function () {
                writeLog("99......");
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks", field: "employeeid"}, $fields: {field: 1}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("update set in field employeeid in tasks in daffodilsb");
                return daffodil_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {set: ["name", "code"]}}});
            }).then(
            function () {
                writeLog("Committing from daffodilsb to daffodil");
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks", field: "employeeid"}, $sort: {field: 1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result[0].set).to.have.length(2);
                expect(fieldsData.result[0].set).to.eql(["name", "code"]);
                return daffodilDb.query({$collection: "pl.collections", $filter: {collection: "tasks"}, $fields: {_id: 1, fields: 1}});
            }).then(
            function (collectionData) {
                return daffodilDb.query({$collection: "pl.referredfks", $filter: {"collectionid._id": collectionData.result[0]._id}});
            }).then(
            function (referredFkData) {
                expect(referredFkData.result[0].collectionid.collection).to.eql("tasks");
                expect(referredFkData.result[0].referredcollectionid.collection).to.eql("employees");
                expect(referredFkData.result[0].referredfieldid.field).to.eql("employeeid");
                expect(referredFkData.result[0].set).to.eql(["name", "code"]);

            }).then(
            function () {
                return daffodilDb.update({$collection: "tasks", $insert: {task: "Daffodil t2", employeeid: {$query: {name: "Ritesh daffodil"}}, effort: {time: 60, unit: "Hrs"}}})
            }).then(
            function () {
                return daffodilDb.query({$collection: "tasks", $filter: {task: "Daffodil t2"}})
            }).then(
            function (taskData) {
                expect(taskData.result[0].employeeid.name).to.eql("Ritesh daffodil");
                expect(taskData.result[0].employeeid.code).to.eql("ritesh daffodil");
                expect(taskData.result[0].employeeid._id).to.not.equal(undefined);
                var asyncDB = daffodilDb.asyncDB();
                var options = {processName: "SetFields"};
                return asyncDB.createProcess(options);
            }).then(
            function (process) {
                daffodilDb.invokeFunction("Porting.repopulateSetFields", [
                    {collection: "tasks", field: "employeeid", db: daffodilDb.db.databaseName}
                ],{processid : process.processid});
                return require("q").delay(150);
            }).then(
            function () {
                return daffodilDb.query({$collection: "tasks", $filter: {task: "Daffodil t1"}});
            }).then(function (taskData) {
                expect(taskData.result[0].employeeid.code).to.eql("ritesh daffodil");
                expect(taskData.result[0].employeeid.name).to.eql("Ritesh daffodil");
                expect(taskData.result[0].employeeid._id).to.not.equal(undefined);
            })
            .then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_hsr_applane", {username: "daffodil_hsr_applane", "password": "daffodil_hsr_applane"})
            }).then(
            function (dbName) {
                daf_hsr_applaneDb = dbName;
                //sync daffodil_hsr_applane
                writeLog("Synchto daffodilhsrapplane for setfield in field employeeid");
                return Synch.synchProcess({data: {synch: true}}, daf_hsr_applaneDb);
            }).then(
            function () {
                return daf_hsr_applaneDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks", field: "employeeid"}, $fields: {field: 1, set: 1}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result[0].set).to.have.length(2);
            }).then(
            function () {
                var asyncDB = daf_hsr_applaneDb.asyncDB();
                var options = {processName: "SetFields"};
                return asyncDB.createProcess(options);
            }).then(
            function (process) {
                daf_hsr_applaneDb.invokeFunction("Porting.repopulateSetFields", [
                    {collection: "tasks", field: "employeeid", db: daf_hsr_applaneDb.db.databaseName}
                ],{processid : process.processid});
                return require("q").delay(150);
            }).then(
            function () {
                return daf_hsr_applaneDb.query({$collection: "tasks", $filter: {task: "t1"}})
            }).then(
            function (taskData) {
                expect(taskData.result[0].employeeid.name).to.eql("Ritesh daffodil hisar applane");
                expect(taskData.result[0].employeeid.code).to.eql("ritesh daffodil hisar applane");
                expect(taskData.result[0].employeeid._id).to.not.equal(undefined);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {index: 100, field: "status", type: "string", collectionid: {$query: {collection: "tasks"}}}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.functions", $insert: {name: "TaskBL", source: "NorthwindTestCase/lib", type: "js"}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.events", $insert: {event: "onSave", function: "TaskBL.onSave", collectionid: {$query: {collection: "tasks"}}, pre: true}});
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                //sync dafodil
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);
            }).then(
            function () {
                writeLog("101....");
                return daffodilDb.update({$collection: "tasks", $insert: {task: "t3", employeeid: {$query: {name: "Ritesh daffodil"}}, effort: {time: 60, unit: "Hrs"}}})
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.events", $filter: {"collectionid.collection": "tasks"}})
            }).then(
            function (eventData) {
                writeLog("102....");
                return daffodilDb.query({$collection: "tasks", $filter: {task: "t3"}});
            }).then(
            function (taskData) {
                writeLog("103....");
                expect(taskData.result[0].status).to.eql("New");
            })
            .then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            })
            .then(
            function (dbName) {
                daffodil_SbDb = dbName;
            }).then(
            function () {
                writeLog("104.......");
                return daffodil_SbDb.update({$collection: "pl.events", $insert: {function: "TaskBL.onInsert", event: "onInsert", pre: true, collectionid: {$query: {collection: "tasks"}}}})
            }).then(
            function () {
                writeLog("105.......");
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                writeLog("106.......");
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                writeLog("107.......");
                return daffodilDb.update({$collection: "tasks", $insert: {task: "t4", effort: {time: 60, unit: "Hrs"}}})
            }).then(
            function () {
                writeLog("108.......");
                return daffodilDb.query({$collection: "tasks", $filter: {task: "t4"}})
            }).then(function (taskData) {
                writeLog("109.......");
                expect(taskData.result[0].status).to.eql("New");
                expect(taskData.result[0].employeeid.name).to.eql("Rohit daffodil");
            })
            .then(
            function () {
                writeLog("110.......");
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                writeLog("111.......");
                return daffodil_SbDb.update({$collection: "pl.qviews", $insert: [
                    {label: "Daffodil Tasks", id: "daffodiltasks", collection: {$query: {collection: "tasks"}}, mainCollection: {$query: {collection: "tasks"}}}
                ]});
            }).then(
            function () {
                writeLog("112.......");
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("113.......");
                var qviews = menuData.result[0].qviews;
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {qviews: {$insert: [
                    {label: "Daffodil Tasks", id: "daffodilTasks", collection: "tasks"}
                ], $update: [
                    {_id: qviews[2]._id, $set: {label: "Daffodil Overdue Tasks"}}
                ]
                }}}})
            }).then(
            function () {
                writeLog("114.......");
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                writeLog("115.......");
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                writeLog("116.......");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}});
            }).then(
            function (menuData) {
                writeLog("117.......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].qviews).to.have.length(4);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Tasks");
                expect(menuData.result[0].qviews[1].id).to.eql("myTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("My Todos");
                expect(menuData.result[0].qviews[2].id).to.eql("overdueTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Daffodil Overdue Tasks");
                expect(menuData.result[0].qviews[3].id).to.eql("daffodilTasks");
                expect(menuData.result[0].qviews[3].label).to.eql("Daffodil Tasks");

                return daffodilDb.query({$collection: "pl.qviews", $filter: {"collection.collection": "tasks", label: "Daffodil Tasks"}})
            }).then(function (qviewData) {
                writeLog("118.......");
                expect(qviewData.result).to.have.length(1);
            })
            .then(
            function () {
                writeLog("119.......");
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                writeLog("120.......");
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("121.......");
                var qviews = menuData.result[0].qviews;
                return afb_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {qviews: {$insert: [
                    {label: "Future Tasks", id: "tasks", collection: "tasks"}
                ], $update: [
                    {_id: qviews[0]._id, $set: {label: "All Tasks"}},
                    {_id: qviews[2]._id, $set: {label: "Pending Tasks"}}
                ], $delete: [
                    {_id: qviews[1]._id}
                ]
                }}}})

            }).then(
            function () {
                writeLog("122.......");
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                writeLog("123.......");
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afbDb = dbName;
                writeLog("124.......");
                return afbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("125.......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].qviews).to.have.length(3);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("All Tasks");
                expect(menuData.result[0].qviews[1].id).to.eql("overdueTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("Pending Tasks");
                expect(menuData.result[0].qviews[2].id).to.eql("tasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Future Tasks");

                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                writeLog("126.......");
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("127......." + JSON.stringify(menuData));
                var qviews = menuData.result[0].qviews;
                var update = {
                    $collection: "pl.menus",
                    $update: {
                        _id: menuData.result[0]._id, $set: {
                            qviews: {$update: [
                                {_id: qviews[0]._id, $set: {label: "Daffodil All Tasks"}}
                            ]
                            }
                        }
                    }
                }
                return daffodil_SbDb.update(update);
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}});
            }).then(
            function (menuData) {
                writeLog("128......." + JSON.stringify(menuData));
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})

            }).then(
            function (dbName) {
                writeLog("129.......");
                daffodilDb = dbName;
                //synch daffodil
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);
            })
            .then(
            function () {
                writeLog("130.......");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}, $sort: {"qviews.label": 1}})
            }).then(
            function (menuData) {
                writeLog("131.......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].qviews).to.have.length(4);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("All Tasks");
                expect(menuData.result[0].qviews[1].id).to.eql("overdueTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("Daffodil Overdue Tasks");
                expect(menuData.result[0].qviews[2].id).to.eql("daffodilTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Daffodil Tasks");
                expect(menuData.result[0].qviews[3].id).to.eql("tasks");
                expect(menuData.result[0].qviews[3].label).to.eql("Future Tasks");

            }).then(
            function () {
                writeLog("132.......");
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})

            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                writeLog("133.......");
                //sync daffodil_sb
                return Synch.synchProcess({data: {synch: true}}, daffodil_SbDb);
            }).then(
            function () {
                writeLog("134.......");
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}, $sort: {"qviews.label": 1}})
            }).then(
            function (menuData) {
                writeLog("135......." + JSON.stringify(menuData));
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].qviews).to.have.length(4);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Daffodil All Tasks");
                expect(menuData.result[0].qviews[1].id).to.eql("overdueTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("Daffodil Overdue Tasks");
                expect(menuData.result[0].qviews[2].id).to.eql("daffodilTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Daffodil Tasks");
                expect(menuData.result[0].qviews[3].id).to.eql("tasks");
                expect(menuData.result[0].qviews[3].label).to.eql("Future Tasks");
                writeLog("commit from daffodilsb to daffodil..");
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                writeLog("136.......");
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                writeLog("137.......");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(function (menuData) {
                writeLog("138.......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].qviews).to.have.length(4);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Daffodil All Tasks");
                expect(menuData.result[0].qviews[1].id).to.eql("overdueTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("Daffodil Overdue Tasks");
                expect(menuData.result[0].qviews[2].id).to.eql("daffodilTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Daffodil Tasks");
                expect(menuData.result[0].qviews[3].id).to.eql("tasks");
                expect(menuData.result[0].qviews[3].label).to.eql("Future Tasks");
            })
            .then(
            function () {
                writeLog("139.......");
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                writeLog("140.......");
                return afb_SbDb.update({$collection: "pl.applications", $insert: [
                    {"label": "Accounts Management"}
                ]})
            }).then(
            function () {
                writeLog("141.......");
                var menuInsert = {$collection: "pl.menus", $insert: [
                    {label: "Accounts", application: {$query: {label: "Accounts Management"}}, collection: "accounts", index: 10},
                    {label: "Issues", application: {$query: {label: "Productivity"}}, collection: "issues", index: 20}
                ]};
                return afb_SbDb.update(menuInsert);
            }).then(
            function () {
                writeLog("142.......");
                return afb_SbDb.update({$collection: "pl.collections", $insert: [
                    {collection: "accountGroups", index: 20}
                ]});
            }).then(
            function () {
                writeLog("143.......");
                var fields = {$collection: "pl.fields", $insert: [
                    {index: 110, field: "name", type: "string", collectionid: {$query: {collection: "accountGroups"}}},
                    {index: 120, field: "name", type: "string", collectionid: {$query: {collection: "accounts"}}} ,
                    {index: 130, field: "type", type: "string", collectionid: {$query: {collection: "accounts"}}} ,
                    {index: 140, field: "accountgroupid", type: "fk", collectionid: {$query: {collection: "accounts"}}, collection: "accountGroups", set: ["name"]},
                    {index: 150, field: "gender", type: "string", collectionid: {$query: {collection: "employees"}}},
                    {index: 160, field: "duedate", type: "date", collectionid: {$query: {collection: "tasks"}}},
                    {index: 170, field: "project", type: "string", collectionid: {$query: {collection: "tasks"}}},
                    {index: 180, field: "name", type: "string", collectionid: {$query: {collection: "issues"}}}
                ]};
                return afb_SbDb.update(fields);
            }).then(
            function () {
                writeLog("144.......");
                return afb_SbDb.update({$collection: "pl.templates", $insert: {template: "Template", collectionid: {$query: {collection: "accounts"}}}})
            }).then(
            function () {
                writeLog("145.......");
                return afb_SbDb.update({$collection: "pl.actions", $insert: [
                    {type: "invoke", id: "syncAccounts", label: "Sync Accounts", collectionid: {$query: {collection: "accountGroups"}}},
                    {type: "invoke", id: "syncEmployees", label: "Sync Employees", collectionid: {$query: {collection: "employees"}}},
                    {type: "invoke", id: "portEmployees", label: "Port Employees", collectionid: {$query: {collection: "employees"}}}
                ] })
            }).then(
            function () {
                writeLog("146.......");
                return afb_SbDb.update({$collection: "pl.roles", $insert: [
                    {role: "Account_manager"},
                    {role: "Account_operator"}
                ]});
            }).then(
            function () {
                writeLog("147.......");
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                writeLog("148.......");
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afbDb = dbName;
                writeLog("149.......");
                return afbDb.query({$collection: "pl.applications", $sort: {label: 1}})
            }).then(
            function (applicationData) {
                writeLog("150.......");
                expect(applicationData.result).to.have.length(2);
                expect(applicationData.result[0].label).to.eql("Accounts Management");
                expect(applicationData.result[1].label).to.eql("Productivity");
                applicationId2 = applicationData.result[0]._id;
            }).then(
            function () {
                writeLog("151.......");
                return afbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId2}})
            }).then(
            function (menuData) {
                writeLog("152.......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("Accounts");//Accounts management menu
                return afbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                writeLog("153.......");
                expect(menuData.result).to.have.length(4);
                expect(menuData.result[0].label).to.eql("Achievements");
                expect(menuData.result[1].label).to.eql("Comments");
                expect(menuData.result[2].label).to.eql("Issues");
                expect(menuData.result[3].label).to.eql("ToDos");
            }).then(
            function () {
                writeLog("154.......");
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $fields: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("155.......");
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].field).to.eql("name");
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks"}, $fields: {field: 1}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("156.......");
                expect(fieldsData.result).to.have.length(13);
                expect(fieldsData.result[0].field).to.eql("convertedvalue");
                expect(fieldsData.result[1].field).to.eql("convertedvalue");
                expect(fieldsData.result[2].field).to.eql("duedate");
                expect(fieldsData.result[3].field).to.eql("effort");
                expect(fieldsData.result[4].field).to.eql("effort_done");
                expect(fieldsData.result[5].field).to.eql("employeeid");
                expect(fieldsData.result[6].field).to.eql("project");
                expect(fieldsData.result[7].field).to.eql("status");
                expect(fieldsData.result[8].field).to.eql("task");
                expect(fieldsData.result[9].field).to.eql("time");
                expect(fieldsData.result[10].field).to.eql("time");
                expect(fieldsData.result[11].field).to.eql("unit");
                expect(fieldsData.result[12].field).to.eql("unit");
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $fields: {field: 1}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("157.......");
                expect(fieldsData.result).to.have.length(7);
                expect(fieldsData.result[0].field).to.eql("age");
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[2].field).to.eql("code");
                expect(fieldsData.result[3].field).to.eql("gender");
                expect(fieldsData.result[4].field).to.eql("name");
                expect(fieldsData.result[5].field).to.eql("salary");
                expect(fieldsData.result[6].field).to.eql("type");

                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "accounts"}, $fields: {field: 1}, $sort: {field: 1}})

            }).then(
            function (fieldsData) {
                writeLog("158.......");
                expect(fieldsData.result).to.have.length(3);
                expect(fieldsData.result[0].field).to.eql("accountgroupid");
                expect(fieldsData.result[1].field).to.eql("name");
                expect(fieldsData.result[2].field).to.eql("type");
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "accountGroups"}, $fields: {field: 1}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("159.......");
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].field).to.eql("name");
                return afbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "employees"}, $fields: {label: 1}, $sort: {label: 1}})
            }).then(
            function (actionsData) {
                writeLog("160.......");
                expect(actionsData.result).to.have.length(2);
                expect(actionsData.result[0].label).to.eql("Port Employees");
                expect(actionsData.result[1].label).to.eql("Sync Employees");
                return afbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "accountGroups"}, $fields: {label: 1}, $sort: {label: 1}})
            }).then(
            function (actionsData) {
                writeLog("161.......");
                expect(actionsData.result).to.have.length(1);
                expect(actionsData.result[0].label).to.eql("Sync Accounts");

                return afbDb.query({$collection: "pl.roles", $sort: {role: 1}})
            }).then(
            function (roleData) {
                writeLog("162.......");
                expect(roleData.result).to.have.length(4);
                expect(roleData.result[0].role).to.eql("Account_manager");
                expect(roleData.result[1].role).to.eql("Account_operator");
                expect(roleData.result[2].role).to.eql("Accounts Management");
                expect(roleData.result[3].role).to.eql("Task management");
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})

            }).then(
            function (dbName) {
                writeLog("163.......");
                daffodilDb = dbName;
                //sync daffodil
                return Synch.synchProcess({data: {synch: true}}, daffodilDb);
            }).then(
            function (dbName) {

                writeLog("164.......");
                return daffodilDb.query({$collection: "pl.applications", $filter: {label: "Accounts Management"}})
            }).then(
            function (applicationData) {
                writeLog("165.......");
                expect(applicationData.result).to.have.length(1);
                applicationId2 = applicationData.result[0]._id;
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId2}})
            }).then(
            function (menuData) {
                writeLog("166.......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("Accounts");//Accounts management menu
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, label: "Issues"}})
            }).then(
            function (menuData) {
                writeLog("167.......");
                expect(menuData.result).to.have.length(1);
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees", field: "gender"}, $fields: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("168.......");
                expect(fieldsData.result).to.have.length(1);
                return daffodilDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "employees"}, $fields: {label: 1}, $sort: {label: 1}})
            }).then(
            function (actionsData) {
                writeLog("169.......");
                expect(actionsData.result).to.have.length(2);
                expect(actionsData.result[0].label).to.eql("Port Employees");
                expect(actionsData.result[1].label).to.eql("Sync Employees");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks", "field": {"$in": ["duedate", "project"]}}, $fields: {field: 1}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("170.......");
                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].field).to.eql("duedate");
                expect(fieldsData.result[1].field).to.eql("project");
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                writeLog("171.......");
                daffodil_SbDb = dbName;
                return daffodil_SbDb.update({$collection: "pl.applications", $update: {_id: applicationId2, $set: {"label": "Book Management"}}});
            }).then(
            function () {
                writeLog("172.......");
                var menuInsert = {$collection: "pl.menus", $insert: [
                    {label: "Taxes", application: {$query: {label: "Book Management"}}, collection: "taxes", index: 30},
                    {label: "Daffodil Issues", application: {$query: {label: "Productivity"}}, collection: "daffodilissues", index: 40}
                ]};
                return daffodil_SbDb.update(menuInsert);
            }).then(
            function () {
                writeLog("173.......");
                var fields = {$collection: "pl.fields", $insert: [
                    {index: 190, field: "account_group_type", type: "string", collectionid: {$query: {collection: "accounts"}}} ,
                    {index: 200, field: "join_date", type: "date", collectionid: {$query: {collection: "employees"}}}
                ]};
                return daffodil_SbDb.update(fields);
            }).then(
            function () {
                writeLog("174.......");
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                writeLog("175.......");
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                writeLog("176.......");
                return daffodilDb.query({$collection: "pl.applications", $sort: {label: 1} })
            }).then(
            function (applicationData) {
                writeLog("177.......");
                expect(applicationData.result).to.have.length(2);
                expect(applicationData.result[0].label).to.eql("Book Management");
                expect(applicationData.result[1].label).to.eql("Productivity");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId2}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                writeLog("178.......");
                expect(menuData.result).to.have.length(2);
                expect(menuData.result[0].label).to.eql("Accounts");
                expect(menuData.result[1].label).to.eql("Taxes");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                writeLog("179......." + JSON.stringify(menuData));
                expect(menuData.result).to.have.length(6);
                expect(menuData.result[0].label).to.eql("Comments");
                expect(menuData.result[1].label).to.eql("Daffodil Issues");
                expect(menuData.result[2].label).to.eql("Issues");
                expect(menuData.result[3].label).to.eql("Result");
                expect(menuData.result[4].label).to.eql("Targets");
                expect(menuData.result[5].label).to.eql("ToDos");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "accounts"}, $fields: {field: 1}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("180.......");
                expect(fieldsData.result).to.have.length(4);
                expect(fieldsData.result[0].field).to.eql("account_group_type");
                expect(fieldsData.result[1].field).to.eql("accountgroupid");
                expect(fieldsData.result[2].field).to.eql("name");
                expect(fieldsData.result[3].field).to.eql("type");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks"}, $fields: {field: 1}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("181.......");
                expect(fieldsData.result).to.have.length(13);
                expect(fieldsData.result[0].field).to.eql("convertedvalue");
                expect(fieldsData.result[1].field).to.eql("convertedvalue");
                expect(fieldsData.result[2].field).to.eql("duedate");
                expect(fieldsData.result[3].field).to.eql("effort");
                expect(fieldsData.result[4].field).to.eql("effort_done");
                expect(fieldsData.result[5].field).to.eql("employeeid");
                expect(fieldsData.result[6].field).to.eql("project");
                expect(fieldsData.result[7].field).to.eql("status");
                expect(fieldsData.result[8].field).to.eql("task");
                expect(fieldsData.result[9].field).to.eql("time");
                expect(fieldsData.result[10].field).to.eql("time");
                expect(fieldsData.result[11].field).to.eql("unit");
                expect(fieldsData.result[12].field).to.eql("unit");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $fields: {field: 1}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("182.......");
                expect(fieldsData.result).to.have.length(8);
                expect(fieldsData.result[0].field).to.eql("age");
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[2].field).to.eql("code");
                expect(fieldsData.result[3].field).to.eql("gender");
                expect(fieldsData.result[4].field).to.eql("join_date");
                expect(fieldsData.result[5].field).to.eql("name");
                expect(fieldsData.result[6].field).to.eql("salary");
                expect(fieldsData.result[7].field).to.eql("type");

                return ApplaneDB.connect(Config.URL, "daffodil_hsr_applane", {username: "daffodil_hsr_applane", "password": "daffodil_hsr_applane"})

            }).then(
            function (dbName) {
                writeLog("183.......");
                daf_hsr_applaneDb = dbName;
                return daf_hsr_applaneDb.query({$collection: "pl.applications", $fields: {label: 1}, $sort: {label: 1}})
            }).then(
            function (applicationData) {
                writeLog("184.......");
                expect(applicationData.result).to.have.length(2);
                expect(applicationData.result[0].label).to.eql("Book Management");
                expect(applicationData.result[1].label).to.eql("Productivity");
                return daf_hsr_applaneDb.update({$collection: "pl.menus", $insert: [
                    {label: "Applane Accounts", application: {$query: {label: "Book Management"}}, collection: "applaneAccounts", index: 40}
                ]});
            }).then(
            function () {
                writeLog("185.......");
                return daf_hsr_applaneDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId2}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                writeLog("186.......");
                expect(menuData.result).to.have.length(3);
                expect(menuData.result[0].label).to.eql("Accounts");
                expect(menuData.result[1].label).to.eql("Applane Accounts");
                expect(menuData.result[2].label).to.eql("Taxes");
                return daf_hsr_applaneDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks", field: "duedate"}, $fields: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("187.......");
                expect(fieldsData.result).to.have.length(0);
            }).then(
            function () {
                writeLog("188.......");
                //sync daffodil_hsr_applane
                return Synch.synchProcess({data: {synch: true}}, daf_hsr_applaneDb);
            }).then(
            function () {
                writeLog("189.......");
                return daf_hsr_applaneDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks", field: "duedate"}, $fields: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("190.......");
                expect(fieldsData.result).to.have.length(1);
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                writeLog("191.......");
                return afb_SbDb.update({$collection: "pl.applications", $update: {_id: applicationId, $set: {"label": "ToDos"}}});
            }).then(
            function () {
                writeLog("192.......");
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, label: {"$in": ["Comments", "Issues"]}}, $sort: {label: 1}});
            }).then(
            function (menuData) {
                writeLog("193.......");
                return afb_SbDb.update({$collection: "pl.menus",
                    $insert: {label: "Follow Ups", application: {$query: {label: "ToDos"}}, collection: "followUps", index: 50},
                    $delete: {_id: menuData.result[0]._id},
                    $update: {_id: menuData.result[1]._id, $set: {label: "Issues/Features"}}
                });
            }).then(
            function () {
                writeLog("194.......");
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks", field: {"$in": ["task", "duedate"]}}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("195.......");
                return afb_SbDb.update({$collection: "pl.fields",
                    $insert: [
                        {index: 210, field: "start_date", type: "date", collectionid: {$query: {collection: "tasks"}}},
                        {index: 220, field: "anniversary_date", type: "date", collectionid: {$query: {collection: "employees"}}},
                        {index: 220, field: "synch", type: "boolean", collectionid: {$query: {collection: "accounts"}}}
                    ],
                    $update: {_id: fieldsData.result[1]._id, $set: {label: "Note"}},
                    $delete: {_id: fieldsData.result[0]._id}})
            }).then(
            function () {
                writeLog("196.......");
                return afb_SbDb.update({$collection: "pl.actions", $insert: [
                    {type: "invoke", id: "updateTasks", label: "Update Tasks", collectionid: {$query: {collection: "tasks"}}},
                    {type: "invoke", id: "sendGreetings", label: "Send Greetings", collectionid: {$query: {collection: "employees"}}}
                ]})
            }).then(
            function () {
                writeLog("197.......");
                return afb_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "employees", label: "Port Employees"}, $fields: {_id: 1}})
            }).then(
            function (actionData) {
                writeLog("198.......");
                return afb_SbDb.update({$collection: "pl.actions", $update: {_id: actionData.result[0]._id, $set: {label: "Port"}}});
            }).then(
            function () {
                writeLog("199.......");
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "accounts", field: "name"}, $fields: {_id: 1}});
            }).then(
            function (fieldsData) {
                return afbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {label: "account"}}});
            }).then(
            function (applicationData) {
                return afbDb.update({$collection: "pl.applications", $update: {_id: applicationId2, $set: {"label": "Account Keeping"}}});
            }).then(
            function () {
                return afbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId2}, $fields: {_id: 1, label: 1}});
            }).then(
            function (menuData) {
                return afbDb.update({$collection: "pl.menus", $insert: [
                    {label: "Issues", application: {$query: {label: "Account Keeping"}}, collection: "issues", index: 10}
                ], $update: [
                    {_id: menuData.result[0]._id, $set: {label: "Applane New Accounts"}}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
            }).then(
            function (dbName) {
                afbDb = dbName;
                return afbDb.query({$collection: "pl.applications", $sort: {label: 1}})
            }).then(
            function (applicationData) {
                expect(applicationData.result).to.have.length(2);
                expect(applicationData.result[0].label).to.eql("Account Keeping");
                expect(applicationData.result[1].label).to.eql("ToDos");
                return afbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(4);
                expect(menuData.result[0].label).to.eql("Achievements");
                expect(menuData.result[1].label).to.eql("Follow Ups");
                expect(menuData.result[2].label).to.eql("Issues/Features");
                expect(menuData.result[3].label).to.eql("ToDos");
                return afbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId2}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(2);
                expect(menuData.result[0].label).to.eql("Applane New Accounts");
                expect(menuData.result[1].label).to.eql("Issues");
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "tasks"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(13);
                expect(fieldsData.result[0].field).to.eql("convertedvalue");
                expect(fieldsData.result[1].field).to.eql("convertedvalue");
                expect(fieldsData.result[2].field).to.eql("effort");
                expect(fieldsData.result[3].field).to.eql("effort_done");
                expect(fieldsData.result[4].field).to.eql("employeeid");
                expect(fieldsData.result[5].field).to.eql("project");
                expect(fieldsData.result[6].field).to.eql("start_date");
                expect(fieldsData.result[7].field).to.eql("status");
                expect(fieldsData.result[8].field).to.eql("task");
                expect(fieldsData.result[9].field).to.eql("time");
                expect(fieldsData.result[10].field).to.eql("time");
                expect(fieldsData.result[11].field).to.eql("unit");
                expect(fieldsData.result[12].field).to.eql("unit");
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $sort: {field: 1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(8);
                expect(fieldsData.result[0].field).to.eql("age");
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[2].field).to.eql("anniversary_date");
                expect(fieldsData.result[3].field).to.eql("code");
                expect(fieldsData.result[4].field).to.eql("gender");
                expect(fieldsData.result[5].field).to.eql("name");
                expect(fieldsData.result[6].field).to.eql("salary");
                expect(fieldsData.result[7].field).to.eql("type");
                return afbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "tasks"}, $sort: {label: 1}});
            }).then(
            function (actionData) {
                expect(actionData.result).to.have.length(1);
                expect(actionData.result[0].label).to.eql("Update Tasks");
                return afbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "employees"}, $sort: {label: 1}})

            }).then(
            function (actionData) {

                expect(actionData.result).to.have.length(3);
                expect(actionData.result[0].label).to.eql("Port");
                expect(actionData.result[1].label).to.eql("Send Greetings");
                expect(actionData.result[2].label).to.eql("Sync Employees");
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "accounts"}, $sort: {field: 1}});

            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(4);
                expect(fieldsData.result[0].field).to.eql("accountgroupid");
                expect(fieldsData.result[1].field).to.eql("name");
                expect(fieldsData.result[2].field).to.eql("synch");
                expect(fieldsData.result[3].field).to.eql("type");
            }).then(
            function () {

            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });
})

describe("commit sync auto", function () {

    beforeEach(function (done) {
        Testcases.beforeEach().then(
            function () {
                return ApplaneDB.getAdminDB();
            }).then(
            function (adminDB) {
                var adminDb = adminDB;
                var insertDbs = {$collection: "pl.dbs", $insert: [
                    {"db": "afb", "sandboxDb": "afb_sb", "globalDb": "", "ensureDefaultCollections": true, "guestUserName": "afb", "globalUserName": "afb", "globalPassword": "afb", "globalUserAdmin": true, autoSynch: false},
                    {"db": "daffodil", "sandboxDb": "daffodil_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "daffodil", "globalUserName": "daffodil", "globalPassword": "daffodil", "globalUserAdmin": true, autoSynch: true},
                    {"db": "daffodil_hsr", "globalDb": "daffodil", "ensureDefaultCollections": false, "guestUserName": "daffodil_hsr", "globalUserName": "daffodil_hsr", "globalPassword": "daffodil_hsr", "globalUserAdmin": true, autoSynch: true},
                    {"db": "daffodil_hsr_applane", "globalDb": "daffodil_hsr", "ensureDefaultCollections": false, "guestUserName": "daffodil_hsr_applane", "globalUserName": "daffodil_hsr_applane", "globalPassword": "daffodil_hsr_applane", "globalUserAdmin": true, autoSynch: false},
                    {"db": "darcl", "sandboxDb": "darcl_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "darcl", "globalUserName": "darcl", "globalPassword": "darcl", "globalUserAdmin": true, autoSynch: true, is_sandbox: false},
                    {"db": "girnarsoft", "sandboxDb": "girnarsoft_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "girnarsoft", "globalUserName": "girnarsoft", "globalPassword": "girnarsoft", "globalUserAdmin": true, autoSynch: false},
                    {"db": "daffodil_ggn", "globalDb": "daffodil", "ensureDefaultCollections": false, "guestUserName": "daffodil_ggn", "globalUserName": "daffodil_ggn", "globalPassword": "daffodil_ggn", "globalUserAdmin": true, autoSynch: true},
                    {"db": "daffodil_hsr_other", "globalDb": "daffodil_hsr", "ensureDefaultCollections": false, "guestUserName": "daffodil_hsr_other", "globalUserName": "daffodil_hsr_other", "globalPassword": "daffodil_hsr_other", "globalUserAdmin": true, autoSynch: false}
                ]};
                return adminDb.update(insertDbs);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });
    })

    afterEach(function (done) {
//        return;
        var dbs = {};
        dropDatabase(dbs)
            .then(
            function () {
                var keys = Object.keys(dbs);
                return Utils.iterateArrayWithPromise(keys, function (index, dbName) {
                    var db = dbs[dbName]
                    return db.dropDatabase();
                })
            }).then(
            function () {
                return Testcases.afterEach();
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it('auto sync test case', function (done) {
        var daf_hsr_applaneDb = undefined;
        var taskId = undefined;
        var applicationId = undefined;
        var applicationId2 = undefined;
        var daf_hsrDb = undefined;
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var daffodilDb = undefined;
        var daffodil_SbDb = undefined;
        var daffodil_hsrDb = undefined;
        var girnarsoftDb = undefined;
        var darclDb = undefined;
        var daffodil_hsr_otherDb = undefined;
        var daffodilGgnDb = undefined;
        var qviews = undefined;
        var menuId = undefined;
        var processid = undefined;


        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                writeLog("1......");
                return afb_SbDb.update({$collection: "pl.applications", $insert: [
                    {"label": "Productivity"}
                ]})
            }).then(
            function () {
                writeLog("2......");
                var menuInsert = {$collection: "pl.menus", $insert: [
                    {label: "Tasks", application: {$query: {label: "Productivity"}}, collection: "tasks", index: 10}
                ]};
                return afb_SbDb.update(menuInsert);
            }).then(
            function () {
                writeLog("3......");
                return afb_SbDb.update({$collection: "pl.collections", $insert: [
                    {collection: "employees", index: 20}
                ]});
            }).then(
            function (dbName) {
                writeLog("6......");
                var qviewInsert = {$collection: "pl.qviews", $insert: [
                    {label: "My Tasks", id: "myTasks", collection: {$query: {collection: "tasks"}}, mainCollection: {$query: {collection: "tasks"}}},
                    {label: "All Tasks", id: "allTasks", collection: {$query: {collection: "tasks"}}, mainCollection: {$query: {collection: "tasks"}}}
                ]};
                return afb_SbDb.update(qviewInsert);
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.applications", $fields: {_id: 1}})
            }).then(
            function (appplicationData) {
                writeLog("7.....");
                applicationId = appplicationData.result[0]._id;
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("8......");
                menuId = menuData.result[0]._id
                return afb_SbDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {qviews: {$insert: [
                    {label: "My Tasks", id: "myTasks", collection: "tasks"},
                    {label: "All Tasks", id: "allTasks", collection: "tasks"}
                ]}}}})

            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                expectSyncData(daffodilDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_hsr", {username: "daffodil_hsr", "password": "daffodil_hsr"})
            }).then(
            function (dbName) {
                daffodil_hsrDb = dbName;
                expectSyncData(daffodil_hsrDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_hsr_applane", {username: "daffodil_hsr_applane", "password": "daffodil_hsr_applane"})
            }).then(
            function (dbName) {
                daf_hsr_applaneDb = dbName;
                expectSyncData(daf_hsr_applaneDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "darcl", {username: "darcl", "password": "darcl"})
            }).then(
            function (dbName) {
                darclDb = dbName;
                expectSyncData(darclDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "girnarsoft", {username: "girnarsoft", "password": "girnarsoft"})
            }).then(
            function (dbName) {
                girnarsoftDb = dbName;
                expectSyncData(girnarsoftDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_hsr_other", {username: "daffodil_hsr_other", "password": "daffodil_hsr_other"})
            }).then(
            function (dbName) {
                daffodil_hsr_otherDb = dbName;
                expectSyncData(daffodil_hsr_otherDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_ggn", {username: "daffodil_ggn", "password": "daffodil_ggn"})
            }).then(
            function (dbName) {
                daffodilGgnDb = dbName;
                expectSyncData(daffodilGgnDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "girnarsoft", {username: "girnarsoft", "password": "girnarsoft"})
            }).then(
            function (dbName) {
                girnarsoftDb = dbName;
                return girnarsoftDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {label: "Girnar Soft Tasks"}}})
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_hsr_applane", {username: "daffodil_hsr_applane", "password": "daffodil_hsr_applane"})
            }).then(
            function (dbName) {
                daf_hsr_applaneDb = dbName;
            }).then(
            function () {
                return daf_hsr_applaneDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {label: "Daf Hsr Applane Tasks"}}})

            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_hsr", {username: "daffodil_hsr", "password": "daffodil_hsr"})
            }).then(
            function (dbName) {
                writeLog("9......");
                daffodil_hsrDb = dbName;
                return daffodil_hsrDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("10......");
                menuId = menuData.result[0]._id;
                qviews = menuData.result[0].qviews;
                return daffodil_hsrDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {label: "New Tasks"}}})
            }).then(
            function () {
                writeLog("11......");
                return daffodil_hsrDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {qviews: {$insert: [
                    {label: "Overdue Tasks", id: "overdueTasks", collection: "tasks"}
                ], $update: [
                    {_id: qviews[2]._id, $set: {label: "All Todos"}}
                ]
                }}}});
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_hsrDb);
            }).then(
            function () {

                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})

            }).then(
            function (menuData) {
                writeLog("13......");
                menuId = menuData.result[0]._id;
                qviews = menuData.result[0].qviews;
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {label: "Daffodil_sb Tasks"}}})
            }).then(
            function () {
                writeLog("14......");
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {qviews: {$insert: [
                    {label: "Future Tasks", id: "futureTasks", collection: "tasks"}
                ], $update: [
                    {_id: qviews[0]._id, $set: {label: "Todos"}},
                    {_id: qviews[1]._id, $set: {label: "My ToDos"}}
                ], $delete: [
                    {_id: qviews[2]._id}
                ]
                }}}});
            }).then(
            function () {
                writeLog("15......");
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                writeLog("16......");
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                writeLog("17......");
                daffodilDb = dbName;
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("18......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("Daffodil_sb Tasks");
                expect(menuData.result[0].qviews).to.have.length(3);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Todos");
                expect(menuData.result[0].qviews[1].id).to.eql("myTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("My ToDos");
                expect(menuData.result[0].qviews[2].id).to.eql("futureTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Future Tasks");

            }).then(
            function () {
                writeLog("19......");
                return ApplaneDB.connect(Config.URL, "daffodil_hsr", {username: "daffodil_hsr", "password": "daffodil_hsr"})

            }).then(
            function (dbName) {
                daffodil_hsrDb = dbName;

            }).then(
            function () {
                writeLog("20......");
                return daffodil_hsrDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("New Tasks");
                expect(menuData.result[0].qviews).to.have.length(4);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Todos");
                expect(menuData.result[0].qviews[1].id).to.eql("myTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("My ToDos");
                expect(menuData.result[0].qviews[2].id).to.eql("overdueTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Overdue Tasks");
                expect(menuData.result[0].qviews[3].id).to.eql("futureTasks");
                expect(menuData.result[0].qviews[3].label).to.eql("Future Tasks");

            }).then(
            function () {
                writeLog("21......");
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                writeLog("22......");
                daffodil_SbDb = dbName;
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {qviews: {$insert: [
                    {label: "Sb Future Tasks", id: "sbfutureTasks", collection: "tasks"}
                ]}}}});
            }).then(
            function () {
                writeLog("23......");
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                writeLog("24......");
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})

            }).then(
            function (menuData) {
                writeLog("25......");
                menuId = menuData.result[0]._id;
                qviews = menuData.result[0].qviews;
                return afb_SbDb.update({$collection: "pl.menus", $update: {_id: menuId, $set: {qviews: {$insert: [
                    {label: "Pending Tasks", id: "pendingTasks", collection: "tasks"}
                ], $update: [
                    {_id: qviews[0]._id, $set: {label: "Afb Tasks"}}
                ], $delete: [
                    {_id: qviews[1]._id}
                ]
                }}}});

            }).then(
            function () {
                writeLog("26......");
                return afb_SbDb.update({$collection: "pl.processes", $insert: {processed: 1}})
            }).then(
            function (update) {
                writeLog("27......");
                processid = update["pl.processes"].$insert[0]._id;
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb, {processid: processid});
            }).then(
            function () {
                writeLog("28......");
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                writeLog("29......");
                daffodilDb = dbName;
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}});

            }).then(
            function (menuData) {
                writeLog("30......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("Daffodil_sb Tasks");
                expect(menuData.result[0].qviews).to.have.length(3);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Todos");
                expect(menuData.result[0].qviews[1].id).to.eql("futureTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("Future Tasks");
                expect(menuData.result[0].qviews[2].id).to.eql("pendingTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Pending Tasks");
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (dbName) {
                writeLog("31......");
                daffodil_SbDb = dbName;
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}, $sort: {"qviews.label": 1}});
            }).then(
            function (menuData) {
                writeLog("32......" + JSON.stringify(menuData));
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("Daffodil_sb Tasks");
                expect(menuData.result[0].qviews).to.have.length(4);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Todos");
                expect(menuData.result[0].qviews[1].id).to.eql("futureTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("Future Tasks");
                expect(menuData.result[0].qviews[2].id).to.eql("sbfutureTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Sb Future Tasks");
                expect(menuData.result[0].qviews[3].id).to.eql("pendingTasks");
                expect(menuData.result[0].qviews[3].label).to.eql("Pending Tasks");
                return ApplaneDB.connect(Config.URL, "daffodil_hsr", {username: "daffodil_hsr", "password": "daffodil_hsr"});
            }).then(
            function (dbName) {
                writeLog("33......");
                daffodil_hsrDb = dbName;
                return daffodil_hsrDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}});
            }).then(
            function (menuData) {
                writeLog("34......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("New Tasks");
                expect(menuData.result[0].qviews).to.have.length(4);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Todos");
                expect(menuData.result[0].qviews[1].id).to.eql("overdueTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("Overdue Tasks");
                expect(menuData.result[0].qviews[2].id).to.eql("futureTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Future Tasks");
                expect(menuData.result[0].qviews[3].id).to.eql("pendingTasks");
                expect(menuData.result[0].qviews[3].label).to.eql("Pending Tasks");
                return ApplaneDB.connect(Config.URL, "darcl", {username: "darcl", "password": "darcl"})
            }).then(
            function (dbName) {
                writeLog("35......");
                darclDb = dbName;
                return darclDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("36......");
                //changes of afb_ab reflect here as autoSynch is true in darcel
                expect(menuData.result[0].label).to.eql("Tasks");
                expect(menuData.result[0].qviews).to.have.length(3);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Afb Tasks");
                expect(menuData.result[0].qviews[1].id).to.eql("allTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("All Tasks");
                expect(menuData.result[0].qviews[2].id).to.eql("pendingTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Pending Tasks");
            }).then(
            function () {
                writeLog("37......");
                return ApplaneDB.connect(Config.URL, "girnarsoft", {username: "girnarsoft", "password": "girnarsoft"})
            }).then(
            function (dbName) {
                writeLog("38......");
                girnarsoftDb = dbName;
                //changes of afb_ab do not reflect here as autoSynch is false in girnarsoft
                return girnarsoftDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("Girnar Soft Tasks");
                expect(menuData.result[0].qviews).to.have.length(3);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Tasks");
                expect(menuData.result[0].qviews[1].id).to.eql("myTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("My Tasks");
                expect(menuData.result[0].qviews[2].id).to.eql("allTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("All Tasks");
            }).then(
            function () {
                writeLog("39......");
                return ApplaneDB.connect(Config.URL, "daffodil_hsr_applane", {username: "daffodil_hsr_applane", "password": "daffodil_hsr_applane"})
            }).then(
            function (dbName) {
                writeLog("40......");
                daf_hsr_applaneDb = dbName;
                return daf_hsr_applaneDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})

            }).then(
            function (menuData) {
                writeLog("41......");
                //changes of daffodil_hsr do not reflect here as autoSynch is false in daffodil_hsr_applane
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("Daf Hsr Applane Tasks");
                expect(menuData.result[0].qviews).to.have.length(3);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Tasks");
                expect(menuData.result[0].qviews[1].id).to.eql("myTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("My Tasks");
                expect(menuData.result[0].qviews[2].id).to.eql("allTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("All Tasks");

            }).then(
            function () {
                writeLog("42......");
                return afb_SbDb.query({$collection: "pl.processes", $filter: {_id: processid}});
            }).then(
            function (result) {
                writeLog("43......");
//                writeLog("result>>>>>>>" + JSON.stringify(result));
                expect(result.result[0].detail).to.have.length(8);
            }).then(
            function () {
                writeLog("44......");
                return Synch.synchProcess({data: {synch: true}}, daf_hsr_applaneDb);
            }).then(
            function () {
                writeLog("45......");
                return daf_hsr_applaneDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("46......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("Daf Hsr Applane Tasks");
                expect(menuData.result[0].qviews).to.have.length(4);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Todos");
                expect(menuData.result[0].qviews[1].id).to.eql("overdueTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("Overdue Tasks");
                expect(menuData.result[0].qviews[2].id).to.eql("futureTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Future Tasks");
                expect(menuData.result[0].qviews[3].id).to.eql("pendingTasks");
                expect(menuData.result[0].qviews[3].label).to.eql("Pending Tasks");
            }).then(
            function () {
                writeLog("46......");
                return Synch.synchProcess({data: {synch: true}}, daf_hsr_applaneDb);
            }).then(
            function () {
                writeLog("47......");
                return daf_hsr_applaneDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})
            }).then(
            function (menuData) {
                writeLog("48......");
                expect(menuData.result).to.have.length(1);
                expect(menuData.result[0].label).to.eql("Daf Hsr Applane Tasks");
                expect(menuData.result[0].qviews).to.have.length(4);
                expect(menuData.result[0].qviews[0].id).to.eql("tasks");
                expect(menuData.result[0].qviews[0].label).to.eql("Todos");
                expect(menuData.result[0].qviews[1].id).to.eql("overdueTasks");
                expect(menuData.result[0].qviews[1].label).to.eql("Overdue Tasks");
                expect(menuData.result[0].qviews[2].id).to.eql("futureTasks");
                expect(menuData.result[0].qviews[2].label).to.eql("Future Tasks");
                expect(menuData.result[0].qviews[3].id).to.eql("pendingTasks");
                expect(menuData.result[0].qviews[3].label).to.eql("Pending Tasks");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });

    });

})

function expectSyncData(db) {
    var applicationId = undefined;
    db.query({$collection: "pl.applications"})
        .then(
        function (applicationData) {
            applicationId = applicationData.result[0]._id
            expect(applicationData.result).to.have.length(1);
            expect(applicationData.result[0].label).to.eql("Productivity");
        }).then(
        function () {
            return db.query({$collection: "pl.menus", $filter: {"application._id": applicationId, collection: "tasks"}})

        }).then(
        function (menuData) {
            expect(menuData.result).to.have.length(1);
            expect(menuData.result[0].label).to.eql("Tasks");
            expect(menuData.result[0].qviews).to.have.length(3);
            expect(menuData.result[0].qviews[0].id).to.eql("tasks");
            expect(menuData.result[0].qviews[0].label).to.eql("Tasks");
            expect(menuData.result[0].qviews[1].id).to.eql("myTasks");
            expect(menuData.result[0].qviews[1].label).to.eql("My Tasks");
            expect(menuData.result[0].qviews[2].id).to.eql("allTasks");
            expect(menuData.result[0].qviews[2].label).to.eql("All Tasks");
            return db.query({$collection: "pl.collections", $sort: {collection: 1}})

        }).then(function (collectionData) {

            expect(collectionData.result).to.have.length(2);
            expect(collectionData.result[0].collection).to.eql("employees")
            expect(collectionData.result[1].collection).to.eql("tasks")
        })
}

function writeLog(log) {
//    console.log(log);
}

describe('commit sync with rollback cases', function () {

    beforeEach(function (done) {
        Testcases.beforeEach().then(
            function () {
                return ApplaneDB.getAdminDB();
            }).then(
            function (adminDB) {
                var adminDb = adminDB;
                var insertDbs = {$collection: "pl.dbs", $insert: [
                    {"db": "afb", "sandboxDb": "afb_sb", "globalDb": "", "ensureDefaultCollections": true, "guestUserName": "afb", "globalUserName": "afb", "globalPassword": "afb", "globalUserAdmin": true, autoSynch: false},
                    {"db": "daffodil", "sandboxDb": "daffodil_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "daffodil", "globalUserName": "daffodil", "globalPassword": "daffodil", "globalUserAdmin": true, autoSynch: true},
                    {"db": "daffodil_hsr", "globalDb": "daffodil", "ensureDefaultCollections": false, "guestUserName": "daffodil_hsr", "globalUserName": "daffodil_hsr", "globalPassword": "daffodil_hsr", "globalUserAdmin": true, autoSynch: false},
                    {"db": "daffodil_hsr_applane", "globalDb": "daffodil_hsr", "ensureDefaultCollections": false, "guestUserName": "daffodil_hsr_applane", "globalUserName": "daffodil_hsr_applane", "globalPassword": "daffodil_hsr_applane", "globalUserAdmin": true, autoSynch: false},
                    {"db": "darcl", "sandboxDb": "darcl_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "darcl", "globalUserName": "darcl", "globalPassword": "darcl", "globalUserAdmin": true, autoSynch: true, is_sandbox: false},
                    {"db": "girnarsoft", "sandboxDb": "girnarsoft_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "girnarsoft", "globalUserName": "girnarsoft", "globalPassword": "girnarsoft", "globalUserAdmin": true, autoSynch: false},
                    {"db": "daffodil_ggn", "globalDb": "daffodil", "ensureDefaultCollections": false, "guestUserName": "daffodil_ggn", "globalUserName": "daffodil_ggn", "globalPassword": "daffodil_ggn", "globalUserAdmin": true, autoSynch: true},
                    {"db": "daffodil_hsr_other", "globalDb": "daffodil_hsr", "ensureDefaultCollections": false, "guestUserName": "daffodil_hsr_other", "globalUserName": "daffodil_hsr_other", "globalPassword": "daffodil_hsr_other", "globalUserAdmin": true, autoSynch: false}
                ]};
                return adminDb.update(insertDbs);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });
    })

    afterEach(function (done) {
//        return;
        var dbs = {};
        dropDatabase(dbs)
            .then(
            function () {
                var keys = Object.keys(dbs);
                return Utils.iterateArrayWithPromise(keys, function (index, dbName) {
                    var db = dbs[dbName]
                    return db.dropDatabase();
                })
            }).then(
            function () {
                return Testcases.afterEach();
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })

    it('commit sync with rollback', function (done) {
        var afb_SbDb = undefined;
        var afbDb = undefined;
        var applicationId = undefined;
        var daffodil_sbDb = undefined;
        var daffodilDb = undefined;
        var daffodil_hsrDb = undefined;
        var processid = undefined;
        var changeLogLengthDaffodil = undefined;
        var changeLogLengthAfb = undefined;
        var changeLogLengthDaffodilHsr = undefined;
        var adminDb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
            .then(
            function (dbName) {
                writeLog("1......");
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.collections", $insert: [
                    {collection: "issues"},
                    {collection: "employees"}
                ]})
            }).then(
            function () {
                writeLog("2......");
                return afb_SbDb.update({$collection: "pl.fields",
                    $insert: [
                        {field: "issue", label: "Issue", mandatory: true, filterable: true, type: "string", collectionid: {$query: {collection: "issues"}}},
                        {field: "date", label: "Date", type: "date", collectionid: {$query: {collection: "issues"}}},
                        {field: "desc", label: "Desc", type: "string", collectionid: {$query: {collection: "issues"}}}
                    ]
                });
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.applications",
                    $insert: [
                        {label: "Test"}
                    ]
                });
            }).then(
            function () {
                writeLog("3......");
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb)
            }).then(
            function () {
                writeLog("4......");
                return ApplaneDB.connect(Config.URL, "daffodil_hsr", {username: "daffodil_hsr", "password": "daffodil_hsr"})
            }).then(
            function (dbName) {
                daffodil_hsrDb = dbName;
                return daffodil_hsrDb.update({$collection: "pl.menus", $insert: [
                    {label: "test", collection: "test", application: {$query: {label: "Test"}}}
                ]})
            }).then(
            function () {
                return daffodil_hsrDb.update({$collection: "pl.fields", $insert: [
                    {field: "deliverydate", label: "Delivery Date", type: "date", collectionid: {$query: {collection: "issues"}}},
                    {field: "duedate", label: "Due Date", type: "date", collectionid: {$query: {collection: "issues"}}}
                ]})
            }).then(
            function () {
                writeLog("5......");
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                writeLog("6......");
                daffodil_sbDb = dbName;
                return daffodil_sbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues", field: {"$in": ["date", "issue"]}}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("7......");
                return daffodil_sbDb.update({$collection: "pl.fields", $insert: [
                    {field: "duedate", label: "Due Date", type: "date", collectionid: {$query: {collection: "issues"}}}
                ], $update: [
                    {_id: fieldsData.result[1]._id, $set: {mandatory: false}}
                ], $delete: {_id: fieldsData.result[0]._id}
                })
            }).then(
            function () {
                writeLog("8......");
                return daffodil_sbDb.update({$collection: "pl.menus", $insert: [
                    {label: "test2", collection: "test2", application: {$query: {label: "Test"}}}
                ]})
            }).then(
            function () {
                writeLog("9......");
                return Commit.commitProcess({data: {commit: true}}, daffodil_sbDb);
            }).then(
            function () {
                writeLog("10......");
                return daffodil_sbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(3);
                expect(fieldsData.result[0].field).to.eql("desc");
                expect(fieldsData.result[1].field).to.eql("duedate");
                expect(fieldsData.result[2].field).to.eql("issue");
                expect(fieldsData.result[2].mandatory).to.eql(false);
                expect(fieldsData.result[2].filterable).to.eql(true);
                expect(fieldsData.result[2].sortable).to.eql(undefined);
                return daffodil_sbDb.update({$collection: "pl.fields", $insert: {collectionid: {$query: {collection: "issues"}}, field: "issued_by", label: "Issued By", type: "string"}})
            }).then(
            function () {
                writeLog("11......");
                return ApplaneDB.connect(Config.URL, "daffodil_hsr", {username: "daffodil_hsr", "password": "daffodil_hsr"})
            }).then(
            function (dbName) {
                writeLog("12.....");
                daffodil_hsrDb = dbName;
                return daffodil_hsrDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues", field: {"$in": ["date", "issue"]}}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("13......");
                return daffodil_hsrDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldsData.result[0]._id, $set: {filterable: false}}
                ]
                })
            }).then(
            function () {
                writeLog("14......");
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
            }).then(
            function (dbName) {
                writeLog("11......");
                afb_SbDb = dbName;
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues", field: {"$in": ["date", "issue", "desc"]}}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("15......");
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "bug", label: "Bug", type: "string", collectionid: {$query: {collection: "issues"}}}
                ], $update: [
                    {_id: fieldsData.result[2]._id, $set: {sortable: true}}
                ], $delete: {_id: fieldsData.result[1]._id}
                })
            }).then(
            function () {
                writeLog("16......");
                return afb_SbDb.update({$collection: "pl.fields",
                    $insert: [
                        {field: "duedate1", label: "Due Date", type: "date", collectionid: {$query: {collection: "issues"}}}
                    ]
                });
            }).then(
            function () {
                writeLog("17......");
                return afb_SbDb.update({$collection: "pl.fields",
                    $insert: [
                        {field: "duedate", label: "Due Date", type: "date", collectionid: {$query: {collection: "issues"}}}
                    ]
                });
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
            }).then(
            function (dbName) {
                writeLog("11......");
                afb_SbDb = dbName;
            }).then(
            function () {
                writeLog("18......");
                return afb_SbDb.update({$collection: "pl.menus", $insert: [
                    {label: "test1", collection: "test1", application: {$query: {label: "Test"}}}
                ]})
            }).then(
            function () {
                writeLog("19......");
                return afb_SbDb.update({$collection: "pl.processes", $insert: {processed: 1}})
            }).then(
            function (update) {
                writeLog("20......");
                processid = update["pl.processes"].$insert[0]._id;
            }).then(
            function () {
                writeLog("21......");
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", password: "afb"})
            }).then(
            function (dbName) {
                afbDb = dbName;
                writeLog("22......");
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", password: "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return afb_SbDb.getAdminDB();
            }).then(
            function (dbName) {
                writeLog("23......");
                adminDb = dbName;
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: daffodilDb.db.databaseName}, $group: {_id: null, count: {"$sum": 1}}});
            }).then(
            function (changeLogData) {
                changeLogLengthDaffodil = changeLogData.result[0].count;
            }).then(
            function () {
                writeLog("24......");
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: afbDb.db.databaseName}, $group: {_id: null, count: {"$sum": 1}}});
            }).then(
            function (changeLogData) {
                changeLogLengthAfb = changeLogData.result[0].count;
                writeLog("25......");
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb, {processid: processid}).fail(
                    function (err) {
                        if (err.toString().indexOf("Error") === -1) {
                            throw err;
                        }
                    })
            }).then(
            function () {
                writeLog("26......");
                return afb_SbDb.query({$collection: "pl.processes", $filter: {_id: processid}})
            }).then(
            function (data) {
                expect(data.result[0].detail).to.have.length(5);
                expect(data.result[0].detail[1].status).to.eql("Error in Synch")
                expect(data.result[0].detail[1].message.indexOf("Db : daffodil,")).to.not.eql(-1);
                expect(data.result[0].detail[2].status).to.eql("Success in Synch")
                expect(data.result[0].detail[2].message.indexOf("Db : darcl_sb,")).to.not.eql(-1);
                expect(data.result[0].detail[3].status).to.eql("Success in Synch")
                expect(data.result[0].detail[3].message.indexOf("Db : darcl,")).to.not.eql(-1);
                writeLog("27......");
            }).then(
            function () {
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: daffodilDb.db.databaseName}, $group: {_id: null, count: {"$sum": 1}}});
            }).then(
            function (changeLogData) {
                expect(changeLogData.result[0].count).to.eql(changeLogLengthDaffodil);
            }).then(
            function () {
                writeLog("28......");
                var query = {$collection: "pl.changelogs", $filter: {db: afbDb.db.databaseName}, $group: {_id: null, count: {"$sum": 1}}};
                return adminDb.query(query);
            }).then(
            function (changeLogData) {
                expect(changeLogData.result[0].count).to.above(changeLogLengthAfb);
            }).then(
            function () {
                writeLog("29......");
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", password: "afb"})
            }).then(
            function (dbName) {
                writeLog("30......");
                afbDb = dbName;
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {field: 1}})

            }).then(
            function (fieldsData) {
                writeLog("31......");
                expect(fieldsData.result).to.have.length(5);
                expect(fieldsData.result[0].field).to.eql("bug");
                expect(fieldsData.result[1].field).to.eql("date");
                expect(fieldsData.result[2].field).to.eql("duedate");
                expect(fieldsData.result[3].field).to.eql("duedate1");
                expect(fieldsData.result[4].field).to.eql("issue");
                expect(fieldsData.result[4].mandatory).to.eql(true);
                expect(fieldsData.result[4].filterable).to.eql(true);
                expect(fieldsData.result[4].sortable).to.eql(true);

                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                writeLog("32......");
                daffodilDb = dbName;
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("33......");
                expect(fieldsData.result).to.have.length(3);
                expect(fieldsData.result[0].field).to.eql("desc");
                expect(fieldsData.result[1].field).to.eql("duedate");
                expect(fieldsData.result[2].field).to.eql("issue");
                expect(fieldsData.result[2].mandatory).to.eql(false);
                expect(fieldsData.result[2].filterable).to.eql(true);
                expect(fieldsData.result[2].sortable).to.eql(undefined);
                return daffodil_sbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                console.log("expecting daffodil_sb........" + JSON.stringify(fieldsData));
                expect(fieldsData.result).to.have.length(4);
                expect(fieldsData.result[0].field).to.eql("desc");
                expect(fieldsData.result[1].field).to.eql("duedate");
                expect(fieldsData.result[2].field).to.eql("issue");
                expect(fieldsData.result[2].mandatory).to.eql(false);
                expect(fieldsData.result[2].filterable).to.eql(true);
                expect(fieldsData.result[2].sortable).to.eql(undefined);
                expect(fieldsData.result[3].field).to.eql("issued_by");
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_hsr", {username: "daffodil_hsr", "password": "daffodil_hsr"})
            }).then(
            function (dbName) {
                writeLog("34......");
                daffodil_hsrDb = dbName;
                return daffodil_hsrDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("35......");
                expect(fieldsData.result).to.have.length(5);
                expect(fieldsData.result[0].field).to.eql("date");
                expect(fieldsData.result[0].filterable).to.eql(false);
                expect(fieldsData.result[1].field).to.eql("deliverydate");
                expect(fieldsData.result[2].field).to.eql("desc");
                expect(fieldsData.result[3].field).to.eql("duedate");
                expect(fieldsData.result[4].field).to.eql("issue");
                expect(fieldsData.result[4].mandatory).to.eql(true);
                expect(fieldsData.result[4].filterable).to.eql(true);
            }).then(
            function () {
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: daffodil_hsrDb.db.databaseName}, $group: {_id: null, count: {"$sum": 1}}});
            }).then(
            function (changeLogData) {
                changeLogLengthDaffodilHsr = changeLogData.result[0].count;
            }).then(
            function () {
                writeLog("manual sync........")
                return Synch.synchProcess({data: {synch: true}}, daffodil_hsrDb);
            }).fail(
            function (err) {
                if (err.code !== 11000) {
                    throw err;
                }
            }).then(
            function () {
                writeLog("36......");
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: daffodil_hsrDb.db.databaseName}, $group: {_id: null, count: {"$sum": 1}}});
            }).then(
            function (changeLogData) {
                expect(changeLogData.result[0].count).to.eql(changeLogLengthDaffodilHsr);
            }).then(
            function () {
                writeLog("37......");
                return daffodil_hsrDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(5);
                expect(fieldsData.result[0].field).to.eql("date");
                expect(fieldsData.result[0].filterable).to.eql(false);
                expect(fieldsData.result[1].field).to.eql("deliverydate");
                expect(fieldsData.result[2].field).to.eql("desc");
                expect(fieldsData.result[3].field).to.eql("duedate");
                expect(fieldsData.result[4].field).to.eql("issue");
                expect(fieldsData.result[4].mandatory).to.eql(true);
                expect(fieldsData.result[4].filterable).to.eql(true);
            }).then(
            function () {
                writeLog("38......");
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                writeLog("39......");
                return afb_SbDb.update({$collection: "pl.fields",
                    $insert: [
                        {field: "name", label: "Name", type: "string", collectionid: {$query: {collection: "employees"}}},
                        {field: "age", label: "Age", type: "number", collectionid: {$query: {collection: "employees"}}},
                        {field: "salary", label: "Salary", type: "string", collectionid: {$query: {collection: "employees"}}}
                    ]
                });
            }).then(
            function () {
                writeLog("40......");
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", password: "afb"})
            }).then(
            function (dbName) {
                writeLog("41............")
                afbDb = dbName;
            }).then(
            function () {
                return afbDb.update({$collection: "pl.fields", $insert: [
                    {field: "salary", label: "Salary", type: "string", collectionid: {$query: {collection: "employees"}}}
                ]})
            }).then(
            function () {
                writeLog("42............")
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("43............")
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].field).to.eql("salary");
            }).then(
            function () {
                writeLog("44............")
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"});
            }).then(
            function (dbName) {
                writeLog("45............")
                afb_SbDb = dbName;
            }).then(
            function () {
                var query = {$collection: "pl.changelogs", $filter: {db: afbDb.db.databaseName}, $group: {_id: null, count: {"$sum": 1}}};
                return adminDb.query(query);
            }).then(
            function (data) {
                writeLog("46......");
                changeLogLengthAfb = data.result[0].count;
            }).then(
            function () {
                writeLog("47......");
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).fail(
            function (err) {
                if (err.code !== 11000) {
                    throw err;
                }
            }).then(
            function () {
                writeLog("48......");
                var query = {$collection: "pl.changelogs", $filter: {db: afbDb.db.databaseName}, $group: {_id: null, count: {"$sum": 1}}};
                return adminDb.query(query);
            }).then(
            function (data) {
                expect(data.result[0].count).to.eql(changeLogLengthAfb);
            }).then(
            function () {
                writeLog("49......");
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", password: "afb"})
            }).then(
            function (dbName) {
                afbDb = dbName;
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("50......");
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].field).to.eql("salary");
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(3);
                expect(fieldsData.result[0].field).to.eql("age");
                expect(fieldsData.result[1].field).to.eql("name");
                expect(fieldsData.result[2].field).to.eql("salary");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });
    })

    it('commit rollback test case', function (done) {
        var afb_SbDb = undefined;
        var afbDb = undefined;
        var applicationId = undefined;
        var daffodil_sbDb = undefined;
        var daffodilDb = undefined;
        var changeLogLength = undefined;
        var adminDb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.collections", $insert: [
                    {collection: "employees"}
                ]})
            }).then(
            function () {
                writeLog("1....");
                return afb_SbDb.update({$collection: "pl.applications", $insert: {label: "Task Management"}})
            }).then(
            function () {
                writeLog("2....");
                return afb_SbDb.update({$collection: "pl.menus", $insert: [
                    {label: "Tasks", application: {$query: {label: "Task Management"}}, collection: "tasks"},
                    {label: "Goals", application: {$query: {label: "Task Management"}}, collection: "goals"}
                ]});
            }).then(
            function () {
                writeLog("3....");
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "name", label: "Name", collectionid: {$query: {collection: "employees"}}, type: "string"},
                    {field: "age", label: "Age", collectionid: {$query: {collection: "employees"}}, type: "string"}
                ]})
            }).then(
            function () {
                writeLog("4....");
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                writeLog("5....");
                return afb_SbDb.update({$collection: "pl.applications", $insert: {label: "Accounts"}})
            }).then(
            function () {
                writeLog("6....");
                return afb_SbDb.query({$collection: "pl.applications", $filter: {label: "Task Management"}})
            }).then(
            function (applicationData) {
                writeLog("7....");
                applicationId = applicationData.result[0]._id;
                return afb_SbDb.update({$collection: "pl.applications", $update: {_id: applicationId, $set: {label: "Productivity"}}})
            }).then(
            function () {
                writeLog("8....");
                return afb_SbDb.update({$collection: "pl.menus", $insert: [
                    {label: "Accounts", application: {$query: {label: "Accounts"}}, collection: "accounts"},
                    {label: "Result", application: {$query: {label: "Productivity"}}, collection: "result"}
                ]});
            }).then(
            function () {
                writeLog("9....");
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId, label: {"$in": ["Tasks", "Goals"]}}, $sort: {label: 1}})
            }).then(
            function (menudata) {
                writeLog("10....");
                return afb_SbDb.update({$collection: "pl.menus", $update: [
                    {_id: menudata.result[1]._id, $set: {label: "New Tasks"}}
                ], $delete: {_id: menudata.result[0]._id}})
            }).then(
            function () {
                writeLog("11....");
                return afb_SbDb.update({$collection: "pl.collections", $insert: [
                    {collection: "issues"}
                ]})
            }).then(
            function () {
                writeLog("12....");
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "issue", label: "Issue", collectionid: {$query: {collection: "issues"}}, type: "string"},
                    {field: "desc", label: "Desc", collectionid: {$query: {collection: "issues"}}, type: "string"}
                ]});
            }).then(
            function () {
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees", field: {"$in": ["name", "age"]}}, $sort: {field: 1}})

            }).then(
            function (fieldsData) {
                writeLog("13....");
                return afb_SbDb.update({$collection: "pl.fields",
                    $delete: {_id: fieldsData.result[1]._id},
                    $update: {_id: fieldsData.result[0]._id, $set: {mandatory: true}}})
            }).then(
            function () {
                writeLog("14....");
                return afb_SbDb.update({$collection: "pl.fields", $insert: {field: "salary", type: "string", label: "Salary", collectionid: {$query: {collection: "employees"}}}})
            }).then(
            function () {
                writeLog("15....");
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", password: "afb"})

            }).then(
            function (dbName) {
                writeLog("16....");
                afbDb = dbName;
                return afbDb.update({$collection: "pl.fields", $insert: {field: "salary", type: "string", label: "Salary", collectionid: {$query: {collection: "employees"}}}})
            }).then(
            function () {
                writeLog("17....");
                return afb_SbDb.getAdminDB();
            }).then(
            function (dbName) {
                writeLog("18....");
                adminDb = dbName;
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: afbDb.db.databaseName}, $group: {_id: null, count: {"$sum": 1}}});
            }).then(
            function (changeLogData) {
                writeLog("19....");
                changeLogLength = changeLogData.result[0].count;
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", password: "afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).fail(
            function (err) {
                writeLog("20....");
                if (err.code !== 11000) {
                    throw err;
                }
            }).then(
            function () {
                writeLog("21....");
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: afbDb.db.databaseName}, $group: {_id: null, count: {"$sum": 1}}});
            }).then(
            function (changeLogData) {
                writeLog("22....");
                expect(changeLogData.result[0].count).to.eql(changeLogLength);
            }).then(
            function () {
                writeLog("23....");
                return ApplaneDB.connect(Config.URL, "afb", {username: "afb", password: "afb"})
            }).then(
            function (dbName) {
                writeLog("24....");
                afbDb = dbName;
                return afbDb.query({$collection: "pl.applications"})
            }).then(
            function (applicationData) {
                writeLog("25....");
                expect(applicationData.result).to.have.length(1);
                expect(applicationData.result[0].label).to.eql("Task Management");
                return afbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                writeLog("26....");
                expect(menuData.result).to.have.length(2);
                expect(menuData.result[0].label).to.eql("Goals");
                expect(menuData.result[1].label).to.eql("Tasks");
                return afbDb.query({$collection: "pl.collections", $sort: {collection: 1}, $filter: {collection: {"$in": ["accounts", "result", "issues", "employees", "goals", "tasks"]}}})
            }).then(
            function (collectionData) {
                writeLog("27....");
                expect(collectionData.result).to.have.length(3);
                expect(collectionData.result[0].collection).to.eql("employees");
                expect(collectionData.result[1].collection).to.eql("goals");
                expect(collectionData.result[2].collection).to.eql("tasks");
                return afbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("28....");
                expect(fieldsData.result).to.have.length(3);
                expect(fieldsData.result[0].label).to.eql("Age");
                expect(fieldsData.result[0].mandatory).to.eql(undefined);
                expect(fieldsData.result[1].label).to.eql("Name");
                expect(fieldsData.result[2].label).to.eql("Salary");
                //expecting that afb_sb is not empty after commiting in case of rollback
            }).then(
            function () {
                writeLog("29....");
                return afb_SbDb.query({$collection: "pl.applications", $sort: {label: 1}})
            }).then(
            function (applicationData) {
                writeLog("30...." + JSON.stringify(applicationData));
                expect(applicationData.result).to.have.length(2);
                expect(applicationData.result[0].label).to.eql("Accounts");
                expect(applicationData.result[1].label).to.eql("Productivity");
                return afb_SbDb.query({$collection: "pl.menus", $filter: {"application._id": applicationId}, $sort: {label: 1}})
            }).then(
            function (menuData) {
                writeLog("31....");
                expect(menuData.result).to.have.length(2);
                expect(menuData.result[0].label).to.eql("New Tasks");
                expect(menuData.result[1].label).to.eql("Result");
                return afb_SbDb.query({$collection: "pl.collections", $sort: {collection: 1}, $filter: {collection: {"$in": ["accounts", "result", "issues", "employees", "goals", "tasks"]}}})
            }).then(
            function (collectionData) {
                writeLog("32....");
                expect(collectionData.result).to.have.length(6);
                expect(collectionData.result[0].collection).to.eql("accounts");
                expect(collectionData.result[1].collection).to.eql("employees");
                expect(collectionData.result[2].collection).to.eql("goals");
                expect(collectionData.result[3].collection).to.eql("issues");
                expect(collectionData.result[4].collection).to.eql("result");
                expect(collectionData.result[5].collection).to.eql("tasks");
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("33....");
                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].label).to.eql("Age");
                expect(fieldsData.result[0].mandatory).to.eql(true);
                expect(fieldsData.result[1].label).to.eql("Salary");
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                writeLog("34....");
                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].field).to.eql("desc");
                expect(fieldsData.result[1].field).to.eql("issue");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });
    })

    it('field insert error test case', function (done) {
        var afb_SbDb = undefined;
        var adminDb = undefined;
        var changeLogLength = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.collections", $insert: {collection: "employees"}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "name", type: "string", label: "Name", collectionid: {$query: {collection: "employees"}}}
                ]})
            }).then(
            function () {
                return afb_SbDb.getAdminDB();
            }).then(
            function (db) {
                adminDb = db;
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: afb_SbDb.db.databaseName}, $group: {_id: null, count: {"$sum": 1}}});
            }).then(
            function (changeLogData) {
                changeLogLength = changeLogData.result[0].count;
            }).then(
            function () {
                return afb_SbDb.startTransaction();
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "rollno", type: "string", label: "Age", collectionid: {$query: {collection: "employees"}}},
                    {field: "age", type: "string", label: "Age", collectionid: {$query: {collection: "employees"}}},
                    {field: "age", type: "string", label: "Age", collectionid: {$query: {collection: "employees"}}}
                ]})
            }).then(
            function () {
                return afb_SbDb.commitTransaction();
            }).fail(
            function (err) {
                return afb_SbDb.rollbackTransaction().then(function () {
                    if (err.code !== 11000) {
                        throw err;
                    }
                })
            }).then(
            function () {
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: afb_SbDb.db.databaseName}, $group: {_id: null, count: {"$sum": 1}}});
            }).then(
            function (changeLogData) {
                expect(changeLogData.result[0].count).to.eql(changeLogLength);
                return afb_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].field).to.eql("name");
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    })
})

describe('locking error cases', function () {

    beforeEach(function (done) {
        Testcases.beforeEach().then(
            function () {
                return ApplaneDB.getAdminDB();
            }).then(
            function (adminDB) {
                var adminDb = adminDB;
                var insertDbs = {$collection: "pl.dbs", $insert: [
                    {"db": "afb", "sandboxDb": "afb_sb", "globalDb": "", "ensureDefaultCollections": true, "guestUserName": "afb", "globalUserName": "afb", "globalPassword": "afb", "globalUserAdmin": true, autoSynch: false},
                    {"db": "daffodil", "sandboxDb": "daffodil_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "daffodil", "globalUserName": "daffodil", "globalPassword": "daffodil", "globalUserAdmin": true, autoSynch: false},
                    {"db": "darcl", "sandboxDb": "darcl_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "darcl", "globalUserName": "darcl", "globalPassword": "darcl", "globalUserAdmin": true, autoSynch: false, is_sandbox: false}
                ]};
                return adminDb.update(insertDbs);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });
    })

    afterEach(function (done) {

        var dbs = {};
        return dropDatabase2(dbs)
            .then(
            function () {
                var keys = Object.keys(dbs);
                return Utils.iterateArrayWithPromise(keys, function (index, dbName) {
                    var db = dbs[dbName]
                    return db.dropDatabase();
                })
            }).then(
            function () {
                return Testcases.afterEach();
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })


    it('error while inserting', function (done) {
        var afb_SbDb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.collections", $insert: {collection: "employees"}})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "rollno", type: "string", label: "Roll No", collectionid: {$query: {collection: "employees"}}},
                    {field: "age", type: "string", label: "Age", collectionid: {$query: {collection: "employees"}}},
                    {field: "salary", type: "string", label: "Salary", collectionid: {$query: {collection: "employees"}}},
                    {field: "name", type: "string", label: "Name", collectionid: {$query: {collection: "employees"}}}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "subject", type: "string", label: "subject", collectionid: {$query: {collection: "employees"}}},
                    {field: "class", type: "string", label: "Class", collectionid: {$query: {collection: "employees"}}},
                    {field: "city", type: "string", label: "city", collectionid: {$query: {collection: "employees"}}},
                    {field: "State", type: "string", label: "State", collectionid: {$query: {collection: "employees"}}}
                ]})
            }).then(
            function () {

            }).then(
            function () {
                done();
            }).catch(
            function (err) {
                return require("q").delay(1000).then(function () {
                    throw err;
                })

            }).fail(function (err) {
                done(err);
            })
    })

    it('error while commiting', function (done) {
        var afb_SbDb = undefined;
        var daffodil_SbDb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.collections", $insert: {collection: "employees"}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "rollno", type: "string", label: "Roll No", collectionid: {$query: {collection: "employees"}}},
                    {field: "age", type: "string", label: "Age", collectionid: {$query: {collection: "employees"}}}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "subject", type: "string", label: "subject", collectionid: {$query: {collection: "employees"}}},
                    {field: "class", type: "string", label: "Class", collectionid: {$query: {collection: "employees"}}},
                    {field: "city", type: "string", label: "city", collectionid: {$query: {collection: "employees"}}},
                    {field: "State", type: "string", label: "State", collectionid: {$query: {collection: "employees"}}},
                    {field: "salary1", type: "string", label: "Salary", collectionid: {$query: {collection: "employees"}}},
                    {field: "name1", type: "string", label: "Name", collectionid: {$query: {collection: "employees"}}},
                    {field: "salary2", type: "string", label: "Salary", collectionid: {$query: {collection: "employees"}}},
                    {field: "name21", type: "string", label: "Name", collectionid: {$query: {collection: "employees"}}}
                ]})

            }).then(
            function () {
                console.log("Commit Start+++++++++++++++++++++++++++++++++++++++++++++");
                Commit.commitProcess({data: {commit: true}}, afb_SbDb);
                return require("q").delay(100);
            }).then(
            function () {
                return daffodil_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "salary", type: "string", label: "Salary", collectionid: {$query: {collection: "employees"}}},
                    {field: "name", type: "string", label: "Name", collectionid: {$query: {collection: "employees"}}}
                ]})
            }).then(
            function () {
                done();
            }).catch(
            function (err) {
                return require("q").delay(1000).then(function () {
                    throw err;
                })
            }).fail(function (err) {
                done(err);
            })
    })

    it('error while synching', function (done) {
        var afb_SbDb = undefined;
        var daffodil_SbDb = undefined;
        var darcl_SbDb = undefined;
        var daffodilDb = undefined;

        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.collections", $insert: {collection: "employees"}})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "rollno", type: "string", label: "Roll No", collectionid: {$query: {collection: "employees"}}},
                    {field: "age", type: "string", label: "Age", collectionid: {$query: {collection: "employees"}}},
                    {field: "rollno45456", type: "string", label: "Roll No", collectionid: {$query: {collection: "employees"}}},
                    {field: "age78", type: "string", label: "Age", collectionid: {$query: {collection: "employees"}}}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "darcl_sb", {username: "darcl", "password": "darcl"})
            }).then(
            function (dbName) {
                darcl_SbDb = dbName;
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
            }).then(
            function () {
                return daffodil_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "salary", type: "string", label: "Salary", collectionid: {$query: {collection: "employees"}}}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodilDb = dbName;
                return afb_SbDb.query({$collection: "pl.fields", $sort: {field: 1}, $filter: {"collectionid.collection": "employees"}, $fields: {_id: 1}})
            }).then(
            function (fieldsData) {
                return afb_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldsData.result[0]._id, $set: {mandatory: true}}
                ], $delete: {_id: fieldsData.result[1]._id}, $insert: [
                    {field: "subject", type: "string", label: "subject", collectionid: {$query: {collection: "employees"}}}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                Synch.synchProcess({data: {synch: true}}, daffodilDb);
                return require("q").delay(100);
            }).then(
            function () {
                return darcl_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "salary788787", type: "string", label: "Salary", collectionid: {$query: {collection: "employees"}}}
                ]})
            }).then(
            function () {
                done();
            }).catch(
            function (err) {
                return require("q").delay(1000).then(function () {
                    throw err;
                })
            }).fail(function (err) {
                done(err);
            })
    });

    function dropDatabase2(dbs) {
        return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
            .then(
            function (afbDb) {
                dbs.afbDb = afbDb;
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (afb_sbDb) {
                dbs.afb_sbDb = afb_sbDb;
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (daffodilDb) {
                dbs.daffodilDb = daffodilDb;
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (daffodil_sbDb) {
                dbs.daffodil_sbDb = daffodil_sbDb;
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "darcl", {username: "darcl", "password": "darcl"})
            }).then(
            function (darclDb) {
                dbs.darclDb = darclDb;
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "darcl_sb", {username: "darcl", "password": "darcl"})
            }).then(
            function (darcl_sbDb) {
                dbs.darcl_sbDb = darcl_sbDb;
            })
    }

})

function dropDatabase(dbs) {
    return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
        .then(
        function (afbDb) {
            dbs.afbDb = afbDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
        }).then(
        function (afb_sbDb) {
            dbs.afb_sbDb = afb_sbDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
        }).then(
        function (daffodilDb) {
            dbs.daffodilDb = daffodilDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
        }).then(
        function (daffodil_sbDb) {
            dbs.daffodil_sbDb = daffodil_sbDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "daffodil_hsr", {username: "daffodil_hsr", "password": "daffodil_hsr"})
        }).then(
        function (daffodil_hsrDb) {
            dbs.daffodil_hsrDb = daffodil_hsrDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "daffodil_hsr_applane", {username: "daffodil_hsr_applane", "password": "daffodil_hsr_applane"})
        }).then(
        function (daffodil_hsr_applaneDb) {
            dbs.daffodil_hsr_applaneDb = daffodil_hsr_applaneDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "darcl", {username: "darcl", "password": "darcl"})
        }).then(
        function (darclDb) {
            dbs.darclDb = darclDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "darcl_sb", {username: "darcl", "password": "darcl"})
        }).then(
        function (darcl_sbDb) {
            dbs.darcl_sbDb = darcl_sbDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "girnarsoft", {username: "girnarsoft", "password": "girnarsoft"})
        }).then(
        function (girnarsoftDb) {
            dbs.girnarsoftDb = girnarsoftDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "girnarsoft_sb", {username: "girnarsoft", "password": "girnarsoft"})
        }).then(
        function (girnarsoft_sbDb) {
            dbs.girnarsoft_sbDb = girnarsoft_sbDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "daffodil_ggn", {username: "daffodil_ggn", "password": "daffodil_ggn"})
        }).then(
        function (daffodil_ggnDb) {
            dbs.daffodil_ggnDb = daffodil_ggnDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "daffodil_hsr_other", {username: "daffodil_hsr_other", "password": "daffodil_hsr_other"})
        }).then(function (daffodil_hsr_otherDb) {
            dbs.daffodil_hsr_otherDb = daffodil_hsr_otherDb;
        })
}


describe("Remove change log of a whole db", function () {

    beforeEach(function (done) {
        Testcases.beforeEach().then(
            function () {
                return ApplaneDB.getAdminDB();
            }).then(
            function (adminDB) {
                var adminDb = adminDB;
                var insertDbs = {$collection: "pl.dbs", $insert: [
                    {"db": "afb", "sandboxDb": "afb_sb", "globalDb": "", "ensureDefaultCollections": true, "guestUserName": "afb", "globalUserName": "afb", "globalPassword": "afb", "globalUserAdmin": true, autoSynch: false},
                    {"db": "daffodil", "sandboxDb": "daffodil_sb", "globalDb": "afb", "ensureDefaultCollections": false, "guestUserName": "daffodil", "globalUserName": "daffodil", "globalPassword": "daffodil", "globalUserAdmin": true, autoSynch: false}
                ]};
                return adminDb.update(insertDbs);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });
    })

    afterEach(function (done) {

        var dbs = {};
        dropDatabase1(dbs)
            .then(
            function () {
                var keys = Object.keys(dbs);
                return Utils.iterateArrayWithPromise(keys, function (index, dbName) {
                    var db = dbs[dbName]
                    return db.dropDatabase();
                })
            }).then(
            function () {
                return Testcases.afterEach();
            }).then(
            function () {
                done();
            }).fail(function (e) {
                done(e);
            })
    })


    it('remove Change log of a single collection new with action', function (done) {
        var afb_SbDb = undefined;
        var afbDb = undefined;
        var daffodil_SbDb = undefined;
        var daffodilDb = undefined;
        var productivityId = undefined;
        var accountId = undefined;
        var adminDb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.applications", $insert: [
                    {label: "Productivity"},
                    {label: "Accounts"}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.menus", $insert: [
                    {label: "Accounts", application: {$query: {label: "Accounts"}}, collection: "accounts"},
                    {label: "Goals", application: {$query: {label: "Productivity"}}, collection: "goals"}
                ]});
            }).then(
            function () {
                return  afb_SbDb.update({$collection: "pl.collections", $insert: [
                    {collection: "employees"},
                    {collection: "issues"}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "name", collectionid: {$query: {collection: "employees"}}, label: "Name", type: "string"},
                    {field: "issue", collectionid: {$query: {collection: "issues"}}, label: "Issue", type: "string"}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.actions", $insert: [
                    {type: "invoke", id: "addIssue", label: "Add Issue", collectionid: {$query: {collection: "issues"}}},
                    {type: "invoke", id: "accounts", label: "Change Account", collectionid: {$query: {collection: "accounts"}}}
                ] });
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return expectInitialData(daffodil_SbDb);
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.applications", $sort: {label: 1}})
            }).then(
            function (applicationData) {
                accountId = applicationData.result[0]._id;
                productivityId = applicationData.result[1]._id;
                return daffodil_SbDb.update({$collection: "pl.applications", $update: [
                    {_id: productivityId, $set: {label: "Task Management"}},
                    {_id: accountId, $set: {label: "Account Management"}}
                ]})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": productivityId}, $fields: {_id: 1}})
            }).then(
            function (menuData) {
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {label: "Targets"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": accountId}, $fields: {_id: 1}})
            }).then(
            function (menuData) {
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {label: "New Accounts"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees", field: "name"}, $fields: {_id: 1}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {label: "EName"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues", field: "issue"}, $fields: {_id: 1}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {label: "Bug"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues", label: "Add Issue"}, $fields: {_id: 1}})
            }).then(
            function (actionData) {
                return daffodil_SbDb.update({$collection: "pl.actions", $update: {_id: actionData.result[0]._id, $set: {label: "Report Issue"}}});
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "accounts", label: "Change Account"}, $fields: {_id: 1}})
            }).then(
            function (actionData) {
                return daffodil_SbDb.update({$collection: "pl.actions", $update: {_id: actionData.result[0]._id, $set: {label: "Do Not Change Account"}}});
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.qviews", $sort: {label: 1}})
            }).then(
            function (qviewData) {
                return daffodil_SbDb.update({$collection: "pl.qviews", $update: [
                    {_id: qviewData.result[0]._id, $set: {label: "Account Management"}},
                    {_id: qviewData.result[1]._id, $set: {label: "Backlog"}}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (daffodildb) {
                daffodilDb = daffodildb;
                return daffodilDb.query({$collection: 'pl.applications', $sort: {label: 1}});
            }).then(
            function (applicationData) {
                productivityId = applicationData.result[1]._id;
                accountId = applicationData.result[0]._id;
                expect(applicationData.result[0].label).to.eql("Account Management");
                expect(applicationData.result[1].label).to.eql("Task Management");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": productivityId}});
            }).then(
            function (menuData) {
                expect(menuData.result[0].label).to.eql("Targets");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": accountId}});
            }).then(
            function (menuData) {
                expect(menuData.result[0].label).to.eql("New Accounts");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].label).to.eql("Bug");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $sort: {label: 1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].label).to.eql("EName");

            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}})
            }).then(
            function (actionsData) {
                expect(actionsData.result[0].label).to.eql("Report Issue");
                return daffodilDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "accounts"}, $sort: {label: 1}});
            }).then(
            function (actionsData) {
                expect(actionsData.result[0].label).to.eql("Do Not Change Account");
                return daffodilDb.query({$collection: "pl.qviews", $sort: {label: 1}})
            }).then(
            function (qviewData) {
                expect(qviewData.result).to.have.length(2);
                expect(qviewData.result[0].label).to.eql("Account Management")
                expect(qviewData.result[1].label).to.eql("Backlog")
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.applications", $sort: {label: 1}})
            }).then(
            function (applicationData) {
                accountId = applicationData.result[0]._id;
                productivityId = applicationData.result[1]._id;
                return daffodil_SbDb.update({$collection: "pl.applications", $update: [
                    {_id: productivityId, $set: {label: "New Task Management"}},
                    {_id: accountId, $set: {label: "New Account Management"}}
                ]})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": productivityId}, $fields: {_id: 1}})
            }).then(
            function (menuData) {
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {label: "New Targets"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": accountId}, $fields: {_id: 1}})
            }).then(
            function (menuData) {
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {label: "Daffodil New Accounts"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees", field: "name"}, $fields: {_id: 1}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {label: "Employee Name"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues", field: "issue"}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {label: "problem"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}, $fields: {_id: 1}})
            }).then(
            function (actionData) {
                return daffodil_SbDb.update({$collection: "pl.actions", $update: {_id: actionData.result[0]._id, $set: {label: "Report New Issue"}}});
            }).then(
            function () {
                return daffodil_SbDb.getAdminDB();
            }).then(
            function (adb) {
                adminDb = adb;
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: "daffodil", "mainFk.value": "issues", "fk.value": "issues", "mainCollection": "pl.collections", collection: "pl.collections"}})
            }).then(
            function (changelogData) {
                var id = changelogData.result[0]._id;
                return adminDb.invokeFunction("NewPorting.removeChangesFromActions", [
                    {_id: id, removeType: "Complete"}
                ]);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].label).to.eql("Issue");
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}});
            }).then(
            function (actionsData) {
                expect(actionsData.result[0].label).to.eql("Add Issue");
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].label).to.eql("Issue");
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}});
            }).then(
            function (actionsData) {
                expect(actionsData.result[0].label).to.eql("Add Issue");
//                console.log("1..........................")
            }).then(
            function () {
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: "daffodil", "mainFk.value": "Task Management", "fk.value": "Task Management", "mainCollection": "pl.applications", collection: "pl.applications"}})
            }).then(
            function (changelogData) {
                var id = changelogData.result[0]._id;
                return adminDb.invokeFunction("NewPorting.removeChangesFromActions", [
                    {_id: id, removeType: "Complete"}
                ]);
            }).then(
            function () {
                return daffodilDb.query({$collection: 'pl.applications', $sort: {label: 1}});
            }).then(
            function (applicationData) {
                productivityId = applicationData.result[1]._id;
                accountId = applicationData.result[0]._id;
                expect(applicationData.result[0].label).to.eql("Account Management");
                expect(applicationData.result[1].label).to.eql("Productivity");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": productivityId}});
            }).then(
            function (menuData) {
                expect(menuData.result[0].label).to.eql("Goals");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": accountId}});
            }).then(
            function (actionsData) {
                expect(actionsData.result[0].label).to.eql("New Accounts");
//                console.log("second expect.....")
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: 'pl.applications', $sort: {label: 1}});
            }).then(
            function (applicationData) {
                productivityId = applicationData.result[1]._id;
                accountId = applicationData.result[0]._id;
                expect(applicationData.result[0].label).to.eql("New Account Management");
                expect(applicationData.result[1].label).to.eql("Productivity");
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": productivityId}});
            }).then(
            function (menuData) {
                expect(menuData.result[0].label).to.eql("Goals");
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": accountId}});
            }).then(
            function (actionsData) {
                expect(actionsData.result[0].label).to.eql("Daffodil New Accounts");
//                console.log("2.....")
            }).then(
            function () {
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: "daffodil", "mainFk.value": "accounts", "fk.value": "accounts", status: "Committed", "mainCollection": "pl.qviews", collection: "pl.qviews"}})
            }).then(
            function (changelogData) {
                var id = changelogData.result[0]._id;
                return adminDb.invokeFunction("NewPorting.removeChangesFromActions", [
                    {_id: id, removeType: "Complete"}
                ]);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.qviews", $sort: {label: 1}})
            }).then(
            function (qviewData) {
                expect(qviewData.result).to.have.length(2);
                expect(qviewData.result[0].label).to.eql("Accounts");
                expect(qviewData.result[1].label).to.eql("Backlog");
            }).then(
            function () {
//                console.log("final....")
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('remove Change log of a single collection new', function (done) {
        var afb_SbDb = undefined;
        var afbDb = undefined;
        var daffodil_SbDb = undefined;
        var daffodilDb = undefined;
        var productivityId = undefined;
        var accountId = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection: "pl.applications", $insert: [
                    {label: "Productivity"},
                    {label: "Accounts"}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.menus", $insert: [
                    {label: "Accounts", application: {$query: {label: "Accounts"}}, collection: "accounts"},
                    {label: "Goals", application: {$query: {label: "Productivity"}}, collection: "goals"}
                ]});
            }).then(
            function () {
                return  afb_SbDb.update({$collection: "pl.collections", $insert: [
                    {collection: "employees"},
                    {collection: "issues"}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "name", collectionid: {$query: {collection: "employees"}}, label: "Name", type: "string"},
                    {field: "issue", collectionid: {$query: {collection: "issues"}}, label: "Issue", type: "string"}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.actions", $insert: [
                    {type: "invoke", id: "addIssue", label: "Add Issue", collectionid: {$query: {collection: "issues"}}},
                    {type: "invoke", id: "accounts", label: "Change Account", collectionid: {$query: {collection: "accounts"}}}
                ] });
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return expectInitialData(daffodil_SbDb);
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.applications", $sort: {label: 1}})
            }).then(
            function (applicationData) {
                accountId = applicationData.result[0]._id;
                productivityId = applicationData.result[1]._id;
                return daffodil_SbDb.update({$collection: "pl.applications", $update: [
                    {_id: productivityId, $set: {label: "Task Management"}},
                    {_id: accountId, $set: {label: "Account Management"}}
                ]})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": productivityId}, $fields: {_id: 1}})
            }).then(
            function (menuData) {
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {label: "Targets"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": accountId}, $fields: {_id: 1}})
            }).then(
            function (menuData) {
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {label: "New Accounts"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees", field: "name"}, $fields: {_id: 1}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {label: "EName"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues", field: "issue"}, $fields: {_id: 1}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {label: "Bug"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues", label: "Add Issue"}, $fields: {_id: 1}})
            }).then(
            function (actionData) {
                return daffodil_SbDb.update({$collection: "pl.actions", $update: {_id: actionData.result[0]._id, $set: {label: "Report Issue"}}});
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "accounts", label: "Change Account"}, $fields: {_id: 1}})
            }).then(
            function (actionData) {
                return daffodil_SbDb.update({$collection: "pl.actions", $update: {_id: actionData.result[0]._id, $set: {label: "Do Not Change Account"}}});
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.qviews", $sort: {label: 1}})
            }).then(
            function (qviewData) {
                return daffodil_SbDb.update({$collection: "pl.qviews", $update: [
                    {_id: qviewData.result[0]._id, $set: {label: "Account Management"}},
                    {_id: qviewData.result[1]._id, $set: {label: "Backlog"}}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (daffodildb) {
                daffodilDb = daffodildb;
                return daffodilDb.query({$collection: 'pl.applications', $sort: {label: 1}});
            }).then(
            function (applicationData) {
                productivityId = applicationData.result[1]._id;
                accountId = applicationData.result[0]._id;
                expect(applicationData.result[0].label).to.eql("Account Management");
                expect(applicationData.result[1].label).to.eql("Task Management");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": productivityId}});
            }).then(
            function (menuData) {
                expect(menuData.result[0].label).to.eql("Targets");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": accountId}});
            }).then(
            function (menuData) {
                expect(menuData.result[0].label).to.eql("New Accounts");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].label).to.eql("Bug");
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $sort: {label: 1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].label).to.eql("EName");

            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}})
            }).then(
            function (actionsData) {
                expect(actionsData.result[0].label).to.eql("Report Issue");
                return daffodilDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "accounts"}, $sort: {label: 1}});
            }).then(
            function (actionsData) {
                expect(actionsData.result[0].label).to.eql("Do Not Change Account");
                return daffodilDb.query({$collection: "pl.qviews", $sort: {label: 1}})
            }).then(
            function (qviewData) {
                expect(qviewData.result).to.have.length(2);
                expect(qviewData.result[0].label).to.eql("Account Management")
                expect(qviewData.result[1].label).to.eql("Backlog")
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.applications", $sort: {label: 1}})
            }).then(
            function (applicationData) {
                accountId = applicationData.result[0]._id;
                productivityId = applicationData.result[1]._id;
                return daffodil_SbDb.update({$collection: "pl.applications", $update: [
                    {_id: productivityId, $set: {label: "New Task Management"}},
                    {_id: accountId, $set: {label: "New Account Management"}}
                ]})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": productivityId}, $fields: {_id: 1}})
            }).then(
            function (menuData) {
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {label: "New Targets"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": accountId}, $fields: {_id: 1}})
            }).then(
            function (menuData) {
                return daffodil_SbDb.update({$collection: "pl.menus", $update: {_id: menuData.result[0]._id, $set: {label: "Daffodil New Accounts"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees", field: "name"}, $fields: {_id: 1}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {label: "Employee Name"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues", field: "issue"}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {label: "problem"}}})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}, $fields: {_id: 1}})
            }).then(
            function (actionData) {
                return daffodil_SbDb.update({$collection: "pl.actions", $update: {_id: actionData.result[0]._id, $set: {label: "Report New Issue"}}});
            }).then(
            function () {
//                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
//                console.log("1............................")
                return daffodilDb.invokeFunction("NewPorting.removeChangeLogs", [
                    {type: "collection", value: "issues", db: "daffodil", removeType: "Complete"}
                ]);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].label).to.eql("Issue");
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}});
            }).then(
            function (actionsData) {
                expect(actionsData.result[0].label).to.eql("Add Issue");
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].label).to.eql("Issue");
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}});
            }).then(
            function (actionsData) {
                expect(actionsData.result[0].label).to.eql("Add Issue");
            }).then(
            function () {
                //function for removing changelog of a single collection
                //here we r
                return daffodilDb.invokeFunction("NewPorting.removeChangeLogs", [
                    {type: "application", value: "Task Management", db: "daffodil", removeType: "Complete"}
                ]);
            }).then(
            function () {
                return daffodilDb.query({$collection: 'pl.applications', $sort: {label: 1}});
            }).then(
            function (applicationData) {
                productivityId = applicationData.result[1]._id;
                accountId = applicationData.result[0]._id;
                expect(applicationData.result[0].label).to.eql("Account Management");
                expect(applicationData.result[1].label).to.eql("Productivity");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": productivityId}});
            }).then(
            function (menuData) {
                expect(menuData.result[0].label).to.eql("Goals");
                return daffodilDb.query({$collection: "pl.menus", $filter: {"application._id": accountId}});
            }).then(
            function (actionsData) {
                expect(actionsData.result[0].label).to.eql("New Accounts");
//                console.log("second expect.....")
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: 'pl.applications', $sort: {label: 1}});
            }).then(
            function (applicationData) {
                productivityId = applicationData.result[1]._id;
                accountId = applicationData.result[0]._id;
                expect(applicationData.result[0].label).to.eql("New Account Management");
                expect(applicationData.result[1].label).to.eql("Productivity");
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": productivityId}});
            }).then(
            function (menuData) {
                expect(menuData.result[0].label).to.eql("Goals");
                return daffodil_SbDb.query({$collection: "pl.menus", $filter: {"application._id": accountId}});
            }).then(
            function (actionsData) {
                expect(actionsData.result[0].label).to.eql("Daffodil New Accounts");
//                console.log("third expect.....")
            }).then(
            function () {
                return daffodilDb.invokeFunction("NewPorting.removeChangeLogs", [
                    {type: "qview", value: "accounts", db: "daffodil", removeType: "Complete"}
                ]);
                //function to remove the change log of Account Management qview
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.qviews", $sort: {label: 1}})
            }).then(
            function (qviewData) {
                expect(qviewData.result).to.have.length(2);
                expect(qviewData.result[0].label).to.eql("Accounts");
                expect(qviewData.result[1].label).to.eql("Backlog");
            }).then(
            function () {
//                console.log("final....")
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('remove Change log of a single record', function (done) {
        var afb_SbDb = undefined;
        var afbDb = undefined;
        var daffodil_SbDb = undefined;
        var daffodilDb = undefined;
        var fieldId1 = undefined;
        var fieldId2 = undefined;
        var adminDb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return  afb_SbDb.update({$collection: "pl.collections", $insert: [
                    {collection: "issues"}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "issue", type: "string", collectionid: {$query: {collection: "issues"}}, filterable: true, mandatory: false, label: "Issue"},
                    {field: "createOn", type: "date", collectionid: {$query: {collection: "issues"}}, filterable: false, mandatory: false, label: "Created On"}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.actions", $insert: [
                    {type: "invoke", id: "addIssue", label: "Add Issue", visibility: true, collectionid: {$query: {collection: "issues"}}},
                    {type: "invoke", id: "removeissue", label: "Remove Issue", visibility: true, collectionid: {$query: {collection: "issues"}}}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return daffodil_SbDb.query({$collection: "pl.fields", $sort: {field: 1}, $filter: {"collectionid.collection": "issues"}})
            }).then(
            function (fieldsData) {
                fieldId1 = fieldsData.result[0]._id;
                fieldId2 = fieldsData.result[1]._id;
                return daffodil_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldId1, $set: {filterable: true, mandatory: true, label: "Issued On"}},
                    {_id: fieldId2, $set: {filterable: true, sortable: true, mandatory: true, label: "Bug"}}
                ]});
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}})
            }).then(
            function (actionData) {
                return daffodil_SbDb.update({$collection: "pl.actions", $update: [
                    {_id: actionData.result[0]._id, $set: {onRow: true, label: "Add New Issue"}},
                    {_id: actionData.result[1]._id, $set: {visibility: false}}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldId1, $set: {index: 1000, groupable: true, label: "Reported On"}, $unset: {filterable: "", mandatory: ""}},
                    {_id: fieldId2, $set: {sortable: false, label: "Problem"}, $unset: {filterable: "", mandatory: ""}}
                ]});
            }).then(
            function () {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldId1, $set: {index: 2000, label: "Date", filterable: true, mandatory: true}},
                    {_id: fieldId2, $set: {filterable: true, mandatory: true}, $unset: {sortable: ""}}
                ]});
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}})
            }).then(
            function (actionData) {
                return daffodil_SbDb.update({$collection: "pl.actions", $update: [
                    {_id: actionData.result[0]._id, $set: {visibility: false, label: "Add Daffodil Issue"}},
                    {_id: actionData.result[1]._id, $set: {onRow: true}}
                ]})
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $sort: {field: 1}, $filter: {"collectionid.collection": "issues"}});
            }).then(
            function (fieldsData) {

                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].label).to.eql("Date");
                expect(fieldsData.result[0].index).to.eql(2000);
                expect(fieldsData.result[0].mandatory).to.eql(true);
                expect(fieldsData.result[0].groupable).to.eql(true);
                expect(fieldsData.result[0].filterable).to.eql(true);

                expect(fieldsData.result[1].label).to.eql("Problem");
                expect(fieldsData.result[1].filterable).to.eql(true);
                expect(fieldsData.result[1].mandatory).to.eql(true);
//                console.log("1/........")
                return daffodil_SbDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}})
            }).then(
            function (actionData) {
                expect(actionData.result).to.have.length(2);
                expect(actionData.result[0].label).to.equal("Add Daffodil Issue")
                expect(actionData.result[0].visibility).to.equal(false)
                expect(actionData.result[0].onRow).to.equal(true)

                expect(actionData.result[1].label).to.equal("Remove Issue")
                expect(actionData.result[1].onRow).to.equal(true)
            }).then(
            function () {
                return daffodil_SbDb.getAdminDB();
            }).then(
            function (adb) {
                adminDb = adb;
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: "daffodil", "mainFk.value": "issues", "fk.value": "createOn", "mainCollection": "pl.collections", collection: "pl.fields"}})
            }).then(
            function (changelogData) {
                var id = changelogData.result[0]._id;
                return adminDb.invokeFunction("NewPorting.removeChangesFromActions", [
                    {_id: id, removeType: "Single"}
                ]);
            }).then(
            function () {
                //remove change log of a single record of fieldId1
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (db) {
                daffodilDb = db;
                return daffodilDb.query({$collection: "pl.fields", $sort: {field: 1}, $filter: {"collectionid.collection": "issues"}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].label).to.eql("Created On");
                expect(fieldsData.result[0].mandatory).to.eql(false);
                expect(fieldsData.result[0].filterable).to.eql(false);

                expect(fieldsData.result[1].mandatory).to.eql(true);
                expect(fieldsData.result[1].label).to.eql("Bug");
                expect(fieldsData.result[1].filterable).to.eql(true);
//                console.log("first ecpect")
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $sort: {field: 1}, $filter: {"collectionid.collection": "issues"}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].label).to.eql("Created On");
                expect(fieldsData.result[0].mandatory).to.eql(false);
                expect(fieldsData.result[0].filterable).to.eql(false);

                expect(fieldsData.result[1].mandatory).to.eql(true);
                expect(fieldsData.result[1].label).to.eql("Problem");
                expect(fieldsData.result[1].filterable).to.eql(true);
//                console.log("second ecpect")
            }).then(
            function () {
                //remove change log of action addIssue
            }).then(
            function (adb) {
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: "daffodil", "mainFk.value": "issues", "fk.value": "Add New Issue", "mainCollection": "pl.collections", collection: "pl.actions"}})
            }).then(
            function (changelogData) {
                var id = changelogData.result[0]._id;
                return adminDb.invokeFunction("NewPorting.removeChangesFromActions", [
                    {_id: id, removeType: "Single"}
                ]);
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}})
            }).then(
            function (actionData) {

                expect(actionData.result).to.have.length(2);
                expect(actionData.result[0].label).to.equal("Add Issue")
                expect(actionData.result[0].visibility).to.equal(true)
//                expect(actionData.result[0].onRow).to.equal(true)

                expect(actionData.result[1].label).to.equal("Remove Issue")
                expect(actionData.result[1].visibility).to.equal(false)
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('error case new', function (done) {
        var afb_SbDb = undefined;
        var afbDb = undefined;
        var daffodil_SbDb = undefined;
        var daffodilDb = undefined;
        var fieldId1 = undefined;
        var fieldId2 = undefined;
        var adminDb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return  afb_SbDb.update({$collection: "pl.collections", $insert: [
                    {collection: "issues"},
                    {collection: "tasks"}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "issue", type: "string", collectionid: {$query: {collection: "issues"}}, filterable: true, mandatory: false, label: "Issue"},
                    {field: "task", type: "string", collectionid: {$query: {collection: "tasks"}}, filterable: true, mandatory: false, label: "Task"},
                    {field: "createOn", type: "date", collectionid: {$query: {collection: "issues"}}, filterable: false, mandatory: false, label: "Created On"}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldsData.result[0]._id, $set: {label: "Bug"}},
                    {_id: fieldsData.result[1]._id, $set: {label: "Date"}}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {field: 1}})
            }).then(
            function (fieldsData) {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldsData.result[0]._id, $set: {mandatory: true}},
                    {_id: fieldsData.result[1]._id, $set: {filterable: true}}
                ]})
            }).then(
            function () {
                return daffodil_SbDb.getAdminDB();
            }).then(
            function (db) {
                adminDb = db;
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: "daffodil", "mainFk.value": "issues", "fk.value": "issue", "mainCollection": "pl.collections", collection: "pl.fields"}})
            }).then(
            function (changelogData) {
                var id = changelogData.result[0]._id;
                return adminDb.invokeFunction("NewPorting.removeChangesFromActions", [
                    {_id: id, removeType: "Complete"}
                ]);
            }).fail(
            function (err) {
//                console.log("1/////")
                if (err.message != "Main Collection and collection should be same when removeType is Complete") {
                    throw err;
                }
            }).then(
            function () {
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: "daffodil", "mainFk.value": "issues", "fk.value": "issues", "mainCollection": "pl.collections", collection: "pl.collections"}})
            }).then(
            function (changelogData) {
                var id = changelogData.result[0]._id;
                return adminDb.invokeFunction("NewPorting.removeChangesFromActions", [
                    {_id: id, removeType: "Single"}
                ]);
            }).fail(
            function (err) {
//                console.log("2/////")
                if (err.message != "Main Collection and Collection should be different when removeType is Single") {
                    throw err;
                }
            }).then(
            function () {
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: "daffodil", "mainFk.value": "issues", "fk.value": "issues", "mainCollection": "pl.collections", collection: "pl.collections"}})
            }).then(
            function (changelogData) {
                var id = changelogData.result[0]._id;
                return adminDb.invokeFunction("NewPorting.removeChangesFromActions", [
                    {_id: id, removeType: "Update"}
                ]);
            }).fail(
            function (err) {
//                console.log("3/////")
                if (err.message != "Main Collection and Collection should be different when removeType is Update") {
                    throw err;
                }
            }).then(
            function () {
                return daffodil_SbDb.update({$collection: "pl.applications", $insert: {label: "Accounts"}})
            }).then(
            function () {
//                console.log("4....")
                return daffodil_SbDb.update({$collection: "pl.menus", $insert: [
                    {label: "Accounts", application: {$query: {label: "Accounts"}}, collection: "accounts"}
                ]});
            }).then(
            function () {
                return daffodil_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "account", type: "string", collectionid: {$query: {collection: "accounts"}}, filterable: false, mandatory: false, label: "Account"}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: "daffodil", "mainFk.value": "accounts", "fk.value": "accounts", "mainCollection": "pl.collections", collection: "pl.collections"}})
            }).then(
            function (changeLogData) {
                var id = changeLogData.result[0]._id;
                return adminDb.invokeFunction("NewPorting.removeChangesFromActions", [
                    {_id: id, removeType: "Complete"}
                ]);
            }).fail(
            function (err) {
                if (err.message.indexOf("Record is created in db to update") < 0) {
                    throw err;
                }
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (db) {
                daffodilDb = db;

            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.qviews", $filter: {id: "accounts"}})
            }).then(
            function (qviewData) {
                expect(qviewData.result).to.have.length(1);
            }).then(
            function () {
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: "daffodil", "mainFk.value": "accounts", "fk.value": "accounts", "mainCollection": "pl.collections", collection: "pl.collections"}})
            }).then(
            function (changeLogData) {
                var id = changeLogData.result[0]._id;
                return adminDb.invokeFunction("NewPorting.removeChangesFromActions", [
                    {_id: id, removeType: "Complete", localDelete: true}
                ]);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (db) {
                daffodilDb = db;

            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.qviews", $filter: {id: "accounts"}})
            }).then(
            function (qviewData) {
                expect(qviewData.result).to.have.length(0);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    it('remove Change log of a single property of a single record', function (done) {
        var afb_SbDb = undefined;
        var afbDb = undefined;
        var daffodil_SbDb = undefined;
        var daffodilDb = undefined;
        var fieldId1 = undefined;
        var fieldId2 = undefined;
        var adminDb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return  afb_SbDb.update({$collection: "pl.collections", $insert: [
                    {collection: "issues"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection: "pl.fields", $insert: [
                    {field: "issue", type: "string", collectionid: {$query: {collection: "issues"}}, filterable: true, mandatory: false, label: "Issue"},
                    {field: "createOn", type: "date", collectionid: {$query: {collection: "issues"}}, filterable: false, mandatory: false, label: "Created On"}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (dbName) {
                daffodil_SbDb = dbName;
                return daffodil_SbDb.query({$collection: "pl.fields", $sort: {field: 1}, $filter: {"collectionid.collection": "issues"}});
            }).then(
            function (fieldsData) {
                fieldId1 = fieldsData.result[0]._id;
                fieldId2 = fieldsData.result[1]._id;
                return daffodil_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldId1, $set: {filterable: true, mandatory: true, label: "Issued On"}},
                    {_id: fieldId2, $set: {filterable: true, sortable: true, mandatory: true, label: "Bug"}}
                ]});
            }).then(
            function () {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldId1, $set: {index: 1000, groupable: true, label: "Reported On"}, $unset: {filterable: "", mandatory: ""}},
                    {_id: fieldId2, $set: {sortable: false, label: "Problem"}, $unset: {filterable: "", mandatory: ""}}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data: {commit: true}}, daffodil_SbDb);
            }).then(
            function () {
                return daffodil_SbDb.update({$collection: "pl.fields", $update: [
                    {_id: fieldId1, $set: {index: 2000, label: "Date", filterable: true, mandatory: true}},
                    {_id: fieldId2, $set: {filterable: true, mandatory: true}, $unset: {sortable: ""}}
                ]});
            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $sort: {field: 1}, $filter: {"collectionid.collection": "issues"}});
            }).then(
            function (fieldsData) {

                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].label).to.eql("Date");
                expect(fieldsData.result[0].index).to.eql(2000);
                expect(fieldsData.result[0].mandatory).to.eql(true);
                expect(fieldsData.result[0].groupable).to.eql(true);
                expect(fieldsData.result[0].filterable).to.eql(true);

                expect(fieldsData.result[1].label).to.eql("Problem");
                expect(fieldsData.result[1].filterable).to.eql(true);
                expect(fieldsData.result[1].mandatory).to.eql(true);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"});
            }).then(
            function (db) {
                daffodilDb = db;
                return daffodil_SbDb.getAdminDB();
            }).then(
            function (adb) {
                adminDb = adb;
                return adminDb.query({$collection: "pl.changelogs", $filter: {db: "daffodil", "mainFk.value": "issues", "fk.value": "createOn", updatedField: "mandatory", "mainCollection": "pl.collections", collection: "pl.fields"}})
            }).then(
            function (changelogData) {
                var id = changelogData.result[0]._id;
                return adminDb.invokeFunction("NewPorting.removeChangesFromActions", [
                    {_id: id, removeType: "Update"}
                ]);
            }).then(
            function () {
                //remove change log of property-mandatory of a single record of fieldId1 _id
            }).then(
            function () {
                return daffodilDb.query({$collection: "pl.fields", $sort: {field: 1}, $filter: {"collectionid.collection": "issues"}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].label).to.eql("Date");
                expect(fieldsData.result[0].index).to.eql(2000);
                expect(fieldsData.result[0].mandatory).to.eql(false);
                expect(fieldsData.result[0].groupable).to.eql(true);
                expect(fieldsData.result[0].filterable).to.eql(true);

                expect(fieldsData.result[1].mandatory).to.eql(true);
                expect(fieldsData.result[1].label).to.eql("Problem");
                expect(fieldsData.result[1].filterable).to.eql(true);

            }).then(
            function () {
                return daffodil_SbDb.query({$collection: "pl.fields", $sort: {field: 1}, $filter: {"collectionid.collection": "issues"}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(2);
                expect(fieldsData.result[0].label).to.eql("Date");
                expect(fieldsData.result[0].index).to.eql(2000);
                expect(fieldsData.result[0].mandatory).to.eql(false);
                expect(fieldsData.result[0].groupable).to.eql(true);
                expect(fieldsData.result[0].filterable).to.eql(true);

                expect(fieldsData.result[1].mandatory).to.eql(true);
                expect(fieldsData.result[1].label).to.eql("Problem");
                expect(fieldsData.result[1].filterable).to.eql(true);

            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });

    function expectInitialData(db) {
        var productivityId = undefined;
        var accountId = undefined;
        return db.query({$collection: 'pl.applications', $sort: {label: 1}}).then(
            function (applicationData) {
                productivityId = applicationData.result[1]._id;
                accountId = applicationData.result[0]._id;
                expect(applicationData.result[0].label).to.eql("Accounts");
                expect(applicationData.result[1].label).to.eql("Productivity");
                return db.query({$collection: "pl.menus", $filter: {"application._id": productivityId}});
            }).then(
            function (menuData) {
                expect(menuData.result[0].label).to.eql("Goals");
                return db.query({$collection: "pl.menus", $filter: {"application._id": accountId}});
            }).then(
            function (menuData) {
                expect(menuData.result[0].label).to.eql("Accounts");
                return db.query({$collection: "pl.fields", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].label).to.eql("Issue");
                return db.query({$collection: "pl.fields", $filter: {"collectionid.collection": "employees"}, $sort: {label: 1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(1);
                expect(fieldsData.result[0].label).to.eql("Name");
                return db.query({$collection: "pl.actions", $filter: {"collectionid.collection": "issues"}, $sort: {label: 1}});
            }).then(
            function (actionsData) {
                //case for it('Change log of a single collection')
                if (actionsData && actionsData.result.length > 0) {
                    expect(actionsData.result[0].label).to.eql("Add Issue");
                }
                return db.query({$collection: "pl.actions", $filter: {"collectionid.collection": "accounts"}, $sort: {label: 1}});
            }).then(function (actionsData) {
                //case for it('Change log of a single collection')
                if (actionsData && actionsData.result.length > 0) {
                    expect(actionsData.result[0].label).to.eql("Change Account");
                }
            })
    }

    function dropDatabase1(dbs) {
        return ApplaneDB.connect(Config.URL, "afb", {username: "afb", "password": "afb"})
            .then(
            function (afbDb) {
                dbs.afbDb = afbDb;
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username: "afb", "password": "afb"})
            }).then(
            function (afb_sbDb) {
                dbs.afb_sbDb = afb_sbDb;
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (daffodilDb) {
                dbs.daffodilDb = daffodilDb;
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil_sb", {username: "daffodil", "password": "daffodil"})
            }).then(
            function (daffodil_sbDb) {
                dbs.daffodil_sbDb = daffodil_sbDb;
            })
    }

})