/**
 * Created by sourabh on 28/5/15.
 */

var ApplaneDB = require("ApplaneDB/lib/DB.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require('q');


function listCollection(db) {
    var d = Q.defer();
    db.db.listCollections().toArray(function (err, collections) {
        if (err) {
            d.reject(err);
        } else {
            d.resolve(collections);
        }
    });
    return d.promise;
}

function stats(db) {
    var d = Q.defer();
    db.db.stats(function (err, stats) {
        if (err) {
            d.reject(err);
        } else {
            d.resolve(stats);
        }
    });
    return d.promise;
}

function count(collection) {
    var d = Q.defer();
    collection.count({}, function (err, count) {
        if (err) {
            d.reject(err);
        } else {
//            console.log("count......" + JSON.stringify(count));
            d.resolve(count.n);
        }
    });
    return d.promise;
}


function getCollectionsCount(records, collections, db) {
    var collectionName = undefined;

    return Utils.iterateArrayWithPromise(collections, function (index, collectionInfo) {
        var record = {};
        collectionName = collectionInfo.name;
        return  db.collection(collectionName).then(function (collectionObj) {
            return count(collectionObj);
        }).then(function (count) {
             if(count >= 5000) {
                 record.collection = collectionName;
                 record.count = count;
                 records.push(record);
             }
        })
    })
}

exports.onResult = function (query, result, db) {
    var records = [];
    var adminDB = undefined;
    var DB = undefined;
    return ApplaneDB.getAdminDB().then(
        function (adb) {
            adminDB = adb;
            return adminDB.query({$collection: "pl.dbs"});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbInfo) {
                var record = {};
                var dbname = dbInfo.db;
                console.log("dbname..." + dbname);
                return adminDB.connectUnauthorized(dbname).then(function (DB1) {
                    DB = DB1;
                    return stats(DB);
                }).then(function (stats) {
                    record.db = stats.db;
                    record.count = stats.objects;
                    records.push(record);
                }).fail(function (err) {
                    console.log("error >>> "+ err);
                });
            }).then(function () {
                Utils.sort(records, 'asc', 'db');
                result.result = records;
            });
        })
}


exports.onCollectionCountResult = function (query, result, db) {
    if(query && query.$parameters && query.$parameters.dbName) {
        var dbname = query.$parameters.dbName;
        console.log("db" + db);
        var adminDB = undefined;
        var DB = undefined;
        var records = [];
        return db.connectUnauthorized(dbname).then(function (DB1) {
            DB = DB1;
            return listCollection(DB);
        }).then(function (collections) {
            return getCollectionsCount(records, collections, DB);
        }).then(function () {
            console.log("record>>>" + JSON.stringify(records));
            result.result = records;
        }).fail(function (err) {
            console.log("error >>> " + err);
        });
    }
}
