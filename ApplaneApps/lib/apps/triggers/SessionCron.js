/**
 * Created by rajit on 11/5/15.
 */

var DBConstants = require("ApplaneDB/lib/Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");

//is used to remove connections which are expire on the basis of timeout available at db at pl.dbs -- rajit garg 11/05/2015
exports.removeOutdatedConnections = function (db) {
    var filter = {};
    filter[DBConstants.Admin.Dbs.SESSION_TIMEOUT] = {"$exists": true};
    var fields = {};
    fields[DBConstants.Admin.Dbs.SESSION_TIMEOUT] = 1;
    fields[DBConstants.Admin.Dbs.DB] = 1;
    //query on pl.dbs to get dbs which have sessiontimeout available.
    return db.query({$collection: DBConstants.Admin.DBS, $filter: filter, $fields: fields}).then(function (dbs) {
        dbs = dbs.result;
        return Utils.iterateArrayWithPromise(dbs, function (index, dbInfo) {
            var dbName = dbInfo[DBConstants.Admin.Dbs.DB];
            var timeout = dbInfo[DBConstants.Admin.Dbs.SESSION_TIMEOUT].convertedvalue;
            var ltdate = new Date();
            ltdate.setMinutes(ltdate.getMinutes() - timeout);
            filter = {"lastUpdatedOn": {"$lt": ltdate}, "db": dbName};
            //query on pl.connections to get connections which have lastUpdatedOn less than currenttime- sessiontimeout
            return db.query({$collection: DBConstants.Admin.CONNECTIONS, "$fields": {"token": 1}, $filter: filter}).then(function (connections) {
                if (connections && connections.result && connections.result.length > 0) {
                    return removeTokenFromSession(connections.result, db);
                }
            })
        })
    })
};

//is used to remove token from pl.connections as well as from the cache..---rajit garg 11/05/2015
function removeTokenFromSession(connections, db) {
    return Utils.iterateArrayWithPromise(connections, function (index, connection) {
        return db.update([
            {$collection: DBConstants.Admin.CONNECTIONS, $delete: [
                {_id: connection._id}
            ]}
        ]).then(function (){
            return require("ApplaneDB/lib/CacheService.js").removeUserConnection(connection.token);
        })
    })
}
