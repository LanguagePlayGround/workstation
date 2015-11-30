var Utils = require("ApplaneCore/apputil/util.js");
var CacheService = require("ApplaneDB/lib/CacheService.js");
var Q = require("q");
var AppsConstants = require("./Constants.js");
var Utility = require("./triggers/Utility.js");
var ApplaneDB = require("ApplaneDB/lib/DB.js");


exports.removeChangeLogs = function (params, db, options) {
    var type = params.type;
    var value = params.value;
    var dbName = params.db;
    var removeType = params.removeType;
    if (!type || !value || !dbName || !removeType) {
        throw new Error("type/value/dbName/removeType is mandatory")
    }
    var mainCollectionName = Utility.getMainCollection(type);
    return db.connectUnauthorized(dbName).then(
        function (connectedDb) {
            var collectionFilter = {};
            collectionFilter[Utility.getField(mainCollectionName)] = value;
            return connectedDb.query({$collection: mainCollectionName, $filter: collectionFilter, $fields: {_id: 1}});
        }).then(function (result) {
            if (result && result.result && result.result.length === 0) {
                throw new Error("Record not found for value [" + value + "] in collection [" + mainCollectionName + "]");
            }
            var newParam = {};
            newParam.localDelete = params.localDelete;
            newParam.updateId = result.result[0]._id;
            newParam.collection = mainCollectionName;
            newParam.db = dbName;
            newParam.removeType = removeType;
            newParam.mainCollectionValue = value;
            return removeChanges(newParam, db);
        })
}

exports.removeChangesFromActions = function (params, adminDb, options) {
    var removeType = params.removeType;
    if (!removeType) {
        throw new Error("Remove type is mandatory.")
    }
    var id = params._id;
    return adminDb.query({$collection: "pl.changelogs", $filter: {_id: id}}).then(function (result) {
        var data = result.result[0];
        var newParam = {};
        if (removeType === "Complete") {
            if (data.mainCollection !== data.collection) {
                throw new Error("Main Collection and collection should be same when removeType is Complete");
            }
            newParam.collection = data.mainCollection;
            newParam.updateId = data.mainFk._id;
        } else if (removeType === "Single" || removeType === "Update") {
            if (data.mainCollection === data.collection) {
                throw new Error("Main Collection and Collection should be different when removeType is " + removeType);
            }
            newParam.collection = data.collection;
            newParam.updateId = data.fk._id;
            if (removeType === "Update") {
                if (!data.updatedField) {
                    throw new Error("Updated Field can not be undefined when removeType is Update");
                }
                newParam.updatedField = data.updatedField;
            }
        }
        newParam.db = data.db;
        newParam.removeType = removeType;
        newParam.localDelete = params.localDelete;
        newParam.mainCollectionValue = data.mainFk.value;
        return removeChanges(newParam, adminDb);
    })
}

function removeChanges(params, originalDb) {
    var adminDB = undefined;
    var db = undefined;
    var dbName = params.db;
    var updateId = params.updateId;
    var collectionName = params.collection;
    var mainCollectionValue = params.mainCollectionValue;
    var deleteQviews = false;
    var localDelete = params.localDelete;
    var sandBoxDB = undefined;
    return originalDb.getAdminDB().then(
        function (adb) {
            adminDB = adb;
            return originalDb.connectUnauthorized(dbName);
        }).then(
        function (dtc) {
            db = dtc;
        }).then(
        function () {
            return Utility.getDBtoServeData(updateId, collectionName, db);
        }).then(
        function (serveDb) {
            if (!serveDb) {
                throw new Error("ServeDb not found for collection [" + collectionName + "] with id [" + JSON.stringify(updateId) + "]");
            }
            if (serveDb.db.databaseName != dbName) {
                throw new Error("Data is already coming from global db [" + serveDb.db.databaseName + "]");
            }
        }).then(
        function () {
            return db.getGlobalDB();
        }).then(
        function (globalDB) {
            if (globalDB) {
                return Utility.getDBtoServeData(updateId, collectionName, globalDB);
            }
        }).then(
        function (serveDb) {
            if (!serveDb) {
                if (localDelete) {
                    deleteQviews = true;
                } else {
                    throw new Error("Record is created in db to update [" + dbName + "]. Please select Local delete if you want to remove.");
                }
            }
        }).then(
        function () {
            return adminDB.query({$collection: "pl.dbs", $filter: {db: dbName}, $fields: {sandboxDb: 1}, $events: false, $modules: false});
        }).then(
        function (result) {
            var sandboxDBName = result.result[0].sandboxDb;
            if (sandboxDBName) {
                return db.connectUnauthorized(sandboxDBName).then(function (sDb) {
                    sandBoxDB = sDb;
                })
            }
        }).then(function () {
            var removeType = params.removeType;
            if (removeType === "Complete") {
                return removeData(updateId, collectionName, deleteQviews, adminDB, db).then(function () {
                    if (sandBoxDB) {
                        return removeData(updateId, collectionName, deleteQviews, adminDB, sandBoxDB);
                    }
                })
            } else if (removeType === "Single") {
                return handleSingleAndUpdateCase(removeType, collectionName, mainCollectionValue, updateId, undefined, adminDB, db).then(function () {
                    if (sandBoxDB) {
                        return handleSingleAndUpdateCase(removeType, collectionName, mainCollectionValue, updateId, undefined, adminDB, sandBoxDB);
                    }
                });
            } else if (removeType === "Update") {
                var updatedField = params.updatedField;
                return handleSingleAndUpdateCase(removeType, collectionName, mainCollectionValue, updateId, updatedField, adminDB, db).then(function () {
                    if (sandBoxDB) {
                        return handleSingleAndUpdateCase(removeType, collectionName, mainCollectionValue, updateId, updatedField, adminDB, sandBoxDB);
                    }
                });
            }
        })
}

function handleSingleAndUpdateCase(removeType, collectionName, mainCollectionValue, updateId, updatedField, adminDB, db) {
    return db.query({$collection: collectionName, $filter: {_id: updateId}, $events: false, $modules: false}).then(
        function (collectionData) {
            if (collectionData.result.length === 0) {
                return;
            }
            var data = collectionData.result[0];
            return db.getGlobalDB().then(
                function (globalDb) {
                    if (globalDb) {
                        return globalDb.query({$collection: collectionName, $filter: {_id: updateId}});
                    }
                }).then(function (globalDbData) {
                    var globalData = globalDbData.result.length > 0 ? globalDbData.result[0] : undefined;
                    var updateQuery = {$collection: collectionName, $events: false, $modules: {TransactionModule: 1}};
                    if (!globalData) {
                        if (removeType === "Single") {
                            updateQuery.$delete = {_id: updateId};
                        } else {
                            throw new Error("Data is not present in global Db");
                        }
                    } else {
                        var setValue = {};
                        var unsetValue = {};
                        if (removeType === "Single") {
                            for (var key in globalData) {
                                if (!Utils.deepEqual(globalData[key], data[key])) {
                                    setValue[key] = globalData[key];
                                }
                            }
                            for (var key in data) {
                                if (globalData[key] === undefined) {
                                    unsetValue[key] = "";
                                }
                            }
                        } else if (removeType === "Update") {
                            if (updatedField) {
                                if (globalData[updatedField] !== undefined) {
                                    setValue[updatedField] = globalData[updatedField];
                                } else {
                                    unsetValue[updatedField] = "";
                                }
                            }
                        }
                        updateQuery.$update = {_id: updateId};
                        if (Object.keys(setValue).length > 0) {
                            updateQuery.$update.$set = setValue;
                        }
                        if (Object.keys(unsetValue).length > 0) {
                            updateQuery.$update.$unset = unsetValue;
                        }
                    }
                    return db.update(updateQuery).then(function () {
                        return CacheService.clearCache(mainCollectionValue, db).then(function () {
                            return CacheService.clearFunctionCache(mainCollectionValue, db);
                        })
                    })
                })
        }).then(function () {
            var deleteFilter = {db: db.db.databaseName, "fk._id": updateId};
            if (updatedField) {
                deleteFilter.updatedField = updatedField;
            }
            return adminDB.update({$collection: "pl.changelogs", $delete: {$query: deleteFilter}, $modules: {TransactionModule: 1}})
        });
}

//This function is for single time use
//127.0.0.1:5100/rest/invoke?function=NewPorting.iterateDB&parameters=[{"function":"NewPorting.getFileFields"}]&token=5c6d5bc2344914bcdeda703479811cf364588814&options={"async":true,"processName":"getFileFields"}
exports.getFileFields = function (params, db, options) {
    return db.query({$collection: "pl.fields", $filter: {type: "file", ui: "file", field: "file"}, $events: false, $modules: false}).then(function (result) {
        if (result.result.length > 0) {
            var results = result.result;
            var fields = [];
            for (var i = 0; i < results.length; i++) {
                var newRecord = {};
                var record = results[i];
                if (record.supportedExtensions && record.supportedExtensions.length > 0) {
                    continue;
                }
                newRecord._id = record._id;
                newRecord.parentField = record.parentfieldid;
                newRecord.collection = record.collectionid.collection;
                newRecord.field = record.field;
                fields.push(newRecord);
            }
            var dbWiseResult = {};
            dbWiseResult.databaseName = db.db.databaseName;
            dbWiseResult.fields = fields;
            return dbWiseResult;
        }
    })
}


//beta.business.applane.com/rest/invoke?function=NewPorting.iterateDB&parameters=[{"function":"NewPorting.clearCollectionsCache"}]&token=be2a4eafc061d4777d9565dde04c969e7ff02f65&options={"async":true,"processName":"clearCollectionsCache"}
exports.clearCollectionsCache = function (params, db, options) {
    return db.query({$collection: "pl.collections", $fields: {collection: 1}, $events: false, $modules: false}).then(function (collections) {
        collections = collections.result;
        return Utils.iterateArrayWithPromise(collections, function (index, collectionInfo) {
            return CacheService.clearCache(collectionInfo.collection, db);
        })
    })
}

function removeData(updateId, collectionName, deleteQviews, adminDB, db) {
    var commitCollections = AppsConstants.CommitCollections;
    var mainFkIds = [updateId];
    return Utils.iterateArrayWithPromise(commitCollections,
        function (index, commitCollection) {
            if (collectionName != commitCollection.collection || !commitCollection.referredCollections) {
                return;
            }
            var referredCollections = commitCollection.referredCollections;
            return Utils.iterateArrayWithPromise(referredCollections,
                function (index, referredCollection) {
                    var referredCollectionName = referredCollection.collection;
                    var referredCollectionFilter = {};
                    referredCollectionFilter[referredCollection.filterfield + "._id"] = updateId;
                    var deleteReferredQuery = {$collection: referredCollectionName, $delete: {$query: referredCollectionFilter}, $events: false, $modules: {TransactionModule: 1}};
                    return db.update(deleteReferredQuery);
                })
        }).then(
        function () {
            if (collectionName === "pl.collections" && deleteQviews) {
                return db.query({$collection: "pl.qviews", $filter: {$or: [
                    {"collection._id": updateId},
                    {"mainCollection._id": updateId}
                ]}, $events: false, $modules: false}).then(function (result) {
                    if (result && result.result.length === 0) {
                        return;
                    }
                    for (var i = 0; i < result.result.length; i++) {
                        mainFkIds.push(result.result[i]._id);
                    }
                    return db.update({$collection: "pl.qviews", $delete: result.result, $events: false, $modules: { TransactionModule: 1}});
                })
            }
        }).then(
        function () {
            var deleteQuery = {$collection: collectionName, $delete: {$query: {_id: updateId}}, $events: false, $modules: { TransactionModule: 1}};
            return db.update(deleteQuery);
        }).then(function () {
            return adminDB.update({$collection: "pl.changelogs", $delete: {$query: {db: db.db.databaseName, "mainFk._id": {$in: mainFkIds }}}, $modules: { TransactionModule: 1}});
        })
}

exports.portChangeLogsData = function (params, db, options) {
    var adminDB = undefined;
    var errors = {};
    var totalMap = {};
    var parentMap = {"gaadi": "business", "girnarsoft": "business", "darcl": "business", "hitkarini": "education", "colleges": "education", "hitkarini_colleges": "education"};
    return db.getAdminDB().then(
        function (adb) {
            adminDB = adb;
        }).then(
        function () {
            return adminDB.query({$collection: "pl.changelogs", $filter: {updateDate: {$gt: new Date("2015-03-02")}, operation: {$exists: true}}, $sort: {_id: 1}, $events: false, $moudles: false}).then(function (changeLogs) {
//                return adminDB.query({$collection:"pl.changelogs", $filter:{updateDate:{$gt:new Date("2015-03-02")}, operation:{$exists:true},"fk._id":"54eefdc68683033d14721f3a"}, $sort:{_id:1}, $events:false, $moudles:false}).then(function (changeLogs) {

                changeLogs = changeLogs.result;
                var map = {};
                return Utils.iterateArrayWithPromise(changeLogs, function (index, changeLog) {
                    var db = changeLog.db;
                    var fkId = changeLog.fk._id;
                    var collection = changeLog.collection;

                    var localDB = undefined;
                    return adminDB.connectUnauthorized(db, true).then(
                        function (localDB1) {
                            localDB = localDB1;
                            return updateRec(map, collection, fkId, changeLog, db, localDB, parentMap, errors);
                        }).then(function (updateResult) {
                            var type = changeLog.type;
                            if (type === "delete" || type == "insert") {
                                //do nothing
                            } else if (updateResult === "ignore") {
                                //do nothing
                                totalMap[db] = totalMap[db] || {};
                                totalMap[db][fkId] = totalMap[db][fkId] || 0;
                                totalMap[db][fkId] = totalMap[db][fkId] + 1
                            } else if (updateResult === "changed") {
                                var changeLogUpdates = populateUpdateQuery(changeLog);
                                return localDB.update(changeLogUpdates).fail(function (err) {
                                    errors["commit logs"] = errors["commit logs"] || {};
                                    errors["commit logs"][db] = errors["commit logs"][db] || {};
                                    errors["commit logs"][db][changeLog._id] = err.message;

                                });
                            } else {
                                throw new Error("Un handle update result..[" + updateResult + "]");
                            }
                        })
                })
            })
        }).then(function () {
            return adminDB.query({$collection: "pl.changelogs", $filter: {"mainCollection": "pl.collections", updateDate: {$gt: new Date("2015-03-02")}, operation: {$exists: true}}, $group: {_id: {mainFk: "$mainFk", "db": "$db"}}}).then(function (changeLogs) {
                changeLogs = changeLogs.result;

                return Utils.iterateArrayWithPromise(changeLogs, function (index, changeLog) {
                    var db = changeLog._id.db;
                    var mainFk = changeLog._id.mainFk;
                    return adminDB.connectUnauthorized(db, true).then(function (localDB) {
                        return require("./triggers/ReferredFks.js").repopulateReferredFks({collection: mainFk.value}, localDB).then(function () {
                            return CacheService.clearCache(mainFk.value, localDB);
                        })

                    })
                })
            })

        })
}

function updateRec(map, collection, id, changeLog, db, dbInstance, parentMap, errors) {

    var type = changeLog.type;
    if (type === "delete") {
        var d = require("q").defer();
        d.resolve("ignore");
        return d.promise;
    }
    if (map[id]) {
        var d = require("q").defer();
        d.resolve("changed");
        return d.promise;
    }


    var oldURL = "mongodb://127.0.0.1:27029/";
    var newURL = "mongodb://127.0.0.1:27017/";
    if (map[id]) {
        var d = require("q").defer();
        d.resolve(true);
        return d.promise;
    }
    return getOldValue(changeLog, oldURL, db, collection, id, parentMap).then(
        function (oldRecord) {
            if (!oldRecord) {
                return "ignore";
            }
            return getRecordValue(newURL, db, collection, id).then(function (newRecord) {
                if (!newRecord) {
                    return "ignore";
                }
                newRecord = newRecord || {};
                var newUpdates = {};
                for (var key     in oldRecord) {
                    var oldValue = oldRecord[key];
                    var newValue = newRecord[key];
                    if (!Utils.deepEqual(oldValue, newValue)) {
                        newUpdates.$set = newUpdates.$set || {};
                        newUpdates.$set[key] = oldValue;
                    }
                }

                for (var key in newRecord) {
                    var oldValue = oldRecord[key];
                    var newValue = newRecord[key];
                    if (oldValue === undefined && newValue !== undefined) {
                        newUpdates.$unset = newUpdates.$unset || {};
                        newUpdates.$unset[key] = "";
                    }
                }

                if (Object.keys(newUpdates).length > 0) {
                    newUpdates._id = oldRecord._id;

                    return updateRecord(dbInstance, collection, newUpdates, errors, changeLog).then(function () {
                        map[id] = true;
                        return "changed";
                    });
                } else {
                    return "changed";
                }

            })
        })
}


function getOldValue(changeLog, oldURL, db, collection, id, parentMap) {
    if (changeLog.type == "insert") {
        var d = require("q").defer();
        var parsed = JSON.parse(changeLog.operation);
        Utils.convert_IdToObjectId(parsed);
        d.resolve(parsed);
        return d.promise;
    }
    return getRecordValue(oldURL, db, collection, id).then(function (result) {
        if (result) {
            return result;
        } else if (parentMap[db]) {
            return getRecordValue(oldURL, parentMap[db], collection, id)
        } else {
            return result;
        }
    })
}

function updateRecord(db, collection, document, errors, changeLog) {
    return db.update({$collection: collection, $update: [document], $events: false, $modules: {DataTypeModule: 1}}).fail(function (err) {
        errors["synch logs"] = errors["synch logs"] || {};
        errors["synch logs"][db.db.databaseName] = errors["synch logs"][db.db.databaseName] || {};
        errors["synch logs"][db.db.databaseName][changeLog._id] = err.message;

    })

}

function getRecordValue(url, db, collection, id) {
    url = url + db + "/";
    return connectToMongo(url).then(function (mongoDB) {
        var d = Q.defer();
        mongoDB.collection(collection).findOne({_id: id}, function (err, result) {
            if (err) {
                d.reject(err);
                return;
            }
            d.resolve(result);
        })
        return d.promise;
    })
}

var DBS = {};

function connectToMongo(url) {
    var D = Q.defer();
    if (DBS[url]) {
        D.resolve(DBS[url]);
        return D.promise;
    }

    require("mongodb").MongoClient.connect(url, function (err, db) {
        if (err) {
            D.reject(err);
            return;
        }
        db.authenticate("daffodilsw", "daffodil-applane", {authdb: "admin"}, function (err, res) {
            if (err) {
                D.reject(err);
            } else if (!res) {
                D.reject(new Error("Auth fails"));
            } else {
                DBS[url] = db;
                D.resolve(DBS[url]);
            }

        })
    })
    return D.promise;
}

function populateUpdateQuery(record) {
    var collection = record.collection;
    var recordId = record.fk._id;
    var type = record.type;
    var operation = record.operation;
    if (operation) {
        operation = JSON.parse(operation);
    }
    var updateQuery = {$collection: collection, $events: false, $modules: {DataTypeModule: 1}};
    if (type === "update" && record.arrayUpdates) {
        var newOperation = populateArrayUpdateOperation(recordId, record, operation);
        updateQuery.$update = newOperation;
    } else {
        if (type === "insert") {
            updateQuery.$insert = operation;
        } else if (type === "delete") {
            updateQuery.$delete = {_id: recordId};
        } else if (type === "update") {
            operation._id = recordId;
            updateQuery.$update = operation;
        }
    }
    return updateQuery;
}

function populateArrayUpdateOperation(recordId, record, operation) {
    var arrayUpdates = record.arrayUpdates;
    var mainUpdatedField = record.updatedField;
    var arrayId = arrayUpdates._id;
    var arrayUpdateType = arrayUpdates.type;
    var newOperation = {_id: recordId, $set: {}};
    if (arrayUpdateType === "insert") {
        newOperation.$set[mainUpdatedField] = {$insert: [
            operation
        ]};
    } else if (arrayUpdateType === "update") {
        operation._id = arrayId;
        newOperation.$set[mainUpdatedField] = {$update: [
            operation
        ]};
    } else if (arrayUpdateType === "delete") {
        newOperation.$set[mainUpdatedField] = {$delete: [
            {_id: arrayId}
        ]};
    }
    return newOperation;
}


/*
 * Used to port Type and collection in role Privileges bez of support of multiple collections in privileges.Use for single time only -- Sachin
 * */
exports.portRolesPrivileges = function (params, db, options) {
    return db.query({$collection: "pl.roles", $fields: {privileges: 1}, "$events": false, "$modules": false}).then(
        function (data) {
            var roles = data.result;
            return Utils.iterateArrayWithPromise(roles, function (index, role) {
                var privileges = role.privileges;
                if (!privileges || privileges.length === 0) {
                    return;
                }
                var update = {_id: role._id, $set: {privileges: {$update: []}}};
                for (var i = 0; i < privileges.length; i++) {
                    var privilege = privileges[i];
                    if (!privilege.type) {
                        var privilegeUpdate = {_id: privilege._id};
                        privilegeUpdate.$set = {};
                        privilegeUpdate.$set.type = privilege.regex ? "Regex" : (!privilege.collection ? "Default" : "Collection");
                        update.$set.privileges.$update.push(privilegeUpdate);
                    }
                }
                return db.update({$collection: "pl.roles", $update: update, $events: false, $modules: false});
            });
        }).then(function () {
            return db.invokeFunction("Porting.removeUserCache", [
                {all: true}
            ]);
        })
}

exports.removeDirtyCollectionReferredData = function (params, db, options) {
    var portCollectionName = params.collection;
    if (!portCollectionName) {
        throw new Error("please provide value of mandatory parameters [collection]");
    }
    return db.query({$collection: portCollectionName, $fields: {collectionid: 1}, "$events": false, "$modules": false}).then(
        function (data) {
            var fields = data.result;
            return Utils.iterateArrayWithPromise(fields, function (index, field) {
                var collectionId = field.collectionid;
                if (collectionId) {
                    return db.query({$collection: "pl.collections", $filter: {_id: collectionId._id}, $events: false, $modules: false}).then(function (result) {
                        if (result.result.length === 0) {
                            return db.mongoUpdate({$collection: portCollectionName, $delete: {_id: field._id}});
                        }
                    })
                }
            });
        });
}

exports.repopulateReferredFks = function (params, db, options) {
    return db.query({$collection: "pl.collections", $fields: {collection: 1}, "$events": false, "$modules": false}).then(
        function (data) {
            var collections = data.result;
            return Utils.iterateArrayWithPromise(collections, function (index, collection) {
                var collectionName = collection.collection;
                return require("./triggers/ReferredFks.js").repopulateReferredFks({collection: collectionName}, db);
            });
        })
}

exports.getFkAndObjectInSetFields = function (db) {
    var adminDb = undefined;
    var fieldsToReturn = {};
    return db.getAdminDB().then(
        function (adminDb1) {
            adminDb = adminDb1;
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(
        function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.fields", $filter: {set: {$exists: true}}, "$events": false, "$modules": false}).then(
                            function (data) {
                                var fields = data.result;
                                return Utils.iterateArrayWithPromise(fields, function (index, field) {
                                    var collection = field.collection;
                                    return dbToPort.collection(collection).then(
                                        function (collectionObj) {
                                            var fkFields = collectionObj.getValue("fields");
                                            var setValue = field.set;
                                            for (var i = 0; i < setValue.length; i++) {
                                                if (setValue[i].indexOf(".") === -1) {
                                                    var fieldInfo = Utils.getField(setValue[i], fkFields);
                                                    if (fieldInfo) {
                                                        if (fieldInfo.type === "fk" || fieldInfo.type === "object") {
                                                            fieldsToReturn[dbName.db] = fieldsToReturn[dbName.db] || {};
                                                            fieldsToReturn[dbName.db][fieldInfo.type] = fieldsToReturn[dbName.db][fieldInfo.type] || {};
                                                            fieldsToReturn[dbName.db][fieldInfo.type][field.collectionid.collection] = fieldsToReturn[dbName.db][fieldInfo.type][field.collectionid.collection] || [];
                                                            fieldsToReturn[dbName.db][fieldInfo.type][field.collectionid.collection].push(field);
                                                        }
                                                    }
                                                } else {
                                                    fieldsToReturn[dbName.db] = fieldsToReturn[dbName.db] || {};
                                                    fieldsToReturn[dbName.db]["dotted"] = fieldsToReturn[dbName.db]["dotted"] || {};
                                                    fieldsToReturn[dbName.db]["dotted"][field.collectionid.collection] = fieldsToReturn[dbName.db]["dotted"][field.collectionid.collection] || [];
                                                    fieldsToReturn[dbName.db]["dotted"][field.collectionid.collection].push(field);
                                                }
                                            }
                                        }).fail(function (err) {
                                            console.log("Err...." + err);
                                        })
                                });
                            });
                    }).fail(function (err) {
                        console.log("err>>>>" + err);
                    })
            });
        }).then(function () {
            return fieldsToReturn;
        })
}

exports.findUpdatedQviews = function (db, options) {
    var adminDb = undefined;
    return db.getAdminDB().then(
        function (adminDb1) {
            adminDb = adminDb1;
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.qviews", "$events": false, "$modules": false}).then(
                            function (data) {
                                var qviews = data.result;
                                if (!qviews) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(qviews, function (index, qview) {

                                    if (qview.qFields && qview.qFields.length > 0) {
                                        var qFields = qview.qFields;
                                        return Utils.iterateArrayWithPromise(qFields, function (index, row) {
                                            if (row && row.qfield) {
                                                var qfieldid = row.qfield._id;
                                                return adminDb.query({$collection: "portingmatchedsynchchanges", $filter: {"fk._id": qfieldid}, "$events": false, "$modules": false}).then(
                                                    function (synchData) {
                                                        if (synchData && synchData.result && synchData.result.length > 0) {
                                                            synchData = synchData.result[0];

                                                            var filter = {}
                                                            filter.recordType = "globalInsert";
                                                            filter.match = true;
                                                            filter.matchIndex = synchData.matchIndex;
                                                            filter.mainCollection = synchData.mainCollection;
                                                            filter.collection = synchData.collection;
                                                            filter.db = synchData.db;
                                                            filter["fk.value"] = synchData.fk.value;
                                                            filter["mainFk._id"] = synchData.mainFk._id;
                                                            filter["fk._id"] = {$ne: synchData.fk._id};
                                                            return adminDb.query({$collection: "portingmatchedsynchchanges", $filter: filter, "$events": false, "$modules": false});
                                                        }
                                                    }).then(function (synchDataResult) {
                                                        if (synchDataResult && synchDataResult.result && synchDataResult.result.length > 0) {
                                                            synchDataResult = synchDataResult.result;
                                                            if (synchDataResult.length > 1) {
                                                                console.error(" manjeet err found more than one record ..............");
                                                            } else {
                                                                var toSet = {};
                                                                toSet["qFields." + index + ".qfield._id"] = synchDataResult[0].fk._id;
                                                                toSet["oldqfieldid"] = qfieldid;
                                                                return dbToPort.mongoUpdate({$events: false, $modules: false, $collection: "pl.qviews", $update: {$query: {_id: qview._id}, $set: toSet}});
                                                            }
                                                        }
                                                    })
                                            }
                                        })
                                    }


                                });
                            });
                    }).fail(function (err) {
                        console.log("connect err..." + err + "... in db ... " + dbName.db);
                    })

            });
        });
}

exports.populateIdentifierInApplications = function (db) {
    var adminDb = undefined;
    return db.getAdminDB().then(
        function (adminDb1) {
            adminDb = adminDb1;
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.applications", "$events": false, "$modules": false}).then(
                            function (data) {
                                var applications = data.result;
                                if (!applications) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(applications, function (index, application) {
                                    if (application.label) {
                                        var identifier = getIndentifer(application.label);
                                        return dbToPort.mongoUpdate({$collection: "pl.applications", $update: {$query: {_id: application._id}, $set: {uri: identifier}}});
                                    }
                                });
                            });
                    }).fail(function (err) {
                        console.log("connect err..." + err + "... in db ... " + dbName.db);
                    });

            });
        });
}

exports.populateIdentifierInMenus = function (db) {
    var adminDb = undefined;

    return db.getAdminDB().then(
        function (adminDb1) {
            adminDb = adminDb1;
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                console.log("dbName>>>" + dbName.db);

                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.menus", "$events": false, "$modules": false}).then(
                            function (data) {
                                var menus = data.result;
                                if (!menus) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(menus, function (index, menu) {
                                    if (menu.label) {
                                        var update = {};
                                        var query = {};
                                        var identifier = getIndentifer(menu.label);
                                        var query = {_id: menu._id};
                                        update.uri = identifier;
                                        if (menu.qviews && menu.qviews.length > 0) {
                                            for (var i = 0; i < menu.qviews.length; i++) {
                                                var qview = menu.qviews[i];
                                                if (qview.label) {
                                                    var identifier = getIndentifer(qview.label);
                                                    update["qviews." + i + ".uri"] = identifier;
                                                }
                                            }
                                        }
//                                            console.log("update..........." + JSON.stringify({$collection: "pl.menus", $update: {$query: query, $set: update}}));
                                        return dbToPort.mongoUpdate({$collection: "pl.menus", $update: {$query: query, $set: update}});
                                    }
                                });
                            });
                    }).fail(function (err) {
                        console.log("connect err..." + err + "... in db ... " + dbName.db);
                    })

            });
        });
}

function getIndentifer(inputString) {
    if (inputString) {
        var outputString = inputString.replace(/([~!@#$%^&*()_+=`{}\[\]\|\\:;'<>,.\/? ])+/g, '-').replace(/^(-)+|(-)+$/g, '');
        outputString = outputString ? outputString.toLowerCase() : "";
        return outputString;
    }
}

exports.populateFieldProperties = function (db, options) {
    var adminDb = undefined;

    return db.getAdminDB().then(
        function (adminDb1) {
            adminDb = adminDb1;
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.fields", $filter: {"parentfieldid": {$exists: false}}, "$events": false, "$modules": false}).then(
                            function (data) {
                                var fields = data.result;
                                if (!fields) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(fields, function (index, field) {
                                    var update = {};
                                    if (field.type == "fk" && (field.visibility || field.visibilityGrid)) {
                                        if (field.filterable === undefined) {
                                            update.filterable = true;
                                        }
                                        if (field.sortable === undefined) {
                                            update.sortable = true;
                                        }
                                        if (field.groupable === undefined) {
                                            update.groupable = true;
                                        }
                                    } else if (field.type === "date") {
                                        if (field.width === undefined) {
                                            update.width = "100px";
                                        }
                                        if (field.visibility || field.visibilityGrid) {
                                            if (field.filterable === undefined) {
                                                update.filterable = true;
                                            }
                                        }
                                    } else if (field.type == "boolean" && field.width === undefined) {
                                        update.width = "100px";
                                    } else if ((field.type === "number" || field.type === "currency" || field.type === "duration") && (field.visibility || field.visibilityGrid)) {
                                        if (field.sortable === undefined) {
                                            update.sortable = true;
                                        }
                                        if (field.aggregate === undefined) {
                                            update.aggregate = "sum";
                                        }
                                        if (field.aggregatable === undefined) {
                                            update.aggregatable = true;
                                        }
                                    }
                                    if (Object.keys(update).length > 0) {
                                        return dbToPort.mongoUpdate({$collection: "pl.fields", $update: {$query: {_id: field._id}, $set: update}})
                                    }
                                });
                            });
                    }).fail(function (err) {
                        console.log("connect err..." + err + "... in db ... " + dbName.db);
                    })

            });
        });
}

exports.revertFieldProperties = function (db) {
    var adminDb = undefined;
    var fieldsPortingDB = undefined;
    var CacheService = require("ApplaneDB/lib/CacheService.js");
    return db.connectUnauthorized("plfieldsporting").then(
        function (portingDB) {
            fieldsPortingDB = portingDB;
            return db.getAdminDB()
        }).then(
        function (adminDb1) {
            adminDb = adminDb1;
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {

                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.fields", $filter: {"parentfieldid": {$exists: false}, type: {"$in": ["number", "currency", "duration"]}, sortable: true, aggregatable: true}, "$events": false, "$modules": false}).then(
                            function (data) {
                                var fields = data.result;
                                if (!fields) {
                                    return;
                                }
                                console.log("fields..." + fields.length);
                                var count = 0;
                                return Utils.iterateArrayWithPromise(fields,
                                    function (index, field) {
                                        return fieldsPortingDB.query({$collection: "pl.fields_" + dbName.db, $filter: {_id: field._id}}).then(function (result) {
//                                            console.log("result........" + JSON.stringify(result));
                                            if (result && result.result && result.result.length > 0) {
                                                result = result.result[0];

                                                var update = {};
                                                if (!result.sortable) {
                                                    update.sortable = "";
                                                }
                                                if (!result.aggregatable) {
                                                    update.aggregatable = "";
                                                }
                                                if (!result.aggregate) {
                                                    update.aggregate = "";
                                                }


                                                if (Object.keys(update).length > 0) {
                                                    count = count + 1;
                                                    /* if (result.collectionid.collection == "deliveries") {
                                                     console.log("result..fields... " + result.field);
                                                     console.log("result..collection... " + result.collectionid.collection);
                                                     console.log("update,,,,,,,,,," + JSON.stringify({$collection: "pl.fields", $update: {$query: {_id: field._id}, $set: update}}));
                                                     }*/
                                                    return dbToPort.mongoUpdate({$collection: "pl.fields", $update: {$query: {_id: field._id}, $unset: update}}).then(function () {
                                                        return CacheService.clearCache(result.collectionid.collection, dbToPort);
                                                    })
                                                }
                                            }
                                        });
                                    }).then(function () {
                                        console.log("count..." + count);
                                    });

                            });
                    }).fail(function (err) {
                        console.log("connect err..." + err + "... in db ... " + dbName.db);
                    })

            });
        });
}

exports.portFieldDataForMultipleChange = function (params, db, options) {
    var dbName = params.db;
    var collectionName = params.collection;
    var field = params.field;
    var type = params.type;
    if (!dbName || !collectionName || !field || !type) {
        throw new Error("please provide value of mandatory parameters [db/collection/field/type]");
    }
    var logDB = undefined;
    var dbToConnect = undefined;
    var logId = undefined;
    var uniqueId = Utils.getUnique();
    ApplaneDB.getLogDB().then(
        function (ldb) {
            logDB = ldb;
        }).then(
        function () {
            return db.connectUnauthorized(dbName);
        }).then(
        function (dtc) {
            dbToConnect = dtc;
        }).then(
        function () {
            var userName = db && db.user ? db.user.username : undefined;
            return logDB.mongoUpdate({$collection: "pl.fieldchangelogs", $insert: {user: userName, type: type, status: "In Progress", id: uniqueId, db: dbName, collection: collectionName, fields: [
                {field: field}
            ]}});
        }).then(
        function (result) {
            logId = result["pl.fieldchangelogs"].$insert[0]._id;
        }).then(
        function () {
            return dbToConnect.query({$collection: "pl.fields", $filter: {field: field, "collectionid.collection": collectionName, "__system__": {$ne: true}, parentfieldid: {$exists: false}}})
        }).then(
        function (fieldResult) {
            var fieldInfo = fieldResult.result[0];
            if (!fieldInfo) {
                throw new Error("FieldInfo not valid for field [" + field + "]");
            }
            if (type === "Remove") {
                var filter = {};
                filter[fieldInfo.field] = {$exists: true};
                if (fieldInfo.multiple) {
                    filter.$where = "!(Array.isArray(this." + fieldInfo.field + "))";
                } else {
                    filter.$where = "(Array.isArray(this." + fieldInfo.field + "))";
                }
                var valueToUnset = {};
                valueToUnset[field] = "";
                var mongoUpdate = {$collection: collectionName, $update: {$query: filter, $unset: valueToUnset}};
                return dbToConnect.mongoUpdate(mongoUpdate, {multi: true});
            } else if (type === "Update") {
                var d = Q.defer();
                var filter = {};
                filter[fieldInfo.field] = {$exists: true};
                if (fieldInfo.multiple) {
                    filter.$where = "!(Array.isArray(this." + fieldInfo.field + "))";
                } else {
                    filter.$where = "(Array.isArray(this." + fieldInfo.field + "))";
                }
                var queryFields = {_id: 1};
                queryFields[field] = 1;
                var query = {"$collection": collectionName, $fields: queryFields, $filter: filter, $events: false, $modules: false};
                return dbToConnect.invokeFunction("Porting.iterator", [
                    {"query": query, "function": "NewPorting.portFieldChangeData"}
                ], {async: false, fieldInfo: fieldInfo, collection: collectionName});
            } else {
                throw new Error("type[" + type + "] defined is not valid.");
            }
        }).then(
        function () {
            return logDB.mongoUpdate({$collection: "pl.fieldchangelogs", $update: {$query: {_id: logId}, $set: {status: "Completed"}}});
        }).fail(function (err) {
            return logDB.mongoUpdate({$collection: "pl.fieldchangelogs", $update: {$query: {_id: logId}, $set: {status: "Error", error: Utils.getErrorInfo(err)}}});
        })
}

exports.portFieldChangeData = function (doc, db, options) {
    var fieldInfo = options.fieldInfo;
    var fieldName = fieldInfo.field;
    var multiple = fieldInfo.multiple;
    var fieldType = fieldInfo.type;
    var fieldValue = doc[fieldName];
    var newFieldValue = undefined;
    if (multiple && Utils.isJSONObject(fieldValue)) {
        if (fieldType === "object" && !fieldValue._id) {
            fieldValue._id = Utils.getUniqueObjectId();
        }
        newFieldValue = [fieldValue];
    } else if (!multiple && Array.isArray(fieldValue)) {
        newFieldValue = fieldValue[0];
        if (fieldType === "object" && newFieldValue._id) {
            delete newFieldValue._id;
        }
    }
    var valueToSet = {};
    var mongoUpdate = {$collection: options.collection, $update: {$query: {_id: doc._id}}};
    if (newFieldValue) {
        valueToSet[fieldName] = newFieldValue;
        mongoUpdate.$update.$set = valueToSet;
    } else {
        valueToSet[fieldName] = "";
        mongoUpdate.$update.$unset = valueToSet;
    }
    return db.mongoUpdate(mongoUpdate);
}

//beta.business.applane.com/rest/invoke?function=NewPorting.iterateDB&parameters=[{"function":"NewPorting.populateMultipleChangeInFields"}]&token=be2a4eafc061d4777d9565dde04c969e7ff02f65&options={"async":true,"processName":"populateMultipleChangeInFields"}

exports.repopulateRoleSetFields = function (params, db, options) {
    params = params || {};
    params.db = db.db.databaseName;
    return db.invokeFunction("Porting.repopulateSetFields", [params]);
}

exports.populateMultipleChangeInFields = function (params, db, options) {
    var dbName = params.db;
    if (!dbName) {
        throw new Error("Please provide value of mandatory parameters [db]");
    }
    var dbInfos = [];
    var uniqueId = Utils.getUnique();
    var connectedDb = undefined;
    var userName = db && db.user ? db.user.username : undefined;
    return db.connectUnauthorized(dbName).then(
        function (dtc) {
            connectedDb = dtc;
        }).then(
        function () {
            return connectedDb.query({$collection: "pl.collections", $fields: {collection: 1}});
        }).then(
        function (collections) {
            collections = collections.result;
            return Utils.iterateArrayWithPromise(collections, function (index, collectionInfo) {
                var collectionName = collectionInfo.collection;
                if (!collectionName) {
                    return;
                }
                var changeFields = [];
                return connectedDb.query({$collection: "pl.fields", $filter: {$or: [
                    {type: "fk"},
                    {type: "object"}
                ], "collectionid.collection": collectionName, "__system__": {$ne: true}, parentfieldid: {$exists: false}}}).then(
                    function (fields) {
                        fields = fields.result;
                        return Utils.iterateArrayWithPromise(fields,
                            function (index, field) {
                                return getFieldData(collectionName, field, connectedDb).then(function (count) {
                                    if (count > 0) {
                                        changeFields.push({field: field.field, type: field.type, multiple: field.multiple, recordCount: count});

                                    }
                                })
                            })
                    }).then(function () {
                        if (changeFields.length > 0) {
                            dbInfos.push({user: userName, db: connectedDb.db.databaseName, collection: collectionName, fields: changeFields, date: new Date(), id: uniqueId, type: "Query"});
                        }
                    })
            })
        }).then(
        function () {
            dbInfos.push({status: "Completed", user: userName, db: connectedDb.db.databaseName, date: new Date(), id: uniqueId, type: "Query"});
        }).fail(
        function (err) {
            dbInfos.push({status: "Error", error: Utils.getErrorInfo(err), user: userName, db: connectedDb.db.databaseName, date: new Date(), id: uniqueId, type: "Query"});
        }).then(
        function () {
            return ApplaneDB.getLogDB();
        }).then(
        function (logDb) {
            return logDb.mongoUpdate({$collection: "pl.fieldchangelogs", $insert: dbInfos});
        }).then(function () {
            return dbInfos;
        })
}

function getFieldData(collectionName, fieldInfo, db) {
    var d = Q.defer();
    var filter = {};
    filter[fieldInfo.field] = {$exists: true};
    if (fieldInfo.multiple) {
        filter.$where = "!(Array.isArray(this." + fieldInfo.field + "))";
    } else {
        filter.$where = "(Array.isArray(this." + fieldInfo.field + "))";
    }
    db.db.collection(collectionName).count(filter, function (err, count) {
        if (err) {
            d.reject(err);
            return;
        }
        d.resolve(count)
    })
    return d.promise;
}

exports.iterateDB = function (parameters, db, options) {
    if (!options.processid) {
        throw new Error("Async must be true in iterateDB.");
    }
    return db.startProcess([parameters], "NewPorting.iterateDBAsync", options);
}

exports.iterateDBAsync = function (result, db, options) {
    var params = result.data;
    var functionName = params ? params.function : undefined;
    if (!functionName) {
        throw new Error("Please provide value of mandatory parameters [function]");
    }
    var functionParameters = params.params;
    if (functionParameters) {
        if (typeof functionParameters === "string") {
            functionParameters = JSON.parse(functionParameters);
        }
        if (!Array.isArray(functionParameters)) {
            functionParameters = [functionParameters];
        }
    } else {
        functionParameters = [
            {}
        ];
    }
    var filter = params.filter || {};
    if (typeof filter === "string") {
        filter = JSON.parse(filter);
    }
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", $filter: filter, field: {db: 1}, $sort: {db: 1}, $events: false, $modules: false});
        }).then(
        function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs,
                function (index, dbName) {
                    var d = Q.defer();
                    setImmediate(function () {
                        var error = undefined;
                        db.connectUnauthorized(dbName.db).then(
                            function (dbToPort) {
                                if (dbToPort) {
                                    functionParameters[0].db = dbName.db;
                                    return dbToPort.invokeFunction(functionName, functionParameters, options);
                                }
                            }).fail(
                            function (err) {
                                error = Utils.getErrorInfo(err);
                            }).then(
                            function (result) {
                                var update = {_id: Utils.getUniqueObjectId(), status: (error ? "Failed" : "Success") + " for db " + dbName.db};
                                if (result) {
                                    update.message = JSON.stringify(result);
                                }
                                if (error) {
                                    update.error = JSON.stringify(error);
                                }
                                return db.mongoUpdate({$collection: "pl.processes", $update: {$query: {_id: options.processid}, $push: {detail: {
                                    $each: [
                                        update
                                    ]
                                }}}});
                            }).then(
                            function () {
                                d.resolve();
                            }).fail(function (err) {
                                d.reject(err);
                            })
                    })
                    return d.promise;
                })
        }).then(function () {
            console.log("done......");
        })
}

/*
 * PortdataFromTxs used for revert rollback transaction.Case was due to upgreade in branch and pending transactions of daffodil in relationships,entities,communications rollback.Due to this loss of data,we need to port data from backup.
 *      Sachin : 02/05/2015,
 *      Database names will be passed from  and to.
 * */

exports.portDataFromTxs = function (params, db, options) {
    var fromDB = params.fromdb;
    var toDB = params.todb;
    var connectedFromDB = undefined;
    var connectedToDB = undefined;
    return db.connectUnauthorized(fromDB).then(
        function (db1) {
            connectedFromDB = db1;
            return db.connectUnauthorized(toDB);
        }).then(
        function (db1) {
            connectedToDB = db1;
        }).then(
        function () {
            return connectedFromDB.query({$collection: "pl.txs", $filter: {"tx.collection": {$ne: "pl.series"}}});
        }).then(
        function (txsresult) {
            txsresult = txsresult.result;
            return Utils.iterateArrayWithPromise(txsresult, function (index, tx) {
                var txInfo = tx.tx;
                var collection = txInfo.collection;
                var recordId = txInfo.update ? txInfo.update._id : (txInfo.delete ? txInfo.delete._id : undefined);
                if (!recordId) {
                    return;
                }
                var d = Q.defer();
                connectedFromDB.db.collection(collection).findOne({_id: recordId}, function (err, result) {
                    if (err) {
                        d.reject(err);
                        return;
                    }
                    if (!result) {
                        console.log("result not found for id >>>>>>>" + JSON.stringify(txInfo));
                        d.resolve();
                        return;
                    }
                    if (txInfo.update) {
                        connectedToDB.mongoUpdate({$collection: collection, $delete: {_id: result._id}}).then(
                            function () {
                                return connectedToDB.mongoUpdate({$collection: collection, $insert: result});
                            }).then(
                            function () {
                                d.resolve();
                            }).fail(function (err) {
                                d.reject(err);
                            })
                    } else if (txInfo.delete) {
                        connectedToDB.mongoUpdate({$collection: collection, $insert: result}).then(
                            function () {
                                d.resolve();
                            }).fail(function (err) {
                                d.reject(err);
                            })
                    }
                })
                return d.promise;
            })
        })
}

//beta.business.applane.com/rest/invoke?function=NewPorting.iterateDB&parameters=[{"function":"NewPorting.portIdsInRole"}]&token=be2a4eafc061d4777d9565dde04c969e7ff02f65&options={"async":true,"processName":"portIdsInRole"}
//Used for single time only
exports.portIdsInRole = function (params, db, options) {
    return db.query({$collection: "pl.roles", $filter: {id: {$exists: false}}, $fields: {role: 1}, $events: false, $modules: false}).then(function (roles) {
        roles = roles.result;
        return Utils.iterateArrayWithPromise(roles, function (index, role) {
            return db.update({$collection: "pl.roles", $update: {_id: role._id, $set: {id: role.role}}, $events: false, $modules: false});
        })
    })
}

// execute only for single time for populate access users as filter is put in metadata on autoload
exports.portAccessUsers = function (db, options) {
    var dbToConnect = undefined;
    return db.connectUnauthorized("autoload").then(
        function (db1) {
            dbToConnect = db1;
            return dbToConnect.query({$collection: "organizations", $fields: {_id: 1}})
        }).then(function (orgResult) {
            orgResult = orgResult.result;
            return Utils.iterateArrayWithPromise(orgResult, function (index, row) {
                var orgId = row._id;
                return dbToConnect.invokeFunction("Users.populateAccessUsers", [
                    {org_id: orgId}
                ]);
            })
        })
}

exports.portNewRoleForApplications = function (params, originalDB, options) {
    var dbName = params.db;
    if (!dbName) {
        throw new Error("Please provide value of mandatory parameters [db]");
    }
    var applicationId = params.applicationid;
    if (!applicationId) {
        throw new Error("Please provide value of mandatory parameters [applicationid]");
    }
    var filter = params.filter;
    if (filter && typeof filter === "string") {
        filter = JSON.parse(filter);
    }
    if (!filter || Object.keys(filter).length === 0) {
        throw new Error("Filter must be defined.");
    }

    var db = undefined;
    return originalDB.connectUnauthorized(dbName).then(
        function (dbc) {
            db = dbc;
        }).then(
        function () {
            return db.query({$collection: "pl.roles", $filter: filter, $events: false, $modules: false});
        }).then(function (roles) {
            roles = roles.result;
            var roleUpdates = [];
            return db.query({$collection: "pl.rolePrivileges", $filter: {id: {$in: ["Metadata", "User", "Default"]}}, $fields: {id: 1}}).then(
                function (defaultPrivileges) {
                    defaultPrivileges = defaultPrivileges.result;
                    return Utils.iterateArrayWithPromise(roles,
                        function (index, role) {
                            return db.query({$collection: "pl.applications", $filter: {id: applicationId}, $events: false, $modules: false}).then(
                                function (applicationResult) {
                                    applicationResult = applicationResult.result;
                                    return db.query({$collection: "pl.menus", $filter: {collection: {$exists: true}, "application._id": applicationResult[0]._id}, $fields: {collection: 1}, $events: false, $modules: false});
                                }).then(function (menus) {
                                    menus = menus.result;
                                    var privileges = [];
                                    for (var i = 0; i < defaultPrivileges.length; i++) {
                                        var defaultPrivilege = defaultPrivileges[i];
                                        privileges.push({type: "Privilege", privilegeid: defaultPrivilege});
                                    }
                                    var privilegeCollections = {};
                                    if (menus && menus.length > 0) {
                                        for (var i = 0; i < menus.length; i++) {
                                            var collection = menus[i].collection;
                                            if (!privilegeCollections[collection]) {
                                                privilegeCollections[collection] = 1;
                                                var privilege = {type: "Collection", collection: collection, operationInfos: {$insert: [
                                                    {type: "find"},
                                                    {type: "insert"},
                                                    {type: "update"},
                                                    {type: "remove"}
                                                ]}}
                                                privileges.push(privilege);
                                            }
                                        }
                                    }
                                    var roleUpdate = {applicationid: applicationId, default: true};
                                    if (privileges.length > 0) {
                                        roleUpdate.privileges = {$insert: privileges};
                                    }
                                    roleUpdates.push({_id: role._id, $set: roleUpdate});
                                })
                        })
                }).then(function () {
                    return db.update({$collection: "pl.roles", $update: roleUpdates, $events: [
                        {
                            function: "Roles.onPreSave",
                            event: "onSave",
                            pre: true
                        },
                        {
                            function: "Roles.onPostSave",
                            event: "onSave",
                            post: true
                        }
                    ], $modules: {TriggerModule: 1, TransactionModule: 1}});
                })
        })

}
/*

 exports.deleteDuplicateRolesToUser = function (params, db) {
 var query = { "$collection":"pl.users", $filter:{roles:{$exists:true}}, "$fields":{"roles":1}};
 return db.query(query).then(function (users) {
 if (users && users.result && users.result.length > 0) {
 return Utils.iterateArrayWithPromise(users.result,
 function (index, user) {
 var userRoles = user.roles;
 if (userRoles && userRoles.length > 0) {
 var rolesToRemove = [];
 var rolesMap = {};
 for (var i = 0; i < userRoles.length; i++) {
 var userRole = userRoles[i];
 if (userRole.role) {
 var userRoleId = userRole.role.id;
 if (rolesMap[userRoleId]) {
 rolesToRemove.push({_id:userRole._id});
 } else {
 rolesMap[userRoleId] = 1;
 }
 }
 }
 if (rolesToRemove.length > 0) {
 var updates = {$collection:"pl.users", $update:{_id:user._id, $set:{roles:{$delete:rolesToRemove}}}};
 return db.update(updates);
 }
 }
 })
 }
 })
 };*/

//127.0.0.1:5100/rest/invoke?function=NewPorting.iterateDB&parameters=[{"function":"NewPorting.portCollectionsInApplications","filter":{"sandboxDb":{"$exists":true}}}]&token=0c72eb9ec4b7dc91464df8d65d14075621075114&options={"async":true,"processName":"portCollectionsInApplications"}
//used for ensureIndexes in all dbs

exports.portCollectionsInApplications = function (params, db, options) {
    return db.query({$collection: "pl.applications", $fields: {_id: 1}, $events: false}).then(function (applications) {
        applications = applications.result;
        return Utils.iterateArrayWithPromise(applications, function (index, application) {
            return db.query({$collection: "pl.menus", $fields: {collection: 1}, $events: false, $filter: {"application._id": application._id, collection: {$exists: true}}}).then(function (menus) {
                menus = menus.result;
                var applicationCollections = [];
                for (var i = 0; i < menus.length; i++) {
                    var menu = menus[i];
                    var collection = menu.collection;
                    if (!collection || collection.indexOf("pl.") >= 0) {
                        continue;
                    }
                    if (Utils.isExists(applicationCollections, menu, "collection") === undefined) {
                        applicationCollections.push({_id: Utils.getUniqueObjectId(), collection: collection});
                    }
                }
                if (applicationCollections.length > 0) {
                    return db.mongoUpdate({$collection: "pl.applications", $update: {$query: {_id: application._id}, $set: {collections: applicationCollections}}});
                }
            })
        })
    })
}

//127.0.0.1:5100/rest/invoke?function=NewPorting.iterateDB&parameters=[{"function":"NewPorting.portApplicationsInDbs"}]&token=0c72eb9ec4b7dc91464df8d65d14075621075114&options={"async":true,"processName":"portApplicationsInDbs"}
exports.portApplicationsInDbs = function (params, originalDB, options) {
    var dbName = params.db || originalDB.db.databaseName;
    var db = undefined;
    return originalDB.connectUnauthorized(dbName).then(
        function (db1) {
            db = db1;
        }).then(
        function () {
            return db.query({$collection: "pl.users", $fields: {roles: 1}, $filter: {roles: {$exists: true}}})
        }).then(function (users) {
            users = users.result;
            var appIds = [];
            var userRolesIds = [];
            for (var i = 0; i < users.length; i++) {
                var roles = users[i].roles;
                if (roles && roles.length > 0) {
                    for (var j = 0; j < roles.length; j++) {
                        var role = roles[j];
                        if (role.appid && Utils.isExists(appIds, {application: role.appid}, "application") === undefined) {
                            appIds.push({_id: Utils.getUniqueObjectId(), application: role.appid});
                        } else if (role.role && Utils.isExists(userRolesIds, role.role._id) === undefined) {
                            userRolesIds.push(role.role._id);
                        }
                    }
                }
            }
            return db.query({$collection: "pl.applications", $filter: {"roles.role._id": {$in: userRolesIds}}, $fields: {id: 1}}).then(
                function (applications) {
                    applications = applications.result;
                    for (var i = 0; i < applications.length; i++) {
                        var application = applications[i];
                        if (application.id && Utils.isExists(appIds, {application: application.id}, "application") === undefined) {
                            appIds.push({_id: Utils.getUniqueObjectId(), application: application.id});
                        }
                    }
                }).then(function () {
                    if (appIds.length > 0) {
                        return db.getAdminDB().then(function (adminDB) {
                            return adminDB.query({$collection: "pl.dbs", $filter: {db: db.db.databaseName}, $fields: {_id: 1}, $events: false}).then(function (dbResult) {
                                var dbId = dbResult.result[0]._id;
                                return adminDB.update({$collection: "pl.dbs", $update: {_id: dbId, $set: {applications: appIds}}}, {async: true, processName: "ensureIndexForDB : " + dbName});
                            })
                        })
                    }
                })
        })
}

//127.0.0.1:5100/rest/invoke?function=NewPorting.portRoleInAutoloadUsers&parameters=[{"db":"autoload"}]&token=fed08b1692c1d9d63dcc146a6700b300aad38780
exports.portRoleInAutoloadUsers = function (params, originalDB, options) {
    var dbName = params.db || "autoload";
    var db = undefined;
    return originalDB.connectUnauthorized(dbName).then(
        function (db1) {
            db = db1;
        }).then(function () {
            return db.query({$collection: "pl.users", $fields: {username: 1, supplier: 1, vehicleOwner: 1}, $modules: {Role: 0}}).then(function (users) {
                users = users.result;
                return Utils.iterateArrayWithPromise(users, function (index, user) {
                    var vehicleOwner = user.vehicleOwner;
                    var supplier = user.supplier;
                    var roleToInsert = undefined
                    if (user.username === "admin@autoload.com") {
                        roleToInsert = [
                            {appid: "autoload", role: {$query: {id: "autoload"}}}
                        ];
                    } else if (vehicleOwner && supplier) {
                        roleToInsert = [
                            {appid: "autoload", role: {$query: {id: "truck_load"}}}
                        ];
                    } else if (vehicleOwner) {
                        roleToInsert = [
                            {appid: "autoload", role: {$query: {id: "truck_manager"}}}
                        ];
                    } else if (supplier) {
                        roleToInsert = [
                            {appid: "autoload", role: {$query: {id: "load_owner"}}}
                        ];
                    }
                    if (roleToInsert) {
                        return db.update({$collection: "pl.users", $update: [
                            {_id: user._id, $set: {roles: roleToInsert}}
                        ]})
                    }
                })
            })
        })
}