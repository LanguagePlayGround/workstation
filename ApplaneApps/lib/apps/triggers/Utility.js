/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 1/7/14
 * Time: 7:18 PM
 * To change this template use File | Settings | File Templates.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Q = require('q');
var Constants = require("ApplaneDB/lib/Constants.js");
var AppsConstant = require("../Constants.js");
var Self = require("./Utility.js");
var CacheService = require("ApplaneDB/lib/CacheService.js");
var QueryUtility = require("ApplaneDB/lib/QueryUtility.js");
var ReferredFks = require("../triggers/ReferredFks.js");

exports.onMergeResult = function (query, result, options, db) {
    if (db.isGlobalDB()) {
        return;
    }
    if (query[Constants.Query.LIMIT] !== undefined && query[Constants.Query.LIMIT] === result.result.length) {
        return;
    }
    var queryFilter = options.query.$filter;
    var _idFilterValue = queryFilter ? queryFilter._id : undefined;
    if (_idFilterValue && (!Utils.isJSONObject(_idFilterValue) || !_idFilterValue.$in) && result.result.length > 0) {
        return;
    }
    return db.getGlobalDB()
        .then(function (adminDB) {
            return adminDB.query(options.query);
        })
        .then(function (adminResult) {
            Self.mergeResult(adminResult.result, result.result, Self.getField(query.$collection));
        })
        .then(
        function () {
            if (options.query.$sort && Object.keys(options.query.$sort).length == 1) {
                var sort = options.query.$sort;
                var key = Object.keys(sort)[0];
                Utils.sort(result.result, sort[key] === -1 ? "desc" : "asc", key);
            }
        })
}

exports.getField = function (collectionName) {
    return getValueFromProperty(collectionName, "field");
}

function getValueFromProperty(collectionName, property) {
    if (Utils.isJSONObject(collectionName)) {
        collectionName = collectionName.collection;
    }
    var commitCollections = AppsConstant.CommitCollections;
    for (var i = 0; i < commitCollections.length; i++) {
        if (commitCollections[i].collection === collectionName) {
            return commitCollections[i][property];
        }
    }
}

exports.getType = function (collectionName) {
    return getValueFromProperty(collectionName, "type");
}

exports.getValue = function (row, collectionName) {
    if (row) {
        var commitCollections = AppsConstant.CommitCollections;
        for (var i = 0; i < commitCollections.length; i++) {
            if (commitCollections[i].collection === collectionName && commitCollections[i].field) {
                return row[commitCollections[i].field];
            }
        }
    }
}

exports.updateAppLock = function (fieldValue, collectionName, db, options) {
    if (!db || (options && options.$applock === false) || !fieldValue) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var dbName = db.db.databaseName;
    return db.update({$collection:Constants.Admin.APP_LOCKS, $delete:{$query:{db:dbName, "lock.type":Self.getType(collectionName), "lock.name":fieldValue}}, $events:false, $modules:{TransactionModule:1}});
}

exports.insertInAppLock = function (fieldValue, collectionName, db, options, recursiveCount) {
    if (!db || (options && options.$applock === false) || !fieldValue) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var dbName = db.db.databaseName;
    var fieldType = Self.getType(collectionName);
    var insert = {__createdon:new Date(), lock:{type:fieldType, name:fieldValue}, db:dbName};
    if (db.user) {
        insert.user = {_id:db.user._id, username:db.user.username};
    }
    return db.update({$collection:Constants.Admin.APP_LOCKS, $insert:insert, $events:false, $modules:{TransactionModule:1}}).fail(function (e) {
        if (e.code === 11000) {
            if (recursiveCount && recursiveCount > 100) {
                return db.query({$collection:Constants.Admin.APP_LOCKS, $filter:{db:dbName, "lock.type":fieldType, "lock.name":fieldValue}}).then(function (appLockResult) {
                    var lockUser = appLockResult.result[0];
                    var lockUsername = "Someone";
                    if (lockUser && lockUser.user && lockUser.user.username) {
                        lockUsername = lockUser.user.username;
                    }
                    throw new Error(lockUsername + " is already work on collection [" + collectionName + "] with value [" + fieldValue + "] in db [" + dbName + "].Please try after some time.");
                })
            } else {
                recursiveCount = (recursiveCount || 0) + 1;
                var d1 = Q.defer();
                setTimeout(function () {
                    Self.insertInAppLock(fieldValue, collectionName, db, options, recursiveCount).then(
                        function () {
                            d1.resolve();
                        }).fail(function (err) {
                            d1.reject(err);
                        })
                }, 100)
                return d1.promise;
            }
        } else {
            throw e;
        }
    })
}

exports.getDBtoServeData = function (updateId, collectionName, db) {
    if (!db) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    return db.collection(collectionName).then(
        function (collection) {
            return collection.count({_id:updateId});
        }).then(function (count) {
            if (count > 0) {
                return db;
            } else {
                return db.getGlobalDB().then(function (globalDB) {
                    if (globalDB) {
                        return Self.getDBtoServeData(updateId, collectionName, globalDB);
                    }
                })
            }
        })
}

exports.populateCollectionData = function (filter, collectionName, db, options) {
    var data = {};
    return db.query({$collection:collectionName, $filter:filter, $fields:{__history:0, __txs__:0}, $events:false}).then(
        function (result) {
            result = result.result;
            if (!filter || result.length === 0) {
                data[collectionName] = result;
                return;
            }
            var mainData = result[0];
            if (collectionName === "pl.collections") {
                CacheService.removeCollectionCacheData(mainData);
            }
            data[collectionName] = mainData;
            var commitCollections = AppsConstant.CommitCollections;
            return Utils.iterateArrayWithPromise(commitCollections, function (index, commitCollection) {
                if (commitCollection.collection === collectionName && commitCollection.referredCollections) {
                    var referredCollections = commitCollection.referredCollections;
                    return Utils.iterateArrayWithPromise(referredCollections, function (index, referredCollection) {
                        var referredCollectionName = referredCollection.collection;
                        if (referredCollectionName === "pl.referredfks" && (!options || !options.referredfks)) {
                            return;
                        }
                        var referredCollectionFilter = {};
                        referredCollectionFilter[referredCollection.filterfield + "._id"] = mainData._id;
                        return getReferredCollectionData(referredCollectionName, referredCollectionFilter, db, options).then(
                            function (referredResult) {
                                data[referredCollectionName] = referredResult.result;
                            })
                    })
                }
            })
        }).then(function () {
            return data;
        })
}

function getReferredCollectionData(collectionName, filter, db, options) {
    var fieldExtraInfo = options && options.recursiveFields ? getFieldExtraInfo(collectionName) : undefined;
    if (fieldExtraInfo && fieldExtraInfo.recursiveField) {
        filter[fieldExtraInfo.recursiveField] = null;
        var recursion = {};
        recursion[fieldExtraInfo.recursiveField] = "_id";
        recursion.$alias = fieldExtraInfo.recursiveDataField;
        return db.query({$collection:collectionName, $filter:filter, $fields:{__history:0, __txs__:0}, $events:false, $recursion:recursion});
    } else {
        return db.query({$collection:collectionName, $filter:filter, $fields:{__history:0, __txs__:0}, $events:false});
    }
}

function getDataToCopy(updateId, fieldValue, collectionName, db, options) {
    var dataToCopy = {};
    dataToCopy.serveDB = db.db.databaseName;
    return Self.insertInAppLock(fieldValue, collectionName, db, options).then(
        function () {
            return Self.populateCollectionData({_id:updateId}, collectionName, db, options);
        }).then(
        function (data) {
            dataToCopy.data = data;
        }).then(
        function () {
            return Self.updateAppLock(fieldValue, collectionName, db, options);
        }).then(function () {
            return dataToCopy;
        })
}

function copyDataOnLocal(updateId, fieldValue, collectionName, db, serveDB, options) {
    return getDataToCopy(updateId, fieldValue, collectionName, serveDB, options).then(
        function (dataToCopy) {
            return addVersionInData(updateId, fieldValue, collectionName, dataToCopy, serveDB).then(
                function () {
                    return getDBInfo(db);
                }).then(
                function (dbInfo) {
                    if (!dbInfo || !dbInfo.admindb || dbInfo.admindb === dataToCopy.serveDB) {
                        return;
                    }
                    //TODO validate commitdb and globaldb must be same..on saving db.
                    return updateCommitDbData(dbInfo.admindb, dataToCopy, updateId, fieldValue, collectionName, db, options);
                }).then(function () {
                    return updateData(dataToCopy, updateId, fieldValue, collectionName, db);
                })
        })
}

function addVersionInData(updateId, fieldValue, collectionName, dataToCopy, db) {
    return db.getAdminDB().then(
        function (adminDB) {
            var query = {$collection:"pl.changelogs", $filter:{mainCollection:collectionName, "mainFk._id":updateId, db:db.db.databaseName, version:{$exists:true}}, $group:{_id:null, version:{$max:"$version"}}, $events:false};
//            console.log('query>>>>>>>>' + JSON.stringify(query));
            return adminDB.query(query);
        }).then(
        function (versionResult) {
            if (versionResult.result.length === 0) {
                throw new Error("Version not found in changeLogs for collection [" + collectionName + "] with value [" + fieldValue + "] in db [" + db.db.databaseName + "]");
            }
            dataToCopy.version = versionResult.result[0].version;
        })
}

function getDBInfo(db) {
    return db.getAdminDB().then(
        function (adminDB) {
            return adminDB.query({$collection:"pl.dbs", $fields:{globalDb:1, admindb:1}, $filter:{db:db.db.databaseName}});
        }).then(
        function (result) {
            return result.result[0];
        })
}

function updateCommitDbData(commitDbName, dataToCopy, updateId, fieldValue, collectionName, db, options) {
    var commitDb = undefined;
    return db.connectUnauthorized(commitDbName).then(
        function (cdb) {
            commitDb = cdb;
            return Self.insertInAppLock(fieldValue, collectionName, commitDb, options);
        }).then(
        function () {
            return updateData(dataToCopy, updateId, fieldValue, collectionName, commitDb);
        }).then(function () {
            return Self.updateAppLock(fieldValue, collectionName, commitDb, options);
        })
}

function updateData(dataToCopy, updateId, fieldValue, mainCollectionName, db) {
    var data = dataToCopy.data;
    var collectionNames = Object.keys(data);
    return Utils.iterateArrayWithPromise(collectionNames,
        function (index, collectionName) {
            return db.update({$collection:collectionName, $insert:data[collectionName], $events:false, $modules:{TransactionModule:1}});
        }).then(
        function () {
            return ReferredFks.repopulateReferredFks({collection:fieldValue}, db);
        }).then(function () {
            if (dataToCopy.version !== undefined) {
                //TODO if not sandbox db then insert entry in pl.changelogs
                return db.getAdminDB().then(function (adminDB) {
                    var update = {$collection:"pl.changelogs", $events:false, $modules:{TransactionModule:1},
                        $insert:{
                            db:db.db.databaseName,
                            user:{_id:db.user._id, username:db.user.username},
                            date:new Date(),
                            status:"Synched",
                            version:dataToCopy.version,
                            collection:mainCollectionName,
                            fk:{_id:updateId, value:fieldValue},
                            mainCollection:mainCollectionName,
                            mainFk:{_id:updateId, value:fieldValue},
                            copy:true
                        }
                    };
                    return adminDB.update(update);
                })
            }
        })
}

exports.getVersion = function (adminDB, versionInfo) {
    if (versionInfo.version !== undefined) {
        var d = require("q").defer();
        d.resolve();
        return d.promise;

    }
    return adminDB.update({$collection:"pl.versions", $insert:{date:new Date()}, $events:false, $modules:{SequenceModule:1, TransactionModule:1}}).then(
        function (versionResult) {
            var newVersion = versionResult["pl.versions"].$insert[0].version;
            versionInfo.version = parseInt(newVersion);
        })
}

exports.validateData = function (document, collection, field, db) {
    var documentType = document.type;
    if (field === "_id" || (documentType !== "insert" && documentType !== "update")) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var value = document.get(field);
    if (value === undefined) {
        throw new Error("Please provide value of mandatory parameter [" + field + "] in collection [" + collection + "]");
    }
    if (document.type === "update") {
        var updatedFields = document.getUpdatedFields();
        if (!updatedFields || updatedFields.indexOf(field) === -1 || Utils.deepEqual(value, document.getOld(field))) {
            var d = Q.defer();
            d.resolve();
            return d.promise;
        }
    }
    var filter = {};
    filter[field] = value;
    var query = {$collection:collection, $filter:filter, $fields:{_id:1}, $limit:2};
    return db.query(query).then(function (result) {
        result = result.result;
        if (result.length > 0) {
            for (var i = 0; i < result.length; i++) {
                var row = result[i];
                if (documentType !== "update" || !Utils.deepEqual(row._id, document.get("_id"))) {
                    throw new Error("Record already exist in collection [" + collection + "] for field [" + field + "] having value [" + value + "].");
                }
            }
        }
    })
}

exports.copyCollectionDefinition = function (document, db, options) {
    var parentCollectionName = document.get(Constants.Admin.Collections.PARENT_COLLECTION);
    var parentCollectionId = undefined;
    var collectionId = document.get("_id");
    var mainCollectionName = document.get(Constants.Admin.Collections.COLLECTION);
    return db.query({$collection:"pl.collections", $fields:{_id:1}, $filter:{collection:parentCollectionName}}).then(
        function (result) {
            if (result.result.length === 0) {
                throw new Error("parent Collection [" + parentCollectionName + "] does not exist.");
            }
            parentCollectionId = result.result[0]._id;
            return Self.getDBtoServeData(parentCollectionId, "pl.collections", db);
        }).then(
        function (serveDB) {
            if (!serveDB) {
                return;
            }
            options.recursiveFields = true;
            return getDataToCopy(parentCollectionId, parentCollectionName, "pl.collections", serveDB, options);
        }).then(
        function (dataToCopy) {
            var data = dataToCopy.data;
            var collectionNames = Object.keys(data);
            return Utils.iterateArrayWithPromise(collectionNames,
                function (index, collectionName) {
                    var valueToInsert = data[collectionName];
                    if (collectionName === "pl.collections") {
                        var updatedFields = document.getUpdatedFields();
                        if (updatedFields) {
                            for (var i = 0; i < updatedFields.length; i++) {
                                delete valueToInsert[updatedFields[i]];
                            }
                        }
                        if (Object.keys(valueToInsert).length > 0) {
                            return db.update({$collection:collectionName, $update:{_id:collectionId, $set:valueToInsert}, $events:[
                                {
                                    function:"Metadata.onPreSave",
                                    event:"onSave",
                                    pre:true
                                }
                            ], $modules:{TriggerModule:1, TransactionModule:1}});
                        }
                    } else {
                        var fieldExtraInfo = getFieldExtraInfo(collectionName);
                        if (fieldExtraInfo && fieldExtraInfo.recursiveField) {
                            return copyFieldsDefinition(collectionId, mainCollectionName, collectionName, undefined, valueToInsert, fieldExtraInfo, db);
                        } else {
                            for (var i = 0; i < valueToInsert.length; i++) {
                                var row = valueToInsert[i];
                                var rowId = row._id;
                                delete row._id;
                                row.collectionid._id = collectionId;
                                row.collectionid.collection = mainCollectionName;
                                row.mainTableId = {_id:rowId};
                            }
                            return db.update({$collection:collectionName, $insert:valueToInsert, $events:[
                                {
                                    function:"Metadata.onPreSave",
                                    event:"onSave",
                                    pre:true
                                }
                            ], $modules:{TriggerModule:1, TransactionModule:1}});
                        }
                    }
                })
        }).then(
        function () {
            return ReferredFks.repopulateReferredFks({collection:document.get("collection")}, db);
        }).then(function () {
            return CacheService.clearCache(collectionId, db, true);
        })
}

function getFieldExtraInfo(collectionName) {
    var referredCollections = AppsConstant.CollectionReferredCollections;
    for (var i = 0; i < referredCollections.length; i++) {
        var referredCollection = referredCollections[i];
        if (referredCollection.collection === collectionName && referredCollection.recursiveField) {
            return referredCollection;
        }
    }
}

function copyFieldsDefinition(collectionId, mainCollectionName, collectionName, parentField, valuesToInsert, fieldExtraInfo, db) {
    return Utils.iterateArrayWithPromise(valuesToInsert,
        function (index, row) {
            var rowId = row._id;
            delete row._id;
            row.collectionid._id = collectionId;
            row.collectionid.collection = mainCollectionName;
            row.mainTableId = {_id:rowId};
            if (parentField) {
                row[fieldExtraInfo.recursiveField] = parentField;
            }
            var innerValuesToInsert = row[fieldExtraInfo.recursiveDataField];
            delete row[fieldExtraInfo.recursiveDataField];
            var update = {$collection:collectionName, $insert:row, $events:{
                function:"Metadata.onPreSave",
                event:"onSave",
                pre:true
            }, $modules:{TriggerModule:1, TransactionModule:1}};
            return db.update(update).then(function (result) {
                if (innerValuesToInsert && innerValuesToInsert.length > 0) {
                    var newFieldId = result[collectionName].$insert[0]._id;
                    var newParentField = {_id:newFieldId};
                    newParentField[fieldExtraInfo.field] = row[fieldExtraInfo.field];
                    return copyFieldsDefinition(collectionId, mainCollectionName, collectionName, newParentField, innerValuesToInsert, fieldExtraInfo, db);
                }
            })
        })
}

exports.updateLocalData = function (updateId, fieldValue, db, collectionName, options) {
    if (db.isGlobalDB()) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    return Self.insertInAppLock(fieldValue, collectionName, db, options).then(
        function () {
            return Self.getDBtoServeData(updateId, collectionName, db);
        }).then(
        function (serveDB) {
            if (!serveDB || serveDB.db.databaseName === db.db.databaseName) {
                return;
            }
            return copyDataOnLocal(updateId, fieldValue, collectionName, db, serveDB, options);
        })
}

exports.getlocalQuery = function (queryFilter, collection, mainCollection, field) {
    var fieldWith_Id = field + "._id";
    var fieldWithCollection = field + ".collection";
    var fieldWithId = field + ".id";
    var localQuery = {};
    var localQueryFilter = {};
    if (queryFilter[field] || queryFilter[fieldWith_Id] || queryFilter[fieldWithCollection] || queryFilter[fieldWithId]) {
        localQuery.collection = mainCollection;
        localQuery.field = field;
        if (queryFilter[field]) {
            localQueryFilter._id = Utils.isJSONObject(queryFilter[field]) ? queryFilter[field]._id : queryFilter[field];
        } else if (queryFilter[fieldWith_Id]) {
            localQueryFilter._id = queryFilter[fieldWith_Id];
        } else if (queryFilter[fieldWithCollection]) {
            localQueryFilter.collection = queryFilter[fieldWithCollection];
        } else if (queryFilter[fieldWithId]) {
            localQueryFilter.id = queryFilter[fieldWithId];
        }
    } else {
        localQuery.collection = collection;
        localQuery.field = field;
        if (queryFilter._id) {
            localQueryFilter._id = queryFilter._id;
        } else if (queryFilter.id) {
            localQueryFilter.id = queryFilter.id;
        } else if (queryFilter["mainTableId._id"]) {
            localQueryFilter["mainTableId._id"] = queryFilter["mainTableId._id"];
        }
    }
    localQuery.filter = localQueryFilter;
    return localQuery;
}

exports.populateMergedResult = function (result, db, options) {
    if (db.isGlobalDB()) {
        return;
    }
    var adminDb = undefined;
    return db.getGlobalDB().then(
        function (adb) {
            adminDb = adb;
            return db.query({$collection:"pl.collections", $fields:{_id:1}, $events:false, $modules:false});    //query from localdb
        }).then(
        function (collectionsResult) {
            var collectionIds = [];
            for (var i = 0; i < collectionsResult.result.length; i++) {
                collectionIds.push(collectionsResult.result[i]._id);
            }
            var queryReference = QueryUtility.getQueryClone(options.query);
            if (queryReference.$filter) {
                queryReference.$filter.$and = queryReference.$filter.$and || [];
                queryReference.$filter.$and.push({"collectionid._id":{$nin:collectionIds}});
            } else {
                queryReference.$filter = {"collectionid._id":{$nin:collectionIds}};
            }
            return adminDb.query(queryReference);
        }).then(
        function (adminResult) {
            result.result.push.apply(result.result, adminResult.result);
        })
}

exports.populateResult = function (localQuery, result, db, options) {
    if (db.isGlobalDB()) {
        return;
    }
    var inFilterField = localQuery.field;
    var filterValue = getFilterValue(options.query.$filter, inFilterField);
    var inFilterExist = false;
    if (filterValue && Utils.isJSONObject(filterValue) && (filterValue.$in)) {
        inFilterExist = true;
    }
    if (!inFilterExist && result.result.length > 0) {
        return;
    }
    return db.getGlobalDB().then(
        function (globalDB) {
            if (inFilterExist) {
                var queryClone = QueryUtility.getQueryClone(options.query);
                var filterValue = getFilterValue(queryClone.$filter, inFilterField);
                return mergeInFilterResult(result, inFilterField, filterValue.$in, queryClone, db, globalDB);
            } else {
                return mergeAdminResult(localQuery, result, options.query, db, globalDB);
            }
        })

}

function getFilterValue(queryFilter, inFilterField) {
    return queryFilter ? queryFilter[inFilterField] || queryFilter[inFilterField + "._id"] || queryFilter[inFilterField + ".id"] || queryFilter[inFilterField + ".collection"] : undefined;

}

function mergeInFilterResult(result, inFilterField, filterValue, query, db, globalDB) {
    var collectionToQuery = inFilterField === "application" ? "pl.applications" : "pl.collections";
    return db.query({$collection:collectionToQuery, $events:false, $modules:false, $fields:{_id:1}, $filter:{_id:{$in:filterValue}}}).then(
        function (localData) {
            localData = localData.result;
            for (var i = 0; i < localData.length; i++) {
                var index = Utils.isExists(filterValue, localData[i]._id);
                if (index !== undefined) {
                    filterValue.splice(index, 1);
                }
            }
            if (filterValue.length > 0) {
                return globalDB.query(query);
            }
        }).then(function (adminResult) {
            if (adminResult) {
                Self.mergeResult(adminResult.result, result.result/*, Self.getField(collectionToQuery)*/);
            }
        })
        .then(
        function () {
            if (query.$sort && Object.keys(query.$sort).length == 1) {
                var sort = query.$sort;
                var key = Object.keys(sort)[0];
                Utils.sort(result.result, sort[key] ? "asc" : "desc", key);
            }
        })
}

function mergeAdminResult(localQuery, result, query, db, globalDB) {
    return db.collection(localQuery.collection).then(
        function (collection) {
            return collection.count(localQuery.filter);
        }).then(
        function (count) {
            if (count == 0) {
                return globalDB.query(query);
            }
        }).then(function (adminResult) {
            if (adminResult) {
                for (var k in adminResult) {
                    result[k] = adminResult[k];
                }
            }
        })
}

exports.mergeResult = function (adminData, localData, fieldToMatch) {
    for (var i = 0; i < adminData.length; i++) {
        var index = Utils.isExists(localData, adminData[i], "_id");
        if (index === undefined) {
            //check on the basis of fieldToMatch, in case of qviews, it should be matched on qview id but in case of application it should match on _id,
            //if it match with _id or unique property then it should be considred as match
            if (fieldToMatch) {
                index = Utils.isExists(localData, adminData[i], fieldToMatch);
            }
            if (index === undefined) {
                localData.push(adminData[i]);
            }
        }
    }
}

exports.insertDefaultData = function (document, db) {
    if (document.type === "insert") {
        document.set(Constants.Admin.Collections.DB, db.db.databaseName);
    }
}

exports.checkFilterInQuery = function (query, field) {
    var queryFilter = query.$filter;
    if (!queryFilter) {
        throw new Error("filter is mandatory in query [" + JSON.stringify(query) + "]");
    }
    if (queryFilter._id || queryFilter["mainTableId._id"] || queryFilter[field] || queryFilter[field + "._id"] || queryFilter["id"] || queryFilter[field + ".collection"] || queryFilter[field + ".id"]) {
        return;
    }
    var errMsg = "Atleast one of them [_id,id," + field + "] in filter is mandatory in query.Query found [" + JSON.stringify(query) + "]";
    throw new Error(errMsg);
}

exports.applyIndexes = function (collectionWiseIndexes, background, db, errors) {
    return Utils.iterateArrayWithPromise(collectionWiseIndexes,
        function (index, collectionWiseIndex) {
            var collectionName = collectionWiseIndex.collection;
            var collectionIndexes = collectionWiseIndex.indexes;
            var collectionObj = undefined;
            return db.collection(collectionName).then(
                function (c) {
                    collectionObj = c;
                    return collectionObj.getIndexes();
                }).then(
                function (indexesAlreadyApplied) {
                    return Utils.iterateArrayWithPromise(indexesAlreadyApplied,
                        function (index, appliedIndex) {
                            if (appliedIndex.name !== "_id_") {
                                var existIndex = isIndexAlreadyExists(collectionIndexes, appliedIndex);
                                if (existIndex === undefined) {
                                    return collectionObj.dropIndex(appliedIndex["name"]);
                                } else {
                                    collectionIndexes.splice(existIndex, 1);
                                }
                            }
                        })
                }).then(
                function () {
                    return ensureIndexes(collectionIndexes, background, collectionObj, errors);
                })
        })
}

function ensureIndexes(indexes, background, collectionObj, errors) {
    var collectionName = collectionObj.getValue("collection");
    return Utils.iterateArrayWithPromise(indexes, function (index, indexInfo) {
        var indexes = indexInfo.indexes;
        if (indexes && typeof indexes === "string") {
            indexes = JSON.parse(indexes);
        }
        var properties = {name:indexInfo.name};
        if (indexInfo.unique) {
            properties.unique = true;
        }
        if (background !== false && indexInfo.background) {
            properties.background = true;
        }
        if (indexInfo.expireAfterSeconds !== undefined) {
            properties.expireAfterSeconds = indexInfo.expireAfterSeconds;
        }
        if (indexInfo.dropDups) {
            properties.dropDups = true;
        }
        if (indexInfo.sparse) {
            properties.sparse = true;
        }
        return collectionObj.ensureIndex(indexes, properties).fail(function (err) {
            if (errors) {
                errors.push({collection:collectionName, error:Utils.getErrorInfo(err), indexes:indexes, properties:properties});
            } else {
                throw err;
            }
        })
    })
}

function isIndexAlreadyExists(indexes, appliedIndex) {
    if (indexes && indexes.length > 0) {
        for (var i = 0; i < indexes.length; i++) {
            var index = indexes[i];
            var indexesToApplied = index.indexes;
            if (indexesToApplied && typeof indexesToApplied === "string") {
                indexesToApplied = JSON.parse(indexesToApplied);
            }
            if (index.name === appliedIndex.name && equal(index.dropDups, appliedIndex.dropDups) && equal(index.background, appliedIndex.background) && equal(index.unique, appliedIndex.unique) && index.expireAfterSeconds === appliedIndex.expireAfterSeconds && index.sparse === appliedIndex.sparse && Utils.deepEqual(indexesToApplied, appliedIndex.key)) {
                return i;
            }
        }
    }
}

function equal(first, second) {
    if (first === second || (first === undefined && second === false) || (first === false && second === undefined)) {
        return true;
    }
}

exports.loadCollectionAndCreateLock = function (value, collectionName, db, otherDB) {
    if (!value) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    return loadCollection(value, collectionName, db, otherDB).then(
        function () {
            return Self.insertInAppLock(value, collectionName, db);
        }).then(
        function () {
            if (otherDB) {
                return Self.insertInAppLock(value, collectionName, otherDB);
            }
        })
}

exports.removeLockAndClearCache = function (value, collectionName, db, otherDB) {
    if (!value) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    return Self.updateAppLock(value, collectionName, db).then(
        function () {
            if (otherDB) {
                return Self.updateAppLock(value, collectionName, otherDB);
            }
        }).then(
        function () {
            if (collectionName === "pl.collections") {
                return CacheService.clearCache(value, db).then(
                    function () {
                        if (otherDB) {
                            return CacheService.clearCache(value, otherDB);
                        }
                    })
            }
        }).then(
        function () {
            if (collectionName === "pl.functions") {
                return CacheService.clearFunctionCache(value, db).then(
                    function () {
                        if (otherDB) {
                            return CacheService.clearFunctionCache(value, otherDB);
                        }
                    })
            }
        })
}

function loadCollection(fieldValue, collectionName, db, otherDB) {
    if (collectionName === "pl.collections") {
        return db.collection(fieldValue).then(
            function () {
                if (otherDB) {
                    return otherDB.collection(fieldValue);
                }
            })
    } else {
        var d = Q.defer();
        d.resolve()
        return d.promise;
    }
}

exports.addPropertiesInFilter = function (parameters, filter, db) {
    if (!parameters.type) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var mainCollectionName = Self.getMainCollection(parameters.type);
    filter.mainCollection = mainCollectionName;
    var value = parameters.value;
    if (!value) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var collectionFilter = {};
    collectionFilter[Self.getField(mainCollectionName)] = value;
    return db.query({$collection:mainCollectionName, $filter:collectionFilter, $fields:{_id:1}}).then(function (result) {
        if (result.result.length === 0) {
            throw new Error("Record not found for value [" + value + "] in collection [" + mainCollectionName + "]");
        }
        filter["mainFk._id"] = result.result[0]._id;
    })
}

exports.getMainCollection = function (type) {
    var commitCollections = AppsConstant.CommitCollections;
    for (var i = 0; i < commitCollections.length; i++) {
        if (commitCollections[i].type === type) {
            return commitCollections[i].collection;
        }
    }
}


exports.getIndentifer = function (inputString) {
    if (inputString) {
        var outputString = inputString.replace(/([~!@#$%^&*()_+=`{}\[\]\|\\:;'<>,.\/? ])+/g, '-').replace(/^(-)+|(-)+$/g, '');
        outputString = outputString ? outputString.toLowerCase() : "";
        return outputString;
    }
}
