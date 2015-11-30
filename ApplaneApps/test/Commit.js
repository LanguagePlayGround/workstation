/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 5/6/14
 * Time: 12:03 PM
 * To change this template use File | Settings | File Templates.
 */

/**
 *
 * mocha --recursive --timeout 150000 -g "commit testcase" --reporter spec
 * Create application and Commit in super admin and sync
 * mocha --recursive --timeout 150000 -g "Create application and Commit in super admin and sync" --reporter spec
 */

var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");
var Commit = require("../lib/apps/Commit.js");
var localDB1 = "developer";

describe("commit testcase", function () {

    beforeEach(function (done) {
        var adminDB = undefined;
        Testcases.beforeEach().then(
            function () {
                return ApplaneDB.connect(Config.URL, Config.ADMIN_DB, Config.ADMIN_OPTIONS);
            }).then(
            function (adb) {
                adminDB = adb;
                return adminDB.query({$collection:"pl.dbs", $filter:{admindb:Config.GLOBAL_DB}});
            }).then(
            function (result) {
                if (result && result.result.length > 0) {
                    return adminDB.update({$collection:"pl.dbs", $update:{_id:result.result[0]._id, $unset:{admindb:""}}});
                }
            }).then(
            function () {
                return  adminDB.update({$collection:"pl.dbs", $insert:[
                    {db:localDB1, globalDb:Config.GLOBAL_DB, admindb:Config.GLOBAL_DB, globalUserName:Config.OPTIONS.username, globalPassword:Config.OPTIONS.password, globalUserAdmin:true},
                    {db:"northwinddarcl", globalDb:Config.GLOBAL_DB, globalUserName:Config.OPTIONS.username, globalPassword:Config.OPTIONS.password, globalUserAdmin:true},
                    {db:"northwindnavigant", globalDb:Config.GLOBAL_DB, globalUserName:Config.OPTIONS.username, globalPassword:Config.OPTIONS.password, globalUserAdmin:true},
                    {db:"northwinddaffodil", globalDb:Config.GLOBAL_DB, guestUserName:"guest", globalUserName:"guest", globalPassword:"guest", globalUserAdmin:true},
                    {db:"northwinddaffodil_sb", globalDb:"northwinddaffodil", admindb:"northwinddaffodil", globalUserName:Config.OPTIONS.username, globalPassword:Config.OPTIONS.password, globalUserAdmin:true}
                ]});
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err)
            });
    })

    afterEach(function (done) {
        var dbs = {};
        createConnections(dbs, Config.ADMIN_DB, "developer", "northwinddarcl", "northwindnavigant", "northwinddaffodil", "northwinddaffodil_sb").then(
            function () {
                return dbs.develoerDb.dropDatabase();
            }).then(
            function () {
                return dbs.northwindDarclDb.dropDatabase();
            }).then(
            function () {
                return dbs.northwindDaffodil.dropDatabase();
            }).then(
            function () {
                return dbs.northwindNavigant.dropDatabase();
            }).then(
            function () {
                return dbs.northwindDaffodil_sb.dropDatabase();
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

    it("commit false Error", function (done) {
        var localDb1 = undefined;
        ApplaneDB.connect(Config.URL, localDB1, Config.OPTIONS).then(
            function (db1) {
                localDb1 = db1;
                return localDb1.update({$collection:"pl.collections", $insert:[
                    {collection:"testcommit"}
                ]});
            }).then(
            function () {
                return localDb1.invokeFunction("Commit.commitProcess", [
                    {data:{}}
                ]);
            }).then(
            function () {
                done("Not Ok")
            }).fail(function (err) {
                var commitError = err.toString().indexOf("Commit must be true.") != -1;
                if (commitError) {
                    done();
                } else {
                    done(err);
                }
            })
    })

    it("Create application and Commit in super admin", function (done) {
        var dbs = {};
        createConnections(dbs, Config.GLOBAL_DB, "developer").then(
            function () {
                return createApplicationAndCommitInAdmin(dbs.superAdminDb, dbs.develoerDb);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("Override in sandbox and commit in local admin", function (done) {
        var dbs = {};
        createConnections(dbs, Config.GLOBAL_DB, "developer", "northwinddarcl", "northwindnavigant", "northwinddaffodil", "northwinddaffodil_sb").then(
            function () {
                return overrideData(dbs);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

    it("commit a updated collection and new collection", function (done) {
        var dbs = {};
        createConnections(dbs, Config.GLOBAL_DB, "developer", "northwinddarcl", "northwindnavigant", "northwinddaffodil", "northwinddaffodil_sb").then(
            function () {
                return overrideData(dbs);
            }).then(
            function () {
                return updateAndAddCollectionByDeveloper(dbs.develoerDb);
            }).then(
            function () {
                return getDataAndExpectFromDbs(dbs.northwindDarclDb, dbs.northwindNavigant);
            }).then(
            function () {
                return expectSandBoxDBChanges(dbs.northwindDaffodil);
            }).then(
            function () {
                return getAllDeveloperData(dbs.northwindDaffodil_sb);
            }).then(
            function (data) {
                return expectBlankData(data);
            }).then(
            function () {
                return getAllDeveloperData(dbs.northwindDaffodil_sb, true);
            }).then(
            function (data) {
                expectSandboxCommitDataonMerged(data);
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, dbs.develoerDb);
            }).then(
            function () {
                return getAllDeveloperData(dbs.northwindDarclDb);
            }).then(
            function (developerData) {
                return expectBlankData(developerData);
            }).then(
            function () {
                return getAllDeveloperData(dbs.northwindDarclDb, true);
            }).then(
            function (northwindDarclDb) {
                return expectInsertedDeveloperDataAfterAddCollection(northwindDarclDb);
            }).then(
            function () {
                return getAllDeveloperData(dbs.superAdminDb);
            }).then(
            function (superAdminDb) {
                return expectInsertedDeveloperDataAfterAddCollection(superAdminDb);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })

    })

    it("Referredfks with data using data check when defination of set in fk columns changed in some dbs.", function (done) {
        var dbs = {};
        var fieldId = undefined;
        createConnections(dbs, Config.GLOBAL_DB, "developer", "northwinddarcl", "northwindnavigant", "northwinddaffodil", "northwinddaffodil_sb").then(
            function () {
                return dbs.develoerDb.update([
                    {$collection:"pl.collections", $insert:[
                        {collection:"classes"},
                        {collection:"students"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"class", type:"string", collectionid:{$query:{collection:"classes"}}} ,
                        {field:"code", type:"string", collectionid:{$query:{collection:"classes"}}},
                        {field:"sem", type:"string", collectionid:{$query:{collection:"classes"}}},
                        {field:"uid", type:"string", collectionid:{$query:{collection:"classes"}}},
                        {field:"name", type:"string", collectionid:{$query:{collection:"students"}}},
                        {field:"classid", type:"fk", collectionid:{$query:{collection:"students"}}, collection:"classes", set:["class"]}
                    ]}
                ]);
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, dbs.develoerDb);
            }).then(
            function () {
                clearCache(dbs);
            }).then(
            function () {
                return dbs.northwindDarclDb.update({$collection:"classes", $insert:[
                    {class:"First", code:"1", sem:"101", uid:"10001"}
                ]})
            }).then(
            function () {
                return dbs.northwindDarclDb.update({$collection:"students", $insert:[
                    {name:"Sachin", classid:{$query:{class:"First"}}}
                ]});
            }).then(
            function () {
                return dbs.northwindDarclDb.query({$collection:"students"});
            }).then(
            function (result) {
                expect(result.result[0].classid.class).to.eql("First");
                expect(result.result[0].classid.code).to.eql(undefined);
                expect(result.result[0].classid.sem).to.eql(undefined);
                expect(result.result[0].classid.uid).to.eql(undefined);
            }).then(
            function () {
                return dbs.northwindDaffodil_sb.update({$collection:"classes", $insert:[
                    {class:"First_sb", code:"11", sem:"1011", uid:"100011"}
                ]})
            }).then(
            function () {
                return dbs.northwindDaffodil_sb.update({$collection:"students", $insert:[
                    {name:"Sachin_sb", classid:{$query:{class:"First_sb"}}}
                ]});
            }).then(
            function () {
                return dbs.northwindDaffodil_sb.query({$collection:"students"});
            }).then(
            function (result) {
                expect(result.result[0].classid.class).to.eql("First_sb");
                expect(result.result[0].classid.code).to.eql(undefined);
                expect(result.result[0].classid.sem).to.eql(undefined);
                expect(result.result[0].classid.uid).to.eql(undefined);
                return dbs.northwindDaffodil_sb.query({$collection:"pl.fields", $filter:{field:"classid", "collectionid.collection":"students"}});
            }).then(
            function (result) {
                fieldId = result.result[0]._id;
                return dbs.northwindDaffodil_sb.update({$collection:"pl.fields", $update:[
                    {_id:fieldId, $set:{set:["code", "sem"]}}
                ]})
            }).then(
            function () {
                return dbs.northwindDaffodil_sb.update({$collection:"students", $insert:[
                    {name:"Sachin1_sb", classid:{$query:{class:"First_sb"}}}
                ]});
            }).then(
            function () {
                return dbs.northwindDaffodil_sb.query({$collection:"students", $filter:{name:"Sachin1_sb"}});
            }).then(
            function (result) {
                expect(result.result[0].classid.class).to.eql(undefined);
                expect(result.result[0].classid.code).to.eql("11");
                expect(result.result[0].classid.sem).to.eql("1011");
                expect(result.result[0].classid.uid).to.eql(undefined);
            }).then(
            function () {
                return dbs.develoerDb.update({$collection:"pl.fields", $update:[
                    {_id:fieldId, $set:{set:["uid"]}}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, dbs.develoerDb);
            }).then(
            function () {
                clearCache(dbs);
            }).then(
            function () {
                return dbs.northwindDarclDb.update({$collection:"students", $insert:[
                    {name:"Sachin1", classid:{$query:{class:"First"}}}
                ]});
            }).then(
            function () {
                return dbs.northwindDarclDb.query({$collection:"students", $filter:{name:"Sachin1"}});
            }).then(
            function (result) {
                expect(result.result[0].classid.class).to.eql(undefined);
                expect(result.result[0].classid.code).to.eql(undefined);
                expect(result.result[0].classid.sem).to.eql(undefined);
                expect(result.result[0].classid.uid).to.eql("10001");
            }).then(
            function () {
                return dbs.northwindDaffodil_sb.update({$collection:"students", $insert:[
                    {name:"Sachin2_sb", classid:{$query:{class:"First_sb"}}}
                ]});
            }).then(
            function () {
                return dbs.northwindDaffodil_sb.query({$collection:"students", $filter:{name:"Sachin2_sb"}});
            }).then(
            function (result) {
                expect(result.result[0].classid.class).to.eql(undefined);
                expect(result.result[0].classid.code).to.eql("11");
                expect(result.result[0].classid.sem).to.eql("1011");
                expect(result.result[0].classid.uid).to.eql(undefined);
            }).then(
            function () {
                return dbs.develoerDb.update({$collection:"pl.fields", $update:[
                    {_id:fieldId, $unset:{set:""}}
                ]})
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, dbs.develoerDb);
            }).then(
            function () {
                clearCache(dbs);
            }).then(
            function () {
                return dbs.northwindDarclDb.update({$collection:"students", $insert:[
                    {name:"Sachin2", classid:{$query:{class:"First"}}}
                ]});
            }).then(
            function () {
                return dbs.northwindDarclDb.query({$collection:"students", $filter:{name:"Sachin2"}});
            }).then(
            function (result) {
                expect(result.result[0].classid.class).to.eql(undefined);
                expect(result.result[0].classid.code).to.eql(undefined);
                expect(result.result[0].classid.sem).to.eql(undefined);
                expect(result.result[0].classid.uid).to.eql(undefined);
            }).then(
            function () {
                return dbs.northwindDaffodil_sb.update({$collection:"students", $insert:[
                    {name:"Sachin3_sb", classid:{$query:{class:"First_sb"}}}
                ]});
            }).then(
            function () {
                return dbs.northwindDaffodil_sb.query({$collection:"students", $filter:{name:"Sachin3_sb"}});
            }).then(
            function (result) {
                expect(result.result[0].classid.class).to.eql(undefined);
                expect(result.result[0].classid.code).to.eql("11");
                expect(result.result[0].classid.sem).to.eql("1011");
                expect(result.result[0].classid.uid).to.eql(undefined);
            }).then(
            function () {
                done()
            }).fail(function (e) {
                done(e);
            })
    })
})

function clearCache(dbs) {
    for (var k in dbs) {
        dbs[k].clearCache();
    }
}

function expectInsertedDeveloperDataAfterAddCollection(data) {
    var applications = data["pl.applications"];
    expect(applications).to.have.length(1);
    expect(applications[0].label).to.eql("Northwind CRM");
    expect(applications[0].db).to.eql("developer");
    expect(applications[0].roles).to.have.length(1);
    expect(applications[0].roles[0].role.role).to.eql("Northwind CRM");

    var roles = data["pl.roles"];
    expect(roles).to.have.length(1);
    expect(roles[0].role).to.eql("Northwind CRM");
    expect(roles[0].db).to.eql("developer");

    var functions = data["pl.functions"];
    expect(functions).to.have.length(1);
    expect(functions[0].name).to.eql("Invoicess");
    expect(functions[0].source).to.eql("ApplaneApps/lib/apps/trigger");
    expect(functions[0].type).to.eql("js");
    expect(functions[0].db).to.eql("developer");

    var menus = data["pl.menus"];
    expect(menus).to.have.length(5);

    expect(menus[0].label).to.eql("Entities");
    expect(menus[0].collection).to.eql("entities");
    expect(menus[0].application.label).to.eql("Northwind CRM");
    expect(menus[0].parentmenu.label).to.eql("Setup");

    expect(menus[1].label).to.eql("Opportunities");
    expect(menus[1].collection).to.eql("opportunities");
    expect(menus[1].application.label).to.eql("Northwind CRM");

    expect(menus[2].label).to.eql("Products");
    expect(menus[2].collection).to.eql("products");
    expect(menus[2].application.label).to.eql("Northwind CRM");
    expect(menus[2].parentmenu.label).to.eql("Setup");

    expect(menus[3].label).to.eql("Relationships");
    expect(menus[3].collection).to.eql("relationships");
    expect(menus[3].application.label).to.eql("Northwind CRM");

    expect(menus[4].label).to.eql("Setup");
    expect(menus[4].collection).to.eql(undefined);
    expect(menus[4].application.label).to.eql("Northwind CRM");

    var collections = data["pl.collections"];
    expect(collections).to.have.length(5);
    expect(collections[0].collection).to.eql("entities");
    expect(collections[0].db).to.eql("developer");

    expect(collections[1].collection).to.eql("opportunities");
    expect(collections[1].db).to.eql("developer");

    expect(collections[2].collection).to.eql("products");
    expect(collections[2].db).to.eql("developer");

    expect(collections[3].collection).to.eql("relationships");
    expect(collections[3].db).to.eql("developer");

    expect(collections[4].collection).to.eql("vendors");
    expect(collections[4].db).to.eql("developer");

    var referredFks = data["pl.referredfks"];
    expect(referredFks).to.have.length(2);
    expect(referredFks[0].collectionid.collection).to.eql("relationships");
    expect(referredFks[0].field).to.eql("entityid");
    expect(referredFks[0].set).to.eql(["entityname"]);
    expect(referredFks[0].referredcollectionid.collection).to.eql("entities");
    expect(referredFks[0].referredfieldid.field).to.eql("entityid");

    expect(referredFks[1].collectionid.collection).to.eql("relationships");
    expect(referredFks[1].field).to.eql("field4.$.field5");
    expect(referredFks[1].set).to.eql(["entityname"]);
    expect(referredFks[1].referredcollectionid.collection).to.eql("entities");
    expect(referredFks[1].referredfieldid.field).to.eql("field5");

    var indexes = data["pl.indexes"];
    expect(indexes).to.have.length(4);
    expect(indexes[0].name).to.eql("index1");
    expect(indexes[0].unique).to.eql(true);
    expect(indexes[0].collectionid.collection).to.eql("entities");
    expect(indexes[0].indexes).to.eql(JSON.stringify({field1:1}));

    expect(indexes[1].name).to.eql("index2");
    expect(indexes[1].unique).to.eql(false);
    expect(indexes[1].collectionid.collection).to.eql("opportunities");
    expect(indexes[1].indexes).to.eql(JSON.stringify({field1:1}));

    expect(indexes[2].name).to.eql("index3");
    expect(indexes[2].unique).to.eql(true);
    expect(indexes[2].collectionid.collection).to.eql("products");
    expect(indexes[2].indexes).to.eql(JSON.stringify({field1:1}));

    expect(indexes[3].name).to.eql("index4");
    expect(indexes[3].unique).to.eql(false);
    expect(indexes[3].collectionid.collection).to.eql("relationships");
    expect(indexes[3].indexes).to.eql(JSON.stringify({field1:1}));

    var actions = data["pl.actions"];
    expect(actions).to.have.length(4);
    expect(actions[0].label).to.eql("Commit1");
    expect(actions[0].type).to.eql("invoke");
    expect(actions[0].collectionid.collection).to.eql("entities");

    expect(actions[1].label).to.eql("Commit2");
    expect(actions[1].type).to.eql("invoke");
    expect(actions[1].collectionid.collection).to.eql("opportunities");

    expect(actions[2].label).to.eql("Commit3");
    expect(actions[2].type).to.eql("invoke");
    expect(actions[2].collectionid.collection).to.eql("products");

    expect(actions[3].label).to.eql("Commit4");
    expect(actions[3].type).to.eql("invoke");
    expect(actions[3].collectionid.collection).to.eql("relationships");

    var formgroups = data["pl.formgroups"];

    expect(formgroups).to.have.length(4);
    expect(formgroups[0].type).to.eql("form");
    expect(formgroups[0].noOfColumnsPerRow).to.eql(1);
    expect(formgroups[0].Title).to.eql("Title1");
    expect(formgroups[0].showTitle).to.eql(true);
    expect(formgroups[0].collectionid.collection).to.eql("entities");

    expect(formgroups[1].type).to.eql("form");
    expect(formgroups[1].noOfColumnsPerRow).to.eql(1);
    expect(formgroups[1].Title).to.eql("Title2");
    expect(formgroups[1].showTitle).to.eql(false);
    expect(formgroups[1].collectionid.collection).to.eql("opportunities");

    expect(formgroups[2].type).to.eql("form");
    expect(formgroups[2].noOfColumnsPerRow).to.eql(1);
    expect(formgroups[2].Title).to.eql("Title3");
    expect(formgroups[2].showTitle).to.eql(false);
    expect(formgroups[2].collectionid.collection).to.eql("products");

    expect(formgroups[3].type).to.eql("form");
    expect(formgroups[3].noOfColumnsPerRow).to.eql(1);
    expect(formgroups[3].Title).to.eql("Title4");
    expect(formgroups[3].showTitle).to.eql(true);
    expect(formgroups[3].collectionid.collection).to.eql("relationships");

    var qviews = data["pl.qviews"];

    expect(qviews).to.have.length(4);

    expect(qviews[0].id).to.eql("entities");
    expect(qviews[0].label).to.eql("Entities");
    expect(qviews[0].collection.collection).to.eql("entities");

    expect(qviews[1].id).to.eql("opportunities");
    expect(qviews[1].label).to.eql("Opportunities");
    expect(qviews[1].collection.collection).to.eql("opportunities");

    expect(qviews[2].id).to.eql("products");
    expect(qviews[2].label).to.eql("Products");
    expect(qviews[2].collection.collection).to.eql("products");

    expect(qviews[3].id).to.eql("relationships");
    expect(qviews[3].label).to.eql("Relationships");
    expect(qviews[3].collection.collection).to.eql("relationships");

    var fields = data["pl.fields"];
    expect(fields).to.have.length(10);

    expect(fields[0].field).to.eql("entityid");
    expect(fields[0].type).to.eql("fk");
    expect(fields[0].collectionid.collection).to.eql("relationships");
    expect(fields[0].set).to.eql(["entityname"]);
    expect(fields[0].collection).to.eql("entities");

    expect(fields[1].field).to.eql("entityname");
    expect(fields[1].type).to.eql("string");
    expect(fields[1].collectionid.collection).to.eql("entities");

    expect(fields[2].field).to.eql("field2");
    expect(fields[2].type).to.eql("string");
    expect(fields[2].collectionid.collection).to.eql("relationships");

    expect(fields[3].field).to.eql("field3");
    expect(fields[3].type).to.eql("string");
    expect(fields[3].collectionid.collection).to.eql("relationships");

    expect(fields[4].field).to.eql("field4");
    expect(fields[4].type).to.eql("object");
    expect(fields[4].multiple).to.eql(true);
    expect(fields[4].collectionid.collection).to.eql("relationships");

    expect(fields[5].field).to.eql("field5");
    expect(fields[5].type).to.eql("fk");
    expect(fields[5].set).to.eql(["entityname"]);
    expect(fields[5].collection).to.eql("entities");
    expect(fields[5].parentfieldid.field).to.eql("field4");
    expect(fields[5].collectionid.collection).to.eql("relationships");

    expect(fields[6].field).to.eql("field6");
    expect(fields[6].type).to.eql("boolean");
    expect(fields[6].parentfieldid.field).to.eql("field4");
    expect(fields[6].collectionid.collection).to.eql("relationships");

    expect(fields[7].field).to.eql("field7");
    expect(fields[7].type).to.eql("boolean");
    expect(fields[7].collectionid.collection).to.eql("relationships");
    expect(fields[7].parentfieldid.field).to.eql("field4");

    expect(fields[8].field).to.eql("lead");
    expect(fields[8].type).to.eql("string");
    expect(fields[8].collectionid.collection).to.eql("relationships");

    expect(fields[9].field).to.eql("product");
    expect(fields[9].type).to.eql("string");
    expect(fields[9].collectionid.collection).to.eql("products");

}

function updateAndAddCollectionByDeveloper(dbToUpdate) {
    var collection = undefined;
    return dbToUpdate.query({$collection:"pl.collections", $filter:{collection:"relationships"}, $fields:{_id:1, collection:1, events:1}}).then(
        function (collectionInfo) {
            collectionInfo = collectionInfo.result[0];
            collection = collectionInfo._id;
            return dbToUpdate.update({$collection:"pl.collections", $insert:[
                {collection:"vendors", events:{$insert:[
                    {"function":"Functions", "event":"onQuery", "pre":true}
                ]}}
            ]});
        }).then(
        function () {
            return dbToUpdate.query({$collection:"pl.collections", $events:false, $modules:false, $sort:{collection:1}});
        }).then(
        function (localCollectionResult) {
            expect(localCollectionResult.result).to.have.length(1);
            return dbToUpdate.query({$collection:"pl.collections", $sort:{field:1}, $filter:{collection:{$in:["relationships", "opportunities", "entities", "products", "tasks", "vendors"]}}});
        }).then(
        function (mergeCollectionResult) {
            expect(mergeCollectionResult.result).to.have.length(5);
        })
}

function updateFieldsByDeveloper(dbToUpdate) {
    var collection = undefined;
    var fields = undefined;
    return dbToUpdate.query({$collection:"pl.collections", $filter:{collection:"relationships"}, $fields:{_id:1, collection:1}}).then(
        function (collectionInfo) {
            collection = collectionInfo.result[0]._id;
            return dbToUpdate.query({$collection:"pl.fields", $filter:{"collectionid._id":collection}, $fields:{_id:1, field:1, type:1}});
        }).then(
        function (fieldsInfo) {
            fields = fieldsInfo.result;
            var field2 = undefined;
            var field5 = undefined;
            var field6 = undefined;
            var field7 = undefined;
            var lead = undefined;
            for (var i = 0; i < fields.length; i++) {
                if (fields[i].field === "field2") {
                    field2 = fields[i];
                }
                if (fields[i].field === "field5") {
                    field5 = fields[i];
                }
                if (fields[i].field === "field6") {
                    field6 = fields[i];
                }
                if (fields[i].field === "field7") {
                    field7 = fields[i];
                }
                if (fields[i].field === "lead") {
                    lead = fields[i];
                }
            }
            return dbToUpdate.update({$collection:"pl.fields", $delete:[
                {_id:field7._id},
                {_id:field5._id},
                {_id:lead._id}
            ], $insert:[
                {field:"field23", type:"string", collectionid:{_id:collection}}
            ], $update:[
                {_id:field2._id, $set:{field:"field32"}},
                {_id:field6._id, $set:{field:"field36"}}
            ]});
        }).then(
        function () {
            return dbToUpdate.query({$collection:"pl.fields", $filter:{"collectionid._id":collection}, $events:false, $modules:false, $sort:{field:1}});
        }).then(
        function (localFieldResult) {
            expect(localFieldResult.result).to.have.length(6);
            expect(localFieldResult.result[0].field).to.eql("entityid");
            expect(localFieldResult.result[1].field).to.eql("field23");
            expect(localFieldResult.result[2].field).to.eql("field3");
            expect(localFieldResult.result[3].field).to.eql("field32");
            expect(localFieldResult.result[4].field).to.eql("field36");
            expect(localFieldResult.result[5].field).to.eql("field4");
            return dbToUpdate.query({$collection:"pl.fields", $filter:{"collectionid._id":collection}, $sort:{field:1}});
        }).then(
        function (mergeFieldResult) {
            expect(mergeFieldResult.result).to.have.length(6);
            expect(mergeFieldResult.result[0].field).to.eql("entityid");
            expect(mergeFieldResult.result[1].field).to.eql("field23");
            expect(mergeFieldResult.result[2].field).to.eql("field3");
            expect(mergeFieldResult.result[3].field).to.eql("field32");
            expect(mergeFieldResult.result[4].field).to.eql("field36");
            expect(mergeFieldResult.result[5].field).to.eql("field4");
        }).then(
        function () {
            return dbToUpdate.query({$collection:"pl.referredfks", $events:false, $modules:false, $sort:{field:1}});
        }).then(
        function (localReferredfksResult) {
            expect(localReferredfksResult.result).to.have.length(1);
            expect(localReferredfksResult.result[0].field).to.eql("entityid");
            expect(localReferredfksResult.result[0].referredfieldid.field).to.eql("entityid");
            expect(localReferredfksResult.result[0].referredcollectionid.collection).to.eql("entities");
            expect(localReferredfksResult.result[0].collectionid.collection).to.eql("relationships");
            return dbToUpdate.query({$collection:"pl.referredfks", $filter:{"collectionid._id":collection}, $sort:{field:1}});
        }).then(
        function (mergeReferredfksResult) {
            expect(mergeReferredfksResult.result).to.have.length(1);
            expect(mergeReferredfksResult.result).to.have.length(1);
            expect(mergeReferredfksResult.result[0].field).to.eql("entityid");
            expect(mergeReferredfksResult.result[0].referredfieldid.field).to.eql("entityid");
            expect(mergeReferredfksResult.result[0].referredcollectionid.collection).to.eql("entities");
            expect(mergeReferredfksResult.result[0].collectionid.collection).to.eql("relationships");
        })
}

function overrideData(dbs) {
    return createApplicationAndCommitInAdmin(dbs.superAdminDb, dbs.develoerDb).then(
        function () {
            return getDataAndExpectFromDbs(dbs.northwindDarclDb, dbs.northwindNavigant, dbs.northwindDaffodil, dbs.northwindDaffodil_sb);
        }).then(
        function () {
            return updateMenu(dbs.northwindDaffodil_sb);
        }).then(
        function () {
            return updateFieldsInCollection(dbs.northwindDaffodil_sb);
        }).then(
        function () {
            return getDataAndExpectFromDbs(dbs.northwindDarclDb, dbs.northwindNavigant);
        }).then(
        function () {
            return Commit.commitProcess({data:{commit:true}}, dbs.northwindDaffodil_sb);
        }).then(
        function () {
            return getDataAndExpectFromDbs(dbs.northwindDarclDb, dbs.northwindNavigant);
        }).then(
        function () {
            return getAllDeveloperData(dbs.superAdminDb);
        }).then(
        function (data) {
            return expectInsertedDeveloperData(data);
        }).then(
        function () {
            return expectSandBoxDBChanges(dbs.northwindDaffodil);
        }).then(
        function () {
            return getAllDeveloperData(dbs.northwindDaffodil_sb);
        }).then(
        function (data) {
            return expectBlankData(data);
        }).then(
        function () {
            return getAllDeveloperData(dbs.northwindDaffodil_sb, true);
        }).then(
        function (data) {
            expectSandboxCommitDataonMerged(data);
        })
}

function updateFieldsInCollection(dbToUpdate) {
    var collection = undefined;
    var fields = undefined;
    return dbToUpdate.query({$collection:"pl.collections", $filter:{collection:"relationships"}, $fields:{_id:1, collection:1}}).then(
        function (collectionInfo) {
            collection = collectionInfo.result[0]._id;
            return dbToUpdate.query({$collection:"pl.fields", $filter:{"collectionid._id":collection}, $fields:{_id:1, field:1, type:1}});
        }).then(
        function (fieldsInfo) {
            fields = fieldsInfo.result;
            var field2 = undefined;
            var field5 = undefined;
            var lead = undefined;
            for (var i = 0; i < fields.length; i++) {
                if (fields[i].field === "field2") {
                    field2 = fields[i];
                }
                if (fields[i].field === "field5") {
                    field5 = fields[i];
                }
                if (fields[i].field === "lead") {
                    lead = fields[i];
                }
            }
            return dbToUpdate.update({$collection:"pl.fields", $delete:[
                {_id:lead._id} ,
                {_id:field5._id}
            ], $insert:[
                {field:"field15", type:"string", collectionid:{_id:collection}}
            ], $update:[
                {_id:field2._id, $set:{label:"FIELD2"}}
            ]});
        }).then(
        function () {
            return dbToUpdate.query({$collection:"pl.fields", $filter:{"collectionid._id":collection}, $events:false, $modules:false, $sort:{field:1}});
        }).then(
        function (localFieldResult) {
            expect(localFieldResult.result).to.have.length(7);
            expect(localFieldResult.result[0].field).to.eql("entityid");
            expect(localFieldResult.result[1].field).to.eql("field15");
            expect(localFieldResult.result[2].field).to.eql("field2");
            expect(localFieldResult.result[2].label).to.eql("FIELD2");
            expect(localFieldResult.result[3].field).to.eql("field3");
            expect(localFieldResult.result[4].field).to.eql("field4");
            expect(localFieldResult.result[5].field).to.eql("field6");
            expect(localFieldResult.result[6].field).to.eql("field7");
            return dbToUpdate.query({$collection:"pl.fields", $filter:{"collectionid._id":collection}, $sort:{field:1}});
        }).then(
        function (mergeFieldResult) {
            expect(mergeFieldResult.result).to.have.length(7);
            expect(mergeFieldResult.result[0].field).to.eql("entityid");
            expect(mergeFieldResult.result[1].field).to.eql("field15");
            expect(mergeFieldResult.result[2].field).to.eql("field2");
            expect(mergeFieldResult.result[2].label).to.eql("FIELD2");
            expect(mergeFieldResult.result[3].field).to.eql("field3");
            expect(mergeFieldResult.result[4].field).to.eql("field4");
            expect(mergeFieldResult.result[5].field).to.eql("field6");
            expect(mergeFieldResult.result[6].field).to.eql("field7");
        }).then(
        function () {
            return dbToUpdate.query({$collection:"pl.referredfks", $events:false, $modules:false, $sort:{field:1}});
        }).then(
        function (localReferredfksResult) {
            expect(localReferredfksResult.result).to.have.length(1);
            expect(localReferredfksResult.result[0].field).to.eql("entityid");
            expect(localReferredfksResult.result[0].referredfieldid.field).to.eql("entityid");
            expect(localReferredfksResult.result[0].referredcollectionid.collection).to.eql("entities");
            expect(localReferredfksResult.result[0].collectionid.collection).to.eql("relationships");
            return dbToUpdate.query({$collection:"pl.referredfks", $filter:{"collectionid._id":collection}, $sort:{field:1}});
        }).then(
        function (mergeReferredfksResult) {
            expect(mergeReferredfksResult.result).to.have.length(1);
            expect(mergeReferredfksResult.result).to.have.length(1);
            expect(mergeReferredfksResult.result[0].field).to.eql("entityid");
            expect(mergeReferredfksResult.result[0].referredfieldid.field).to.eql("entityid");
            expect(mergeReferredfksResult.result[0].referredcollectionid.collection).to.eql("entities");
            expect(mergeReferredfksResult.result[0].collectionid.collection).to.eql("relationships");
        }).then(
        function () {
            return dbToUpdate.query({$collection:"pl.collections", $filter:{collection:"tasks"}, $fields:{_id:1, collection:1}})
        }).then(
        function (collectionInfo) {
            collection = collectionInfo.result[0]._id;
            return dbToUpdate.update({$collection:"pl.fields", $insert:[
                {field:"field1", type:"string", collectionid:{_id:collection}}
            ]});
        }).then(
        function () {
            return dbToUpdate.query({$collection:"pl.fields", $filter:{"collectionid._id":collection}, $events:false, $modules:false, $sort:{field:1}});
        }).then(
        function (localFieldResult) {
            expect(localFieldResult.result).to.have.length(1);
            expect(localFieldResult.result[0].field).to.eql("field1");
            return dbToUpdate.query({$collection:"pl.fields", $filter:{"collectionid._id":collection}, $sort:{field:1}});
        }).then(
        function (mergeFieldResult) {
            expect(mergeFieldResult.result).to.have.length(1);
            expect(mergeFieldResult.result[0].field).to.eql("field1");
        })
}

function updateMenu(dbToUpdate) {
    var application = undefined;
    var menus = undefined;
    return dbToUpdate.query({$collection:"pl.applications", $filter:{label:"Northwind CRM"}, $fields:{_id:1}}).then(
        function (applicationInfo) {
            application = applicationInfo.result[0]._id;
            return dbToUpdate.query({$collection:"pl.menus", $filter:{"application._id":application}, $fields:{_id:1, label:1}});
        }).then(
        function (menuInfo) {
            menus = menuInfo.result;
            var opportunityMenu = undefined;
            var relationshipsMenu = undefined;
            for (var i = 0; i < menus.length; i++) {
                if (menus[i].label === "Opportunities") {
                    opportunityMenu = menus[i];
                }
                if (menus[i].label === "Relationships") {
                    relationshipsMenu = menus[i];
                }
            }
            return dbToUpdate.update({$collection:"pl.menus", $insert:[
                {label:"Tasks", collection:"tasks", application:{_id:application}}
            ], $delete:[
                {_id:opportunityMenu._id}
            ], $update:[
                {_id:relationshipsMenu._id, $set:{label:"Leads"}}
            ]});
        }).then(
        function () {
            return dbToUpdate.query({$collection:"pl.menus", $events:false, $modules:false, $sort:{label:1}});
        }).then(
        function (localMenuResult) {
            expect(localMenuResult.result).to.have.length(5);
            expect(localMenuResult.result[0].label).to.eql("Entities");
            expect(localMenuResult.result[1].label).to.eql("Leads");
            expect(localMenuResult.result[2].label).to.eql("Products");
            expect(localMenuResult.result[3].label).to.eql("Setup");
            expect(localMenuResult.result[4].label).to.eql("Tasks");
            return dbToUpdate.query({$collection:"pl.menus", $filter:{"application._id":application}, $sort:{label:1}});
        }).then(function (mergeMenuResult) {
            expect(mergeMenuResult.result).to.have.length(5);
            expect(mergeMenuResult.result[0].label).to.eql("Entities");
            expect(mergeMenuResult.result[1].label).to.eql("Leads");
            expect(mergeMenuResult.result[2].label).to.eql("Products");
            expect(mergeMenuResult.result[3].label).to.eql("Setup");
            expect(mergeMenuResult.result[4].label).to.eql("Tasks");
        })

}

function expectSandBoxDBChanges(db) {
    return getAllDeveloperData(db).then(
        function (data) {
            expectSandboxCommitDataonLocal(data);
        }).then(
        function () {
            return getAllDeveloperData(db, true);
        }).then(
        function (data) {
            expectSandboxCommitDataonMerged(data);
        })
}

function expectSandboxCommitDataonLocal(data) {
    var applications = data["pl.applications"];
    expect(applications).to.have.length(1);
    expect(applications[0].label).to.eql("Northwind CRM");
    expect(applications[0].db).to.eql("developer");
    expect(applications[0].roles).to.have.length(1);
    expect(applications[0].roles[0].role.role).to.eql("Northwind CRM");

    var roles = data["pl.roles"];
    expect(roles).to.have.length(0);

    var functions = data["pl.functions"];
    expect(functions).to.have.length(0);

    var menus = data["pl.menus"];
    expect(menus).to.have.length(5);

    expect(menus[0].label).to.eql("Entities");
    expect(menus[0].collection).to.eql("entities");
    expect(menus[0].application.label).to.eql("Northwind CRM");
    expect(menus[0].parentmenu.label).to.eql("Setup");

    expect(menus[1].label).to.eql("Leads");
    expect(menus[1].collection).to.eql("relationships");
    expect(menus[1].application.label).to.eql("Northwind CRM");

    expect(menus[2].label).to.eql("Products");
    expect(menus[2].collection).to.eql("products");
    expect(menus[2].application.label).to.eql("Northwind CRM");

    expect(menus[2].parentmenu.label).to.eql("Setup");

    expect(menus[3].label).to.eql("Setup");
    expect(menus[3].collection).to.eql(undefined);
    expect(menus[3].application.label).to.eql("Northwind CRM");

    expect(menus[4].label).to.eql("Tasks");
    expect(menus[4].collection).to.eql("tasks");
    expect(menus[4].application.label).to.eql("Northwind CRM");

    var collections = data["pl.collections"];
    expect(collections).to.have.length(2);
    expect(collections[0].collection).to.eql("relationships");
    expect(collections[0].db).to.eql("developer");

    expect(collections[1].collection).to.eql("tasks");
    expect(collections[1].db).to.eql("northwinddaffodil_sb");

    var referredFks = data["pl.referredfks"];
    expect(referredFks).to.have.length(1);
    expect(referredFks[0].collectionid.collection).to.eql("relationships");
    expect(referredFks[0].field).to.eql("entityid");
    expect(referredFks[0].set).to.eql(["entityname"]);
    expect(referredFks[0].referredcollectionid.collection).to.eql("entities");
    expect(referredFks[0].referredfieldid.field).to.eql("entityid");

    var indexes = data["pl.indexes"];
    expect(indexes).to.have.length(1);
    expect(indexes[0].name).to.eql("index4");
    expect(indexes[0].unique).to.eql(false);
    expect(indexes[0].collectionid.collection).to.eql("relationships");
    expect(indexes[0].indexes).to.eql(JSON.stringify({field1:1}));

    var actions = data["pl.actions"];
    expect(actions).to.have.length(1);
    expect(actions[0].label).to.eql("Commit4");
    expect(actions[0].type).to.eql("invoke");
    expect(actions[0].collectionid.collection).to.eql("relationships");

    var formgroups = data["pl.formgroups"];

    expect(formgroups).to.have.length(1);
    expect(formgroups[0].type).to.eql("form");
    expect(formgroups[0].noOfColumnsPerRow).to.eql(1);
    expect(formgroups[0].Title).to.eql("Title4");
    expect(formgroups[0].showTitle).to.eql(true);
    expect(formgroups[0].collectionid.collection).to.eql("relationships");

    var fields = data["pl.fields"];
    expect(fields).to.have.length(8);
    expect(fields[0].field).to.eql("entityid");
    expect(fields[0].type).to.eql("fk");
    expect(fields[0].collectionid.collection).to.eql("relationships");
    expect(fields[0].set).to.eql(["entityname"]);
    expect(fields[0].collection).to.eql("entities");

    expect(fields[1].field).to.eql("field1");
    expect(fields[1].type).to.eql("string");
    expect(fields[1].collectionid.collection).to.eql("tasks");

    expect(fields[2].field).to.eql("field15");
    expect(fields[2].type).to.eql("string");
    expect(fields[2].collectionid.collection).to.eql("relationships");

    expect(fields[3].field).to.eql("field2");
    expect(fields[3].label).to.eql("FIELD2");
    expect(fields[3].type).to.eql("string");
    expect(fields[3].collectionid.collection).to.eql("relationships");

    expect(fields[4].field).to.eql("field3");
    expect(fields[4].type).to.eql("string");
    expect(fields[4].collectionid.collection).to.eql("relationships");

    expect(fields[5].field).to.eql("field4");
    expect(fields[5].type).to.eql("object");
    expect(fields[5].collectionid.collection).to.eql("relationships");

    expect(fields[6].field).to.eql("field6");
    expect(fields[6].type).to.eql("boolean");
    expect(fields[6].collectionid.collection).to.eql("relationships");
    expect(fields[6].parentfieldid.field).to.eql("field4");

    expect(fields[7].field).to.eql("field7");
    expect(fields[7].type).to.eql("boolean");
    expect(fields[7].collectionid.collection).to.eql("relationships");
    expect(fields[7].parentfieldid.field).to.eql("field4");
}

function expectSandboxCommitDataonMerged(data) {
    var applications = data["pl.applications"];
    expect(applications).to.have.length(1);
    expect(applications[0].label).to.eql("Northwind CRM");
    expect(applications[0].db).to.eql("developer");
    expect(applications[0].roles).to.have.length(1);
    expect(applications[0].roles[0].role.role).to.eql("Northwind CRM");

    var roles = data["pl.roles"];
    expect(roles).to.have.length(1);
    expect(roles[0].role).to.eql("Northwind CRM");
    expect(roles[0].db).to.eql("developer");

    var functions = data["pl.functions"];
    expect(functions).to.have.length(1);
    expect(functions[0].name).to.eql("Invoicess");
    expect(functions[0].source).to.eql("ApplaneApps/lib/apps/trigger");
    expect(functions[0].type).to.eql("js");
    expect(functions[0].db).to.eql("developer");

    var menus = data["pl.menus"];
    expect(menus).to.have.length(5);

    expect(menus[0].label).to.eql("Entities");
    expect(menus[0].collection).to.eql("entities");
    expect(menus[0].application.label).to.eql("Northwind CRM");
    expect(menus[0].parentmenu.label).to.eql("Setup");

    expect(menus[1].label).to.eql("Leads");
    expect(menus[1].collection).to.eql("relationships");
    expect(menus[1].application.label).to.eql("Northwind CRM");

    expect(menus[2].label).to.eql("Products");
    expect(menus[2].collection).to.eql("products");
    expect(menus[2].application.label).to.eql("Northwind CRM");
    expect(menus[2].parentmenu.label).to.eql("Setup");

    expect(menus[3].label).to.eql("Setup");
    expect(menus[3].collection).to.eql(undefined);
    expect(menus[3].application.label).to.eql("Northwind CRM");

    expect(menus[4].label).to.eql("Tasks");
    expect(menus[4].collection).to.eql("tasks");
    expect(menus[4].application.label).to.eql("Northwind CRM");

    var collections = data["pl.collections"];
    expect(collections).to.have.length(5);
    expect(collections[0].collection).to.eql("entities");
    expect(collections[0].db).to.eql("developer");

    expect(collections[1].collection).to.eql("opportunities");
    expect(collections[1].db).to.eql("developer");

    expect(collections[2].collection).to.eql("products");
    expect(collections[2].db).to.eql("developer");

    expect(collections[3].collection).to.eql("relationships");
    expect(collections[3].db).to.eql("developer");

    expect(collections[4].collection).to.eql("tasks");
    expect(collections[4].db).to.eql("northwinddaffodil_sb");

    var referredFks = data["pl.referredfks"];
    expect(referredFks).to.have.length(1);
    expect(referredFks[0].collectionid.collection).to.eql("relationships");
    expect(referredFks[0].field).to.eql("entityid");
    expect(referredFks[0].set).to.eql(["entityname"]);
    expect(referredFks[0].referredcollectionid.collection).to.eql("entities");
    expect(referredFks[0].referredfieldid.field).to.eql("entityid");

    var indexes = data["pl.indexes"];
    expect(indexes).to.have.length(4);
    expect(indexes[0].name).to.eql("index1");
    expect(indexes[0].unique).to.eql(true);
    expect(indexes[0].collectionid.collection).to.eql("entities");
    expect(indexes[0].indexes).to.eql(JSON.stringify({field1:1}));

    expect(indexes[1].name).to.eql("index2");
    expect(indexes[1].unique).to.eql(false);
    expect(indexes[1].collectionid.collection).to.eql("opportunities");
    expect(indexes[1].indexes).to.eql(JSON.stringify({field1:1}));

    expect(indexes[2].name).to.eql("index3");
    expect(indexes[2].unique).to.eql(true);
    expect(indexes[2].collectionid.collection).to.eql("products");
    expect(indexes[2].indexes).to.eql(JSON.stringify({field1:1}));

    expect(indexes[3].name).to.eql("index4");
    expect(indexes[3].unique).to.eql(false);
    expect(indexes[3].collectionid.collection).to.eql("relationships");
    expect(indexes[3].indexes).to.eql(JSON.stringify({field1:1}));

    var actions = data["pl.actions"];
    expect(actions).to.have.length(4);
    expect(actions[0].label).to.eql("Commit1");
    expect(actions[0].type).to.eql("invoke");
    expect(actions[0].collectionid.collection).to.eql("entities");

    expect(actions[1].label).to.eql("Commit2");
    expect(actions[1].type).to.eql("invoke");
    expect(actions[1].collectionid.collection).to.eql("opportunities");

    expect(actions[2].label).to.eql("Commit3");
    expect(actions[2].type).to.eql("invoke");
    expect(actions[2].collectionid.collection).to.eql("products");

    expect(actions[3].label).to.eql("Commit4");
    expect(actions[3].type).to.eql("invoke");
    expect(actions[3].collectionid.collection).to.eql("relationships");

    var formgroups = data["pl.formgroups"];

    expect(formgroups).to.have.length(4);
    expect(formgroups[0].type).to.eql("form");
    expect(formgroups[0].noOfColumnsPerRow).to.eql(1);
    expect(formgroups[0].Title).to.eql("Title1");
    expect(formgroups[0].showTitle).to.eql(true);
    expect(formgroups[0].collectionid.collection).to.eql("entities");

    expect(formgroups[1].type).to.eql("form");
    expect(formgroups[1].noOfColumnsPerRow).to.eql(1);
    expect(formgroups[1].Title).to.eql("Title2");
    expect(formgroups[1].showTitle).to.eql(false);
    expect(formgroups[1].collectionid.collection).to.eql("opportunities");

    expect(formgroups[2].type).to.eql("form");
    expect(formgroups[2].noOfColumnsPerRow).to.eql(1);
    expect(formgroups[2].Title).to.eql("Title3");
    expect(formgroups[2].showTitle).to.eql(false);
    expect(formgroups[2].collectionid.collection).to.eql("products");

    expect(formgroups[3].type).to.eql("form");
    expect(formgroups[3].noOfColumnsPerRow).to.eql(1);
    expect(formgroups[3].Title).to.eql("Title4");
    expect(formgroups[3].showTitle).to.eql(true);
    expect(formgroups[3].collectionid.collection).to.eql("relationships");

    var qviews = data["pl.qviews"];

    expect(qviews).to.have.length(5);

    expect(qviews[0].id).to.eql("entities");
    expect(qviews[0].label).to.eql("Entities");
    expect(qviews[0].collection.collection).to.eql("entities");

    expect(qviews[1].id).to.eql("opportunities");
    expect(qviews[1].label).to.eql("Opportunities");
    expect(qviews[1].collection.collection).to.eql("opportunities");

    expect(qviews[2].id).to.eql("products");
    expect(qviews[2].label).to.eql("Products");
    expect(qviews[2].collection.collection).to.eql("products");

    expect(qviews[3].id).to.eql("relationships");
    expect(qviews[3].label).to.eql("Relationships");
    expect(qviews[3].collection.collection).to.eql("relationships");

    expect(qviews[4].id).to.eql("tasks");
    expect(qviews[4].label).to.eql("Tasks");
    expect(qviews[4].collection.collection).to.eql("tasks");

    var fields = data["pl.fields"];
    expect(fields).to.have.length(10);

    expect(fields[0].field).to.eql("entityid");
    expect(fields[0].type).to.eql("fk");
    expect(fields[0].collectionid.collection).to.eql("relationships");
    expect(fields[0].set).to.eql(["entityname"]);
    expect(fields[0].collection).to.eql("entities");

    expect(fields[1].field).to.eql("entityname");
    expect(fields[1].type).to.eql("string");
    expect(fields[1].collectionid.collection).to.eql("entities");

    expect(fields[2].field).to.eql("field1");
    expect(fields[2].type).to.eql("string");
    expect(fields[2].collectionid.collection).to.eql("tasks");

    expect(fields[3].field).to.eql("field15");
    expect(fields[3].type).to.eql("string");
    expect(fields[3].collectionid.collection).to.eql("relationships");

    expect(fields[4].field).to.eql("field2");
    expect(fields[4].label).to.eql("FIELD2");
    expect(fields[4].type).to.eql("string");
    expect(fields[4].collectionid.collection).to.eql("relationships");

    expect(fields[5].field).to.eql("field3");
    expect(fields[5].type).to.eql("string");
    expect(fields[5].collectionid.collection).to.eql("relationships");

    expect(fields[6].field).to.eql("field4");
    expect(fields[6].type).to.eql("object");
    expect(fields[6].multiple).to.eql(true);
    expect(fields[6].collectionid.collection).to.eql("relationships");

    expect(fields[7].field).to.eql("field6");
    expect(fields[7].type).to.eql("boolean");
    expect(fields[7].parentfieldid.field).to.eql("field4");
    expect(fields[7].collectionid.collection).to.eql("relationships");

    expect(fields[8].field).to.eql("field7");
    expect(fields[8].type).to.eql("boolean");
    expect(fields[8].collectionid.collection).to.eql("relationships");
    expect(fields[8].parentfieldid.field).to.eql("field4");

    expect(fields[9].field).to.eql("product");
    expect(fields[9].type).to.eql("string");
    expect(fields[9].collectionid.collection).to.eql("products");

}

function getDataAndExpectFromDbs(northwindDarclDb, northwindNavigant, northwindDaffodil, northwindDaffodil_sb) {
    return getDataAndExpect(northwindDarclDb).then(
        function () {
            if (northwindNavigant) {
                return getDataAndExpect(northwindNavigant);
            }
        }).then(
        function () {
            if (northwindDaffodil) {
                return getDataAndExpect(northwindDaffodil);
            }
        }).then(
        function () {
            if (northwindDaffodil_sb) {
                return getDataAndExpect(northwindDaffodil_sb);
            }
        })
}

function createApplicationAndCommitInAdmin(superAdminDb, develoerDb) {
    return insertDataForDeveloer(develoerDb).then(
        function () {
            return getAllDeveloperData(develoerDb);
        }).then(
        function (data) {
            return expectInsertedDeveloperData(data);
        }).then(
        function () {
            return Commit.commitProcess({data:{commit:true}}, develoerDb);
        }).then(
        function () {
            return getAllDeveloperData(superAdminDb);
        }).then(
        function (data) {
            return expectInsertedDeveloperData(data);
        }).then(
        function () {
            return getDataAndExpect(develoerDb);
        })
}

function getDataAndExpect(develoerDb) {
    return getAllDeveloperData(develoerDb).then(
        function (developerData) {
            return expectBlankData(developerData);
        }).then(
        function () {
            return getAllDeveloperData(develoerDb, true);
        }).then(
        function (developerData) {
            return expectInsertedDeveloperData(developerData);
        })
}

function expectBlankData(data) {
    expect(data["pl.applications"]).to.have.length(0);
    expect(data["pl.roles"]).to.have.length(0);
    expect(data["pl.menus"]).to.have.length(0);
    expect(data["pl.functions"]).to.have.length(0);
    expect(data["pl.collections"]).to.have.length(0);
    expect(data["pl.referredfks"]).to.have.length(0);
    expect(data["pl.indexes"]).to.have.length(0);
    expect(data["pl.actions"]).to.have.length(0);
    expect(data["pl.formgroups"]).to.have.length(0);
    expect(data["pl.qviews"]).to.have.length(0);
    expect(data["pl.fields"]).to.have.length(0);
}

function expectInsertedDeveloperData(data) {
    var applications = data["pl.applications"];
    expect(applications).to.have.length(1);
    expect(applications[0].label).to.eql("Northwind CRM");
    expect(applications[0].db).to.eql("developer");
    expect(applications[0].roles).to.have.length(1);
    expect(applications[0].roles[0].role.role).to.eql("Northwind CRM");

    var roles = data["pl.roles"];
    expect(roles).to.have.length(1);
    expect(roles[0].role).to.eql("Northwind CRM");
    expect(roles[0].db).to.eql("developer");

    var functions = data["pl.functions"];
    expect(functions).to.have.length(1);
    expect(functions[0].name).to.eql("Invoicess");
    expect(functions[0].source).to.eql("ApplaneApps/lib/apps/trigger");
    expect(functions[0].type).to.eql("js");
    expect(functions[0].db).to.eql("developer");

    var menus = data["pl.menus"];
    expect(menus).to.have.length(5);

    expect(menus[0].label).to.eql("Entities");
    expect(menus[0].collection).to.eql("entities");
    expect(menus[0].application.label).to.eql("Northwind CRM");
    expect(menus[0].parentmenu.label).to.eql("Setup");

    expect(menus[1].label).to.eql("Opportunities");
    expect(menus[1].collection).to.eql("opportunities");
    expect(menus[1].application.label).to.eql("Northwind CRM");

    expect(menus[2].label).to.eql("Products");
    expect(menus[2].collection).to.eql("products");
    expect(menus[2].application.label).to.eql("Northwind CRM");
    expect(menus[2].parentmenu.label).to.eql("Setup");

    expect(menus[3].label).to.eql("Relationships");
    expect(menus[3].collection).to.eql("relationships");
    expect(menus[3].application.label).to.eql("Northwind CRM");

    expect(menus[4].label).to.eql("Setup");
    expect(menus[4].collection).to.eql(undefined);
    expect(menus[4].application.label).to.eql("Northwind CRM");

    var collections = data["pl.collections"];
    expect(collections).to.have.length(4);
    expect(collections[0].collection).to.eql("entities");
    expect(collections[0].db).to.eql("developer");

    expect(collections[1].collection).to.eql("opportunities");
    expect(collections[1].db).to.eql("developer");

    expect(collections[2].collection).to.eql("products");
    expect(collections[2].db).to.eql("developer");

    expect(collections[3].collection).to.eql("relationships");
    expect(collections[3].db).to.eql("developer");

    var referredFks = data["pl.referredfks"];
    expect(referredFks).to.have.length(2);
    expect(referredFks[0].collectionid.collection).to.eql("relationships");
    expect(referredFks[0].field).to.eql("entityid");
    expect(referredFks[0].set).to.eql(["entityname"]);
    expect(referredFks[0].referredcollectionid.collection).to.eql("entities");
    expect(referredFks[0].referredfieldid.field).to.eql("entityid");

    expect(referredFks[1].collectionid.collection).to.eql("relationships");
    expect(referredFks[1].field).to.eql("field4.$.field5");
    expect(referredFks[1].set).to.eql(["entityname"]);
    expect(referredFks[1].referredcollectionid.collection).to.eql("entities");
    expect(referredFks[1].referredfieldid.field).to.eql("field5");

    var indexes = data["pl.indexes"];
    expect(indexes).to.have.length(4);
    expect(indexes[0].name).to.eql("index1");
    expect(indexes[0].unique).to.eql(true);
    expect(indexes[0].collectionid.collection).to.eql("entities");
    expect(indexes[0].indexes).to.eql(JSON.stringify({field1:1}));

    expect(indexes[1].name).to.eql("index2");
    expect(indexes[1].unique).to.eql(false);
    expect(indexes[1].collectionid.collection).to.eql("opportunities");
    expect(indexes[1].indexes).to.eql(JSON.stringify({field1:1}));

    expect(indexes[2].name).to.eql("index3");
    expect(indexes[2].unique).to.eql(true);
    expect(indexes[2].collectionid.collection).to.eql("products");
    expect(indexes[2].indexes).to.eql(JSON.stringify({field1:1}));

    expect(indexes[3].name).to.eql("index4");
    expect(indexes[3].unique).to.eql(false);
    expect(indexes[3].collectionid.collection).to.eql("relationships");
    expect(indexes[3].indexes).to.eql(JSON.stringify({field1:1}));

    var actions = data["pl.actions"];
    expect(actions).to.have.length(4);
    expect(actions[0].label).to.eql("Commit1");
    expect(actions[0].type).to.eql("invoke");
    expect(actions[0].collectionid.collection).to.eql("entities");

    expect(actions[1].label).to.eql("Commit2");
    expect(actions[1].type).to.eql("invoke");
    expect(actions[1].collectionid.collection).to.eql("opportunities");

    expect(actions[2].label).to.eql("Commit3");
    expect(actions[2].type).to.eql("invoke");
    expect(actions[2].collectionid.collection).to.eql("products");

    expect(actions[3].label).to.eql("Commit4");
    expect(actions[3].type).to.eql("invoke");
    expect(actions[3].collectionid.collection).to.eql("relationships");

    var formgroups = data["pl.formgroups"];

    expect(formgroups).to.have.length(4);
    expect(formgroups[0].type).to.eql("form");
    expect(formgroups[0].noOfColumnsPerRow).to.eql(1);
    expect(formgroups[0].Title).to.eql("Title1");
    expect(formgroups[0].showTitle).to.eql(true);
    expect(formgroups[0].collectionid.collection).to.eql("entities");

    expect(formgroups[1].type).to.eql("form");
    expect(formgroups[1].noOfColumnsPerRow).to.eql(1);
    expect(formgroups[1].Title).to.eql("Title2");
    expect(formgroups[1].showTitle).to.eql(false);
    expect(formgroups[1].collectionid.collection).to.eql("opportunities");

    expect(formgroups[2].type).to.eql("form");
    expect(formgroups[2].noOfColumnsPerRow).to.eql(1);
    expect(formgroups[2].Title).to.eql("Title3");
    expect(formgroups[2].showTitle).to.eql(false);
    expect(formgroups[2].collectionid.collection).to.eql("products");

    expect(formgroups[3].type).to.eql("form");
    expect(formgroups[3].noOfColumnsPerRow).to.eql(1);
    expect(formgroups[3].Title).to.eql("Title4");
    expect(formgroups[3].showTitle).to.eql(true);
    expect(formgroups[3].collectionid.collection).to.eql("relationships");

    var qviews = data["pl.qviews"];

    expect(qviews).to.have.length(4);

    expect(qviews[0].id).to.eql("entities");
    expect(qviews[0].label).to.eql("Entities");
    expect(qviews[0].collection.collection).to.eql("entities");

    expect(qviews[1].id).to.eql("opportunities");
    expect(qviews[1].label).to.eql("Opportunities");
    expect(qviews[1].collection.collection).to.eql("opportunities");

    expect(qviews[2].id).to.eql("products");
    expect(qviews[2].label).to.eql("Products");
    expect(qviews[2].collection.collection).to.eql("products");

    expect(qviews[3].id).to.eql("relationships");
    expect(qviews[3].label).to.eql("Relationships");
    expect(qviews[3].collection.collection).to.eql("relationships");

    var fields = data["pl.fields"];
    expect(fields).to.have.length(10);

    expect(fields[0].field).to.eql("entityid");
    expect(fields[0].type).to.eql("fk");
    expect(fields[0].collectionid.collection).to.eql("relationships");
    expect(fields[0].set).to.eql(["entityname"]);
    expect(fields[0].collection).to.eql("entities");

    expect(fields[1].field).to.eql("entityname");
    expect(fields[1].type).to.eql("string");
    expect(fields[1].collectionid.collection).to.eql("entities");

    expect(fields[2].field).to.eql("field2");
    expect(fields[2].type).to.eql("string");
    expect(fields[2].collectionid.collection).to.eql("relationships");

    expect(fields[3].field).to.eql("field3");
    expect(fields[3].type).to.eql("string");
    expect(fields[3].collectionid.collection).to.eql("relationships");

    expect(fields[4].field).to.eql("field4");
    expect(fields[4].type).to.eql("object");
    expect(fields[4].multiple).to.eql(true);
    expect(fields[4].collectionid.collection).to.eql("relationships");

    expect(fields[5].field).to.eql("field5");
    expect(fields[5].type).to.eql("fk");
    expect(fields[5].set).to.eql(["entityname"]);
    expect(fields[5].collection).to.eql("entities");
    expect(fields[5].parentfieldid.field).to.eql("field4");
    expect(fields[5].collectionid.collection).to.eql("relationships");

    expect(fields[6].field).to.eql("field6");
    expect(fields[6].type).to.eql("boolean");
    expect(fields[6].parentfieldid.field).to.eql("field4");
    expect(fields[6].collectionid.collection).to.eql("relationships");

    expect(fields[7].field).to.eql("field7");
    expect(fields[7].type).to.eql("boolean");
    expect(fields[7].collectionid.collection).to.eql("relationships");
    expect(fields[7].parentfieldid.field).to.eql("field4");

    expect(fields[8].field).to.eql("lead");
    expect(fields[8].type).to.eql("string");
    expect(fields[8].collectionid.collection).to.eql("relationships");

    expect(fields[9].field).to.eql("product");
    expect(fields[9].type).to.eql("string");
    expect(fields[9].collectionid.collection).to.eql("products");

}

function getAllDeveloperData(db, events) {
    var data = {};
    var applications = "pl.applications";
    var roles = "pl.roles";
    var menus = "pl.menus";
    var functions = "pl.functions";
    var collections = "pl.collections";
    var fields = "pl.fields";
    var actions = "pl.actions";
    var referredfks = "pl.referredfks";
    var formgroups = "pl.formgroups";
    var indexes = "pl.indexes";
    var qviews = "pl.qviews";

    var query = {$collection:applications, $sort:{label:1}};
    if (!events) {
        query.$events = false;
        query.$modules = false;
    }
    var collectionIds = [];
    return db.query(query).then(
        function (result) {
            data[applications] = result.result;
            query = {$collection:roles, $sort:{role:1}};
            if (!events) {
                query.$events = false;
                query.$modules = false;
            }
            return db.query(query);
        }).then(
        function (result) {
            data[roles] = result.result;
            query = {$collection:menus, $sort:{label:1}};
            if (!events) {
                query.$events = false;
                query.$modules = false;
            } else {
                query.$filter = {"application._id":data[applications][0]._id};
            }
            return db.query(query);
        }).then(
        function (result) {
            data[menus] = result.result;
            query = {$collection:functions, $sort:{function:1}};
            if (!events) {
                query.$events = false;
                query.$modules = false;
            }
            return db.query(query);
        }).then(
        function (result) {
            data[functions] = result.result;
            query = {$collection:collections, $sort:{collection:1}, $filter:{collection:{$in:["relationships", "opportunities", "entities", "products", "tasks", "vendors"]}}};
            if (!events) {
                query.$events = false;
                query.$modules = false;
            }
            return db.query(query);
        }).then(
        function (result) {
            data[collections] = result.result;
            for (var i = 0; i < result.result.length; i++) {
                collectionIds.push(result.result[i]._id);
            }
            query = {$collection:fields, $sort:{field:1}, $filter:{"collectionid.collection":{$in:["relationships", "opportunities", "entities", "products", "tasks", "vendors"]}}};
            if (!events) {
                query.$events = false;
                query.$modules = false;
            } else {
                query.$filter = {"collectionid._id":{$in:collectionIds}};
            }
            return db.query(query);
        }).then(
        function (result) {
            data[fields] = result.result;
            query = {$collection:referredfks, $sort:{field:1}, $filter:{"collectionid.collection":{$in:["relationships", "opportunities", "entities", "products", "tasks", "vendors"]}}};
            if (!events) {
                query.$events = false;
                query.$modules = false;
            } else {
                query.$filter = {"collectionid._id":{$in:collectionIds}};
            }
            return db.query(query);
        }).then(
        function (result) {
            data[referredfks] = result.result;
            query = {$collection:indexes, $sort:{name:1}};
            if (!events) {
                query.$events = false;
                query.$modules = false;
            } else {
                query.$filter = {"collectionid._id":{$in:collectionIds}};
            }
            return db.query(query);
        }).then(
        function (result) {
            data[indexes] = result.result;
            query = {$collection:actions, $sort:{label:1}};
            if (!events) {
                query.$events = false;
            } else {
                query.$filter = {"collectionid._id":{$in:collectionIds}};
            }
            return db.query(query);
        }).then(
        function (result) {
            data[actions] = result.result;
            query = {$collection:formgroups, $sort:{Title:1}};
            if (!events) {
                query.$events = false;
                query.$modules = false;
            } else {
                query.$filter = {"collectionid._id":{$in:collectionIds}};
            }
            return db.query(query);
        }).then(
        function (result) {
            data[formgroups] = result.result;
            query = {$collection:qviews, $sort:{id:1}};
            if (!events) {
                query.$events = false;
                query.$modules = false;
            } else {
                query.$filter = {"collection._id":{$in:collectionIds}};
            }
            return db.query(query);
        }).then(
        function (result) {
            data[qviews] = result.result;
        }).then(
        function () {
            return data;
        })
}

function insertDataForDeveloer(db) {
    var collections = undefined;
    return db.update({$collection:"pl.applications", $insert:[
        {label:"Northwind CRM"}
    ]}).then(
        function (result) {
            return db.query({$collection:"pl.roles"});
        }).then(
        function (result) {
            expect(result.result).to.have.length(1);
            return db.query({$collection:"pl.applications"});
        }).then(
        function (result) {
            expect(result.result).to.have.length(1);
            expect(result.result[0].roles).to.have.length(1);
            expect(result.result[0].roles[0].role.role).to.eql("Northwind CRM");
            var applicationId = result.result[0]._id;
            return  db.update({$collection:"pl.menus", $insert:[
                {label:"Relationships", collection:"relationships", application:{_id:applicationId}},
                {label:"Opportunities", collection:"opportunities", application:{_id:applicationId}},
                {label:"Setup", application:{_id:applicationId}}
            ]});
        }).then(
        function (result) {
            result = result["pl.menus"]["$insert"];
            var menuId = result[2]._id;
            return db.update({$collection:"pl.menus", $insert:[
                {label:"Entities", collection:"entities", application:result[2].application, parentmenu:{$query:{label:"Setup", application:result[2].application}}},
                {label:"Products", collection:"products", application:result[2].application, parentmenu:{$query:{label:"Setup", application:result[2].application}}}
            ]});
        }).then(
        function () {
            return db.query({$collection:"pl.qviews", $filter:{"collection.collection":{$in:["relationships", "opportunities", "entities", "products", "tasks", "vendors"]}}, $events:false, $modules:false});
        }).then(
        function (result) {
            expect(result.result).to.have.length(4);
            return db.update({$collection:"pl.functions", $insert:[
                {name:"Invoicess", source:"ApplaneApps/lib/apps/trigger", type:"js"}
            ]});
        }).then(
        function (result) {
            return db.query({$collection:"pl.collections", $filter:{collection:{$in:["relationships", "opportunities", "entities", "products", "tasks", "vendors"]}}, $sort:{collection:1}});
        }).then(
        function (result) {
            expect(result.result).to.have.length(4);
            collections = result.result;
            return db.update({$collection:"pl.actions", $insert:[
                {label:"Commit1", id:"Commit1", type:"invoke", collectionid:{_id:collections[0]._id}},
                {label:"Commit2", id:"Commit2", type:"invoke", collectionid:{_id:collections[1]._id}},
                {label:"Commit3", id:"Commit3", type:"invoke", collectionid:{_id:collections[2]._id}},
                {label:"Commit4", id:"Commit4", type:"invoke", collectionid:{_id:collections[3]._id}}
            ]});
        }).then(
        function () {
            return db.update({$collection:"pl.formgroups", $insert:[
                {type:"form", noOfColumnsPerRow:1, Title:"Title1", showTitle:true, collectionid:{_id:collections[0]._id}},
                {type:"form", noOfColumnsPerRow:1, Title:"Title2", showTitle:false, collectionid:{_id:collections[1]._id}},
                {type:"form", noOfColumnsPerRow:1, Title:"Title3", showTitle:false, collectionid:{_id:collections[2]._id}},
                {type:"form", noOfColumnsPerRow:1, Title:"Title4", showTitle:true, collectionid:{_id:collections[3]._id}}
            ]});
        }).then(
        function () {
            return db.update({$collection:"pl.indexes", $insert:[
                {name:"index1", unique:true, indexes:JSON.stringify({field1:1}), collectionid:{_id:collections[0]._id}},
                {name:"index2", unique:false, indexes:JSON.stringify({field1:1}), collectionid:{_id:collections[1]._id}},
                {name:"index3", unique:true, indexes:JSON.stringify({field1:1}), collectionid:{_id:collections[2]._id}},
                {name:"index4", unique:false, indexes:JSON.stringify({field1:1}), collectionid:{_id:collections[3]._id}}
            ]});
        }).then(
        function () {
            return db.update({$collection:"pl.fields", $insert:[
                {field:"product", type:"string", collectionid:{$query:{collection:"products"}}},
                {field:"entityname", type:"string", collectionid:{$query:{collection:"entities"}}},
                {field:"lead", type:"string", collectionid:{$query:{collection:"relationships"}}},
                {field:"entityid", type:"fk", collectionid:{$query:{collection:"relationships"}}, collection:"entities", set:["entityname"]},
                {field:"field2", type:"string", collectionid:{$query:{collection:"relationships"}}},
                {field:"field3", type:"string", collectionid:{$query:{collection:"relationships"}}},
                {field:"field4", type:"object", collectionid:{$query:{collection:"relationships"}}, multiple:true},
                {field:"field5", type:"fk", collectionid:{$query:{collection:"relationships"}}, collection:"entities", set:["entityname"], parentfieldid:{$query:{field:"field4", collectionid:{$query:{collection:"relationships"}}}}},
                {field:"field6", type:"boolean", collectionid:{$query:{collection:"relationships"}}, parentfieldid:{$query:{field:"field4", collectionid:{$query:{collection:"relationships"}}}}},
                {field:"field7", type:"boolean", collectionid:{$query:{collection:"relationships"}}, parentfieldid:{$query:{field:"field4", collectionid:{$query:{collection:"relationships"}}}}}
            ]});
        }).then(
        function () {
            return db.query({$collection:"pl.collections", $filter:{collection:{$in:["relationships", "opportunities"]}}, $sort:{collection:1}});
        }).then(
        function (result) {
            var collectionUpdate = {$collection:"pl.collections", $update:[
                {_id:result.result[1]._id, $set:{events:[
                    {function:"Functions", event:"onQuery", pre:true} ,
                    {function:"Functions", event:"onQuery", post:true},
                    {function:"Functions", event:"onInsert"},
                    {function:"Functions", event:"onSave", pre:true},
                    {function:"Functions", event:"onSave", post:true}
                ]}},
                {_id:result.result[0]._id, $set:{events:[
                    {function:"Functions", event:"onQuery", pre:true} ,
                    {function:"Functions", event:"onValue:[]"},
                    {function:"Functions", event:"onSave", post:true}
                ]}}
            ]};
            return db.update(collectionUpdate);
        })
}

function createConnections(dbs, superAdminDb, develoerDb, northwindDarclDb, northwindNavigant, northwindDaffodil, northwindDaffodil_sb) {
    return ApplaneDB.connect(Config.URL, superAdminDb, Config.OPTIONS).then(
        function (sadb) {
            dbs.superAdminDb = sadb;
            if (develoerDb) {
                return ApplaneDB.connect(Config.URL, develoerDb, Config.OPTIONS);
            }
        }).then(
        function (develoerDb) {
            dbs.develoerDb = develoerDb;
            if (northwindDarclDb) {
                return ApplaneDB.connect(Config.URL, northwindDarclDb, Config.OPTIONS);
            }
        }).then(
        function (northwindDarclDb) {
            dbs.northwindDarclDb = northwindDarclDb;
            if (northwindNavigant) {
                return ApplaneDB.connect(Config.URL, northwindNavigant, Config.OPTIONS);
            }
        }).then(
        function (northwindNavigant) {
            dbs.northwindNavigant = northwindNavigant;
            if (northwindDaffodil) {
                return ApplaneDB.connect(Config.URL, northwindDaffodil, Config.OPTIONS);
            }
        }).then(
        function (northwindDaffodil) {
            dbs.northwindDaffodil = northwindDaffodil;
            if (northwindDaffodil_sb) {
                return ApplaneDB.connect(Config.URL, northwindDaffodil_sb, Config.OPTIONS);
            }
        }).then(
        function (northwindDaffodil_sb) {
            dbs.northwindDaffodil_sb = northwindDaffodil_sb;
        })
}