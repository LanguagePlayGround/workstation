/**
 * mocha --recursive --timeout 150000 -g "marketplace testcases" --reporter spec
 */

var expect = require('chai').expect;
var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;
var NorthwindDb = require('./NorthwindDb.js');
var Testcases = require("./TestCases.js");

describe("marketplace testcases", function () {

    afterEach(function (done) {
        Testcases.afterEach(done);
    });
    beforeEach(function (done) {
        Testcases.beforeEach(done);
    });

    after(function (done) {
        return ApplaneDB.getAdminDB().then(
            function (adminDB) {
                return adminDB.connectUnauthorized("markettest", true);
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

    it('marketplace testcase', function (done) {
        var db = undefined;
        var jobDB = undefined;
        var adminDB = undefined;
        ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
            function (db1) {
                db = db1;
                return db.getGlobalDB();
            }).then(
            function (globalDb) {
                var createRoles = {$collection:"pl.roles", $insert:[
                    {role:"TestAdmin", privileges:[
                        {type:"Collection", collection:"marketTestWork", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"insert", sequence:1},
                            {type:"update", sequence:2},
                            {type:"remove", sequence:3}
                        ]}}
                    ]},
                    {role:"TestUser", privileges:[
                        {type:"Collection", collection:"marketTestHome", operationInfos:{$insert:[
                            {type:"find", sequence:0},
                            {type:"update", sequence:1},
                        ]}}
                    ]}
                ]};
                return globalDb.update(createRoles);
            }).then(
            function () {
                return require("../lib/DB.js").getAdminDB();
            }).then(
            function (adminDb) {
                adminDB = adminDb;
                var adminCollections = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"pl.urlmappings"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"dbSetUp", type:"string", collectionid:{$query:{collection:"pl.urlmappings"}}} ,
                        {field:"userSetUp", type:"string", collectionid:{$query:{collection:"pl.urlmappings"}}} ,
                        {field:"restrictedDomains", type:"object", collectionid:{$query:{collection:"pl.urlmappings"}}, mandatory:true, multiple:true} ,
                        {field:"domain", type:"string", collectionid:{$query:{collection:"pl.urlmappings"}}, mandatory:true, parentfieldid:{$query:{field:"restrictedDomains", collectionid:{$query:{collection:"pl.urlmappings"}}}}} ,
                        {field:"roles", type:"object", collectionid:{$query:{collection:"pl.urlmappings"}}, mandatory:true, multiple:true} ,
                        {field:"role", type:"string", collectionid:{$query:{collection:"pl.urlmappings"}}, mandatory:true, parentfieldid:{$query:{field:"roles", collectionid:{$query:{collection:"pl.urlmappings"}}}}} ,
                        {field:"url", type:"string", collectionid:{$query:{collection:"pl.urlmappings"}}, mandatory:true} ,
                        {field:"globalDb", type:"string", collectionid:{$query:{collection:"pl.urlmappings"}}, mandatory:true}
                    ]}
                ];
                return adminDB.update(adminCollections);
            }).then(
            function () {
                var functionsToRegister = [
                    {name:"MarketPlace", source:"NorthwindTestCase/lib", "type":"js"}
                ];
                return ApplaneDB.registerFunction(functionsToRegister);
            }).then(
            function () {
                var insert = {$collection:"pl.urlmappings", $insert:[
                    { url:"127.0.0.1:5100", globalDb:Config.GLOBAL_DB, userSetUp:"MarketPlace.configureUser", dbSetUp:"MarketPlace.configureDB", roles:[
                        {"role":"TestAdmin"},
                        {"role":"TestUser"}
                    ], restrictedDomains:[
                        {"domain":"yahoo.com"}
                    ]}
                ]};
                return adminDB.update(insert);
            }).then(
            function () {
                var otherCollections = [
                    {$collection:"pl.collections", $insert:[
                        {collection:"marketTestHome"},
                        {collection:"marketTestWork"}
                    ]},
                    {$collection:"pl.fields", $insert:[
                        {field:"name", type:"string", collectionid:{$query:{collection:"marketTestWork"}}} ,
                        {field:"age", type:"number", collectionid:{$query:{collection:"marketTestWork"}}},
                        {field:"cell", type:"number", collectionid:{$query:{collection:"marketTestHome"}}},
                        {field:"city", type:"string", collectionid:{$query:{collection:"marketTestHome"}}}
                    ]}
                ];
                return db.update(otherCollections);
            }).then(
            function () {
                var oAuthData = {emailid:"testing@markettest.com", host:"127.0.0.1:5100"};
                var options = {};
                return require("../lib/Http.js").handleMarketPlaceData(oAuthData, options);
            }).then(
            function () {
                return adminDB.connectUnauthorized("markettest");
            }).then(
            function (db1) {
                jobDB = db1;
                return jobDB.query({$collection:"marketTestWork", $sort:{name:1}});
            }).then(
            function (data) {
                console.log("d1>> " + JSON.stringify(data));
                data = data.result;
                expect(data).to.have.length(2);
                expect(data[0].name).to.eql("Ashu");
                expect(data[0].age).to.eql(25);
                expect(data[1].name).to.eql("Naveen");
                expect(data[1].age).to.eql(25);
            }).then(
            function () {
                return jobDB.query({$collection:"marketTestHome", $sort:{city:1}});
            }).then(
            function (data) {
                console.log("d2>> " + JSON.stringify(data));
                data = data.result;
                expect(data).to.have.length(2);
                expect(data[0].city).to.eql("Hamirpur");
                expect(data[0].cell).to.eql(99999);
                expect(data[1].city).to.eql("Panipat");
                expect(data[1].cell).to.eql(88888);
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    });
});