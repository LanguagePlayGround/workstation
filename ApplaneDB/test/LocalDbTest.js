var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var Testcases = require("./TestCases.js");

describe("LocalDBInserttestcase", function () {
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    })
    afterEach(function (done) {
        Testcases.afterEach(done);
    })

    after(function (done) {
        return ApplaneDB.getAdminDB().then(
            function (adminDB) {
                return adminDB.connectUnauthorized("mytestingdb", true);
            }).then(
            function (db) {
                return db.dropDatabase();
            }).then(
            function () {
                done()
            }).fail(function (err) {
                done(err);
            })
    })

    it("insert into pl.dbs", function (done) {
        var adminDB = undefined;
        var localDB = undefined;
        ApplaneDB.connect(Config.URL, Config.ADMIN_DB, Config.ADMIN_OPTIONS).then(
            function (adminDB1) {
                adminDB = adminDB1;
                return  adminDB.update({$collection:"pl.dbs", $insert:{db:"mytestingdb", globalUserName:"guestUser", globalPassword:"guestPass", globalUserAdmin:true, "guestUserName":"guestUser", loginAsGuest:true, ensureIndex:true}});
            }).then(
            function () {
                return adminDB.query({$collection:"pl.dbs", $filter:{db:"mytestingdb"}});
            }).then(
            function (myTestingDB) {
                expect(myTestingDB.result[0]).to.have.property("code");
                expect(myTestingDB.result[0].guestUserName).to.eql("guestUser");
                return ApplaneDB.connectWithCode(Config.URL, myTestingDB.result[0].db, myTestingDB.result[0].code, {username:"guestUser"});
            }).then(
            function (localDB1) {
                localDB = localDB1;
                return localDB.collection("pl.dbs");
            }).then(
            function (plDbsCollection) {
                return plDbsCollection.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plDbsIndex");
                expect(index.name).to.eql("plDbsIndex");
                expect(index.key.db).to.eql(1);
                expect(index.unique).to.eql(true);
                return localDB.collection("pl.functions");
            }).then(
            function (plFunctionCollection) {
                return plFunctionCollection.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plFunctionIndex");
                expect(index.name).to.eql("plFunctionIndex");
                expect(index.key.name).to.eql(1);
                expect(index.unique).to.eql(true);
                return localDB.collection("pl.roles");
            }).then(
            function (plRolesCollection) {
                return plRolesCollection.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plRolesIndex");
                expect(index.name).to.eql("plRolesIndex");
                expect(index.key.role).to.eql(1);
                expect(index.unique).to.eql(true);
                return localDB.collection("pl.applications");
            }).then(
            function (plApplicationsCollection) {
                return plApplicationsCollection.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plApplicationIndex");
                expect(index.name).to.eql("plApplicationIndex");
                expect(index.key["label"]).to.eql(1);
                expect(index.unique).to.eql(true);
                return localDB.collection("pl.menus");
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
                return localDB.collection("pl.collections");
            }).then(
            function (plCollections) {
                return plCollections.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plCollectionIndex");
                expect(index.name).to.eql("plCollectionIndex");
                expect(index.key["collection"]).to.eql(1);
                expect(index.unique).to.eql(true);
                return localDB.collection("pl.fields");
            }).then(
            function (plFields) {
                return plFields.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plFieldsUniqueIndex");
                expect(index.name).to.eql("plFieldsUniqueIndex");
                expect(index.key["collectionid._id"]).to.eql(1);
                expect(index.key["parentfieldid._id"]).to.eql(1);
                expect(index.key["field"]).to.eql(1);
                expect(index.unique).to.eql(true);
                return localDB.collection("pl.actions");
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
                return localDB.collection("pl.formgroups");
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
                return localDB.collection("pl.indexes");
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
                return localDB.collection("pl.qviews");
            }).then(
            function (plQviews) {
                return plQviews.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "plQviewsUniqueIndex");
                expect(index.name).to.eql("plQviewsUniqueIndex");
                expect(index.key["id"]).to.eql(1);
                expect(index.unique).to.eql(true);
                return localDB.collection("pl.users");
            }).then(
            function (plUsers) {
                return plUsers.getIndexes();
            }).then(
            function (indexData) {
                var index = findIndex(indexData, "UserNameIndex");
                expect(index.name).to.eql("UserNameIndex");
                expect(index.key["username"]).to.eql(1);
                expect(index.unique).to.eql(true);
            }).then(
            function () {
                done();
            }).fail(function (err) {
                done(err);
            })
    })

});

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