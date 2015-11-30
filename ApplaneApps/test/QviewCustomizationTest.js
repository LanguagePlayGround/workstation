var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");
var Util = require("ApplaneCore/apputil/util.js");
var Constants = require("ApplaneDB/lib/Constants.js");


describe("qviewcustomization testcase", function () {
    beforeEach(function (done) {
        return Testcases.beforeEach(done);
    });
    afterEach(function (done) {
        return Testcases.afterEach(done);
    });
    it("qviewcustomizationtestcase", function (done) {
        var db = undefined;
        var menuId = undefined;
        var application = undefined;
        var menuLabel = undefined;
        var userDB = undefined;
        var source1 = undefined;
        var source2 = undefined;
        var source3 = undefined;
        var query = {};
        var update = {};
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                update[Constants.Query.COLLECTION] = Constants.Admin.APPLICATIONS;
                update[Constants.Update.INSERT] = [
                    {label: "Task Management"}
                ];
                return db.update([update]);
            }).then(
            function () {
                query[Constants.Query.COLLECTION] = Constants.Admin.APPLICATIONS;
                return db.query(query);
            }).then(
            function (applications) {
                expect(applications.result).to.have.length(1);
                application = applications.result[0];
            }).then(
            function () {
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.ROLES;
                query[Constants.Query.FIELDS] = {role: 1};
                return db.query(query);
            }).then(
            function (roles) {
                expect(roles.result).to.have.length(1);
                expect(roles.result[0].role).to.eql("Task Management");
                update = {};
                update[Constants.Query.COLLECTION] = Constants.Admin.USERS;
                update[Constants.Update.INSERT] = [
                    {username: "rajit", password: "daffodil", roles: [
                        {role: roles.result[0]}
                    ]}
                ];
                return db.update([update]);
            }).then(
            function () {
                update = {};
                update[Constants.Query.COLLECTION] = Constants.Admin.MENUS;
                update[Constants.Update.INSERT] = [
                    {label: "Tasks", collection: "tasks", application: application, qviews: [
                        {id: "tasks", "label": "All Tasks", "collection": "tasks"},
                        {id: "tasks", "label": "New Tasks", "collection": "tasks"} ,
                        {id: "tasks", "label": "Backlog", "collection": "tasks"}
                    ]}
                ];
                return db.update([update]);
            }).then(
            function () {
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.MENUS;
                query[Constants.Query.FILTER] = {application: application};
                return db.query(query);
            }).then(
            function (menus) {
                expect(menus.result).to.have.length(1);
                expect(menus.result[0].label).to.eql("Tasks");
                expect(menus.result[0].collection).to.eql("tasks");
                expect(menus.result[0].qviews).to.have.length(3);
                source1 = menus.result[0].qviews[0]._id;
                source2 = menus.result[0].qviews[1]._id;
                source3 = menus.result[0].qviews[2]._id;
                menuId = menus.result[0]._id;
                menuLabel = menus.result[0].label;
                //query on pl.qviews
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.QVIEWS;
                query[Constants.Query.FILTER] = {"collection.collection": "tasks"};
                query[Constants.Query.FIELDS] = {id: 1, collection: 1};
                return db.query(query);
            }).then(
            function (qviews) {
                expect(qviews.result).to.have.length(1);
                expect(qviews.result[0].id).to.eql("tasks");
                expect(qviews.result[0].collection.collection).to.eql("tasks");
                qviewId = qviews.result[0]._id;
                //query on pl.collections
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.COLLECTIONS;
                query[Constants.Query.FIELDS] = {collection: 1};
                return db.query(query);
            }).then(
            function (collections) {
                expect(collections.result[0].collection).to.eql("tasks");
                return db.update({$collection: "pl.qviewcustomizations", $upsert: {$query: {_id: source2}, $set: {"filter": {"status": "new"}}}});
            }).then(
            function () {
                return db.update({$collection: "pl.qviewcustomizations", $upsert: {$query: {_id: source3}, $set: {"filter": {"status": "backlog"}}}});
            }).then(
            function () {
                return db.query({$collection: "pl.qviewcustomizations"});
            }).then(
            function (data) {
                return db.update({$collection: "tasks", $insert: [
                    {"task": "task1", status: "new"} ,
                    {"task": "task2", status: "backlog"},
                    {"task": "task3", status: "backlog"}
                ]});
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {
                    username: "rajit",
                    password: "daffodil",
                    ensureDB: true
                });
            }).then(
            function (userDb) {
                userDB = userDb;
                return userDB.invokeFunction("view.getView", [
                    {id: "tasks", sourceid: source2}
                ]);
            }).then(
            function (result) {
                expect(result.data.result).to.have.length(1);
                expect(result.data.result[0].task).to.eql("task1");
                return userDB.invokeFunction("view.getView", [
                    {id: "tasks", sourceid: source3}
                ]);
            }).then(
            function (result) {
                expect(result.data.result).to.have.length(2);
                expect(result.data.result[0].task).to.eql("task3");
                expect(result.data.result[1].task).to.eql("task2");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    });

    it("qview actions customization testcase", function (done) {
        var db = undefined;
        var menuId = undefined;
        var application = undefined;
        var menuLabel = undefined;
        var userDB = undefined;
        var source1 = undefined;
        var source2 = undefined;
        var source3 = undefined;
        var action1id = undefined;
        var action2id = undefined;
        var query = {};
        var update = {};
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                update[Constants.Query.COLLECTION] = Constants.Admin.APPLICATIONS;
                update[Constants.Update.INSERT] = [
                    {label: "Task Management"}
                ];
                return db.update([update]);
            }).then(
            function () {
                query[Constants.Query.COLLECTION] = Constants.Admin.APPLICATIONS;
                return db.query(query);
            }).then(
            function (applications) {
                expect(applications.result).to.have.length(1);
                application = applications.result[0];
            }).then(
            function () {
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.ROLES;
                query[Constants.Query.FIELDS] = {role: 1};
                return db.query(query);
            }).then(
            function (roles) {
                expect(roles.result).to.have.length(1);
                expect(roles.result[0].role).to.eql("Task Management");
                update = {};
                update[Constants.Query.COLLECTION] = Constants.Admin.USERS;
                update[Constants.Update.INSERT] = [
                    {username: "rajit", password: "daffodil", roles: [
                        {role: roles.result[0]}
                    ]}
                ];
                return db.update([update]);
            }).then(
            function () {
                update = {};
                update[Constants.Query.COLLECTION] = Constants.Admin.MENUS;
                update[Constants.Update.INSERT] = [
                    {label: "Tasks", collection: "tasks", application: application, qviews: [
                        {id: "tasks", "label": "All Tasks", "collection": "tasks"},
                        {id: "tasks", "label": "New Tasks", "collection": "tasks"} ,
                        {id: "tasks", "label": "Backlog", "collection": "tasks"}
                    ]}
                ];
                return db.update([update]);
            }).then(
            function () {
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.MENUS;
                query[Constants.Query.FILTER] = {application: application};
                return db.query(query);
            }).then(
            function (menus) {
                expect(menus.result).to.have.length(1);
                expect(menus.result[0].label).to.eql("Tasks");
                expect(menus.result[0].collection).to.eql("tasks");
                expect(menus.result[0].qviews).to.have.length(3);
                source1 = menus.result[0].qviews[0]._id;
                source2 = menus.result[0].qviews[1]._id;
                source3 = menus.result[0].qviews[2]._id;
                menuId = menus.result[0]._id;
                menuLabel = menus.result[0].label;
                //query on pl.qviews
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.QVIEWS;
                query[Constants.Query.FILTER] = {"collection.collection": "tasks"};
                query[Constants.Query.FIELDS] = {id: 1, collection: 1};
                return db.query(query);
            }).then(
            function (qviews) {
                expect(qviews.result).to.have.length(1);
                expect(qviews.result[0].id).to.eql("tasks");
                expect(qviews.result[0].collection.collection).to.eql("tasks");
                qviewId = qviews.result[0]._id;
                //query on pl.collections
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.COLLECTIONS;
                query[Constants.Query.FIELDS] = {collection: 1};
                return db.query(query);
            }).then(
            function (collections) {
                expect(collections.result[0].collection).to.eql("tasks");
                return db.update({$collection: "pl.qviewcustomizations", $upsert: {$query: {_id: source2}, $set: {"filter": {"status": "new"}}}});
            }).then(
            function () {
                return db.update({$collection: "pl.qviewcustomizations", $upsert: {$query: {_id: source3}, $set: {"filter": {"status": "backlog"}}}});
            }).then(
            function () {
                return db.query({$collection: "pl.qviewcustomizations"});
            }).then(
            function (data) {
                return db.update({$collection: "tasks", $insert: [
                    {"task": "task1", status: "new"} ,
                    {"task": "task2", status: "backlog"},
                    {"task": "task3", status: "backlog"}
                ]});
            }).then(
            function () {
                return db.update({$collection: "pl.actions", $insert: [
                    {"id": "action1", "label": "Action 1", "type": "invoke", "function": "testing", onHeader: true, collectionid: {"$query": {"collection": "tasks"}}, visibility: true},
                    {"id": "action2", "label": "Action 2", "type": "invoke", "function": "testing", onHeader: true, collectionid: {"$query": {"collection": "tasks"}}, visibility: true}
                ]});
            }).then(
            function () {
                return db.query({$collection: "pl.actions", $filter: {"collectionid.collection": "tasks"}});
            }).then(
            function (actions) {
                expect(actions.result).to.have.length(2);
                action1id = actions.result[0]._id;
                action2id = actions.result[1]._id;
                return db.update({$collection: "pl.qviewcustomizations", $update: {_id: source2, $set: {"actionAvailability": "available", qActions: [
                    {qaction: {_id: action1id}}
                ]}}});

            }).then(
            function () {
                return db.update({$collection: "pl.qviewcustomizations", $update: {_id: source3, $set: {"actionAvailability": "override", qActions: [
                    {qaction: {_id: action1id}, visibility: false}
                ]}}});
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {
                    username: "rajit",
                    password: "daffodil",
                    ensureDB: true
                });
            }).then(
            function (userDb) {
                userDB = userDb;
                return userDB.invokeFunction("view.getView", [
                    {id: "tasks", sourceid: source2}
                ]);
            }).then(
            function (result) {
                expect(result.viewOptions.actions).to.have.length(1);
                expect(result.viewOptions.actions[0].id).to.eql("action1");
                expect(result.data.result).to.have.length(1);
                expect(result.data.result[0].task).to.eql("task1");
                return userDB.invokeFunction("view.getView", [
                    {id: "tasks", sourceid: source3}
                ]);
            }).then(
            function (result) {
                expect(result.viewOptions.actions).to.have.length(1);
                expect(result.viewOptions.actions[0].id).to.eql("action2");
                expect(result.data.result).to.have.length(2);
                expect(result.data.result[0].task).to.eql("task3");
                expect(result.data.result[1].task).to.eql("task2");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    });

    it("remove filter from qview by removing from view customization", function (done) {

        var db = undefined;
        var menuId = undefined;
        var application = undefined;
        var menuLabel = undefined;
        var userDB = undefined;
        var source1 = undefined;
        var qviewId = undefined;
        var query = {};
        var update = {};
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                update[Constants.Query.COLLECTION] = Constants.Admin.APPLICATIONS;
                update[Constants.Update.INSERT] = [
                    {label: "Task Management"}
                ];
                return db.update([update]);
            }).then(
            function () {
                query[Constants.Query.COLLECTION] = Constants.Admin.APPLICATIONS;
                return db.query(query);
            }).then(
            function (applications) {
                expect(applications.result).to.have.length(1);
                application = applications.result[0];
            }).then(
            function () {
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.ROLES;
                query[Constants.Query.FIELDS] = {role: 1};
                return db.query(query);
            }).then(
            function (roles) {
                expect(roles.result).to.have.length(1);
                expect(roles.result[0].role).to.eql("Task Management");
                update = {};
                update[Constants.Query.COLLECTION] = Constants.Admin.USERS;
                update[Constants.Update.INSERT] = [
                    {username: "rajit", password: "daffodil", roles: [
                        {role: roles.result[0]}
                    ]}
                ];
                return db.update([update]);
            }).then(
            function () {
                update = {};
                update[Constants.Query.COLLECTION] = Constants.Admin.MENUS;
                update[Constants.Update.INSERT] = [
                    {label: "Tasks", collection: "tasks", application: application, qviews: [
                        {id: "tasks", "label": "Backlog", "collection": "tasks"}
                    ]}
                ];
                return db.update([update]);
            }).then(
            function () {
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.MENUS;
                query[Constants.Query.FILTER] = {application: application};
                return db.query(query);
            }).then(
            function (menus) {
                expect(menus.result).to.have.length(1);
                expect(menus.result[0].label).to.eql("Tasks");
                expect(menus.result[0].collection).to.eql("tasks");
                expect(menus.result[0].qviews).to.have.length(1);
                source1 = menus.result[0].qviews[0]._id;
                menuId = menus.result[0]._id;
                menuLabel = menus.result[0].label;
                //query on pl.qviews
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.QVIEWS;
                query[Constants.Query.FILTER] = {"collection.collection": "tasks"};
                query[Constants.Query.FIELDS] = {id: 1, collection: 1};
                return db.query(query);
            }).then(
            function (qviews) {
                expect(qviews.result).to.have.length(1);
                expect(qviews.result[0].id).to.eql("tasks");
                expect(qviews.result[0].collection.collection).to.eql("tasks");
                qviewId = qviews.result[0]._id;
                return db.update({$collection: "pl.qviews", $update: {_id: qviewId, $set: {filter: {"status": "backlog"}}}});
            }).then(function () {
                //query on pl.collections
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.COLLECTIONS;
                query[Constants.Query.FIELDS] = {collection: 1};
                return db.query(query);
            }).then(
            function (collections) {
                expect(collections.result[0].collection).to.eql("tasks");
                return db.update({$collection: "pl.qviewcustomizations", $upsert: {$query: {_id: source1}, $set: {"filter": null}}});
            }).then(
            function (data) {
                return db.update({$collection: "tasks", $insert: [
                    {"task": "task1", status: "new"} ,
                    {"task": "task2", status: "backlog"},
                    {"task": "task3", status: "backlog"}
                ]});
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {
                    username: "rajit",
                    password: "daffodil",
                    ensureDB: true
                });
            }).then(
            function (userDb) {
                userDB = userDb;
                return userDB.invokeFunction("view.getView", [
                    {id: "tasks", sourceid: source1}
                ]);
            }).then(
            function (result) {
                expect(result.data.result).to.have.length(3);
            }).then(function () {
                return userDB.invokeFunction("view.getView", [
                    {id: "tasks"}
                ]);
            }).then(function (result) {
                expect(result.data.result).to.have.length(2);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })

    });

    it("remove editable when form field  by removing from view customization", function (done) {
        var db = undefined;
        var menuId = undefined;
        var application = undefined;
        var menuLabel = undefined;
        var userDB = undefined;
        var source1 = undefined;
        var qviewId = undefined;
        var query = {};
        var update = {};
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                update[Constants.Query.COLLECTION] = Constants.Admin.APPLICATIONS;
                update[Constants.Update.INSERT] = [
                    {label: "Task Management"}
                ];
                return db.update([update]);
            }).then(
            function () {
                query[Constants.Query.COLLECTION] = Constants.Admin.APPLICATIONS;
                return db.query(query);
            }).then(
            function (applications) {
                expect(applications.result).to.have.length(1);
                application = applications.result[0];
            }).then(
            function () {
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.ROLES;
                query[Constants.Query.FIELDS] = {role: 1};
                return db.query(query);
            }).then(
            function (roles) {
                expect(roles.result).to.have.length(1);
                expect(roles.result[0].role).to.eql("Task Management");
                update = {};
                update[Constants.Query.COLLECTION] = Constants.Admin.USERS;
                update[Constants.Update.INSERT] = [
                    {username: "rajit", password: "daffodil", roles: [
                        {role: roles.result[0]}
                    ]}
                ];
                return db.update([update]);
            }).then(
            function () {
                update = {};
                update[Constants.Query.COLLECTION] = Constants.Admin.MENUS;
                update[Constants.Update.INSERT] = [
                    {label: "Tasks", collection: "tasks", application: application, qviews: [
                        {id: "tasks", "label": "Backlog", "collection": "tasks"}
                    ]}
                ];
                return db.update([update]);
            }).then(
            function () {
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.MENUS;
                query[Constants.Query.FILTER] = {application: application};
                return db.query(query);
            }).then(
            function (menus) {
                expect(menus.result).to.have.length(1);
                expect(menus.result[0].label).to.eql("Tasks");
                expect(menus.result[0].collection).to.eql("tasks");
                expect(menus.result[0].qviews).to.have.length(1);
                source1 = menus.result[0].qviews[0]._id;
                menuId = menus.result[0]._id;
                menuLabel = menus.result[0].label;
                //query on pl.qviews
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.QVIEWS;
                query[Constants.Query.FILTER] = {"collection.collection": "tasks"};
                query[Constants.Query.FIELDS] = {id: 1, collection: 1};
                return db.query(query);
            }).then(
            function (qviews) {
                expect(qviews.result).to.have.length(1);
                expect(qviews.result[0].id).to.eql("tasks");
                expect(qviews.result[0].collection.collection).to.eql("tasks");
                qviewId = qviews.result[0]._id;
                return db.update({$collection: "pl.qviews", $update: {_id: qviewId, $set: {filter: {"status": "backlog"}}}});
            }).then(function () {
                //query on pl.collections
                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.COLLECTIONS;
                query[Constants.Query.FIELDS] = {collection: 1};
                return db.query(query);
            }).then(
            function (collections) {
                expect(collections.result[0].collection).to.eql("tasks");
                return db.update({$collection: "pl.qviewcustomizations", $upsert: {$query: {_id: source1}, $set: {"filter": null}}});
            }).then(
            function (data) {
                return db.update({$collection: "tasks", $insert: [
                    {"task": "task1", status: "new"} ,
                    {"task": "task2", status: "backlog"},
                    {"task": "task3", status: "backlog"}
                ]});
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {
                    username: "rajit",
                    password: "daffodil",
                    ensureDB: true
                });
            }).then(
            function (userDb) {
                userDB = userDb;
                return userDB.invokeFunction("view.getView", [
                    {id: "tasks", sourceid: source1}
                ]);
            }).then(
            function (result) {
                expect(result.data.result).to.have.length(3);
            }).then(function () {
                return userDB.invokeFunction("view.getView", [
                    {id: "tasks"}
                ]);
            }).then(function (result) {
                expect(result.data.result).to.have.length(2);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })

    });
});

