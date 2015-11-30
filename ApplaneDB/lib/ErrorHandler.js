exports.TYPE = {
    MAIL_ERROR: "Mail Error",
    EMAIL_TRACKER: "Email Tracker",
    GOOGLE_CALENDAR: "Google Calendar",
    CACHE_SERVER: "Cache Server"
};


exports.handleError = function (err, type, db, options) {
    var insert = {error: err.message, stack: err.stack, type: type, date: new Date()};
    if (err.parameters) {
        insert.parameters = err.parameters;
    }
    if (db) {
        if (db.user) {
            insert.user_id = db.user._id;
            insert.username = db.user.username;
        }
        insert.db = db.db.databaseName;
    }
    if (options) {
        if (options.user) {
            insert.user_id = options.user._id;
            insert.username = options.user.username;
            delete options.user;
        }
        insert.options = JSON.stringify(options);
    }
    return require("ApplaneDB/lib/DB").getLogDB().then(function (logDB) {
        return logDB.update({$collection: "pl.errorlogs", $insert: [insert]})
    })
}