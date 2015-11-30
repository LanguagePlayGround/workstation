var ApplaneDB = require("../lib/DB.js");

exports.afterEach = function (Config, done) {

    return ApplaneDB.connect(Config.URL, Config.DB, Config.OPTIONS).then(
        function (db) {
            return db.dropDatabase();
        }).then(
        function () {
            if (Config.DROP_GLOBAL_DB) {
                return ApplaneDB.connect(Config.URL, Config.GLOBAL_DB, Config.GLOBAL_DB_OPTIONS);
            }
        }).then(
        function (db) {
            if (Config.DROP_GLOBAL_DB) {
                return db.dropDatabase();
            }
        }).then(
        function () {
            return ApplaneDB.connect(Config.URL, Config.ADMIN_DB, Config.ADMIN_OPTIONS);
        }).then(
        function (db) {
            return db.dropDatabase();
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

exports.beforeEach = function (Config, done) {
    var configure = {URL:Config.URL, Admin:Config.Admin, MongoAdmin:Config.MongoAdmin, ENSURE_DB:false, MailCredentials:Config.MailCredentials, SERVER_NAME:Config.SERVER_NAME};
    return ApplaneDB.configure(configure).then(
        function () {
            return ApplaneDB.connect(Config.URL, Config.ADMIN_DB, Config.ADMIN_OPTIONS);
        }).then(
        function (adminDb) {
            return  adminDb.update({$collection:"pl.dbs", $insert:[
                {db:Config.ADMIN_DB, guestUserName:Config.ADMIN_OPTIONS.username, guestPassword:Config.ADMIN_OPTIONS.password},
                {db:Config.GLOBAL_DB, guestUserName:Config.GLOBAL_DB_OPTIONS.username, guestPassword:Config.GLOBAL_DB_OPTIONS.password},
                {db:Config.DB, globalDb:Config.GLOBAL_DB, guestUserName:Config.OPTIONS.username, guestPassword:Config.OPTIONS.password}
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
    ;

}