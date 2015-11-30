var ApplaneDB = require("../lib/DB.js");
var Config = require("./config.js").config;

exports.afterEach = function (done) {
    return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
        function (db) {
            return db.dropDatabase();
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, Config.GLOBAL_DB, Config.OPTIONS);
        }).then(
        function (db) {
            return db.dropDatabase();
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, Config.ADMIN_DB, Config.ADMIN_OPTIONS);
        }).then(
        function (db) {
            return db.dropDatabase();
        }).then(
        function () {
            return ApplaneDB.getLogDB();
        }).then(
        function (logDb) {
            logDb.dropLogDatabase();
        }).then(
        function () {
            if (done) {
                done();
            }
        }).fail(function (err) {
            if (done) {
                done(err);
            } else {
                throw err;
            }
        });
}

exports.beforeEach = function (done) {
    var configure = {URL:Config.URL, MONGO_REMOTE_URL:Config.MONGO_REMOTE_URL, Admin:Config.Admin, LOG_DB:Config.LOG_DB, MongoAdmin:Config.MongoAdmin, ENSURE_DB:false, MAIL_CREDENTIALS:Config.MailCredentials, SERVER_NAME:Config.SERVER_NAME};
    return ApplaneDB.configure(configure).then(
        function () {
            return ApplaneDB.connect(Config.URL, Config.ADMIN_DB, Config.ADMIN_OPTIONS);
        }).then(
        function (adminDb) {
            return  adminDb.update({$collection:"pl.dbs", $insert:[
                {db:Config.ADMIN_DB, globalUserName:Config.OPTIONS.username, guestUserName:Config.OPTIONS.username, mobileLoginEnabled:true, ensureUser:true, globalPassword:Config.OPTIONS.password, globalUserAdmin:true},
                {db:Config.GLOBAL_DB, globalUserName:Config.OPTIONS.username, guestUserName:Config.OPTIONS.username, mobileLoginEnabled:true, ensureUser:true, ensureDefaultCollections:true, globalPassword:Config.OPTIONS.password, globalUserAdmin:true},
                {db:Config.DB, globalDb:Config.GLOBAL_DB, admindb:Config.GLOBAL_DB, globalUserName:Config.OPTIONS.username, guestUserName:Config.OPTIONS.username, mobileLoginEnabled:true, ensureUser:true, globalPassword:Config.OPTIONS.password, globalUserAdmin:true}
            ]});
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS);
        }).then(
        function (localdb) {
            return localdb.invokeFunction("Porting.ensureMetadataIndexes", [Config.DB]);
        }).then(
        function () {
            if (done) {
                done();
            }
        }).fail(function (err) {
            if (done) {
                done(err);
            } else {
                throw err;
            }
        });
}