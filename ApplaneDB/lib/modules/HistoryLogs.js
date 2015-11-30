/**
 * Created by ashu on 24/7/14.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var QueryUtility = require("../QueryUtility.js");
var Q = require("q");

exports.doQuery = function (query, collection, db) {
    if (query.$historyFields || query.$group || query.$unwind) {
        return;
    }
    var queryFields = query.$fields;
    if (!queryFields || Object.keys(queryFields).length === 0) {
        query.$fields = {__history: 0};
    } else {
        var fieldValue = queryFields[Object.keys(queryFields)[0]];
        if (fieldValue === 0) {
            queryFields.__history = 0;
        }
    }
}

exports.onPreSave = function (event, document, collection, db, options) {
    var userId = db.user ? db.user._id : undefined;
    var docType = document.type;
    if (docType === "insert") {
        manageInsertHistory(document, userId);
    } else if (docType === "update") {
        return manageUpdateHistory(document, collection, userId);
    } else if (docType === "delete") {
        return manageDeleteHistoryLogs(document, collection, userId, db);
    }
};

function manageDeleteHistoryLogs(document, collection, userId, db) {
    var historyEnabled = collection.getValue("historyEnabled");
    if (historyEnabled) {
        var oldRecord = QueryUtility.getReference(document.oldRecord);
        oldRecord.__collection = document.collection;
        oldRecord.__history = oldRecord.__history || {};
        oldRecord.__history.__deletedBy = {_id: userId}
        oldRecord.__history.__deletedOn = new Date();

        var update = {"$collection": "pl.historylogs", $insert: oldRecord, $events: false, $modules: {TransactionModule: 1}};
        return db.update(update);
    }
}

function manageUpdateHistory(document, collection, userId) {
    var historyUpdate = {};
    historyUpdate.__lastUpdatedOn = new Date();
    if (userId) {
        historyUpdate.__lastUpdatedBy = {_id: userId};
    }
    var historyEnabled = collection.getValue("historyEnabled");
    if (historyEnabled) {
        manageUpdateLogs(document, collection, historyUpdate);
    }
    document.set("__history", {$set: historyUpdate});
}

function manageUpdateLogs(document, collection, historyUpdate) {
    var historyFields = collection.getValue("historyFields");
    var excludeFields = undefined;
    var includeFields = undefined;
    if (historyFields) {
        if (typeof historyFields === "string") {
            historyFields = JSON.parse(historyFields);
        }
        for (var k in historyFields) {
            var value = historyFields[k];
            if (value === 0) {
                excludeFields = excludeFields || [];
                excludeFields.push(k);
            } else {
                includeFields = includeFields || [];
                includeFields.push(k);
            }
        }
    }
    var updateLog = {};
    populateRecordFieldLogs(document, includeFields, excludeFields, updateLog);
    if (Object.keys(updateLog).length > 0) {
        updateLog.__updatedOn = historyUpdate.__lastUpdatedOn;
        updateLog.__updatedBy = historyUpdate.__lastUpdatedBy;
        historyUpdate.history = {$insert: [updateLog]};
    }
}

function populateRecordFieldLogs(document, includeFields, excludeFields, updateLog, pField) {
    var updatedFields = document.getUpdatedFields();
    if (!updatedFields || updatedFields.length === 0) {
        return;
    }
    for (var i = 0; i < updatedFields.length; i++) {
        var field = updatedFields[i];
        var parentField = pField ? pField + "." + field : field;
        if ((excludeFields && excludeFields.indexOf(parentField) !== -1) || (includeFields && includeFields.indexOf(parentField) === -1)) {
            continue;
        }
        var documents = document.getDocuments(field, ["insert", "update", "delete"]);
        if (documents && (!Array.isArray(documents) || documents.length > 0)) {
            if (!Array.isArray(documents)) {
                var innerField = {};
                populateRecordFieldLogs(documents, includeFields, excludeFields, innerField, parentField);
                updateLog[field] = innerField;
            } else {
                populateLogsIfArray(documents, includeFields, excludeFields, updateLog, field, parentField);
            }
        } else {
            var oldValue = document.getOld(field);
            var newValue = document.get(field);
            if (!Utils.deepEqual(oldValue, newValue)) {
                if (oldValue === undefined) {
                    oldValue = null;
                }
                updateLog[field] = oldValue;
            }
        }
    }
}

function populateLogsIfArray(documents, includeFields, excludeFields, updateLog, field, parentField) {
    for (var j = 0; j < documents.length; j++) {
        var newDocument = documents[j];
        var docType = newDocument.type;
        var entry = {__type: docType};
        if (docType === "insert") {
            entry._id = newDocument.get("_id");
        } else if (docType === "update") {
            entry._id = newDocument.get("_id");
            populateRecordFieldLogs(newDocument, includeFields, excludeFields, entry, parentField);
        } else if (docType === "delete") {
            var oldRecord = newDocument.oldRecord;
            for (var k in oldRecord) {
                entry[k] = oldRecord[k];
            }
        }
        updateLog[field] = updateLog[field] || [];     //override innerfield always in history.
        updateLog[field].push(entry);
    }
}

function manageInsertHistory(document, userId) {
    var historyUpdate = {};
    historyUpdate.__createdOn = new Date();
    historyUpdate.__lastUpdatedOn = new Date();
    if (userId) {
        historyUpdate.__createdBy = {_id: userId};
        historyUpdate.__lastUpdatedBy = {_id: userId};
    }
    document.set("__history", historyUpdate);
}


function addInsertAndDeleteLog(startMessage, addMessage, type, date, userId, users, logs, db) {
    var options = {};
    options.startMessage = startMessage;
    options.type = type;
    options.date = date;
    options.message = addMessage;
    return getUser(users, userId, db).then(function (userName) {
        options.userName = userName;
        addLog(logs, options);
    })
}


exports.populateHistoryLogs = function (query, result, db, options) {

    var params = query.$parameters;
    var collection = params.collection;
    var id = params._id;
    if (!id || !collection) {
        return;
    }

    var users = {};
    var logs = [];
    var finalResult = result.result;
    var queryCollectionName = params.showDeletedHistoryLogs ? "pl.historylogs" : collection;
    return db.query({$collection: queryCollectionName, $filter: {_id: id}, $events: false, $modules: false}).then(function (queryResult) {
        var result = queryResult.result[0];
        if (!result || !result.__history) {
            return;
        }
        var fields = undefined;
        var oldValues = {};
        var histories = result.__history.history;
        var addMessage = "";
        return db.collection(collection).then(
            function (collectionObj) {
                fields = collectionObj.getValue("fields");
            }).then(
            function () {
                var primaryField = getPrimaryField(fields);
                var label = undefined;
                if (primaryField) {
                    if (Utils.isJSONObject(result[primaryField.field])) {//fk primary column case
                        var fieldDef = Utils.getField(primaryField.field, fields);
                        if (fieldDef.displayField) {
                            var displayField = fieldDef.displayField;
                            var value = result[primaryField.field];
                            label = value[displayField];
                        }
                    } else {
                        label = result[primaryField.field];
                    }
                    addMessage = "for (" + primaryField.label + " : " + (label) + ").";
                } else {
                    addMessage = ".";
                }
            }).then(
            function () {
                if (queryCollectionName === "pl.historylogs") {
                    var deletedOn = result.__history.__deletedOn || result.__history.__createdOn;
                    var deletedBy = result.__history.__deletedBy ? result.__history.__deletedBy._id : (result.__history.__createdBy ? result.__history.__createdBy._id : undefined);
                    return addInsertAndDeleteLog("Record deleted", addMessage, "Delete", deletedOn, deletedBy, users, logs, db);
                }
            }).then(
            function () {
                return populateHistoryUpdates(histories, fields, logs, users, oldValues, result, db);
            }).then(
            function () {
                var createdOn = result.__history.__createdOn;
                var createdBy = result.__history.__createdBy ? result.__history.__createdBy._id : undefined;
                return addInsertAndDeleteLog("Record created", addMessage, "Insert", createdOn, createdBy, users, logs, db);
            }).then(function () {
                finalResult.splice(0, (finalResult.length));
                finalResult.push.apply(finalResult, logs);
            })
    })
}

function populateHistoryUpdates(histories, fields, logs, users, oldValues, result, db) {
    return Utils.reverseIterator(histories, function (index, history) {

        var historyUserName = undefined;
        var updatedById = history.__updatedBy ? history.__updatedBy._id : undefined;
        var updatedOn = history.__updatedOn;
        delete history.__updatedBy;
        delete history.__updatedOn;
        return getUser(users, updatedById, db).then(
            function (uName) {
                historyUserName = uName;
            }).then(function () {
                var options = {};
                options.userName = historyUserName;
                options.date = updatedOn;
                return populateHistoryUpdate(history, fields, logs, users, oldValues, result, db, options);
            })
    })
}

function populateHistoryUpdate(history, fields, logs, users, oldValues, result, db, options) {
    if (!fields || fields.length === 0) {
        return;
    }
    for (var updatedKey in history) {
        if (updatedKey !== "_id") {
            var updateValue = history[updatedKey];
            var fieldDef = Utils.getField(updatedKey, fields);
            if (fieldDef) {
                var fieldType = fieldDef.type;
                if (fieldType === "object" || (fieldType === "fk" && fieldDef.multiple === true)) {
                    if (updateValue) {
                        if (Array.isArray(updateValue)) {
                            handleMultipleObject(result, updatedKey, updateValue, fieldDef, oldValues, logs, users, db, options);
                        } else if (Utils.isJSONObject(updateValue)) {
                            var innerFields = fieldDef.fields;
                            var newResult = result[updatedKey] || {};
                            oldValues[updatedKey] = oldValues[updatedKey] || {};
                            var newOldValues = oldValues[updatedKey];
                            populateHistoryUpdate(updateValue, innerFields, logs, users, newOldValues, newResult, db, options);
                        }
                    }
                } else {
                    var finalValues = undefined;
                    if (fieldType === "fk") {
                        finalValues = handleFk(oldValues, updatedKey, result, fieldDef, history);
                    } else if (fieldType === "currency") {
                        finalValues = handleUDT(updatedKey, history, oldValues, result, "currency");
                    } else if (fieldType === "duration") {
                        finalValues = handleUDT(updatedKey, history, oldValues, result, "duration");
                    } else if (fieldType === "unit") {
                        finalValues = handleUDT(updatedKey, history, oldValues, result, "unit");
                    } else if (fieldType === "daterange" || fieldType === "file" || fieldType === "schedule" || fieldType === "json") {
                        finalValues = {};
                    } else {
                        finalValues = handleCommomValues(result, history, updatedKey, oldValues, fieldType);
                    }
                    var oldFieldvalue = finalValues.oldFieldvalue;
                    var newFieldValue = finalValues.newFieldValue;
                    if (oldFieldvalue === null || oldFieldvalue === undefined || oldFieldvalue === "") {
                        oldFieldvalue = "No value";
                    }
                    if (newFieldValue === null || newFieldValue === undefined || newFieldValue === "") {
                        newFieldValue = "No value";
                    }

                    options.type = "Update";
                    options.message = "<b>" + fieldDef.label + "</b>" + " changed";
                    if (oldFieldvalue === "No value" && newFieldValue === "No value") {
                        options.message += ".";
                    } else {
                        oldFieldvalue = "<b>" + oldFieldvalue + "</b>";
                        newFieldValue = "<b>" + newFieldValue + "</b>";
                        options.message += " from " + oldFieldvalue + " to " + newFieldValue + ".";
                    }
                    addLog(logs, options);
                }
            }
        }
    }
    delete options.startMessage;
}

function handleCommomValues(result, history, updatedKey, oldValues, fieldType) {
    var Moment = require("moment");
    var oldFieldvalue = history[updatedKey];
    var newFieldValue = oldValues[updatedKey] !== undefined ? oldValues[updatedKey] : result[updatedKey];
    oldValues[updatedKey] = history[updatedKey];
    if (fieldType == "date") {
        if (oldFieldvalue) {
            oldFieldvalue = Moment(oldFieldvalue).format("DD/MM/YYYY");
        }
        if (newFieldValue) {
            newFieldValue = Moment(newFieldValue).format("DD/MM/YYYY");
        }
    }
    return {oldFieldvalue: oldFieldvalue, newFieldValue: newFieldValue};
}


function handleUDT(updatedKey, history, oldValues, result, type) {
    var oldFirst = undefined;
    var oldSecond = undefined;
    var newFirst = undefined;
    var newSecond = undefined;

    if (type === "currency") {
        if (history[updatedKey] != null && history[updatedKey].amount !== undefined) {
            oldFirst = history[updatedKey].amount;
        }
        if (history[updatedKey] != null && history[updatedKey].type !== undefined) {
            oldSecond = history[updatedKey].type.currency;
        }
    } else if (type === "duration") {

        if (history[updatedKey] != null && history[updatedKey].time !== undefined) {
            oldFirst = history[updatedKey].time;
        }
        if (history[updatedKey] != null && history[updatedKey].unit !== undefined) {
            oldSecond = history[updatedKey].unit;
        }
    } else if (type === "unit") {
        if (history[updatedKey] != null && history[updatedKey].quantity !== undefined) {
            oldFirst = history[updatedKey].quantity;
        }
        if (history[updatedKey] != null && history[updatedKey].unit !== undefined) {
            oldSecond = history[updatedKey].unit.unit;
        }
    }

    var valueToCheck = oldValues[updatedKey] !== undefined ? oldValues[updatedKey] : result[updatedKey];
    if (valueToCheck) {
        var oldSecondType = undefined;
        var oldFirstValue = undefined;
        if (type === "currency") {
            oldFirstValue = valueToCheck.amount;
            oldSecondType = valueToCheck.type ? valueToCheck.type.currency : undefined;
        } else if (type === "duration") {
            oldFirstValue = valueToCheck.time;
            oldSecondType = valueToCheck.unit;
        } else if (type === "unit") {
            oldFirstValue = valueToCheck.quantity;
            oldSecondType = valueToCheck.unit ? valueToCheck.unit.unit : undefined;
        }

        if (oldFirstValue != undefined) {
            newFirst = oldFirstValue;
            if (oldFirst === undefined) {
                oldFirst = oldFirstValue;
            }
        }
        if (oldSecondType != undefined) {
            newSecond = oldSecondType;
            if (oldSecond === undefined) {
                oldSecond = oldSecondType;
            }
        }
    }

    if (oldFirst && typeof oldFirst === "number" && type != "duration") {
        oldFirst = oldFirst.toFixed(2);
    }
    if (newFirst && type != "duration" && typeof newFirst === "number") {
        newFirst = newFirst.toFixed(2);
    }

    var oldFieldvalue = oldFirst + " " + oldSecond;
    if (oldFirst === null || oldSecond === null || oldSecond === undefined || oldFirst === undefined) {
        oldFieldvalue = null;
    }
    var newFieldValue = newFirst + " " + newSecond;
    if (newFirst === null || newSecond === null || newFirst === undefined || newSecond === undefined) {
        newFieldValue = null;
    }
    if (type === "currency") {
        oldValues[updatedKey] = {amount: oldFirst};
        if (oldSecond) {
            oldValues[updatedKey].type = {currency: oldSecond};
        }
    } else if (type === "duration") {
        oldValues[updatedKey] = {time: oldFirst};
        if (oldSecond) {
            oldValues[updatedKey].unit = oldSecond;
        }
    } else if (type === "unit") {
        oldValues[updatedKey] = {quantity: oldFirst};
        if (oldSecond) {
            oldValues[updatedKey].unit = {unit: oldSecond};
        }
    }

    return {oldFieldvalue: oldFieldvalue, newFieldValue: newFieldValue}
}


function handleFk(oldValues, updatedKey, result, fieldDef, history) {
    var newValue = oldValues[updatedKey] ? oldValues[updatedKey] : result[updatedKey];
    var newFieldValue = undefined;
    var oldFieldvalue = undefined;
    var updateValue = history[updatedKey];
    if (fieldDef.displayField) {
        var displayField = fieldDef.displayField;
        oldFieldvalue = updateValue[displayField];
        if (newValue) {
            newFieldValue = newValue[displayField];
        }
        oldValues[updatedKey] = updateValue;
    }
    return {oldFieldvalue: oldFieldvalue, newFieldValue: newFieldValue}
}


function handleMultipleObject(result, updatedKey, updateValue, fieldDef, oldValues, logs, users, db, options) {
    var fieldValue = result[updatedKey];
    for (var i = 0; i < updateValue.length; i++) {
        var nestedRecord = updateValue[i];
        var __type = nestedRecord.__type;
        var innerFields = fieldDef.fields;

        var updatedId = nestedRecord._id;
        var newResult = {};
        var newResultIndex = Utils.isExists(fieldValue, {_id: updatedId}, "_id");
        if (newResultIndex !== undefined) {
            newResult = fieldValue[newResultIndex];
        }
        oldValues[updatedKey] = oldValues[updatedKey] || {};
        oldValues[updatedKey][updatedId] = oldValues[updatedKey][updatedId] || {};
        var newOldValues = oldValues[updatedKey][updatedId];
        if (options.startMessage === undefined) {
            options.startMessage = "";
        }
        options.startMessage += "<b>" + fieldDef.label + "</b>";
        var primaryField = undefined;
        if (fieldDef.type === "fk") {
            if (fieldDef.displayField) {
                primaryField = {label: fieldDef.displayField, field: fieldDef.displayField};
            }
        } else {
            primaryField = getPrimaryField(innerFields);
        }
        if (primaryField) {
            options.startMessage += " (" + primaryField.label + ":" + (newResult[primaryField.field] || newOldValues[primaryField.field] || nestedRecord[primaryField.field]) + ")";
        } else if (newResultIndex !== undefined) {
            options.startMessage += " (" + newResultIndex + ")";
        }

        if (__type === "insert") {
            options.message = "added.";
            options.type = "Insert";
            addLog(logs, options);
            delete options.startMessage;
        } else if (__type === "update") {
            options.startMessage += "-->";
            delete nestedRecord.__type;
            populateHistoryUpdate(nestedRecord, innerFields, logs, users, newOldValues, newResult, db, options);
        } else if (__type === "delete") {
            for (var k in nestedRecord) {
                if (k !== "_id") {
                    newOldValues[k] = nestedRecord[k];
                }
            }
            options.message = "deleted.";
            options.type = "Delete";
            addLog(logs, options);
            delete options.startMessage;
        }
    }
}


function getPrimaryField(fields) {
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.primary) {
            return {field: field.field, label: field.label || field.field};
        }
    }
}

function addLog(logs, options) {
    var log = {};
    log.type = options.type;
    log.date = options.date;
    log.user = options.userName;
    if (options.startMessage) {
        log.message = options.startMessage + " ";
    } else {
        log.message = "";
    }
    log.message += options.message;
    delete options.message;
    delete options.type;
    logs.push(log);
}

function getUser(users, userId, db) {
    var d = Q.defer();
    if (!userId) {
        d.resolve();
        return d.promise;
    }
    if (users[userId]) {
        d.resolve(users[userId]);
        return d.promise;
    }
    return db.query({$collection: "pl.users", $filter: {_id: userId}, $events: false, $modules: false}).then(function (userResult) {
        userResult = userResult.result;
        if (userResult.length > 0) {
            var username = userResult[0].username;
            users[userId] = username;
            return username;
        }
    });
}

exports.showDeletedHistoryLogs = function (query, db, options) {
    if (!query.$parameters) {
        return;
    }
    var showDeletedHistoryLogs = query.$parameters.showDeletedHistoryLogs;
    if (showDeletedHistoryLogs) {
        var collection = query.$collection;
        var historyLogsQuery = {$collection: "pl.historylogs", $filter: {}};
        if (query.$filter) {
            historyLogsQuery.$filter = query.$filter;
        }
        if (query.$fields) {
            historyLogsQuery.$fields = query.$fields;
        }
        if (query.$limit) {
            historyLogsQuery.$limit = query.$limit;
        }
        if (query.$sort) {
            historyLogsQuery.$sort = query.$sort;
        }
        if (query.$skip) {
            historyLogsQuery.$skip = query.$skip;
        }
        historyLogsQuery.$filter.__collection = collection;
        return db.query(historyLogsQuery).then(function (historyLogsResult) {
            var result = historyLogsResult.result;
            var hasNext = historyLogsResult.dataInfo ? historyLogsResult.dataInfo.hasNext : undefined;
            query.$data = {result: result, hasNext: hasNext};
        })
    }
}

exports.restoreDeletedHistoryLogs = function (params, db) {
    if (!params || !params.collection) {
        throw new Error("Collection is mandatory in parameters.");
    }
    if (!params.filter && !params._id && !params.all) {
        throw new Error("Either filter or _id or all is mandatory in parameters");
    }
    var collection = params.collection;
    var historyLogsFilter = {};
    if (!params.all) {
        var filter = params.filter;
        if (filter) {
            if (typeof filter == "string"){
                filter = JSON.parse(filter);
            }
            for (var key in filter) {
                historyLogsFilter[key] = filter[key];
            }
        } else if (params._id) {
            var ids = params._id;
            if (!Array.isArray(ids)) {
                ids = [ids];
            }
            historyLogsFilter._id = {$in: ids};
        }
    }
    historyLogsFilter.__collection = collection;
    return db.query({$collection: "pl.historylogs", $filter: historyLogsFilter}).then(function (result) {
        result = result.result;
        if (result && result.length > 0) {
            var ids = [];
            for (var i = 0; i < result.length; i++) {
                delete result[i].__collection;
                ids.push({_id: result[i]._id});
            }
            return db.update([
                {$collection: collection, $insert: result},
                {$collection: "pl.historylogs", $delete: ids}
            ]);
        }
    })
}
