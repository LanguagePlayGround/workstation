var expect = require('chai').expect;
var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Config = require("ApplaneDB/test/config.js").config;
var Testcases = require("ApplaneDB/test/TestCases.js");
var Commit = require("../lib/apps/Commit.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Porting = require("../lib/apps/Porting.js");
var NewPorting = require("../lib/apps/NewPorting.js");
var Synch = require("../lib/apps/Synch.js");
//mocha --recursive --timeout 150000 -g "Synch Remote Db" --reporter spec


describe("Synch Remote Db", function () {

    beforeEach(function (done) {
        Testcases.beforeEach().then(
            function () {
                return ApplaneDB.getAdminDB();
            }).then(
            function (adminDB) {
                var adminDb = adminDB;
                var insertDbs = {$collection:"pl.dbs", $insert:[
                    {"db":"afb", "sandboxDb":"afb_sb", "globalDb":"", "ensureDefaultCollections":true, "guestUserName":"afb", "globalUserName":"afb", "globalPassword":"afb", "globalUserAdmin":true, code:1, autoSynch:false},
                    {"db":"daffodil", "sandboxDb":"daffodil_sb", "globalDb":"afb", "ensureDefaultCollections":false, "guestUserName":"daffodil", "globalUserName":"daffodil", "globalPassword":"daffodil", "globalUserAdmin":true, code:2, autoSynch:false, allowedServices:{$insert:[
                        {service:"/rest/invoke"}
                    ]}}
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

    it.skip('simple synch', function (done) {
        var afbDb = undefined;
        var afb_SbDb = undefined;
        var daffodilDb = undefined;
        var applicationId = undefined;
        var menuId = undefined;
        var qviews = undefined;
        var dbId = undefined;
        var processid = undefined;
        var adminDB = undefined;
        return ApplaneDB.getAdminDB().then(
            function (adb) {
                adminDB = adb;
            }).then(
            function () {
                return adminDB.query({$collection:"pl.dbs", $filter:{db:"daffodil"}, $fields:{_id:1}, $events:false, $modules:false});
            }).then(
            function (result) {
                dbId = result.result[0]._id;
                return adminDB.update({$collection:"pl.dbs", $update:{_id:dbId, $set:{
                    remoteURL:"127.0.0.1", remotePort:5200, remoteDbs:{$insert:[
                        {db:"afb", index:0},
                        {db:"daffodil", index:1}
                    ]}}
                }});
            }).then(
            function () {
                return ApplaneDB.connect(Config.URL, "afb_sb", {username:"afb", "password":"afb"})
            }).then(
            function (dbName) {
                afb_SbDb = dbName;
                return afb_SbDb.update({$collection:"pl.collections", $insert:[
                    {collection:"tasks"}
                ]})
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.fields", $insert:[
                    {field:"task", type:"string", collectionid:{$query:{collection:"tasks"}}},
                    {field:"assignTo", type:"string", collectionid:{$query:{collection:"tasks"}}}
                ]});
            }).then(
            function () {
                return Commit.commitProcess({data:{commit:true}}, afb_SbDb);
            }).then(
            function () {
                return afb_SbDb.update({$collection:"pl.processes", $insert:{processed:1}})
            }).then(
            function (update) {
                processid = update["pl.processes"].$insert[0]._id;
                console.log("called...");
                return adminDB.invokeFunction("RemoteDB.synchDB", [
                    {_id:dbId, synch:true}
                ], {processid:processid});
            }).then(
            function () {
//                return require("q").delay(5000).then(function () {
//                    console.log(".....");
//                })
            }).then(
            function () {
                done();
            }).catch(function (err) {
                done(err);
            })
    })

    function dropDatabase1(dbs) {
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
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "daffodil_hsr", {username:"daffodil_hsr", "password":"daffodil_hsr"})
        }).then(
        function (daffodil_hsrDb) {
            dbs.daffodil_hsrDb = daffodil_hsrDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "daffodil_hsr_applane", {username:"daffodil_hsr_applane", "password":"daffodil_hsr_applane"})
        }).then(
        function (daffodil_hsr_applaneDb) {
            dbs.daffodil_hsr_applaneDb = daffodil_hsr_applaneDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "darcl", {username:"darcl", "password":"darcl"})
        }).then(
        function (darclDb) {
            dbs.darclDb = darclDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "darcl_sb", {username:"darcl", "password":"darcl"})
        }).then(
        function (darcl_sbDb) {
            dbs.darcl_sbDb = darcl_sbDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "girnarsoft", {username:"girnarsoft", "password":"girnarsoft"})
        }).then(
        function (girnarsoftDb) {
            dbs.girnarsoftDb = girnarsoftDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "girnarsoft_sb", {username:"girnarsoft", "password":"girnarsoft"})
        }).then(
        function (girnarsoft_sbDb) {
            dbs.girnarsoft_sbDb = girnarsoft_sbDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "daffodil_ggn", {username:"daffodil_ggn", "password":"daffodil_ggn"})
        }).then(
        function (daffodil_ggnDb) {
            dbs.daffodil_ggnDb = daffodil_ggnDb;
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, "daffodil_hsr_other", {username:"daffodil_hsr_other", "password":"daffodil_hsr_other"})
        }).then(function (daffodil_hsr_otherDb) {
            dbs.daffodil_hsr_otherDb = daffodil_hsr_otherDb;
        })
}
