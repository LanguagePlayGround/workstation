var SELF = require("./CacheService.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("./Constants.js");
var DBConstants = require("./DBConstants.js");
var Q = require("q");
var ProcessCache = require("./cache/ProcessCache.js");
var ApplaneDB = require("./DB.js");
var Config = require("../Config.js").config;


var keysToCacheInCollection = {
    fields:Constants.Admin.FIELDS,
    actions:Constants.Admin.ACTIONS,
    formgroups:Constants.Admin.FORM_GROUPS,
    events:Constants.Admin.EVENTS,
    workflowevents:Constants.Admin.WORK_FLOW_EVENTS
};

exports.clearFunctionCache = function (functionName, db) {
    db.clearCache("__function__" + functionName);
    if (Config.ProcessCache && Config.ProcessCache.CACHE && Config.ProcessCache.FUNCTION !== undefined) {
        return ProcessCache.clearCacheForAllServer("FUNCTION", db.db.databaseName, functionName);
    } else {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
};

exports.clearCache = function (collectionName, db, byId) {
    var filter = {};
    if (byId) {
        filter._id = collectionName;
    } else {
        filter.collection = collectionName;
    }
    var collectionInfo = undefined;
    return removeCollectionCacheFromDatabase(filter, db.db).then(
        function (cinfo) {
            collectionInfo = cinfo;
            return db.getGlobalDB();
        }).then(
        function (globalDB) {
            if (globalDB) {
                return removeCollectionCacheFromDatabase(filter, globalDB.db);
            }
        }).then(
        function () {
            if (collectionInfo) {
                db.clearCache("__collection__" + collectionInfo.collection);
                if (Config.ProcessCache && Config.ProcessCache.CACHE && Config.ProcessCache.COLLECTION !== undefined) {
                    return ProcessCache.clearCacheForAllServer("COLLECTION", db.db.databaseName, collectionInfo.collection);
                }
            }
        }).then(function () {
            return {msg:"Cache cleared", collectionName:collectionName, byId:byId};
        });
};

function removeCollectionCacheFromDatabase(filter, mongoDB) {
    var D = Q.defer();
    var mongoCollection = mongoDB.collection("pl.collections");
    mongoCollection.findOne(filter, {_id:1, collection:1}, function (err, collectionInfo) {
        if (err) {
            D.reject(err);
            return;
        }
        if (!collectionInfo) {
            D.resolve();
            return;
        }
        var idFilter = {"_id":collectionInfo._id};
        var updates = {$unset:{qviews:"", indexes:""}};
        for (var k in keysToCacheInCollection) {
            updates.$unset[k] = "";
        }
        saveMetaData("pl.collections", idFilter, updates, mongoDB).then(
            function () {
                D.resolve(collectionInfo);
            }).fail(function (err) {
                D.reject(err);
            })
    });
    return D.promise;
}

function loadDataFromProcessCache(bucket, mainKey, subKey) {
    var cacheValue = ProcessCache.getCache(bucket, mainKey, subKey);
    if (cacheValue) {
        var cacheKey = cacheValue.__cacheKey__;
        if (cacheKey) {
            return loadDataFromProcessCache(bucket, cacheKey.mainKey, cacheKey.subKey);
        } else {
            return cacheValue;
        }
    }
}

/*
 *   Priority of loading collection is high for db than from process.
 *   This is for handling special cases like events where maintaining data consistency is important.
 *   eg : If priority of process is made higher, then inconsistent behaviour can occur if cache is cleared while pre/post events have not executed.
 *   dbToCache variable will be used to set cache at db level as cache on db level must be set in only currentdb.not in global db.
 */
exports.loadCollection = function (collectionName, db) {
    var processCollectionCache = false;
    if (Config.ProcessCache && Config.ProcessCache.CACHE && Config.ProcessCache.COLLECTION !== undefined) {
        processCollectionCache = true;
    }
    var info = loadData("COLLECTION", "__collection__", processCollectionCache, collectionName, db, db);
    if (Q.isPromise(info)) {
        return info.then(function (collectionInfo) {
            if (!collectionInfo) {
                collectionInfo = getDefaultInfo("COLLECTION", "__collection__", processCollectionCache, collectionName, db);
            }
            return collectionInfo;
        })
    } else {
        if (!info) {
            info = getDefaultInfo("COLLECTION", "__collection__", processCollectionCache, collectionName, db);
        }
        var d = Q.defer();
        d.resolve(info);
        return d.promise;
    }
};

function getDefaultInfo(bucket, dbCacheKey, processCache, key, db) {
    var info = undefined;
    if (DBConstants.basicCollections[key]) {
        info = DBConstants.basicCollections[key];
    } else {
        info = {collection: key};
    }
    db.setCache(dbCacheKey + key, info);
    if (processCache) {
        Utils.freeze(info, {skipTop: true, skipKeys: {events: 1}});
        ProcessCache.setCache(bucket, info, db.db.databaseName, key);
    }
    return info;
}

exports.loadFunction = function (functionName, db) {
    var processFunctionCache = false;
    if (Config.ProcessCache && Config.ProcessCache.CACHE && Config.ProcessCache.FUNCTION !== undefined) {
        processFunctionCache = true;
    }
    var functionInfo = loadData("FUNCTION", "__function__", processFunctionCache, functionName, db, db);
    if (Q.isPromise(functionInfo)) {
        return functionInfo.then(function (info) {
            if (!info) {
                throw new Error("Function " + functionName + " not found.");
            }
            return info;
        })
    } else {
        if (!functionInfo) {
            throw new Error("Function " + functionName + " not found.");
        }
        var d = Q.defer();
        d.resolve(functionInfo);
        return d.promise;
    }
};

function loadData(bucket, dbCacheKey, processCache, key, dbToCache, db) {
    var cacheValue = dbToCache.getCache(dbCacheKey + key);
    if (processCache) {
        cacheValue = loadDataFromProcessCache(bucket, db.db.databaseName, key);
    }
    if (cacheValue) {
        return cacheValue;
    }
    return loadDataFromDB(bucket, key, db).then(function (data) {
        if (data) {
            dbToCache.setCache(dbCacheKey + key, data);
            if (processCache) {
                ProcessCache.setCache(bucket, data, db.db.databaseName, key);
            }
            return data;
        }
        return loadDataFromGlobalDB(bucket, dbCacheKey, processCache, key, dbToCache, db);
    })
}

function loadDataFromDB(bucket, key, db) {
    if (bucket === "COLLECTION") {
        return loadCollectionFromDB(key, db).then(function (collectionInfo) {
            if (collectionInfo) {
                ApplaneDB.populateCollectionInfos(collectionInfo);
            }
            return collectionInfo;
        })
    } else if (bucket === "FUNCTION") {
        return loadFunctionFromDB(key, db);    }
}

/*
 *  __cacheKey__ is cache value that is stored if data is not in current db but in globaldb
 *  In such a case, cache value for db in which data is available i.e globaldb from which data is returned.
 */
function loadDataFromGlobalDB(bucket, dbCacheKey, processCache, key, dbToCache, db) {
    return db.getGlobalDB().then(
        function (globalDB) {
            if (globalDB) {
                if (processCache) {
                    ProcessCache.setCache(bucket, {__cacheKey__:{mainKey:globalDB.db.databaseName, subKey:key}}, db.db.databaseName, key);
                }
                return loadData(bucket, dbCacheKey, processCache, key, dbToCache, globalDB);
            }
        })
}

function loadFunctionFromDB(functionName, db) {
    var D = Q.defer();
    db.db.collection("pl.functions").findOne({name:functionName}, {__history:0, __txs__:0}, function (err, functionInfo) {
        if (err) {
            D.reject(err);
            return;
        }
        D.resolve(functionInfo);
    });
    return D.promise;
}

function loadCollectionFromDB(collectionName, db) {
    var D = Q.defer();
    var mongoDB = db.db;
    var mongoCollection = mongoDB.collection("pl.collections");
    mongoCollection.findOne({collection:collectionName}, {__history:0, __txs__:0}, function (err, collectionInfo) {
        if (err) {
            D.reject(err);
            return;
        }
        if (!collectionInfo) {
            D.resolve();
            return;
        }
        var p = populateRootAndChildCollections(collectionInfo, db);
        if (Q.isPromise(p)) {
            p.then(
                function () {
                    if (collectionInfo.fields && Array.isArray(collectionInfo.fields)) {
                        return;
                    }
                    return populateAndSaveCache(collectionInfo, mongoDB);
                }).then(
                function () {
                    D.resolve(collectionInfo);
                }).fail(function (err) {
                    D.reject(err);
                })
        } else {
            if (collectionInfo.fields && Array.isArray(collectionInfo.fields)) {
                D.resolve(collectionInfo);
                return;
            }
            populateAndSaveCache(collectionInfo, mongoDB).then(
                function () {
                    D.resolve(collectionInfo);
                }).fail(function (err) {
                    D.reject(err);
                })
        }
    });
    return D.promise;
}

function populateAndSaveCache(collectionInfo, mongoDB) {
    var cacheUpdates = {};
    var collectionidFilter = {"collectionid._id":collectionInfo._id};
    var keys = Object.keys(keysToCacheInCollection);
    return Utils.iterateArrayWithPromise(keys,
        function (index, key) {
            var collectionToGetMetadata = keysToCacheInCollection[key];
            return getMetaData(collectionToGetMetadata, collectionidFilter, mongoDB).then(function (data) {
                if (collectionToGetMetadata === "pl.fields") {
                    var recursiveFields = [];
                    populateFieldsRecursive(data, recursiveFields);
                    collectionInfo[key] = recursiveFields;
                    cacheUpdates[key] = recursiveFields;
                } else {
                    collectionInfo[key] = data;
                    cacheUpdates[key] = data;
                }
            })
        }).then(
        function () {
            return saveMetaData("pl.collections", {"_id":collectionInfo._id}, {$set:cacheUpdates}, mongoDB);
        })
}

function populateRootAndChildCollections(collectionInfo, db) {
    var parentCollection = collectionInfo.parentCollection;
    if (!parentCollection) {
        return;
    }
    var collectionName = collectionInfo.collection;
    var childCollections = [];
    return getRootCollection(parentCollection, db).then(
        function (rootCollection) {
            collectionInfo.__rootCollection = rootCollection;
            childCollections.push(collectionName);
            return populateChildCollections(collectionName, childCollections, db);
        }).then(
        function () {
            collectionInfo.__childCollections = childCollections;
        })
}

function getRootCollection(collectionName, db) {
    return db.query({$collection:"pl.collections", $filter:{collection:collectionName}, $fields:{parentCollection:1}}).then(function (result) {
        var collectionInfo = result.result[0];
        if (collectionInfo.parentCollection) {
            return getRootCollection(collectionInfo.parentCollection, db);
        } else {
            return collectionName;
        }
    })
}

function populateChildCollections(collectionName, childCollections, db) {
    return db.query({$collection:"pl.collections", $filter:{parentCollection:collectionName}, $fields:{collection:1}}).then(function (result) {
        return Utils.iterateArrayWithPromise(result.result, function (index, row) {
            var childCollectionName = row.collection;
            childCollections.push(childCollectionName);
            return populateChildCollections(childCollectionName, childCollections, db);
        })
    })
}

function populateFieldsRecursive(fields, rootFields) {
    if (!fields || fields.length == 0) {
        return;
    }
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var parentField = field.parentfieldid && field.parentfieldid._id ? field.parentfieldid._id : undefined;
        if (!parentField) {
            rootFields.push(field);
        } else {
            var found = pushInParent(parentField, field, rootFields)
            if (!found) {
                for (var j = i + 1; j < fields.length; j++) {
                    found = checkAsParent(parentField, field, fields[j]);
                    if (found) {
                        break;
                    }
                }
            }
            if (!found) {
//                throw new Error("Field parent not found for [" + JSON.stringify(field) + "],Available fields [" + JSON.stringify(fields) + "]");
            }
        }
    }
}

function pushInParent(parentField, field, rootFields) {
    if (!rootFields || rootFields.length == 0) {
        return false;
    }
    for (var i = 0; i < rootFields.length; i++) {
        checkAsParent(parentField, field, rootFields[i]);

    }
}

function checkAsParent(parentField, field, fieldToCheck) {
    if (Utils.deepEqual(fieldToCheck._id, parentField)) {
        fieldToCheck.fields = fieldToCheck.fields || [];
        fieldToCheck.fields.push(field);
        return true
    }
    if (fieldToCheck.fields) {
        var found = pushInParent(parentField, field, fieldToCheck.fields);
        if (found) {
            return found;
        }
    }
}

//it will get fields, actions, formgroups etc
function getMetaData(collectionName, filter, mongoDB) {
    var D = Q.defer();
    var mongoCollection = mongoDB.collection(collectionName);
    var options = {};
    options.fields = {__history:0, __txs__:0};
    if (collectionName === "pl.events") {
        options.sort = {index:1};
    }
    mongoCollection.find(filter, options).toArray(function (err, collectionInfo) {
        if (err) {
            D.reject(err);
            return;
        }
        D.resolve(collectionInfo);
    });

    return D.promise;
}

function saveMetaData(collectionName, filter, updates, mongoDB) {
    var D = Q.defer();
    var mongoCollection = mongoDB.collection(collectionName);
    mongoCollection.update(filter, updates, {w:1}, function (err) {
        if (err) {
            D.reject(err);
            return;
        }
        D.resolve();
    });

    return D.promise;
}

exports.removeCollectionCacheData = function (data) {
    if (!data) {
        return;
    }
    for (var k in keysToCacheInCollection) {
        delete data[k];
    }
};

function getService(serviceName) {
    var Config = require("../Config.js").config;
    var Constant = require("./Constants.js");
    var hostname = Config[Constant.EnvironmentVariables.USER_CACHE_HOSTNAME];
    var port = Config[Constant.EnvironmentVariables.USER_CACHE_PORT];
    if (!hostname || !port) {
        throw new Error("Either User_Cache_Hostname or User_Cache_Port not present in Config")
    }
    var service = {};
    service.hostname = hostname;
    service.port = port;
    service.path = "/rest/" + serviceName;
    service.method = "post";
    return service;
}

function callCacheServer(service, params) {
    var Config = require("../Config.js").config;
    var Constant = require("./Constants.js");
    if (!Config[Constant.EnvironmentVariables.USER_CACHE]) {
        var D = Q.defer();
        D.resolve();
        return D.promise;
    }
    service = getService(service);
    params = params || {};
    params["token"] = Config[Constant.EnvironmentVariables.CACHE_TOKEN];
    return require("ApplaneCore/apputil/httputil.js").executeServiceAsPromise(service, params).fail(function (err) {
        var ErrorHandler = require("./ErrorHandler.js");
        return ErrorHandler.handleError({"message":err.message || err, "parameters":JSON.stringify(params), "stack":err.stack}, ErrorHandler.TYPE.CACHE_SERVER).then(
            function () {
                return;
            }).fail(function (err) {
                return;
            })
    });
}

exports.setUserConnection = function (key, value) {
    if (Config.ProcessCache && Config.ProcessCache.CACHE && Config.ProcessCache.USER !== undefined) {
        return ProcessCache.setCache("USER", value, key);
    } else {
        // for cache server
        return callCacheServer("setcache", {key:key, value:JSON.stringify(value)});
    }
};

exports.getUserConnection = function (key) {
    if (Config.ProcessCache && Config.ProcessCache.CACHE && Config.ProcessCache.USER !== undefined) {
        return ProcessCache.getCache("USER", key);
    } else {
        // for cache server
        return callCacheServer("getcache", {key:key}).then(function (userInfoFromCache) {
            if (!userInfoFromCache) {
                return;
            }
            var userInfo = JSON.parse(userInfoFromCache);
            Utils.convert_IdToObjectId(userInfo);
            if (userInfo.userRoles && userInfo.userRoles.regexCollections) {
                var regexCollections = userInfo.userRoles.regexCollections;
                for (var key in regexCollections) {
                    regexCollections[key] = new RegExp(key);
                }
            }
            return userInfo;
        });
    }
};

exports.removeUserConnection = function (key) {
    if (Config.ProcessCache && Config.ProcessCache.CACHE && Config.ProcessCache.USER !== undefined) {
        ProcessCache.clearCache("USER", key);
    }
    // for cache server
    var params = {};
    if (key === undefined) {
        params.clearAll = true;
    } else if (Array.isArray(key)) {
        params.keys = JSON.stringify(key);
    } else {
        params.key = key;
    }
    return callCacheServer("removecache", params);
};

// not required after cache server is removed
exports.getUserCache = function () {
    return callCacheServer("getCacheDetail", {});
};

