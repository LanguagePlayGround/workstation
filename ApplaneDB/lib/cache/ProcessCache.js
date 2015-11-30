var cache = undefined;
var LRU = require("lru-cache");
var Config = require("../../Config.js").config;
var ApplaneDB = require("../DB.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");

/*
 * Requirement   : was required for Six Continent
 * Description   :
 * - ProcessCache.js is created to load collections/functions/users from cache if not found in DB.
 * CLA required for functionality :
 * - ProcessCache.CACHE=true ProcessCache.COLLECTION=200 ProcessCache.FUNCTION=200 and more depending on requirement (200 is size of cache).
 *   Processcache will be used only when MAX_Allowed_LIMIT is defined like 200.
 * Terms Explained   :
 * - Bucket  : "COLLECTION"/"FUNCTION"/ some other : What type of cache to clear.
 * - mainKey : main cache key. eg: For which db cache needs to be cleared in collection/function.
 * - subKey  : cache sub key. eg: which collection to clear in specified db.
 * In case of user no subkey is defined,token will be the main key.
 * Multiple support  :
 * - Available for mainKey in case of user.
 */

exports.setCache = function (bucket, value, mainKey, subKey) {
    var cacheObject = getCacheObject(bucket);
    var cacheKey = getCacheKey(bucket, mainKey, subKey);
    return cacheObject.set(cacheKey, value);
};

exports.getCache = function (bucket, mainKey, subKey) {
    var cacheObject = getCacheObject(bucket);
    var cacheKey = getCacheKey(bucket, mainKey, subKey);
    return cacheObject.get(cacheKey);
};

exports.clearCache = function (bucket, mainKey, subKey) {
    if (!bucket) {
        for (var k in cache) {
            var cacheInstance = cache[k];
            if (cacheInstance) {
                cacheInstance.reset();
            }
        }
        cache = undefined;
        return;
    }
    var cacheObject = getCacheObject(bucket);
    if (!mainKey && !subKey) {
        cacheObject.reset();
        delete cache[bucket];
    } else {
        var cacheKey = undefined;
        if (!subKey && Array.isArray(mainKey)) {
            for (var i = 0; i < mainKey.length; i++) {
                cacheKey = getCacheKey(bucket, mainKey[i]);
                cacheObject.del(cacheKey);
            }
        } else {
            cacheKey = getCacheKey(bucket, mainKey, subKey);
            cacheObject.del(cacheKey);
        }
    }
};

function getCacheObject(bucket) {
    if (cache && cache[bucket]) {
        return cache[bucket];
    } else {
        var max = Config.ProcessCache ? Config.ProcessCache[bucket] : 500;
        var options = { max: max, maxAge: 1000 * 60 * 60};
        var cacheInstance = LRU(options);
        cache = cache || {};
        cache[bucket] = cacheInstance;
        return cacheInstance;
    }
}

function getCacheKey(bucket, mainKey, subKey) {
    var cacheKey = "__" + bucket;
    if (mainKey) {
        cacheKey += "__" + mainKey;
    }
    if (subKey) {
        cacheKey += "__" + subKey;
    }
    return cacheKey;
}

exports.clearCacheForAllServer = function (bucket, mainKey, subKey) {
    // self port is pushed as there is no entry of localhost in versioncontrolservers while running on local machine
    var adminDB = undefined;
    return clearCacheExternalCall({serverDef: {port: Config.PORT}, bucket: bucket, mainKey: mainKey, subKey: subKey}).then(function () {
        return ApplaneDB.getAdminDB();
    }).then(function (adb) {
        adminDB = adb;
        var query = {$collection: "pl.versioncontrolcla", $filter: {"key": "ProcessCache.CACHE", value: "true", types: {$exists: true}}, $fields: {"types": 1}, $events: false, $modules: false};
        return adminDB.query(query);
    }).then(function (claTypes) {
        claTypes = claTypes.result;
        var types = claTypes && claTypes.length > 0 ? claTypes[0].types : undefined;
        var serverTypes = [];
        if (types && types.length > 0) {
            for (var i = 0; i < types.length; i++) {
                serverTypes.push(types[i].serverType);
            }
        }
        var query = {$collection: "pl.versioncontrolservers", $filter: {serverType: {$in: serverTypes}}, $fields: {port: 1, servername: 1, serverGroup: 1}, $events: false, $modules: false};
        return adminDB.query(query);
    }).then(function (data) {
        data = data.result;
        return Utils.iterateArrayWithPromise(data, function (index, serverDef) {
            if (!serverDef.port) {
                throw new Error("Port not defined for server : " + serverDef.servername ? serverDef.servername : undefined);
            }
            var extOptions = {serverDef: serverDef, bucket: bucket, mainKey: mainKey, subKey: subKey};
            clearCacheExternalCall(extOptions);
        });
    });
};

function clearCacheExternalCall(extOptions) {
    var port = extOptions.serverDef.port;
    var url = "/rest/clearProcessCache?bucket=" + extOptions.bucket;
    if (extOptions.mainKey) {
        url += "&mainKey=" + (Array.isArray(extOptions.mainKey) ? JSON.stringify(extOptions.mainKey) : extOptions.mainKey);
    }
    if (extOptions.subKey) {
        url += "&subKey=" + extOptions.subKey;
    }
    var d = Q.defer();
    var MailService = require("../MailService.js");
    var callUrl = "http://127.0.0.1:" + port + url;
    require('request')({url: callUrl}, function (err, resp) {
        var error = {};
        if (err) {
            if (err.code === "ECONNREFUSED") {
                //requested server is down
                console.error("Server is down on port : " + port + " so clear cache failed.");
            } else {
                error = {error: err.message, stack: err.stack};
                insertErrorlogs({$collection: "pl.processCacheErrorLogs", $insert: {type: "error", server: extOptions.serverDef, error: error, time: new Date() }});
            }
        } else {
            if (resp && resp.statusCode && resp.statusCode === 200) {
                // ok : do nothing.
            } else {
                error = {statusCode: resp.statusCode, body: resp.body};
                insertErrorlogs({$collection: "pl.processCacheErrorLogs", $insert: {type: "status", server: extOptions.serverDef, error: error, time: new Date() }});
            }
        }
        d.resolve();
    });
    return d.promise;
}

function insertErrorlogs(insert) {
    return ApplaneDB.getLogDB().then(function (logDb) {
        return logDb.mongoUpdate(insert);
    });
}


