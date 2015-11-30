/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 30/10/14
 * Time: 11:12 AM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("./Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var CacheService = require("ApplaneDB/lib/CacheService.js");
var Utility = require("./triggers/Utility.js");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError.js");
var ReferredFks = require("./triggers/ReferredFks.js");
var Self = require("./Synch.js");
var Commit = require("./Commit.js");

exports.synchDb = function (parameters, db, options) {
    if (!options.processid) {
        throw new BusinessLogicError("Async must be true in Synch Process.");
    }
    return db.query({$collection:"pl.dbs", $filter:{_id:parameters._id}, $fields:{db:1}}).then(
        function (dbResult) {
            var dbName = dbResult.result[0].db;
            return db.connectUnauthorized(dbName);
        }).then(function (connectedDb) {
            return Self.synchProcess({data:parameters}, connectedDb, options);
        })
}

exports.synch = function (parameters, db, options) {
    if (!options.processid) {
        throw new BusinessLogicError("Async must be true in Synch Process.");
    }
    options.txEnabled = false;
    return db.startProcess([parameters], "Synch.synchProcess", options);
}

exports.synchProcess = function (record, db, options) {
    var parameters = record.data || {};
    if (!parameters.synch) {
        throw new BusinessLogicError("Synch must be true.");
    }
    var adminDB = undefined;
    var adminDBName = db.getConfig("Admin").DB;
    return db.txDB(adminDBName).then(
        function (adb) {
            adminDB = adb;
        }).then(
        function () {
            return db.startTransaction();
        }).then(
        function () {
            return Self.handleSynch(parameters, db, adminDB);
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

exports.handleSynch = function (parameters, db, adminDB) {
    parameters = parameters || {};
    var filter = {db:db.db.databaseName, status:"Synched"};
    return Utility.addPropertiesInFilter(parameters, filter, db).then(
        function () {
            var queryToGetCollections = {
                $collection:"pl.changelogs",
                $filter:filter,
                $group:{_id:{mainCollection:"$mainCollection", mainFk:"$mainFk._id"}, version:{$max:"$version"}, mainFk:{$first:"$mainFk"}, mainCollection:{$first:"$mainCollection"}, $sort:{mainCollection:1, "mainFk._id":1}},
                $events:false
            }
            return adminDB.query(queryToGetCollections);
        }).then(function (changeCollectionInfos) {
            changeCollectionInfos = changeCollectionInfos.result;
            if (changeCollectionInfos.length === 0) {
                return;
            }
            var collectionValues = [];
            var versionInfo = {};
            var removeDBCache = false;
            return Utils.iterateArrayWithPromise(changeCollectionInfos,
                function (index, changeCollectionInfo) {
                    var mainCollectionName = changeCollectionInfo.mainCollection;
                    if (mainCollectionName === "pl.roles" || mainCollectionName === "pl.applications") {
                        removeDBCache = true;
                    }
                    var mainCollectionVersion = changeCollectionInfo.version;
                    var mainCollectionValue = changeCollectionInfo.mainFk;
                    return db.getGlobalDB().then(
                        function (globalDB) {
                            if (globalDB) {
                                return Utility.getDBtoServeData(mainCollectionValue._id, mainCollectionName, globalDB);
                            }
                        }).then(
                        function (serveDB) {
                            if (!serveDB) {
                                return;
                            }
                            return db.txDB(serveDB.db.databaseName).then(
                                function (sdb) {
                                    serveDB = sdb;
                                    return db.query({$collection:mainCollectionName, $filter:{_id:mainCollectionValue._id}, $fields:{_id:1, doNotSynch:1}});
                                }).then(
                                function (result) {
                                    var record = result.result[0];
                                    if (record.doNotSynch) {
                                        return;
                                    }
                                    return synchCollectionWise(mainCollectionName, mainCollectionValue, mainCollectionVersion, versionInfo, collectionValues, db, serveDB, adminDB);
                                })
                        })
                }).then(
                function () {
                    return Commit.repopulateReferredFksAndClearAllCache(collectionValues, removeDBCache,"Synch", db);
                })
        })
}

function synchCollectionWise(collectionName, collectionValue, collectionVersion, versionInfo, collectionValues, db, serveDB, adminDB) {
    return Utility.loadCollectionAndCreateLock(collectionValue.value, collectionName, db, serveDB).then(
        function () {
            return getSynchUpdates(collectionName, collectionValue, collectionVersion, versionInfo, serveDB, db, adminDB);
        }).then(
        function (synchUpdates) {
            if (synchUpdates) {
                return adminDB.update({$collection:"pl.changelogs", $events:false, $modules:{DataTypeModule:1, TransactionModule:1}, $insert:synchUpdates});
            }
        }).then(
        function () {
            if (collectionName === "pl.collections") {
                collectionValues.push({value:collectionValue.value, serveDB:serveDB});
            } else {
                return Utility.removeLockAndClearCache(collectionValue.value, collectionName, db, serveDB);
            }
        })
}

function getSynchUpdates(collectionName, collectionValue, collectionVersion, versionInfo, serveDB, db, adminDB) {
    var dataToSynchQuery = {$collection:"pl.changelogs", $filter:{db:serveDB.db.databaseName, mainCollection:collectionName, "mainFk._id":collectionValue._id, type:{$exists:true}, version:{$gt:collectionVersion}}, $events:false, $sort:{_id:1}};
    return adminDB.query(dataToSynchQuery).then(
        function (dataToSync) {
            dataToSync = dataToSync.result;
            if (dataToSync.length === 0) {
                return;
            }
            return Utility.getVersion(adminDB, versionInfo).then(
                function () {
                    var dataToMatchQuery = {$collection:"pl.changelogs", $filter:{db:db.db.databaseName, mainCollection:collectionName, "mainFk._id":collectionValue._id, type:{$exists:true}, status:{$in:["Committed", "Non Committed"]}}, $events:false, $sort:{_id:1}};
                    return adminDB.query(dataToMatchQuery);
                }).then(
                function (dataToMatch) {
                    dataToMatch = dataToMatch.result;
                    Self.populateDataToUpdate(dataToSync, dataToMatch);
                }).then(
                function () {
                    return Commit.updateData(dataToSync, "Synched", versionInfo.version, serveDB, db);
                }).then(
                function (synchUpdates) {
                    if (!synchUpdates || synchUpdates.length === 0) {
                        synchUpdates = [
                            {
                                db:db.db.databaseName,
                                user:{_id:db.user._id, username:db.user.username},
                                date:new Date(),
                                status:"Synched",
                                version:versionInfo.version,
                                mainCollection:collectionName,
                                mainFk:collectionValue
                            }
                        ]
                    }
                    return synchUpdates;
                })
        })
}

exports.populateDataToUpdate = function (dataToSync, dataToMatch) {
    if (!dataToSync || dataToSync.length === 0 || !dataToMatch || dataToMatch.length === 0) {
        return;
    }
    for (var i = 0; i < dataToSync.length; i++) {
        var record = dataToSync[i];
        var recordId = record.fk._id;
        var recordCollection = record.collection;
        var recordType = record.type;
        if (recordType === "update" || recordType === "delete") {
            var isUpdate = false;
            for (var j = 0; j < dataToMatch.length; j++) {
                var row = dataToMatch[j];
                var matchRecordCollection = row.collection;
                var matchRecordId = row.fk._id;
                if (recordCollection === matchRecordCollection && Utils.deepEqual(recordId, matchRecordId)) {
                    if (row.type === "delete") {
                        isUpdate = true;
                    } else if (recordType === "update" && row.type === recordType && row.updatedField === record.updatedField) {
                        if (record.arrayUpdates && row.arrayUpdates) {
                            var recordArrayUpdates = record.arrayUpdates;
                            var rowArrayUpdates = row.arrayUpdates;
                            var recordArrayUpdateType = recordArrayUpdates.type;
                            var rowArrayUpdateType = rowArrayUpdates.type;
                            if (Utils.deepEqual(recordArrayUpdates._id, rowArrayUpdates._id)) {
                                if (rowArrayUpdateType === "delete") {
                                    isUpdate = true;
                                } else if (recordArrayUpdateType === "update" && rowArrayUpdateType === recordArrayUpdateType && recordArrayUpdates.field === rowArrayUpdates.field) {
                                    isUpdate = true;
                                }
                            }
                        } else {
                            isUpdate = true;
                        }
                    }
                    if (isUpdate) {
                        break;
                    }
                }
            }
            if (isUpdate) {
                dataToSync.splice(i, 1);
                i = i - 1
            }
        }
    }
}

/***
 * Used to port change logs for commit and synch work.
 * @param db
 */

exports.portChangeLogs = function (db) {
    var adminDB = undefined;
    var version = undefined;
    db.getAdminDB().then(
        function (adb) {
            adminDB = adb;
        }).then(
        function () {
            return adminDB.update({$collection:"pl.versions", $insert:{date:new Date()}, $events:false, $modules:{SequenceModule:1, TransactionModule:1}});
        }).then(
        function (versionResult) {
            version = versionResult["pl.versions"].$insert[0].version;
            version = parseInt(version);
        }).then(
        function () {
            return adminDB.query({$collection:"pl.dbs", $fields:{db:1}, $events:false, $sort:{db:1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbInfo) {
                var dbName = dbInfo.db;
                var dbToConnect = undefined;
                var changeLogUpdates = [];
                var recordUpdates = [];
                return db.connectUnauthorized(dbName).then(
                    function (dtc) {
                        dbToConnect = dtc;
                    }).then(
                    function () {
                        var commitCollections = Constants.CommitCollections;
                        return Utils.iterateArrayWithPromise(commitCollections, function (index, commitCollection) {
                            var mainCollectionName = commitCollection.collection;
                            return dbToConnect.query({$collection:mainCollectionName, $events:false}).then(function (mainCollectionResult) {
                                mainCollectionResult = mainCollectionResult.result;
                                if (mainCollectionResult.length === 0) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(mainCollectionResult, function (index, mainCollectionRow) {
                                    var update = {
                                        db:dbToConnect.db.databaseName,
                                        user:{_id:dbToConnect.user._id, username:dbToConnect.user.username},
                                        date:new Date(),
                                        version:version,
                                        collection:mainCollectionName,
                                        fk:{_id:mainCollectionRow._id, value:Utility.getValue(mainCollectionRow, mainCollectionName)},
                                        mainCollection:mainCollectionName,
                                        mainFk:{_id:mainCollectionRow._id, value:Utility.getValue(mainCollectionRow, mainCollectionName)},
                                        copy:true,
                                        porting:true
                                    };
                                    var serveDB = undefined;
                                    return dbToConnect.getGlobalDB().then(
                                        function (globalDB) {
                                            if (globalDB) {
                                                return Utility.getDBtoServeData(mainCollectionRow._id, mainCollectionName, globalDB);
                                            }
                                        }).then(
                                        function (sdb) {
                                            serveDB = sdb;
                                        }).then(
                                        function () {
                                            if (serveDB) {
                                                return serveDB.query({$collection:mainCollectionName, $filter:{_id:mainCollectionRow._id}, $events:false}).then(function (result) {
                                                    var globalData = result.result[0];
                                                    delete mainCollectionRow.__txs__;
                                                    delete mainCollectionRow.__history;
                                                    delete mainCollectionRow.lastmodifiedtime;
                                                    delete globalData.__txs__;
                                                    delete globalData.__history;
                                                    delete globalData.lastmodifiedtime;
                                                    if (!commitCollection.referredCollections && Utils.deepEqual(mainCollectionRow, globalData)) {
                                                        recordUpdates.push({$collection:mainCollectionName, $delete:{_id:mainCollectionRow._id}, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}});
                                                    } else {
                                                        update.status = "Synched";
                                                        update.doNotSynch = true;
                                                        recordUpdates.push({$collection:mainCollectionName, $update:{_id:mainCollectionRow._id, $set:{doNotSynch:true}}, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}});
                                                        changeLogUpdates.push(update);
                                                    }
                                                })
                                            } else {
                                                update.status = "Committed";
                                                changeLogUpdates.push(update);
                                            }
                                        })
                                })
                            })
                        })
                    }).then(
                    function () {
                        if (recordUpdates.length > 0) {
                            return dbToConnect.update(recordUpdates);
                        }
                    }).then(
                    function () {
                        if (changeLogUpdates.length > 0) {
                            return adminDB.update({$collection:"pl.changelogs", $insert:changeLogUpdates, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}});
                        }
                    }).then(function () {
                        dbToConnect.clean();
                        dbToConnect = undefined;
                    })
            })
        })
}

exports.checkSynchAllowed = function (db, adminDB) {
    return db.getGlobalDB().then(function (globalDb) {
        if (!globalDb) {
            return;
        }
        return adminDB.query({$collection:"pl.dbs", $fields:{_id:1}, $filter:{db:globalDb.db.databaseName, doNotSynch:true}}).then(
            function (result) {
                if (result.result.length > 0) {
                    throw new BusinessLogicError("Synch not allowed as synch is not allowed in globaldb [" + globalDb.db.databaseName + "]");
                }
                return Self.checkSynchAllowed(globalDb, adminDB);
            })
    })
}

exports.manualSynch = function (params, adminDB) {
    if (!params.manualsynch) {
        throw new BusinessLogicError("manualsynch must be true.");
    }
    var changeLogInfos = undefined;
    var db = undefined;
    return adminDB.query({$collection:"pl.changelogs", $filter:{_id:params._id}}).then(
        function (result) {
            changeLogInfos = result.result[0];
            if (!changeLogInfos) {
                throw new Error("Record not found for change logs having id [" + params._id + "].Kindly reload view again.");
            }
        }).then(
        function () {
            return adminDB.txDB(changeLogInfos.db);
        }).then(
        function (dtc) {
            db = dtc;
        }).then(
        function () {
            return adminDB.query({$collection:"portingsynchchanges", $filter:{db:changeLogInfos.db, mainCollection:changeLogInfos.mainCollection, "mainFk._id":changeLogInfos.mainFk._id}, $sort:{_id:1}});
        }).then(
        function (result) {
            result = result.result;
            if (result.length === 0) {
                throw new Error("Kindly populate Synch changes before Synch.");
            }
            if (result.length === 1 && result[0].type === "No Change Found") {
                return adminDB.update({$collection:"pl.changelogs", $delete:{$query:{db:db.db.databaseName, mainCollection:changeLogInfos.mainCollection, "mainFk._id":changeLogInfos.mainFk._id}}, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}}).then(function () {
                    return Commit.removeData(changeLogInfos.mainCollection, changeLogInfos.mainFk, db);
                })
            }
//            console.log("result>>>>>>>>" + JSON.stringify(result));
            return Utils.iterateArrayWithPromise(result,
                function (index, row) {
                    var recordType = row.recordType;
                    if (!recordType) {
                        throw new Error("Record type not found for change log [" + JSON.stringify(changeLogInfos) + "]");
                    }
                    if (!row.type || row.type === "delete") {
                        throw new Error("Synch Change type must be insert/update.");
                    }
                    delete row._id;
                    delete row.recordType;
                    delete row.serveDBName;
                    if (recordType === "globalInsert") {
                        var operation = JSON.parse(row.operation);
                        var updateQuery = {$collection:row.collection, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}};
                        if (row.type === "insert") {
                            updateQuery.$insert = operation;
                        } else if (row.type === "update") {
                            var update = {_id:row.fk._id, $set:{}};
                            var updatedField = row.updatedField;
                            var arrayUpdates = row.arrayUpdates;
                            if (!updatedField) {
                                throw new Error("Updated Field not found for record [" + JSON.stringify(row) + "]");
                            }
                            if (!arrayUpdates) {
                                throw new Error("Array Updates not found for record [" + JSON.stringify(row) + "]");
                            }
                            if (arrayUpdates.type !== "insert") {
                                throw new Error("Array update type must be insert in case of globalInsert for record [" + JSON.stringify(row) + "]");
                            }
                            update.$set[updatedField] = {$insert:[operation]};
                            updateQuery.$update = update;
                        }
//                        console.log("updateQuery for global Insert>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(updateQuery));
                        return db.update(updateQuery);
                    } else if (recordType === "localUpdate") {
                        var updateQuery = {$collection:"pl.changelogs", $insert:row, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}};
//                        console.log("updateQuery for localUpdate>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(updateQuery));
                        return adminDB.update(updateQuery);
                    } else if (recordType === "localInsert") {
                        //do Nothing.
                    }
                }).then(
                function () {
                    var versionQuery = {$collection:"pl.changelogs", $filter:{mainCollection:changeLogInfos.mainCollection, "mainFk._id":changeLogInfos.mainFk._id, version:{$exists:true}}, $group:{_id:null, version:{$max:"$version"}}, $events:false};
                    return adminDB.query(versionQuery);
                }).then(
                function (versionResult) {
                    if (versionResult.result.length === 0) {
                        throw new Error("Version not found in changeLogs for collection [" + changeLogInfos.mainCollection + "] with value [" + changeLogInfos.mainFk.value + "]");
                    }
                    var update = {$collection:"pl.changelogs", $update:{_id:changeLogInfos._id, $set:{version:versionResult.result[0].version}, $unset:{doNotSynch:""}}, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}};
                    return adminDB.update(update);
                }).then(
                function () {
                    return db.update({$collection:changeLogInfos.mainCollection, $update:{_id:changeLogInfos.fk._id, $unset:{doNotSynch:""}}, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}});
                }).then(
                function () {
                    if (changeLogInfos.mainCollection === "pl.collections") {
                        return ReferredFks.repopulateReferredFks({collection:changeLogInfos.mainFk.value}, db);
                    }
                }).then(
                function () {
                    if (changeLogInfos.mainCollection === "pl.collections") {
                        return CacheService.clearCache(changeLogInfos.mainFk.value, db);
                    }
                }).then(
                function () {
                    if (changeLogInfos.mainCollection === "pl.functions") {
                        return CacheService.clearFunctionCache(changeLogInfos.mainFk.value, db);
                    }
                })
        }).then(
        function () {
//            return adminDB.update({$collection:"portingsynchchanges", $delete:{$query:{db:changeLogInfos.db, mainCollection:changeLogInfos.mainCollection, "mainFk._id":changeLogInfos.mainFk._id}}, $events:false, $modules:{TransactionModule:1}});
        })
}

exports.removeMatchedChangesAndRepopulate = function (params, adminDB) {
    if (!params.removematched) {
        throw new BusinessLogicError("Remove Matched must be true.");
    }
    var changeLogInfos = undefined;
    var db = undefined;
    var localMatchedInsert = [];
    var globalMatchedInsert = [];
    var finalUpdates = [];
    return adminDB.query({$collection:"pl.changelogs", $filter:{_id:params._id}}).then(
        function (result) {
            changeLogInfos = result.result[0];
        }).then(
        function () {
            return adminDB.txDB(changeLogInfos.db);
        }).then(
        function (dtc) {
            db = dtc;
        }).then(
        function () {
            return adminDB.query({$collection:"portingsynchchanges", $filter:{db:changeLogInfos.db, mainCollection:changeLogInfos.mainCollection, "mainFk._id":changeLogInfos.mainFk._id, recordType:"localInsert", "match":true}, $sort:{matchIndex:1}});
        }).then(
        function (result) {
            localMatchedInsert = result.result;
            if (localMatchedInsert.length === 0) {
                throw new Error("No Local Matched Record found to Remove.");
            }
            return adminDB.update({$collection:"portingmatchedsynchchanges", $insert:localMatchedInsert, $events:false, $modules:{TransactionModule:1}});
        }).then(
        function () {
            return adminDB.query({$collection:"portingsynchchanges", $filter:{db:changeLogInfos.db, mainCollection:changeLogInfos.mainCollection, "mainFk._id":changeLogInfos.mainFk._id, recordType:"globalInsert", "match":true}, $sort:{matchIndex:1}});
        }).then(
        function (result) {
            globalMatchedInsert = result.result;
            if (globalMatchedInsert.length === 0) {
                throw new Error("No Global Matched Record found to Remove.");
            }
            return adminDB.update({$collection:"portingmatchedsynchchanges", $insert:globalMatchedInsert, $events:false, $modules:{TransactionModule:1}});
        }).then(
        function () {
            return Utils.iterateArrayWithPromise(globalMatchedInsert, function (index, globalRecord) {
                var globalMatchIndex = globalRecord.matchIndex;
                var localRecord = undefined;
                for (var i = 0; i < localMatchedInsert.length; i++) {
                    if (localMatchedInsert[i].matchIndex === globalMatchIndex) {
                        localRecord = localMatchedInsert[i];
                        localMatchedInsert.splice(i, 1);
                        break;
                    }
                }
                var globalValue = undefined;
                var localValue = undefined;
                var serveDBName = globalRecord.serveDBName;
                return adminDB.txDB(serveDBName).then(
                    function (serveDB) {
                        return serveDB.query({$collection:globalRecord.collection, $filter:{_id:globalRecord.fk._id}, $events:false, $modules:{TransactionModule:1}});
                    }).then(
                    function (gResult) {
                        globalValue = gResult.result[0];
                        if (!globalValue) {
                            throw new Error("Result not found for global data...");
                        }
                    }).then(
                    function () {
                        return db.query({$collection:localRecord.collection, $filter:{_id:localRecord.fk._id}, $events:false, $modules:{TransactionModule:1}});
                    }).then(
                    function (lResult) {
                        localValue = lResult.result[0];
                        if (!localValue) {
                            throw new Error("Result not found for localData...");
                        }
                    }).then(
                    function () {
                        return db.update({$collection:localRecord.collection, $delete:{_id:localValue._id}, $events:false, $modules:{TransactionModule:1}});
                    }).then(
                    function () {
                        if (localRecord.collection === "pl.fields") {
                            if (globalValue.parentfieldid) {
                                localValue.parentfieldid = globalValue.parentfieldid;
                            } else {
                                delete localValue.parentfieldid;
                            }
                            finalUpdates.push({$collection:localRecord.collection, $update:{$query:{"parentfieldid._id":localValue._id}, $set:{"parentfieldid._id":globalValue._id}}})
                        } else if (localRecord.collection === "pl.menus") {
                            finalUpdates.push({$collection:localRecord.collection, $update:{$query:{"parentmenu._id":localValue._id}, $set:{"parentmenu._id":globalValue._id}}})
                        }
                        localValue._id = globalValue._id;
                        return db.update({$collection:localRecord.collection, $insert:localValue, $events:false, $modules:{TransactionModule:1}});
                    })
            })
        }).then(
        function () {
            return Utils.iterateArrayWithPromise(finalUpdates, function (index, update) {
                return db.mongoUpdate(update, {multi:true});
            })
        }).then(function () {
            return Self.populateSynchChanges({populatechanges:true, _id:params._id}, adminDB);
        })
}

exports.populateSynchChanges = function (params, adminDB) {
    if (!params.populatechanges) {
        throw new BusinessLogicError("Populate Changes must be true.");
    }
    var changeLogInfos = undefined;
    var commitCollections = Constants.CommitCollections;
    var db = undefined;
    var synchChanges = [];
    return adminDB.query({$collection:"pl.changelogs", $filter:{_id:params._id}}).then(
        function (result) {
            changeLogInfos = result.result[0];
        }).then(
        function () {
            return adminDB.txDB(changeLogInfos.db);
        }).then(
        function (dtc) {
            db = dtc;
        }).then(
        function () {
//            return require("./Synch.js").checkSynchAllowed(db, adminDB);
        }).then(
        function () {
            return Utils.iterateArrayWithPromise(commitCollections, function (index, commitCollection) {
                var mainCollectionName = commitCollection.collection;
                if (changeLogInfos.mainCollection !== mainCollectionName) {
                    return;
                }
                var query = {$collection:mainCollectionName, $events:false, $filter:{_id:changeLogInfos.mainFk._id}};
                return db.query(query).then(function (mainCollectionResult) {
                    var mainRecord = mainCollectionResult.result[0];
                    if (!mainRecord) {
                        return;
                    }
                    var serveDB = undefined;
                    return db.getGlobalDB().then(
                        function (globalDB) {
                            if (globalDB) {
                                return Utility.getDBtoServeData(mainRecord._id, mainCollectionName, globalDB);
                            }
                        }).then(
                        function (sdb) {
                            serveDB = sdb;
                            if (!serveDB || serveDB.db.databaseName === db.db.databaseName) {
                                return;
                            }
                            var globalData = undefined;
                            return serveDB.query({$collection:mainCollectionName, $events:false, $filter:{_id:mainRecord._id}})
                                .then(function (serveDBResult) {
                                    globalData = serveDBResult.result[0];
                                    delete mainRecord.doNotSynch;
                                    if (mainCollectionName === "pl.collections") {
                                        delete mainRecord.fields;
                                        delete mainRecord.actions;
                                        delete mainRecord.formgroups;
                                        delete mainRecord.indexes;
                                        delete mainRecord.qviews;
                                        delete mainRecord.events;
                                        delete mainRecord.workflowevents;
                                        delete globalData.fields;
                                        delete globalData.actions;
                                        delete globalData.formgroups;
                                        delete globalData.indexes;
                                        delete globalData.qviews;
                                        delete globalData.events;
                                        delete globalData.workflowevents;
                                    }
                                    var update = populateRow(mainRecord, globalData);
                                    if (!update) {
                                        return;
                                    }
                                    var fkValue = {_id:mainRecord._id, value:Utility.getValue(mainRecord, mainCollectionName)};
                                    var newChangeLogs = populateUpdateChangeLogs(update, fkValue, false);
                                    for (var i = 0; i < newChangeLogs.length; i++) {
                                        var newChangeLog = newChangeLogs[i];
                                        newChangeLog.db = db.db.databaseName;
                                        newChangeLog.user = {_id:db.user._id, username:db.user.username};
                                        newChangeLog.date = new Date();
                                        newChangeLog.updateDate = newChangeLog.date;
                                        newChangeLog.updateUser = newChangeLog.user;
                                        newChangeLog.status = "Committed";
                                        newChangeLog.version = 1;
                                        newChangeLog.collection = mainCollectionName;
                                        newChangeLog.mainCollection = mainCollectionName;
                                        newChangeLog.mainFk = fkValue;
                                        newChangeLog.serveDBName = serveDB.db.databaseName;
                                    }
                                    synchChanges.push.apply(synchChanges, newChangeLogs);
                                })
                                .then(function () {
                                    if (commitCollection.referredCollections) {
                                        var referredCollections = commitCollection.referredCollections;
                                        return Utils.iterateArrayWithPromise(referredCollections, function (index, referredCollection) {
                                            var referredCollectionName = referredCollection.collection;
                                            if (referredCollectionName === "pl.referredfks") {
                                                return;
                                            }
                                            var referredCollectionFilter = {};
                                            referredCollectionFilter[referredCollection.filterfield + "._id"] = mainRecord._id;
                                            var localReferredData = undefined;
                                            var globalReferredData = undefined;
                                            return db.query({$collection:referredCollectionName, $filter:referredCollectionFilter, $events:false}).then(
                                                function (result) {
                                                    localReferredData = result.result;
                                                    return serveDB.query({$collection:referredCollectionName, $filter:referredCollectionFilter, $events:false});
                                                }).then(
                                                function (result) {
                                                    globalReferredData = result.result;
                                                }).then(function () {
                                                    var arrayUpdates = getArrayUpdates(localReferredData, globalReferredData);
                                                    var newChangeLogs = [];
                                                    if (arrayUpdates.globalInsert && arrayUpdates.globalInsert.length > 0) {
                                                        for (var i = 0; i < arrayUpdates.globalInsert.length; i++) {
                                                            var insertRow = arrayUpdates.globalInsert[i];
                                                            var newChangeLog = {recordType:"globalInsert", type:"insert", operation:JSON.stringify(insertRow), fk:{_id:insertRow._id, value:getValue(insertRow, referredCollectionName)}};
                                                            newChangeLogs.push(newChangeLog);
                                                        }
                                                    }
                                                    if (arrayUpdates.localInsert && arrayUpdates.localInsert.length > 0) {
                                                        for (var i = 0; i < arrayUpdates.localInsert.length; i++) {
                                                            var insertRow = arrayUpdates.localInsert[i];
                                                            var newChangeLog = {recordType:"localInsert", type:"insert", operation:JSON.stringify(insertRow), fk:{_id:insertRow._id, value:getValue(insertRow, referredCollectionName)}};
                                                            newChangeLogs.push(newChangeLog);
                                                        }
                                                    }
                                                    if (arrayUpdates.localUpdate && arrayUpdates.localUpdate.length > 0) {
                                                        for (var i = 0; i < arrayUpdates.localUpdate.length; i++) {
                                                            var updateRow = arrayUpdates.localUpdate[i];
                                                            var fkValue = {_id:updateRow._id, value:getValue(updateRow, referredCollectionName)};
                                                            var updateChangeLogs = populateUpdateChangeLogs(updateRow, fkValue, false);
                                                            newChangeLogs.push.apply(newChangeLogs, updateChangeLogs);
                                                        }
                                                    }
                                                    for (var i = 0; i < newChangeLogs.length; i++) {
                                                        var newChangeLog = newChangeLogs[i];
                                                        newChangeLog.db = db.db.databaseName;
                                                        newChangeLog.user = {_id:db.user._id, username:db.user.username};
                                                        newChangeLog.date = new Date();
                                                        newChangeLog.updateDate = newChangeLog.date;
                                                        newChangeLog.updateUser = newChangeLog.user;
                                                        newChangeLog.status = "Committed";
                                                        newChangeLog.version = 1;
                                                        newChangeLog.collection = referredCollectionName;
                                                        newChangeLog.mainCollection = mainCollectionName;
                                                        newChangeLog.mainFk = {_id:mainRecord._id, value:Utility.getValue(mainRecord, mainCollectionName)};
                                                        newChangeLog.serveDBName = serveDB.db.databaseName;
                                                    }
                                                    synchChanges.push.apply(synchChanges, newChangeLogs);
                                                })
                                        })
                                    }
                                })
                        })
                })
            })
        }).then(
        function () {
            return adminDB.update({$collection:"portingsynchchanges", $delete:{$query:{db:changeLogInfos.db, mainCollection:changeLogInfos.mainCollection, "mainFk._id":changeLogInfos.mainFk._id}}, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}});
        }).then(function () {
            if (synchChanges.length === 0) {
                synchChanges.push({db:changeLogInfos.db, mainCollection:changeLogInfos.mainCollection, "mainFk":changeLogInfos.mainFk, type:"No Change Found"});
            } else {
                populateMatchInInsert(synchChanges);
            }
//            console.log("changeLogUpdates>>>>>>>>>>>>>>>>>>>" + JSON.stringify(synchChanges));
            return adminDB.update({$collection:"portingsynchchanges", $insert:synchChanges, $events:false, $modules:{DataTypeModule:1, TransactionModule:1}});
        })
}

exports.portQviewsInMenus = function (params, originalDb) {
    var dbName = params.db;
    if (!dbName) {
        throw new Error("Please provide value of mandatory parameter [db]");
    }
    var localMenus = [];
    var db = undefined;
    return originalDb.txDB(dbName).then(
        function (connectedDb) {
            db = connectedDb;
            return db.query({$collection:"pl.menus", $events:false, $modules:false});
        }).then(
        function (result) {
            localMenus = result.result;
        }).then(
        function () {
            return Utils.iterateArrayWithPromise(localMenus, function (index, localMenu) {
                var localMenuQviews = localMenu.qviews;
                if (!localMenuQviews || localMenuQviews.length === 0) {
                    return;
                }

                return db.getGlobalDB().then(
                    function (globalDB) {
                        if (globalDB) {
                            return Utility.getDBtoServeData(localMenu.application._id, "pl.applications", globalDB);
                        }
                    }).then(
                    function (serveDB) {
                        if (serveDB) {
                            return serveDB.query({$collection:"pl.menus", $filter:{_id:localMenu._id}, $events:false, $modules:false}).then(function (result) {
                                if (result.result.length > 0) {
                                    return result;
                                }
                                return serveDB.query({$collection:"pl.menus", $filter:{"application._id":localMenu.application._id, collection:localMenu.collection, label:localMenu.label}, $events:false, $modules:false});
                            })
                        }
                    }).then(function (result) {
                        var globalMenu = result ? result.result[0] : undefined;
                        if (!globalMenu) {
                            return;
                        }
                        var globalMenuQviews = globalMenu.qviews;
                        if (!globalMenuQviews || globalMenuQviews.length === 0) {
                            return;
                        }
                        var updates = [];
                        for (var i = 0; i < localMenuQviews.length; i++) {
                            var localMenuQview = localMenuQviews[i];
                            for (var j = 0; j < globalMenuQviews.length; j++) {
                                var globalMenuQview = globalMenuQviews[j];
                                if (localMenuQview.id === globalMenuQview.id && localMenuQview.collection === globalMenuQview.collection) {
                                    var update = {$query:{_id:localMenu._id}, $set:{}};
                                    update.$set["qviews." + i + "._id"] = globalMenuQview._id;
                                    updates.push(update);
                                    break;
                                }
                            }
                        }
                        return Utils.iterateArrayWithPromise(updates, function (index, upd) {
                            return db.mongoUpdate({$collection:"pl.menus", $update:upd});
                        })
                    })
            })
        })
}

exports.portQFieldsInQviews = function (params, originalDb) {
    var dbName = params.db;
    if (!dbName) {
        throw new Error("Please provide value of mandatory parameter [db]");
    }
    var localQviews = [];
    var db = undefined;
    return originalDb.txDB(dbName).then(
        function (connectedDb) {
            db = connectedDb;
            return db.query({$collection:"pl.qviews", $filter:{doNotSynch:true}, $events:false, $modules:false});
        }).then(
        function (result) {
            localQviews = result.result;
        }).then(
        function () {
            return Utils.iterateArrayWithPromise(localQviews, function (index, localQview) {
                var localQviewQFields = localQview.qFields;
                if (!localQviewQFields || localQviewQFields.length === 0) {
                    return;
                }

                return db.getGlobalDB().then(
                    function (globalDB) {
                        if (globalDB) {
                            return Utility.getDBtoServeData(localQview._id, "pl.qviews", globalDB);
                        }
                    }).then(
                    function (serveDB) {
                        if (serveDB) {
                            return serveDB.query({$collection:"pl.qviews", $filter:{_id:localQview._id}, $events:false, $modules:false});
                        }
                    }).then(function (result) {
                        var globalQview = result ? result.result[0] : undefined;
                        if (!globalQview) {
                            return;
                        }
                        var gobalQviewFields = globalQview.qFields;
                        if (!gobalQviewFields || gobalQviewFields.length === 0) {
                            return;
                        }
                        var updates = [];
                        for (var i = 0; i < localQviewQFields.length; i++) {
                            var localQviewQField = localQviewQFields[i];
                            for (var j = 0; j < gobalQviewFields.length; j++) {
                                var gobalQviewField = gobalQviewFields[j];
                                if (localQviewQField.qfield && gobalQviewField.qfield && Utils.deepEqual(localQviewQField.qfield._id, gobalQviewField.qfield._id)) {
                                    var update = {$query:{_id:localQview._id}, $set:{}};
                                    update.$set["qFields." + i + "._id"] = gobalQviewField._id;
                                    updates.push(update);
                                    break;
                                }
                            }
                        }
                        return Utils.iterateArrayWithPromise(updates, function (index, upd) {
                            return db.mongoUpdate({$collection:"pl.qviews", $update:upd});
                        })
                    })
            })
        })
}

function populateMatchInInsert(synchChanges) {
    var localInserts = [];
    var globalInserts = [];
    var fieldSynchChanges = [];
    for (var i = 0; i < synchChanges.length; i++) {
        var synchChange = synchChanges[i];
        if (!synchChange.arrayUpdates && (synchChange.collection === "pl.fields" || synchChange.collection === "pl.events" || synchChange.collection === "pl.actions" || synchChange.collection === "pl.menus")) {
            if (synchChange.recordType === "localInsert") {
                var operation = JSON.parse(synchChange.operation);
                operation.fkId = synchChange.fk._id;
                operation.collectionName = synchChange.collection;
                localInserts.push(operation);
                fieldSynchChanges.push(synchChange);
            } else if (synchChange.recordType === "globalInsert") {
                var operation = JSON.parse(synchChange.operation);
                operation.fkId = synchChange.fk._id;
                operation.collectionName = synchChange.collection;
                globalInserts.push(operation);
                fieldSynchChanges.push(synchChange);
            }
        }
    }
    populateMatchFields(fieldSynchChanges, globalInserts, localInserts);
}

function populateMatchFields(fieldSynchChanges, globalFields, localFields) {
    var indexToMatch = 0;
    for (var i = 0; i < globalFields.length; i++) {
        var globalField = globalFields[i];
        var lField = undefined;
        if (globalField.collectionName === "pl.fields") {
            lField = getMatchLocalField(globalField, globalFields, localFields);
        } else if (globalField.collectionName === "pl.events") {
            lField = getMatchLocalEvent(globalField, localFields);
        } else if (globalField.collectionName === "pl.actions") {
            lField = getMatchLocalAction(globalField, localFields);
        } else if (globalField.collectionName === "pl.menus") {
            lField = getMatchLocalMenu(globalField, localFields);
        }
        if (lField) {
            indexToMatch = indexToMatch + 1;
            var globalId = globalField.fkId;
            var localId = lField.fkId;
            for (var j = 0; j < fieldSynchChanges.length; j++) {
                var fieldSynchChange = fieldSynchChanges[j];
                if (Utils.deepEqual(fieldSynchChange.fk._id, globalId)) {
                    fieldSynchChange.match = true;
                    fieldSynchChange.matchIndex = indexToMatch;
                }
            }
            for (var j = 0; j < fieldSynchChanges.length; j++) {
                var fieldSynchChange = fieldSynchChanges[j];
                if (Utils.deepEqual(fieldSynchChange.fk._id, localId)) {
                    fieldSynchChange.match = true;
                    fieldSynchChange.matchIndex = indexToMatch;
                }
            }
        }
    }
}

function getMatchLocalField(gfield, globalFields, localFields) {
    var errorFound = undefined;
    for (var i = 0; i < localFields.length; i++) {
        var lfield = localFields[i];
        if (lfield.collectionName === "pl.fields" && lfield.field === gfield.field) {
            var lfieldParent = lfield.parentfieldid;
            var gfieldParent = gfield.parentfieldid;
            if (Utils.deepEqual(lfieldParent, gfieldParent)) {
                return lfield;
            } else if (lfieldParent !== undefined && gfieldParent !== undefined && lfieldParent.field === gfieldParent.field) {
                var lfieldParentFieldIndex = Utils.isExists(localFields, lfieldParent, "_id");
                var lfieldParentField = undefined;
                if (lfieldParentFieldIndex !== undefined) {
                    lfieldParentField = localFields[lfieldParentFieldIndex];
                }
                var gfieldParentFieldIndex = Utils.isExists(globalFields, gfieldParent, "_id");
                var gfieldParentField = undefined;
                if (gfieldParentFieldIndex !== undefined) {
                    gfieldParentField = globalFields[gfieldParentFieldIndex];
                }
                if (lfieldParentField && gfieldParentField) {
                    var match = isFieldMatch(lfieldParentField, gfieldParentField, localFields, globalFields);
                    if (match) {
                        return lfield;
                    }
                } else if (!lfieldParentField && !gfieldParentField) {
                    errorFound = gfield;
                }
            }
        }
    }
    if (errorFound) {
        throw new Error("Result not found for global field [" + JSON.stringify(errorFound) + "]");
    }
}

function getMatchLocalEvent(gfield, localFields) {
    for (var i = 0; i < localFields.length; i++) {
        var lfield = localFields[i];
        if (lfield.collectionName === "pl.events") {
            if (Utils.deepEqual(gfield.event, lfield.event) && Utils.deepEqual(gfield.function, lfield.function) && Utils.deepEqual(gfield.pre, lfield.pre) && Utils.deepEqual(gfield.post, lfield.post)) {
                return lfield;
            }
        }
    }
}

function getMatchLocalMenu(gfield, localFields) {
    var qFieldClone = Utils.deepClone(gfield);
    for (var i = 0; i < localFields.length; i++) {
        var lfield = localFields[i];
        if (lfield.collectionName === "pl.menus") {
            var lfieldClone = Utils.deepClone(lfield);
            delete qFieldClone._id;
            delete qFieldClone.fkId;
            delete qFieldClone.__txs__;
            delete qFieldClone.index;
            delete qFieldClone.qviews;
            delete qFieldClone.label;
            delete qFieldClone.lastmodifiedtime;
            delete lfieldClone.lastmodifiedtime;
            delete lfieldClone._id;
            delete lfieldClone.fkId;
            delete lfieldClone.__txs__;
            delete lfieldClone.qviews;
            delete lfieldClone.index;
            delete lfieldClone.label;
            if (Utils.deepEqual(qFieldClone, lfieldClone)) {
                return lfield;
            }
        }
    }
}

function getMatchLocalAction(gfield, localFields) {
    var qFieldClone = Utils.deepClone(gfield);
    for (var i = 0; i < localFields.length; i++) {
        var lfield = localFields[i];
        if (lfield.collectionName === "pl.actions") {
            var lfieldClone = Utils.deepClone(lfield);
            delete qFieldClone._id;
            delete qFieldClone.index;
            delete qFieldClone.lastmodifiedtime;
            delete qFieldClone.fkId;
            delete qFieldClone.onRow;
            delete qFieldClone.onHeader;
            delete qFieldClone.qviewids;
            delete qFieldClone.__txs__;
            delete qFieldClone.exportType;
            delete qFieldClone.requestView;
            delete qFieldClone.requiredView;
            delete qFieldClone.parameters;
            delete qFieldClone.async;
            delete qFieldClone.requireSelectedRows;
            delete qFieldClone.visibility;
            delete lfieldClone.lastmodifiedtime;
            delete lfieldClone._id;
            delete lfieldClone.index;
            delete lfieldClone.fkId;
            delete lfieldClone.onRow;
            delete lfieldClone.onHeader;
            delete lfieldClone.__txs__;
            delete lfieldClone.qviewids;
            delete lfieldClone.exportType;
            delete lfieldClone.requestView;
            delete lfieldClone.requiredView;
            delete lfieldClone.parameters;
            delete lfieldClone.async;
            delete lfieldClone.requireSelectedRows;
            delete lfieldClone.visibility;
            if (Utils.deepEqual(qFieldClone, lfieldClone)) {
                return lfield;
            }
        }
    }
}

function isFieldMatch(localField, globalField, localFields, globalFields) {
    if (localField.field !== globalField.field) {
        return false;
    }
    var lfieldParent = localField.parentfieldid;
    var gfieldParent = globalField.parentfieldid;
    if (Utils.deepEqual(lfieldParent, gfieldParent)) {
        return true;
    }
    if (lfieldParent === undefined || gfieldParent === undefined) {
        return false;
    }
    if (lfieldParent.field !== gfieldParent.field) {
        return false;
    }
    var lfieldParentFieldIndex = Utils.isExists(localFields, lfieldParent, "_id");
    var lfieldParentField = undefined;
    if (lfieldParentFieldIndex !== undefined) {
        lfieldParentField = localFields[lfieldParentFieldIndex];
    }
    var gfieldParentFieldIndex = Utils.isExists(globalFields, gfieldParent, "_id");
    var gfieldParentField = undefined;
    if (gfieldParentFieldIndex !== undefined) {
        gfieldParentField = globalFields[gfieldParentFieldIndex];
    }
    if (lfieldParentField && gfieldParentField) {
        return isFieldMatch(lfieldParentField, gfieldParentField, localFields, globalFields)
    } else {
        throw new Error("Result not found for local and parent field");
    }
}

function populateUpdateChangeLogs(updateRow, fkValue, recursion) {
    var updateChangeLogs = [];
    if (updateRow.$unset) {
        var unsetValue = updateRow.$unset;
        for (var k in unsetValue) {
            var updateChangeLog = {};
            updateChangeLog.type = "update";
            updateChangeLog.updatedField = k;
            updateChangeLog.fk = fkValue;
            updateChangeLog.recordType = "localUpdate";
            var updateValue = {};
            updateValue[k] = unsetValue[k];
            updateChangeLog.operation = JSON.stringify({$unset:updateValue});
            updateChangeLogs.push(updateChangeLog);
        }
    }

    if (updateRow.$set) {
        var setValue = updateRow.$set;
        for (var k in setValue) {
            var fieldValue = setValue[k];
            if (!recursion && Utils.isJSONObject(fieldValue) && (fieldValue.globalInsert || fieldValue.localInsert || fieldValue.localUpdate)) {
                var newChangeLogs = [];
                if (fieldValue.globalInsert && fieldValue.globalInsert.length > 0) {
                    for (var i = 0; i < fieldValue.globalInsert.length; i++) {
                        var insertRow = fieldValue.globalInsert[i];
                        var newChangeLog = {recordType:"globalInsert", operation:JSON.stringify(insertRow), arrayUpdates:{_id:insertRow._id, type:"insert"}};
                        newChangeLogs.push(newChangeLog);
                    }
                }
                if (fieldValue.localInsert && fieldValue.localInsert.length > 0) {
                    for (var i = 0; i < fieldValue.localInsert.length; i++) {
                        var insertRow = fieldValue.localInsert[i];
                        var newChangeLog = {recordType:"localInsert", operation:JSON.stringify(insertRow), arrayUpdates:{_id:insertRow._id, type:"insert"}};
                        newChangeLogs.push(newChangeLog);
                    }
                }
                if (fieldValue.localUpdate && fieldValue.localUpdate.length > 0) {
                    for (var i = 0; i < fieldValue.localUpdate.length; i++) {
                        var updateRow = fieldValue.localUpdate[i];
                        var newUpdateChangeLogs = populateUpdateChangeLogs(updateRow, fkValue, true);
                        for (var j = 0; j < newUpdateChangeLogs.length; j++) {
                            var newUpdateChangeLog = newUpdateChangeLogs[j];
                            newUpdateChangeLog.arrayUpdates = {_id:updateRow._id, type:"update"};
                            if (newUpdateChangeLog.updatedField) {
                                newUpdateChangeLog.arrayUpdates.field = newUpdateChangeLog.updatedField;
                            }
                        }
                        newChangeLogs.push.apply(newChangeLogs, newUpdateChangeLogs);
                    }
                }
                for (var i = 0; i < newChangeLogs.length; i++) {
                    var newChangeLog = newChangeLogs[i];
                    newChangeLog.type = "update";
                    newChangeLog.fk = fkValue;
                    newChangeLog.updatedField = k;
                }
                updateChangeLogs.push.apply(updateChangeLogs, newChangeLogs);
            } else {
                var updateChangeLog = {};
                updateChangeLog.type = "update";
                updateChangeLog.updatedField = k;
                updateChangeLog.fk = fkValue;
                updateChangeLog.recordType = "localUpdate";
                var updateValue = {};
                updateValue[k] = setValue[k];
                updateChangeLog.operation = JSON.stringify({$set:updateValue});
                updateChangeLogs.push(updateChangeLog);
            }
        }
    }
    return updateChangeLogs;

}

function populateRow(localData, globalData) {
    delete localData.__txs__;
    delete localData.__history;
    delete localData.lastmodifiedtime;
    delete localData.db;
    delete localData.qviewids;
    delete globalData.__txs__;
    delete globalData.__history;
    delete globalData.lastmodifiedtime;
    delete globalData.db;
    delete globalData.qviewids;

    var update = Utils.deepClone(localData);
    for (var localKey in localData) {
        if (localKey === "_id") {
            continue;
        }
        if (!Utils.deepEqual(localData[localKey], globalData[localKey])) {
            var localKeyValue = localData[localKey];
            update.$set = update.$set || {};
            if (Array.isArray(localKeyValue) && typeof localKeyValue[0] !== "string") {
                update.$set[localKey] = getArrayUpdates(localKeyValue, globalData[localKey]);
            } else {
                update.$set[localKey] = localKeyValue;
            }
        }
    }
    for (var globalKey in globalData) {
        if (localData[globalKey] === undefined) {
            update.$unset = update.$unset || {};
            update.$unset[globalKey] = "";
        }
    }
    if (!update.$set && !update.$unset) {
        return;
    }
    return update;
}

function getArrayUpdates(localData, globalData) {
    var arrayUpdates = {localInsert:[], localUpdate:[], globalInsert:[]};
    for (var i = 0; i < localData.length; i++) {
        var localRow = localData[i];
        var index = Utils.isExists(globalData, localRow, "_id");
        if (index === undefined) {
            arrayUpdates.localInsert.push(localRow);
        } else if (globalData) {
            var globalRow = globalData[index];
            globalData.splice(index, 1);
            if (Utils.deepEqual(localRow, globalRow)) {
                continue;
            }
            var update = populateRow(localRow, globalRow);
            if (update) {
                arrayUpdates.localUpdate.push(update);
            }
        }
    }
    if (globalData) {
        for (var i = 0; i < globalData.length; i++) {
            var row = globalData[i];
            arrayUpdates.globalInsert.push(row);
        }
    }
    return arrayUpdates;
}

function getValue(row, collectionName) {
    var field = undefined;
    if (collectionName === "pl.fields") {
        field = "field";
    } else if (collectionName === "pl.actions") {
        field = "label";
    } else if (collectionName === "pl.formgroups") {
        field = "title";
    } else if (collectionName === "pl.indexes") {
        field = "name";
    } else if (collectionName === "pl.menus") {
        field = "label";
    }
    if (field) {
        return row[field];
    }
}

