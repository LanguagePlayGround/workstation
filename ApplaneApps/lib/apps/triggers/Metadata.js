/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 30/12/14
 * Time: 12:38 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("ApplaneDB/lib/Constants.js");
var AppsConstant = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");

exports.onPreSave = function (document, db, options) {
    if (!db.user) {
        return;
    }
    var type = document.type;
    var operation = document.updates;
    if (!operation) {
        return;
    }
    var collectionName = document.collection;
    var documentId = document.get("_id");
    if (!documentId) {
        throw new Error("documentId not found in document [" + JSON.stringify(document) + "]");
    }
    var collectionInfo = getCollectionInfo(collectionName);
    var adminDBName = db.getConfig("Admin").DB;
    var adminDB = undefined;
    var changeLogUpdates = undefined;
    return db.txDB(adminDBName).then(
        function (adb) {
            adminDB = adb;
        }).then(
        function () {
            return populateUpdates(document, type, operation, false, db);
        }).then(function (updates) {
            if (!updates || updates.length === 0) {
                return;
            }
            var recordInfo = getRecord(document, collectionInfo);
            var changeLog = getChangeLog(document, recordInfo, collectionInfo, type, db);
            for (var i = 0; i < updates.length; i++) {
                var update = updates[i];
                for (var k in changeLog) {
                    update[k] = changeLog[k];
                }
            }
            return adminDB.update({$collection:"pl.changelogs", $insert:updates, $events:false, $modules:{TransactionModule:1}}).then(function () {
                return synchChildCollections(updates, collectionInfo, document, adminDB, db, options);
            })
        })
}
//handling of not manage user in case of testcase.do not manage logs if user not found.

function isSynchRequired(collectionName, document) {
    //insert /delete can not occurs in case of collection.only referred collections are valid for insert/delete.
    // __System__ Columns donot need to be updated as it is updated by insert in field from field job.Do not need to further again add system field
    if (collectionName === "pl.collections") {
        return document.type === "insert" || document.type === "delete" ? false : true;
    } else if (collectionName === "pl.fields" && document.get("__system__") === true) {
        return false;
    } else {
        var referredCollections = AppsConstant.CollectionReferredCollections;
        for (var i = 0; i < referredCollections.length; i++) {
            var referredCollection = referredCollections[i];
            if (referredCollection.collection === collectionName) {
                return true;
            }
        }
    }
}

function synchChildCollections(changeLogUpdates, collectionInfo, document, adminDB, db, options) {
    var collectionName = document.collection;
    var synchRequired = isSynchRequired(collectionName, document);
    if (!synchRequired) {
        return;
    }
    var updateCollectionName = changeLogUpdates[0].mainFk.value;
    var type = document.type;
    var updateId = document.get("_id");
    return db.query({$collection:"pl.collections", $filter:{parentCollection:updateCollectionName, doNotSynch:{$in:[null, false]}}, $fields:{collection:1}}).then(function (childCollections) {
        childCollections = childCollections.result;
        return Utils.iterateArrayWithPromise(childCollections, function (index, childCollectionInfo) {
            var childCollectionId = childCollectionInfo._id;
            var childCollectionName = childCollectionInfo.collection;
            var finalUpdate = {$collection:collectionName};
            updateOptionsInUpdate(finalUpdate, options);
            if (type === "insert") {
                var dataToInsert = Utils.deepClone(document.updates);
                delete dataToInsert._id;
                dataToInsert.mainTableId = {_id:updateId};
                dataToInsert[collectionInfo.filterField] = {_id:childCollectionId, collection:childCollectionName};
                return updateRecursiveField(dataToInsert, collectionInfo, childCollectionName, db).then(function () {
                    finalUpdate.$insert = dataToInsert;
                    return db.update(finalUpdate);
                })
            } else if (type === "delete") {
                var deleteQuery = {$collection:collectionName, $filter:{"mainTableId._id":updateId, "collectionid._id":childCollectionId}, $fields:{_id:1}};
                return db.query(deleteQuery).then(function (result) {
                    if (result.result.length === 0) {
                        return;
                    }
                    finalUpdate.$delete = result.result[0];
                    return db.update(finalUpdate);
                })
            } else if (type === "update") {
                var filterToGetRecord = collectionName === "pl.collections" ? {_id:childCollectionId} : {"mainTableId._id":updateId, "collectionid._id":childCollectionId};
                var queryToGetUpdateRecord = {$collection:collectionName, $filter:filterToGetRecord, $fields:{_id:1}};
                return db.query(queryToGetUpdateRecord).then(function (result) {
                    if (result.result.length === 0) {
                        //means that the record you want to update is already deleted in child collection.
                        return;
                    }
                    var commitDb = undefined;
                    return adminDB.query({$collection:"pl.dbs", $filter:{db:db.db.databaseName}, $fields:{admindb:1}, $events:false, $modules:false}).then(
                        function (commitresult) {
                            commitDb = commitresult.result[0].admindb;
                        }).then(function () {
                            var row = result.result[0];
                            var childUpdateId = row._id;
                            // Multiple child at same level will reflect change log
                            var changeLogReferences = [];
                            changeLogReferences.push.apply(changeLogReferences, changeLogUpdates);

                            var newUpdate = {};
                            var matchQueryFilter = {collection:collectionName, "fk._id":childUpdateId, type:{$exists:true}, $or:[
                                {db:db.db.databaseName, status:{$in:["Committed", "Non Committed"]}}
                            ]};
                            if (commitDb) {
                                matchQueryFilter.$or.push({db:commitDb, status:"Committed"});
                            }
                            var dataToMatchQuery = {$collection:"pl.changelogs", $filter:matchQueryFilter, $events:false, $sort:{_id:1}};
                            return adminDB.query(dataToMatchQuery).then(
                                function (dataToMatch) {
                                    dataToMatch = dataToMatch.result;
                                    //need to do for matching record with _id which is different for match same field in different child collection.
                                    for (var i = 0; i < dataToMatch.length; i++) {
                                        dataToMatch[i].fk._id = updateId;
                                    }
//                                    console.log("changeLogReferences befor....."+JSON.stringify(changeLogReferences))
//                                    console.log("dataToMatch....."+JSON.stringify(dataToMatch))
                                    require("../Synch.js").populateDataToUpdate(changeLogReferences, dataToMatch);
                                }).then(
                                function () {
//                                    console.log("changeLogReferences after....."+JSON.stringify(changeLogReferences))
                                    return Utils.iterateArrayWithPromise(changeLogReferences,
                                        function (index, changeLog) {
                                            var arrayUpdates = changeLog.arrayUpdates;
                                            var operation = changeLog.operation ? JSON.parse(changeLog.operation) : undefined;
                                            if (arrayUpdates) {
                                                require("../Commit.js").populateArrayUpdateOperation(changeLog, operation, newUpdate);
                                            } else {
                                                var operationKeys = Object.keys(operation);
                                                return Utils.iterateArrayWithPromise(operationKeys, function (index, operationKey) {
                                                    newUpdate[operationKey] = newUpdate[operationKey] || {};
                                                    var valueToUpdate = operation[operationKey];
                                                    var valueKeys = Object.keys(valueToUpdate);
                                                    return Utils.iterateArrayWithPromise(valueKeys, function (index, valueKey) {
                                                        if (collectionInfo.filterField && collectionInfo.filterField === valueKey) {
                                                            //update in collectionid is not allowed.
                                                            throw new Error(collectionInfo.filterField + " can not be updated.");
                                                        } else {
                                                            newUpdate[operationKey][valueKey] = valueToUpdate[valueKey];
                                                            if (collectionInfo.recursiveField && collectionInfo.recursiveField === valueKey) {
                                                                return updateRecursiveField(newUpdate[operationKey], collectionInfo, childCollectionName, db);
                                                            }
                                                        }
                                                    })
                                                })
                                            }
                                        })
                                }).then(function () {
                                    if (Object.keys(newUpdate).length > 0) {
                                        newUpdate._id = childUpdateId;
                                        finalUpdate.$update = newUpdate;
                                        return db.update(finalUpdate);
                                    }
                                })
                        })
                })
            }
        })
    })
}

function updateRecursiveField(update, collectionInfo, childCollectionName, db) {
    var recursiveField = collectionInfo.recursiveField;
    if (recursiveField && update[recursiveField]) {
        var recursiveFieldValue = update[recursiveField];
        var recursiveFieldId = recursiveFieldValue._id;
        var queryFields = {_id:1};
        queryFields[collectionInfo.field] = 1;
        return db.query({$collection:collectionInfo.collection, $filter:{"mainTableId._id":recursiveFieldId, "collectionid.collection":childCollectionName}, $fields:queryFields}).then(function (result) {
            if (result.result.length === 0) {
                // do nothing as data not found means field which is defined as parent field is already deleted in child collection .
                throw new Error("Parent field [" + JSON.stringify(recursiveFieldValue) + "] is already deleted in child collection [" + childCollectionName + "].");
            } else {
                var fieldInfo = result.result[0];
                var updatedFieldValue = {_id:fieldInfo._id};
                updatedFieldValue[collectionInfo.field] = fieldInfo[collectionInfo.field];
                update[recursiveField] = updatedFieldValue;
            }
        })
    } else {
        var d = require("q").defer();
        d.resolve();
        return d.promise;
    }
}

function updateOptionsInUpdate(update, options) {
    if (options.$events !== undefined) {
        update.$events = options.$events;
    }
    if (options.$modules !== undefined) {
        update.$modules = options.$modules;
    }
    if (options.runOnES !== undefined) {
        update.runOnES = options.runOnES;
    }
}


function populateUpdates(document, type, operation, recursion, db) {
    //it will populate operation and arrayUpdates and upatedField
    //incase of delete , no need to keep info
    if (type === "insert") {
        var update = {};
        if (type === "insert") {
            update.operation = JSON.stringify(operation);
        }
        var d = require("q").defer();
        d.resolve([update]);
        return d.promise;
    } else if (type === "delete") {
        return isRecordAlreadyDeleted(document, recursion, db).then(function (alreadyDeleted) {
            if (alreadyDeleted) {
                throw new Error("Record Already deleted for document [" + JSON.stringify(document) + "]");
            }
            var update = {};
            return [update];
        })
    } else if (type === "update" && operation) {
        return populateMultipleUpdates(document, operation, recursion, db);
    }
}

function isRecordAlreadyDeleted(document, recursion, db) {
    if (recursion) {
        var d = require("q").defer();
        d.resolve();
        return d.promise;
    }
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection:"pl.changelogs", $filter:{collection:document.collection, "fk._id":document.get("_id"), type:"delete", db:db.db.databaseName}, $events:false, $modules:false});
        }).then(function (result) {
            if (result.result.length > 0) {
                return true;
            }
        })
}

function populateMultipleUpdates(document, operation, recursion, db) {
    var updates = [];
    var operationKeys = Object.keys(operation);
    return Utils.iterateArrayWithPromise(operationKeys,
        function (index, operationKey) {
            if (operationKey === "_id" || operationKey === "$transient") {
                return;
            }
            if (operationKey !== "$set" && operationKey !== "$unset") {
                throw new Error(operationKey + " is not supported in metadata updates.Operation found [" + JSON.stringify(operation) + "]");
            }
            var valuesToUpdate = operation[operationKey];
            var updatedFields = Object.keys(valuesToUpdate);
            return Utils.iterateArrayWithPromise(updatedFields, function (index, updatedField) {
                if (updatedField === "__txs__" || updatedField === "__history") {
                    return;
                }
                var updatedValue = valuesToUpdate[updatedField];
                if (!recursion && operationKey === "$set" && Utils.isJSONObject(updatedValue) && (updatedValue.$set || updatedValue.$unset || updatedValue.$insert || updatedValue.$update || updatedValue.$delete)) {
                    return handleNestedUpdates(document, updates, updatedField, updatedValue, db);
                } else {
                    var newValuesToUpdate = {};
                    newValuesToUpdate[updatedField] = updatedValue;
                    var newOperation = {};
                    newOperation[operationKey] = newValuesToUpdate;
                    updates.push({operation:JSON.stringify(newOperation), updatedField:updatedField});
                }
            })
        }).then(function () {
            return updates;
        })
}

function handleNestedUpdates(document, updates, updatedField, operation, db) {
    var operationKeys = Object.keys(operation);
    return Utils.iterateArrayWithPromise(operationKeys, function (index, operationKey) {
        if (operationKey === "$set" || operationKey === "unset") {
            throw new Error("$set not supported in $set in operation for metadata changes.Operation found [" + JSON.stringify(operation) + "]");
        }
        var innerType = operationKey.substring(1);  //remove $ from operatoinKey - > $insert--> insert
        var valuesToUpdate = operation[operationKey];
        if (!(Array.isArray(valuesToUpdate))) {
            valuesToUpdate = [valuesToUpdate];
        }
        return Utils.iterateArrayWithPromise(valuesToUpdate, function (index, valueToUpdate) {
            var innerUpdateId = valueToUpdate._id;
            if (!innerUpdateId) {
                throw new Error("_id not found for update [" + JSON.stringify(valuesToUpdate) + "]");
            }
            return populateUpdates(document, innerType, valueToUpdate, true, db).then(function (innerUpdates) {
                if (innerUpdates && innerUpdates.length > 0) {
                    for (var i = 0; i < innerUpdates.length; i++) {
                        var innerUpdatedValue = innerUpdates[i];
                        innerUpdatedValue.arrayUpdates = {_id:innerUpdateId, type:innerType};
                        if (innerUpdatedValue.updatedField) {
                            innerUpdatedValue.arrayUpdates.field = innerUpdatedValue.updatedField;
                        }
                        innerUpdatedValue.updatedField = updatedField;
                    }
                    updates.push.apply(updates, innerUpdates);
                }
            })
        })
    })
}

function getChangeLog(document, recordInfo, collectionInfo, type, db) {
    var documentId = document.get("_id");
    var user = db.user;
    var updates = {db:db.db.databaseName, date:new Date(), status:"Non Committed", type:type};
    if (user) {
        updates.user = {_id:user._id, username:user.username};
    }
    updates.collection = collectionInfo.collection;
    var collectionField = collectionInfo.field;
    var collectionFieldValue = recordInfo[collectionField];
    updates.fk = {_id:documentId, value:collectionFieldValue};
    if (collectionInfo.mainCollection) {
        updates.mainCollection = collectionInfo.mainCollection;
        var filterFieldValue = recordInfo[collectionInfo.filterField];
        updates.mainFk = {_id:filterFieldValue._id, value:filterFieldValue[collectionInfo.mainField]};
    } else {
        updates.mainCollection = updates.collection;
        updates.mainFk = updates.fk;
    }
    if (type === "update") {
        updates.__updateKey = Utils.getUnique();
    }
    return updates;
}

function getRecord(document, collectionInfo) {
    var recordId = document.get("_id");
    var recordInfo = {_id:recordId};
    if (collectionInfo.field) {
        recordInfo[collectionInfo.field] = document.get(collectionInfo.field) || document.getOld(collectionInfo.field);
    }
    if (collectionInfo.filterField) {
        recordInfo[collectionInfo.filterField] = document.get(collectionInfo.filterField) || document.getOld(collectionInfo.filterField);
    }
    return recordInfo;

}

function getCollectionInfo(collectionName) {
    var commitCollections = AppsConstant.CommitCollections;
    for (var i = 0; i < commitCollections.length; i++) {
        var commitCollection = commitCollections[i];
        if (commitCollection.collection === collectionName) {
            return {collection:collectionName, field:commitCollection.field};
        }
        var referredCollections = commitCollection.referredCollections;
        if (referredCollections) {
            for (var j = 0; j < referredCollections.length; j++) {
                var referredCollection = referredCollections[j];
                if (referredCollection.collection === collectionName) {
                    return {collection:collectionName, field:referredCollection.field, filterField:referredCollection.filterfield, recursiveField:referredCollection.recursiveField, mainCollection:commitCollection.collection, mainField:commitCollection.field};
                }
            }
        }
    }
}