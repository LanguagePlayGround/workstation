/**
 * Created with IntelliJ IDEA.
 * User: SachinBansal
 * Date: 20/6/15
 * Time: 4:33 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("./Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var CacheService = require("ApplaneDB/lib/CacheService.js");
var Utility = require("./triggers/Utility.js");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError.js");
var ReferredFks = require("./triggers/ReferredFks.js");
var Config = require("ApplaneDB/Config.js").config;

var MongoClient = require("mongodb").MongoClient;
var Q = require("q");

var RemoteDB = function (db, options) {
    this.db = db;
    this.options = options;
}

exports.getDB = function (url, dbName, options) {
    url += "/" + dbName + "/";
    return connectToMongo(url, options).then(function (db) {
        return new RemoteDB(db, options);
    })
}


//Issue : How can synch data which is removed. if top level collection is deleted for value like if application/collection deleted  bcz in query,deleted collection not get.
//Change logs not managed
// Delete in referred collections and for global collections will be handled.


exports.synchDB = function (parameters, db, options) {
    if (!options.processid) {
        throw new BusinessLogicError("Async must be true in Synch Process.");
    }
    return db.query({$collection:"pl.dbs", $filter:{_id:parameters._id}, $fields:{db:1, remoteURL:1, remoteDbs:1, remotePort:1, code:1}}).then(
        function (dbResult) {
            dbResult = dbResult.result[0];
            if (!parameters.synch) {
                throw new BusinessLogicError("Synch must be true.");
            }
            var remoteURL = dbResult.remoteURL;
            var remoteDbs = dbResult.remoteDbs;
            var remotePort = dbResult.remotePort;
            if (!remoteURL || !remotePort) {
                throw new BusinessLogicError("RemoteURL/RemotePort is not defined for synch db [" + dbResult.db + "]");
            }
            if (!remoteDbs || remoteDbs.length === 0) {
                throw new BusinessLogicError("RemoteDbs not defined for synch db [" + dbResult.db + "]");
            }
            Utils.sort(remoteDbs, "asc", "index");
            var insertAppLockError = false;
            return Utility.insertInAppLock(remoteURL + "." + remotePort, "pl.dbs", db).fail(
                function (err) {
                    insertAppLockError = true;
                    throw err;
                }).then(
                function () {
                    return db.update({$collection:"pl.dbs", $update:{_id:dbResult._id, $set:{remoteProcess:"In Process"}}, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}});
                }).then(
                function () {
                    var service = {};
                    service.hostname = dbResult.remoteURL;
                    service.port = dbResult.remotePort;
                    service.path = "/rest/invoke";
                    service.method = "post";
                    var serviceParams = {function:"RemoteDB.synchRemoteDB", parameters:JSON.stringify([
                        {dbName:dbResult.db, remoteURL:remoteURL, adminDb:db.db.databaseName, mongoURL:Config.MONGO_REMOTE_URL, mongoUser:Config.MongoAdmin.USER_NAME, mongoPassword:Config.MongoAdmin.PASSWORD, mongoAuthDb:Config.MongoAdmin.DB}
                    ]), code:dbResult.code };
                    return require("ApplaneCore/apputil/httputil.js").executeServiceAsPromise(service, serviceParams);
                }).then(
                function () {
                    return waitRemoteProcessDone(parameters, db);
                }).then(
                function () {
                    return Utility.updateAppLock(remoteURL + "." + remotePort, "pl.dbs", db);
                }).fail(
                function (err) {
                    if (!insertAppLockError) {
                        Utility.updateAppLock(remoteURL + "." + remotePort, "pl.dbs", db);
                    }
                    throw err;
                })
        })
}

function waitRemoteProcessDone(parameters, db) {
    var d = Q.defer();
    setTimeout(function () {
        db.query({$collection:"pl.dbs", $filter:{_id:parameters._id}, $fields:{remoteProcess:1}, $events:false, $modules:false}).then(
            function (result) {
                var remoteProcess = result.result[0].remoteProcess;
                if (remoteProcess === "In Process") {
                    return waitRemoteProcessDone(parameters, db);
                }
            }).then(
            function () {
                d.resolve();
            }).fail(function (err) {
                d.reject(err);
            })
    }, 10000)
    return d.promise;
}

exports.synchRemoteDB = function (parameters, db, options) {
    console.log("synch Remote Db called..");
    return require("./RemoteDB.js").getDB(parameters.mongoURL, parameters.adminDb, parameters).then(
        function (adminDBToQuery) {
            synchData(parameters, adminDBToQuery, db, options);
        })
}

function synchData(parameters, adminDBToQuery, db, options) {
    var remoteDbUpdates = [];
    var remoteDbsQuery = {$collection:"pl.dbs", $filter:{db:parameters.dbName}, $fields:{remoteDbs:1}};
    adminDBToQuery.query(remoteDbsQuery).then(
        function (remoteDBs) {
            remoteDBs = remoteDBs.result[0].remoteDbs;
            Utils.sort(remoteDBs, "asc", "index");
            return Utils.iterateArrayWithPromise(remoteDBs,
                function (index, remoteDB) {
                    var remoteDbUpdate = {query:{db:parameters.dbName, "remoteDbs._id":remoteDB._id}, update:{$set:{}}};
                    remoteDbUpdates.push(remoteDbUpdate);
                    return db.connectUnauthorized(remoteDB.db).then(
                        function (connectedDb) {
                            return synchDataOnRemoteDB(parameters, remoteDB, adminDBToQuery, connectedDb, options);
                        }).then(
                        function () {
                            remoteDbUpdate.update.$set["remoteDbs.$.date"] = new Date();
                            remoteDbUpdate.update.$set["remoteDbs.$.status"] = "Success";
                        }).fail(function (err) {
                            remoteDbUpdate.update.$set["remoteDbs.$.status"] = "Error";
                            throw err;
                        })
                })
        }).then(
        function () {
            remoteDbUpdates.push({query:{db:parameters.dbName}, update:{$set:{remoteProcess:"Success"}, $unset:{remoteError:""}}});
        }).fail(
        function (err) {
            remoteDbUpdates.push({query:{db:parameters.dbName}, update:{$set:{remoteProcess:"Error", remoteError:JSON.stringify(Utils.getErrorInfo(err))}}});
        }).then(
        function () {
            console.log("remoteDbUpdates>>>>>>" + JSON.stringify(remoteDbUpdates));
            return updateRemoteData("pl.dbs", "update", remoteDbUpdates, adminDBToQuery);
        })
}

RemoteDB.prototype.query = function (query) {
    var that = this;
    var collectionName = query.$collection;
    var d = Q.defer();
    if (query.$group || query.$unwind) {
        var pipeline = getPipelines(query);
        that.db.collection(collectionName).aggregate(pipeline, function (err, result) {
            if (err) {
                d.reject(err);
                return;
            }
            d.resolve({result:result});
        })
    } else {
        var filter = query.$filter || {};
        var options = {};
        if (query.$fields) {
            options.fields = query.$fields;
        }
        if (query.$sort) {
            options.sort = query.$sort;
        }
        if (query.$limit) {
            options.limit = query.$limit;
        }
        that.db.collection(collectionName).find(filter, options).toArray(function (err, res) {
            if (err) {
                d.reject(err);
                return;
            }
            d.resolve({result:res});
        })
    }
    return d.promise;
}

function getPipelines(query) {
    var pipeLines = [];
    //temp filter should be applied before unwind as well as after unwind start Rohit
    if (query.$filter) {
        var filter = query.$filter;
        Utils.convert_IdToObjectIdInFilter(filter);
        pipeLines.push({$match:filter});
    }
    //temp filter should be applied before unwind as well as after unwind end Rohit
    if (query.$unwind) {
        var unwind = query.$unwind;
        if (!(Array.isArray(unwind))) {
            throw new Error("Unwind in query should be in Array but found [" + JSON.stringify(unwind) + "].Query is [" + JSON.stringify(query) + "]");
        }
        for (var i = 0; i < unwind.length; i++) {
            pipeLines.push({$unwind:"$" + unwind[i]});
        }
        if (query.$filter) {
            var filter = query.$filter;
            var newFilter = {};
            for (var k in filter) {
                if (k !== "$text") {
                    newFilter[k] = filter[k];
                }
            }
            pipeLines.push({$match:newFilter});
        }
    }
    if (query.$fields && Object.keys(query.$fields).length > 0) {
        pipeLines.push({$project:query.$fields});
    }
    if (query.$sort) {
        pipeLines.push({$sort:query.$sort});
    }
    if (query.$group) {
        var group = query.$group;
        if (Array.isArray(group)) {
            for (var i = 0; i < group.length; i++) {
                populateGroup(pipeLines, group[i]);
            }
        } else {
            populateGroup(pipeLines, group);
        }
    }
    if (query.$skip !== undefined) {
        pipeLines.push({$skip:query.$skip});
    }
    if (query.$limit !== undefined && query.$limit > 0) {
        query.$limit = query.$limit + 1;
        pipeLines.push({$limit:query.$limit});
    }
    return pipeLines;
}

function populateGroup(pipeLines, group) {
    pipeLines.push({$group:group});
    if (group.$filter) {
        var filter = group.$filter;
        Utils.convert_IdToObjectIdInFilter(filter);
        pipeLines.push({$match:filter});
        delete group.$filter;
    }
    if (group.$sort) {
        pipeLines.push({$sort:group.$sort});
        delete group.$sort;
    }
}

function synchDataOnRemoteDB(parameters, remoteDb, adminDBToQuery, db, options) {
    var dbToQuery = undefined;
    var collectionValues = [];
    var remoteSynchData = [];
    var removeDBCache = undefined;
    return require("./RemoteDB.js").getDB(parameters.mongoURL, db.db.databaseName, parameters).then(
        function (dtq) {
            dbToQuery = dtq;
        }).then(
        function () {
            return db.startTransaction();
        }).then(
        function () {
            var changeLogQuery = {
                $collection:"pl.changelogs",
                $filter:{db:remoteDb.db},
                $group:{_id:{mainCollection:"$mainCollection", mainFk:"$mainFk._id"}, mainFk:{$first:"$mainFk"}, mainCollection:{$first:"$mainCollection"}}, $sort:{mainCollection:1, "mainFk._id":1}
            };
            if (remoteDb.date) {
                changeLogQuery.$filter.date = {$gt:remoteDb.date};
            }
            return adminDBToQuery.query(changeLogQuery);
        }).then(
        function (changeLogs) {
            changeLogs = changeLogs.result;
            console.log("changeLogsCount>>>>>>>" + changeLogs.length);
            return Utils.iterateArrayWithPromise(changeLogs, function (index, changeLog) {
                var collectionName = changeLog.mainCollection;
                if (collectionName === "pl.roles" || collectionName === "pl.applications") {
                    removeDBCache = true;
                }
                var collectionValue = changeLog.mainFk;
                if (!collectionName || !collectionValue) {
                    return;
                }
                var dataToSynch = undefined;
                options.referredfks = true;
                return Utility.populateCollectionData({_id:collectionValue._id}, collectionName, dbToQuery, options).then(
                    function (data) {
                        dataToSynch = data;
                    }).then(
                    function () {
                        if (dataToSynch) {
                            return synchRemoteData(parameters, collectionName, collectionValue, dataToSynch, collectionValues, remoteSynchData, db, options);
                        }
                    })
            })
        }).then(
        function () {
            return updateRemoteData("pl.remoteSynchData", "insert", remoteSynchData, adminDBToQuery);
        }).then(
        function () {
            return Utils.iterateArrayWithPromise(collectionValues,
                function (index, collectionValue) {
                    return db.update(collectionValue.updates).then(function () {
                        return Utility.removeLockAndClearCache(collectionValue.value, "pl.collections", db);
                    })
                }).then(function () {
                    if (removeDBCache) {
                        return db.invokeFunction("Porting.removeUserCache", [
                            {all:true}
                        ])
                    }
                })
        }).then(
        function () {
            return db.commitTransaction();
        }).fail(
        function (err) {
            return db.rollbackTransaction().fail(
                function (e) {
                    console.log('error in rollback>>>>>>' + e.stack);
                }).then(function () {
                    throw err;
                })
        })
}

function synchRemoteData(parameters, collectionName, collectionValue, dataToSynch, collectionValues, remoteSynchData, db, options) {
    return Utility.loadCollectionAndCreateLock(collectionValue.value, collectionName, db).then(
        function () {
            return Utility.populateCollectionData({_id:collectionValue._id}, collectionName, db, options);
        }).then(
        function (dataInSynch) {
            var updatesToSynch = populateUpdatesToSynch(dataToSynch, dataInSynch);
            if (updatesToSynch.length > 0) {
                remoteSynchData.push({
                    db:db.db.databaseName,
                    date:new Date(),
                    remoteURL:parameters.remoteURL,
                    collection:collectionName,
                    value:collectionValue,
                    update:JSON.stringify(updatesToSynch)
                });
                var referredFkUpdates = [];
                for (var i = 0; i < updatesToSynch.length; i++) {
                    if (updatesToSynch[i].$collection === "pl.referredfks") {
                        referredFkUpdates.push(updatesToSynch[i]);
                        updatesToSynch.splice(i, 1);
                        i = i - 1;
                    }
                }
                return db.update(updatesToSynch).then(function () {
                    if (collectionName === "pl.collections" && collectionValue.value && referredFkUpdates.length > 0) {
                        collectionValues.push({value:collectionValue.value, updates:referredFkUpdates});
                    } else {
                        return Utility.removeLockAndClearCache(collectionValue.value, collectionName, db);
                    }
                })
            } else {
                return Utility.removeLockAndClearCache(collectionValue.value, collectionName, db);
            }
        })
}

function updateRemoteData(collectionName, type, updates, dbToQuery) {
    return Utils.iterateArrayWithPromise(updates, function (index, update) {
        var d = Q.defer();
        if (type === "insert") {
            dbToQuery.db.collection(collectionName).insertOne(update, {w:1}, function (err, res) {
                if (err) {
                    d.reject(err);
                    return;
                }
                d.resolve(res);
            });
        } else if (type === "update") {
            dbToQuery.db.collection(collectionName).updateOne(update.query, update.update, {w:1}, function (err, res) {
                if (err) {
                    d.reject(err);
                    return;
                }
                d.resolve(res);
            });
        } else {
            d.resolve();
        }
        return d.promise;
    })
}

function connectToMongo(url, options) {
    var D = Q.defer();
    MongoClient.connect(url, function (err, db) {
        if (err) {
            D.reject(err);
            return;
        }
        db.authenticate(options.mongoUser, options.mongoPassword, {authdb:options.mongoAuthDb}, function (err, res) {
            if (err) {
                D.reject(err);
            } else if (!res) {
                D.reject(new Error("Auth fails"));
            } else {
                D.resolve(db);
            }

        })
    })
    return D.promise;
}

function populateUpdatesToSynch(dataToSynch, dataInSynch) {
    var updatesToSynch = [];
    for (var collectionName in dataToSynch) {
        var resultToSynch = dataToSynch[collectionName];
        var resultInSynch = dataInSynch[collectionName];
        if (resultInSynch && Utils.isJSONObject(resultInSynch)) {
            resultInSynch = [resultInSynch];
        }
        if (resultToSynch && Utils.isJSONObject(resultToSynch)) {
            resultToSynch = [resultToSynch];
        }
        if (!resultInSynch || resultInSynch.length === 0) {
            resultInSynch = undefined;
        }
        if (!resultToSynch || resultToSynch.length === 0) {
            resultToSynch = undefined;
        }
        var update = {$collection:collectionName, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}};
        if (!resultToSynch && !resultInSynch) {
            continue;
        } else if (!resultToSynch && resultInSynch) {
            var deleteIds = [];
            for (var i = 0; i < resultInSynch.length; i++) {
                deleteIds.push({_id:resultInSynch[i]._id});
            }
            update.$delete = deleteIds;
        } else if (resultToSynch && !resultInSynch) {
            update.$insert = resultToSynch;
        } else {
            var updatedChanges = getUpdatedChanges(resultToSynch, resultInSynch);
            if (!updatedChanges) {
                continue;
            }
            for (var k in updatedChanges) {
                update[k] = updatedChanges[k];
            }
        }
        var insertRecords = update.$insert;
        var updateRecords = update.$update;
        var deleteRecords = update.$delete;
        delete update.$insert;
        delete update.$update;
        delete update.$delete;
        addUpdate(updatesToSynch, update, deleteRecords, "$delete");
        addUpdate(updatesToSynch, update, updateRecords, "$update");
        addUpdate(updatesToSynch, update, insertRecords, "$insert");
    }
    return updatesToSynch;
}

function addUpdate(updates, update, records, type) {
    if (records) {
        var newUpdates = Utils.deepClone(update);
        newUpdates[type] = records;
        updates.push(newUpdates);
    }
}

function getUpdatedChanges(resultToSynch, resultInSynch) {
    var updates = undefined;
    for (var i = 0; i < resultToSynch.length; i++) {
        var row = resultToSynch[i];
        var index = Utils.isExists(resultInSynch, row, "_id");
        if (index === undefined) {
            updates = updates || {};
            updates.$insert = updates.$insert || [];
            updates.$insert.push(row);
        } else {
            var synchRow = resultInSynch[index];
            resultInSynch.splice(index, 1);
            var update = undefined;
            for (var k in row) {
                if (!Utils.deepEqual(row[k], synchRow[k])) {
                    update = update || {};
                    update.$set = update.$set || {};
                    update.$set[k] = row[k];
                }
                delete synchRow[k];
            }
            for (var k in synchRow) {
                update = update || {};
                update.$unset = update.$unset || {};
                update.$unset[k] = "";
            }
            if (update) {
                update._id = row._id;
                updates = updates || {};
                updates.$update = updates.$update || [];
                updates.$update.push(update);
            }
        }
    }
    for (var i = 0; i < resultInSynch.length; i++) {
        var row = resultInSynch[i];
        updates = updates || {};
        updates.$delete = updates.$delete || [];
        updates.$delete.push({_id:row._id});
    }
    return updates;
}


