/**
 * Created by rajit on 14/5/15.
 */


var DBConstants = require("ApplaneDB/lib/Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");


//is used to check pending transactions of all dbs, which are pending from last 15 minutes and then sending mail for that txns. -- Rajit garg 06/05/2015
exports.mailPendingTransactions = function (db) {
    return db.query({$collection: DBConstants.Admin.DBS, field: {db: 1}}).then(function (dbs) {
        dbs = dbs.result;
        var dbToPort = undefined;
        var filter = undefined;
        return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
            return db.connectUnauthorized(dbName.db).then(
                function (dbToPort1) {
                    dbToPort = dbToPort1;
                    var ltdate = new Date();
                    ltdate.setMinutes(ltdate.getMinutes() - 15);
                    filter = {"lastmodifiedtime": {"$lt": ltdate}, "status": "pending", "mailSend": {$in: [null, false]}};
                    return dbToPort.query({$collection: DBConstants.TRANSACTIONS, $filter: filter});
                }).then(function (result) {
                    if (result && result.result && result.result.length > 0) {
                        var options = {to: ["rohit.bansal@daffodilsw.com", "sourbh.gupta@daffodilsw.com", "rajit.garg@daffodilsw.com"], from: "developer@daffodilsw.com", subject: "Pending Transaction Cron " + dbName.db, html: JSON.stringify(result.result)};
                        return dbToPort.sendMail(options);
                    }
                }).then(function () {
                    return dbToPort.mongoUpdate({$collection: DBConstants.TRANSACTIONS, $update: {$query: filter, $set: {"mailSend": true}}}, {multi: true});
                }).fail(function (err) {
                    if (err && err.message == "Username/Password did not match.") {
                    } else {
                        throw new Error(err);
                    }
                })
        });
    });
};