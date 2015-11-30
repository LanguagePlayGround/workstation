//insert - pl.applications - label - task management
//expect - pl.roles - role - label    - task management
//insert pl.users - username:"",password:"", roles:[{role:{}}]
//pl.menus - insert
/*
 * label : taskss
 * viewid :mytasks
 * collection - taskss
 *
 * expect - pl.qviews --> id:mypeson, collection {} :persontests
 * expect - pl.collections = collection:persontests
 * expect - pl.qviewcustomizations -- menuid : {} ..., referredqviewid : {} ...., sourceid : menuid    label:menu label
 *
 * connect with new user - DB.connect
 *   invokeFunction - getUserState, parameters -  [{}]
 *
 *   user : current user
 *   applications : lenght 1 - expect application
 *   menus - expect
 *   qviews : expect 1
 *
 *   update menu
 *       viewid :"" - allperson
 *
 *   expect - pl.qviews --> length 2 and data
 *   pl.qviewcustomizations - length  =1, previous shoudl be deleted and check with new one
 *
 *
 *   add new menu again, label:"over due tasks", id:"overduetasks", collection :"tasks"
 *   expect
 *   qviews : 3 -
 *   collection : 1
 *   qview customizations : 2
 *
 *
 *   getUserState
 *       menus - 2
 *
 *   delete second menu
 *           expect field customziation should be removed
 *
 *
 *
 *
 menu : users,
 qview : users
 menu : tasks
 qview : tasks
 qviewmappings : 4
 menuid   referredqview       label
 tasks
 my tasks
 priority tasks
 new tasks

 defaultqviewmappingid : my tasks

 menu : comments
 qview  :comments


 application  : defaultmenuid :fk : tasks
 getuserstate
 expect tasks - my tasks
 View.getView - priority tasks
 getuserstate
 expect tasks - priority tasks
 getmenustate
 menu : comments
 expect - comments
 getuserstate
 selectmenuid : comments


















 *
 * */


/**
 *
 * mocha --recursive --timeout 150000 -g "application testcase" --reporter spec
 */
var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");
var Util = require("ApplaneCore/apputil/util.js");
var Constants = require("ApplaneDB/lib/Constants.js");


describe("application testcase", function () {
    beforeEach(function (done) {
        return Testcases.beforeEach(done);
    });
    afterEach(function (done) {
        return Testcases.afterEach(done);
    });
    it("application test", function (done) {
        var db = undefined;
        var menuId = undefined;
        var application = undefined;
        var qviewId = undefined;
        var menuLabel = undefined;
        var userDB = undefined;
        var update = {};
        var query = {};
        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                //insert into pl.applications

                update[Constants.Query.COLLECTION] = Constants.Admin.APPLICATIONS;
                update[Constants.Update.INSERT] = [
                    {label:"task management"}
                ];
                return db.update([update]);
            }).then(
            function () {
                //query on  pl.applications

                query[Constants.Query.COLLECTION] = Constants.Admin.APPLICATIONS;
                return db.query(query);
            }).then(
            function (applications) {
                expect(applications.result).to.have.length(1);
                application = applications.result[0];
            }).then(
            function () {
                //query on  pl.roles

                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.ROLES;
                query[Constants.Query.FIELDS] = {role:1};

                return db.query(query);
            }).then(
            function (roles) {
                expect(roles.result).to.have.length(1);
                expect(roles.result[0].role).to.eql("task management");

                //insert into pl.users

                update = {};
                update[Constants.Query.COLLECTION] = Constants.Admin.USERS;
                update[Constants.Update.INSERT] = [
                    {username:"rajit", password:"daffodil", roles:[
                        {role:roles.result[0]}
                    ]}
                ];
                return db.update([update]);
            }).then(
            function () {

                //insert into pl.menus

                update = {};
                update[Constants.Query.COLLECTION] = Constants.Admin.MENUS;
                update[Constants.Update.INSERT] = [
                    {label:"Tasks", collection:"tasks", application:application}
                ];

                return db.update([update]);
            }).then(
            function () {

                //query on pl.menus

                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.MENUS;
                query[Constants.Query.FILTER] = {application:application};
                return db.query(query);
            }).then(
            function (menus) {
                expect(menus.result).to.have.length(1);
                expect(menus.result[0].label).to.eql("Tasks");
                expect(menus.result[0].collection).to.eql("tasks");
                expect(menus.result[0].qviews).to.have.length(1);
                expect(menus.result[0].qviews[0].id).to.eql("tasks");
                expect(menus.result[0].qviews[0].collection).to.eql("tasks");
                expect(menus.result[0].qviews[0].label).to.eql("Tasks");
                menuId = menus.result[0]._id;
                menuLabel = menus.result[0].label;

                //query on pl.qviews

                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.QVIEWS;
                query[Constants.Query.FILTER] = {"collection.collection":"tasks"};
                query[Constants.Query.FIELDS] = {id:1, collection:1};
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
                query[Constants.Query.FIELDS] = {collection:1};
                return db.query(query);
            }).then(
            function (collections) {
                expect(collections.result[0].collection).to.eql("tasks");
                return ApplaneDB.connect(Config.URL, Config.DB, {
                    username:"rajit",
                    password:"daffodil",
                    ensureDB:true
                });
            }).then(
            function (userDb) {
                userDB = userDb;
                return userDB.invokeFunction("getUserState", [
                    {}
                ]);
            }).then(
            function (result) {

                expect(result.user.username).to.eql("rajit");
                expect(result.applications).to.have.length(1);
                expect(result.applications[0].label).to.eql("task management");
                expect(result.applications[0].menus).to.have.length(1);
                expect(result.applications[0].menus[0].label).to.eql("Tasks");
                expect(result.applications[0].menus[0].collection).to.eql("tasks");
                expect(result.qviews).to.have.length(1);
                done();
            }).fail(function (err) {
                done(err);
            })
    });

    it("default qview testcase at menu", function (done) {
        var db = undefined;
        var menuId = undefined;
        var application = undefined;
        var qviewId = undefined;
        var menuLabel = undefined;
        var userDB = undefined;
        var update = {};
        var query = {};

        return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                //insert into pl.applications

                update[Constants.Query.COLLECTION] = Constants.Admin.APPLICATIONS;
                update[Constants.Update.INSERT] = [
                    {label:"task management"}
                ];
                return db.update([update]);
            }).then(
            function () {
                //query on  pl.applications

                query[Constants.Query.COLLECTION] = Constants.Admin.APPLICATIONS;
                return db.query(query);
            }).then(
            function (applications) {
                expect(applications.result).to.have.length(1);
                expect(applications.result[0].label).to.eql("task management");
                application = applications.result[0];
            }).then(
            function () {
                //query on  pl.roles

                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.ROLES;
                query[Constants.Query.FIELDS] = {role:1};

                return db.query(query);
            }).then(
            function (roles) {
                expect(roles.result).to.have.length(1);
                expect(roles.result[0].role).to.eql("task management");

                //insert into pl.users

                update = {};
                update[Constants.Query.COLLECTION] = Constants.Admin.USERS;
                update[Constants.Update.INSERT] = [
                    {username:"rajit", password:"daffodil", roles:[
                        {role:roles.result[0]}
                    ]}
                ];
                return db.update([update]);
            }).then(
            function () {
                //insert into pl.menus
                update = {};
                update[Constants.Query.COLLECTION] = Constants.Admin.MENUS;
                update[Constants.Update.INSERT] = [
                    {label:"Tasks", collection:"tasks", application:application}
                ];
                return db.update([update]);
            }).then(
            function () {
                return db.update({$collection:"pl.qviews", $insert:[
                    {"id":"alltasks", "collection":{"$query":{collection:"tasks"}}, "mainCollection":{"$query":{collection:"tasks"}}, "label":"All Tasks"},
                    {"id":"backlog", "collection":{"$query":{collection:"tasks"}}, "mainCollection":{"$query":{collection:"tasks"}}, "label":"Backlog"} ,
                    {"id":"newtasks", "collection":{"$query":{collection:"tasks"}}, "mainCollection":{"$query":{collection:"tasks"}}, "label":"New Tasks"}
                ]})

            }).then(
            function () {
                console.log("qviews inserted>>>>>");
                //insert fields into tasks collection
                var insert = [
                    {$collection:"pl.fields", $insert:[
                        {field:"task", type:"string", collectionid:{$query:{"collection":"tasks"}}},
                        {field:"owner", type:"string", collectionid:{$query:{"collection":"tasks"}}},
                        {field:"priority", type:"string", collectionid:{$query:{"collection":"tasks"}}},
                        {field:"status", type:"string", collectionid:{$query:{"collection":"tasks"}}}
                    ]}
                ];
                return db.update(insert);
            }).then(
            function () {
                //query on pl.menus

                query = {};
                query[Constants.Query.COLLECTION] = Constants.Admin.MENUS;
                query[Constants.Query.FILTER] = {collection:"tasks", application:application};
                return db.query(query);
            }).then(
            function (menus) {
                expect(menus.result).to.have.length(1);
                expect(menus.result[0].label).to.eql("Tasks");
                expect(menus.result[0].collection).to.eql("tasks");
                expect(menus.result[0].qviews).to.have.length(1);
                expect(menus.result[0].qviews[0].id).to.eql("tasks");
                expect(menus.result[0].qviews[0].collection).to.eql("tasks");
                expect(menus.result[0].qviews[0].label).to.eql("Tasks");
                menuId = menus.result[0]._id;
                menuLabel = menus.result[0].label;

                var setfield = {};
                setfield[Constants.Admin.Menus.DEFAULT_QVIEW_ID] = {$query:{"id":"backlog"}};
                setfield[Constants.Admin.Menus.QVIEWS] = [
                    {id:"alltasks", "collection":"tasks", label:"All Tasks"},
                    {id:"backlog", "collection":"tasks", label:"Backlog"},
                    {id:"newtasks", "collection":"tasks", label:"New Tasks"}
                ]
                return db.update([
                    {$collection:Constants.Admin.MENUS, $update:{"_id":menuId, $set:setfield}

                    }
                ]);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.DB, {
                    username:"rajit",
                    password:"daffodil",
                    ensureDB:true
                });
            }).then(
            function (userDb) {
                userDB = userDb;
                return userDB.invokeFunction("getUserState", [
                    {}
                ]);
            }).then(
            function (result) {
                expect(result.views).to.have.length(1);
                expect(result.views[0].viewOptions.id).to.eql("backlog");
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
});

