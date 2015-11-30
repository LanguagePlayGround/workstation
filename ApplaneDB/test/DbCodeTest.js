/**
 *  mocha --recursive --timeout 10000 -g "DBCodeTestcase" --reporter spec
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Constants = require("../lib/Constants.js");
var Testcases = require("./TestCases.js");

describe("DBCodeTestcase", function () {
    afterEach(function (done) {
        Testcases.afterEach(done);
    })
    beforeEach(function (done) {
        var configure = {URL:Config.URL, Admin:Config.Admin, MongoAdmin:Config.MongoAdmin, ENSURE_DB:false};
        ApplaneDB.configure(configure).then(
            function () {
                done()
            }
        ).fail(function (err) {
                done(err);
            })
    })

    it("DBCodeTestcase", function (done) {
        var adminDb = undefined;
        var testingDB = undefined;
        ApplaneDB.connect(Config.URL, Config.ADMIN_DB, Config.ADMIN_OPTIONS).then(
            function (db1) {
                adminDb = db1;
                return adminDb.update({$collection:"pl.dbs", $insert:{db:"testing", globalUserName:"admin", globalPassword:"damin", globalUserAdmin:true, guestUserName:"admin", loginAsGuest:true}})
            }).then(
            function () {
                return  adminDb.query({$collection:"pl.dbs", $filter:{db:"testing"}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].db).to.eql("testing");
                expect(data.result[0].guestUserName).to.eql("admin");
                expect(data.result[0].loginAsGuest).to.eql(true);
                expect(data.result[0]).to.have.property("code");
                return ApplaneDB.connectWithCode(Config.URL, data.result[0].db, data.result[0].code, {username:"admin"})
            }).then(
            function (db1) {
                testingDB = db1;
                var insert = [
                    {$collection:"country", $insert:[
                        {_id:"India", name:"India", code:"91"}
                    ]}
                ]
                return testingDB.update(insert)
            }).then(
            function () {
                return  testingDB.query({$collection:"country"})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].name).to.eql("India");
                expect(data.result[0].code).to.eql("91");
                return testingDB.dropDatabase();
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })
    it.skip("collections and Indexes verification through pl.dbs insertion", function (done) {
        var adminDb = undefined;
        ApplaneDB.connect(Config.URL, Config.ADMIN_DB, Config.ADMIN_OPTIONS)
            .then(
            function (db1) {
                adminDb = db1; /////here i  query on pl.dbs and verifying them/////////////////
                return adminDb.query({$collection:"pl.dbs", $filter:{db:Config.ADMIN_DB}})
            }).then(
            function (data) {
                console.log("data in admin db>>" + JSON.stringify(data));
                expect(data.result).to.have.length(1);
                expect(data.result[0]).to.have.property("code");
                expect(data.result[0].db).to.eql("northwindtestcasesadmin");
                expect(data.result[0].guestUserName).to.eql(undefined);
                expect(data.result[0].guestPassword).to.eql(undefined);
                return adminDb.query({$collection:"pl.users", $filter:{username:"adminguest"}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].username).to.eql("adminguest");
                expect(data.result[0].password).to.eql("adminpass");
                expect(data.result[0].admin).to.eql(true);

                /////here i am query on pl.collections and verifying them//////////////////////
                return adminDb.query({$collection:"pl.collections", $filter:{collection:"pl.currencies"}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].collection).to.eql("pl.currencies");
                return adminDb.query({$collection:"pl.collections", $filter:{collection:"pl.users"}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].collection).to.eql("pl.users");
                return adminDb.query({$collection:"pl.collections", $filter:{collection:"pl.roles"}})
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].collection).to.eql("pl.roles");
                return adminDb.query({$collection:"pl.collections", $filter:{collection:"pl.units"}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].collection).to.eql("pl.units");
                /////here i am query on pl.fields and verifying them//////////////////////
                return adminDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"pl.currencies"}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].field).to.eql("currency");
                expect(data.result[0].type).to.eql("string");
                expect(data.result[0].collectionid.collection).to.eql("pl.currencies");
                return adminDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"pl.units"}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].field).to.eql("unit");
                expect(data.result[0].type).to.eql("string");
                expect(data.result[0].collectionid.collection).to.eql("pl.units");
                return adminDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"pl.users"}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(8);
                expect(data.result[0].field).to.eql("username");
                expect(data.result[1].field).to.eql("password");
                expect(data.result[2].field).to.eql("emailid");
                var rolesId = data.result[3]._id;
                expect(data.result[3].field).to.eql("roles");
                expect(data.result[3].type).to.eql("object");
                expect(data.result[4].parentfieldid._id).to.eql(rolesId);
                expect(data.result[4].field).to.eql("role");
                expect(data.result[4].type).to.eql("fk");
                expect(data.result[4].collection).to.eql("pl.roles");
                expect(data.result[5].field).to.eql("state");
                var stateid = data.result[5]._id;
                expect(data.result[5].type).to.eql("object");
                expect(data.result[6].field).to.eql("selectedapplication");
                expect(data.result[6].parentfieldid._id).to.eql(stateid);
                expect(data.result[7].field).to.eql("applications");
                expect(data.result[7].parentfieldid._id).to.eql(stateid);
                return adminDb.query({$collection:"pl.fields", $filter:{"collectionid.collection":"pl.roles"}});
            }).then(
            function (data) {
                expect(data.result).to.have.length(1);
                expect(data.result[0].field).to.eql("role");
                return adminDb.collection("pl.dbs");
            }).then(
            function (plDbsCollection) {
                return plDbsCollection.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plDbsIndex");
                expect(index.name).to.eql("plDbsIndex");
                expect(index.key.db).to.eql(1);
                expect(index.unique).to.eql(true);
                return adminDb.collection("pl.functions");
            }).then(
            function (plFunctionCollection) {
                return plFunctionCollection.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plFunctionIndex");
                expect(index.name).to.eql("plFunctionIndex");
                expect(index.key.name).to.eql(1);
                expect(index.unique).to.eql(true);
                return adminDb.collection("pl.roles");
            }).then(
            function (plRolesCollection) {
                return plRolesCollection.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plRolesIndex");
                expect(index.name).to.eql("plRolesIndex");
                expect(index.key.role).to.eql(1);
                expect(index.unique).to.eql(true);
                return adminDb.collection("pl.applications");
            }).then(
            function (plApplicationsCollection) {
                return plApplicationsCollection.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plApplicationIndex");
                expect(index.name).to.eql("plApplicationIndex");
                expect(index.key["label"]).to.eql(1);
                expect(index.unique).to.eql(true);
                return adminDb.collection("pl.menus");
            }).then(
            function (plMenusCollection) {
                return plMenusCollection.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plMenusIndex");
                expect(index.name).to.eql("plMenusIndex");
                expect(index.key["application._id"]).to.eql(1);
                expect(index.key["parentmenu._id"]).to.eql(1);
                expect(index.key["label"]).to.eql(1);
                expect(index.unique).to.eql(true);
                return adminDb.collection("pl.collections");
            }).then(
            function (plCollections) {
                return plCollections.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plCollectionIndex");
                expect(index.name).to.eql("plCollectionIndex");
                expect(index.key["collection"]).to.eql(1);
                expect(index.unique).to.eql(true);
                return adminDb.collection("pl.fields");
            }).then(
            function (plFields) {
                return plFields.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plFieldsIndex");
                expect(index.name).to.eql("plFieldsIndex");
                expect(index.key["collectionid._id"]).to.eql(1);
                expect(index.key["field"]).to.eql(1);
                expect(index.key["parentfieldid._id"]).to.eql(1);
                expect(index.unique).to.eql(true);
                return adminDb.collection("pl.actions");
            }).then(
            function (plActions) {
                return plActions.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plActionsIndex");
                expect(index.name).to.eql("plActionsIndex");
                expect(index.key["collectionid._id"]).to.eql(1);
                expect(index.key["label"]).to.eql(1);
                expect(index.unique).to.eql(true);
                return adminDb.collection("pl.formgroups");
            }).then(
            function (plFromGroups) {
                return plFromGroups.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plFormGroupsIndex");
                expect(index.name).to.eql("plFormGroupsIndex");
                expect(index.key["collectionid._id"]).to.eql(1);
                expect(index.key["title"]).to.eql(1);
                expect(index.unique).to.eql(true);
                return adminDb.collection("pl.indexes");
            }).then(
            function (plIndexes) {
                return plIndexes.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plIndexes");
                expect(index.name).to.eql("plIndexes");
                expect(index.key["collectionid._id"]).to.eql(1);
                expect(index.key["name"]).to.eql(1);
                expect(index.unique).to.eql(true);
                return adminDb.collection("pl.qviews");
            }).then(
            function (plQviews) {
                return plQviews.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plQviewsIndex");
                expect(index.name).to.eql("plQviewsIndex");
                expect(index.key["id"]).to.eql(1);
                expect(index.unique).to.eql(true);
                return adminDb.collection("pl.users");
            }).then(
            function (plUsers) {
                return plUsers.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plUsersIndex");
                expect(index.name).to.eql("plUsersIndex");
                expect(index.key["username"]).to.eql(1);
                expect(index.unique).to.eql(true);
            }).then(
            function () {
                done();
            }).fail(function (err) {
//                console.log("get failed")
                done(err);
            })
    })
})


function findIndex(indexData, indexName) {
    indexData = indexData || [];
    for (var i = 0; i < indexData.length; i++) {
        var index = indexData[i];
        if (index.name === indexName) {
            return index;
            break;
        }
    }
}