/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 18/2/15
 * Time: 6:47 PM
 * To change this template use File | Settings | File Templates.
 */

/**
 *
 * mocha --recursive --timeout 150000 -g "Extend Collection" --reporter spec
 */

var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");
var Commit = require("../lib/apps/Commit.js");
var Utils = require("ApplaneCore/apputil/util.js")

describe("Extend Collection", function () {

    beforeEach(function (done) {
        Testcases.beforeEach().then(
            function () {
                return ApplaneDB.getAdminDB();
            }).then(
            function (adminDB) {
                var adminDb = adminDB;
                var insertDbs = {$collection:"pl.dbs", $insert:[
                    {"db":"afb", "sandboxDb":"afb_sb", "globalDb":"", "ensureDefaultCollections":true, "guestUserName":"afb", "globalUserName":"afb", "globalPassword":"afb", "globalUserAdmin":true, autoSynch:false},
                    {"db":"daffodil", "sandboxDb":"daffodil_sb", "globalDb":"afb", "ensureDefaultCollections":false, "guestUserName":"daffodil", "globalUserName":"daffodil", "globalPassword":"daffodil", "globalUserAdmin":true, autoSynch:false}
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

    it("copyCollection", function (done) {
        var afb_SbDb = undefined;
        var parentFieldId = undefined;
        var newCollectionid = undefined;
        var daffodildb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks", historyEnabled:true},
                    {collection:"priorities"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"name", collectionid:{$query:{collection:"priorities"}}, type:"string"},
                    {field:"task", collectionid:{$query:{collection:"tasks"}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, type:"fk", collection:"priorities", set:["name"]} ,
                    {field:"resultInfo", collectionid:{$query:{collection:"tasks"}}, type:"object", multiple:true},
                    {field:"name", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"fk", collection:"priorities", set:["name"]}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.actions", $insert:[
                    {id:"export", collectionid:{$query:{collection:"tasks"}}, label:"Export", type:"export"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.functions", $insert:{name:"TaskBL", source:"NorthwindTestCase/lib", type:"js"}})
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.events", $insert:{event:"onSave", function:"TaskBL.onSave", collectionid:{$query:{collection:"tasks"}}, pre:true}});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.templates", $insert:{template:"Template", collectionid:{$query:{collection:"tasks"}}}})
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.indexes", $insert:{collectionid:{$query:{collection:"tasks"}}, name:"Index1", indexes:{name:1}}})
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.formgroups", $insert:{collectionid:{$query:{collection:"tasks"}}, title:"Address", showLabel:true}})
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.workflowevents", $insert:{
                    event:"Workflowevent",
                    collectionid:{$query:{collection:"tasks"}}
                }})
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"tasks", parentfieldid:{$exists:true}}});
            }).then(
            function (fields) {
                parentFieldId = fields.result[0].parentfieldid._id;
            }).then(
            function () {
                //for collection commit in afb.
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks__child", parentCollection:"tasks"}
                ]});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"tasks", parentfieldid:{$exists:true}}});
            }).then(
            function (fields) {
                var newParentFieldId = fields.result[0].parentfieldid._id;
                expect(newParentFieldId).to.eql(parentFieldId);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.collections", $filter:{"collection":"tasks__child"}});
            }).then(
            function (collection) {
                newCollectionid = collection.result[0]._id;
                expect(collection.result[0].historyEnabled).to.eql(true);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"tasks__child"}, $sort:{"parentfieldid.field":-1, field:1}});
            }).then(
            function (fields) {
                expect(fields.result[0].field).to.eql("name");
                expect(fields.result[0].parentfieldid._id).to.eql(fields.result[3]._id);
                expect(fields.result[0].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[0].collectionid.collection).to.eql("tasks__child");
                expect(fields.result[1].field).to.eql("priorityid");
                expect(fields.result[1].parentfieldid._id).to.eql(fields.result[3]._id);
                expect(fields.result[1].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[1].collectionid.collection).to.eql("tasks__child");
                expect(fields.result[2].field).to.eql("priorityid");
                expect(fields.result[2].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[2].collectionid.collection).to.eql("tasks__child");
                expect(fields.result[3].field).to.eql("resultInfo");
                expect(fields.result[3].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[3].collectionid.collection).to.eql("tasks__child");
                expect(fields.result[3].mainTableId._id).to.eql(parentFieldId);
                expect(fields.result[4].field).to.eql("task");
                expect(fields.result[4].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[4].collectionid.collection).to.eql("tasks__child");
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.events", $filter:{"collectionid.collection":"tasks__child"}});
            }).then(
            function (events) {
                expect(events.result[0].event).to.eql("onSave");
                expect(events.result[0].function).to.eql("TaskBL.onSave");
                expect(events.result[0].pre).to.eql(true);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.actions", $filter:{"collectionid.collection":"tasks__child"}});
            }).then(
            function (actions) {
                expect(actions.result[0].id).to.eql("export");
                expect(actions.result[0].label).to.eql("Export");
                expect(actions.result[0].type).to.eql("export");
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.indexes", $filter:{"collectionid.collection":"tasks__child"}});
            }).then(
            function (indexes) {
                expect(indexes.result[0].name).to.eql("Index1");
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.templates", $filter:{"collectionid.collection":"tasks__child"}});
            }).then(
            function (templates) {
                expect(templates.result[0].template).to.eql("Template");
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.formgroups", $filter:{"collectionid.collection":"tasks__child"}});
            }).then(
            function (formgroups) {
                expect(formgroups.result[0].title).to.eql("Address");
                expect(formgroups.result[0].showLabel).to.eql(true);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.workflowevents", $filter:{"collectionid.collection":"tasks__child"}});
            }).then(
            function (workflowevents) {
                expect(workflowevents.result[0].event).to.eql("Workflowevent");
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"});
            }).then(
            function (dbName) {
                daffodildb = dbName;
            }).then(
            function () {
                return daffodildb.query({$collection:"pl.collections", $filter:{"collection":"tasks__child"}});
            }).then(
            function (collection) {
                newCollectionid = collection.result[0]._id;
                expect(collection.result[0].historyEnabled).to.eql(true);
            }).then(
            function () {
                return daffodildb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"tasks__child"}, $sort:{"parentfieldid.field":-1, field:1}});
            }).then(
            function (fields) {
                expect(fields.result[0].field).to.eql("name");
                expect(fields.result[0].parentfieldid._id).to.eql(fields.result[3]._id);
                expect(fields.result[0].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[0].collectionid.collection).to.eql("tasks__child");
                expect(fields.result[1].field).to.eql("priorityid");
                expect(fields.result[1].parentfieldid._id).to.eql(fields.result[3]._id);
                expect(fields.result[1].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[1].collectionid.collection).to.eql("tasks__child");
                expect(fields.result[2].field).to.eql("priorityid");
                expect(fields.result[2].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[2].collectionid.collection).to.eql("tasks__child");
                expect(fields.result[3].field).to.eql("resultInfo");
                expect(fields.result[3].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[3].collectionid.collection).to.eql("tasks__child");
                expect(fields.result[3].mainTableId._id).to.eql(parentFieldId);
                expect(fields.result[4].field).to.eql("task");
                expect(fields.result[4].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[4].collectionid.collection).to.eql("tasks__child");
            }).then(
            function () {
                return daffodildb.query({$collection:"pl.events", $filter:{"collectionid.collection":"tasks__child"}});
            }).then(
            function (events) {
                expect(events.result[0].event).to.eql("onSave");
                expect(events.result[0].function).to.eql("TaskBL.onSave");
                expect(events.result[0].pre).to.eql(true);
            }).then(
            function () {
                return daffodildb.query({$collection:"pl.actions", $filter:{"collectionid.collection":"tasks__child"}});
            }).then(
            function (actions) {
                expect(actions.result[0].id).to.eql("export");
                expect(actions.result[0].label).to.eql("Export");
                expect(actions.result[0].type).to.eql("export");
            }).then(
            function () {
                return daffodildb.query({$collection:"pl.indexes", $filter:{"collectionid.collection":"tasks__child"}});
            }).then(
            function (indexes) {
                expect(indexes.result[0].name).to.eql("Index1");
            }).then(
            function () {
                return daffodildb.query({$collection:"pl.templates", $filter:{"collectionid.collection":"tasks__child"}});
            }).then(
            function (templates) {
                expect(templates.result[0].template).to.eql("Template");
            }).then(
            function () {
                return daffodildb.query({$collection:"pl.formgroups", $filter:{"collectionid.collection":"tasks__child"}});
            }).then(
            function (formgroups) {
                expect(formgroups.result[0].title).to.eql("Address");
                expect(formgroups.result[0].showLabel).to.eql(true);
            }).then(
            function () {
                return daffodildb.query({$collection:"pl.workflowevents", $filter:{"collectionid.collection":"tasks__child"}});
            }).then(
            function (workflowevents) {
                expect(workflowevents.result[0].event).to.eql("Workflowevent");
            }).then(
            function () {
                return daffodildb.update({$collection:"pl.fields", $update:{_id:parentFieldId, $set:{visibility:true}}});
            }).then(
            function () {
                return daffodildb.query({$collection:"pl.fields", $filter:{_id:parentFieldId}});
            }).then(
            function (result) {
                expect(result.result[0].visibility).to.eql(true);
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $update:{_id:parentFieldId, $set:{ui:"grid"}}});
            }).then(
            function () {
                //for collection exist in afb_sb
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks__child1", parentCollection:"tasks"}
                ]});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"tasks", parentfieldid:{$exists:true}}});
            }).then(
            function (fields) {
                var newParentFieldId = fields.result[0].parentfieldid._id;
                expect(newParentFieldId).to.eql(parentFieldId);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.collections", $filter:{"collection":"tasks__child1"}});
            }).then(
            function (collection) {
                newCollectionid = collection.result[0]._id;
                expect(collection.result[0].historyEnabled).to.eql(true);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"tasks__child1"}, $sort:{"parentfieldid.field":-1, field:1}});
            }).then(
            function (fields) {
                expect(fields.result[0].field).to.eql("name");
                expect(fields.result[0].parentfieldid._id).to.eql(fields.result[3]._id);
                expect(fields.result[0].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[0].collectionid.collection).to.eql("tasks__child1");
                expect(fields.result[1].field).to.eql("priorityid");
                expect(fields.result[1].parentfieldid._id).to.eql(fields.result[3]._id);
                expect(fields.result[1].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[1].collectionid.collection).to.eql("tasks__child1");
                expect(fields.result[2].field).to.eql("priorityid");
                expect(fields.result[2].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[2].collectionid.collection).to.eql("tasks__child1");
                expect(fields.result[3].field).to.eql("resultInfo");
                expect(fields.result[3].ui).to.eql("grid");
                expect(fields.result[3].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[3].collectionid.collection).to.eql("tasks__child1");
                expect(fields.result[3].mainTableId._id).to.eql(parentFieldId);
                expect(fields.result[4].field).to.eql("task");
                expect(fields.result[4].collectionid._id).to.eql(newCollectionid);
                expect(fields.result[4].collectionid.collection).to.eql("tasks__child1");
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.events", $filter:{"collectionid.collection":"tasks__child1"}});
            }).then(
            function (events) {
                expect(events.result[0].event).to.eql("onSave");
                expect(events.result[0].function).to.eql("TaskBL.onSave");
                expect(events.result[0].pre).to.eql(true);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.actions", $filter:{"collectionid.collection":"tasks__child1"}});
            }).then(
            function (actions) {
                expect(actions.result[0].id).to.eql("export");
                expect(actions.result[0].label).to.eql("Export");
                expect(actions.result[0].type).to.eql("export");
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.indexes", $filter:{"collectionid.collection":"tasks__child1"}});
            }).then(
            function (indexes) {
                expect(indexes.result[0].name).to.eql("Index1");
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.templates", $filter:{"collectionid.collection":"tasks__child1"}});
            }).then(
            function (templates) {
                expect(templates.result[0].template).to.eql("Template");
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.formgroups", $filter:{"collectionid.collection":"tasks__child1"}});
            }).then(
            function (formgroups) {
                expect(formgroups.result[0].title).to.eql("Address");
                expect(formgroups.result[0].showLabel).to.eql(true);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.workflowevents", $filter:{"collectionid.collection":"tasks__child1"}});
            }).then(
            function (workflowevents) {
                expect(workflowevents.result[0].event).to.eql("Workflowevent");
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("order delivery case", function (done) {
        var afb_SbDb = undefined;
        var parentFieldId = undefined;
        var newCollectionid = undefined;
        var daffodildb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"orders"},
                    {collection:"deliveries"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"order_no", collectionid:{$query:{collection:"orders"}}, type:"string"},
                    {field:"delivery_no", collectionid:{$query:{collection:"deliveries"}}, type:"string"},
                    {field:"orderid", collectionid:{$query:{collection:"deliveries"}}, type:"fk", collection:"orders", set:["order_no"]},
                    {field:"deliveries", collectionid:{$query:{collection:"orders"}}, type:"object", multiple:true, query:JSON.stringify({$type:"child", $query:{$collection:"deliveries"}, $fk:"orderid"})}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                //for collection commit in afb.
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"orders__child", parentCollection:"orders"}
                ]});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"orders__child"}, $sort:{"parentfieldid.field":-1, field:1}});
            }).then(
            function (fields) {
                expect(fields.result).to.have.length(4);
                expect(fields.result[0].field).to.eql("delivery_no");
                expect(fields.result[0].parentfieldid._id).to.eql(fields.result[2]._id);
                expect(fields.result[0].collectionid.collection).to.eql("orders__child");
                expect(fields.result[1].field).to.eql("orderid");
                expect(fields.result[1].parentfieldid._id).to.eql(fields.result[2]._id);
                expect(fields.result[1].collectionid.collection).to.eql("orders__child");
                expect(fields.result[2].field).to.eql("deliveries");
                expect(fields.result[2].collectionid.collection).to.eql("orders__child");
                expect(fields.result[3].field).to.eql("order_no");
                expect(fields.result[3].collectionid.collection).to.eql("orders__child");
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("Saving  and query data", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var taskResult = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks", historyEnabled:true},
                    {collection:"priorities"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"name", collectionid:{$query:{collection:"priorities"}}, type:"string"},
                    {field:"task", collectionid:{$query:{collection:"tasks"}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, type:"fk", collection:"priorities", set:["name"]} ,
                    {field:"parenttaskid", collectionid:{$query:{collection:"tasks"}}, type:"fk", collection:"tasks", set:["task"]} ,
                    {field:"resultInfo", collectionid:{$query:{collection:"tasks"}}, type:"object", multiple:true},
                    {field:"name", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"fk", collection:"priorities", set:["name"]}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks__child", parentCollection:"tasks"},
                    {collection:"tasks__child1", parentCollection:"tasks"},
                    {collection:"tasks__innerchild1", parentCollection:"tasks__child"},
                    {collection:"tasks__innerchild2", parentCollection:"tasks__child"}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"});
            }).then(
            function (dbName) {
                daffodildb = dbName;
            }).then(
            function () {
                return daffodildb.update({$collection:"priorities", $insert:[
                    {name:"Low"},
                    {name:"Medium"},
                    {name:"High"}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks", $insert:[
                    {task:"task1", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]},
                    {task:"task2", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child", $insert:[
                    {task:"task3", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]},
                    {task:"task4", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]},
                    {task:"task5", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ], parenttaskid:{$query:{task:"task3"}}}
                ]});
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child1", $insert:[
                    {task:"task6", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]},
                    {task:"task7", priorityid:{$query:{name:"High"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]},
                    {task:"task8", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__innerchild1", $insert:[
                    {task:"task9", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]},
                    {task:"task90", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ], parenttaskid:{$query:{task:"task9"}}},
                    {task:"task91", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ], parenttaskid:{$query:{task:"task90"}}}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__innerchild2", $insert:[
                    {task:"task92", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]},
                    {task:"task93", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]},
                    {task:"task94", priorityid:{$query:{name:"High"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ], parenttaskid:{$query:{task:"task93"}}}
                ]})
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks", $sort:{task:1}, $fields:{task:1, __collection:1}});
            }).then(
            function (result) {
                taskResult = result.result;
                expect(result.result).to.have.length(14);
                expect(result.result[0].__collection).to.eql(undefined);
                expect(result.result[1].__collection).to.eql(undefined);
                expect(result.result[2].__collection).to.eql("tasks__child");
                expect(result.result[3].__collection).to.eql("tasks__child");
                expect(result.result[4].__collection).to.eql("tasks__child");
                expect(result.result[5].__collection).to.eql("tasks__child1");
                expect(result.result[6].__collection).to.eql("tasks__child1");
                expect(result.result[7].__collection).to.eql("tasks__child1");
                expect(result.result[8].__collection).to.eql("tasks__innerchild1");
                expect(result.result[9].__collection).to.eql("tasks__innerchild1");
                expect(result.result[10].__collection).to.eql("tasks__innerchild1");
                expect(result.result[11].__collection).to.eql("tasks__innerchild2");
                expect(result.result[12].__collection).to.eql("tasks__innerchild2");
                expect(result.result[13].__collection).to.eql("tasks__innerchild2");

            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child", $sort:{task:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(9);
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child1", $sort:{task:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__innerchild1", $sort:{task:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__innerchild2", $sort:{task:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks", $filter:{"priorityid.name":"Medium"}, $sort:{task:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(7);
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child", $filter:{"priorityid.name":"Medium"}, $sort:{task:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(5);
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child1", $filter:{"priorityid.name":"Medium"}, $sort:{task:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__innerchild1", $filter:{"priorityid.name":"Medium"}, $sort:{task:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(2);
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__innerchild2", $filter:{"priorityid.name":"Medium"}, $sort:{task:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child1", $update:{_id:taskResult[7]._id, $set:{plan:"Today"}}});
            }).then(
            function (update) {
                return daffodildb.query({$collection:"tasks__child1", $filter:{_id:taskResult[7]._id}});
            }).then(
            function (result) {
                expect(result.result[0].plan).to.eql("Today");
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__innerchild1", $update:{_id:taskResult[9]._id, $set:{plan:"Today"}}});
            }).then(
            function (update) {
                return daffodildb.query({$collection:"tasks__innerchild1", $filter:{_id:taskResult[9]._id}});
            }).then(
            function (result) {
                expect(result.result[0].plan).to.eql("Today");
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__innerchild2", $delete:{_id:taskResult[11]._id}});
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__innerchild2"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(2);
            }).then(
            function () {
                return daffodildb.mongoUpdate({$collection:"tasks__child", $update:{$query:{_id:taskResult[4]._id}, $set:{plan:"Yesterday"}}});
            }).then(
            function (update) {
                return daffodildb.query({$collection:"tasks__child", $filter:{_id:taskResult[4]._id}});
            }).then(
            function (result) {
                expect(result.result[0].plan).to.eql("Yesterday");
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child", $filter:{parenttaskid:null}, $fields:{task:1, __collection:1}, $recursion:{parenttaskid:"_id"}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(4);
                expect(result.result[0].task).to.eql("task3");
                expect(result.result[0].__collection).to.eql("tasks__child");
                expect(result.result[0].children).to.have.length(1);
                expect(result.result[0].children[0].task).to.eql("task5");
                expect(result.result[0].children[0].__collection).to.eql("tasks__child");

                expect(result.result[1].task).to.eql("task4");
                expect(result.result[1].__collection).to.eql("tasks__child");
                expect(result.result[1].children).to.eql(undefined);

                expect(result.result[2].task).to.eql("task9");
                expect(result.result[2].__collection).to.eql("tasks__innerchild1");
                expect(result.result[2].children).to.have.length(1);
                expect(result.result[2].children[0].task).to.eql("task90");
                expect(result.result[2].children[0].__collection).to.eql("tasks__innerchild1");
                expect(result.result[2].children[0].children).to.have.length(1);
                expect(result.result[2].children[0].children[0].task).to.eql("task91");
                expect(result.result[2].children[0].children[0].__collection).to.eql("tasks__innerchild1");

                expect(result.result[3].task).to.eql("task93");
                expect(result.result[3].__collection).to.eql("tasks__innerchild2");
                expect(result.result[3].children).to.have.length(1);
                expect(result.result[3].children[0].task).to.eql("task94");
                expect(result.result[3].children[0].__collection).to.eql("tasks__innerchild2");
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__innerchild1", $filter:{parenttaskid:null}, $fields:{task:1, __collection:1}, $recursion:{parenttaskid:"_id"}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].task).to.eql("task9");
                expect(result.result[0].__collection).to.eql("tasks__innerchild1");
                expect(result.result[0].children).to.have.length(1);
                expect(result.result[0].children[0].task).to.eql("task90");
                expect(result.result[0].children[0].__collection).to.eql("tasks__innerchild1");
                expect(result.result[0].children[0].children).to.have.length(1);
                expect(result.result[0].children[0].children[0].task).to.eql("task91");
                expect(result.result[0].children[0].children[0].__collection).to.eql("tasks__innerchild1");
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("Transaction rollback in data insert/update", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var taskId = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks", historyEnabled:true},
                    {collection:"priorities"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"name", collectionid:{$query:{collection:"priorities"}}, type:"string"},
                    {field:"task", collectionid:{$query:{collection:"tasks"}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, type:"fk", collection:"priorities", set:["name"]} ,
                    {field:"parenttaskid", collectionid:{$query:{collection:"tasks"}}, type:"fk", collection:"tasks", set:["task"]} ,
                    {field:"resultInfo", collectionid:{$query:{collection:"tasks"}}, type:"object", multiple:true},
                    {field:"name", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"fk", collection:"priorities", set:["name"]}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.functions", $insert:{name:"TaskBL", source:"NorthwindTestCase/lib", type:"js"}})
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks__child", parentCollection:"tasks"}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"});
            }).then(
            function (dbName) {
                daffodildb = dbName;
            }).then(
            function () {
                return daffodildb.collection("tasks");
            }).then(
            function (taskCollection) {
                return taskCollection.ensureIndex({"task":1}, {unique:true});
            }).then(
            function () {
                return daffodildb.update({$collection:"priorities", $insert:[
                    {name:"Low"},
                    {name:"Medium"},
                    {name:"High"}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks", $insert:[
                    {task:"task1", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]},
                    {task:"task2", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child", $insert:[
                    {task:"task3", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]}
                ]});
            }).then(
            function () {
                return daffodildb.startTransaction();
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child", $insert:[
                    {task:"task4", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]},
                    {task:"task2", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]}
                ]});
            }).fail(
            function (err) {
                if (err.code !== 11000) {
                    throw err;
                } else {
                    return daffodildb.rollbackTransaction();
                }
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks", $fields:{task:1, __collection:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].task).to.eql("task3");
                taskId = result.result[0]._id;
                return daffodildb.update({$collection:"tasks__child", $update:{_id:result.result[0]._id, $set:{task:"task1"}}});
            }).fail(
            function (err) {
                if (err.code !== 11000) {
                    throw err;
                }
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].task).to.eql("task3");
            }).then(
            function () {
                return daffodildb.startTransaction();
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks", $insert:[
                    {task:"task5", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]},
                    {task:"task6", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child", $insert:[
                    {task:"task3", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]}
                ]});
            }).fail(
            function (err) {
                if (err.code !== 11000) {
                    throw err;
                } else {
                    return daffodildb.rollbackTransaction();
                }
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks", $fields:{task:1, __collection:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);
            }).then(
            function () {
                return daffodildb.startTransaction();
            }).then(
            function () {
                return daffodildb.update({$collection:{collection:"tasks__child", events:[
                    {event:"onSave", function:"TaskBL.onPostSave", post:true}
                ]}, $insert:[
                    {task:"task16"},
                    {task:"task15", status:"error"}
                ]})
            }).fail(
            function (err) {
                if (err.toString().indexOf("Status with error found") >= 0) {
                    return daffodildb.rollbackTransaction();
                } else {
                    throw err;
                }
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child", $fields:{task:1, __collection:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
            }).then(
            function () {
                return daffodildb.startTransaction();
            }).then(
            function () {
                return daffodildb.update({$collection:{collection:"tasks__child", events:[
                    {event:"onSave", function:"TaskBL.onPostSave", post:true}
                ], __rootCollection:"tasks", __childCollection:["tasks__child"]}, $insert:[
                    {task:"task16"}
                ], $update:[
                    {_id:taskId, $set:{status:"error"}}
                ]})
            }).fail(
            function (err) {
                if (err.toString().indexOf("Status with error found") >= 0) {
                    return daffodildb.rollbackTransaction();
                } else {
                    throw err;
                }
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child", $fields:{task:1, __collection:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
            }).then(
            function () {
                return daffodildb.startTransaction();
            }).then(
            function () {
                return daffodildb.update({$collection:{collection:"tasks__child", events:[
                    {event:"onSave", function:"TaskBL.onPostSave", post:true}
                ], __rootCollection:"tasks", __childCollection:["tasks__child"]}, $insert:[
                    {task:"task16"}
                ], $delete:[
                    {_id:taskId}
                ]})
            }).fail(
            function (err) {
                if (err.toString().indexOf("Status with error found") >= 0) {
                    return daffodildb.rollbackTransaction();
                } else {
                    throw err;
                }
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child", $fields:{task:1, __collection:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("Transaction metadata rollback", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var taskId = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks", historyEnabled:true},
                    {collection:"priorities"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"name", collectionid:{$query:{collection:"priorities"}}, type:"string"},
                    {field:"task", collectionid:{$query:{collection:"tasks"}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, type:"fk", collection:"priorities", set:["name"]} ,
                    {field:"parenttaskid", collectionid:{$query:{collection:"tasks"}}, type:"fk", collection:"tasks", set:["task"]} ,
                    {field:"resultInfo", collectionid:{$query:{collection:"tasks"}}, type:"object", multiple:true},
                    {field:"name", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"fk", collection:"priorities", set:["name"]}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.functions", $insert:{name:"TaskBL", source:"NorthwindTestCase/lib", type:"js"}})
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.startTransaction();
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks__child", parentCollection:"tasks"}
                ]});
            }).then(
            function () {
                return afb_SbDb.rollbackTransaction();
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.collections", $filter:{collection:"tasks__child"}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(0);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"tasks__child"}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(0);
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("Cascade test", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var taskResult = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks", historyEnabled:true},
                    {collection:"priorities"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"name", collectionid:{$query:{collection:"priorities"}}, type:"string"},
                    {field:"task", collectionid:{$query:{collection:"tasks"}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, type:"fk", collection:"priorities", set:["name"]} ,
                    {field:"parenttaskid", collectionid:{$query:{collection:"tasks"}}, type:"fk", collection:"tasks", set:["task"]} ,
                    {field:"resultInfo", collectionid:{$query:{collection:"tasks"}}, type:"object", multiple:true},
                    {field:"name", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"fk", collection:"priorities", set:["name"]}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks__child", parentCollection:"tasks"}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"});
            }).then(
            function (dbName) {
                daffodildb = dbName;
            }).then(
            function () {
                return daffodildb.update({$collection:"priorities", $insert:[
                    {name:"Low"},
                    {name:"Medium"},
                    {name:"High"}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks", $insert:[
                    {task:"task1", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"Medium"}}}
                    ]},
                    {task:"task2", priorityid:{$query:{name:"Medium"}}}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child", $insert:[
                    {task:"task3", priorityid:{$query:{name:"Low"}}},
                    {task:"task4", priorityid:{$query:{name:"Medium"}}},
                    {task:"task5", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]}
                ]});
            }).then(
            function () {
                return daffodildb.update({$collection:"priorities", $delete:{$query:{name:"High"}}});
            }).fail(
            function (err) {
                if (err.toString().indexOf("Record cannot be deleted as it is referred in collection [tasks] having") === -1) {
                    throw err;
                }
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"statuses"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"name", type:"string", collectionid:{$query:{collection:"statuses"}}},
                    {field:"statusid", type:"fk", collection:"statuses", collectionid:{$query:{collection:"tasks__child"}, set:["name"]}}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"});
            }).then(
            function (dbName) {
                daffodildb = dbName;
            }).then(
            function () {
                return daffodildb.update({$collection:"statuses", $insert:[
                    {name:"New"},
                    {name:"In Progress"},
                    {name:"Completed"}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks", $insert:[
                    {task:"task21", priorityid:{$query:{name:"Medium"}}}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child", $insert:[
                    {task:"task2", priorityid:{$query:{name:"Medium"}}, statusid:{$query:{name:"Completed"}}}
                ]});
            }).then(
            function () {
                return daffodildb.update({$collection:"statuses", $delete:{$query:{name:"Completed"}}});
            }).fail(
            function (err) {
                if (err.toString().indexOf("Record cannot be deleted as it is referred in collection [tasks__child] having") === -1) {
                    throw err;
                }
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"referredtasks"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"name", type:"string", collectionid:{$query:{collection:"referredtasks"}}},
                    {field:"taskid", type:"fk", collection:"tasks__child", collectionid:{$query:{collection:"referredtasks"}, set:["task"]}}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"});
            }).then(
            function (dbName) {
                daffodildb = dbName;
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child", $insert:[
                    {task:"task21", priorityid:{$query:{name:"Medium"}}}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"referredtasks", $insert:[
                    {"name":"task", taskid:{$query:{task:"task21"}}}
                ]});
            }).then(
            function (result) {
                return daffodildb.update({$collection:"referredtasks", $delete:{$query:{name:"task"}}});
            }).fail(
            function (err) {
                if (err.toString().indexOf("Record cannot be deleted as it is referred in collection [referredtasks] having") === -1) {
                    throw err;
                }
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("upsert in child collection", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var taskResult = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks", historyEnabled:true},
                    {collection:"priorities"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"name", collectionid:{$query:{collection:"priorities"}}, type:"string"},
                    {field:"task", collectionid:{$query:{collection:"tasks"}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, type:"fk", collection:"priorities", set:["name"]} ,
                    {field:"resultInfo", collectionid:{$query:{collection:"tasks"}}, type:"object", multiple:true},
                    {field:"name", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"fk", collection:"priorities", set:["name"]}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks__child", parentCollection:"tasks"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"parenttaskid", collectionid:{$query:{collection:"tasks__child"}}, type:"fk", collection:"tasks__child", set:["task"], upsert:true}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"});
            }).then(
            function (dbName) {
                daffodildb = dbName;
            }).then(
            function () {
                return daffodildb.update({$collection:"priorities", $insert:[
                    {name:"Low"},
                    {name:"Medium"},
                    {name:"High"}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks", $insert:[
                    {task:"task1", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]},
                    {task:"task2", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child", $insert:[
                    {task:"task3", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]},
                    {task:"task4", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]},
                    {task:"task5", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ], parenttaskid:{$query:{task:"task6"}}}
                ]});
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks", $fields:{task:1, __collection:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(6);
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(4);
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child", $insert:[
                    {task:"task7", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ], parenttaskid:{$query:{task:"task1"}}}
                ]});
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks", $fields:{task:1, __collection:1}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(8);
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(6);
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("function in filter", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var taskResult = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks", historyEnabled:true},
                    {collection:"priorities"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"name", collectionid:{$query:{collection:"priorities"}}, type:"string"},
                    {field:"task", collectionid:{$query:{collection:"tasks"}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, type:"fk", collection:"priorities", set:["name"]} ,
                    {field:"resultInfo", collectionid:{$query:{collection:"tasks"}}, type:"object", multiple:true},
                    {field:"name", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, parentfieldid:{$query:{field:"resultInfo", collectionid:{$query:{collection:"tasks"}}}}, type:"fk", collection:"priorities", set:["name"]}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.functions", $insert:{name:"TaskBL", source:"NorthwindTestCase/lib", type:"js"}})
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks__child", parentCollection:"tasks"}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"});
            }).then(
            function (dbName) {
                daffodildb = dbName;
            }).then(
            function () {
                return daffodildb.update({$collection:"priorities", $insert:[
                    {name:"Low"},
                    {name:"Medium"},
                    {name:"High"}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks", $insert:[
                    {task:"task1", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]},
                    {task:"task2", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child", $insert:[
                    {task:"task3", priorityid:{$query:{name:"Low"}}, resultInfo:[
                        {name:"result1", priorityid:{$query:{name:"Low"}}},
                        {name:"result2", priorityid:{$query:{name:"High"}}}
                    ]},
                    {task:"task4", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]},
                    {task:"task5", priorityid:{$query:{name:"Medium"}}, resultInfo:[
                        {name:"result3", priorityid:{$query:{name:"High"}}},
                        {name:"result2", priorityid:{$query:{name:"Low"}}}
                    ]}
                ]});
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks", $fields:{task:1, __collection:1}, $filter:{"priorityid.name":"$$TaskBL.getPriority"}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(2);
            }).then(
            function () {
                return daffodildb.query({$collection:"childcollection"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(0);
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child", $fields:{task:1, __collection:1}, $filter:{"priorityid.name":"$$TaskBL.getPriority"}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
            }).then(
            function () {
                return daffodildb.query({$collection:"childcollection"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].collection).to.eql("tasks__child");
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("sequence column in child", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var taskResult = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks", historyEnabled:true}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"task", collectionid:{$query:{collection:"tasks"}}, type:"string"},
                    {field:"series", collectionid:{$query:{collection:"tasks"}}, type:"sequence"}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks__child", parentCollection:"tasks"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"childseries", collectionid:{$query:{collection:"tasks__child"}}, type:"sequence"}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"});
            }).then(
            function (dbName) {
                daffodildb = dbName;
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks", $insert:[
                    {task:"task1", "series":"daffodilsw"},
                    {task:"task2", "series":"daffodilsw"}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child", $insert:[
                    {task:"task3", "childseries":"daffodilswchild"},
                    {task:"task4", "childseries":"daffodilsw"}
                ]});
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks"});
            }).then(
            function (result) {
                expect(result.result).to.have.length(4);
                expect(result.result[0].task).to.eql("task1");
                expect(result.result[1].task).to.eql("task2");
                expect(result.result[2].task).to.eql("task3");
                expect(result.result[3].task).to.eql("task4");
                expect(result.result[0].series).to.eql("daffodilsw1");
                expect(result.result[1].series).to.eql("daffodilsw2");
                expect(result.result[2].childseries).to.eql("daffodilswchild1");
                expect(result.result[3].childseries).to.eql("daffodilsw1");
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("replicate set fields test", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var taskResult = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"departments"},
                    {collection:"employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"name", collectionid:{$query:{collection:"departments"}}, type:"string"},
                    {field:"name", collectionid:{$query:{collection:"employees"}}, type:"string"},
                    {field:"emp_dept_id", collectionid:{$query:{collection:"employees"}}, type:"fk", collection:"departments", set:["name"]}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"teachers__employees", parentCollection:"employees"},
                    {collection:"teacherdetails"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"teacher_dept_id", collectionid:{$query:{collection:"teachers__employees"}}, type:"fk", collection:"departments", set:["name"]},
                    {field:"name", collectionid:{$query:{collection:"teacherdetails"}}, type:"string"},
                    {field:"teacherid", collectionid:{$query:{collection:"teacherdetails"}}, type:"fk", collection:"teachers__employees", set:["name"]}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"});
            }).then(
            function (dbName) {
                daffodildb = dbName;
            }).then(
            function () {
                return daffodildb.update({$collection:"departments", $insert:[
                    {name:"d1"},
                    {name:"d2"},
                    {name:"d3"},
                    {name:"d4"},
                    {name:"d5"}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"employees", $insert:[
                    {name:"e1", emp_dept_id:{$query:{name:"d1"}}},
                    {name:"e2", emp_dept_id:{$query:{name:"d3"}}},
                    {name:"e3", emp_dept_id:{$query:{name:"d2"}}},
                    {name:"e4", emp_dept_id:{$query:{name:"d1"}}}
                ]});
            }).then(
            function () {
                return daffodildb.update({$collection:"teachers__employees", $insert:[
                    {name:"t1", emp_dept_id:{$query:{name:"d1"}}, teacher_dept_id:{$query:{name:"d3"}}},
                    {name:"t2", emp_dept_id:{$query:{name:"d3"}}, teacher_dept_id:{$query:{name:"d2"}}},
                    {name:"t3", emp_dept_id:{$query:{name:"d2"}}, teacher_dept_id:{$query:{name:"d1"}}},
                    {name:"t4", emp_dept_id:{$query:{name:"d1"}}, teacher_dept_id:{$query:{name:"d5"}}},
                    {name:"t5", emp_dept_id:{$query:{name:"d4"}}, teacher_dept_id:{$query:{name:"d1"}}}
                ]});
            }).then(
            function () {
                return daffodildb.update({$collection:"teacherdetails", $insert:[
                    {name:"t22", teacherid:{$query:{name:"t1"}}},
                    {name:"t33", teacherid:{$query:{name:"t2"}}},
                    {name:"t4", teacherid:{$query:{name:"t3"}}}
                ]});
            }).then(
            function () {
                return daffodildb.startTransaction();
            }).then(
            function () {
                return daffodildb.query({$collection:"departments", $sort:{name:1}, $filter:{name:{$in:["d2", "d5"]}}});
            }).then(
            function (departments) {
                var batchUpdates = [
                    {
                        $collection:"departments",
                        $update:[
                            {
                                _id:departments.result[0]._id,
                                $set:{name:"d22"}
                            } ,
                            {
                                _id:departments.result[1]._id,
                                $set:{name:"d55"}
                            }
                        ]
                    }
                ];
                return daffodildb.update(batchUpdates);
            }).then(
            function () {
                return daffodildb.commitTransaction({sync:true});
            }).then(
            function () {
                return daffodildb.query({$collection:"employees", $sort:{name:1}, $fields:{name:1}, $filter:{$or:[
                    {"emp_dept_id.name":{$in:["d22", "d55"]}},
                    {"teacher_dept_id.name":{$in:["d22", "d55"]}}
                ]}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(4);
                expect(result.result[0].name).to.eql("e3");
                expect(result.result[1].name).to.eql("t2");
                expect(result.result[2].name).to.eql("t3");
                expect(result.result[3].name).to.eql("t4");

            }).then(
            function () {
                return daffodildb.query({$collection:"teachers__employees", $fields:{name:1}, $sort:{name:1}, $filter:{$or:[
                    {"emp_dept_id.name":{$in:["d22", "d55"]}},
                    {"teacher_dept_id.name":{$in:["d22", "d55"]}}
                ]}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(3);
                expect(result.result[0].name).to.eql("t2");
                expect(result.result[1].name).to.eql("t3");
                expect(result.result[2].name).to.eql("t4");
            }).then(
            function () {
                return daffodildb.startTransaction();
            }).then(
            function () {
                return daffodildb.query({$collection:"teachers__employees", $sort:{name:1}, $filter:{name:{$in:["t2", "t4"]}}});
            }).then(
            function (departments) {
                var batchUpdates = [
                    {
                        $collection:"teachers__employees",
                        $update:[
                            {
                                _id:departments.result[0]._id,
                                $set:{name:"t222"}
                            } ,
                            {
                                _id:departments.result[1]._id,
                                $set:{name:"t444"}
                            }
                        ]
                    }
                ];
                return daffodildb.update(batchUpdates);
            }).then(
            function () {
                return daffodildb.commitTransaction({sync:true});
            }).then(
            function () {
                return daffodildb.query({$collection:"teacherdetails", $sort:{name:1}, $filter:{"teacherid.name":{$in:["t222", "t444"]}}});
            }).then(
            function (result) {
                expect(result.result).to.have.length(1);
                expect(result.result[0].name).to.eql("t33");
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("Query Aggregate Data", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var taskResult = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks", historyEnabled:true},
                    {collection:"priorities"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"name", collectionid:{$query:{collection:"priorities"}}, type:"string"},
                    {field:"task", collectionid:{$query:{collection:"tasks"}}, type:"string"},
                    {field:"priorityid", collectionid:{$query:{collection:"tasks"}}, type:"fk", collection:"priorities", set:["name"]},
                    {field:"esthrs", type:"duration", collectionid:{$query:{collection:"tasks"}}}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks__child", parentCollection:"tasks"}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"});
            }).then(
            function (dbName) {
                daffodildb = dbName;
            }).then(
            function () {
                return daffodildb.update({$collection:"priorities", $insert:[
                    {name:"Low"},
                    {name:"Medium"},
                    {name:"High"}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks", $insert:[
                    {task:"task1", priorityid:{$query:{name:"Low"}}, esthrs:{time:2, unit:"Hrs"}},
                    {task:"task2", priorityid:{$query:{name:"Medium"}}, esthrs:{time:5, unit:"Hrs"}}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"tasks__child", $insert:[
                    {task:"task3", priorityid:{$query:{name:"Low"}}, esthrs:{time:4, unit:"Hrs"}},
                    {task:"task4", priorityid:{$query:{name:"Medium"}}, esthrs:{time:6, unit:"Hrs"}}
                ]})
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks", $group:{_id:null, esthrs:{$sum:"$esthrs"}}});
            }).then(
            function (result) {
                expect(result.result[0].esthrs.time).to.eql(17);
                expect(result.result[0].esthrs.unit).to.eql("Hrs");
            }).then(
            function () {
                return daffodildb.query({$collection:"tasks__child", $group:{_id:null, esthrs:{$sum:"$esthrs"}}});
            }).then(
            function (result) {
                expect(result.result[0].esthrs.time).to.eql(10);
                expect(result.result[0].esthrs.unit).to.eql("Hrs");
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("SubQuery", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var taskResult = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"departments"},
                    {collection:"employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"name", collectionid:{$query:{collection:"departments"}}, type:"string"},
                    {field:"name", collectionid:{$query:{collection:"employees"}}, type:"string"},
                    {field:"emp_dept_id", collectionid:{$query:{collection:"employees"}}, type:"fk", collection:"departments", set:["name"]}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"teachers__employees", parentCollection:"employees"},
                    {collection:"teacherdetails"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"teacher_dept_id", collectionid:{$query:{collection:"teachers__employees"}}, type:"fk", collection:"departments", set:["name"]},
                    {field:"name", collectionid:{$query:{collection:"teacherdetails"}}, type:"string"},
                    {field:"rank", collectionid:{$query:{collection:"teachers__employees"}}, type:"number"},
                    {field:"teacherid", collectionid:{$query:{collection:"teacherdetails"}}, type:"fk", collection:"teachers__employees", set:["name"]}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"});
            }).then(
            function (dbName) {
                daffodildb = dbName;
            }).then(
            function () {
                return daffodildb.update({$collection:"departments", $insert:[
                    {name:"d1"},
                    {name:"d2"},
                    {name:"d3"},
                    {name:"d4"},
                    {name:"d5"}
                ]})
            }).then(
            function () {
                return daffodildb.update({$collection:"employees", $insert:[
                    {name:"e1", emp_dept_id:{$query:{name:"d1"}}},
                    {name:"e2", emp_dept_id:{$query:{name:"d3"}}},
                    {name:"e3", emp_dept_id:{$query:{name:"d2"}}},
                    {name:"e4", emp_dept_id:{$query:{name:"d1"}}}
                ]});
            }).then(
            function () {
                return daffodildb.update({$collection:"teachers__employees", $insert:[
                    {name:"t1", rank:1, emp_dept_id:{$query:{name:"d1"}}, teacher_dept_id:{$query:{name:"d3"}}},
                    {name:"t2", rank:2, emp_dept_id:{$query:{name:"d3"}}, teacher_dept_id:{$query:{name:"d2"}}},
                    {name:"t3", rank:3, emp_dept_id:{$query:{name:"d2"}}, teacher_dept_id:{$query:{name:"d1"}}},
                    {name:"t4", rank:5, emp_dept_id:{$query:{name:"d1"}}, teacher_dept_id:{$query:{name:"d5"}}},
                    {name:"t5", rank:4, emp_dept_id:{$query:{name:"d4"}}, teacher_dept_id:{$query:{name:"d1"}}}
                ]});
            }).then(
            function () {
                return daffodildb.update({$collection:"teacherdetails", $insert:[
                    {name:"t11", teacherid:{$query:{name:"t1"}}},
                    {name:"t22", teacherid:{$query:{name:"t1"}}},
                    {name:"t33", teacherid:{$query:{name:"t2"}}},
                    {name:"t44", teacherid:{$query:{name:"t3"}}}
                ]});
            }).then(
            function () {
                return daffodildb.query({$collection:"teacherdetails", $fields:{name:1, teacherInfos:{
                    $query:{
                        $collection:"teachers__employees",
                        $fields:{name:1, rank:1}
                    },
                    $fk:"_id", $parent:"teacherid"
                }
                }
                });
            }).then(
            function (result) {
                expect(result.result).to.have.length(4)
                expect(result.result[0].name).to.eql("t11");
                expect(result.result[0].teacherInfos.name).to.eql("t1");
                expect(result.result[0].teacherInfos.rank).to.eql(1);
                expect(result.result[1].name).to.eql("t22");
                expect(result.result[1].teacherInfos.name).to.eql("t1");
                expect(result.result[1].teacherInfos.rank).to.eql(1);
                expect(result.result[2].name).to.eql("t33");
                expect(result.result[2].teacherInfos.name).to.eql("t2");
                expect(result.result[2].teacherInfos.rank).to.eql(2);
                expect(result.result[3].name).to.eql("t44");
                expect(result.result[3].teacherInfos.name).to.eql("t3");
                expect(result.result[3].teacherInfos.rank).to.eql(3);
            }).then(
            function () {
                return daffodildb.query({$collection:"teachers__employees", $fields:{name:1, teacherDetailCount:{
                    "$type":{"scalar":"count"},
                    $query:{
                        $collection:"teacherdetails",
                        $group:{_id:null, count:{$sum:1}}
                    },
                    $fk:"teacherid"
                }
                }, $sort:{name:1}
                });
            }).then(
            function (result) {
                expect(result.result).to.have.length(5)
                expect(result.result[0].name).to.eql("t1");
                expect(result.result[0].teacherDetailCount).to.eql(2);
                expect(result.result[1].name).to.eql("t2");
                expect(result.result[1].teacherDetailCount).to.eql(1);
                expect(result.result[2].name).to.eql("t3");
                expect(result.result[2].teacherDetailCount).to.eql(1);
                expect(result.result[3].name).to.eql("t4");
                expect(result.result[3].teacherDetailCount).to.eql(undefined);
                expect(result.result[4].name).to.eql("t5");
                expect(result.result[4].teacherDetailCount).to.eql(undefined);
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("update field in not allowed in child if field create in parent", function (done) {
        var afb_SbDb = undefined;
        var parentFieldId = undefined;
        var fieldId = undefined;
        var daffodildb = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"priorities"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"name", collectionid:{$query:{collection:"priorities"}}, type:"string"}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"});
            }).then(
            function (dbName) {
                daffodildb = dbName;
            }).then(
            function () {
                return daffodildb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"priorities"}, $sort:{"parentfieldid.field":-1, field:1}});
            }).then(
            function (fields) {
                fieldId = fields.result[0]._id;
                return daffodildb.update({$collection:"pl.fields", $update:{_id:fieldId, $set:{type:"number"}}});
            }).fail(
            function (err) {
                done(err);
            }).then(
            function () {
                return daffodildb.update({$collection:"pl.fields", $update:{_id:fieldId, $set:{field:"name1"}}});
            }).fail(
            function (err) {
                if (err.toString().indexOf("Field can not be updated in fields in db") === -1) {
                    throw err;
                }
            }).then(
            function () {
                return daffodildb.update({$collection:"pl.fields", $update:{_id:fieldId, $set:{type:"currency"}}});
            }).fail(
            function (err) {
                if (err.toString().indexOf("Type can not be updated in fields in db") === -1) {
                    throw err;
                }
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("copy inserted data of parent in child collection", function (done) {
        var afb_SbDb = undefined;
        var parentFieldId = undefined;
        var ageId = undefined;
        var amountId = undefined;
        var innerAmountId = undefined;
        var desginationId = undefined;
        var dobId = undefined;
        var fkFieldid = undefined;
        var fnameId = undefined;
        var infosId = undefined;
        var line1Id = undefined;
        var line2Id = undefined;
        var line3Id = undefined;
        var nameId = undefined;
        var typeId = undefined;

        var teacherId = undefined;
        var pgTeacherId = undefined;
        var ugTeacherId = undefined;

        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return insertCommonData(afb_SbDb);
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"teachers__employees", parentCollection:"employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"designation", collectionid:{$query:{collection:"teachers__employees"}}, type:"string"},
                    {field:"age", collectionid:{$query:{collection:"teachers__employees"}}, type:"string"},
                    {field:"line2", collectionid:{$query:{collection:"teachers__employees"}}, type:"string", parentfieldid:{$query:{field:"infos", collectionid:{$query:{collection:"teachers__employees"}}}}}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"pg__teachers", parentCollection:"teachers__employees"},
                    {collection:"ug__teachers", parentCollection:"teachers__employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"fname", collectionid:{$query:{collection:"employees"}}, type:"string"},
                    {field:"dob", collectionid:{$query:{collection:"pg__teachers"}}, type:"string"},
                    {field:"line3", collectionid:{$query:{collection:"employees"}}, type:"string", parentfieldid:{$query:{field:"infos", collectionid:{$query:{collection:"employees"}}}}},
                    {field:"ug_line1", collectionid:{$query:{collection:"ug__teachers"}}, type:"string", parentfieldid:{$query:{field:"infos", collectionid:{$query:{collection:"ug__teachers"}}}}}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"employees"}, $sort:{field:1}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(9);
                expect(fieldsData.result[0].field).to.eql("amount");
                amountId = fieldsData.result[0]._id;
                expect(fieldsData.result[1].field).to.eql("amount");
                innerAmountId = fieldsData.result[1]._id;
                expect(fieldsData.result[2].field).to.eql("fkField");
                fkFieldid = fieldsData.result[2]._id;
                expect(fieldsData.result[3].field).to.eql("fname");
                fnameId = fieldsData.result[3]._id;
                expect(fieldsData.result[4].field).to.eql("infos");
                infosId = fieldsData.result[4]._id;
                expect(fieldsData.result[5].field).to.eql("line1");
                line1Id = fieldsData.result[5]._id;
                expect(fieldsData.result[6].field).to.eql("line3");
                line3Id = fieldsData.result[6]._id;
                expect(fieldsData.result[7].field).to.eql("name");
                nameId = fieldsData.result[7]._id;
                expect(fieldsData.result[8].field).to.eql("type");
                typeId = fieldsData.result[8]._id;

//                console.log("first expect.....")

            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.collections", $sort:{collection:1}, $fields:{_id:1, collection:1}, $filter:{collection:{$in:["teachers__employees", "ug__teachers", "pg__teachers"]}}})
            }).then(
            function (collectionData) {
//                console.log("collectionData......" + JSON.stringify(collectionData))
                pgTeacherId = collectionData.result[0]._id;
                teacherId = collectionData.result[1]._id;
                ugTeacherId = collectionData.result[2]._id;

                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"teachers__employees"}, $sort:{field:1}});
            }).then(
            function (fieldsData) {
//                console.log("fieldsData....." + JSON.stringify(fieldsData))
                expect(fieldsData.result).to.have.length(12);
                expect(fieldsData.result[0].field).to.eql("age");
                expect(fieldsData.result[0].collectionid._id).to.eql(teacherId);
                ageId = fieldsData.result[0]._id;

                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[1].mainTableId._id).to.eql(amountId);
                amountId = fieldsData.result[1]._id;
                expect(fieldsData.result[1].collectionid._id).to.eql(teacherId);

                expect(fieldsData.result[2].field).to.eql("amount");
                expect(fieldsData.result[2].mainTableId._id).to.eql(innerAmountId);
                innerAmountId = fieldsData.result[2]._id;
                expect(fieldsData.result[2].collectionid._id).to.eql(teacherId);

                expect(fieldsData.result[3].field).to.eql("designation");
                desginationId = fieldsData.result[3]._id;
                expect(fieldsData.result[3].collectionid._id).to.eql(teacherId);

                expect(fieldsData.result[4].field).to.eql("fkField");
                expect(fieldsData.result[4].mainTableId._id).to.eql(fkFieldid);
                fkFieldid = fieldsData.result[4]._id;
                expect(fieldsData.result[4].collectionid._id).to.eql(teacherId);

                expect(fieldsData.result[4].collectionid._id).to.eql(teacherId);
                expect(fieldsData.result[5].field).to.eql("fname");
                expect(fieldsData.result[5].mainTableId._id).to.eql(fnameId);
                fnameId = fieldsData.result[5]._id;
                expect(fieldsData.result[5].collectionid._id).to.eql(teacherId);

                expect(fieldsData.result[6].field).to.eql("infos");
                expect(fieldsData.result[6].mainTableId._id).to.eql(infosId);
                parentFieldId = fieldsData.result[6]._id;
                infosId = fieldsData.result[6]._id;
                expect(fieldsData.result[6].collectionid._id).to.eql(teacherId);

                expect(fieldsData.result[7].field).to.eql("line1");
                expect(fieldsData.result[7].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[7].mainTableId._id).to.eql(line1Id);
                line1Id = fieldsData.result[7]._id;
                expect(fieldsData.result[7].collectionid._id).to.eql(teacherId);

                expect(fieldsData.result[8].field).to.eql("line2");
                expect(fieldsData.result[8].parentfieldid._id).to.eql(parentFieldId);
                line2Id = fieldsData.result[8]._id;
                expect(fieldsData.result[8].collectionid._id).to.eql(teacherId);

                expect(fieldsData.result[9].field).to.eql("line3");
                expect(fieldsData.result[9].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[9].mainTableId._id).to.eql(line3Id);
                line3Id = fieldsData.result[9]._id;
                expect(fieldsData.result[9].collectionid._id).to.eql(teacherId);

                expect(fieldsData.result[10].field).to.eql("name");
                expect(fieldsData.result[10].mainTableId._id).to.eql(nameId);
                nameId = fieldsData.result[10]._id;
                expect(fieldsData.result[10].collectionid._id).to.eql(teacherId);

                expect(fieldsData.result[11].field).to.eql("type");
                expect(fieldsData.result[11].mainTableId._id).to.eql(typeId);
                typeId = fieldsData.result[11]._id;
                expect(fieldsData.result[11].collectionid._id).to.eql(teacherId);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"ug__teachers"}, $sort:{field:1}});
            }).then(
            function (fieldsData) {
//                console.log("fieldsData....." + JSON.stringify(fieldsData))
                expect(fieldsData.result).to.have.length(13);
                expect(fieldsData.result[0].field).to.eql("age");
                expect(fieldsData.result[0].mainTableId._id).to.eql(ageId);
                expect(fieldsData.result[0].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[1].mainTableId._id).to.eql(amountId);
                expect(fieldsData.result[1].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[2].field).to.eql("amount");
                expect(fieldsData.result[2].mainTableId._id).to.eql(innerAmountId);
                expect(fieldsData.result[2].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[3].field).to.eql("designation");
                expect(fieldsData.result[3].mainTableId._id).to.eql(desginationId);
                expect(fieldsData.result[3].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[4].field).to.eql("fkField");
                expect(fieldsData.result[4].mainTableId._id).to.eql(fkFieldid);
                expect(fieldsData.result[4].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[5].field).to.eql("fname");
                expect(fieldsData.result[5].mainTableId._id).to.eql(fnameId);
                expect(fieldsData.result[5].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[6].field).to.eql("infos");
                expect(fieldsData.result[6].mainTableId._id).to.eql(infosId);
                parentFieldId = fieldsData.result[6]._id;
                expect(fieldsData.result[6].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[7].field).to.eql("line1");
                expect(fieldsData.result[7].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[7].mainTableId._id).to.eql(line1Id);
                expect(fieldsData.result[7].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[8].field).to.eql("line2");
                expect(fieldsData.result[8].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[8].mainTableId._id).to.eql(line2Id);
                expect(fieldsData.result[8].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[9].field).to.eql("line3");
                expect(fieldsData.result[9].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[9].mainTableId._id).to.eql(line3Id);
                expect(fieldsData.result[9].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[10].field).to.eql("name");
                expect(fieldsData.result[10].mainTableId._id).to.eql(nameId);
                expect(fieldsData.result[10].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[11].field).to.eql("type");
                expect(fieldsData.result[11].mainTableId._id).to.eql(typeId);
                expect(fieldsData.result[11].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[12].field).to.eql("ug_line1");
                expect(fieldsData.result[12].collectionid._id).to.eql(ugTeacherId);
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"infos1", collectionid:{$query:{collection:"employees"}}, type:"object", multiple:true },
                    {field:"infos1_line", collectionid:{$query:{collection:"employees"}}, type:"string", parentfieldid:{$query:{field:"infos1", collectionid:{$query:{collection:"employees"}}}}}
                ]});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"ug__teachers"}, $sort:{field:1}});
            }).then(
            function (fieldsData) {
//                console.log("fieldsData....." + JSON.stringify(fieldsData))
                expect(fieldsData.result).to.have.length(15);
                expect(fieldsData.result[0].field).to.eql("age");
                expect(fieldsData.result[0].mainTableId._id).to.eql(ageId);
                expect(fieldsData.result[0].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[1].mainTableId._id).to.eql(amountId);
                expect(fieldsData.result[1].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[2].field).to.eql("amount");
                expect(fieldsData.result[2].mainTableId._id).to.eql(innerAmountId);
                expect(fieldsData.result[2].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[3].field).to.eql("designation");
                expect(fieldsData.result[3].mainTableId._id).to.eql(desginationId);
                expect(fieldsData.result[3].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[4].field).to.eql("fkField");
                expect(fieldsData.result[4].mainTableId._id).to.eql(fkFieldid);
                expect(fieldsData.result[4].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[5].field).to.eql("fname");
                expect(fieldsData.result[5].mainTableId._id).to.eql(fnameId);
                expect(fieldsData.result[5].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[6].field).to.eql("infos");
                expect(fieldsData.result[6].mainTableId._id).to.eql(infosId);
                parentFieldId = fieldsData.result[6]._id;
                expect(fieldsData.result[6].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[7].field).to.eql("infos1");
                parentFieldId2 = fieldsData.result[7]._id;
                expect(fieldsData.result[7].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[8].field).to.eql("infos1_line");
                expect(fieldsData.result[8].parentfieldid._id).to.eql(parentFieldId2);

                expect(fieldsData.result[8].collectionid._id).to.eql(ugTeacherId);


                expect(fieldsData.result[9].field).to.eql("line1");
                expect(fieldsData.result[9].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[9].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[10].field).to.eql("line2");
                expect(fieldsData.result[10].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[10].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[11].field).to.eql("line3");
                expect(fieldsData.result[11].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[11].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[12].field).to.eql("name");
                expect(fieldsData.result[12].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[13].field).to.eql("type");
                expect(fieldsData.result[13].collectionid._id).to.eql(ugTeacherId);

                expect(fieldsData.result[14].field).to.eql("ug_line1");
                expect(fieldsData.result[14].collectionid._id).to.eql(ugTeacherId);
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    });

    it("copy deleted data of parent in multiple child collection", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var parentFieldId = undefined;
        var parentFieldId2 = undefined;
        var amountId = undefined;
        var infoId = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return insertCommonData(afb_SbDb);
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"teachers__employees", parentCollection:"employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"designation", collectionid:{$query:{collection:"teachers__employees"}}, type:"string"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"pg__teachers", parentCollection:"teachers__employees"},
                    {collection:"ug__teachers", parentCollection:"teachers__employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"city", collectionid:{$query:{collection:"employees"}}, type:"string"},
                    {field:"line2", collectionid:{$query:{collection:"employees"}}, type:"string", parentfieldid:{$query:{field:"infos", collectionid:{$query:{collection:"employees"}}}}}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"teachers__employees"}});
            }).then(
            function (fieldsData) {

                expect(fieldsData.result).to.have.length(10);
                amountId = fieldsData.result[0]._id;
                expect(fieldsData.result[0].field).to.eql("amount");
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[2].field).to.eql("city");
                expect(fieldsData.result[3].field).to.eql("designation");
                expect(fieldsData.result[4].field).to.eql("fkField");
                expect(fieldsData.result[5].field).to.eql("infos");
                parentFieldId = fieldsData.result[5]._id;
                infoId = fieldsData.result[5]._id;
                expect(fieldsData.result[6].field).to.eql("line1");
                expect(fieldsData.result[6].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[7].field).to.eql("line2");
                expect(fieldsData.result[7].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[8].field).to.eql("name");
                expect(fieldsData.result[9].field).to.eql("type");

            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"teachers__employees", field:{"$in":["infos"]}}});
            }).then(
            function (fieldsData) {
                return afb_SbDb.update({$collection:"pl.fields", $update:[
                    {_id:fieldsData.result[0]._id, $set:{mandatory:true}}
                ]})

            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"pg__teachers", field:{"$in":["infos"]}}});
            }).then(
            function (fieldsData) {
                return afb_SbDb.update({$collection:"pl.fields", $update:[
                    {_id:fieldsData.result[0]._id, $set:{mandatory:true}}
                ]})

            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"employees", field:{"$in":["amount", "infos"]}}});
            }).then(
            function (fieldsData) {
                amountId = fieldsData.result[0]._id;
                infoId = fieldsData.result[2]._id;
                return afb_SbDb.update({$collection:"pl.fields", $delete:[
                    {_id:amountId},
                    {_id:infoId}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"teachers__employees"}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(4);
                expect(fieldsData.result[0].field).to.eql("city");
                expect(fieldsData.result[1].field).to.eql("designation");
                expect(fieldsData.result[2].field).to.eql("fkField");
                expect(fieldsData.result[3].field).to.eql("name");

                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"pg__teachers"}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(4);
                expect(fieldsData.result[0].field).to.eql("city");
                expect(fieldsData.result[1].field).to.eql("designation");
                expect(fieldsData.result[2].field).to.eql("fkField");
                expect(fieldsData.result[3].field).to.eql("name");

                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"ug__teachers"}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(4);
                expect(fieldsData.result[0].field).to.eql("city");
                expect(fieldsData.result[1].field).to.eql("designation");
                expect(fieldsData.result[2].field).to.eql("fkField");
                expect(fieldsData.result[3].field).to.eql("name");

            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("copy updated data of parent in multiple child collection", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var infoId = undefined;
        var cityId = undefined;
        var parentFieldId = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return insertCommonData(afb_SbDb);
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"teachers__employees", parentCollection:"employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"pg__teachers", parentCollection:"teachers__employees"},
                    {collection:"ug__teachers", parentCollection:"teachers__employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"designation", collectionid:{$query:{collection:"teachers__employees"}}, type:"string"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"city", collectionid:{$query:{collection:"employees"}}, type:"string"},
                    {field:"line2", collectionid:{$query:{collection:"employees"}}, type:"string", parentfieldid:{$query:{field:"infos", collectionid:{$query:{collection:"employees"}}}}}
                ]});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"pg__teachers", field:{$in:["infos", "city"]}}})
            }).then(
            function (fieldsData) {
                cityId = fieldsData.result[0]._id;
                infoId = fieldsData.result[1]._id;

                return afb_SbDb.update({$collection:"pl.fields", $update:[
                    {_id:cityId, $set:{filterable:false, mandatory:true}},
                    {_id:infoId, $set:{mandatory:false}}
                ]})
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"teachers__employees"}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(10);

                expect(fieldsData.result[0].field).to.eql("amount");
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[2].field).to.eql("city");
                cityId = fieldsData.result[2]._id;
                expect(fieldsData.result[3].field).to.eql("designation");
                expect(fieldsData.result[4].field).to.eql("fkField");
                expect(fieldsData.result[5].field).to.eql("infos");

                infoId = fieldsData.result[5]._id;
                parentFieldId = fieldsData.result[5]._id;
                expect(fieldsData.result[6].field).to.eql("line1");
                expect(fieldsData.result[6].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[7].field).to.eql("line2");
                expect(fieldsData.result[7].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[8].field).to.eql("name");
                expect(fieldsData.result[9].field).to.eql("type");

                return afb_SbDb.update({$collection:"pl.fields", $update:[
                    {_id:cityId, $set:{filterable:true, mandatory:true}},
                    {_id:infoId, $set:{mandatory:true}}
                ]})

            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"employees", field:"city"}, $fields:{_id:1}});
            }).then(
            function (fieldsdata) {
                return afb_SbDb.update({$collection:"pl.fields", $update:{_id:fieldsdata.result[0]._id, $set:{mandatory:false, sortable:true}}});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"teachers__employees", field:"infos"}, $fields:{_id:1}});
            }).then(
            function (fieldsdata) {
                return afb_SbDb.update({$collection:"pl.fields", $update:{_id:fieldsdata.result[0]._id, $set:{sortable:true, filterable:false}}});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"teachers__employees"}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(10);

                expect(fieldsData.result[0].field).to.eql("amount");
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[2].field).to.eql("city");
                expect(fieldsData.result[2].filterable).to.eql(true);
                expect(fieldsData.result[2].mandatory).to.eql(true);
                expect(fieldsData.result[2].sortable).to.eql(true);
                expect(fieldsData.result[3].field).to.eql("designation");
                expect(fieldsData.result[4].field).to.eql("fkField");
                expect(fieldsData.result[5].field).to.eql("infos");
                parentFieldId = fieldsData.result[5]._id;
                expect(fieldsData.result[5].filterable).to.eql(false);
                expect(fieldsData.result[5].mandatory).to.eql(true);
                expect(fieldsData.result[5].sortable).to.eql(true);
                expect(fieldsData.result[6].field).to.eql("line1");
                expect(fieldsData.result[6].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[7].field).to.eql("line2");
                expect(fieldsData.result[7].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[8].field).to.eql("name");
                expect(fieldsData.result[9].field).to.eql("type");

                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"ug__teachers"}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(10);

                expect(fieldsData.result[0].field).to.eql("amount");
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[2].field).to.eql("city");
                expect(fieldsData.result[2].filterable).to.eql(true);
                expect(fieldsData.result[2].mandatory).to.eql(true);
                expect(fieldsData.result[2].sortable).to.eql(true);
                expect(fieldsData.result[3].field).to.eql("designation");
                expect(fieldsData.result[4].field).to.eql("fkField");
                expect(fieldsData.result[5].field).to.eql("infos");
                parentFieldId = fieldsData.result[5]._id
                expect(fieldsData.result[5].filterable).to.eql(false);
                expect(fieldsData.result[5].mandatory).to.eql(true);
                expect(fieldsData.result[5].sortable).to.eql(true);
                expect(fieldsData.result[6].field).to.eql("line1");
                expect(fieldsData.result[6].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[7].field).to.eql("line2");
                expect(fieldsData.result[7].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[8].field).to.eql("name");
                expect(fieldsData.result[9].field).to.eql("type");

                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"pg__teachers"}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(10);

                expect(fieldsData.result[0].field).to.eql("amount");
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[2].field).to.eql("city");
                expect(fieldsData.result[2].filterable).to.eql(false);
                expect(fieldsData.result[2].mandatory).to.eql(true);
                expect(fieldsData.result[2].sortable).to.eql(true);
                expect(fieldsData.result[3].field).to.eql("designation");
                expect(fieldsData.result[4].field).to.eql("fkField");
                expect(fieldsData.result[5].field).to.eql("infos");
                parentFieldId = fieldsData.result[5]._id
                expect(fieldsData.result[5].filterable).to.eql(false);
                expect(fieldsData.result[5].mandatory).to.eql(false);
                expect(fieldsData.result[5].sortable).to.eql(true);
                expect(fieldsData.result[6].field).to.eql("line1");
                expect(fieldsData.result[6].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[7].field).to.eql("line2");
                expect(fieldsData.result[7].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[8].field).to.eql("name");
                expect(fieldsData.result[9].field).to.eql("type");
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"pg__teachers", field:{$in:["city"]}}})
            }).then(
            function (fieldsData) {
                cityId = fieldsData.result[0]._id;
                return afb_SbDb.update({$collection:"pl.fields", $update:[
                    {_id:cityId, $unset:{filterable:""}}
                ]})
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"teachers__employees", field:"city"}, $fields:{_id:1}});
            }).then(
            function (fieldsdata) {
                return afb_SbDb.update({$collection:"pl.fields", $update:{_id:fieldsdata.result[0]._id, $set:{filterable:false}}});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"pg__teachers"}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(10);

                expect(fieldsData.result[0].field).to.eql("amount");
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[2].field).to.eql("city");
                expect(fieldsData.result[2].filterable).to.eql(undefined);
                expect(fieldsData.result[2].mandatory).to.eql(true);
                expect(fieldsData.result[2].sortable).to.eql(true);
                expect(fieldsData.result[3].field).to.eql("designation");
                expect(fieldsData.result[4].field).to.eql("fkField");
                expect(fieldsData.result[5].field).to.eql("infos");
                parentFieldId = fieldsData.result[5]._id
                expect(fieldsData.result[5].filterable).to.eql(false);
                expect(fieldsData.result[5].mandatory).to.eql(false);
                expect(fieldsData.result[5].sortable).to.eql(true);
                expect(fieldsData.result[6].field).to.eql("line1");
                expect(fieldsData.result[6].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[7].field).to.eql("line2");
                expect(fieldsData.result[7].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[8].field).to.eql("name");
                expect(fieldsData.result[9].field).to.eql("type");
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"teachers__employees", field:"designation"}, $fields:{_id:1}});
            }).then(
            function (fieldsdata) {
                return afb_SbDb.update({$collection:"pl.fields", $update:{_id:fieldsdata.result[0]._id, $set:{parentfieldid:{$query:{field:"infos", collectionid:{$query:{collection:"teachers__employees"}}}}}}});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"pg__teachers"}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(10);

                expect(fieldsData.result[0].field).to.eql("amount");
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[2].field).to.eql("city");
                expect(fieldsData.result[2].filterable).to.eql(undefined);
                expect(fieldsData.result[2].mandatory).to.eql(true);
                expect(fieldsData.result[2].sortable).to.eql(true);
                parentFieldId = fieldsData.result[5]._id;
                expect(fieldsData.result[3].field).to.eql("designation");
                expect(fieldsData.result[3].parentfieldid._id).to.eql(parentFieldId);

                expect(fieldsData.result[4].field).to.eql("fkField");
                expect(fieldsData.result[4].set).to.eql(["name"]);
                expect(fieldsData.result[5].field).to.eql("infos");

                expect(fieldsData.result[5].filterable).to.eql(false);
                expect(fieldsData.result[5].mandatory).to.eql(false);
                expect(fieldsData.result[5].sortable).to.eql(true);
                expect(fieldsData.result[6].field).to.eql("line1");
                expect(fieldsData.result[6].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[7].field).to.eql("line2");
                expect(fieldsData.result[7].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[8].field).to.eql("name");
                expect(fieldsData.result[9].field).to.eql("type");
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"employees", field:"fkField"}, $fields:{_id:1}});
            }).then(
            function (fieldsdata) {
                return afb_SbDb.update({$collection:"pl.fields", $update:{_id:fieldsdata.result[0]._id, $set:{set:["name", "age"]}}});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"pg__teachers"}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(10);

                expect(fieldsData.result[0].field).to.eql("amount");
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[2].field).to.eql("city");
                expect(fieldsData.result[2].filterable).to.eql(undefined);
                expect(fieldsData.result[2].mandatory).to.eql(true);
                expect(fieldsData.result[2].sortable).to.eql(true);
                parentFieldId = fieldsData.result[5]._id;
                expect(fieldsData.result[3].field).to.eql("designation");
                expect(fieldsData.result[3].parentfieldid._id).to.eql(parentFieldId);

                expect(fieldsData.result[4].field).to.eql("fkField");
                expect(fieldsData.result[4].set).to.eql(["name", "age"]);
                expect(fieldsData.result[5].field).to.eql("infos");

                expect(fieldsData.result[5].filterable).to.eql(false);
                expect(fieldsData.result[5].mandatory).to.eql(false);
                expect(fieldsData.result[5].sortable).to.eql(true);
                expect(fieldsData.result[6].field).to.eql("line1");
                expect(fieldsData.result[6].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[7].field).to.eql("line2");
                expect(fieldsData.result[7].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[8].field).to.eql("name");
                expect(fieldsData.result[9].field).to.eql("type");
            }).then(
            function () {
                return afb_SbDb.query(
                    {$collection:"pl.fields", $filter:{"collectionid.collection":"employees", field:"amount", "parentfieldid._id":undefined}, $fields:{_id:1}
                    });
            }).then(
            function (fieldsdata) {
                return afb_SbDb.update({$collection:"pl.fields", $update:{_id:fieldsdata.result[0]._id, $set:{mandatory:true}}});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"pg__teachers"}});
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(10);

                expect(fieldsData.result[0].field).to.eql("amount");
                expect(fieldsData.result[0].mandatory).to.eql(true);
                expect(fieldsData.result[1].field).to.eql("amount");
                expect(fieldsData.result[1].mandatory).to.eql(true);
                expect(fieldsData.result[2].field).to.eql("city");
                expect(fieldsData.result[2].filterable).to.eql(undefined);
                expect(fieldsData.result[2].mandatory).to.eql(true);
                expect(fieldsData.result[2].sortable).to.eql(true);
                parentFieldId = fieldsData.result[5]._id;
                expect(fieldsData.result[3].field).to.eql("designation");
                expect(fieldsData.result[3].parentfieldid._id).to.eql(parentFieldId);

                expect(fieldsData.result[4].field).to.eql("fkField");
                expect(fieldsData.result[4].set).to.eql(["name", "age"]);
                expect(fieldsData.result[5].field).to.eql("infos");

                expect(fieldsData.result[5].filterable).to.eql(false);
                expect(fieldsData.result[5].mandatory).to.eql(false);
                expect(fieldsData.result[5].sortable).to.eql(true);
                expect(fieldsData.result[6].field).to.eql("line1");
                expect(fieldsData.result[6].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[7].field).to.eql("line2");
                expect(fieldsData.result[7].parentfieldid._id).to.eql(parentFieldId);
                expect(fieldsData.result[8].field).to.eql("name");
                expect(fieldsData.result[9].field).to.eql("type");
                expect(fieldsData.result[9].mandatory).to.eql(true);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"employees", field:"fkField"}, $fields:{_id:1}});
            }).then(
            function (fieldsData) {
//                return afb_SbDb.update({$collection: "pl.fields", $update: {_id: fieldsData.result[0]._id, $set: {collectionid: {$query: {collection: "teachers__employees"}}}}});
            }).fail(
            function (err) {
//                if (err.code !== 11000) {
//                    throw err;
//                }
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.actions", $insert:[
                    {id:"export", collectionid:{$query:{collection:"employees"}}, label:"Export", type:"export"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.functions", $insert:{name:"TaskBL", source:"NorthwindTestCase/lib", type:"js"}})
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.events", $insert:{event:"onSave", function:"TaskBL.onSave", collectionid:{$query:{collection:"employees"}}, pre:true}});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.templates", $insert:{template:"Template1", collectionid:{$query:{collection:"employees"}}}})
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.indexes", $insert:{collectionid:{$query:{collection:"employees"}}, name:"Index1", indexes:{name:1}}})
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.formgroups", $insert:{collectionid:{$query:{collection:"employees"}}, title:"Address1", showLabel:true}})
            }).then(
            function () {
                return expectActionIndexAndOtherMetaData(afb_SbDb, "teachers__employees")
            }).then(
            function () {
                return expectActionIndexAndOtherMetaData(afb_SbDb, "pg__teachers")
            }).then(
            function () {
                return expectActionIndexAndOtherMetaData(afb_SbDb, "ug__teachers")
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.actions", $filter:{"collectionid.collection":"employees"}})
            }).then(
            function (actionsData) {

            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {

            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("copy updated data of parent in multiple child collection for array case", function (done) {
        var afb_SbDb = undefined;
        var qviews = undefined;
        var actionData = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.actions", $insert:[
                    {id:"employees1", collectionid:{$query:{collection:"employees"}}, label:"Employees1", type:"export", qviews:[
                        {collection:"employees", label:"Qview1", id:"qview1"},
                        {collection:"employees", label:"Qview2", id:"qview2", index:2000},
                        {collection:"employees", label:"Qview3", id:"qview3", index:3000},
                        {collection:"employees", label:"Qview4", id:"qview4", index:4000},
                        {collection:"employees", label:"Qview5", id:"qview4", index:4000},
                        {collection:"employees", label:"Qview6", id:"qview4", index:4000}
                    ]}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"teachers__employees", parentCollection:"employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.actions", $filter:{"collectionid.collection":"teachers__employees"}})
            }).then(
            function (actiondata) {
                actionData = actiondata;
                qviews = actionData.result[0].qviews;
                return afb_SbDb.update({$collection:"pl.actions", $update:{_id:actionData.result[0]._id, $set:{qviews:{$update:[
                    {_id:qviews[0]._id, $set:{label:"teacherQview1"}},
                    {_id:qviews[3]._id, $set:{label:"teacherQview4"}}
                ]}}} });
            }).then(
            function () {
                qviews = actionData.result[0].qviews;
                var update = {$collection:"pl.actions", $update:{_id:actionData.result[0]._id, $set:{qviews:{$delete:[
                    {_id:qviews[1]._id},
                    {_id:qviews[5]._id}
                ]}}
                }};
                return afb_SbDb.update(update);
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.actions", $filter:{"collectionid.collection":"employees"}});
            }).then(
            function (actiondata) {
                actionData = actiondata;
                qviews = actionData.result[0].qviews;
                return afb_SbDb.update({$collection:"pl.actions", $update:{_id:actionData.result[0]._id, $set:{qviews:{$update:[
                    {_id:qviews[0]._id, $set:{label:"New Qviews1", index:1000}},
                    {_id:qviews[1]._id, $set:{label:"New Qviews2", index:21000}}
                ]}}
                }
                })
            }).then(
            function () {
                qviews = actionData.result[0].qviews;
                return afb_SbDb.update({$collection:"pl.actions", $update:{_id:actionData.result[0]._id, $set:{qviews:{$delete:[
                    {_id:qviews[3]._id},
                    {_id:qviews[5]._id}
                ]}}
                }})
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.actions", $filter:{"collectionid.collection":"teachers__employees"}})
            }).then(
            function (actionData) {
                expect(actionData.result).to.have.length(1);
                expect(actionData.result[0].qviews).to.have.length(3);
                expect(actionData.result[0].qviews[0].label).to.eql("teacherQview1");
                expect(actionData.result[0].qviews[0].index).to.eql(1000);
                expect(actionData.result[0].qviews[1].label).to.eql("Qview3");
                expect(actionData.result[0].qviews[2].label).to.eql("Qview5");
            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("copy updated data of parent in multiple child collection for array case", function (done) {
        var afb_SbDb = undefined;
        var qviews = undefined;
        var actionData = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.actions", $insert:[
                    {id:"employees1", collectionid:{$query:{collection:"employees"}}, label:"Employees1", type:"export", qviews:[
                        {collection:"employees", label:"Qview1", id:"qview1"},
                        {collection:"employees", label:"Qview2", id:"qview2", index:2000},
                        {collection:"employees", label:"Qview3", id:"qview3", index:3000},
                        {collection:"employees", label:"Qview4", id:"qview4", index:4000},
                        {collection:"employees", label:"Qview5", id:"qview4", index:4000},
                        {collection:"employees", label:"Qview6", id:"qview4", index:4000}
                    ]}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"teachers__employees", parentCollection:"employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.actions", $filter:{"collectionid.collection":"teachers__employees"}})
            }).then(
            function (actiondata) {
                actionData = actiondata;
                qviews = actionData.result[0].qviews;
                return afb_SbDb.update({$collection:"pl.actions", $update:{_id:actionData.result[0]._id, $set:{qviews:{$update:[
                    {_id:qviews[0]._id, $set:{label:"teacherQview1"}},
                    {_id:qviews[3]._id, $set:{label:"teacherQview4"}}
                ]}}} });
            }).then(
            function () {
                qviews = actionData.result[0].qviews;
                var update = {$collection:"pl.actions", $update:{_id:actionData.result[0]._id, $set:{qviews:{$delete:[
                    {_id:qviews[1]._id},
                    {_id:qviews[5]._id}
                ]}}
                }};
                return afb_SbDb.update(update);
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.actions", $filter:{"collectionid.collection":"employees"}});
            }).then(
            function (actiondata) {
                actionData = actiondata;
                qviews = actionData.result[0].qviews;
                return afb_SbDb.update({$collection:"pl.actions", $update:{_id:actionData.result[0]._id, $set:{qviews:{$update:[
                    {_id:qviews[0]._id, $set:{label:"New Qviews1", index:1000}},
                    {_id:qviews[1]._id, $set:{label:"New Qviews2", index:21000}}
                ]}}
                }
                })
            }).then(
            function () {
                qviews = actionData.result[0].qviews;
                return afb_SbDb.update({$collection:"pl.actions", $update:{_id:actionData.result[0]._id, $set:{qviews:{$delete:[
                    {_id:qviews[3]._id},
                    {_id:qviews[5]._id}
                ]}}
                }})
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.actions", $filter:{"collectionid.collection":"teachers__employees"}})
            }).then(
            function (actionData) {
                expect(actionData.result).to.have.length(1);
                expect(actionData.result[0].qviews).to.have.length(3);
                expect(actionData.result[0].qviews[0].label).to.eql("teacherQview1");
                expect(actionData.result[0].qviews[0].index).to.eql(1000);
                expect(actionData.result[0].qviews[1].label).to.eql("Qview3");
                expect(actionData.result[0].qviews[2].label).to.eql("Qview5");
            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })


    it("copy updated data of collection of parent in multiple child collection ", function (done) {
        var afb_SbDb = undefined;
        var qviews = undefined;
        var actionData = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.actions", $insert:[
                    {id:"employees1", collectionid:{$query:{collection:"employees"}}, label:"Employees1", type:"export", qviews:[
                        {collection:"employees", label:"Qview1", id:"qview1"}
                    ]}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"teachers__employees", parentCollection:"employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.collections", $filter:{collection:"teachers__employees"}})
            }).then(
            function (collectionData) {
                return afb_SbDb.update({$collection:"pl.collections", $update:{_id:collectionData.result[0]._id, $set:{historyEnabled:true}}})
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.collections", $filter:{collection:"employees"}})

            }).then(
            function (collectionData) {
                return afb_SbDb.update({$collection:"pl.collections", $update:{_id:collectionData.result[0]._id, $set:{historyEnabled:false, global:false}}})
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.collections", $filter:{collection:"teachers__employees"}})
            }).then(
            function (data) {
                expect(data.result[0].historyEnabled).to.eql(true)
                expect(data.result[0].global).to.eql(false)
            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {

            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("error in deleting field inherited from parent collection", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var infoId = undefined;
        var cityId = undefined;
        var parentFieldId = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return insertCommonData(afb_SbDb);
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"teachers__employees", parentCollection:"employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"designation", collectionid:{$query:{collection:"teachers__employees"}}, type:"string"}
                ]});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"teachers__employees"}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(8);

                expect(fieldsData.result[0].field).to.eql("amount");
                expect(fieldsData.result[1].field).to.eql("amount");

                expect(fieldsData.result[2].field).to.eql("designation");
                expect(fieldsData.result[3].field).to.eql("fkField");
                expect(fieldsData.result[4].field).to.eql("infos");

                infoId = fieldsData.result[4]._id;
                parentFieldId = fieldsData.result[4]._id;
                expect(fieldsData.result[5].field).to.eql("line1");
                expect(fieldsData.result[5].parentfieldid._id).to.eql(parentFieldId);

                expect(fieldsData.result[6].field).to.eql("name");
                expect(fieldsData.result[7].field).to.eql("type");


            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $delete:{_id:infoId}})
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"line23", collectionid:{$query:{collection:"employees"}}, type:"string", parentfieldid:{$query:{field:"infos", collectionid:{$query:{collection:"employees"}}}}}
                ]});
            }).fail(
            function (err) {
                var index = err.message.indexOf("is already deleted in child collection")
                if (index > 0) {

                } else {
                    throw err;
                }
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    it("error in deleting field inherited from parent collection and adding a child field by parent in deleted field", function (done) {
        var afb_SbDb = undefined;
        var daffodildb = undefined;
        var infoId = undefined;
        var cityId = undefined;
        var parentFieldId = undefined;
        return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            .then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return insertCommonData(afb_SbDb);
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"});
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"teachers__employees", parentCollection:"employees"}
                ]});
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"designation", collectionid:{$query:{collection:"teachers__employees"}}, type:"string"}
                ]});
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $sort:{field:1}, $filter:{"collectionid.collection":"teachers__employees"}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(8);

                expect(fieldsData.result[0].field).to.eql("amount");
                expect(fieldsData.result[1].field).to.eql("amount");

                expect(fieldsData.result[2].field).to.eql("designation");
                expect(fieldsData.result[3].field).to.eql("fkField");
                expect(fieldsData.result[4].field).to.eql("infos");

                infoId = fieldsData.result[4]._id;
                parentFieldId = fieldsData.result[4]._id;
                expect(fieldsData.result[5].field).to.eql("line1");
                expect(fieldsData.result[5].parentfieldid._id).to.eql(parentFieldId);

                expect(fieldsData.result[6].field).to.eql("name");
                expect(fieldsData.result[7].field).to.eql("type");


            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $delete:{_id:infoId}})
            }).then(
            function () {
                return afb_SbDb.startTransaction();
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"employees", field:"fkField"}})
            }).then(
            function (fieldsData) {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"newField", collectionid:{$query:{collection:"employees"}}, type:"string"},
                    {field:"newField1", collectionid:{$query:{collection:"employees"}}, type:"string"}
                ], $update:{_id:fieldsData.result[0]._id, $set:{parentfieldid:{$query:{field:"infos", collectionid:{$query:{collection:"employees"}}}}}}})
            }).then(
            function () {
                return afb_SbDb.commitTransaction();
            }).fail(
            function (err) {
                var index = err.message.indexOf("is already deleted in child collection")
                if (index > 0) {
                    return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"employees", field:{$in:["newField", "newField1"]}}}).then(
                        function (fieldsData) {
                            expect(fieldsData.result).to.have.length(2);
                            return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"teachers__employees", field:{$in:["newField", "newField1"]}}})
                        }).then(function (fieldsData) {
                            expect(fieldsData.result).to.have.length(2);
                            return afb_SbDb.rollbackTransaction();
                        })

                } else {

                    throw err;
                }
            }).then(
            function () {
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"employees", field:{$in:["newField", "newField1"]}}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(0);
                return afb_SbDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"teachers__employees", field:{$in:["newField", "newField1"]}}})
            }).then(
            function (fieldsData) {
                expect(fieldsData.result).to.have.length(0);
            }).then(
            function () {
                done();
            }).fail(
            function (err) {
                done(err);
            })
    })

    function expectActionIndexAndOtherMetaData(db, collectionForFilter) {

        return db.query({$collection:"pl.actions", $filter:{"collectionid.collection":collectionForFilter}}).then(
            function (actionsData) {
                expect(actionsData.result).to.have.length(2);
                expect(actionsData.result[0].id).to.eql("import");
                expect(actionsData.result[1].id).to.eql("export");
                return db.query({$collection:"pl.indexes", $filter:{"collectionid.collection":collectionForFilter}});
            }).then(
            function (indexData) {
                expect(indexData.result).to.have.length(2);
                expect(indexData.result[0].name).to.eql("Index0");
                expect(indexData.result[1].name).to.eql("Index1");
                return db.query({$collection:"pl.formgroups", $filter:{"collectionid.collection":collectionForFilter}});
            }).then(
            function (formGroupData) {
                expect(formGroupData.result).to.have.length(2);
                expect(formGroupData.result[0].title).to.eql("Address0");
                expect(formGroupData.result[1].title).to.eql("Address1");
                return db.query({$collection:"pl.templates", $filter:{"collectionid.collection":collectionForFilter}});
            }).then(
            function (templatesData) {
                expect(templatesData.result).to.have.length(2);
                expect(templatesData.result[0].template).to.eql("Template0");
                expect(templatesData.result[1].template).to.eql("Template1");
                return db.query({$collection:"pl.events", $filter:{"collectionid.collection":collectionForFilter}});
            }).then(function (eventsData) {
                expect(eventsData.result).to.have.length(1);
                expect(eventsData.result[0].event).to.eql("onSave");
            })
    }

    function insertCommonData(db) {
        return db.update({$collection:"pl.collections", $insert:[
            {collection:"employees"},
            {collection:"foreign"}
        ]}).then(
            function () {
                return db.update({$collection:"pl.fields", $insert:[
                    {field:"name", collectionid:{$query:{collection:"foreign"}}, type:"string"},
                    {field:"age", collectionid:{$query:{collection:"foreign"}}, type:"string"},
                    {field:"name", collectionid:{$query:{collection:"employees"}}, type:"string"},
                    {field:"amount", collectionid:{$query:{collection:"employees"}}, type:"currency"},
                    {field:"infos", multiple:true, collectionid:{$query:{collection:"employees"}}, type:"object"},
                    {field:"line1", collectionid:{$query:{collection:"employees"}}, type:"string", parentfieldid:{$query:{field:"infos", collectionid:{$query:{collection:"employees"}}}}},
                    {field:"fkField", collectionid:{$query:{collection:"employees"}}, type:"fk", collection:"foreign", set:["name"]}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.actions", $insert:[
                    {id:"import", collectionid:{$query:{collection:"employees"}}, label:"Import", type:"export"}
                ]});
            }).then(
            function () {
                return db.update({$collection:"pl.templates", $insert:{template:"Template0", collectionid:{$query:{collection:"employees"}}}})
            }).then(
            function () {
                return db.update({$collection:"pl.indexes", $insert:{collectionid:{$query:{collection:"employees"}}, name:"Index0", indexes:{name:1}}})
            }).then(
            function () {
                return db.update({$collection:"pl.formgroups", $insert:{collectionid:{$query:{collection:"employees"}}, title:"Address0", showLabel:true}})
            })
    }
})

function dropDatabase(dbs) {
    return ApplaneDB.connect(Config.URL, "afb", {username:"afb", "password":"afb"})
        .then(
        function (afbDb) {
            dbs.afbDb = afbDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
        }).then(
        function (afb_sbDb) {
            dbs.afb_sbDb = afb_sbDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "daffodil", {username:"daffodil", "password":"daffodil"})
        }).then(
        function (daffodilDb) {
            dbs.daffodilDb = daffodilDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "daffodil_sb", {username:"daffodil", "password":"daffodil"})
        }).then(
        function (daffodil_sbDb) {
            dbs.daffodil_sbDb = daffodil_sbDb;
        })
}

