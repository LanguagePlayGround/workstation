/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 30/10/14
 * Time: 11:10 AM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("./Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Utility = require("./triggers/Utility.js");
var QueryUtility = require("ApplaneDB/lib/QueryUtility.js");
var Self = require("./Commit.js");
var Synch = require("./Synch.js");
var ReferredFks = require("./triggers/ReferredFks.js");

exports.commit = function (parameters, db, options) {
    if (!options.processid) {
        throw new Error("Async must be true in Commit Process.");
    }
    options.txEnabled = false;
    return db.startProcess([parameters], "Commit.commitProcess", options);
}

exports.commitProcess = function (record, db, options) {
    var parameters = record.data || {};
    if (!parameters.commit) {
        throw new Error("Commit must be true.");
    }
//    if (db.isGlobalDB()) {
//        throw new Error("Commit is not Allowed in db [" + db.db.databaseName + "]");
//    }
    var dbToCommit = undefined;
    var adminDB = undefined;
    var synchDbErr = [];
    var ensureDBErr = [];
    var collectionsToEnsureIndexes = [];
    var pladminDB = undefined;
    var adminDBName = db.getConfig("Admin").DB;
    return db.txDB(adminDBName).then(
        function (adb) {
            adminDB = adb;
            return adminDB.query({$collection:"pl.dbs", $filter:{db:db.db.databaseName}})
        }).then(
        function (dbResult) {
            var dbInfo = dbResult.result[0];
            if (!dbInfo) {
                throw new Error("Db [" + db.db.databaseName + "] not found in collection [pl.dbs]");
                return;
            }
            if (dbInfo.admindb && dbInfo.admindb !== dbInfo.globalDb) {
                throw new Error("Global Db must be same as Admindb in db [" + db.db.databaseName + "]");
                return;
            }
            return db.txDB(dbInfo.admindb || db.db.databaseName);
        }).then(
        function (dtc) {
            dbToCommit = dtc;
        }).then(
        function () {
            return db.startTransaction();
        }).then(
        function () {
            return handleCommit(collectionsToEnsureIndexes, db, dbToCommit, adminDB, parameters);
        }).then(
        function () {
            return db.commitTransaction();
        }).fail(
        function (err) {
            return db.rollbackTransaction().fail(
                function (e) {
                    //do nothing.
                }).then(function () {
                    throw err;
                })
        }).then(
        function () {
            if (options && options.processid) {
                var update = {_id:Utils.getUniqueObjectId(), status:"Commit Success"};
                return db.mongoUpdate({$collection:"pl.processes", $update:{$query:{_id:options.processid}, $push:{detail:{
                    $each:[
                        update
                    ]
                }}}});
            }
        }).then(
        function () {
            return db.getAdminDB();
        }).then(
        function (pldb) {
            pladminDB = pldb;
            delete parameters.commit;
            parameters.synch = true;
            return doAutoSynching(db, dbToCommit.db.databaseName, pladminDB, synchDbErr, parameters, options);
        }).then(
        function () {
            if (options && options.processid) {
                var update = {_id:Utils.getUniqueObjectId(), status:synchDbErr.length > 0 ? ("Synch Failed for dbs " + JSON.stringify(synchDbErr) + "") : "Synch Success"};
                return db.mongoUpdate({$collection:"pl.processes", $update:{$query:{_id:options.processid}, $push:{detail:{
                    $each:[
                        update
                    ]
                }}}});
            }
        }).then(
        function () {
            if (collectionsToEnsureIndexes.length > 0) {
                return ensureIndexInDbs(db, dbToCommit.db.databaseName, pladminDB, ensureDBErr, collectionsToEnsureIndexes, options);
            }
        }).then(
        function () {
            if (collectionsToEnsureIndexes.length > 0 && options && options.processid) {
                var update = {_id:Utils.getUniqueObjectId(), status:ensureDBErr.length > 0 ? ("EnsureIndexes failed for dbs " + JSON.stringify(ensureDBErr) + "") : "EnsureIndexes Success"};
                return db.mongoUpdate({$collection:"pl.processes", $update:{$query:{_id:options.processid}, $push:{detail:{
                    $each:[
                        update
                    ]
                }}}});
            }
        }).then(function () {
            if (synchDbErr.length > 0 || ensureDBErr.length > 0) {
                throw new Error("Error Found");
            }
        })
}

function ensureIndexInDbs(db, globalDBName, adminDB, ensureDBErr, collectionsToEnsureIndex, options) {
    var errorDetail = undefined;
    return db.invokeFunction("Porting.ensureIndexes", [
        {db:globalDBName, collection:collectionsToEnsureIndex}
    ]).fail(
        function (err) {
            ensureDBErr.push(globalDBName);
            errorDetail = Utils.getErrorInfo(err);
        }).then(
        function () {
            if (options && options.processid) {
                var update = {_id:Utils.getUniqueObjectId(), status:errorDetail ? "Error in Ensure Index" : "Success for Ensure Index", message:"Db : " + globalDBName};
                if (errorDetail) {
                    update.error = JSON.stringify(errorDetail);
                }
                return db.mongoUpdate({$collection:"pl.processes", $update:{$query:{_id:options.processid}, $push:{detail:{
                    $each:[
                        update
                    ]
                }}}});
            }
        }).then(
        function () {
            return adminDB.query({$collection:"pl.dbs", $filter:{globalDb:globalDBName, applications:{$exists:true}}, $fields:{db:1, applications:1}, $events:false})
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbInfo) {
                var ensureDBName = dbInfo.db;
                var applications = dbInfo.applications;
                if (!applications || applications.length === 0) {
                    return;
                }
                var applicationIds = [];
                for (var i = 0; i < applications.length; i++) {
                    applicationIds.push(applications[i].application);
                }
                var dbToEnsure = undefined;
                return db.connectUnauthorized(ensureDBName).then(
                    function (db1) {
                        dbToEnsure = db1;
                    }).then(
                    function () {
                        return dbToEnsure.query({$collection:"pl.applications", $fields:{collections:1}, $filter:{id:{$in:applicationIds}, "collections.collection":{$in:collectionsToEnsureIndex}}});
                    }).then(
                    function (applicationsResult) {
                        applicationsResult = applicationsResult.result;
                        if (!applicationsResult || applicationsResult.length === 0) {
                            return;
                        }
                        var newCollectionsToEnsureIndexes = [];
                        for (var i = 0; i < applicationsResult.length; i++) {
                            var application = applicationsResult[i];
                            var applicationCollections = application.collections;
                            for (var j = 0; j < applicationCollections.length; j++) {
                                var applicationCollection = applicationCollections[j].collection;
                                if (collectionsToEnsureIndex.indexOf(applicationCollection) !== -1 && newCollectionsToEnsureIndexes.indexOf(applicationCollection) === -1) {
                                    newCollectionsToEnsureIndexes.push(applicationCollection);
                                }
                            }
                        }
                        if (newCollectionsToEnsureIndexes.length === 0) {
                            return;
                        }
                        return ensureIndexInDbs(db, ensureDBName, adminDB, ensureDBErr, newCollectionsToEnsureIndexes, options);
                    }).fail(
                    function (err) {
                        ensureDBErr.push(ensureDBName);
                        if (options && options.processid) {
                            var update = {_id:Utils.getUniqueObjectId(), status:"Error in Ensure Index", message:"Db : " + ensureDBName, error:JSON.stringify(Utils.getErrorInfo(err))};
                            return db.mongoUpdate({$collection:"pl.processes", $update:{$query:{_id:options.processid}, $push:{detail:{
                                $each:[
                                    update
                                ]
                            }}}});
                        }
                    })
            })
        })
}

function doAutoSynching(db, globalDBName, adminDB, synchDbErr, parameters, options) {
    return adminDB.query({$collection:"pl.dbs", $filter:{globalDb:globalDBName, autoSynch:true}, $fields:{db:1}, $events:false}).then(function (dbs) {
        dbs = dbs.result;
        return  Utils.iterateArrayWithPromise(dbs, function (index, dbInfo) {
            var synchDbName = dbInfo.db;
            if (db.db.databaseName === synchDbName) {
                return;
            }
            var dbToSynch = undefined;
            var errorDetail = undefined;
            var startTime = new Date();
            return db.connectUnauthorized(synchDbName).then(
                function (dts) {
                    dbToSynch = dts;
                    return Synch.synchProcess({data:parameters}, dbToSynch, options);
                }).then(
                function () {
                    return doAutoSynching(db, synchDbName, adminDB, synchDbErr, parameters, options);
                }).fail(
                function (err) {
                    synchDbErr.push(synchDbName);
                    errorDetail = Utils.getErrorInfo(err);
                }).then(
                function () {
                    if (options && options.processid) {
                        var update = {_id:Utils.getUniqueObjectId(), status:errorDetail ? "Error in Synch" : "Success in Synch", message:"Db : " + synchDbName + ", Time : " + (new Date() - startTime)};
                        if (errorDetail) {
                            update.error = JSON.stringify(errorDetail);
                        }
                        return db.mongoUpdate({$collection:"pl.processes", $update:{$query:{_id:options.processid}, $push:{detail:{
                            $each:[
                                update
                            ]
                        }}}});
                    }
                }).then(function () {
                    if (dbToSynch) {
                        dbToSynch.clean();
                        dbToSynch = undefined;
                    }
                })

        })
    })
}

function handleCommit(collectionsToEnsureIndexes, db, dbToCommit, adminDB, parameters) {
    parameters = parameters || {};
    var filter = {db:db.db.databaseName, status:"Non Committed", type:{$exists:true}};
    return Utility.addPropertiesInFilter(parameters, filter, db).then(
        function () {
            var queryToGetCollections = {
                $collection:"pl.changelogs",
                $filter:filter,
                $group:{_id:{mainCollection:"$mainCollection", mainFk:"$mainFk._id"}, mainFk:{$first:"$mainFk"}, mainCollection:{$first:"$mainCollection"}, $sort:{mainCollection:1, "mainFk._id":1}},
                $events:false
            }
            return adminDB.query(queryToGetCollections);
        }).then(function (changeCollectionInfos) {
            changeCollectionInfos = changeCollectionInfos.result;
            if (changeCollectionInfos.length === 0) {
                return;
            }
            var versionInfo = {};
            var collectionValues = [];
            var removeDBCache = false;
            return Utils.iterateArrayWithPromise(changeCollectionInfos,
                function (index, changeCollectionInfo) {
                    var mainCollectionName = changeCollectionInfo.mainCollection;
                    if (mainCollectionName === "pl.roles" || mainCollectionName === "pl.applications") {
                        removeDBCache = true;
                    }
                    var mainCollectionValue = changeCollectionInfo.mainFk;
                    return adminDB.query({$collection:"pl.changelogs", $filter:{db:db.db.databaseName, mainCollection:mainCollectionName, "mainFk._id":mainCollectionValue._id, type:{$exists:true}, status:"Non Committed"}, $events:false, $sort:{_id:1}}).then(function (commitChangeLogs) {
                        commitChangeLogs = commitChangeLogs.result;
                        if (commitChangeLogs.length === 0) {
                            return;
                        }
                        populateCollectionToEnsureIndexes(collectionsToEnsureIndexes, commitChangeLogs, mainCollectionName, mainCollectionValue);
                        return Utility.getVersion(adminDB, versionInfo).then(function () {
                            if (dbToCommit.db.databaseName === db.db.databaseName) {
                                return updateInChangeLogs(commitChangeLogs, versionInfo.version, dbToCommit, adminDB);
                            } else {
                                return commitData(mainCollectionName, mainCollectionValue, commitChangeLogs, collectionValues, versionInfo.version, db, dbToCommit, adminDB);
                            }
                        })
                    })
                }).then(
                function () {
                    return Self.repopulateReferredFksAndClearAllCache(collectionValues, removeDBCache, "Commit", db, dbToCommit);
                })
        })
}

exports.repopulateReferredFksAndClearAllCache = function (collectionValues, removeDBCache, type, db, dbToCommit) {
    return Utils.iterateArrayWithPromise(collectionValues,
        function (index, collectionValue) {
            return ReferredFks.repopulateReferredFks({collection:collectionValue.value}, (type === "Commit" ? dbToCommit : db)).then(function () {
                return Utility.removeLockAndClearCache(collectionValue.value, "pl.collections", db, (type === "Synch" ? collectionValue.serveDB : dbToCommit));
            })
        }).then(function () {
            if (removeDBCache) {
                return db.invokeFunction("Porting.removeUserCache", [
                    {all:true}
                ]).then(function () {
                        if (dbToCommit) {
                            return dbToCommit.invokeFunction("Porting.removeUserCache", [
                                {all:true}
                            ])
                        }
                    })
            }
        })
}

function populateCollectionToEnsureIndexes(collectionsToEnsureIndexes, changeLogs, collectionName, mainFkValue) {
    if (collectionName === "pl.collections") {
        for (var i = 0; i < changeLogs.length; i++) {
            if (changeLogs[i].collection === "pl.indexes") {
                var ensureCollection = mainFkValue.value;
                if (ensureCollection && collectionsToEnsureIndexes.indexOf(ensureCollection) === -1) {
                    collectionsToEnsureIndexes.push(ensureCollection);
                }
                break;
            }
        }
    } else if (collectionName === "pl.applications") {
        for (var i = 0; i < changeLogs.length; i++) {
            var changeLog = changeLogs[i];
            if (changeLog.type === "update" && changeLog.updatedField && changeLog.updatedField === "collections") {
                var operation = JSON.parse(changeLog.operation);
                var ensureCollection = operation.collection;
                if (ensureCollection && collectionsToEnsureIndexes.indexOf(ensureCollection) === -1) {
                    collectionsToEnsureIndexes.push(ensureCollection);
                }
            }
        }
    }
}

function updateInChangeLogs(changeLogsResult, version, dbToUpdate, adminDB) {
    if (changeLogsResult && changeLogsResult.length > 0) {
        var changeLogUpdates = [];
        for (var i = 0; i < changeLogsResult.length; i++) {
            var updateLog = {};
            addUpdatesInChangeLog(updateLog, "Committed", version, dbToUpdate);
            changeLogUpdates.push({_id:changeLogsResult[i]._id, $set:updateLog});
        }
        return adminDB.update({$collection:"pl.changelogs", $events:false, $modules:{DataTypeModule:1, TransactionModule:1}, $update:changeLogUpdates});
    }
}

function commitData(collectionName, collectionValue, changeLogs, collectionValues, version, db, dbToCommit, adminDB) {
    return Utility.loadCollectionAndCreateLock(collectionValue.value, collectionName, db, dbToCommit).then(
        function () {
            return Self.updateData(changeLogs, "Committed", version, db, dbToCommit);
        }).then(
        function (commitUpdates) {
            if (commitUpdates && commitUpdates.length > 0) {
                return adminDB.update({$collection:"pl.changelogs", $events:false, $modules:{DataTypeModule:1, TransactionModule:1}, $update:commitUpdates});
            }
        }).then(
        function () {
            var deleteFilter = {db:db.db.databaseName, mainCollection:collectionName, "mainFk._id":collectionValue._id};
            return adminDB.update({$collection:"pl.changelogs", $events:false, $modules:{DataTypeModule:1, TransactionModule:1}, $delete:{$query:deleteFilter}});
        }).then(
        function () {
            return Self.removeData(collectionName, collectionValue, db);
        }).then(
        function () {
            if (collectionName === "pl.collections") {
                collectionValues.push({value:collectionValue.value});
            } else {
                return Utility.removeLockAndClearCache(collectionValue.value, collectionName, db, dbToCommit);
            }
        })
}

function addUpdatesInChangeLog(log, status, version, dbToUpdate) {
    log.status = status;
    log.version = version;
    log.db = dbToUpdate.db.databaseName;
    log.updateDate = new Date();
    log.updateUser = {_id:dbToUpdate.user._id, username:dbToUpdate.user.username};
    if (status === "Synched") {
        log.date = log.updateDate;
        log.user = log.updateUser;
    }
}

exports.updateData = function (data, status, version, dbToQuery, dbToUpdate) {
    var changeLogsUpdates = [];
    var updatesQueryArray = [];
    var map = {};
    return Utils.iterateArrayWithPromise(data,
        function (index, record) {
            var type = record.type;
            if (status === "Committed") {
                var updateLog = {};
                addUpdatesInChangeLog(updateLog, status, version, dbToUpdate);
                changeLogsUpdates.push({_id:record._id, $set:updateLog});
            } else if (status === "Synched") {
                var newLog = QueryUtility.getReference(record);
                addUpdatesInChangeLog(newLog, status, version, dbToUpdate);
                delete newLog._id;
                changeLogsUpdates.push(newLog);
            }
            var collection = record.collection;
            var recordId = record.fk._id;
            var operation = record.operation;
            if (operation) {
                operation = JSON.parse(operation);
            }
            var updateQuery = {$collection:collection, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}};
            if (type === "update" && record.arrayUpdates) {
                var newOperation = {_id:recordId};
                Self.populateArrayUpdateOperation(record, operation, newOperation);
                updateQuery.$update = newOperation;
                updatesQueryArray.push(updateQuery);
            } else {
                if (type === "insert") {
                    updateQuery.$insert = operation;
                    updatesQueryArray.push(updateQuery);
                } else if (type === "delete") {
                    updateQuery.$delete = {_id:recordId};
                    updatesQueryArray.push(updateQuery);
                } else if (type === "update") {
                    var updateKey = record.__updateKey;
                    var updateQueryValue = updateKey ? map[updateKey] : undefined;
                    if (updateQueryValue && Utils.deepEqual(updateQueryValue.$update._id, recordId)) {
                        for (var oprKey in operation) {
                            updateQueryValue.$update[oprKey] = updateQueryValue.$update[oprKey] || {};
                            var oprKeyValues = operation[oprKey];
                            for (var keyToUpdate in oprKeyValues) {
                                updateQueryValue.$update[oprKey][keyToUpdate] = oprKeyValues[keyToUpdate];
                            }
                        }
                    } else {
                        operation._id = recordId;
                        updateQuery.$update = operation;
                        updatesQueryArray.push(updateQuery);
                        if (updateKey) {
                            map[updateKey] = updateQuery;
                        }
                    }
                }
            }
        }).then(
        function () {
            map = undefined;
            return dbToUpdate.update(updatesQueryArray);
        }).then(function () {
            return changeLogsUpdates;
        })
}

exports.populateArrayUpdateOperation = function (record, operation, newOperation) {
    var arrayUpdates = record.arrayUpdates;
    var mainUpdatedField = record.updatedField;
    var arrayId = arrayUpdates._id;
    var arrayUpdateType = arrayUpdates.type;
    newOperation.$set = newOperation.$set || {};
    newOperation.$set[mainUpdatedField] = newOperation.$set[mainUpdatedField] || {};
    if (arrayUpdateType === "insert") {
        newOperation.$set[mainUpdatedField].$insert = newOperation.$set[mainUpdatedField].$insert || [];
        newOperation.$set[mainUpdatedField].$insert.push(operation);
    } else if (arrayUpdateType === "update") {
        if (newOperation.$set[mainUpdatedField].$update) {
            var innerUpdates = newOperation.$set[mainUpdatedField].$update;
            var innerUpdateIndex = Utils.isExists(innerUpdates, {_id:arrayId}, "_id");
            if (innerUpdateIndex === undefined) {
                operation._id = arrayId;
                newOperation.$set[mainUpdatedField].$update.push(operation);
            } else {
                var innerUpdate = innerUpdates[innerUpdateIndex];
                for (var key in operation) {
                    innerUpdate[key] = innerUpdate[key] || {};
                    var valueToUpdate = operation[key];
                    for (var k in valueToUpdate) {
                        innerUpdate[key][k] = valueToUpdate[k];
                    }
                }
            }
        } else {
            operation._id = arrayId;
            newOperation.$set[mainUpdatedField].$update = [operation];
        }
    } else if (arrayUpdateType === "delete") {
        newOperation.$set[mainUpdatedField].$delete = newOperation.$set[mainUpdatedField].$delete || [];
        newOperation.$set[mainUpdatedField].$delete.push({_id:arrayId});
    }
}

exports.removeData = function (collectionName, collectionValue, db) {
    var commitCollections = Constants.CommitCollections;
    return Utils.iterateArrayWithPromise(commitCollections, function (index, commitCollection) {
        var commitCollectionName = commitCollection.collection;
        if (collectionName !== commitCollectionName) {
            return;
        }
        return removeRowData(collectionValue._id, collectionName, commitCollection.referredCollections, db);
    })
}

function removeRowData(rowId, collectionName, referredCollections, db) {
    return Utils.iterateArrayWithPromise(referredCollections,
        function (index, referredCollection) {
            var referredCollectionName = referredCollection.collection;
            var referredCollectionFilter = {}
            referredCollectionFilter[referredCollection.filterfield + "._id"] = rowId;
            var deleteReferredQuery = {$collection:referredCollectionName, $delete:{$query:referredCollectionFilter}, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}};
            return db.update(deleteReferredQuery);
        }).then(function () {
            var deleteQuery = {$collection:collectionName, $delete:{$query:{_id:rowId}}, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}};
            return db.update(deleteQuery);
        })
}

