var Utils = require("ApplaneCore/apputil/util.js");
var Document = require("../public/js/Document.js");
var Constants = require("./Constants.js");
var ModuleManager = require("./ModuleManager.js");
var QueryHandler = require("./QueryHandler.js");
var Q = require("q");

var Collection = function (collection, db, options) {
    this.mongoCollection = collection;
    this.db = db;
    this.options = options;
}

module.exports = Collection;

Collection.prototype.find = function (query, options) {
    var that = this;
    var sTime = new Date();
    var d = Q.defer();
    var log = undefined;
    if (that.db.logger) {
        log = that.db.logger.populateInitialLog("mongoFind", {query: query}, that.db, false);
    }
    that.mongoCollection.find(query, options).toArray(function (err, result) {
        that.db.logMongoTime("mongoFind", (new Date() - sTime));
        if (that.db.logger) {
            that.db.logger.populateFinalLog(that.db, log, false);
        }
        if (err) {
            d.reject(err);
            return;
        }
        d.resolve(result);
    })
    return d.promise;
}

Collection.prototype.count = function (query, options) {
    var that = this;
    var stime = new Date();
    var d = Q.defer();
    query = query || {};
    options = options || {w: 1};
    var log = undefined;
    if (that.db.logger) {
        var collectionName = (that.options && that.options.collection) ? that.options.collection : that.mongoCollection.collectionName;
        log = that.db.logger.populateInitialLog("Count In Collection", {query: query, collection: collectionName}, that.db, false);
    }
    that.mongoCollection.count(query, options, function (err, count) {
        that.db.logMongoTime("mongoCountTime", (new Date() - stime));
        if (that.db.logger) {
            that.db.logger.populateFinalLog(that.db, log, false);
        }
        if (err) {
            d.reject(err);
            return;
        }
        d.resolve(count);
    })
    return d.promise;
}

Collection.prototype.aggregate = function (pipeline) {
    var that = this;
    var stime = new Date();
    var d = Q.defer();
    var log = undefined;
    if (that.db.logger) {
        log = that.db.logger.populateInitialLog("mongoAggregate", {pipeline: pipeline}, that.db, false);
    }
    that.mongoCollection.aggregate(pipeline, function (err, result) {
        that.db.logMongoTime("mongoAggregate", (new Date() - stime));
        if (that.db.logger) {
            that.db.logger.populateFinalLog(that.db, log, false);
        }
        if (err) {
            d.reject(err);
            return;
        }
        d.resolve(result);
    })
    return d.promise;
}

Collection.prototype.upsert = function (query, update, fields, options) {
    var that = this;
    options = options || {};
    var queryTogetData = {};
    queryTogetData[Constants.Query.COLLECTION] = that.options && that.options[Constants.Admin.Collections.COLLECTION] ? that.options : that.mongoCollection.collectionName;
    queryTogetData[Constants.Query.FIELDS] = fields;
    getUpdateOptions(options, queryTogetData);
    if (query === undefined || Object.keys(query).length == 0) {
        if (update && update.$set === undefined) {
            var collectionName = Utils.isJSONObject(queryTogetData[Constants.Query.COLLECTION]) ? queryTogetData[Constants.Query.COLLECTION].collection : queryTogetData[Constants.Query.COLLECTION];
            throw new Error("$set is mandatory in upsert without query" + JSON.stringify(update) + ">>Query>>>" + JSON.stringify(query) + ">>collection>>>" + collectionName);
        }
        return insertData(that, query, update, queryTogetData, options);
    } else {
        queryTogetData[Constants.Query.FILTER] = query;
        queryTogetData[Constants.Query.LIMIT] = 1;
        queryTogetData.$requireResolveFilter = true;
        return that.db.query(queryTogetData).then(
            function (data) {
                return upsertData(that, query, update, data, queryTogetData, options);
            })
    }
}

function upsertData(that, filter, update, data, query, options) {
    if (data.result.length > 0) {
        if (data.dataInfo && data.dataInfo.hasNext) {
            var collectionName = Utils.isJSONObject(query[Constants.Query.COLLECTION]) ? query[Constants.Query.COLLECTION].collection : query[Constants.Query.COLLECTION];
            throw new Error("Mulitple Records found corresponding to [" + JSON.stringify(filter) + "] in collection [" + collectionName + "]>>data>>>" + JSON.stringify(data));
        } else {
            var result = data.result[0];
            if (update.$set || update.$pull || update.$push || update.$unset) {
                return that.update(result._id, update, options).then(
                    function () {
                        query[Constants.Query.FILTER] = {_id: result._id};
                        return that.db.query(query);
                    }).then(
                    function (finalResult) {
                        return finalResult.result[0];
                    })
            } else {
                return result;
            }
        }
    } else {
        options.upsert = true;
        options.returnOriginal = false;
        options.query = data.resolvedFilter;
        options.upsertfields = {_id: true};
        return insertData(that, filter, update, query, options);
    }
}

function insertData(that, filter, update, query, options) {
    var newInsert = update.$set || {};
    for (var key in filter) {
        if (!newInsert[key]) {
            newInsert[key] = filter[key];
        }
    }
    return that.insert(newInsert, options).then(
        function (result) {
            query[Constants.Query.FILTER] = {_id: result._id};
            return that.db.query(query);
        }).then(
        function (finalResult) {
            return finalResult.result[0];
        })
}

function getUpdateOptions(options, newOptions) {
    newOptions = newOptions || {};
    if (options) {
        if (options.$modules !== undefined) {
            newOptions.$modules = options.$modules;
        }
        if (options.$events !== undefined) {
            newOptions.$events = options.$events;
        }
        if (options.$limit !== undefined) {
            newOptions.$limit = options.$limit;
        }
        if (options.$skip !== undefined) {
            newOptions.$skip = options.$skip;
        }
        if (options.$applock !== undefined) {
            newOptions.$applock = options.$applock;
        }
        if (options.$parameters !== undefined) {
            newOptions.$parameters = options.$parameters;
        }
        if (options.domain) {
            newOptions.domain = options.domain;
        }
        if (options.$workflowevents !== undefined) {
            newOptions.$workflowevents = options.$workflowevents;
        }
        if (options.$context !== undefined) {
            newOptions.$context = options.$context;
        }
    }
    return newOptions;
}

Collection.prototype.insert = function (inserts, options) {
    var that = this;
    var collectionName = (that.options && that.options.collection) ? that.options.collection : that.mongoCollection.collectionName;
    var log = undefined;
    if (that.db.logger) {
        log = that.db.logger.populateInitialLog("Collection - Insert", {"collectionName": collectionName}, that.db, true);
    }
    options = options || {w: 1};
    Utils.convert_IdToObjectId(inserts);
    var $transient = inserts.$transient || {};
    delete inserts.$transient;
    var fields = that.getValue("fields");
    var document = new Document(inserts, null, "insert", {transientValues: $transient, collection: collectionName});
    // in case of saving confirm using warning options, we get proceedSave =true in options, we are using this to show warning message only once by setting in document and verify there-- Rajit garg 27-mar-15
    if (options.confirmUserWarning) {
        document.confirmUserWarning = options.confirmUserWarning
    }
    var finalResult = undefined;
    var documentId = document.get("_id");
    if (!documentId) {
        documentId = Utils.getUniqueObjectId();
        document.set("_id", documentId);
    } else {
        if (options.$check_id != false) {//when we were inserting data then the transaction module was checking for _id in the child and it was throwing duplicate key error
            document.check_id = true;// if the document contains _id then we have to check in the transaction module whether this record exists or not so that if the record already exists we do not delete it when then duplicate error comes and we try  to rollback.
        }
    }
    return QueryHandler.remove$Query(document, that.db, {fields: fields, $modules: options.$modules, $events: options.$events}).then(
        function () {
            return  ModuleManager.triggerModules("onInsert", document, that, that.db, getUpdateOptions(options, {$onValueProcessed: options.$onValueProcessed, level: 0}));
        }).then(
        function () {
            document.oldRecord = null;
            return ModuleManager.triggerModules("onSave", document, that, that.db, getUpdateOptions(options, {pre: true, level: 0}));
        }).then(
        function () {
            // cancelResult can be set in document  - required for customer support view -- Rajit Garg
            if (document.cancelUpdates) {
                if (that.db.logger) {
                    that.db.logger.populateFinalLog(that.db, log, true);
                }
                finalResult = document.cancelResult;
                return finalResult;
            }
            prepareInserts(inserts);
            Utils.convert_IdToObjectId(inserts);
            check$Query(inserts, collectionName, fields);
            return finalMongoInsert(that, options, inserts).then(
                function (finalResult1) {
                    finalResult = finalResult1;
                    document.updates._id = finalResult._id;
                    document.oldRecord = null;
                    return ModuleManager.triggerModules("onSave", document, that, that.db, getUpdateOptions(options, {post: true, level: 0}));
                }).then(
                function () {
                    var workFlowEvents = that.getValue(Constants.Admin.Collections.WORK_FLOW_EVENTS);
                    if (workFlowEvents && workFlowEvents.length > 0) {
                        return ModuleManager.triggerWorkflowEvents("onInsert", finalResult, that, that.db, getUpdateOptions(options));
                    }
                }).then(
                function () {
                    if (that.db.logger) {
                        that.db.logger.populateFinalLog(that.db, log, true);
                    }
                    return finalResult;
                })
        })
}

Collection.prototype.findAndModify = function (query, sort, update, options) {
    var that = this;
    var stime = new Date();
    var d = Q.defer();
    var log = undefined;
    if (that.db.logger) {
        log = that.db.logger.populateInitialLog("mongoFindAndModify", {query: query, update: update}, that.db, false);
    }
    var mongoOptions = getMongoOptions(options);
    mongoOptions.sort = sort;
    that.mongoCollection.findOneAndUpdate(query, update, mongoOptions, function (err, data) {
        that.db.logMongoTime("mongoFindAndModify", (new Date() - stime));
        if (that.db.logger) {
            that.db.logger.populateFinalLog(that.db, log, false);
        }
        if (err) {
            d.reject(err);
            return;
        }
        d.resolve(data);
    });
    return d.promise;
};

Collection.getOldData = function (id, update, collection, options) {
    if (update && update.$oldData) {
        var oldData = update.$oldData;
        delete update.$oldData;
        var D = Q.defer();
        D.resolve(oldData);
        return D.promise;
    }
    var query = {};
    query[Constants.Query.COLLECTION] = collection.options && collection.options[Constants.Admin.Collections.COLLECTION] ? collection.options : collection.mongoCollection.collectionName;
    query[Constants.Query.FILTER] = {"_id": id};
    if (options.runOnES) {
        query.runOnES = true;
    }
    query[Constants.Query.LIMIT] = 1;
    query.$historyFields = true;
    for (var k in options) {
        if (k !== "w") {
            query[k] = options[k];
        }
    }
    return collection.db.query(query).then(
        function (data) {
            if (data.result.length == 0) {
                var collectionName = Utils.isJSONObject(query[Constants.Query.COLLECTION]) ? query[Constants.Query.COLLECTION].collection : query[Constants.Query.COLLECTION];
                throw new Error("Result not found for collection [" + collectionName + "] with filter " + JSON.stringify(query[Constants.Query.FILTER]) + " in db [" + collection.db.db.databaseName + "]");
            }
            return data.result[0];
        })
}

function getMongoOptions(options) {
    if (!options) {
        return {w: 1};
    }
    var mongoOptions = {};
    mongoOptions.w = options.w || 1;
    mongoOptions.multi = options.multi;
    mongoOptions.upsert = options.upsert;
    mongoOptions.projection = options.upsertfields;
    if (options.new) {
        mongoOptions.returnOriginal = !(options.new);
    }
    if (options.returnOriginal !== undefined) {
        mongoOptions.returnOriginal = options.returnOriginal;
    }
    if (options.projection !== undefined) {
        mongoOptions.projection = options.projection;
    }
    return mongoOptions;

}

Collection.prototype.update = function (id, update, options) {
    var that = this;
    var collectionName = (that.options && that.options.collection) ? that.options.collection : that.mongoCollection.collectionName;
    if (!id) {
        var error = new Error("_id is mandatory in case of Update");
        error.detailMessage = "_id is mandatory in case of Update in collection [ " + collectionName + " ]> with >>update>>>>" + JSON.stringify(update);
        throw error;
    }
    options = options || {w: 1};
    var log = undefined;
    if (that.db.logger) {
        log = that.db.logger.populateInitialLog("Collection - Update", {id: id, collectionName: collectionName}, that.db, true);
    }
    var finalResult = undefined;
    var document = undefined;
    var oldData = undefined;
    var $transient = update.$transient;
    delete update.$transient;
    var fields = that.getValue("fields");
    Utils.convert_IdToObjectId(update);
    return Collection.getOldData(id, update, that, options).then(
        function (oldData1) {
            oldData = oldData1;
            document = new Document(update, oldData, "update", {transientValues: $transient, collection: collectionName});
            if (options.confirmUserWarning) {
                document.confirmUserWarning = options.confirmUserWarning
            }
            return QueryHandler.remove$Query(document, that.db, {fields: fields, $modules: options.$modules, $events: options.$events});
        }).then(
        function () {
            oldData = require("./Utility.js").deepClone(document.oldRecord);
            return ModuleManager.triggerModules("onValue", document, that, that.db, getUpdateOptions(options, {fields: document.getUpdatedFields(), $onValueProcessed: options.$onValueProcessed, level: 0}));
        }).then(
        function () {
            document.oldRecord = oldData;
            return ModuleManager.triggerModules("onSave", document, that, that.db, getUpdateOptions(options, {pre: true, level: 0}));
        }).then(
        function () {
            if (document.cancelUpdates) {
                if (that.db.logger) {
                    that.db.logger.populateFinalLog(that.db, log, true);
                }
                return 0;
            }
            document.oldRecord = oldData;
            var newUpdates = {};
            newUpdates.query = {_id: id};
            var arrayUpdates = [];
            modifyUpdates(document, newUpdates, arrayUpdates, id, fields);
            var pushUpdates = newUpdates.$push;
            var pullUpdates = newUpdates.$pull;
            delete newUpdates.$push;
            delete newUpdates.$pull;
            if (newUpdates.$set || newUpdates.$unset || newUpdates.$inc) {
                arrayUpdates.push(newUpdates);
            }
            if (pushUpdates && Object.keys(pushUpdates).length > 0) {
                arrayUpdates.push({query: {_id: id}, $push: pushUpdates});
            }
            if (pullUpdates && Object.keys(pullUpdates).length > 0) {
                arrayUpdates.push({query: {_id: id}, $pull: pullUpdates});
            }
            return Utils.iterateArrayWithPromise(arrayUpdates,
                function (index, newUpdate) {
                    var query = newUpdate.query;
                    delete newUpdate.query;
                    Utils.convert_IdToObjectId(newUpdate);
                    check$Query(newUpdate, collectionName, fields);
                    if (options.runOnES) {
                        var esDb = that.db.esClient();
                        var script = createUpdateScript(newUpdate);
                        return esDb.update({
                            index: that.db.db.databaseName,
                            type: that.mongoCollection.collectionName,
                            id: query._id.toString(),
                            body: {
                                // put the partial document under the `doc` key
                                script: script.script,
                                params: script.params
                            }
                        })
                    } else {
                        return that.mongoUpdateInternal(query, newUpdate, options).then(function (result) {
                            finalResult = result;
                        }).fail(function (err) {
                            if (err.code == "11000") {
                                return populateDuplicateError(that, err);
                            } else {
                                throw err;
                            }
                        })
                    }
                }).then(
                function () {
                    document.oldRecord = oldData;
                    return ModuleManager.triggerModules("onSave", document, that, that.db, getUpdateOptions(options, {post: true, level: 0}));
                }).then(
                function () {
                    var workFlowEvents = that.getValue(Constants.Admin.Collections.WORK_FLOW_EVENTS);
                    if (workFlowEvents && workFlowEvents.length > 0) {
                        return that.db.query({$collection: collectionName, $filter: {_id: id}}).then(
                            function (result) {
                                if (result && result.result && result.result.length > 0) {
                                    return ModuleManager.triggerWorkflowEvents("onUpdate", result.result[0], that, that.db, getUpdateOptions(options));
                                }
                            })
                    }
                }).then(
                function () {
                    finalResult = finalResult || 0;
                    if (that.db.logger) {
                        that.db.logger.populateFinalLog(that.db, log, true);
                    }
                    return finalResult;
                })
        })
}

Collection.prototype.remove = function (id, options) {
    var that = this;
    var collectionName = (that.options && that.options.collection) ? that.options.collection : that.mongoCollection.collectionName;
    if (!id) {
        throw new Error("_id is mandatory in case of remove in collection [" + collectionName + "]");
    }
    options = options || {w: 1};
    var log = undefined;
    if (that.db.logger) {
        log = that.db.logger.populateInitialLog("Collection - Remove", {id: id, collectionName: collectionName }, that.db, true);
    }
    var finalResult = undefined;
    var document = undefined;
    var oldData = undefined;
    var fields = that.getValue("fields");
    return Collection.getOldData(id, {}, that, options).then(
        function (oldData1) {
            oldData = oldData1;
            var newUpdates = {_id: oldData._id, $unset: {}};
            for (var k in oldData) {
                newUpdates.$unset[k] = "";
            }
            delete newUpdates.$unset._id;
            document = new Document(newUpdates, oldData, "delete", {collection: collectionName});
            if (options.confirmUserWarning) {
                document.confirmUserWarning = options.confirmUserWarning
            }
            return QueryHandler.remove$Query(document, that.db, {fields: fields});
        }).then(
        function () {
            oldData = require("./Utility.js").deepClone(document.oldRecord);
            return ModuleManager.triggerModules("onValue", document, that, that.db, getUpdateOptions(options, {$onValueProcessed: options.$onValueProcessed, level: 0}));
        }).then(
        function () {
            document.oldRecord = oldData;
            return ModuleManager.triggerModules("onSave", document, that, that.db, getUpdateOptions(options, {pre: true, level: 0}));
        }).then(
        function () {
            if (document.cancelUpdates) {
                if (that.db.logger) {
                    that.db.logger.populateFinalLog(that.db, log, true);
                }
                return 0;
            }
            return handleRemove(that, oldData, options).then(
                function (result) {
                    finalResult = result;
                    document.oldRecord = oldData;
                    return ModuleManager.triggerModules("onSave", document, that, that.db, getUpdateOptions(options, {post: true, level: 0}));
                }).then(
                function () {
                    finalResult = finalResult || 0;
                    if (that.db.logger) {
                        that.db.logger.populateFinalLog(that.db, log, true);
                    }
                    return finalResult;
                })

        })
}

function handleRemove(that, oldData, options) {
    var query = {_id: oldData._id};
    if (options.runOnES) {
        var esDb = that.db.esClient();
        var esId = query._id.toString();
        return  esDb.delete({index: that.db.db.databaseName, type: that.options.collection, id: esId});
    } else {
        return that.mongoDeleteInternal(query, options);
    }
}

Collection.prototype.mongoDeleteInternal = function (query, options) {
    var that = this;
    var sTime = new Date();
    var d = Q.defer();
    var log = undefined;
    if (that.db.logger) {
        log = that.db.logger.populateInitialLog("mongoRemove", {query: query}, that.db, true);
    }
    var mongoOptions = getMongoOptions(options);
    if (options.single) {
        that.mongoCollection.deleteOne(query, mongoOptions, function (err, r) {
            that.db.logMongoTime("mongoRemove", (new Date() - sTime));
            if (that.db.logger) {
                that.db.logger.populateFinalLog(that.db, log, true);
            }
            if (err) {
                d.reject(err);
                return;
            }
            d.resolve(r.result.n);
        });
    } else {
        that.mongoCollection.deleteMany(query, mongoOptions, function (err, r) {
            that.db.logMongoTime("mongoRemove", (new Date() - sTime));
            if (that.db.logger) {
                that.db.logger.populateFinalLog(that.db, log, true);
            }
            if (err) {
                d.reject(err);
                return;
            }
            d.resolve(r.result.n);
        });
    }
    return d.promise;
}

Collection.prototype.mongoUpdateInternal = function (query, update, options) {
    var that = this;
    var sTime = new Date();
    var d = Q.defer();
    var log = undefined;
    if (that.db.logger) {
        log = that.db.logger.populateInitialLog("mongoUpdate", {query: query, update: update}, that.db, true);
    }
    var mongoOptions = getMongoOptions(options);
    if (options.multi) {
        that.mongoCollection.updateMany(query, update, mongoOptions, function (err, r) {
            that.db.logMongoTime("mongoUpdate", (new Date() - sTime));
            if (that.db.logger) {
                that.db.logger.populateFinalLog(that.db, log, true);
            }
            if (err) {
                d.reject(err);
                return;
            }
            d.resolve(r.result.n);
        });
    } else {
        that.mongoCollection.updateOne(query, update, mongoOptions, function (err, r) {
            that.db.logMongoTime("mongoUpdate", (new Date() - sTime));
            if (that.db.logger) {
                that.db.logger.populateFinalLog(that.db, log, true);
            }
            if (err) {
                d.reject(err);
                return;
            }
            d.resolve(r.result.n);
        });
    }
    return d.promise;
}

Collection.prototype.mongoInsertInternal = function (inserts, options) {
    var that = this;
    var log = undefined;
    if (that.db.logger) {
        log = that.db.logger.populateInitialLog("mongoInsert", {insert: inserts}, that.db, true);
    }
    var d = Q.defer();
    var sTime = new Date();
    var mongoOptions = getMongoOptions(options);
    this.mongoCollection.insertOne(inserts, mongoOptions, function (err, result) {
        that.db.logMongoTime("mongoInsert", (new Date() - sTime));
        if (that.db.logger) {
            that.db.logger.populateFinalLog(that.db, log, true);
        }
        if (err) {
            d.reject(err);
            return;
        }
        inserts._id = result.insertedId;
        d.resolve(inserts);
    });
    return d.promise;
}

function getDollarData(mongoCollection, query, limit, lastId, db) {
    var options = {limit: limit, sort: {_id: 1}};
    if (lastId !== undefined) {
        query._id = {$gt: lastId};
    }
    var d = Q.defer();
    var stime = new Date();
    mongoCollection.find(query, options).toArray(function (err, result) {
        db.logMongoTime("mongoFind", (new Date() - stime));
        if (err) {
            d.reject(err);
        } else {
            d.resolve(result);
        }
    })
    return d.promise;
}

function doDollarUpdate(that, collectionName, query, update, limit, lastId, options) {
    var resultFound = undefined;
    return getDollarData(that.mongoCollection, query, limit, lastId, that.db).then(
        function (result) {
            if (result && result.length >= limit) {
                resultFound = true;
                lastId = result[result.length - 1]._id;
            }
            return Utils.iterateArrayWithPromise(result, function (index, document) {
                var queryPart = getQueryPart(update.$set || update.$unset);
                var toSet = getToSet(update.$set || update.$unset);
                var recordId = document["_id"];
                var newSet = modifySet(update.$set || update.$unset, Object.keys(query)[0], that.mongoCollection.collectionName, document);
                var isMultipleDollar = checkMultipleDollar(update.$set || update.$unset);
                return handleDollarUpdates(that.db, that.mongoCollection, collectionName, options, query, update, Object.keys(query)[0], query[Object.keys(query)[0]], newSet, document, queryPart, toSet, recordId, !isMultipleDollar, null);
            })
        }).then(function () {
            if (resultFound) {
                return doDollarUpdate(that, collectionName, query, update, limit, lastId, options)
            }
        })
}

Collection.prototype.mongoUpdate = function (query, update, options) {
    var that = this;
    var collectionName = (that.options && that.options.collection) ? that.options.collection : that.mongoCollection.collectionName;
    options = options || {w: 1};
    var found = checkDollar(update.$set || update.$unset);
    var multiple = options ? options.multi : false;
    if (found && multiple) {
        if (validateFilter(query, collectionName)) {
            return doDollarUpdate(that, collectionName, query, update, 1, undefined, options);
        } else {
            var d = Q.defer();
            d.resolve();
            return d.promise;
        }
    } else {
        return that.mongoUpdateInternal(query, update, options);
    }
}

Collection.prototype.mongoRemove = function (id, options) {
    return this.mongoDeleteInternal(id, options);
}

Collection.prototype.getValue = function (key) {
    var that = this;
    if (that.options && that.options[key]) {
        var value = that.options[key];
        if (key == Constants.Admin.Collections.EVENTS) {
            require("./Utility.js").populateEvents(value);
        }
        return value;
    } else if (key == Constants.Admin.Collections.COLLECTION) {
        //if options has collection then it was already resolved in above condition.
        return that.mongoCollection.collectionName;
    } else if (key == Constants.Admin.Collections.REFERRED_FKS) {
        return getReferredFks.call(that, that.options);
    } else if (key == Constants.Admin.Collections.INDEXES) {
        return getCollectionIndexes.call(that);
    }
}

Collection.prototype.get = function (key) {
    var that = this;
    var D = Q.defer();
    if (that.options && that.options[key]) {
        var value = that.options[key];
        if (key == Constants.Admin.Collections.EVENTS) {
            require("./Utility.js").populateEvents(value);
        }
        D.resolve(value);
    } else if (key == Constants.Admin.Collections.COLLECTION) {
        //if options has collection then it was already resolved in above condition.
        D.resolve(that.mongoCollection.collectionName);
    } else if (key == Constants.Admin.Collections.REFERRED_FKS) {
        getReferredFks.call(that, that.options).then(
            function (referredFks) {
                D.resolve(referredFks);
            }).fail(function (e) {
                D.reject(e);
            })
    } else if (key == Constants.Admin.Collections.INDEXES) {
        getCollectionIndexes.call(that).then(
            function (referredFks) {
                D.resolve(referredFks);
            }).fail(function (e) {
                D.reject(e);
            })
    } else {
        D.resolve();
    }
    return D.promise;

}

function getReferredFks(options) {
    if (!options || !options._id) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var that = this;
    var collectionName = (that.options && that.options.collection) ? that.options.collection : that.mongoCollection.collectionName;
    var query = {};
    query[Constants.Query.COLLECTION] = Constants.Admin.REFERRED_FKS;
    var fields = {};
    fields[Constants.Admin.ReferredFks.COLLECTION_ID + "._id"] = 1;
    fields[Constants.Admin.ReferredFks.COLLECTION_ID + "." + Constants.Admin.Collections.COLLECTION] = 1;
    fields[Constants.Admin.ReferredFks.FIELD] = 1;
    fields[Constants.Admin.ReferredFks.SET] = 1;
    //    fields[Constants.Admin.ReferredFks.COLLECTION_ID] = 1;
    query[Constants.Query.FIELDS] = fields;
    query[Constants.Query.FILTER] = {"referredcollectionid.collection": collectionName, set: {$exists: true}};
    if (options.runOnEs) {
        query.runOnES = true;
    }
    return that.db.query(query, {cache: true}).then(
        function (res) {
            var referredFks = res.result;
            options[Constants.Admin.Collections.REFERRED_FKS] = referredFks;
            return referredFks;
        })
}

function getCollectionIndexes() {
    var that = this;
    if (!that.options || !that.options._id) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var collectionName = (that.options && that.options.collection) ? that.options.collection : that.mongoCollection.collectionName;
    var query = {};
    query[Constants.Query.COLLECTION] = Constants.Index.INDEXES;
    query[Constants.Query.FILTER] = {"collectionid.collection": collectionName};
    return that.db.query(query, {cache: true}).then(
        function (res) {
            var indexes = res.result;
            that.options[Constants.Index.Indexes.INDEXES] = indexes;
            return indexes;
        });
}


function validateFilter(filter, collectionName) {
    filter = filter || {};
    var keys = Object.keys(filter);
    var value = filter[keys[0]];
    if (Array.isArray(value) || Utils.isJSONObject(value)) {
        var message = "value cannot be jsonobject or array for filter [" + JSON.stringify(filter) + "]" + ">>>" + collectionName;
        throw new Error(message);
    }
    if (keys.length > 1 || keys.indexOf("$or") !== -1 || keys.indexOf("$and") !== -1) {
        var message = "filter not supported [" + JSON.stringify(filter) + "]" + ">>>" + collectionName;
        throw new Error(message);
    }
    return true;
}

function prepareInserts(inserts) {
    var keys = Object.keys(inserts);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        if (Utils.isJSONObject(inserts[key])) {
            if (inserts[key].$insert) {
                inserts[key] = inserts[key].$insert;
            }
            for (var j = 0; j < inserts[key].length; j++) {
                prepareInserts(inserts[key][j]);
            }
        } else if (Array.isArray(inserts[key])) {
            for (var j = 0; j < inserts[key].length; j++) {
                if (Utils.isJSONObject(inserts[key][j])) {
                    prepareInserts(inserts[key][j]);
                }
            }
        }
    }
}

Collection.prototype.mongoInsert = function (inserts, options) {
    prepareInserts(inserts);
    return this.mongoInsertInternal(inserts, options).then(function (result) {
        return [result];
    })

}

function handleSimpleFields(document, newUpdate, field, pExpression) {
    var newField = pExpression ? pExpression + "." + field : field;
    if (document.updates && document.updates.$inc && document.updates.$inc[field] !== undefined) {
        newUpdate.$inc = newUpdate.$inc || {};
        newUpdate.$inc[newField] = document.get(field);
    } else if (document.updates && document.updates.$set && document.updates.$set[field] !== undefined) {
        newUpdate.$set = newUpdate.$set || {};
        newUpdate.$set[newField] = document.get(field);
    } else if (document.updates && document.updates.$unset && document.updates.$unset[field] !== undefined) {
        newUpdate.$unset = newUpdate.$unset || {};
        newUpdate.$unset[newField] = "";
    } else if (document.updates && document.updates[field] !== undefined) {
        newUpdate.$set = newUpdate.$set || {};
        newUpdate.$set[newField] = document.updates[field];
    }
}

function createFilter(document, id, newParentExp) {
    var query = {};
    if (document.updates && document.updates.$query !== undefined) {
        query = document.updates.$query;
    } else {
        query._id = document.updates._id;
    }
    var newQuery = {};
    for (var key in query) {
        newQuery[newParentExp + "." + key] = query[key];
    }
    newQuery._id = id;
    return newQuery;
}

function modifyUpdates(document, newUpdate, arrayUpdates, id, allFields, pExpression) {
    if (document && document.updates === null) {
        newUpdate.$unset = newUpdate.$unset || {};
        newUpdate.$unset[pExpression] = "";
    }
    var fields = document.getUpdatedFields();
    var fieldCount = fields ? fields.length : 0;
    for (var i = 0; i < fieldCount; i++) {
        var field = fields[i];
        if (document.isInUnset(field)) {
            newUpdate.$unset = newUpdate.$unset || {};
            var newParentExp = pExpression ? pExpression + "." + field : field;
            newUpdate.$unset[newParentExp] = "";
        } else {
            var documents = document.getDocuments(field);
            if (documents) {
                var newParentExp = pExpression ? pExpression + "." + field : field;
                if (Array.isArray(documents)) {
                    var updates = document && document.updates && document.updates.$set && document.updates.$set[field];
                    if (updates && (updates.$insert || updates.$delete || updates.$update)) {
                        var insertDocuments = document.getDocuments(field, ["insert"]);
                        handleInsertDocuments(insertDocuments, newUpdate, allFields, newParentExp);
                        var deleteDocuments = document.getDocuments(field, ["delete"]);
                        handleDeleteDocuments(deleteDocuments, newUpdate, newParentExp);
                        var updateDocuments = document.getDocuments(field, ["update"]) || [];
                        for (var j = 0; j < updateDocuments.length; j++) {
                            var query = createFilter(updateDocuments[j], id, newParentExp);
                            var update = {};
                            update.query = query;
                            var newParentExp = pExpression ? pExpression + "." + field : field;
                            handleUpdateDocuments(updateDocuments[j], update, newParentExp + ".$");
                            if (update.$set !== undefined || update.$unset !== undefined || update.$inc !== undefined) {
                                arrayUpdates.push(update);
                            }
                        }
                    } else {
                        var newParentExp = pExpression ? pExpression + "." + field : field;
                        newUpdate.$set = newUpdate.$set || {};
                        newUpdate.$set[newParentExp] = document.get(field);
                    }
                } else {
                    if (documents && documents.updates && documents.updates.$set === undefined && documents.updates.$unset === undefined && documents.updates.$inc === undefined) {
                        newUpdate.$set = newUpdate.$set || {};
                        newUpdate.$set[newParentExp] = documents.updates;
                    } else {
                        if (documents && documents.updates !== null && document.updates.$set !== undefined && document.updates.$set[field] === null) {
                            newUpdate.$set = newUpdate.$set || {};
                            newUpdate.$set[newParentExp] = null;
                        } else {
                            modifyUpdates(documents, newUpdate, arrayUpdates, id, allFields ? allFields[field] : null, newParentExp);
                        }
                    }

                }
            }
            else {
                handleSimpleFields(document, newUpdate, field, pExpression);
            }
        }
    }
}

function handleDeleteDocuments(documents, newUpdate, expression) {
    var pull = newUpdate.$pull ? newUpdate.$pull : {};
    var filters = [];
    var filterKey = null;
    for (var i = 0; i < documents.length; i++) {
        var operation = documents[i].updates ? documents[i].updates : documents[i].oldRecord;
        operation = operation.$query ? operation.$query : operation;
        if (Utils.isJSONObject(operation)) {
            filterKey = Object.keys(operation)[0];
            filters.push(operation[filterKey]);
        } else {
            filters.push(operation);
        }
    }
    if (filterKey) {
        var newFilter = {};
        newFilter[filterKey] = {"$in": filters};
        pull[expression] = newFilter;
    } else {
        if (filters.length > 0) {
            pull[expression] = {"$in": filters};
        }
    }
    if (Object.keys(pull).length > 0) {
        newUpdate.$pull = pull;
    }
}

function handleInsertDocuments(documents, newUpdate, fields, expression) {
    var inserts = [];
    for (var i = 0; i < documents.length; i++) {
        prepareInserts(documents[i].updates);
        inserts.push(documents[i].updates);
    }
    if (inserts && inserts.length > 0) {
        var push = newUpdate.$push ? newUpdate.$push : {};
        var sortExp = getSortExpression(fields, expression);
        var sort = {};
        sortExp = sortExp !== undefined ? sortExp : "_id";
        sort[sortExp] = 1;
        push[expression] = {"$each": inserts, $sort: sort, $slice: -20000};
        if (Object.keys(push).length > 0) {
            newUpdate.$push = push;
        }
    }
}

function handleUpdateDocuments(document, newUpdate, pExp) {
    var updatedFields = document.getUpdatedFields();
    if (updatedFields) {
        for (var i = 0; i < updatedFields.length; i++) {
            var field = updatedFields[i];
            if (document.isInUnset(field)) {
                var newParentExp = pExp ? pExp + "." + field : field;
                newUpdate.$unset = newUpdate.$unset || {};
                newUpdate.$unset[newParentExp] = "";
            }
            var documents = document.getDocuments(field);
            if (documents) {
                var newParentExp = pExp ? pExp + "." + field : field;
                if (Array.isArray(documents)) {
                    if (documents.length > 0) {
                        var nestedArray = [];
                        for (var j = 0; j < documents.length; j++) {
                            if (documents[j].type !== "delete") {
                                nestedArray.push(documents[j].convertToJSON());
                            }
                        }
                        newUpdate.$set = newUpdate.$set || {};
                        newUpdate.$set[newParentExp] = nestedArray;
                    } else {
                        handleSimpleFields(document, newUpdate, field, pExp);
                    }
                } else if (documents && documents.updates && documents.updates.$set === undefined && documents.updates.$unset === undefined && documents.updates.$inc === undefined) {
                    newUpdate.$set = newUpdate.$set || {};
                    newUpdate.$set[newParentExp] = documents.updates;
                } else {
                    handleUpdateDocuments(documents, newUpdate, newParentExp);
                }
            }
            else {
                handleSimpleFields(document, newUpdate, field, pExp);
            }
        }
    }
}

function handleDollarUpdates(db, mongoCollection, collectionName, options, query, originalSet, queryKey, queryValue, modifiedSet, document, queryPart, toSet, recordId, isSingleDollar, parentExp) {
    if (queryKey === undefined) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var key = queryKey.substr(0, queryKey.indexOf("."));
    var restPart = queryKey.substr(queryKey.indexOf(".") + 1);
    if (queryPart === parentExp) {
        if (!(Utils.isJSONObject(document))) {
            var message = "Value  should be Jsonobject at break point but found [" + typeof document + "]" + ">>> collection>>" + collectionName;
            throw new Error(message);
        }
        return handleNested(db, mongoCollection, collectionName, options, query, originalSet, queryKey, queryValue, modifiedSet, document, queryPart, toSet, recordId, isSingleDollar);
    } else {
        var value = document[key];
        if ((!(Array.isArray(value))) && (!(Utils.isJSONObject(value)))) {
            var message = "Value should be array of object for field [" + key + "]" + ">>> collection>>" + collectionName + ">>>document>>>" + JSON.stringify(document);
            throw new Error(message);
        }
        if (Utils.isJSONObject(value)) {
            value = [value];
        }
        return Utils.iterateArrayWithPromise(value, function (index, valueObject) {
            return handleDollarUpdates(db, mongoCollection, collectionName, options, query, originalSet, restPart, queryValue, modifiedSet, valueObject, queryPart, toSet, recordId, isSingleDollar, parentExp ? parentExp + "." + key : key);
        })
    }
}

function checkDollar(setUpdates) {
    setUpdates = setUpdates || {};
    var keys = Object.keys(setUpdates);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var index = key.indexOf(".$.");
        if (index !== -1) {
            return true;
        }
    }
    return false;
}

function getQueryPart(setUpdates) {
    var firstKey = Object.keys(setUpdates)[0];
    var index = firstKey.indexOf(".$.");
    return firstKey.substr(0, index);
}

function getToSet(setUpdates) {
    var firstKey = Object.keys(setUpdates)[0];
    var index = firstKey.indexOf(".$.");
    var rest = firstKey.substr(index + 3);
    var dotIndex = rest.indexOf(".");
    if (dotIndex > 0) {
        return rest.substr(0, dotIndex);
    } else {
        return rest;
    }
}

function handleNested(db, mongoCollection, collectionName, options, query, originalSet, queryKey, queryValue, modifiedSet, document, queryPart, toSet, recordId, isSingleDollar) {
    if (!Utils.isJSONObject(document)) {
        var message = "Document should be object at break point but found [" + JSON.stringify(document) + "], original Set >>" + JSON.stringify(originalSet) + ">>> collection>>" + collectionName;
        throw new Error(message);
    }
    if (isSingleDollar) {
        return handleSingleDollar(db, mongoCollection, collectionName, options, query, queryKey, queryValue, originalSet, document, document._id, queryPart, recordId);
    } else {
        var targetValue = document[toSet];
        if (targetValue === undefined) {
            var d = Q.defer();
            d.resolve();
            return d.promise;
        }
        if (Array.isArray(targetValue) || Utils.isJSONObject(targetValue)) {
            var restQueryPart = queryKey.substr(queryKey.indexOf(".") + 1);
            var isChanged = prepareNestedUpdates(restQueryPart, queryValue, originalSet, modifiedSet, targetValue);
            if (isChanged) {
                return finalUpdateOnMongo(db, mongoCollection, collectionName, options, document, recordId, queryPart, toSet, targetValue, originalSet);
            } else {
                var d = Q.defer();
                d.resolve();
                return d.promise;
            }
        }
    }
}

function modifySet(setUpdates, queryKey, collectionName, document) {
    var newSet = {};
    var lastIndexofDot = queryKey.lastIndexOf(".");
    var partToRemove = queryKey.substr(0, lastIndexofDot + 1);
    var keys = Object.keys(setUpdates);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var keyWithoutDollar = removeDollars(key);
        if (keyWithoutDollar.indexOf(partToRemove) < 0) {
            var message = "operation not supported with updates in set [" + JSON.stringify(setUpdates) + "]" + ">>collection>>" + collectionName + ">>>document>>" + JSON.stringify(document);
            throw new Error(message);

        }
        var newKey = keyWithoutDollar.substring(partToRemove.length);
        newSet[newKey] = setUpdates[key];
    }
    return newSet;
}

function prepareNestedUpdates(query, queryValue, originalSet, modifiedSet, targetValue) {
    if (Array.isArray(targetValue)) {
        var updated = false;
        for (var i = 0; i < targetValue.length; i++) {
            var nestedpdated = prepareNestedUpdates(query, queryValue, originalSet, modifiedSet, targetValue[i]);
            updated = updated || nestedpdated;
        }
        return updated;
    } else if (Utils.isJSONObject(targetValue)) {
        if (query.indexOf(".") >= 0) {
            var queryFirstPart = query.substr(0, query.indexOf("."));
            var queryRestPart = query.substr(query.indexOf(".") + 1);
            var value = targetValue[queryFirstPart];
            return prepareNestedUpdates(queryRestPart, queryValue, originalSet, modifiedSet, value);
        } else {
            if (targetValue && targetValue[query]) {
                if (Utils.deepEqual(targetValue[query], queryValue)) {
                    var isUnset = originalSet.$unset ? true : false;
                    updateValue(targetValue, modifiedSet, isUnset);
                    return true;
                } else {
                    return false;
                }
            }
        }
    } else {
        return false;
    }
}

function removeDollars(key) {
    if (key.indexOf(".$.") !== -1) {
        var replacedKey = key.replace(".$.", ".");
        return removeDollars(replacedKey);
    } else {
        return key;
    }
}

function updateValue(targetValue, modifiedSet, isUnset) {
    for (var key in modifiedSet) {
        finalUpdate(targetValue, key, modifiedSet[key], isUnset)
    }
}

function finalUpdate(targetValue, key, value, isUnset, parentExp) {
    if (key.indexOf(".") !== -1) {
        var firstPart = key.substr(0, key.indexOf("."));
        var rest = key.substr(key.indexOf(".") + 1);
        targetValue[firstPart] = targetValue[firstPart] || {};
        finalUpdate(targetValue, rest, value, isUnset, firstPart);
    } else {
        if (parentExp) {
            var parentValue = targetValue[parentExp];
            if (isUnset) {
                delete parentValue[key];
            } else {
                parentValue[key] = value;
            }
        } else {
            if (isUnset) {
                delete targetValue[key];
            } else {
                targetValue[key] = value;
            }
        }
    }
}

function finalUpdateOnMongo(db, mongoCollection, collectionName, options, document, recordId, queryPart, toSet, targetValue, originalSet) {
    var query = {};
    query["_id"] = recordId;
    query[queryPart + "._id" ] = document["_id"];
    var set = {};
    set.$set = {};
    set.$set[queryPart + ".$." + toSet] = targetValue;
    var D = Q.defer();
    var sTime = new Date();
    mongoCollection.updateOne(query, set, options, function (err) {
        db.logMongoTime("mongoUpdate", (new Date() - sTime));
        if (err) {
            var message = "error while updating with  [" + query + "]  and updates >>[" + set + "]>>> and err message [" + err.message + "]" + ">>> collection>>" + collectionName + ">> document>>" + JSON.stringify(document);
            D.reject(new Error(message))
        } else {
            D.resolve();
        }
    });
    return D.promise;
}

function checkMultipleDollar(setUpdates) {
    var keys = Object.keys(setUpdates);
    var found = false;
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var index = key.indexOf(".$.");
        if (index !== -1) {
            var first = key.substr(0, index);
            var second = key.substr(index + 3);
            var secondIndex = second.indexOf(".$.");
            if (secondIndex !== -1) {
                found = true;
                break;
            }
        }
    }
    if (found) {
        return true;
    } else {
        return false;
    }
}

function handleSingleDollar(db, mongoCollection, collectionName, options, query, queryKey, queryValue, originalSet, document, documentId, queryPart, recordId) {
    if (queryKey.indexOf(".") > 0) {
        var firstpart = queryKey.substr(0, queryKey.indexOf("."));
        var restKey = queryKey.substr(queryKey.indexOf(".") + 1);
        return handleSingleDollar(db, mongoCollection, collectionName, options, query, restKey, queryValue, originalSet, document ? document[firstpart] : {}, documentId, queryPart, recordId);
    } else {
        if (document && document[queryKey]) {
            if (Utils.deepEqual(queryValue, document[queryKey])) {
                var query = {};
                query["_id"] = recordId;
                query[queryPart + "._id"] = documentId;
                var D = Q.defer();
                var stime = new Date();
                mongoCollection.updateMany(query, originalSet, options, function (err, result) {
                    db.logMongoTime("mongoUpdate", (new Date() - stime));
                    if (err) {
                        var errorMsg = {err: {stack: err.stack, message: err.message}, collection: collectionName, document: JSON.stringify(document), query: JSON.stringify(query)};
                        D.reject(new Error(JSON.stringify(errorMsg)));
                    } else {
                        D.resolve();
                    }
                });
                return D.promise;
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
}

function getSortExpression(fields, expression) {
    fields = fields || [];
    for (var i = 0; i < fields.length; i++) {
        if (fields[i].field === expression) {
            return fields[i].sort;
        }
    }
}

Collection.prototype.ensureIndex = function (fieldSet, options) {
    var d = Q.defer();
    this.mongoCollection.createIndex(fieldSet, options, function (err, result) {
        if (err) {
            d.reject(err);
            return;
        }
        d.resolve(result);
    });
    return d.promise;
}

Collection.prototype.dropIndex = function (indexName) {
    var d = Q.defer();
    this.mongoCollection.dropIndex(indexName, function (err, result) {
        if (err) {
            d.reject(err);
            return;
        }
        d.resolve(result);
    });
    return d.promise;
}

Collection.prototype.getIndexes = function () {
    var d = Q.defer();
    this.mongoCollection.indexes(function (err, result) {
        if (err) {
            if (err.code && err.code == 26) {
                d.resolve();
            } else {
                d.reject(err);
            }
            return;
        }
        d.resolve(result);
    });
    return d.promise;
};

Collection.prototype.stats = function () {
    var d = Q.defer();
    this.mongoCollection.stats(function (err, stats) {
        if (err) {
            d.reject(err);
            return;
        }
        d.resolve(stats);
    });
    return d.promise;
}

function check$Query(updates, collection, fields) {
    var QueryHandler = require("./QueryHandler.js");
    QueryHandler.check$query(updates, updates, collection, fields);
}

function finalMongoInsert(that, options, inserts) {
    if (options.upsert) {
        return that.findAndModify(options.query, [], inserts, options).then(function (upsertResult) {
            var value = upsertResult.value;
            if (!value) {
                throw new Error("returnOriginal must be false in options while upsert is true");
            }
            var d = Q.defer();
            var sTime = new Date();
            that.mongoCollection.findOne({_id: value._id}, function (err, result) {
                that.db.logMongoTime("mongoFindOne", (new Date() - sTime));
                if (err) {
                    d.reject(err);
                    return;
                }
                d.resolve(result);
            })
            return d.promise;
        }).fail(function (err) {
            if (err.code == "11000") {
                return populateDuplicateError(that, err);
            } else {
                throw err;
            }
        })
    } else {
        if (options.runOnES) {
            var db = that.db;
            var esDb = db.esClient();
            var esInserts = {index: db.db.databaseName, type: that.options.collection};
            if (inserts._id) {
                var esId = inserts._id.toString();
                esInserts.id = esId;
                delete inserts._id;
            }
            esInserts.body = inserts;
            return esDb.index(esInserts).then(
                function (result) {
                    var _id = result._id;
                    var index = result._index;
                    var type = result._type;
                    return  Q.delay(500).then(function () {
                        return  db.query({$collection: type, $filter: {_id: _id}, "runOnES": true});
                    });
                }).then(
                function (queryResult) {
                    if (queryResult && queryResult.result && queryResult.result.length > 0) {
                        return queryResult.result[0];
                    } else {
                        throw new Error("Not inserted");
                    }
                })
        } else {
            return that.mongoInsertInternal(inserts, options).fail(function (err) {
                if (err.code == "11000") {
                    return populateDuplicateError(that, err);
                } else {
                    throw err;
                }
            })
        }
    }
}

function populateDuplicateError(that, error) {
    return that.get(Constants.Admin.Collections.INDEXES).then(function (indexes) {
        if (!indexes || indexes.length === 0 || !error.message) {
            throw error;
        }
        var message = error.message;
        var collectionName = (that.options && that.options.collection) ? that.options.collection : that.mongoCollection.collectionName;
        var expression = that.db.db.databaseName + "." + collectionName + ".$";
        var startIndex = message.indexOf(expression);
        var endIndex = message.indexOf("dup key");
        var indexName = message.substring(startIndex + expression.length, endIndex);
        indexName = indexName.trim();
        var indexValue = message.substring(message.indexOf("{ : ") + 4, message.indexOf(" }"));
        var indexDetail = Utils.isValueExists(indexes, "name", indexName);
        if (!indexDetail || !indexDetail.indexes) {
            throw error;
        }
        var indexes = JSON.parse(indexDetail.indexes);
        var indexKeys = Object.keys(indexes);
        var splitKeys = indexValue.split(", : ");
        if (indexDetail.message) {
            message = indexDetail.message;
        } else if (indexKeys.length > 0) {
            var fieldInfos = that.getValue("fieldInfos");
            message = "";
            message += getLabel(fieldInfos, indexKeys[0], "") + " [" + splitKeys[0] + "]";
            for (var i = 1; i < indexKeys.length; i++) {
                message += ", " + getLabel(fieldInfos, indexKeys[i], "") + " [" + splitKeys[i] + "]";
                }
            message += " already exists";
            }
        var detailMessage = "Duplicate index error in db [" + that.db.db.databaseName + "] for collection [" + collectionName + "] having fields " + JSON.stringify(indexKeys) + " with value [" + splitKeys + "]";
        var modifiedError = new Error(message);
        modifiedError.code = Constants.ErrorCode.UNIQUE_INDEX.CODE;
        modifiedError.detailMessage = detailMessage;
        modifiedError.fields = indexKeys.length === 1 ? indexKeys[0] : indexKeys;
        throw modifiedError;
    });
}

function getLabel(fieldInfos, key, label) {
    if (!fieldInfos) {
        return key;
    }
    if (label.trim().length > 0) {
        label = "." + label;
    }
    var indexOf = key.lastIndexOf(".");
    var fieldDef = fieldInfos[key];
    if (fieldDef) {
        label = (fieldDef.label || fieldDef.field) + label;
    } else {
        if (indexOf > -1) {
            label = key.substring(indexOf + 1) + label;
        } else {
            label = key + label;
        }
    }
    if (indexOf > -1) {
        key = key.substring(0, indexOf);
        return getLabel(fieldInfos, key, label);
    } else {
        return label;
    }
}


function createUpdateScript(newUpdate) {
    var script = "";
    var params = {};
    if (newUpdate.$set !== undefined) {
        for (var key  in newUpdate.$set) {
            if (key !== "__txs__" /*&& key !== "__history.__lastUpdatedOn" && key !== "__history.__lastUpdatedBy"*/) {
                if (typeof newUpdate.$set[key] == "object") {
                    var mkey = Utils.replaceDotToUnderscore(key);
                    params[mkey] = newUpdate.$set[key];
                    script += "ctx._source." + key + "=" + mkey + ";";
                } else {
                    script += "ctx._source." + key + "='" + newUpdate.$set[key] + "';";
                }

            }
        }
    }
    if (newUpdate.$unset !== undefined) {
        for (var key in newUpdate.$unset) {
            var dotIndex = key.indexOf(".");
            if (dotIndex !== -1) {
                var lastDotIndex = key.lastIndexOf(".");
                var beforeLastDotIndex = key.substring(0, lastDotIndex);
                var afterLastDotIndex = key.substring(lastDotIndex + 1);
                script += "ctx._source." + beforeLastDotIndex + "." + "remove('" + afterLastDotIndex + "')";
            } else {
                script += "ctx._source.remove('" + key + "')";
            }
        }
    }
    if (newUpdate.$inc !== undefined) {
        for (var key in newUpdate.$inc) {
            var value = newUpdate.$inc[key];
            var dotIndex = key.indexOf(".");
            if (dotIndex !== -1) {
                var lastDotIndex = key.lastIndexOf(".");
                var beforeLastDotIndex = key.substring(0, lastDotIndex);
                var afterLastDotIndex = key.substring(lastDotIndex + 1);
                script += "(ctx._source." + beforeLastDotIndex + ".containsKey('" + afterLastDotIndex + "') ) ? (ctx._source." + key + " +=" + value + ") : ( ctx._source." + key + "=" + value + ")";
            } else {
                script += "(ctx._source.containsKey('" + key + "') ) ? (ctx._source." + key + "+=" + value + ") : (ctx._source." + key + "=" + value + ")";
            }
        }
    }

    if (newUpdate.$push !== undefined) {
        for (var key in newUpdate.$push) {
            var value = newUpdate.$push[key].$each;
            var dotIndex = key.indexOf(".");
            if (dotIndex !== -1) {
                var lastDotIndex = key.lastIndexOf(".");
                var beforeLastDotIndex = key.substring(0, lastDotIndex);
                var afterLastDotIndex = key.substring(lastDotIndex + 1);
                var mkey = Utils.replaceDotToUnderscore(key);
                params[mkey] = value;
                script += "(ctx._source." + beforeLastDotIndex + ".containsKey('" + afterLastDotIndex + "') ) ? (ctx._source." + key + " +=" + mkey + ") : ( ctx._source." + key + "=" + mkey + ")";
            } else {
                script += "(ctx._source.containsKey('" + key + "') ) ? (ctx._source." + key + "+=" + value + ") : (ctx._source." + key + "=" + value + ")";
            }
        }
    }
//    console.log("script>>>>" + script);
//    console.log("params>>>>" + JSON.stringify(params));
    return {script: script, params: params};
}
