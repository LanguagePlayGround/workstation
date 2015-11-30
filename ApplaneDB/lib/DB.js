var DBS = {};
var CONFIG_DBS = {};
var Q = require("q");
var MongoClient = require("mongodb").MongoClient;
var SELF = require("./DB.js");
var Utility = require("ApplaneCore/apputil/util.js");
var Collection = require("./Collection.js");
var Constants = require("./Constants.js");
var ModuleManager = require("./ModuleManager.js");
var QueryUtility = require("./QueryUtility.js");
var DBUtility = require("./Utility.js");
var Role = require("../lib/modules/Role.js");
var GridStore = require('mongodb').GridStore;
var ObjectID = require("mongodb").ObjectID;
var ApplaneDBError = require("./ApplaneDBError.js");
var DBConstants = require("./DBConstants.js");
var Config = require("../Config.js").config;
var CacheService = require("./CacheService.js");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError.js");
var REQUIRED = {};


/**
 *
 * dirty  :true will be set once it is going to be disposed off
 *
 */
var DB = function (db, user, options) {
    this.db = db;
    this.user = user;
    this.options = options;
    this.serverTimezoneOffset = new Date().getTimezoneOffset();
}

exports.HTTP = require("./Http.js");

function getDBDetail(url, db) {
    var D = Q.defer();
    url += "/" + Config.Admin.DB + "/";
    connectToMongo(url).then(
        function (mongoDB) {
            var dbCollection = mongoDB.collection(Constants.Admin.DBS);
            dbCollection.findOne({db: db}, function (err, dbInfo) {
                if (err) {
                    D.reject(err);
                } else {
                    D.resolve(dbInfo);
                }
            })

        }).fail(function (err) {
            D.reject(err)
        })
    return D.promise;
}

function createUserIfNotExists(mongoDB, filter, valueToInsert, userFields, options) {
    var d = Q.defer();
    var userCollection = mongoDB.collection(Constants.Admin.USERS);
    userCollection.count(filter, {limit: 1}, function (err, count) {
        if (err) {
            d.reject(err);
            return;
        }
        if (count > 0) {
            d.resolve();
        } else {
            for (var k in filter) {
                valueToInsert[k] = filter[k];
            }
            var upsertFields = options.upsertFields;
            for (var k in upsertFields) {
                valueToInsert[k] = upsertFields[k];
            }
            SELF.connectUnauthorized(mongoDB.databaseName, true).then(
                function (connectedDb) {
                    return connectedDb.update({$collection: Constants.Admin.USERS, $insert: valueToInsert, $modules: {Role: 0}})
                }).then(
                function (update) {
                    var result = update[Constants.Admin.USERS].$insert[0];
                    var userInfo = {_id: result._id};
                    for (var k in userFields) {
                        if (result[k] !== undefined) {
                            userInfo[k] = result[k];
                        }
                    }
                    d.resolve(userInfo);
                }).fail(function (err) {
                    d.reject(err);
                })
        }
    })
    return d.promise;
}

function verifyAuthOptions(db, dbInfo, authOptions, options) {
    if (!authOptions) {
        return;
    }
    if (!dbInfo) {
        throw new BusinessLogicError("Db not registered>>>" + db);
    }
    if (authOptions.code) {
        if (authOptions.code !== dbInfo.code) {
            throw new BusinessLogicError("Invalid code>>>" + authOptions.code);
        }
    } else if (authOptions.oauthCode) {
        return SELF.getAdminDB().then(
            function (adminDB) {
                return adminDB.query({$collection: "pl.oauthconnections", $filter: {token: authOptions.oauthCode, username: options.username}})
            }).then(function (oauthInfo) {
                if (oauthInfo.result.length == 0) {
                    throw new BusinessLogicError("Invalid oauth token >>>" + authOptions.oauthCode)
                }

            })
    } else {
        throw new BusinessLogicError("Invalid authOptions>>>>" + JSON.stringify(authOptions));
    }
}

function authenticateUser(url, db, authOptions, options) {
    options = options || {};
    var userName = options[Constants.Admin.Users.USER_NAME];
    if (!userName) {
        throw new ApplaneDBError(Constants.ErrorCode.CREDENTIAL_MISSMATCH.MESSAGE, Constants.ErrorCode.CREDENTIAL_MISSMATCH.CODE);
    }
    if (typeof userName !== "string") {
        userName = userName.toString();
    }
    var mainURL = url;
    url += "/" + db + "/";
    var dbInfo = undefined;
    var mongoDb = undefined;
    var newDb = undefined;
    return getDBDetail(mainURL, db).then(
        function (dbInfoRecord) {
            dbInfo = dbInfoRecord;
            return verifyAuthOptions(db, dbInfo, authOptions, options);
        }).then(
        function () {
            return connectToMongo(url);
        }).then(
        function (mongoDB1) {
            mongoDb = mongoDB1;
            if (options.ensureDB && userName && options[Constants.Admin.Users.PASSWORD]) {
                var valueToInsert = {username: userName, password: options[Constants.Admin.Users.PASSWORD], admin: true};
                return createUserIfNotExists(mongoDb, {}, valueToInsert, {username: 1}, options);
            }
        }).then(
        function () {
            return getUser(mongoDb, userName, dbInfo, authOptions, options);
        }).then(
        function (user) {
            var globalDatabaseName = dbInfo && dbInfo[Constants.Admin.Dbs.GLOBAL_DB] ? dbInfo[Constants.Admin.Dbs.GLOBAL_DB] : undefined;
            newDb = getDBInstance(mongoDb, user, globalDatabaseName);
            var userTimezoneOffset = options && options.userTimezoneOffset !== undefined ? options.userTimezoneOffset : (dbInfo ? dbInfo.timezone : undefined);
            if (userTimezoneOffset !== undefined) {
                newDb.setUserTimezoneOffset(userTimezoneOffset);
            }
        }).then(
        function () {
            return Role.populateRoleInfosInUser(newDb);
        }).then(
        function () {
            return newDb;
        })
}

function getUser(mongoDb, userName, dbInfo, authOptions, options) {
    var d1 = Q.defer();
    var filter = getUserFilter(userName, dbInfo);
    var pwd = options[Constants.Admin.Users.PASSWORD];
    if (authOptions) {
        if (pwd) {
            filter.enc_password = Utility.getEncriptedPassword(pwd);
        }
    } else {
        if (!pwd) {
            throw new ApplaneDBError(Constants.ErrorCode.CREDENTIAL_MISSMATCH.MESSAGE, Constants.ErrorCode.CREDENTIAL_MISSMATCH.CODE);
        }
        filter.enc_password = Utility.getEncriptedPassword(pwd);
    }
    var userFields = Utility.deepClone(Constants.USER_FIELDS);
    for (var k in options.fields) {
        if (k === "password") {
            continue;
        }
        userFields[k] = 1;
    }
    var userCollection = mongoDb.collection(Constants.Admin.USERS);
    userCollection.findOne(filter, {fields: userFields}, function (err, user) {
        if (err) {
            d1.reject(err);
            return;
        }
        if (!user) {
            if (options && options.ensureUser && dbInfo && dbInfo[Constants.Admin.Dbs.ENSURE_USER]) {
                // use for case of parent app
                return createUserIfNotExists(mongoDb, getUserFilter(userName, dbInfo), {username: userName, password: pwd}, userFields, options).then(
                    function (resultInfo) {
                        if (resultInfo) {
                            d1.resolve(resultInfo);
                        } else {
                            d1.reject(new ApplaneDBError(Constants.ErrorCode.CREDENTIAL_MISSMATCH.MESSAGE, Constants.ErrorCode.CREDENTIAL_MISSMATCH.CODE));
                        }
                    }).fail(function (err) {
                        d1.reject(err);
                    })
            } else {
                d1.reject(new ApplaneDBError(Constants.ErrorCode.CREDENTIAL_MISSMATCH.MESSAGE, Constants.ErrorCode.CREDENTIAL_MISSMATCH.CODE));
            }
        } else if (user.status && user.status === Constants.Admin.Users.Status.DEACTIVE) {
            d1.reject(new ApplaneDBError(Constants.ErrorCode.ACCOUNT_DEACTIVATED.MESSAGE, Constants.ErrorCode.ACCOUNT_DEACTIVATED.CODE));
        } else {
            d1.resolve(user);
        }
    });
    return d1.promise;
}

function getUserFilter(userName, dbInfo) {
    if (dbInfo && dbInfo[Constants.Admin.Dbs.MOBILE_LOGIN_ENABLED] && Utility.isNumber(userName)) {
        return {mobile_no: userName};
    } else if (dbInfo && dbInfo[Constants.Admin.Dbs.EMAIL_LOGIN_ENABLED] && Utility.isEmailId(userName)) {
        return {emailid: userName};
    } else {
        return {username: userName};
    }
}

exports.connect = function (url, db, options) {
    if (!db) {
        throw new ApplaneDBError(Constants.ErrorCode.MANDATORY_FIELDS.MESSAGE + "[db] while connect", Constants.ErrorCode.MANDATORY_FIELDS.CODE);
    }
    return authenticateUser(url, db, false, options).then(
        function (dbInstance) {
            return dbInstance;
        })
}

exports.connectWithCode = function (url, db, code, options) {
    if (!db || !code) {
        throw new ApplaneDBError(Constants.ErrorCode.MANDATORY_FIELDS.MESSAGE + "[db/code] while connectWithCode", Constants.ErrorCode.MANDATORY_FIELDS.CODE);
    }
    return authenticateUser(url, db, {code: code}, options);
}


exports.connectWithOAuth = function (url, db, code, options) {
    if (!db || !code) {
        throw new ApplaneDBError(Constants.ErrorCode.MANDATORY_FIELDS.MESSAGE + "[db/code] while connectWithOAutn", Constants.ErrorCode.MANDATORY_FIELDS.CODE);
    }
    return authenticateUser(url, db, {oauthCode: code}, options);
}

DB.prototype.isGlobalDB = function () {
    return this.globalDatabaseName === undefined || this.globalDatabaseName === this.db.databaseName;
}

DB.prototype.getUserTimezoneOffset = function () {
    if (this.options) {
        return this.options.userTimezoneOffset;
    }
}

DB.prototype.setUserTimezoneOffset = function (userTimezoneOffset) {
    if (userTimezoneOffset !== undefined) {
        this.options = this.options || {};
        this.options.userTimezoneOffset = userTimezoneOffset;
    }
}

DB.prototype.addWarnings = function (warnings) {
    this.warnings = this.warnings || [];
    if (Array.isArray(warnings)) {
        this.warnings.push.apply(this.warnings, warnings);
    } else {
        this.warnings.push(warnings);
    }
}

DB.prototype.getWarnings = function () {
    return this.warnings;
}

DB.prototype.logMongoTime = function (key, time, nonMongo) {
    this.mongoTime = this.mongoTime || {};
    this.mongoTime[key] = this.mongoTime[key] || 0;
    this.mongoTime[key] = this.mongoTime[key] + time;
    if (!nonMongo) {
        this.mongoTime.totalTime = this.mongoTime.totalTime || 0;
        this.mongoTime.totalTime = this.mongoTime.totalTime + time;
    }
    if (key === "mongoUpdate") {
        this.logMongoTime("mongoUpdateCount", 1, true);
    } else if (key === "mongoFind") {
        this.logMongoTime("mongoFindCount", 1, true);
    } else if (key === "mongoRemove") {
        this.logMongoTime("mongoRemoveCount", 1, true);
    } else if (key === "mongoInsert") {
        this.logMongoTime("mongoInsertCount", 1, true);
    } else if (key === "mongoCountTime") {
        this.logMongoTime("mongoCount", 1, true);
    }
};

function connectToMongo(url, key) {
    var cacheUrl = key ? url + key : url;
    var D = Q.defer();
    if (DBS[cacheUrl]) {
        D.resolve(DBS[cacheUrl]);
        return D.promise;
    }
    MongoClient.connect(url, function (err, db) {
        if (err) {
            D.reject(err);
            return;
        }
        db.authenticate(Config.MongoAdmin.USER_NAME, Config.MongoAdmin.PASSWORD, {authdb: Config.MongoAdmin.DB}, function (err, res) {
            if (err) {
                D.reject(err);
            } else if (!res) {
                D.reject(new Error("Auth fails"));
            } else {
                DBS[cacheUrl] = db;
                D.resolve(DBS[cacheUrl]);
            }

        })
    })
    return D.promise;
}

function executeQuery(query, events, collection, db) {
    if (query[Constants.Query.UNWIND] || query[Constants.Query.GROUP]) {
        return executeAggregateQuery(query, events, collection, db);
    } else {
        return executeFindQuery(query, collection, db);
    }
}

function getPipelines(query) {
    var pipeLines = [];
    //temp filter should be applied before unwind as well as after unwind start Rohit
    if (query[Constants.Query.FILTER]) {
        var filter = query[Constants.Query.FILTER];
        Utility.convert_IdToObjectIdInFilter(filter);
        pipeLines.push({$match: filter});
    }
    //temp filter should be applied before unwind as well as after unwind end Rohit
    if (query[Constants.Query.UNWIND]) {
        var unwind = query[Constants.Query.UNWIND];
        if (!(Array.isArray(unwind))) {
            throw new BusinessLogicError("Unwind in query should be in Array but found [" + JSON.stringify(unwind) + "].Query is [" + JSON.stringify(query) + "]");
        }
        for (var i = 0; i < unwind.length; i++) {
            pipeLines.push({$unwind: "$" + unwind[i]});
        }
        if (query[Constants.Query.FILTER]) {
            var filter = query[Constants.Query.FILTER];
            var newFilter = {};
            for (var k in filter) {
                if (k !== "$text") {
                    newFilter[k] = filter[k];
                }
            }
            pipeLines.push({$match: newFilter});
        }
    }
    if (query[Constants.Query.FIELDS] && Object.keys(query[Constants.Query.FIELDS]).length > 0) {
        pipeLines.push({$project: query[Constants.Query.FIELDS]});
    }
    if (query[Constants.Query.SORT]) {
        pipeLines.push({$sort: query[[Constants.Query.SORT]]});
    }
    if (query[Constants.Query.GROUP]) {
        var group = query[Constants.Query.GROUP];
        if (Array.isArray(group)) {
            for (var i = 0; i < group.length; i++) {
                populateGroup(pipeLines, group[i]);
            }
        } else {
            populateGroup(pipeLines, group);
        }
    }
    if (query[Constants.Query.SKIP] !== undefined) {
        pipeLines.push({$skip: query[Constants.Query.SKIP]});
    }
    if (query[Constants.Query.LIMIT] !== undefined && query[Constants.Query.LIMIT] > 0) {
        query[Constants.Query.LIMIT] = query[Constants.Query.LIMIT] + 1;
        pipeLines.push({$limit: query[Constants.Query.LIMIT]});
    }
    return pipeLines;
}

function executeAggregateQuery(query, events, collection, db) {
    var limit = undefined;
    if (query[Constants.Query.LIMIT] !== undefined) {
        limit = query[Constants.Query.LIMIT];
    }
    var pipeLines = getPipelines(query);
    var esOptions = {runOnES: query.runOnES, similarqueries: query.$similarqueries};
    return ModuleManager.doAggregate(query, events, pipeLines, {query: query}, db).then(
        function () {
            return getAggregateData(pipeLines, collection, db, esOptions);
        }).then(function (result) {
            var hasNext = false;
            if (limit !== undefined && limit > 0 && result.length > limit) {
                result.splice(result.length - 1, 1);
                hasNext = true;
            }
            return {result: result, hasNext: hasNext};
        })

}

function getAggregateData(pipeLines, collection, db, esOptions) {
    var collectionName = collection.mongoCollection.collectionName;
//    console.log("mongo collection >>> " + collectionName);
//    console.log("pipelines>>>>>>>>>" + JSON.stringify(pipeLines));
    var global = collection.getValue(Constants.Admin.Collections.GLOBAL);
    var dbToQuery = getDBToQuery(global, collectionName, db);
    if (Q.isPromise(dbToQuery)) {
        return dbToQuery.then(function (finalDB) {
            return getAggregateResult(collectionName, pipeLines, finalDB, db, esOptions);
        })
    } else {
        return getAggregateResult(collectionName, pipeLines, db, db, esOptions);
    }
}

function executeFindQuery(query, collection, db) {
    var filter = query[Constants.Query.FILTER];
    try {
        Utility.convert_IdToObjectIdInFilter(filter);
    } catch (e) {
        throw new Error(e.message + ">>query>>>" + JSON.stringify(query));
    }
    var options = {fields: query[Constants.Query.FIELDS], sort: query[Constants.Query.SORT], limit: query[Constants.Query.LIMIT], skip: query[Constants.Query.SKIP]};
    var collectionName = collection.mongoCollection.collectionName;
    var fetchOneExtra = false;
    var limit = options.limit;
    if (options.limit !== undefined && options.limit > 0) {
        options.limit = options.limit + 1;
        fetchOneExtra = true;
    }
    var queryLimit = Config.QUERY_LIMIT;
    if (options.limit === undefined) {
        options.limit = queryLimit;
    } else {
        if (options.limit > queryLimit) {
            var error = new Error("Max limit allowed is " + queryLimit + " but found [" + options.limit + "]");
            error.detailMessage = "Max limit allowed is " + queryLimit + " but found [" + options.limit + "]." + "Collection found [" + collectionName + "] and Filter found [" + JSON.stringify(filter) + "]";
            throw error;
        }
    }
//            console.log("collectionName>>" + collectionName + ">>DB>>" + db.db.databaseName)
//        console.log("Filter>>" + JSON.stringify(filter));
//        console.log("options>>>>" + JSON.stringify(options));
    return getFindData(filter, options, collection, db, query.runOnES).then(function (result) {
        if (result.length >= queryLimit) {
            var error = new Error("Too much records[" + result.length + "] found.Add some filter and retry again.");
            error.detailMessage = "Too much records[" + result.length + "] found.Add some filter and retry again.Collection found [" + collectionName + "] and Filter found [" + JSON.stringify(filter) + "]";
            throw error;
        }
        var hasNext = false;
        if (options.limit && result && result.length > limit && fetchOneExtra) {
            result.splice(result.length - 1, 1);
            hasNext = true;
        }
        return {result: result, hasNext: hasNext};
    })
}

function getAggregateResult(collectionName, pipeLines, finalDB, db, esOptions) {
    if (esOptions && esOptions.runOnES) {
        return executeESAggregateQuery(collectionName, finalDB, pipeLines, esOptions);
    } else {
        var url = Config.URL + "/" + finalDB.db.databaseName + "/";
        var key = "aggregate";
        if (Config.__MongoCollections && Config.__MongoCollections[collectionName]) {
            key += "__" + collectionName;
        }
        return connectToMongo(url, "aggregate").then(
            function (mongoDB) {
                var mongoCollection = mongoDB.collection(collectionName);
                var log = undefined;
                if (db.logger) {
                    log = db.logger.populateInitialLog("mongoquery", {collection: collectionName, pipeLines: pipeLines}, db, false);
                }
                var d = Q.defer();
                var sMongoTime = new Date();
                mongoCollection.aggregate(pipeLines, function (err, res) {
                    var aggTime = new Date() - sMongoTime;
                    db.logMongoTime("mongoAggregate", aggTime);
                    if (db.logger) {
                        db.logger.populateFinalLog(db, log, false);
                        if (aggTime > 1000) {
                            db.logger.enable = true;
                        }
                    }
                    if (err) {
                        d.reject(err);
                        return;
                    }
                    d.resolve(res)
                });
                return d.promise;
            })
    }
}

function getFindData(filter, options, collection, db, runOnES) {
    var collectionName = collection.mongoCollection.collectionName;
    var global = collection.getValue(Constants.Admin.Collections.GLOBAL);
    var dbToQuery = getDBToQuery(global, collectionName, db);
    if (Q.isPromise(dbToQuery)) {
        return dbToQuery.then(function (finalDB) {
            var mongoCollection = finalDB.db.databaseName === db.db.databaseName ? collection.mongoCollection : finalDB.db.collection(collectionName);
            return getFindResult(collectionName, filter, options, mongoCollection, db, runOnES);
        })
    } else {
        var mongoCollection = collection.mongoCollection;
        return getFindResult(collectionName, filter, options, mongoCollection, db, runOnES);
    }
}

function mongoFind(collectionName, filter, options, mongoCollection, db) {
    var d = Q.defer();
    var log = undefined;
    if (db.logger) {
        log = db.logger.populateInitialLog("mongoquery", {collection: collectionName, filter: filter, options: options}, db, false);
    }
    var sTime = new Date();
    mongoCollection.find(filter, options).toArray(function (err, result) {
        db.logMongoTime("mongoFind", (new Date() - sTime));
        if (db.logger) {
            db.logger.populateFinalLog(db, log, false);
        }
        if (err) {
            if (err.$err) {
                err.message += err.$err;
            }
            err.detailMessage = ".. collectionName [" + collectionName + "].. with filter...[" + JSON.stringify(filter) + "]..with options..[" + JSON.stringify(options) + "]";
            d.reject(err);
            return;
        }
        d.resolve(result);
    });
    return d.promise;
}
function getFindResult(collectionName, filter, options, mongoCollection, db, runOnES) {
    if (runOnES) {
        return executeESQuery(collectionName, db, filter, options);
    } else {
        if (Config.__MongoCollections && Config.__MongoCollections[collectionName]) {
            var url = Config.URL + "/" + db.db.databaseName + "/";
            var key = collectionName + "-find";
            return  connectToMongo(url, key).then(
                function (mongoDB) {
                    mongoCollection = mongoDB.collection(collectionName);
                    return mongoFind(collectionName, filter, options, mongoCollection, db);
                });
        } else {
            return mongoFind(collectionName, filter, options, mongoCollection, db);
        }
    }
}

function getDBToQuery(global, collectionName, db) {
    if (db.isGlobalDB() || !global) {
        return db;
    }
    var d = Q.defer();
    db.db.collection(collectionName).count(
        function (err, count) {
            if (err) {
                d.reject(err);
                return;
            }
            if (count > 0) {
                d.resolve(db);
                return;
            }
            db.getGlobalDB().then(
                function (globalDB) {
                    if (globalDB) {
                        return getDBToQuery(global, collectionName, globalDB);
                    } else {
                        return db;
                    }
                }).then(
                function (finalDb) {
                    d.resolve(finalDb);
                }).fail(function (err) {
                    d.reject(err);
                })
        })
    return d.promise;
}

function populateGroup(pipeLines, group) {
    pipeLines.push({$group: group});
    if (group[Constants.Query.FILTER]) {
        var filter = group[Constants.Query.FILTER];
        Utility.convert_IdToObjectIdInFilter(filter);
        pipeLines.push({$match: filter});
        delete group[Constants.Query.FILTER];
    }
    if (group[Constants.Query.SORT]) {
        pipeLines.push({$sort: group[Constants.Query.SORT]});
        delete group[Constants.Query.SORT];
    }
}

function updateInternal(type, update, updateResult, updateOptions) {
    var that = this;
    if (that.dirty) {
        throw new Error("Database is in dirty state as it has been cleaned>>updates fired was >>>" + JSON.stringify(updates))
    }
    if (!update[type]) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    update[type] = Utility.isJSONObject(update[type]) ? [update[type]] : update[type];
    return Utility.iterateArrayWithPromise(update[type],
        function (index, operation) {
            var d1 = Q.defer();
            that.updates = that.updates || [];
            var updateString = JSON.stringify(operation);
            if (that.updates.indexOf(updateString) !== -1) {
                throw new Error("update in recursion with [" + updateString + "]");
            }
            if (!update[Constants.Update.COLLECTION]) {
                throw new ApplaneDBError(Constants.ErrorCode.MANDATORY_FIELDS.MESSAGE + "[" + Constants.Update.COLLECTION + "]", Constants.ErrorCode.MANDATORY_FIELDS.CODE);
            }
            Utility.convert_IdToObjectId(operation);
            var collectionName = undefined;
            var collection = undefined;
            return that.collection(update[Constants.Update.COLLECTION]).then(
                function (collectionObj) {
                    collection = collectionObj;
                    collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
                    return resolveUpdates.call(that, type, operation, collection, update, updateOptions);
                }).then(
                function (result) {
                    var operation_id = undefined;
                    if (operation._id) {
                        operation_id = operation._id
                    } else if (operation.$query && operation.$query._id) {
                        operation_id = operation.$query._id;
                    }
                    if (update.$fields && operation_id) {
                        var dataCallBackQuery = {$collection: update[Constants.Update.COLLECTION], $fields: update.$fields, $filter: {_id: operation_id}}
                        if (update.queryEvents) {
                            dataCallBackQuery.$events = update.queryEvents;
                        }
                        if (update.$parameters) {
                            dataCallBackQuery.$parameters = update.$parameters;
                        }
                        return that.query(dataCallBackQuery).then(function (queryResult) {
                            if (queryResult && queryResult.result && queryResult.result.length > 0) {
                                return queryResult.result[0];
                            }
                        })
                    } else {
                        return result;
                    }
                }).then(
                function (result) {
                    updateResult[collectionName] = updateResult[collectionName] || {};
                    updateResult[collectionName][type] = updateResult[collectionName][type] || [];
                    updateResult[collectionName][type].push(result);
                })
        })
}

function resolveUpdates(type, operation, collection, update, updateOptions) {
    var that = this;
    var options = getUpdateOptions(update, updateOptions);
    if (type == Constants.Update.UPSERT) {
        var newOperation = {};
        if (operation.$set) {
            newOperation.$set = operation.$set;
        }
        if (operation.$unset) {
            newOperation.$unset = operation.$unset;
        }
        if (operation.$inc) {
            newOperation.$inc = operation.$inc;
        }
        if (operation.$transient) {
            newOperation.$transient = operation.$transient;
        }
        return collection.upsert(operation[Constants.Update.Upsert.QUERY], newOperation, operation[Constants.Update.Upsert.FIELDS], options);
    } else if (type == Constants.Update.INSERT) {
        return resolveUpdateQuery(that, operation, collection, update).then(function () {
            return collection.insert(operation, options);
        });
    } else if (type == Constants.Update.UPDATE) {
        var newOperation = {};
        if (operation.$set) {
            newOperation.$set = operation.$set;
        }
        if (operation.$unset) {
            newOperation.$unset = operation.$unset;
        }
        if (operation.$inc) {
            newOperation.$inc = operation.$inc;
        }
        if (operation.$oldData) {
            newOperation.$oldData = operation.$oldData;
        }
        if (operation.$transient) {
            newOperation.$transient = operation.$transient;
        }
        return  collection.update(operation._id, newOperation, options)
    } else if (type == Constants.Update.DELETE) {
        if (operation.$query) {
            var queryToDeleteData = {$collection: update[Constants.Update.COLLECTION], $filter: operation.$query, $fields: {_id: 1}};
            addOptionsInQuery(queryToDeleteData, options);
            return that.query(queryToDeleteData).then(function (deleteResult) {
                deleteResult = deleteResult.result;
                if (deleteResult.length === 0) {
                    return;
                }
                var deleteRecords = {$collection: update[Constants.Update.COLLECTION], $delete: deleteResult};
                addOptionsInQuery(deleteRecords, options);
                return that.update(deleteRecords);
            })
        } else {
            return collection.remove(operation._id, options);
        }
    }
}
function addOptionsInQuery(query, options) {
    for (var k in options) {
        if (k !== "w") {
            query[k] = options[k];
        }
    }
}

function resolveUpdateQuery(that, operation, collection, update) {
    //Simple Fk and string type column passed in filter.Value passsed in fk type column must be _id and without ._id in filterkey like entityid._id="xxx" is not handled.
    var updateQuery = update.$query;
    if (!update.$query || !updateQuery.$filter || Object.keys(updateQuery.$filter).length === 0) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var updateFilter = updateQuery.$filter;
    var updateParameters = updateQuery.$parameters || {};
    var collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
    var collectionFields = collection.getValue(Constants.Admin.Collections.FIELDS);
    var p = require("./modules/Function.js").populateFilter(updateFilter, updateParameters, that, {collection: collectionName, $parameters: updateParameters});
    if (Q.isPromise(p)) {
        return p.then(function () {
            resolveFilter(updateFilter, collectionFields, operation);
        })
    } else {
        resolveFilter(updateFilter, collectionFields, operation);
    }
}

function resolveFilter(updateFilter, collectionFields, operation) {
    var filterKeys = Object.keys(updateFilter);
    for (var i = 0; i < filterKeys.length; i++) {
        var filterkey = filterKeys[i];
        var filterValue = updateFilter[filterkey];
        var fieldIndex = Utility.getIndex(collectionFields, "field", filterkey);
        if (filterValue && (typeof filterValue === "string" || filterValue instanceof ObjectID) && fieldIndex >= 0) {
            var field = collectionFields[fieldIndex];
            if (field.type && field.type === "string") {
                operation[filterkey] = filterValue;
            } else if (field.type && field.type === "fk") {
                operation[filterkey] = {_id: filterValue};
            }
        }
    }
}

function getUpdateOptions(updates, updateOptions) {
    var options = {w: 1};
    if (updates) {
        if (updates.$onValueProcessed !== undefined) {
            options.$onValueProcessed = updates.$onValueProcessed;
        }
        if (updates.$check_id !== undefined) {
            options.$check_id = updates.$check_id;//when we were inserting data then the transaction module was checking for _id in the child and it was throwing duplicate key error
        }
        if (updates.runOnES !== undefined) {
            options.runOnES = updates.runOnES;
        }
        if (updates.$parameters !== undefined) {
            options.$parameters = updates.$parameters;
        }
        if (updates.$limit !== undefined) {
            options.$limit = updates.$limit;
        }
        if (updates.$skip !== undefined) {
            options.$skip = updates.$skip;
        }
        if (updates.$modules !== undefined) {
            options.$modules = updates.$modules;
        }
        if (updates.$events !== undefined) {
            options.$events = updates.$events;
            if (options.$events) {
                if (Utility.isJSONObject(options.$events)) {
                    options.$events = [options.$events];
                }
                DBUtility.populateEvents(options.$events);
            }
        }
        if (updates.$applock !== undefined) {
            options.$applock = updates.$applock;
        }
        if (updateOptions) {
            options.domain = updateOptions.domain;
            // in case of saving confirm using warning options, we get proceedSave =true in updateOptions, we are using this to show warning message only once -- Rajit garg 27-mar-15
            if (updateOptions.confirmUserWarning) {
                options.confirmUserWarning = updateOptions.confirmUserWarning;
            }
        }
        if (updates.$workflowevents !== undefined) {
            options.$workflowevents = updates.$workflowevents;
        }
    }
    return options;
}

DB.prototype.update = function (updates, options) {
    var that = this;
    if (options && options.async) {
        var d = Q.defer();
        if (!this.txid) {
            options.txEnabled = false;
        }
        var finalUpdates = prepareUpdates(updates);
        var asyncDB = that.asyncDB();
        if (options.processName === undefined) {
            options.processName = "UpdateAsync";
        }
        asyncDB.createProcess(options).then(function (process) {
            setTimeout(function () {
                asyncDB.startProcess(finalUpdates, "Processes.update", options).then(
                    function () {
                        that.clean();
                    }).fail(function (err) {
                        sendErrorMail(err);
                    });
            }, 100);
            d.resolve(process);
        });
        return d.promise;
    } else {
        if (that.dirty) {
            throw new Error("Database is in dirty state as it has been cleaned>>updates fired was >>>" + JSON.stringify(updates))
        }
        updates = QueryUtility.getQueryClone(updates);   // work to do because of change in updates due to same reference,also affect in reocrd from which record was created.Deliveries and invoices created from deliveries have same reference of entity.
        var updateResult = {};
        updates = Utility.isJSONObject(updates) ? [updates] : updates;
        return Utility.iterateArrayWithPromise(updates,
            function (index, update) {
                var log = undefined;
                if (that.logger) {
                    var updateLogs = {};
                    updateLogs.collectionName = Utility.isJSONObject(update.$collection) ? update.$collection.collection : update.$collection;
                    if (update.$insert) {
                        updateLogs.insertCount = update.$insert.length;
                    }
                    if (update.$update) {
                        updateLogs.updateCount = update.$update.length;
                    }
                    if (update.$delete) {
                        updateLogs.deleteCount = update.$delete.length;
                    }
                    if (update.$upsert) {
                        updateLogs.upsertCount = update.$upsert.length;
                    }
                    log = that.logger.populateInitialLog("update", updateLogs, that, true);
                }
                return updateInternal.call(that, Constants.Update.UPSERT, update, updateResult, options).then(
                    function () {
                        return  updateInternal.call(that, Constants.Update.INSERT, update, updateResult, options);
                    }).then(
                    function () {
                        return  updateInternal.call(that, Constants.Update.UPDATE, update, updateResult, options);
                    }).then(
                    function () {
                        return  updateInternal.call(that, Constants.Update.DELETE, update, updateResult, options);
                    }).then(
                    function () {
                        if (that.logger) {
                            that.logger.populateFinalLog(that, log, true);
                        }
                    }).fail(function (err) {
                        if (that.logger) {
                            that.logger.populateFinalLog(that, log, true);
                        }
                        throw err;
                    })
            }).then(
            function () {
                if (that.dirty) {
                    throw new Error("Database is in dirty state as it has been cleaned>>updates fired was >>>" + JSON.stringify(updates))
                }
                //require to show message at client side while user change calenderenabled or trackmail(login from google) -- Rajit garg
                if (that.updateResult && that.updateResult.postSaveMessage) {
                    updateResult.postSaveMessage = that.updateResult.postSaveMessage;
                    delete that.updateResult;
                }
                return updateResult;
            }).fail(function (err) {
                if (that.dirty) {
                    throw new Error("Database is in dirty state as it has been cleaned>>updates fired was >>>" + JSON.stringify(updates))
                }
                throw err;
            })
    }
}

DB.prototype.mongoUpdate = function (updates, options) {
    options = options || {w: 1};
    var that = this;
    var result = {};
    if (Utility.isJSONObject(updates)) {
        updates = [updates];
    }
    return Utility.iterateArrayWithPromise(updates,
        function (index, update) {
            return mongoUpdateInternal.call(that, Constants.Update.INSERT, update, result, options).then(
                function () {
                    return mongoUpdateInternal.call(that, Constants.Update.UPDATE, update, result, options);
                }).then(
                function () {
                    return mongoUpdateInternal.call(that, Constants.Update.DELETE, update, result, options);
                }).then(
                function () {
                    return mongoUpdateInternal.call(that, Constants.Update.UPSERT, update, result, options);
                })
        }).then(
        function () {
            return result;
        })
}

function mongoUpdateInternal(type, update, result, options) {
    if (!update[type]) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var that = this;
    if (Utility.isJSONObject(update[type])) {
        update[type] = [update[type]];
    }
    return Utility.iterateArrayWithPromise(update[type],
        function (index, operation) {
            var collectionName = undefined;
            var collection = undefined;
            return that.collection(update[Constants.Update.COLLECTION]).then(
                function (collectionObj) {
                    collection = collectionObj;
                    collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
                    return resolveMongoUpdate(type, collection, operation, options);
                }).then(function (finalResult) {
                    result[collectionName] = result[collectionName] || {};
                    result[collectionName][type] = result[collectionName][type] || [];
                    if (type == Constants.Update.INSERT) {
                        finalResult = finalResult[0];
                    }
                    result[collectionName][type].push(finalResult);
                })
        })
}

function resolveMongoUpdate(type, collection, operation, options) {
    if (type == Constants.Update.INSERT) {
        return collection.mongoInsert(operation, options);
    } else if (type == Constants.Update.UPDATE) {
        var newOperation = {};
        if (operation.$set) {
            newOperation.$set = operation.$set;
        }
        if (operation.$unset) {
            newOperation.$unset = operation.$unset;
        }
        if (operation.$inc) {
            newOperation.$inc = operation.$inc;
        }
        if (operation.$push) {
            newOperation.$push = operation.$push;
        }
        if (operation.$pull) {
            newOperation.$pull = operation.$pull;
        }
        return collection.mongoUpdate(operation[Constants.Update.QUERY], newOperation, options);
    } else if (type == Constants.Update.DELETE) {
        return collection.mongoRemove(operation, options);
    } else if (type === Constants.Update.UPSERT) {
        var upsertOptions = operation.$options;
        if (upsertOptions) {
            for (var k in options) {
                if (upsertOptions[k] === undefined) {
                    upsertOptions[k] = options[k];
                }
            }
        } else {
            upsertOptions = options;
        }
        return collection.findAndModify(operation[Constants.Update.QUERY], operation[Constants.Update.SORT], operation[Constants.Update.UPDATE], upsertOptions).then(function (result) {
            return result.value;
        })
    }
}

//did for showing history logs for deleted records---ritesh
function getQueryData(queryClone, queryData, events, collection, that) {
    if (queryData) {
        if (Array.isArray(queryData)) {
            return {result: queryData};
        } else {
            if (queryData.result) {
                return queryData;
            } else {
                throw new BusinessLogicError("Result is mandatory if data is passed in query and is not an Array.");
            }
        }
    } else {
        return executeQuery(queryClone, events, collection, that);
    }
}

//function to get the main query from the records of table pl.queries using $query parameter..
function getSavedQuery(query, db) {
    if (query[Constants.Query.QUERY]) {
        var filter = {};
        filter[Constants.Admin.Queries.ID] = query[Constants.Query.QUERY];
        return db.query({$collection: Constants.Admin.QUERIES, $filter: filter}).then(function (result) {
            if (result && result.result && result.result.length > 0) {
                var savedQuery = result.result[0][Constants.Admin.Queries.QUERY];
                if (typeof savedQuery === "string") {
                    savedQuery = JSON.parse(savedQuery);
                }
                for (var key in savedQuery) {
                    if (key == Constants.Query.FILTER) {
                        var filter = savedQuery[Constants.Query.FILTER];
                        query[Constants.Query.FILTER] = query[Constants.Query.FILTER] || {};
                        for (var key in filter) {
                            query[Constants.Query.FILTER][key] = filter[key];
                        }
                    } else if (query[key] === undefined) {
                        query[key] = savedQuery[key];
                    }
                }
            }
        });
    }
}

// query handling..
function doQuery(query, db, options) {
    db.logMongoTime("queryCount", 1, true);
//    console.log("query..." + JSON.stringify(query));
    var executionLevel = options && options.executionLevel ? options.executionLevel : 1;
    if (executionLevel > 50) {
        throw new Error(" Recursion limit exceeded for query : [" + JSON.stringify(query) + "]");
    }
    if (db.dirty) {
        throw new Error("Database is in dirty state as it has been cleaned, query fired>>>" + JSON.stringify(query));
    }
    if (!query) {
        throw new ApplaneDBError(Constants.ErrorCode.MANDATORY_FIELDS.MESSAGE + "[query]", Constants.ErrorCode.MANDATORY_FIELDS.CODE);
    }
    if (!query[Constants.Query.COLLECTION]) {
        throw new ApplaneDBError(Constants.ErrorCode.MANDATORY_FIELDS.MESSAGE + "[" + Constants.Query.COLLECTION + "]", Constants.ErrorCode.MANDATORY_FIELDS.CODE);
    }
    var that = db;
    var collectionName = (typeof query.$collection === "string") ? query.$collection : query.$collection.collection;
    var template = query.$template;
    var templateType = query.$templateType;
    var limit = undefined;
    if (template && (!templateType || templateType === "ejs")) {
        validateTemplate(template);
    }
    delete query.$template;
    delete query.$templateType;
    var queryString = undefined;
    var cache = query.$cache !== undefined ? query.$cache : (options ? options.cache : false);
    if (cache) {
        var queryReference = QueryUtility.getQueryClone(query);
        queryReference.$collection = collectionName;
        queryString = JSON.stringify(queryReference);
        var result = that.getCache(queryString);
        if (result) {
            var d = Q.defer();
            d.resolve(DBUtility.deepClone(result));
            return d.promise;
        }
    }
    var log = undefined;
    if (that.logger) {
        var logQueryClone = {};
        logQueryClone.$collection = collectionName;
        logQueryClone.$filter = query.$filter;
        logQueryClone.$sort = query.$sort;
        logQueryClone.$recursion = query.$recursion;
        logQueryClone.$group = query.$group;
        log = that.logger.populateInitialLog("query", logQueryClone, that, true);
    }
    var queryData = query[Constants.Query.DATA];
    delete query[Constants.Query.DATA];
    var queryClone = QueryUtility.getQueryClone(query);
    var collection = undefined;
    var queryResult = undefined;
    var events = undefined;
    return that.collection(query[Constants.Query.COLLECTION]).then(
        function (mCollection) {
            if (that.dirty) {
                throw new Error("Database is in dirty state as it has been cleaned>>Query fired was >>>" + JSON.stringify(query));
            }
            collection = mCollection;
            events = getQueryEvents(collection, queryClone);
            return ModuleManager.doQuery(queryClone, DBUtility.deepClone(events), collection, {query: query, executionLevel: executionLevel}, that);
        }).then(
        function () {
            if (that.dirty) {
                throw new Error("Database is in dirty state as it has been cleaned>>Query fired was >>>" + JSON.stringify(query))
            }
            queryData = queryClone[Constants.Query.DATA] || queryData;

            //did for showing history logs for deleted records--ritesh
            return getQueryData(queryClone, queryData, events, collection, that);
        }).then(
        function (result) {
            if (that.dirty) {
                throw new Error("Database is in dirty state as it has been cleaned>>Query fired was >>>" + JSON.stringify(query))
            }
            queryResult = {result: result.result, dataInfo: {hasNext: result.hasNext}};
            if (query.$requireResolveFilter) {
                queryResult.resolvedFilter = queryClone.$filter;
            }
            return ModuleManager.doResult(queryClone, queryResult, DBUtility.deepClone(events), collection, {query: query, executionLevel: executionLevel}, that);
        }).then(
        function () {
            if (that.dirty) {
                throw new Error("Database is in dirty state as it has been cleaned>>Query fired was >>>" + JSON.stringify(query));
            }
            if (template) {
                return getResultFromTemplate(that, templateType, template, queryResult).then(function (queryResult1) {
                    if (queryResult1) {
                        queryResult = queryResult1;
                    }
                    setResultInCache(that, queryString, cache, queryResult);
                    if (that.logger) {
                        that.logger.populateFinalLog(that, log, true);
                    }
                    return queryResult;
                })
            } else {
                setResultInCache(that, queryString, cache, queryResult);
                if (that.logger) {
                    that.logger.populateFinalLog(that, log, true);
                }
                return queryResult;
            }
        }).fail(function (err) {
            if (that.dirty) {
                throw new Error("Database is in dirty state as it has been cleaned>>Query fired was >>>" + JSON.stringify(query));
            }
            if (that.logger) {
                that.logger.populateFinalLog(that, log, true);
            }
            throw err;
        });
}

DB.prototype.query = function (query, options) {
    var that = this;
    var savedQuery = getSavedQuery(query, that); //fun call for resolving query containing $query in place of $collection.
    if (Q.isPromise(savedQuery)) {
        return savedQuery.then(function () {
            return doQuery(query, that, options);
        })
    } else {
        return doQuery(query, that, options);
    }
}

function setResultInCache(that, queryString, cache, queryResult) {
    if (cache && queryResult && queryResult.result && queryResult.result.length > 0 && !queryResult.dataInfo.hasNext) {
        that.setCache(queryString, DBUtility.deepClone(queryResult));
    }
}

function getResultFromTemplate(that, templateType, template, queryResult) {
    if (!templateType || templateType === "ejs") {
        var resolvedTemplate = require('ejs').render(template, queryResult);
        var d = Q.defer();
        d.resolve({result: resolvedTemplate});
        return d.promise;
    } else if (templateType && templateType === "xslt") {
        return that.resolveXslt(template, queryResult);
    }
}

function checkParentFieldInRollUp(rollup, aggregateExp) {
    var found = false;
    for (var key in rollup) {
        var value = rollup[key];
        if (Utility.isJSONObject(value)) {
            if (Object.keys(value)[0] === aggregateExp) {
                found = true;
            }
        } else if (aggregateExp === value) {
            found = true;
        }
    }
    return found;
}

function calculateAggregate(parentQuery, query, data, db) {
    var aggregateResult = {};
    parentQuery = parentQuery.$query || parentQuery;
    query = query.$query || query;
    var fieldInfos = query.$fieldInfo || {};
    var group = query.$group || {};
    var keys = Object.keys(group);
    for (var i = 0; i < keys.length; i++) {
        var groupKey = group[keys[i]];
        if (groupKey && (groupKey["$sum"] !== undefined || groupKey["$avg"] !== undefined)) {
            var groupKeyType = undefined;
            var aggregateExpression = undefined;
            if (groupKey["$sum"]) {
                groupKeyType = "sum";
                aggregateExpression = groupKey["$sum"];
            } else if (groupKey["$avg"]) {
                groupKeyType = "avg";
                aggregateExpression = groupKey["$avg"];
            }
            if (aggregateExpression) {
                var index = aggregateExpression.toString().indexOf("$");
                if (index >= 0) {
                    //removing $ from aggregateExpression
                    aggregateExpression = aggregateExpression.substr(index + 1);
                    //get Field info
                    var fieldInfo = fieldInfos[aggregateExpression];
                    if (fieldInfo && fieldInfo.alias) {
                        aggregateExpression = fieldInfo.alias;
                    }
                    // parent query has $recursion and $rollup is defined in $recursion then change it to total
                    //todo discuss about the hardcode usage of total
                    if (parentQuery.$recursion && parentQuery.$recursion.$rollup && fieldInfo) {
                        if (checkParentFieldInRollUp(parentQuery.$recursion.$rollup, aggregateExpression)) {
                            aggregateExpression = aggregateExpression + ".total";
                        }
                    }
                    // group has recursion and recursion has rollup defined
                    if (parentQuery.$group && parentQuery.$group.$recursion && parentQuery.$group.$recursion.$rollup) {
                        aggregateExpression = modifyAggregateExpression(parentQuery, aggregateExpression);
                    }
                    if (fieldInfo !== undefined) {
                        if (fieldInfo.type === Constants.Admin.Fields.Type.CURRENCY || fieldInfo.ui === Constants.Admin.Fields.Type.CURRENCY) {
                            var total = calculateTotal(data, aggregateExpression, true, false, groupKeyType);
                            aggregateResult[keys[i]] = {amount: total.total, type: total.type};
                        } else if (fieldInfo.type === Constants.Admin.Fields.Type.DURATION || fieldInfo.ui === Constants.Admin.Fields.Type.DURATION) {
                            var total = calculateTotal(data, aggregateExpression, false, true, groupKeyType);
                            aggregateResult[keys[i]] = {time: total.total, unit: Constants.Modules.Udt.Duration.Unit.HRS};
                        } else if (fieldInfo.type === Constants.Admin.Fields.Type.NUMBER || fieldInfo.ui === Constants.Admin.Fields.Type.NUMBER) {
                            var total = calculateTotal(data, aggregateExpression, false, false, groupKeyType);
                            aggregateResult[keys[i]] = total.total;
                        }
                    }
                } else if (keys[i] === "__count") {
                    aggregateResult.__count = data && data.result ? data.result.length : 0;
                }
            }
        }
    }
    return {result: [aggregateResult], "dataInfo": {"hasNext": false}};

}


function modifyAggregateExpression(parentQuery, aggregateExpression) {
    var id = parentQuery.$group._id;
    var groupid = undefined;
    if (typeof id === "string") {
        groupid = id;
    } else {
        if (Utility.isJSONObject(id)) {
            id = [id]
        }
        if (id.length === 1) {
            var groupIdKeys = Object.keys(id[0]);
            groupid = id[0][groupIdKeys[0]];
        }
    }
    if (groupid) {
        var index = groupid.toString().indexOf("$");
        if (index >= 0) {
            groupid = groupid.substr(index + 1);
            var recursionKeys = Object.keys(parentQuery.$group.$recursion);
            for (var j = 0; j < recursionKeys.length; j++) {
                if (recursionKeys[j].indexOf(groupid + ".") === 0) {
                    if (checkParentFieldInRollUp(parentQuery.$group.$recursion.$rollup, aggregateExpression)) {
                        aggregateExpression = aggregateExpression + ".total";
                    }
                }
            }
        }
    }
    return aggregateExpression;
}

function calculateTotal(data, exp, fetchType, durationType, key) {
    var total = 0;
    var result = data ? data.result : [];
    var type = undefined;
    for (var i = 0; i < result.length; i++) {
        var value = Utility.resolveDottedValue(result[i], exp);
        if (fetchType) {
            total += value ? value.amount : 0;
        } else if (durationType) {
            if (value) {
                value = value && value.convertedvalue ? (value.convertedvalue) / 60 : value.time;
                if (value) {
                    total += value;
                }
            }
        } else {
            total += value || 0;
        }
        if (type === undefined && fetchType) {
            type = value ? value.type : undefined;
        }
    }
    if (key === "avg" && total > 0 && result.length > 0) {
        total = total / result.length;
    }
    return {total: total, type: type};
}

DB.prototype.batchQuery = function (batchQueries) {
    var that = this;
    var batchResult = {};
    var subQueryAggregateResult = undefined;
    return ModuleManager.doBatchQuery(batchQueries, {}, that).then(function () {
        var keys = Object.keys(batchQueries);
        var currentKey = undefined;
        return Utility.iterateArrayWithPromise(keys,
            function (index, key) {
                if (key === "$events") {
                    return;
                }
                currentKey = key;
                var innerQuery = batchQueries[key];
                // $parent exists and parentquery is already executed and parentQuery Result has next is false and this query has $aggregate=true
                // then calculate  aggregate manually
                // otherwise fire query for aggregation
                var parentQuery = batchQueries[innerQuery.$parent];
                if ((!parentQuery || parentQuery.$skip === undefined || parentQuery.$skip === 0) && (innerQuery.$aggregate && innerQuery.$parent && batchResult[innerQuery.$parent] && batchResult[innerQuery.$parent].dataInfo && (!batchResult[innerQuery.$parent].dataInfo.hasNext))) {
                    var aggregateTotal = calculateAggregate(parentQuery, innerQuery, batchResult[innerQuery.$parent], that);
                    batchResult[key] = aggregateTotal;
                } else if (innerQuery.$expression) {
                    return resolveExpression(key, innerQuery, batchResult);
                } else {
                    return populateSubQueryAggregation(innerQuery, batchQueries, that).then(
                        function (subQueryAggregateResult1) {
                            subQueryAggregateResult = subQueryAggregateResult1;
                            // modify the group field according to the expression defined in the field aggregateDefination
                            // use case :: on expense dashboard purchase_amount field is added to show the total of purhcase.purchase_base_amount so the developer added a group in gridquery ($group:{"_id":null,$purchase_amount:{"$sum":"$purchase.purhcase_amount_base"}}) and the agggregateQueryGrid created is ($group:{_id:null,$purchase_amount:{"$sum":"$purchase_amount"}}) to correct this aggregateDefination must be specified in field purchase_amount as purchase.purchase_amount_base so that it works perfectly.
                            return modifyAggregateGroupAccordingToDefination(Utility.deepClone(innerQuery), that);
                        }).then(
                        function (innerQuery1) {
                            innerQuery = innerQuery1;
                            var executeQuery = true;
                            if (subQueryAggregateResult) {
                                // remove subquery fields from the aggregate query if the aggregates of subquery fields is already calculated.
                                innerQuery = modifyAggregateQuery(Utility.deepClone(innerQuery), batchQueries);
                                if (innerQuery && innerQuery.$group) {
                                    var found = false;
                                    for (var key in innerQuery.$group) {
                                        if (key !== "_id") {
                                            if (innerQuery.$group[key].$sum !== undefined || innerQuery.$group[key].$min !== undefined || innerQuery.$group[key].$max !== undefined || innerQuery.$group[key].$avg !== undefined) {
                                                found = true;
                                            }
                                        }
                                    }
                                    if (!found) {
                                        executeQuery = false;
                                    }
                                }
                            }
                            var aggregateAsync = innerQuery.$aggregateAsync
                            innerQuery = innerQuery.$query || innerQuery;
                            if (innerQuery.$similarqueries) {// to run single query on elastic search
                                innerQuery = handleSimilarQueries(currentKey, Utility.deepClone(innerQuery), batchQueries);
                            }
                            if (aggregateAsync) {
                                batchResult[currentKey] = {result: [
                                    {$async: true}
                                ]}
                            } else if (executeQuery) {
                                return that.query(innerQuery);
                            }
                        }).then(
                        function (data) {
                            if (data) {
                                populateSubQueryAggregationResult(subQueryAggregateResult, data);
                                batchResult[key] = data;
                            } else if (subQueryAggregateResult) {
                                subQueryAggregateResult._id = null;
                                batchResult[key] = {result: [subQueryAggregateResult], "dataInfo": {"hasNext": false}};
                            }
                        });
                }
            }).then(
            function () {
                return  ModuleManager.doBatchResult(batchQueries, batchResult, {}, that);
            }).then(function () {
                return batchResult;
            });
    })
}


function modifyAggregateGroupAccordingToDefination(query, db) {
    if (query.$aggregate) {
        var innerQuery = query.$query;
        var group = innerQuery.$group;
        var groupKeys = Object.keys(group);
        var groupLength = groupKeys ? groupKeys.length : 0;
        return db.collection(innerQuery.$collection).then(
            function (collectionInfo) {
                var fieldInfos = collectionInfo.getValue("fieldInfos");
                if (fieldInfos) {
                    var groupLength = groupKeys ? groupKeys.length : 0;
                    for (var i = 0; i < groupLength; i++) {
                        var groupKey = groupKeys[i];
                        if (groupKey !== "_id" && group[groupKey].$sum !== undefined) {
                            var fieldInfo = fieldInfos[groupKey];
                            if (fieldInfo && fieldInfo.aggregateDefination) {
                                group[groupKey] = {$sum: fieldInfo.aggregateDefination};
                            }
                        }
                    }
                }
                return query;
            })
    } else {
        var d = Q.defer();
        d.resolve(query);
        return d.promise;
    }
}

function modifyAggregateQuery(aggregateQuery, batchQueries) {
    if (aggregateQuery.$aggregate) {
        var parentQueryKey = aggregateQuery.$parent;
        var parentQuery = batchQueries[parentQueryKey];
        var parentQueryFields = parentQuery.$fields;
        var aggregateQuery = aggregateQuery.$query;
        var parentQuery = batchQueries[parentQueryKey];
        var group = aggregateQuery.$group;
        var groupKeys = Object.keys(group);
        for (var i = 0; i < groupKeys.length; i++) {
            var groupKey = groupKeys[i];
            if (groupKey !== "_id") {
                if (group[groupKey].$sum !== undefined) {
                    var value = group[groupKey].$sum;
                    var mValue = value.toString().substring(1);
                    var parentQueryFields = parentQuery.$fields;
                    if (parentQueryFields[mValue] && parentQueryFields[mValue].$query) {
                        delete group[groupKey];
                    }
                }
            }
        }
    }
    return aggregateQuery;
}


function populateSubQueryAggregationResult(subQueryAggregateResult, data) {
    if (subQueryAggregateResult) {
        if (data && data.result && data.result.length > 0) {
            for (var key11 in subQueryAggregateResult) {
                data.result[0][key11] = subQueryAggregateResult[key11];
            }
        }
    }
}

function populateSubQueryAggregation(innerQuery, batchQueries, db) {
    if (innerQuery.$aggregate) {
        var parentQueryKey = innerQuery.$parent;
        var parentQuery = batchQueries[parentQueryKey];
        var parentQueryFields = parentQuery.$fields;
        var innerQuery = innerQuery.$query;
        var group = innerQuery.$group;
        var groupKeys = Object.keys(group);
        var hasSubQuery = false;
        var groupLength = groupKeys ? groupKeys.length : 0;
        for (var i = 0; i < groupLength; i++) {
            var groupKey = groupKeys[i];
            if (groupKey !== "_id") {
                if (group[groupKey].$sum !== undefined) {
                    var value = group[groupKey].$sum;
                    var mValue = value.toString().substring(1);
                    var parentQueryFields = parentQuery.$fields;
                    if (parentQueryFields[mValue] && parentQueryFields[mValue].$query) {
                        hasSubQuery = true;
                        break;
                    }
                }
            }
        }
        if (hasSubQuery) {
            var clone = Utility.deepClone(parentQuery);
            delete clone.$limit;
            delete clone.$skip;
            clone.$fields = {_id: 1};
            return db.query(clone).then(function (result) {
                if (result && result.result && result.result.length > 0) {
                    var allIds = [];
                    for (var i = 0; i < result.result.length; i++) {
                        allIds.push(result.result[i]._id);
                    }
                    var aggregateResult = {};
                    return Utility.iterateArrayWithPromise(groupKeys,
                        function (index, groupKey) {
                            if (groupKey !== "_id") {
                                if (group[groupKey].$sum !== undefined) {
                                    var value = group[groupKey].$sum;
                                    var mValue = value.toString().substring(1);
                                    var parentQueryFields = parentQuery.$fields;
                                    if (parentQueryFields[mValue] && parentQueryFields[mValue].$query) {
                                        var subQueryToExecute = Utility.deepClone(parentQueryFields[mValue].$query);
                                        subQueryToExecute.$filter = subQueryToExecute.$filter || {};
                                        var fkField = parentQueryFields[mValue].$fk;
                                        subQueryToExecute.$filter[fkField] = {"$in": allIds};
                                        subQueryToExecute.$parameters = innerQuery.$parameters;
                                        return db.query(subQueryToExecute).then(function (subQueryResult) {
                                            if (subQueryResult && subQueryResult.result && subQueryResult.result.length > 0) {
                                                var value = subQueryResult.result[0][parentQueryFields[mValue].$type.scalar];
                                                aggregateResult[mValue] = value;
                                            }
                                        });
                                    }
                                }
                            }
                        }).then(function () {
                            return aggregateResult;
                        });
                }
            });
        } else {
            var d = Q.defer();
            d.resolve();
            return d.promise;
        }
    } else {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
}


function handleSimilarQueries(key, innerQuery, batchQueries) {
    var similarQueries = innerQuery.$similarqueries.queries;
    var dateField = innerQuery.$similarqueries.date;
    var dateFilterValue = innerQuery.$parameters[dateField];
    var dateFilter = [];
    for (var i = 0; i < similarQueries.length; i++) {
        var alias = similarQueries[i].alias;
        var aliasQuery = batchQueries[alias];
        if (aliasQuery) {
            var dateFilterValue = aliasQuery.$parameters[dateField];
            var matchKey = undefined;
            if (dateFilterValue.$gte && dateFilterValue.$lt) {
                var gte = typeof dateFilterValue.$gte === "object" ? dateFilterValue.$gte.toJSON() : dateFilterValue.$gte;
                var lt = typeof dateFilterValue.$lt === "object" ? dateFilterValue.$lt.toJSON() : dateFilterValue.$lt;
                matchKey = gte + "-" + lt;
            } else if (dateFilterValue.$lte) {
                var lte = typeof dateFilterValue.$lte === "object" ? dateFilterValue.$lte.toJSON() : dateFilterValue.$lte;
                matchKey = "*-" + lte;
            }
            if (alias === key) {
                innerQuery.$similarqueries.currentKey = matchKey;
                innerQuery.$similarqueries.currentAlias = key;
            }
            similarQueries[i].key = matchKey;
            dateFilter.push(aliasQuery.$parameters[dateField]);
        }
    }

    innerQuery.$parameters[dateField] = dateFilter;
    return innerQuery;
}

function resolveExpression(key, query, batchResult) {
    var parentInfo = query.$parent;
    var expression = query.$expression;
    var operator = query.$operator;
    if (operator == "=") {
        batchResult[key] = batchResult[expression];
    }
    else {
        var tokens = expression.split("-");
        if (tokens && tokens.length === 1) {
            tokens = expression.split("+");
        }
        var firstInfo = parentInfo[tokens[0].trim()] || {};
        var secondInfo = parentInfo[tokens[1].trim()] || {};
        var firstResult = batchResult[firstInfo.alias];
        var secondResult = batchResult[secondInfo.alias];
        var firstValue = firstResult && firstResult.result && firstResult.result.length > 0 ? firstResult.result[0][firstInfo.value] : undefined;
        var secondValue = secondResult && secondResult.result && secondResult.result.length > 0 ? secondResult.result[0][secondInfo.value] : undefined;
        var result = {};
        if (firstInfo.type === "currency") {
            var firstAmount = firstValue ? firstValue.amount : 0;
            var secondAmount = secondValue ? secondValue.amount : 0;
            var type = firstValue ? firstValue.type : secondValue ? secondValue.type : undefined;
            var targetValue = calculate(firstAmount, secondAmount);
            result[query.$value] = {amount: targetValue, type: type};

        } else if (firstInfo.type === "duration") {
            var firstTime = firstValue ? firstValue.time : 0;
            var secondTime = secondValue ? secondValue.time : 0;
            var targetValue = calculate(firstTime, secondTime);
            result[query.$value] = {time: targetValue, unit: "Hrs"};
        } else if (firstInfo.type === "number") {
            var targetValue = calculate(firstValue, secondValue);
            result[query.$value] = {netTotal: targetValue};
        }
        batchResult[key] = {result: [result]};
    }
    function calculate(firstValue, secondValue) {
        if (operator == "-") {
            return firstValue - secondValue;
        } else if (operator == "+") {
            return firstValue + secondValue;
        }
    }
}


/**
 *  collection : string (populate it from schema passed)OR
 *  collection : JSON object with complete field definiton
 *
 *
 */

DB.prototype.collection = function (collection) {
    if (!collection) {
        var d = Q.defer();
        d.reject(new ApplaneDBError(Constants.ErrorCode.MANDATORY_FIELDS.MESSAGE + "[collection]", Constants.ErrorCode.MANDATORY_FIELDS.CODE));
        return d.promise;
    }
    var startTime = new Date();
    var that = this;
    var collectionInstance = undefined;
    if (typeof collection == "object") {
        collectionInstance = getCollectionInstance(that, collection);
    } else if (DBConstants.globalCollections[collection]) {
        collectionInstance = getCollectionInstance(that, DBConstants.globalCollections[collection]);
    }
    if (collectionInstance) {
        that.logMongoTime("collectionLoad", (new Date() - startTime), true);
        var d = Q.defer();
        d.resolve(collectionInstance);
        return d.promise;
    }
    return CacheService.loadCollection(collection, that).then(
        function (cacheCollection) {
            if (!cacheCollection) {
                throw new Error("Collection can not be loaded>>>>" + collection);
            }
            that.logMongoTime("collectionLoad", (new Date() - startTime), true);
            collectionInstance = getCollectionInstance(that, cacheCollection);
            return collectionInstance;
        })
}

function getCollectionInstance(that, collectionInfo) {
    if (collectionInfo.fields && !collectionInfo.fieldInfos) {
        SELF.populateCollectionInfos(collectionInfo);
    }
    var mongoCollectionName = collectionInfo.__rootCollection || collectionInfo[Constants.Admin.Collections.COLLECTION];
    return new Collection(that.db.collection(mongoCollectionName), that, collectionInfo);
}

exports.populateCollectionInfos = function (collectionInfo) {
    if (!collectionInfo) {
        return;
    }
    var childFields = {};
    var UEFields = {};
    var fieldInfos = {};
    var fkFields = {};
    repopulateFieldInfosAndExcludeModules(collectionInfo.fields, fieldInfos, childFields, UEFields, fkFields);
    collectionInfo.fieldInfos = fieldInfos;
    if (Object.keys(childFields).length > 0) {
        collectionInfo.childFields = childFields;
    }
    if (Object.keys(UEFields).length > 0) {
        collectionInfo.UEFields = UEFields;
    }
    if (Object.keys(fkFields).length > 0) {
        collectionInfo.fkFields = fkFields;
    }
};

function repopulateFieldInfosAndExcludeModules(fields, fieldInfos, childFields, UEFields, fkFields, pField) {
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        var fieldName = field.field;
        var fieldInfoKey = pField ? pField + "." + fieldName : fieldName;
        if (field.query) {
            var query = JSON.parse(field.query);
            if (query.$type === "child" && childFields) {
                childFields[fieldInfoKey] = field;
            } else if (query.$type === "ue") {
                UEFields[fieldInfoKey] = field;
            }
        } else if (field.type === "fk") {
            fkFields[fieldInfoKey] = fields[i];
        }
        fieldInfos[fieldInfoKey] = field;
        if (field.fields) {
            repopulateFieldInfosAndExcludeModules(field.fields, fieldInfos, undefined, UEFields, fkFields, fieldInfoKey);
        }
    }
}

DB.prototype.dropDatabase = function () {
    var D = Q.defer();
    var that = this;
    that.db.dropDatabase(function (err, result) {
        if (err) {
            D.reject(err);
        } else {
            that.clean();
            D.resolve(result);
        }
    });
    return D.promise;
}

DB.prototype.invokeFunction = function (functionName, parameters, options) {
    this.logMongoTime("invokeFunctionCount", 1, true);
    if (!functionName) {
        throw new BusinessLogicError("Function name is mandatory in invoke function.");
    }
    var that = this;
    var log = undefined;
    if (that.logger) {
        log = that.logger.populateInitialLog("invoke", {function: functionName}, that, true);
    }
    var loadedFunction = that.loadFunction(functionName);
    if (Q.isPromise(loadedFunction)) {
        return loadedFunction.then(
            function (result) {
                return that.executeLoadedFunction(result, parameters, that, options);
            }).then(function (loadedResult) {
                if (that.logger) {
                    that.logger.populateFinalLog(that, log, true);
                }
                return loadedResult;
            })
    } else {
        var loadedFunctionResult = that.executeLoadedFunction(loadedFunction, parameters, that, options);
        if (Q.isPromise(loadedFunctionResult)) {
            return loadedFunctionResult.then(function (loadedResult) {
                if (that.logger) {
                    that.logger.populateFinalLog(that, log, true);
                }
                return loadedResult;
            })
        } else {
            if (that.logger) {
                that.logger.populateFinalLog(that, log, true);
            }
            var d = Q.defer();
            d.resolve(loadedFunctionResult);
            return d.promise;
        }
    }
}

DB.prototype.getFunctionDefinition = function (functionName) {
    if (Utility.isJSONObject(functionName)) {
        return functionName;
    }
    var functionToCall = undefined;
    var dotIndex = functionName.indexOf(".");
    if (dotIndex > 0) {
        functionToCall = functionName.substring(dotIndex + 1);
        functionName = functionName.substring(0, dotIndex);
    } else {
        functionToCall = functionName;
    }
    if (DBConstants.systemFunctions[functionName]) {
        return resolveFunctionDef(DBConstants.systemFunctions[functionName], functionName, functionToCall, dotIndex);
    }
    var that = this;
    return CacheService.loadFunction(functionName, that).then(
        function (functionInfo) {
            return resolveFunctionDef(functionInfo, functionName, functionToCall, dotIndex);
        })
};

function resolveFunctionDef(functionDef, functionName, functionToCall, dotIndex) {
    if (functionDef.type == "js") {
        functionDef = QueryUtility.getReference(functionDef);
        functionDef.source = functionDef.source + "/" + functionName;
        functionDef.name = functionToCall;
        return functionDef;
    } else if (dotIndex > 0) {
        throw new BusinessLogicError("Function not supported [" + JSON.stringify(functionDef)) + "]"
    } else {
        return functionDef;
    }
}

DB.prototype.executeLoadedFunction = function (loadedFunction, parameters, db, options) {
    var funParmeters = [];
    if (parameters) {
        parameters.forEach(function (parameter) {
            funParmeters.push(parameter);
        });
    }
    funParmeters.push(db);
    if (options) {
        funParmeters.push(options);
    }
    var funcitonPromise = undefined;
    try {
        funcitonPromise = loadedFunction.apply(null, funParmeters);
        return funcitonPromise;
    } catch (err) {
        throw err;
    }
}

DB.prototype.loadFunctionInternal = function (functionDef) {
    if (!functionDef.name) {
        throw new Error("Function name could not be found..." + JSON.stringify(functionDef));
    }
    var requireModule = REQUIRED[functionDef.source];
    var loadedFunction = undefined;
    if (requireModule) {
        if (requireModule instanceof Error) {
            throw requireModule;
        }
        loadedFunction = requireModule[functionDef.name];
    } else {
        try {
            var requireModule = require(functionDef.source);
            REQUIRED[functionDef.source] = requireModule;
            loadedFunction = requireModule[functionDef.name];
        } catch (e) {
        }
    }
    if (loadedFunction) {
        return loadedFunction;
    }
    var d = Q.defer();
    var requireJS = require("requirejs");
    requireJS([functionDef.source], function (requireModule) {
        if (!requireModule) {
            d.reject(new Error("Function not found for[" + JSON.stringify(functionDef) + "]"));
            return;
        }
        REQUIRED[functionDef.source] = requireModule;
        var loadedFunction = requireModule[functionDef.name];
        if (loadedFunction) {
            d.resolve(loadedFunction);
        } else {
            d.reject(new Error("Function not found for[" + JSON.stringify(functionDef.name) + "]"));
        }
    });
    requireJS.onError = function (err) {
        REQUIRED[functionDef.source] = err;
        d.reject(err);
    };
    return d.promise;
}


DB.prototype.loadFunction = function (functionName) {
    var that = this;
    var functionDef = that.getFunctionDefinition(functionName);
    if (Q.isPromise(functionDef)) {
        return functionDef.then(function (result) {
            return that.loadFunctionInternal(result);
        })
    } else {
        return that.loadFunctionInternal(functionDef);
    }
}

DB.prototype.uploadFile = function (fileName, dataArray) {
    var d = Q.defer();
    var objectId = new ObjectID();
    var gridStore = new GridStore(this.db, objectId, fileName, "w");
    gridStore.open(function (err) {
        if (err) {
            d.reject(err);
            return;
        }
        Utility.iterateArrayWithPromise(dataArray,
            function (index, buffer) {
                var d1 = Q.defer();
                gridStore.write(buffer, function (err, res) {
                    if (err) {
                        d1.reject(err);
                    } else {
                        d1.resolve(res);
                    }
                });
                return d1.promise;
            }).then(
            function () {
                var d1 = Q.defer();
                gridStore.close(function (err) {
                    if (err) {
                        d1.reject(err);
                    } else {
                        d1.resolve()
                    }
                })
                return d1.promise;
            }).then(
            function () {
                d.resolve(objectId.toString());
            }).fail(function (e) {
                d.reject(e);
            })
    })
    return d.promise;
};

DB.prototype.downloadFile = function (fileKey) {
    if (!fileKey) {
        throw new Error("Filekey not found ");
    }
    var d = Q.defer();
    fileKey = new ObjectID(fileKey.toString());
    var gridStore = new GridStore(this.db, fileKey, "r");
    gridStore.open(function (err) {
        if (err) {
            d.reject(err);
            return;
        }
        gridStore.seek(0, 0, function (err) {
            if (err) {
                d.reject(err);
                return;
            }
            gridStore.read(function (err, data) {
                if (err) {
                    d.reject(err);
                    return;
                }
                d.resolve({metadata: {filename: gridStore.filename, contentType: gridStore.contentType}, data: data});
            });
        });
    });
    return d.promise;
};
DB.prototype.removeFile = function (fileKey) {
    if (!fileKey) {
        throw new Error("Filekey not found ");
    }
    var d = Q.defer();
    fileKey = new ObjectID(fileKey.toString());
    var gridStore = new GridStore(this.db, fileKey, "r");
    gridStore.open(function (err) {
        if (err) {
            d.reject(err);
            return;
        }
        gridStore.unlink(function (err, result) {
            if (err) {
                d.reject(err);
                return;
            }
            return d.resolve();
        });
    });
    return d.promise;
};

exports.configure = function (options) {
    if (!options) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    for (var key in options) {
        var value = options[key];
        if (value) {
            Config[key] = value;
        }
    }

    if (Config.BASE_URL) {
        var requiredJS = require("requirejs");
        requiredJS.config({baseUrl: Config.BASE_URL});
    }
    return ensureAdmin(options);
}

function ensureAdmin(options) {
    if (!options.ENSURE_DB) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var adminDb = undefined;
    return SELF.connect(Config.URL, Config.Admin.DB, {username: Config.Admin.USER_NAME, password: Config.Admin.PASSWORD, ensureDB: options.ENSURE_DB}).then(
        function (adminDb1) {
            adminDb = adminDb1
            return adminDb.query({$collection: Constants.Admin.DBS, $filter: {db: Config.Admin.DB}});
        }).then(
        function (data) {
            if (data.result.length === 0) {
                return adminDb.update({$collection: Constants.Admin.DBS, $upsert: [
                    {$query: {db: Config.Admin.DB}, $set: {developmentRight: true}}
                ]});
            }
        }).then(
        function () {
            return adminDb;
        })
}

exports.registerCollection = function (collections) {
    var d = Q.defer();
    if (!collections) {
        d.resolve();
        return d.promise;
    }
    if (Array.isArray(collections)) {
        for (var i = 0; i < collections.length; i++) {
            var collection = collections[i].collection;
            DBConstants.globalCollections[collection] = collections[i];
        }

    } else if (collections.collection) {
        DBConstants.globalCollections[collections.collection] = collections;
    } else {
        for (var k in collections) {
            var collection = collections[k];
            DBConstants.globalCollections[collection.collection] = collection;
        }
    }
    d.resolve();
    return d.promise;

}

exports.removeCollections = function (collections) {
    if (!collections) {
        return;
    }
    if (Array.isArray(collections)) {
        for (var i = 0; i < collections.length; i++) {
            delete DBConstants.globalCollections[collections[i]];
        }
    } else {
        delete DBConstants.globalCollections[collections];
    }
}

exports.registerFunction = function (functions) {
    var d = Q.defer();
    if (!functions) {
        d.resolve();
        d.promise;
    }
    if (Array.isArray(functions)) {
        for (var i = 0; i < functions.length; i++) {
            var fn = functions[i].name;
            DBConstants.systemFunctions[fn] = functions[i];
        }
    } else if (functions.name) {
        DBConstants.systemFunctions[functions.name] = functions;
    } else {
        for (var k in functions) {
            var fn = functions[k];
            DBConstants.systemFunctions[fn.name] = fn;
        }
    }
    d.resolve();
    return d.promise;
}

DB.prototype.startTransaction = function () {
    var that = this;
    var txsDbs = that.txsDbs;
    var txsDbsNames = txsDbs ? Object.keys(txsDbs) : undefined;
    return Utility.iterateArrayWithPromise(txsDbsNames,
        function (index, txdbName) {
            return txsDbs[txdbName].startTransaction();
        }).then(function () {
            that.txid = that.txid || Utility.getUnique();
            return that.txid;
        })
}

DB.prototype.commitTransaction = function (options) {
    var that = this;
    var txsDbs = that.txsDbs;
    var txsDbsNames = txsDbs ? Object.keys(txsDbs) : undefined;
    return Utility.iterateArrayWithPromise(txsDbsNames,
        function (index, txdbName) {
            return txsDbs[txdbName].commitTransaction(options).then(function () {
                delete txsDbs[txdbName];
            });
        }).then(
        function () {
            if (!that.txid) {
                return;
            }
            var updates = [
                {$collection: Constants.TRANSACTIONS, $update: [
                    {$query: {txid: that.txid}, $set: {status: "commit"}}
                ]}
            ];
            var log = undefined;
            if (that.logger) {
                log = that.logger.populateInitialLog("Commit Transaction", {"type": "DB : Commit"}, that, true);
            }
            return that.mongoUpdate(updates, {multi: true}).then(
                function () {
                    return ModuleManager.triggerModules("onCommit", undefined, undefined, that, {});
                }).then(
                function () {
                    return that.processOnCommitQueue(options);
                }).then(function () {
                    that.txid = undefined;
                    if (that.logger) {
                        that.logger.populateFinalLog(that, log, true);
                    }
                })
        })
}

DB.prototype.rollbackTransaction = function () {
    var that = this;
    var txsDbs = that.txsDbs;
    var txsDbsNames = txsDbs ? Object.keys(txsDbs) : undefined;
    return Utility.iterateArrayWithPromise(txsDbsNames,
        function (index, txdbName) {
            return txsDbs[txdbName].rollbackTransaction().then(function () {
                delete txsDbs[txdbName];
            });
        }).then(
        function () {
            if (!that.txid) {
                return;
            }
            var updates = [
                {$collection: Constants.TRANSACTIONS, $update: [
                    {$query: {_id: that.txid}, $set: {status: "rollback"}}
                ]}
            ];
            var log = undefined;
            if (that.logger) {
                log = that.logger.populateInitialLog("Rollback Transaction", {"type": "Txn Module : Rollback"}, that, true);
            }
            return that.mongoUpdate(updates, {multi: true}).then(
                function () {
                    return ModuleManager.triggerModules("onRollback", undefined, undefined, that, {});
                }).then(
                function () {
                    return that.processOnRollbackQueue();
                }).then(function () {
                    that.txid = undefined;
                    if (that.logger) {
                        that.logger.populateFinalLog(that, log, true);
                    }
                })
        })
}
DB.prototype.getLogger = function () {
    return this.logger;
}
DB.prototype.setLogger = function (logger) {
    this.logger = logger;
}


DB.prototype.invokeService = function (service, params, options) {
    var that = this;
    var log = undefined;
    var stime = new Date();
    if (that.logger) {
        log = that.logger.populateInitialLog("invokeService", {service: service, params: params}, that, true);
    }
    var httpUtil = require("ApplaneCore/apputil/httputil.js");

    var D = Q.defer();
    var timeOut = undefined;
    if (service && service.applaneTimeOut) {
        timeOut = service.applaneTimeOut;
        delete service.applaneTimeOut;
    }

    httpUtil.executeServiceAsPromise(service, params, options).then(
        function (result) {
            that.logMongoTime("invokeService", (new Date() - stime), true);
            if (that.logger) {
                that.logger.populateFinalLog(that, log, true);
            }
            if (D) {
                D.resolve(result);
                D = undefined;
            }

        }).fail(function (err) {
            if (D) {
                D.reject(err);
                D = undefined;
            }

        });
    if (timeOut) {
        setTimeout(function () {
            if (D) {
                D.reject(new Error("Time out"));
                D = undefined;
            }
        }, timeOut)
    }
    return D.promise;
}


/***
 *  Txdb is used to manage transaction for other dbs with same reference.like we have to manage transaction of adminDb.
 * @param dbName
 * @return {*}
 */
DB.prototype.txDB = function (dbName) {
    this.txsDbs = this.txsDbs || {};
    if (this.txsDbs[dbName]) {
        var d = Q.defer();
        d.resolve(this.txsDbs[dbName]);
        return d.promise;
    }
    var txDb = undefined;
    var that = this;
    return that.connectUnauthorized(dbName).then(
        function (newDb) {
            txDb = newDb;
            that.txsDbs[dbName] = txDb;
            if (that.txid !== undefined) {
                return txDb.startTransaction();
            }
        }).then(function () {
            return txDb;
        })
}

// this method is used in case of connection get using cache. userInfo contain connection info. -- Rajit garg
exports.connectUnauthorizedFromCache = function (userInfo) {
    if (!userInfo || !userInfo.db) {
        throw new Error("Connection info not found>>>>>>");
    }
    var url = Config.URL + "/" + userInfo.db + "/";
    return connectToMongo(url).then(
        function (mongoDB) {
            return getDBInstance(mongoDB, userInfo.user, userInfo.globalDatabaseName, userInfo.options);
        }).then(function (db) {
            db.userRoles = userInfo.userRoles;
            return db;
        })
};

exports.connectUnauthorized = function (dbName, skipUser) {
    if (!dbName) {
        throw new ApplaneDBError(Constants.ErrorCode.MANDATORY_FIELDS.MESSAGE + "[db] while connectUnauthorized", Constants.ErrorCode.MANDATORY_FIELDS.CODE);
    }
    var that = this;
    if (skipUser) {
        var dbInfo = undefined;
        return getDBDetail(Config.URL, dbName).then(
            function (info) {
                dbInfo = info;
                var url = Config.URL + "/" + dbName + "/";
                return connectToMongo(url);
            }).then(
            function (mongoDB) {
                var globalDatabaseName = dbInfo && dbInfo[Constants.Admin.Dbs.GLOBAL_DB] ? dbInfo[Constants.Admin.Dbs.GLOBAL_DB] : undefined;
                return getDBInstance(mongoDB, undefined, globalDatabaseName);
            })
    } else {
        return that.getAdminDB().then(
            function (adminDb) {
                return adminDb.query({$collection: "pl.dbs", $filter: {db: dbName}, $fields: {code: 1, globalUserName: 1}});
            }).then(function (result) {
                if (result.result.length == 0) {
                    throw new BusinessLogicError("DB not found[" + dbName + "] while making connect");
                }
                result = result.result[0];
                return SELF.connectWithCode(Config.URL, dbName, result.code, {username: result.globalUserName});
            })
    }
}

function getDBInstance(mongoDB, user, globalDatabaseName, options) {
    var db = new DB(mongoDB, user, options);
    db.globalDatabaseName = globalDatabaseName;
    db.mongoTime = {};
    return db;
}

exports.getAdminDB = function () {
    if (CONFIG_DBS.admindb) {
        var d = Q.defer();
        d.resolve(CONFIG_DBS.admindb);
        return d.promise;
    } else {
        return SELF.connect(Config.URL, Config.Admin.DB, {username: Config.Admin.USER_NAME, password: Config.Admin.PASSWORD}).then(
            function (adb) {
                CONFIG_DBS.admindb = adb;
                return CONFIG_DBS.admindb;
            })
    }

}

DB.prototype.getAdminDB = function () {
    return SELF.getAdminDB();
}

DB.prototype.connectUnauthorized = function (dbName, skipUser) {
    return SELF.connectUnauthorized(dbName, skipUser);
}

DB.prototype.getGlobalDB = function () {
    var that = this;
    if (that.isGlobalDB()) {
        var D = Q.defer();
        D.resolve();
        return D.promise;
    } else if (that.globalDb) {
        var D = Q.defer();
        D.resolve(that.globalDb);
        return D.promise;
    } else {
        return getDBDetail(Config.URL, that.globalDatabaseName).then(
            function (dbInfo) {
                if (!dbInfo) {
                    throw new BusinessLogicError("Db [" + that.globalDatabaseName + "] does not exists.");
                }
                if (!dbInfo[Constants.Admin.Dbs.GLOBAL_USER_NAME]) {
                    throw new BusinessLogicError("GlobalUserName does not exist in db [" + that.globalDatabaseName + "]");
                }
                return SELF.connectWithCode(Config.URL, that.globalDatabaseName, dbInfo[Constants.Admin.Dbs.CODE], {username: dbInfo[Constants.Admin.Dbs.GLOBAL_USER_NAME]});
            }).then(
            function (globalDb) {
                that.globalDb = globalDb;
                that.globalDb.mongoTime = that.mongoTime;
                that.globalDb.setLogger(that.logger);
                return that.globalDb;
            })
    }
}

DB.prototype.processOnRollbackQueue = function () {
    this.queue = undefined;
}

DB.prototype.addToQueue = function (params) {
    var d = Q.defer();
    this.queue = this.queue || [];
    this.queue.push({mongoUpdates: params.mongoUpdates, options: params.options, function: params.function, parameters: params.parameters, queueName: params.queueName});
    if (this.txid === undefined) { // if the db in not transaction enabled then we have to execute the queue immediately.
        var sync = params.sync; // to be passed from the testcases
        if (sync) {
            return this.processOnCommitQueue({sync: sync}).then(function () {
                d.resolve();
            });
        } else {
            this.processOnCommitQueue();
            d.resolve();
        }
    } else {
        d.resolve();
    }
    return d.promise;
}

DB.prototype.processOnCommitQueue = function (options) {
    if (this.queue === undefined) {
        return;
    }
    var db = this.asyncDB();
    db.queue = this.queue;
    this.queue = undefined;
    var username = db.user ? db.user.username : undefined;
    var startTime = new Date();
    var logId = Utility.getUniqueObjectId();
    var insertLog = {startTime: startTime, db: db.db.databaseName, username: username, serviceType: "queue", info: JSON.stringify(db.queue), key: "process queue", processName: "process queue"};
    var serviceLogParams = {startTime: startTime};
    serviceLogParams.logId = logId;
    return require("./Http.js").addServiceLog(logId, insertLog).then(
        function () {
            if (options && options.sync) {
                return db.processQueue().then(
                    function () {
                        serviceLogParams.mongoTime = db.mongoTime;
                        return require("./Http.js").updateServiceLog(serviceLogParams);
                    }).then(function () {
                        db.clean();
                    });
            } else {
                db.processQueue().fail(
                    function (err) {
                        var errDetail = {};
                        errDetail.message = err.message;
                        errDetail.stack = err.stack;
                        serviceLogParams.error = errDetail;
                        var options = {to: "rohit.bansal@daffodilsw.com", from: "developer@daffodilsw.com", subject: "Process on Commit Queue"};
                        var html = '';
                        html += "<b>USER</b>" + db && db.user ? db.user.username : undefined + "<br>";
                        html += "<b>ERROR:  </b>" + JSON.stringify(errDetail) + "<br>";
                        html += "<b>SERVER NAME  :  </b>" + Config.SERVER_NAME + "<br>";
                        html += "<b>DATE :  </b>" + new Date() + "<br>";
                        options.html = html;
                        return require("ApplaneDB/lib/MailService.js").sendFromAdmin(options).fail(function (err) {
                            var ErrorHandler = require("./ErrorHandler.js");
                            return ErrorHandler.handleError(err, ErrorHandler.TYPE.MAIL_ERROR, db);
                        })
                    }).then(
                    function () {
                        serviceLogParams.mongoTime = db.mongoTime;
                        return require("./Http.js").updateServiceLog(serviceLogParams);
                    }).then(function () {
                        db.clean();
                    });
            }
        });
}

DB.prototype.setContext = function (context) {
    this.$context = context;
}

DB.prototype.getContext = function () {
    return this.$context;
}

function processOperation(queueData, db) {
    if (queueData.mongoUpdates) {
        var operation = queueData.mongoUpdates;
        var options = queueData.options;
        return db.mongoUpdate(operation, options);
    } else if (queueData.function) {
        var functionName = queueData.function;
        var parameters = queueData.parameters;
        var options = queueData.options;
        return db.invokeFunction(functionName, [parameters], options);
    }
}

DB.prototype.processQueue = function () {
    var d = Q.defer();
    var that = this;
    setImmediate(function () {
        var queueData = that.queue && that.queue.length > 0 ? that.queue[0] : undefined;
        if (queueData) {
            var username = that.user ? that.user.username : undefined;
            var startTime = new Date();
            var logId = Utility.getUniqueObjectId();
            var insertLog = {startTime: startTime, db: that.db.databaseName, username: username, serviceType: "queue item", info: JSON.stringify(queueData), key: queueData.queueName, processName: "process queue"};
            var serviceLogParams = {startTime: startTime};
            serviceLogParams.logId = logId;
            return require("./Http.js").addServiceLog(logId, insertLog).then(
                function () {
                    return processOperation(queueData, that);
                }).then(
                function (result) {
                    that.queue.splice(0, 1);
                    serviceLogParams.mongoTime = that.mongoTime;
                    return require("./Http.js").updateServiceLog(serviceLogParams);
                }).then(
                function () {
                    if (that.queue && that.queue.length > 0) {
                        return that.processQueue();
                    }
                }).then(
                function () {
                    d.resolve();
                }).fail(function (err) {
                    var errDetail = {};
                    errDetail.message = err.message;
                    errDetail.stack = err.stack;
                    serviceLogParams.error = errDetail;
                    return require("./Http.js").updateServiceLog(serviceLogParams).then(function () {
                        d.reject(err);
                    });
                });
        } else {
            d.resolve();
        }
    });
    return d.promise;
}

DB.prototype.clean = function () {
    delete this.mongoTime;
    delete this.updates;
    delete this.db;
    this.dirty = true;
    if (this.globalDb) {
        this.globalDb.clean();
        delete this.globalDb;
    }
    if (this.logger) {
        delete this.logger.info;
    }
    delete this.lrucache;
    delete this.logger;
    delete this.cache;
}

DB.prototype.toClientTimezone = function (date) {

    if (this.options && this.options.userTimezoneOffset) {
        return new Date(date.getTime() + (this.serverTimezoneOffset - this.options.userTimezoneOffset) * 60 * 1000);
    } else {
        return new Date(date);
    }
}

DB.prototype.asyncDB = function () {
    var db = getDBInstance(this.db, this.user, this.globalDatabaseName, this.options);
    db.userRoles = this.userRoles;
    var context = this.getContext();
    if (context) {
        db.setContext(context);
    }
    //we will not set admin db as it will get dirty, admin db will be created automatically for asyncDB when required
    return db;

}

function validateTemplate(mailTemplate) {
    var startCount = getCount(mailTemplate, "<%");
    var endCount = getCount(mailTemplate, "%>");
    if (startCount != endCount) {
        throw new Error("[ StartCount = " + startCount + "---- EndCount = " + endCount + ">>>>> Template is = " + mailTemplate + "]");
    }
}


DB.prototype.resolveXsltTemp = function (template, queryResult) {
    queryResult = Utility.deepClone(queryResult);

    // here objectID fields like _id becomes string due to xml parse problem
    Utility.convert_IdToString(queryResult);
    var xml = require("js2xmlparser")("root", queryResult);    //gives xml    , while the data object can contain arrays, it cannot itself be an array (object or JSON string, mandatory)
    var xslt = require('node_xslt');                             // for installing this, first of all install this   sudo apt-get install libxml2-dev libxslt-dev
    var document = xslt.readXmlString(xml);
    var stylesheet = xslt.readXsltString(template);   // template = xslt
    var resolvedTemplate = xslt.transform(stylesheet, document, []);
    var d = Q.defer();
    d.resolve({result: resolvedTemplate});
    return d.promise;
}

DB.prototype.resolveXslt = function (template, queryResult) {
    return this.invokeService({
        hostname: "106.185.36.84",
        port: 6200,
        method: "POST",
        path: "/rest/xslt"
    }, {
        template: template, result: JSON.stringify(queryResult)
    }).then(function (result) {
            result = JSON.parse(result);
            return {result: result.response};

        })
//    executeServiceAsPromise
//    queryResult = Utility.deepClone(queryResult);
//
//    // here objectID fields like _id becomes string due to xml parse problem
//    Utility.convert_IdToString(queryResult);
//    var xml = require("js2xmlparser")("root", queryResult);    //gives xml    , while the data object can contain arrays, it cannot itself be an array (object or JSON string, mandatory)
//    var xslt = require('node_xslt');                             // for installing this, first of all install this   sudo apt-get install libxml2-dev libxslt-dev
//    var document = xslt.readXmlString(xml);
//    var stylesheet = xslt.readXsltString(template);   // template = xslt
//    var resolvedTemplate = xslt.transform(stylesheet, document, []);
//    var d = Q.defer();
//    d.resolve({result:resolvedTemplate});
//    return d.promise;
}

function getQueryEvents(collection, query) {
    if (query.$events === false) {
        return;
    }
    var events = collection.getValue("events");
    events = DBUtility.deepClone(events) || [];
    var queryEvents = query.$events || [];
    if (Utility.isJSONObject(queryEvents)) {
        queryEvents = [queryEvents];
    }
    for (var i = 0; i < queryEvents.length; i++) {
        var index = Utility.isExists(events, queryEvents[i], "function");
        if (index !== undefined) {
            var collectionEvent = events[index];
            for (var key in queryEvents[i]) {
                collectionEvent[key] = queryEvents[i][key];
            }
        } else {
            events.push(queryEvents[i]);
        }
    }
    return events;
}

DB.prototype.sendMail = function (options) {
    var D = Q.defer();
    var that = this;
    if (options === undefined) {
        D.reject("options are undefined");
        return D.promise;
    }
    if (options[Constants.MailService.Options.TO] === undefined) {
        D.reject("to cannot be undefined while sending mail>>>" + JSON.stringify(options));
        return D.promise;
    }
    var log = undefined;
    if (that.logger) {
        log = that.logger.populateInitialLog("sendmail", {"type": "DB : SendMail"}, that, true);
    }
    var MailService = require("./MailService.js");
    var mailTemplate = options[Constants.MailService.Options.TEMPLATE];
    if (mailTemplate) {
        var templateData = options[Constants.MailService.Options.TEMPLATE_DATA];
        validateTemplate(mailTemplate);
        var html = templateData ? require("ejs").render(mailTemplate, templateData) : mailTemplate;
        delete options[Constants.MailService.Options.TEMPLATE];
        delete options[Constants.MailService.Options.TEMPLATE_DATA];
        options[Constants.MailService.Options.HTML] = html;
    }
    var stime = new Date();
    return sendMailFromService(options, that).then(function (result) {
        that.logMongoTime("invokeService", (new Date() - stime), true);
        if (that.logger) {
            that.logger.populateFinalLog(that, log, true);
        }
        return result;

    })

}

function sendMailFromService(options, that) {
    var MailService = require("./MailService.js");
    if (options.sendgrid) {
        return MailService.sendAsSendGrid(options, that);
    } else if (options.nodemailer) {
        return MailService.sendAsNodeMailer(options, that);
    } else if (options.amazon) {
        return MailService.sendAsAmazon(options, that);
    } else {
        return MailService.sendMail(options, that);
    }
}

function getCount(template, toCheck) {
    if (!template || !toCheck) {
        return 0;
    }
    var count = 0;
    var startIndex = template.indexOf(toCheck);
    while (startIndex >= 0) {
        count = count + 1;
        startIndex = template.indexOf(toCheck, startIndex + 1);
    }
    return count;
}

DB.prototype.resolveFK = function (collection, field, updates, options) {
    var that = this;
    return that.collection(collection).then(
        function (collectionObj) {
            var fieldInfos = collectionObj.getValue("fieldInfos");
            var collectionName = collectionObj.getValue("collection");
            var fieldInfo = fieldInfos[field];
            if (!fieldInfo) {
                throw new BusinessLogicError("FieldInfo not found for field [" + field + "] in collection [" + collection + "]");
            }
            var oldValue = options && options.old ? options.old : undefined;
            var upsert = (options && options.upsert !== undefined) ? options.upsert : undefined;
            var newOptions = {updatedFieldInfo: fieldInfo, upsert: upsert, collectionName: collectionName, field: field};
            if (options && options.$modules) {
                newOptions.$modules = options.$modules;
            }
            return require("./modules/DBRef").onValueChange(updates, oldValue, that, newOptions);
        }).then(
        function () {
            return updates;
        })
};

DB.prototype.tempMongoQuery = function (dbName, collection, filter, options, url) {
//    url = url || "mongodb://173.255.119.199:27017/" + dbName + "/";

    url = url || Config.URL + "/daffodilswmongo/";
    var d = Q.defer();
    options = options || {};

    connectToMongo(url).then(
        function (mongoDB) {
            mongoDB.collection(collection).find(filter, options).toArray(function (err, result) {
                if (err) {
                    d.reject(err);
                    return;
                }
                d.resolve(result);
            })
        }).fail(function (err) {
            d.reject(err);
        })

    return d.promise;

}

DB.prototype.tempMongoConnection = function (url) {
    return connectToMongo(url);
}

DB.prototype.setTxid = function (txid) {
    this.txid = txid;
}

exports.onMasterServerStartUp = function (admindb, pid) {
    return admindb.invokeFunction("Porting.manageServerStartUp", [
        {pid: pid}
    ]);
};

DB.prototype.createProcess = function (options) {
    var that = this;
    options = options || {};
    return insertProcess(that, options).then(function (data) {
        data = data[Constants.Admin.PROCESSES][Constants.Update.INSERT];
        if (data && data.length > 0) {
            options.processid = data[0]._id;
            return  {processid: data[0]._id, status: "In Progress", async: true};
        }
    });
}

DB.prototype.startProcess = function (array, functionName, options) {
    var db = this;
    options = options || {};
    var total = array ? array.length : 0;
    var processUpdates = {$set: {total: total}};
    var username = db.user ? db.user.username : undefined;
    var startTime = new Date();
    var info = JSON.stringify({data: array, function: functionName, options: options});
    var logId = Utility.getUniqueObjectId();
    var insertLog = {startTime: startTime, db: db.db.databaseName, username: username, serviceType: "process", info: info, key: functionName, processName: options.processName};
    var serviceLogParams = {startTime: startTime};
    serviceLogParams.logId = logId;
    return require("./Http.js").addServiceLog(logId, insertLog).then(
        function () {
            return updateProcess(processUpdates, options.processid, db);
        }).then(function () {
            var txEnabled = options && options.txEnabled !== undefined ? options.txEnabled : true;
            var autoClean = options && options.autoClean !== undefined ? options.autoClean : true;
            var successLogs = options && options.successLogs !== undefined ? options.successLogs : true;
            var hasError = false;
            var errorCount = 0;
            return Utility.iterateArrayWithPromise(array,
                function (index, row) {
                    var process = {};
                    var p = undefined;
                    if (txEnabled) {
                        p = db.startTransaction();
                    } else {
                        var D = Q.defer();
                        D.resolve();
                        p = D.promise;
                    }
                    return p
                        .then(
                        function () {
                            return db.invokeFunction(functionName, [
                                {index: index, data: row, process: process}
                            ], options);
                        }).then(
                        function () {
                            if (successLogs) {
                                return updateProcessProgress(db, options.processid, process);
                            } else {
                                var update = {$inc: {processed: 1}};
                                return updateProcess(update, options.processid, db);
                            }
                        }).then(
                        function () {
                            if (txEnabled) {
                                return  db.commitTransaction();
                            }
                        }).fail(
                        function (err) {
                            errorCount += 1;
                            hasError = true;
                            serviceLogParams.error = err;
                            var errDetail = Utility.getErrorInfo(err);
                            if (txEnabled) {
                                return updateProcessProgress(db, options.processid, process, errorCount, errDetail).then(function () {
                                    return db.rollbackTransaction();
                                });
                            } else {
                                return updateProcessProgress(db, options.processid, process, errorCount, errDetail);
                            }
                        })
                }).then(
                function () {
                    var status = hasError ? "error" : "success";
                    return updateProcess({$set: { status: status, errorCount: errorCount}}, options.processid, db);
                }).then(
                function () {
                    serviceLogParams.mongoTime = db.mongoTime;
                    return require("./Http.js").updateServiceLog(serviceLogParams);
                }).then(function () {
                    serviceLogParams = undefined;
                    if (autoClean) {
                        return db.clean();
                    }
                })
        })
}

function getDb(db, txEnabled) {
    if (!txEnabled) {
        var d = Q.defer();
        d.resolve(db);
        return d.promise;
    }
    var asyncDb = db.asyncDB();
    return asyncDb.startTransaction().then(function () {
        return asyncDb;
    })
}

function insertProcess(db, options) {
    var update = {};
    update[Constants.Update.COLLECTION] = Constants.Admin.PROCESSES;
    var inserts = [
        {status: "In Progress", name: options.processName, date: new Date()}
    ];
    if (db.user) {
        inserts[0].user = {_id: db.user._id, username: db.user.username, emailid: db.user.emailid};
    }
    update[Constants.Update.INSERT] = inserts;
    return db.mongoUpdate(update);
}

function updateProcess(update, processid, db) {
    var updates = {};
    updates[Constants.Update.COLLECTION] = Constants.Admin.PROCESSES;
    update.$query = {_id: processid};
    updates[Constants.Update.UPDATE] = update;
    return db.mongoUpdate(updates);
}

function updateProcessProgress(db, processid, options, index, err) {
    var update = {};
    var status = err === undefined ? "success" : "error";
    update.$push = {};
    update.$push[Constants.Admin.Processes.DETAIL] = {$each: [
        {_id: Utility.getObjectId(), status: status, message: options.message, error: JSON.stringify(err), index: index}
    ]};
    update.$inc = {processed: 1};
    return updateProcess(update, processid, db);
}

function prepareUpdates(updates) {
    if (Utility.isJSONObject(updates)) {
        updates = [updates];
    }
    var finalUpdates = [];
    if (updates) {
        for (var i = 0; i < updates.length; i++) {
            var update = updates[i];
            populateFinalUpdates(update, update.$insert, "$insert", finalUpdates);
            populateFinalUpdates(update, update.$update, "$update", finalUpdates);
            populateFinalUpdates(update, update.$delete, "$delete", finalUpdates);
            populateFinalUpdates(update, update.$upsert, "$upsert", finalUpdates);
        }
    }
    return finalUpdates;
}

function populateFinalUpdates(update, value, operator, finalUpdates) {
    if (value) {
        if (Utility.isJSONObject(value)) {
            value = [value];
        }
        for (var i = 0; i < value.length; i++) {
            var newUpdate = {};
            newUpdate[operator] = value[i];
            for (var k in update) {
                if (k !== "$insert" && k !== "$update" && k !== "$delete" && k !== "$upsert") {
                    newUpdate[k] = update[k];
                }
            }
            finalUpdates.push(newUpdate);
        }
    }
}

DB.prototype.synchronize = function (lock, task) {
    var that = this;
    var lockId = undefined;
    var synchErr = undefined;
    var adminDB = undefined;
    return that.getAdminDB().then(
        function (adb) {
            adminDB = adb;
            return adminDB.update({$collection: Constants.Admin.LOCKS, $insert: {lock: lock, db: that.db.databaseName}});
        }).then(
        function (lockInfo) {
            lockId = lockInfo[Constants.Admin.LOCKS].$insert[0]._id;
            return Q.delay(10000).then(function () {
                return task();
            });
        }).fail(
        function (err) {
            synchErr = err;
        }).then(
        function () {
            if (lockId) {
                return adminDB.update({$collection: Constants.Admin.LOCKS, $delete: {_id: lockId}})
            }
        }).then(
        function () {
            if (synchErr) {
                if (lockId || synchErr.code !== 11000) {
                    throw synchErr;
                } else {
                    throw new ApplaneDBError(Constants.ErrorCode.ALREADY_IN_PROGRESS.MESSAGE, Constants.ErrorCode.ALREADY_IN_PROGRESS.CODE);
                }
            }
        })
}

DB.prototype.getDBCode = function () {
    var that = this;
    return SELF.getAdminDB().then(
        function (adminDb) {
            var fields = {};
            fields[Constants.Admin.Dbs.CODE] = 1;
            return adminDb.query({$collection: Constants.Admin.DBS, $fields: fields, $filter: {db: that.db.databaseName}, $limit: 1});
        }).then(function (data) {
            if (data.result.length > 0) {
                return data.result[0][Constants.Admin.Dbs.CODE];
            }
        })
}

DB.prototype.createUserConnection = function (userId, options) {
    var that = this;
    if (!userId) {
        throw new BusinessLogicError("userId is mandatory in createUserConnection.");
    }
    // user token is passed in opitons for the autoload app while reset password to make the user access token same as the otp.
    var token = options && options.usertoken ? options.usertoken : Utility.getUnique();
    var userConnection = {user: userId, db: that.db.databaseName, token: token};
    if (options && options.function) {
        userConnection.function = options.function;
    }
    return that.getAdminDB().then(
        function (adminDb) {
            return adminDb.update({$collection: "pl.userConnections", $insert: userConnection});
        }).then(
        function () {
            return token;
        })
}

function sendErrorMail(error) {
    if (Config.MailCredentials && Config.MailCredentials.SEND_ERROR_MAIL) {
        var options = {to: "rohit.bansal@daffodilsw.com", from: "developer@daffodilsw.com", subject: "Error in async process for " + DBNAME + " on " + new Date()};
        var html = '';
        html += "<b>DATE :  </b>" + new Date() + "<br>";
        html += "<b>Error:  </b>" + error + "<br>";
        options.html = html;
        return require("ApplaneDB/lib/MailService.js").sendFromAdmin(options);
    } else {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
}

DB.prototype.getCache = function (key) {
    var lrucache = getCacheObject.call(this);
    return lrucache.get(key);
};

DB.prototype.setCache = function (key, value) {
    var lrucache = getCacheObject.call(this);
    return lrucache.set(key, value);
};

DB.prototype.getUniqueObjectId = function () {
    return Utility.getUniqueObjectId();
};

DB.prototype.clearCache = function (key) {
    var lrucache = getCacheObject.call(this);
    if (key) {
        return lrucache.del(key);
    } else {
        return lrucache.reset();
    }
}

function getCacheObject() {
    if (this.lrucache) {
        return this.lrucache;
    } else {
        var options = { max: 200, maxAge: 1000 * 60 * 60 };
        var LRU = require("lru-cache");
        this.lrucache = LRU(options);
        return this.lrucache;
    }
}

exports.getLogDB = function () {
    var d = Q.defer();
    if (CONFIG_DBS.logdb) {
        d.resolve(CONFIG_DBS.logdb)
    } else {
        var url = Config.URL + "/" + Config.LOG_DB + "/";
        connectToMongo(url).then(
            function (mongoDB) {
                CONFIG_DBS.logdb = getDBInstance(mongoDB, undefined, undefined, {})
                d.resolve(CONFIG_DBS.logdb);
            }).fail(function (err) {
                d.reject(err)
            })
    }
    return d.promise;
}

DB.prototype.dropLogDatabase = function () {
    var D = Q.defer();
    var that = this;
    that.db.dropDatabase(function (err, result) {
        if (err) {
            D.reject(err);
        } else {
            that.clean();
            delete CONFIG_DBS.logdb;
            D.resolve(result);
        }
    });
    return D.promise;
}


DB.prototype.fireWorkflowEvent = function (event, data, collection, db, options) {
    return getWorkflowEvent(event, collection, db).then(function (workflowevent) {
        if (workflowevent) {
            var action = workflowevent[Constants.Admin.WorkFlowEvents.ACTION];
            var condition = workflowevent[Constants.Admin.WorkFlowEvents.CONDITION];
            var parameters = {};
            parameters.data = data;
            parameters.event = workflowevent[Constants.Admin.WorkFlowEvents.EVENT];
            parameters.collection = collection;
            var eventParameters = workflowevent[Constants.Admin.WorkFlowEvents.PARAMETERS];
            if (eventParameters !== undefined) {
                if (typeof eventParameters === "string") {
                    eventParameters = JSON.parse(eventParameters);
                }
                for (var key in eventParameters) {
                    parameters[key] = eventParameters[key];
                }
            }
            if (condition !== undefined) {
                condition = JSON.parse(condition);
                if (Utility.evaluateFilter(condition, data)) {
                    return db.invokeFunction(action, [parameters], options);
                }
            } else {
                return db.invokeFunction(action, [parameters], options);
            }
        }
    });
}

function getWorkflowEvent(event, collectionName, db) {
    if (typeof event === "object") {
        var d = Q.defer();
        d.resolve(event);
        return d.promise;
    } else {
        var eventObj = undefined;
        return db.collection(collectionName).then(
            function (collection) {
                var workflowevents = collection.getValue(Constants.Admin.Collections.WORK_FLOW_EVENTS);
                return Utility.iterateArrayWithPromise(workflowevents,
                    function (index, workflowevent) {
                        if (workflowevent[Constants.Admin.WorkFlowEvents.EVENT] === event) {
                            eventObj = workflowevent;
                        }
                    })
            }).then(function () {
                return eventObj;
            })
    }
}

DB.prototype.getConfig = function (key) {
    return Config[key];
}

DB.prototype.setConfig = function (key, value) {
    Config[key] = value;
}


function checkInCache(esOptions, db) {
    var d = Q.defer();
    if (esOptions.similarqueries) {
        var aliasKey = esOptions.similarqueries.currentKey;
        var alias = esOptions.similarqueries.currentAlias;
        var cacheKey = db.db.databaseName + "-" + alias + "-" + aliasKey;

        var result = db.getCache(cacheKey);

        if (result) {
            db.clearCache(cacheKey);
            d.resolve(result);
        } else {
            d.resolve();
        }
    } else {
        d.resolve();
    }
    return d.promise;
}

function executeESAggregateQuery(collectionName, db, pipelines, esOptions) {
    var startTime = undefined;
    return checkInCache(esOptions, db).then(function (cachedResult) {
        if (cachedResult) {
            return cachedResult;
        } else {
            var databaseName = db.db.databaseName;
            if (pipelines[0].$group === undefined && pipelines[0].$match === undefined) {
                throw new BusinessLogicError("pipeline cannot start with other than $group or $match");
            }
            var body = {};
            var pipelineKeysMap = {};
            var unwindExp = undefined;
            var matchPipeline = undefined;
            return Utility.iterateArrayWithPromise(pipelines,
                function (index1, pipeline) {
                    if (pipeline.$unwind !== undefined) {
                        if (pipelineKeysMap.$unwind === undefined) {
                            unwindExp = pipeline.$unwind.substring(1);
                        } else {
                            throw new BusinessLogicError("$unwind cannot come again in pipeline>>>" + JSON.stringify(pipelines) + ">> on collection.... " + collectionName);
                        }
                    } else if (pipeline.$project !== undefined) {
                        throw new BusinessLogicError("$project cannot be defined in pipeline>>>" + JSON.stringify(pipelines) + ">> on collection.... " + collectionName);
                    } else if (pipeline.$match !== undefined) {
                        if (pipelineKeysMap.$match === undefined) {
                            pipelineKeysMap.$match = 1;
                            matchPipeline = pipeline.$match;
                            return getESMapping(db, collectionName).then(function (mapping) {
//                            console.log("pipeline.$match>>>" + JSON.stringify(pipeline.$match));
                                var filter = convertFilter(pipeline.$match, mapping);
//                            console.log("filter after conversion>>>" + JSON.stringify(filter));
                                if (Object.keys(filter).length > 0) {
                                    body.query = {"filtered": {"filter": filter}};
                                }
                            });
                        } else {
                            if (!unwindExp) {
                                throw new BusinessLogicError("$match cannot come again in pipeline>>>" + JSON.stringify(pipelines) + ">> on collection.... " + collectionName);
                            }
                        }
                    } else if (pipeline.$group !== undefined) {
                        if (pipelineKeysMap.$group === undefined) {
                            pipelineKeysMap.$group = 1;
                            var aggs = handleGroupInESAggregates(pipeline.$group, matchPipeline, unwindExp);
                            if (Object.keys(aggs).length > 0) {
                                body.aggs = aggs;
                            }
                        }
                    }
                    //todo handling of sort and limit needs to done
                }).then(
                function () {
                    var client = db.esClient();
                    console.log("elastic aggregate body>>>>>>>" + JSON.stringify(body));
                    return client.search({"index": databaseName, "type": collectionName, searchType: "count", body: body});
                }).then(
                function (searchData) {
                    console.log("searchData............." + JSON.stringify(searchData));
                    var totalHits = searchData.hits.total;
                    var finalResult = modifyESAggregateResult(db, pipelines, searchData.aggregations || {}, totalHits, esOptions);
                    console.log("finalResult..........." + JSON.stringify(finalResult));
                    return finalResult;
                })
        }
    });
}
function modifyESAggregateResult(db, pipelines, aggregationData, totalHits, esOptions) {
//    console.log("esOptions>>>" + JSON.stringify(esOptions));
    var dateRange = false;

    var groupPipeline = undefined;
    var unwindExp = undefined;
    for (var i = 0; i < pipelines.length; i++) {
        var pipeline = pipelines[i];
        if (pipeline.$group !== undefined && groupPipeline === undefined) {
            groupPipeline = pipeline.$group;
        }
        if (pipeline.$unwind !== undefined) {
            unwindExp = pipeline.$unwind.substring(1);
        }
    }
    if (esOptions.similarqueries) {
        if (unwindExp) {
            aggregationData = aggregationData[unwindExp];
        }
        var buckets = aggregationData.dateRangeAggs.buckets;
        var currentKey = esOptions.similarqueries.currentKey;
        var currentBucketIndex = Utility.isExists(buckets, {key: currentKey}, "key");
        var currentResult = undefined;
        if (currentBucketIndex !== undefined) {
            var currentResult = populateESAggregateResult(groupPipeline, buckets[currentBucketIndex], totalHits, unwindExp);
            buckets.splice(currentBucketIndex, 1);
        }
        cacheSimilarQueryResults(db, esOptions, buckets, groupPipeline, unwindExp);
        return currentResult;
    } else {
        return populateESAggregateResult(groupPipeline, aggregationData, totalHits, unwindExp);
    }
}


function cacheSimilarQueryResults(db, esOptions, buckets, groupPipeline, unwindExp) {
    var similarqueries = esOptions.similarqueries.queries;
    var currentAlias = esOptions.similarqueries.currentAlias;
    for (var i = 0; i < similarqueries.length; i++) {
        var queryAlias = similarqueries[i].alias;
        var queryKey = similarqueries[i].key;
        if (queryAlias !== currentAlias) {
            var bucketIndex = Utility.isExists(buckets, {key: queryKey}, "key");
            if (bucketIndex !== undefined) {
                var bucket = buckets[bucketIndex];
                var result = populateESAggregateResult(groupPipeline, bucket, bucket.doc_count, unwindExp);
                db.setCache(db.db.databaseName + "-" + queryAlias + "-" + queryKey, result);
            }
        }
    }
}


function populateESAggregateResult(groupPipeline, aggregationData, totalHits, unwindExp) {
    var buckets;
    var groupId = groupPipeline._id;
    var useTotalCount = false;
    /*if (unwindExp) {
     aggregationData = aggregationData[unwindExp];
     }*/
    if (groupId !== null) {
        if (Utility.isJSONObject(groupId)) {
            var keys = Object.keys(groupId);
            buckets = aggregationData[keys[0]].buckets;
            populateChildrenInBuckets(buckets, keys, 1);
        } else {
            buckets = aggregationData.aggregateData ? aggregationData.aggregateData.buckets : [];
        }
    } else {
        useTotalCount = true;
        buckets = [aggregationData];
    }
    var finalResult = [];
    for (var i = 0; i < buckets.length; i++) {
        var bucket = buckets[i];
        finalResult.push(handleEachbucket(bucket, groupPipeline, totalHits, unwindExp, useTotalCount));
    }
    return finalResult;
}

function handleEachbucket(bucket, groupPipeline, totalHits, unwindExp, useTotalCount) {
    var result = {};
    var groupKeys = Object.keys(groupPipeline);
    for (var j = 0; j < groupKeys.length; j++) {
        var groupKey = groupKeys[j];
        var value = groupPipeline[groupKey];
        if (groupKey === "_id") {
            if (value === null) {
                result._id = null;
            } else {
                result._id = bucket.key;
            }
            continue;
        }
        if (value.$sum !== undefined) {
            if (value.$sum === 1) {
                result[groupKey] = useTotalCount ? totalHits : bucket["doc_count"];
            }
            else if (bucket[groupKey]) {
                result[groupKey] = bucket[groupKey].value;
            }
        }
        else if (value.$first && !unwindExp) {
            var firstExpression = value.$first;
            firstExpression = firstExpression.substring(1);
            var _source = bucket["tophitsdata"]["hits"]["hits"] && bucket["tophitsdata"]["hits"]["hits"][0] ? bucket["tophitsdata"]["hits"]["hits"][0]["_source"] : {};
            result[groupKey] = Utility.resolveDottedValue(_source, firstExpression);
        }
    }
    if (bucket.children) {
        var newChildrens = [];
        for (var i = 0; i < bucket.children.length; i++) {
            var children = bucket.children[i];
            newChildrens.push(handleEachbucket(children, groupPipeline, totalHits, unwindExp));
        }
        result.children = newChildrens
    }
    return result;
}


function populateESSort(sort) {
    var sortResult = [];
    var sortKeys = Object.keys(sort);
    for (var i = 0; i < sortKeys.length; i++) {
        var sortKey = sortKeys[i];
        var esSort = {};
        if (sort[sortKey] === 1) {
            esSort[sortKey] = {"order": "asc"}
        } else {
            esSort[sortKey] = {"order": "desc"}
        }
        sortResult.push(esSort);
    }
    return sortResult;
}


function executeESQuery(collectionName, db, filter1, options) {
    var databaseName = db.db.databaseName;
    return getESMapping(db, collectionName).then(
        function (mapping) {
            var filter = convertFilter(filter1, mapping);
            var esFilter = undefined;
            var isRegexFilter = checkRegex(filter1);
            console.log(":isRegexFilter:..." + isRegexFilter);
            if (isRegexFilter) {
                esFilter = filter;
            } else {
                esFilter = {"filtered": {"filter": filter}};
            }

//        console.log("find esFilter>>>" + JSON.stringify(esFilter));
            var limit = options.limit;
            var client = db.esClient();
            var body = {};
            body.query = esFilter;
            if (options.limit !== undefined) {
                body.size = options.limit;
            }
            if (options.skip !== undefined) {
                body.from = options.skip;
            }
            /*if (options.sort !== undefined) {
             var sort = options.sort;
             var sortResult = populateESSort(sort);
             if (sortResult.length > 0) {
             body.sort = sortResult;
             }
             }*/
            if (options.fields !== undefined) {
                var source = {};
                var keys = Object.keys(options.fields);
                var fieldValue = options.fields[keys[0]];
                var fieldsArray = [];
                if (fieldValue == 1) {
                    source.include = keys;
                } else {
                    source.exclude = keys;
                }
                body._source = source;
            }
            console.log("body of es search ...." + JSON.stringify(body));
            return client.search({"index": databaseName, "type": collectionName, body: body});
        }).then(
        function (searchData) {
            var hits = searchData.hits.hits;
            var totalHits = searchData.total;
            var result = [];
            for (var i = 0; i < hits.length; i++) {
                var hit = hits[i];
                var record = hit._source;
                record._id = hit._id;
                result.push(hit._source);
            }
//            console.log("result of elastic search find query>>>" + JSON.stringify(result));
            return result;
        });
}

function handleGroupInESAggregates(groupPipeline, matchPipeline, unwindExp) {
    var aggs = {};
    var groupId = groupPipeline._id;
    var isNestedGroup = false;
    if (groupId !== null) {
        if (Utility.isJSONObject(groupId)) {
            isNestedGroup = true;
            populateNestedGroup(groupPipeline, aggs);
            aggs = aggs.aggs;
        } else {
            aggs.aggregateData = {};
            aggs.aggregateData.terms = {"field": groupId.substring(1), size: 0};
        }
    }
    if (!isNestedGroup) {
        populateMetricsInGroup(aggs, groupPipeline, unwindExp);

        if (matchPipeline) {
            var matchKeys = Object.keys(matchPipeline);
            for (var i = 0; i < matchKeys.length; i++) {
                var matchKey = matchKeys[i];
                var values = matchPipeline[matchKey];
                if (values && Array.isArray(values) && Utility.isJSONObject(values[0])) {
                    var ranges = [];
                    for (var j = 0; j < values.length; j++) {
                        if (values[j].$gte && values[j].$lt) {
                            ranges.push({from: values[j].$gte, to: values[j].$lt});
                        } else if (values[j].$lte) {
                            ranges.push({to: values[j].$lte});
                        }
                    }
                    var dateRange = {date_range: {field: matchKey, ranges: ranges}};
                    dateRange.aggs = aggs;
                    aggs = {"dateRangeAggs": dateRange};
                }
            }
        }
        if (unwindExp) {
            var nestedAggs = {};
            nestedAggs[unwindExp] = {"nested": {"path": unwindExp}};
            nestedAggs[unwindExp].aggs = aggs;
            aggs = nestedAggs;
        }
    }
    return aggs;
}

DB.prototype.esClient = function () {
    if (this.esClientDB) {
        return this.esClientDB;
    }
//    var url = "127.0.0.1:9200";
    var url = Config[Constants.EnvironmentVariables.ES_URL];
    var elasticsearch = require('elasticsearch');
    this.esClientDB = new elasticsearch.Client({
        host: url
    });
    return this.esClientDB;
}

function getESMapping(db, type) {
    var index = db.db.databaseName;
    var client = db.esClient();
    var d = Q.defer();
    client.indices.getMapping({
        index: index,
        type: type
    }, function (err, res) {
        if (err) {
            d.reject(err);
        } else {
            if (res[index] && res[index]["mappings"] && res[index]["mappings"][type]) {
                var mappings = res[index]["mappings"][type]["properties"];
                d.resolve(mappings);
            } else {
                d.resolve();
            }
        }
    });
    return d.promise;
}

function convertFilter(filter, mapping) {
    var esfilter = {};
    if (filter && Object.keys(filter).length > 0) {
        var keys = Object.keys(filter);
        if (keys.length === 1) {
            esfilter = handleSingleKey(keys[0], filter, mapping);
        } else {
            var mustFilter = [];
            for (var i = 0; i < keys.length; i++) {
                var key = keys[i];
                var singleFilter = handleSingleKey(keys[i], filter, mapping);
                if (Object.keys(singleFilter).length > 0) {
                    mustFilter.push(singleFilter);
                }
            }
            esfilter.bool = {must: mustFilter}
        }
    }
    return esfilter;
}


exports.ensureESIndex = function (index) {
    var url = Config[Constants.EnvironmentVariables.ES_URL];
    var elasticsearch = require('elasticsearch');
    var esClientDB = new elasticsearch.Client({
        host: url
    });
    return esClientDB.indices.exists({index: index}).then(
        function (exists) {
            if (!exists) {
                return esClientDB.indices.create({index: index});
            }
        }).then(function () {
            return esClientDB.indices.putSettings({index: index, "refresh_interval": "1"});
        });
}


function handleSingleKey(key, filter, mapping) {
    var isNested = false;
    var nestedKey = key.substring(0, key.indexOf("."));
    if (mapping && mapping[nestedKey] && mapping[nestedKey].type === "nested") {
        isNested = true;
    }
    var nestedFilter = {};
    nestedFilter.path = key.substring(0, key.indexOf("."));
    var esfilter = {};
    if (key === "$or" || key === "$and") {
        esfilter = handleAndOrFilter(key, filter, mapping);
    } else if (Array.isArray(filter[key])) {
        //console.log("date range filter>>>>>" + JSON.stringify(filter[key]));
        // do nothing date range filter for date range aggregation in finance dashboard and month span wise report
    } else if (Utility.isJSONObject(filter[key])) {
        var value = filter[key];
        if (value.$lt !== undefined || value.$gt !== undefined || value.$lte !== undefined || value.$gte !== undefined) {
            var rangeFilter = {};
            rangeFilter[key] = {};
            if (value.$lt !== undefined) {
                rangeFilter[key].lt = value.$lt;
            }
            if (value.$lte !== undefined) {
                rangeFilter[key].lte = value.$lte;
            }
            if (value.$gt !== undefined) {
                rangeFilter[key].gt = value.$gt;
            }
            if (value.$gte !== undefined) {
                rangeFilter[key].gte = value.$gte;
            }
            if (isNested) {
                nestedFilter.filter = {range: rangeFilter};
                esfilter.nested = nestedFilter;
            } else {
                esfilter.range = rangeFilter;
            }
        } else if (value.$ne !== undefined) {
            var notFilter = {term: {}};
            notFilter.term[key] = value.$ne;
            if (isNested) {
                nestedFilter.filter = {not: notFilter};
                esfilter.nested = nestedFilter;
            } else {
                esfilter.not = notFilter;
            }
        } else if (value.$exists !== undefined) {
            if (value.$exists) {
                var existsFilter = {};
                existsFilter.field = key;
                if (isNested) {
                    nestedFilter.filter = {exists: existsFilter};
                    esfilter.nested = nestedFilter;
                } else {
                    esfilter.exists = existsFilter;
                }
            } else {
                var missingFilter = {};
                missingFilter.field = key;
                if (isNested) {
                    nestedFilter.filter = {missing: missingFilter};
                    esfilter.nested = nestedFilter;
                } else {
                    esfilter.missing = missingFilter;
                }
            }
        } else if (value.$in !== undefined) {
            var nullIndex = isNullExists(value.$in);
            if (nullIndex !== undefined) {
                value.$in.splice(nullIndex, 1);
                var shouldFilter = [];
                if (value.$in.length > 0) {
                    var termsFilter = {};
                    termsFilter[key] = value.$in;
                    shouldFilter.push({"terms": termsFilter});
                }
                shouldFilter.push({"missing": {"field": key}});
                if (isNested) {
                    nestedFilter.filter = {bool: {should: shouldFilter}};
                    esfilter.nested = nestedFilter;
                } else {
                    esfilter.bool = {"should": shouldFilter};
                }
            } else {
                var termsFilter = {};
                termsFilter[key] = value.$in;
                if (isNested) {
                    nestedFilter.filter = {terms: termsFilter};
                    esfilter.nested = nestedFilter;
                } else {
                    esfilter.terms = termsFilter;
                }
            }
        } else if (value.$nin !== undefined) {
            var notFilter = {terms: {}};
            notFilter.terms[key] = value.$nin;
            if (isNested) {
                nestedFilter.filter = {not: notFilter};
                esfilter.nested = nestedFilter;
            } else {
                esfilter.not = notFilter;
            }

        } else if (value.$all !== undefined) {
            var allValues = value.$all;
            var length = allValues ? allValues.length : 0;
            var mustFilter = [];
            for (var i = 0; i < length; i++) {
                var termFilter = {};
                termFilter[key] = value.$all[i];
                mustFilter.push({term: termFilter});
            }
            if (isNested) {
                nestedFilter.filter = {bool: {must: mustFilter}};
            } else {
                esfilter.bool = {must: mustFilter};
            }
        } else if (value.$regex !== undefined) {
            var regexp = {};
            if (value.$regex.indexOf("^") === 0) {
                value.$regex = value.$regex.substring(1);
            }
            regexp[key] = value.$regex;
            esfilter.match_phrase_prefix = regexp;
        } else {
            throw new BusinessLogicError("filter not supported>>>>" + JSON.stringify(filter) + ">>value>>" + JSON.stringify(value));
        }
    } else {
        if (filter[key] !== undefined) {
            var term = {};
            term[key] = filter[key];
            if (isNested) {
                if (filter[key] === null) {
                    nestedFilter.filter = {missing: {field: key}};
                } else {
                    nestedFilter.filter = {term: term};
                }
                esfilter.nested = nestedFilter;
            } else {
                if (mapping && mapping[key] && mapping[key].type === "string" && (!mapping[key].index || mapping[key].index === "analyzed")) {
                    var match = {};
                    match[key] = filter[key];
                    esfilter.query = {"match": match};
                } else {
                    if (filter[key] === null) {
                        esfilter.missing = {"field": key};
                    } else {
                        esfilter.term = term;
                    }
                }
            }
        }
    }
    return esfilter;
}


function isNullExists(values) {
    for (var i = 0; i < values.length; i++) {
        if (values[i] === null || values[i] === undefined) {
            return i;
        }
    }
}


function handleAndOrFilter(key, filter, mapping) {
    if (key === "$or") {
        var values = filter.$or;
        var shouldFilter = [];
        for (var i = 0; i < values.length; i++) {
            var value = values[i];
            var convertedFilter = convertFilter(value, mapping);
            shouldFilter.push(convertedFilter);
        }
        return {"bool": {"should": shouldFilter}};
    } else if (key === "$and") {
        var values = filter.$and;
        var mustFilter = [];
        for (var i = 0; i < values.length; i++) {
            var value = values[i];
            var convertedFilter = convertFilter(value, mapping);
            mustFilter.push(convertedFilter);
        }
        return {"bool": {"must": mustFilter}};
    }
}


DB.prototype.getCacheUserObject = function (db) {
    var cacheUserInfo = {
        "db": db.db.databaseName,
        "user": db.user,
        "options": db.options,
        "globalDatabaseName": db.globalDatabaseName,
        "userRoles": db.userRoles
    };
    return cacheUserInfo;
}

function populateNestedGroup(groupObj, result) {
    var group = {};
    var keys = Object.keys(groupObj._id);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (i === 0) {
            result.aggs = group;
            result.aggs[key] = {};
            result.aggs[key].terms = {"field": groupObj._id[key].toString().substring(1), size: 0};
            populateMetricsInNestedGroup(result.aggs[key], groupObj);
            group = result.aggs[key];
        } else {
            group.aggs = group.aggs || {};
            group.aggs[key] = {};
            group.aggs[key].terms = {"field": groupObj._id[key].toString().substring(1), size: 0};
            populateMetricsInNestedGroup(group.aggs[key], groupObj);
            group = group.aggs[key];
        }
    }
    return group;
}

function populateMetricsInNestedGroup(result, groupObj) {
    var keys = Object.keys(groupObj);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (key == "_id") {
            continue
        }
        if (groupObj[key].$sum !== undefined) {
            var sumExpression = groupObj[key].$sum;
            if (sumExpression !== 1) {
                sumExpression = sumExpression.toString().substring(1);
                result.aggs = result.aggs || {};
                result.aggs[key] = {"sum": {"field": sumExpression}};
            }
        }
        if (groupObj[key].$first !== undefined) {
            var firstExpression = groupObj[key].$first;
            firstExpression = firstExpression.substring(1);

            result.aggs = result.aggs || {};
            result.aggs["tophitsdata"] = result.aggs["tophitsdata"] || {};
            result.aggs["tophitsdata"]["top_hits"] = result.aggs["tophitsdata"]["top_hits"] || {};
            result.aggs["tophitsdata"]["top_hits"]["_source"] = result.aggs["tophitsdata"]["top_hits"]["_source"] || {}
            result.aggs["tophitsdata"]["top_hits"]["size"] = 1;
            result.aggs["tophitsdata"]["top_hits"]["_source"]["include"] = result.aggs["tophitsdata"]["top_hits"]["_source"] ["include"] || [];
            result.aggs["tophitsdata"]["top_hits"]["_source"]["include"].push(firstExpression);
        }
    }
}

function populateMetricsInGroup(aggs, groupPipeline, unwindExp) {
    var groupKeys = Object.keys(groupPipeline);
    for (var i = 0; i < groupKeys.length; i++) {
        var groupKey = groupKeys[i];
        if (groupKey === "_id") {
            continue;
        }
        var value = groupPipeline[groupKey];
        if (!Utility.isJSONObject(value)) {
            throw new BusinessLogicError("value corresponding to a every key must be jsonobject" + JSON.stringify(groupPipeline));
        }
        if (value.$sum !== undefined) {
            if (value.$sum !== 1) {
                var sumExpression = value.$sum;
                sumExpression = sumExpression.substring(1);
                if (aggs.aggregateData) {
                    aggs.aggregateData.aggs = aggs.aggregateData.aggs || {};
                    aggs.aggregateData.aggs[groupKey] = {"sum": {"field": sumExpression}};
                } else {
                    aggs[groupKey] = {"sum": {"field": sumExpression}};
                }
            }
        } else if (value.$first !== undefined && !unwindExp) {
            var firstExpression = value.$first;
            firstExpression = firstExpression.substring(1);
            if (aggs.aggregateData) {
                aggs.aggregateData.aggs = aggs.aggregateData.aggs || {};
                aggs.aggregateData.aggs["tophitsdata"] = aggs.aggregateData.aggs["tophitsdata"] || {};
                aggs.aggregateData.aggs["tophitsdata"]["top_hits"] = aggs.aggregateData.aggs["tophitsdata"]["top_hits"] || {};
                aggs.aggregateData.aggs["tophitsdata"]["top_hits"]["_source"] = aggs.aggregateData.aggs["tophitsdata"]["top_hits"]["_source"] || {}
                aggs.aggregateData.aggs["tophitsdata"]["top_hits"]["size"] = 1;
                aggs.aggregateData.aggs["tophitsdata"]["top_hits"]["_source"]["include"] = aggs.aggregateData.aggs["tophitsdata"]["top_hits"]["_source"]["include"] || [];
                aggs.aggregateData.aggs["tophitsdata"]["top_hits"]["_source"]["include"].push(firstExpression);
            } else {
                aggs["tophitsdata"] = aggs["tophitsdata"] || {};
                aggs["tophitsdata"]["top_hits"] = aggs["tophitsdata"]["top_hits"] || {};
                aggs["tophitsdata"]["top_hits"]["_source"] = aggs["tophitsdata"]["top_hits"]["_source"] || {};
                aggs["tophitsdata"]["top_hits"]["size"] = 1;
                aggs["tophitsdata"]["top_hits"]["_source"]["include"] = aggs["tophitsdata"]["top_hits"]["_source"]["include"] || [];
                aggs["tophitsdata"]["top_hits"]["_source"]["include"].push(firstExpression);
            }
        }
    }
}


function populateChildrenInBuckets(buckets, keys, index) {
    var length = buckets ? buckets.length : 0;
    for (var i = 0; i < length; i++) {
        var bucket = buckets[i];
        var key = keys[index];
        if (key && bucket[key] && bucket[key].buckets) {
            bucket.children = bucket[key].buckets;
            populateChildrenInBuckets(bucket.children, keys, index + 1);
        }
    }
}
function checkRegex(filter1) {
    var exists = false;
    for (var key in filter1) {
        if (filter1[key] && filter1[key].$regex !== undefined) {
            exists = true;
            break;
        }
    }
    return exists;
}


function mergePropertiesInService(params, query, queryProperties) {
    for (var key in params) {
        var value = params[key];
        if (queryProperties.indexOf(key) >= 0) {
            if (key === "filter" || key === "$filter") {
                query.$filter = query.$filter || {};
                query.$filter.$and = query.$filter.$and || [];
                query.$filter.$and.push(value);
            } else {
                query[key.indexOf("$") === 0 ? key : "$" + key] = value;
            }
        }
    }
}

DB.prototype.executeService = function (params, options) {  //this function is called from /rest/service/*  of Http.js--did for six continent, they want to call a query or function through rest service
    var that = this;
    var serviceId = params["0"];
    return that.query({$collection: Constants.Admin.SERVICES, $filter: {id: serviceId}}).then(function (queryData) {
        queryData = queryData.result.length > 0 ? queryData.result[0] : undefined;
        var type = queryData ? queryData[Constants.Admin.Services.TYPE] : Constants.Admin.Services.QUERY;
        if (type === Constants.Admin.Services.QUERY) {
            var query = queryData ? (JSON.parse(queryData[Constants.Admin.Services.QUERY])) : {$collection: serviceId}; //if service id is not saved in pl.services, then we will consider that as query with that serviceid as collection
            mergePropertiesInService(params, query, Constants.Admin.Services.Query.PROPERTIES); //we always merge the filter with $and and override all other properties
            return that.query(query);
        } else if (type === Constants.Admin.Services.FUNCTION) {
            return that.invokeFunction(queryData[Constants.Admin.Services.FUNCTION], [params], options);
        } else if (type === Constants.Admin.Services.UPDATE) {
            var updateQuery = JSON.parse(queryData[Constants.Admin.Services.UPDATE]);
            var updateProperties = Constants.Admin.Services.Update.PROPERTIES;
            mergePropertiesInService(params, updateQuery, updateProperties);     //priority of properties of params will be higher than saved updateQuery in pl.services
            return that.update(updateQuery);
        } else if (type === Constants.Admin.Services.BATCH_QUERY) {
            var batchQuery = JSON.parse(queryData[Constants.Admin.Services.BATCH_QUERY]);
            for (var queryKey in batchQuery) {
                var query = batchQuery[queryKey];
                if (params[queryKey]) {     //if properties are provided in params corresponding to the property containing the query of batchquery, then we will override all properties in that query
                    mergePropertiesInService(params[queryKey], query, Constants.Admin.Services.Query.PROPERTIES);
                }
                mergePropertiesInService(params, query, ["filter", "$filter", "parameters", "$parameters"]); //if filter is provided in params then we will merge the filter and if parameter is provided then we will override the parameter in all queries of batchquery
            }
            return that.batchQuery(batchQuery);
        } else {
            throw new BusinessLogicError("Type [" + type + "] is not supported for service [" + serviceId + "]");
        }
    })
}