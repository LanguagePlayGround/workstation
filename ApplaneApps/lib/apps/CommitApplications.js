/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 7/5/14
 * Time: 12:16 AM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("./Constants.js");
var Utils = require("ApplaneCore/apputil/util.js")
var Q = require("q");
var CacheService = require("ApplaneDB/lib/CacheService.js");
var Utility = require("./triggers/Utility.js");

var COMMIT = "__commit";
var ADMIN = "__admin";

function getDb(type, synchDbName, db) {
    if (type === "Synch") {
        return db.connectUnauthorized(synchDbName);
    } else {
        var d = Q.defer()
        d.resolve(db.asyncDB());
        return d.promise;
    }
}

exports.commit = function (parameters, originalDb) {
    var type = parameters.updateType;
    if (!type) {
        throw new Error("Please select value of mandatory paramters [type]");
    }
    var synchDbName = undefined;
    if (type === "Synch") {
        throw new Error("Sync not allowed..");
        synchDbName = parameters.db;
        if (!synchDbName) {
            throw new Error("Please define db name you want to Synch.");
        }
    }
    parameters.username = originalDb.user ? originalDb.user.username : undefined;
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var db = undefined;
    var dbInfo = undefined;
    var globalDb = undefined;
    return getDb(type, synchDbName, originalDb).then(
        function (mainDb) {
            db = mainDb;
            if (db.isGlobalDB()) {
                throw new Error(type + " is not Allowed in db [" + db.db.databaseName + "]");
            }
            return ApplaneDB.getLogDB();
        }).then(
        function (logDb) {
            return logDb.query({$collection:"pl.logs", $filter:{status:"In Progress", type:{$in:["Commit", "Synch"]}, db:db.db.databaseName}, $limit:1});
        }).then(
        function (logs) {
            logs = logs.result;
            if (logs.length > 0) {
                throw new Error(logs[0].type + " is already in progress for db [" + db.db.databaseName + "]");
            }
            return db.getGlobalDB();
        }).then(
        function (gdb) {
            globalDb = gdb;
            return db.getAdminDB();
        }).then(
        function (plAdminDb) {
            return plAdminDb.query({$collection:"pl.dbs", $filter:{db:db.db.databaseName}})
        }).then(
        function (dbResult) {
            if (dbResult.result.length == 0) {
                throw new Error("Db [" + db.db.databaseName + "] not found in collection [pl.dbs]");
                return;
            }
            dbInfo = dbResult.result[0];
            if (type === "Commit") {
                if (!dbInfo.admindb) {
                    throw new Error("AdminDb name is mandatory in db for commit.");
                    return;
                }
                return db.connectUnauthorized(dbInfo.admindb);
            }
        }).then(
        function (dbToCommit) {
            handleCommitWithoutPromise(globalDb, db, dbToCommit, parameters);
        }).then(
        function () {
            return "Commit Applied..";
        })
}

function handleCommitWithoutPromise(globalDb, db, dbToCommit, params) {
    setTimeout(function () {
        require("./CommitApplications.js").handleCommit(globalDb, db, dbToCommit, params).then(
            function () {
                db.clean();
            }).fail(function () {
                db.clean();
            });
    }, 100);
}

function getDBsToSynch(db, params) {
    if (params.updateType === "Commit") {
        if (params.autoSynch) {
            return db.getAdminDB().then(
                function (adminDb) {
                    return adminDb.query({$collection:"pl.dbs", $filter:{autoSynch:true, db:{$ne:db.db.databaseName}}, $fields:{db:1}})
                }).then(function (data) {
                    return data.result;
                })
        } else {
            return [];
        }
    } else {
        var synchDbs = [];
        if (params.db) {
            synchDbs.push({db:params.db});
        }
        return synchDbs;
    }


}

exports.handleCommit = function (globalDb, db, dbToCommit, params) {
    params = params || {};
    var createdBy = db.user ? db.user.username : undefined;
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logDb = undefined;
    var logId = undefined;
    var finalStatus = {};
    return ApplaneDB.getLogDB().then(
        function (ldb) {
            logDb = ldb;
            return logDb.mongoUpdate({$collection:"pl.logs", $insert:{type:params.updateType, status:"In Progress", db:db.db.databaseName, startTime:new Date(), username:params.username}});
        }).then(
        function (update) {
            logId = update["pl.logs"].$insert[0]._id;
            return getDBsToSynch(db, params);
        }).then(
        function (dbsToSynch) {
            return Utils.iterateArrayWithPromise(Constants.CommitCollections,
                function (index, collection) {
                    if (!params.type || params.type === collection.type) {
                        var filter = {};
                        if (params.type && params.value) {
                            filter[collection.field] = params.value;
                        }
                        return commitData(logId, 0, params.updateType, dbsToSynch, collection.collection, collection.referredCollections, filter, db, dbToCommit, globalDb, logDb, finalStatus);
                    }
                })
        }).then(
        function () {
            var finalUpdate = {$collection:"pl.logs", $update:[
                {$query:{_id:logId}, $set:{status:finalStatus.status || "Done", endTime:new Date()}}
            ]};
            return logDb.mongoUpdate(finalUpdate);
        })
        .fail(
        function (err) {
            return logDb.mongoUpdate({$collection:"pl.logs", $update:[
                {$query:{_id:logId}, $set:{status:"Failed", endTime:new Date(), error:JSON.stringify(Utils.getErrorInfo(err))}}
            ]}).then(
                function () {
                    throw err;
                })
        });
}

function commitData(logId, skip, updateType, dbsToSynch, collectionName, referredCollections, filter, db, dbToCommit, globalDb, logDb, finalStatus) {
    if ((updateType === "Synch") || (dbToCommit.db.databaseName === globalDb.db.databaseName)) {
        var d = Q.defer();
        db.db.collection(collectionName).find(filter, {limit:1, sort:{_id:1}, skip:skip}).toArray(function (err, result) {
            if (err) {
                d.reject(err);
                return;
            }
            if (result.length === 0) {
                d.resolve();
                return;
            }
            var row = result[0];
            commitRowData(updateType, row, collectionName, referredCollections, db, dbToCommit, globalDb).then(
                function (newRecord) {
                    newRecord = false;
                    if (!newRecord && dbsToSynch.length > 0) {
                        return synchData(logId, updateType, dbsToSynch, row, collectionName, globalDb, logDb, referredCollections, finalStatus);
                    }
                }).
                then(
                function () {
                    if (updateType === "Synch") {
                        skip = skip + 1;
                    }
                    return commitData(logId, skip, updateType, dbsToSynch, collectionName, referredCollections, filter, db, dbToCommit, globalDb, logDb, finalStatus);
                }).then(
                function () {
                    d.resolve();
                }).fail(function (e) {
                    d.reject(e);
                })
        })
        return d.promise;
    } else {
        return commitCollectionForLocal(collectionName, db.db, dbToCommit.db, referredCollections);
    }
}

function commitRowData(updateType, row, collectionName, referredCollections, db, dbToCommit, globalDb) {
    if (updateType !== "Commit") {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var newRecord = false;
    return clearCache((collectionName === "pl.collections" ? row.collection : undefined), [db, dbToCommit, globalDb]).then(
        function () {
            return Utility.insertInAppLock(Utility.getValue(row, collectionName), collectionName, db);
        }).then(
        function () {
            return Utility.insertInAppLock(Utility.getValue(row, collectionName), collectionName, dbToCommit);
        }).then(
        function () {
            return commitRecord(row, collectionName, db.db, dbToCommit.db, referredCollections);
        }).then(
        function (isNew) {
            newRecord = isNew;
        }).then(
        function () {
            return Utility.updateAppLock(Utility.getValue(row, collectionName), collectionName, db);
        }).then(
        function () {
            return Utility.updateAppLock(Utility.getValue(row, collectionName), collectionName, dbToCommit);
        }).then(
        function () {
            if (collectionName === "pl.collections") {
                return clearCache(row.collection, [db, dbToCommit, globalDb]);
            }
        })
}

function clearCache(collectionName, dbs) {
    if (!collectionName) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    return Utils.iterateArrayWithPromise(dbs, function (index, db) {
        if (db) {
            return CacheService.clearCache(collectionName, db);
        }
    })
}

function commitCollectionForLocal(collectionName, db, dbToCommit, referredCollections) {
    return removeData(undefined, collectionName, undefined, dbToCommit, referredCollections).then(
        function () {
            return insertData(undefined, collectionName, undefined, db, dbToCommit, referredCollections);
        }).then(
        function () {
            return removeData(undefined, collectionName, ADMIN, dbToCommit, referredCollections);
        }).then(
        function () {
            return insertData(undefined, collectionName, ADMIN, db, dbToCommit, referredCollections)
        })
}

function commitRecord(row, collectionName, localDb, commitDb, referredCollections) {
    var newInsert = false;
    return insertMainData(row, collectionName, undefined, COMMIT, commitDb, commitDb, referredCollections).then(
        function (isNew) {
            newInsert = isNew;
        }).then(
        function () {
            insertMainData(row, collectionName, ADMIN, COMMIT, commitDb, commitDb, referredCollections);
        }).then(
        function () {
            return removeData(row._id, collectionName, undefined, commitDb, referredCollections);
        }).then(
        function () {
            return removeData(row._id, collectionName, ADMIN, commitDb, referredCollections);
        }).then(
        function () {
            return insertDataFromLocalToCommit(row, collectionName, undefined, COMMIT, localDb, commitDb, referredCollections);
        }).then(
        function () {
            return insertDataFromLocalToCommit(row, collectionName, ADMIN, COMMIT, localDb, commitDb, referredCollections);
        }).then(
        function () {
            return removeData(row._id, collectionName, undefined, localDb, referredCollections);
        }).then(
        function () {
            return removeData(row._id, collectionName, ADMIN, localDb, referredCollections);
        }).then(
        function () {
            return removeData(row._id, collectionName, COMMIT, commitDb, referredCollections);
        }).then(
        function () {
            return removeData(row._id, collectionName, ADMIN + COMMIT, commitDb, referredCollections);
        }).then(
        function () {
            return newInsert;
        })
}

function removeData(rowId, collectionName, append, db, referredCollections) {
    var d = Q.defer();
    if (append) {
        collectionName += append;
    }
    var filter = {};
    if (rowId) {
        filter._id = rowId;
    }
    db.collection(collectionName).remove(filter, {w:1, multi:true}, function (err, res) {
        if (err) {
            d.reject(err);
            return;
        }
        Utils.iterateArrayWithPromise(referredCollections,
            function (index, referredCollection) {
                if (append) {
                    referredCollection += append;
                }
                var d1 = Q.defer();
                var innerFilter = Utility.populateInnerFilter(referredCollection, rowId);
                db.collection(referredCollection).remove(innerFilter, {w:1, multi:true}, function (err) {
                    if (err) {
                        d1.reject(err);
                        return;
                    }
                    d1.resolve();
                })
                return d1.promise;
            }).then(
            function () {
                d.resolve();
            }).fail(function (e) {
                d.reject(e);
            })
    })
    return d.promise;
}

function insertDataFromLocalToCommit(row, collectionName, appendToGet, appendToPut, localDb, adminDb, referredCollections) {
    return insertData(row, collectionName, appendToGet, localDb, adminDb, referredCollections).fail(
        function (e) {
            return removeData(row ? row._id : undefined, collectionName, appendToGet, adminDb, referredCollections).then(
                function () {
                    return revertAdminCommitData(row ? row._id : undefined, collectionName, appendToGet, appendToPut, adminDb, referredCollections);
                }).then(
                function () {
                    return removeData(row ? row._id : undefined, collectionName, appendToGet + appendToPut, adminDb, referredCollections);
                }).fail(
                function () {
                }).then(
                function () {
                    throw e;
                })
        })
}

function insertData(row, collectionName, append, localDb, adminDb, referredCollections) {
    var d = Q.defer();
    if (append) {
        collectionName += append;
    }
    localDb.collection(collectionName).find().toArray(function (err, result) {
        if (err) {
            d.reject(err);
            return;
        }
        if (!row && result.length == 0) {
            d.resolve();
            return;
        }
        adminDb.collection(collectionName).insert(row || result, {w:1}, function (err) {
            if (err) {
                d.reject(err);
                return;
            }
            Utils.iterateArrayWithPromise(referredCollections,
                function (index, referredCollection) {
                    if (append) {
                        referredCollection += append;
                    }
                    var d1 = Q.defer();
                    var innerFilter = Utility.populateInnerFilter(referredCollection, row ? row._id : undefined);
                    localDb.collection(referredCollection).find(innerFilter).toArray(function (err, localResult) {
                        if (err) {
                            d1.reject(err);
                            return;
                        }
                        if (localResult.length == 0) {
                            d1.resolve();
                            return;
                        }
                        adminDb.collection(referredCollection).insert(localResult, {w:1}, function (err) {
                            if (err) {
                                d1.reject(err);
                                return;
                            }
                            d1.resolve();
                        })
                    })
                    return d1.promise;
                }).then(
                function () {
                    d.resolve();
                }).fail(function (e) {
                    d.reject(e);
                })
        })
    })
    return d.promise;
}

function insertMainData(rowId, collectionName, appendToGet, appendToPut, dbToCommit, dbToQuery, referredCollections) {
    var d = Q.defer();
    var filter = rowId ? {_id:rowId} : {};
    var collectionToGet = appendToGet ? collectionName + appendToGet : collectionName;
    var collectionToPut = appendToPut ? collectionToGet + appendToPut : collectionToGet;
    dbToQuery.collection(collectionToGet).find(filter).toArray(function (err, adminResult) {
        if (err) {
            d.reject(err);
            return;
        }
        if (adminResult.length == 0) {
            d.resolve(true);
            return;
        }
        dbToCommit.collection(collectionToPut).insert(adminResult, {w:1}, function (err) {
            if (err) {
                d.reject(err);
                return;
            }
            Utils.iterateArrayWithPromise(referredCollections,
                function (index, referredCollection) {
                    var d1 = Q.defer();
                    collectionToGet = appendToGet ? referredCollection + appendToGet : referredCollection;
                    collectionToPut = appendToPut ? collectionToGet + appendToPut : collectionToGet;
                    var innerFilter = Utility.populateInnerFilter(collectionToGet, rowId);
                    dbToQuery.collection(collectionToGet).find(innerFilter).toArray(function (err, adminResult) {
                        if (err) {
                            d1.reject(err);
                            return;
                        }
                        if (adminResult.length == 0) {
                            d1.resolve();
                            return;
                        }
                        dbToCommit.collection(collectionToPut).insert(adminResult, {w:1}, function (err) {
                            if (err) {
                                d1.reject(err);
                                return;
                            }
                            d1.resolve();
                        })
                    })
                    return d1.promise;
                }).then(
                function () {
                    d.resolve();
                }).fail(
                function (e) {
                    return removeData(rowId, collectionToPut, dbToCommit, referredCollections).then(
                        function () {
                            d.reject(e);
                        }).fail(function () {
                            d.reject(e);
                        })
                })
        })
    })
    return d.promise;
}

function revertAdminCommitData(rowId, collectionName, appendToGet, appendToPut, adminDb, referredCollections) {
    var d = Q.defer();
    var filter = rowId ? {_id:rowId} : {};
    var collectionToPut = appendToGet ? collectionName + appendToGet : collectionName;
    var collectionToGet = appendToPut ? collectionToPut + appendToPut : collectionToPut;
    adminDb.collection(collectionToGet).find(filter).toArray(function (err, adminResult) {
        if (err) {
            d.reject(err);
            return;
        }
        if (adminResult.length == 0) {
            d.resolve();
            return;
        }
        adminDb.collection(collectionToPut).insert(adminResult, {w:1}, function (err) {
            if (err) {
                d.reject(err);
                return;
            }
            Utils.iterateArrayWithPromise(referredCollections,
                function (index, referredCollection) {
                    var d1 = Q.defer();
                    collectionToPut = appendToGet ? referredCollection + appendToGet : collectionName;
                    collectionToGet = appendToPut ? collectionToPut + appendToPut : collectionToPut;
                    var innerFilter = Utility.populateInnerFilter(collectionToGet, rowId);
                    adminDb.collection(collectionToGet).find(innerFilter).toArray(function (err, adminResult) {
                        if (err) {
                            d1.reject(err);
                            return;
                        }
                        if (adminResult.length == 0) {
                            d1.resolve();
                            return;
                        }
                        adminDb.collection(collectionToPut).insert(adminResult, {w:1}, function (err) {
                            if (err) {
                                d1.reject(err);
                                return;
                            }
                            d1.resolve();
                        })
                    })
                    return d1.promise;
                }).then(
                function () {
                    d.resolve();
                }).fail(function (e) {
                    d.reject(e);
                })
        })
    })
    return d.promise;
}

function synchData(logId, updateType, dbsToSynch, row, collectionName, globalDb, logDb, referredCollections, finalStatus) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    return Utils.iterateArrayWithPromise(dbsToSynch,
        function (index, dbToSync) {
            var dbName = dbToSync.db;
            if (!dbName) {
                return;
            }
            var needToSync = false;
            var localAdminResult = undefined;
            return ApplaneDB.getAdminDB().then(
                function (adminDb) {
                    return adminDb.query({$collection:"pl.dbs", $filter:{admindb:dbName}, $limit:1, $fields:{db:1}});
                }).then(
                function (result) {
                    if (updateType === "Synch" && result.result.length > 0) {
                        return globalDb.connectUnauthorized(result.result[0].db).then(
                            function (dbToget) {
                                return  dbToget.query({$collection:collectionName, $filter:{_id:row._id}});
                            }).then(function (data) {
                                if (data.result.length > 0) {
                                    throw new Error("Kindly Commit data in db [" + result.result[0].db + "] to synch in db [" + dbName + "]");
                                }
                            })
                    }
                }).then(
                function () {
                    return globalDb.connectUnauthorized(dbName)
                }).then(
                function (dts) {
                    dbToSync = dts;
                    if (collectionName === "pl.collections") {
                        return CacheService.clearCache(row.collection, dbToSync);
                    }
                }).then(
                function () {
                    return Utility.insertInAppLock(Utility.getValue(row, collectionName), collectionName, dbToSync);
                }).then(
                function () {
                    return dbToSync.query({$collection:collectionName + ADMIN, $filter:{_id:row._id}, $events:false, $modules:false});
                }).then(
                function (result) {
                    if (result.result.length > 0) {
                        localAdminResult = result.result[0];
                        return dbToSync.query({$collection:collectionName, $filter:{_id:row._id}, $events:false, $modules:false});
                    }
                }).then(
                function (localResult) {
                    if (localResult && localResult.result.length > 0) {
                        localResult = localResult.result[0];
                        needToSync = true;
                        return synchDataCollectionWise(row, localAdminResult, localResult, collectionName, dbToSync, globalDb, referredCollections);
                    }
                }).then(
                function () {
                    if (needToSync) {
                        return removeData(row._id, collectionName, ADMIN, dbToSync.db, referredCollections);
                    }
                }).then(
                function () {
                    if (needToSync) {
                        return insertMainData(row._id, collectionName, undefined, ADMIN, dbToSync.db, globalDb.db, referredCollections);
                    }
                }).fail(
                function (err) {
                    finalStatus.status = "Failed";
                    return logDb.mongoUpdate({$collection:"pl.logs", $update:[
                        {$query:{_id:logId}, $push:{logs:{$each:[
                            {status:"Failed", error:JSON.stringify(Utils.getErrorInfo(err)), log:JSON.stringify({collection:collectionName, record:{_id:row._id, value:Utility.getValue(row, collectionName)}, db:dbName})}
                        ]}}}
                    ]});
                }).then(
                function () {
                    if (collectionName === "pl.collections") {
                        return CacheService.clearCache(row.collection, dbToSync);
                    }
                }).then(
                function () {
                    return Utility.updateAppLock(Utility.getValue(row, collectionName), collectionName, dbToSync);
                })
        })
}

function synchDataCollectionWise(row, localAdminRecord, localRecord, collectionName, dbToSync, superAdmin, referredCollections) {
    return syncRecordForUpdate(collectionName, row, localAdminRecord, localRecord, dbToSync).then(
        function () {
            return Utils.iterateArrayWithPromise(referredCollections, function (index, referredCollection) {
                var innerFilter = Utility.populateInnerFilter(referredCollection, row._id);
                return syncReferredCollection(referredCollection, innerFilter, dbToSync, superAdmin);
            })
        }
    )
}

function syncRecordForUpdate(collectionName, superAdminRecord, localAdminRecord, localRecord, dbToSync) {
    if (localRecord && superAdminRecord.lastmodifiedtime > localAdminRecord.lastmodifiedtime) {
        var set = {};
        for (var k in superAdminRecord) {
            if (Utils.deepEqual(localAdminRecord[k], localRecord[k])) {
                set[k] = superAdminRecord[k];
            } else {
                var superAdminValue = superAdminRecord[k];
                var localValue = localRecord[k];
                if (superAdminValue !== undefined && localValue !== undefined) {
                    if (superAdminValue && localValue && typeof superAdminValue !== typeof localValue) {
                        set[k] = superAdminRecord[k];
                    } else {
                        if (Array.isArray(localValue)) {
                            set[k] = handleArray(superAdminValue, localAdminRecord[k], localValue);
                        } else {
                            set[k] = localValue;
                        }
                    }
                }
            }
        }
        delete set._id;
        var unset = {};
        for (var key in localAdminRecord) {
            if (superAdminRecord[key] === undefined) {
                if (Utils.deepEqual(localAdminRecord[key], localRecord[key])) {
                    unset[key] = "";
                }
            }
        }
        var updateQuery = {$query:{_id:superAdminRecord._id}};
        if (Object.keys(set).length > 0) {
            updateQuery.$set = set;
        }
        if (Object.keys(unset).length > 0) {
            updateQuery.$unset = unset;
        }
        return dbToSync.mongoUpdate({$collection:collectionName, $update:updateQuery});
    } else {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
}

function handleArray(superAdminValues, localAdminValues, localValues) {
    var newArray = [];
    //for inserted or updated records in superadmin
    for (var i = 0; i < superAdminValues.length; i++) {
        var superAdminValue = superAdminValues[i];
        //for string type array no need of merging.
        if (typeof superAdminValue === "string") {
            return localValues;
        }
        var localAdminIndex = Utils.isExists(localAdminValues, superAdminValue, "_id");
        if (localAdminIndex === undefined) {
            newArray.push(superAdminValue);
        } else {
            var localIndex = Utils.isExists(localValues, superAdminValue, "_id");
            if (localIndex !== undefined) {
                var localValue = localValues[localIndex];
                if (Utils.deepEqual(localValue, superAdminValue)) {
                    newArray.push(superAdminValue);
                } else {
                    newArray.push(localValue);
                }
            }
        }
    }
    //for new added records in local
    for (var i = 0; i < localValues.length; i++) {
        var localValue = localValues[i];
        var superIndex = Utils.isExists(superAdminValues, localValue, "_id");
        if (superIndex === undefined) {
            newArray.push(localValue);
        }
    }
    //for deleted records in local
    if (localAdminValues) {
        for (var i = 0; i < localAdminValues.length; i++) {
            var localAdminValue = localAdminValues[i];
            var superIndex = Utils.isExists(superAdminValues, localAdminValue, "_id");
            if (superIndex === undefined) {
                var newIndex = Utils.isExists(newArray, localAdminValue, "_id");
                newArray.splice(newIndex, 1);
            }
        }
    }
    return newArray;
}

function syncReferredCollection(collectionName, filter, dbToSync, superAdmin) {
    var records = undefined;
    return populateRecords(collectionName, filter, dbToSync, superAdmin).then(
        function (result) {
            records = result;
            return Utils.iterateArrayWithPromise(records.superadminres, function (index, superAdminRow) {
                var localAdminRecord = getRecord(records, "localadminres", superAdminRow._id);
                if (!localAdminRecord) {
                    return insert(collectionName, superAdminRow, dbToSync.db);
                } else {
                    var localRecord = getRecord(records, "localres", superAdminRow._id);
                    return syncRecordForUpdate(collectionName, superAdminRow, localAdminRecord, localRecord, dbToSync);
                }
            })
        }).then(
        function () {
            return Utils.iterateArrayWithPromise(records.localadminres, function (index, localAdminRow) {
                if (!getRecord(records, "superadminres", localAdminRow._id)) {
                    return remove(collectionName, {_id:localAdminRow._id}, dbToSync.db);
                }
            })
        })
}

function getRecord(records, recordToGet, id) {
    var record = records[recordToGet];
    if (record) {
        for (var i = 0; i < record.length; i++) {
            if (Utils.deepEqual(record[i]._id, id)) {
                return record[i];
            }
        }
    }
}

function remove(collectionName, filter, db) {
    var d = Q.defer();
    db.collection(collectionName).remove(filter, {w:1, multi:true}, function (err, res) {
        if (err) {
            d.reject(err);
            return;
        }
        d.resolve(res);
    })
    return d.promise;
}

function insert(collectionName, data, db) {
    var d = Q.defer();
    db.collection(collectionName).insert(data, {w:1}, function (err, res) {
        if (err) {
            d.reject(err);
            return;
        }
        d.resolve(res);
    })
    return d.promise;
}

function populateRecords(collectionName, filter, dbToSynch, superAdmin) {
    var d = Q.defer();
    superAdmin.db.collection(collectionName).find(filter).toArray(function (err, superAdminResult) {
        if (err) {
            d.reject(err);
            return;
        }
        dbToSynch.db.collection(collectionName + ADMIN).find(filter).toArray(function (err, localAdminResult) {
            if (err) {
                d.reject(err);
                return;
            }
            dbToSynch.db.collection(collectionName).find(filter).toArray(function (err, localResult) {
                if (err) {
                    d.reject(err);
                    return;
                }
                d.resolve({superadminres:superAdminResult, localadminres:localAdminResult, localres:localResult});
            })
        })
    })
    return d.promise;
}
