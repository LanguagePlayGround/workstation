/**
 * Created by Administrator on 6/17/14.
 */
var Constants = require("./Constants.js");
var Utility = require("ApplaneCore/apputil/util.js");
var SELF = require("./QueryHandler.js");
var ModuleManager = require("./ModuleManager.js");
var Q = require("q");
var DBRef = require("../lib/modules/DBRef.js");


exports.check$query = function (updates, main, collection, fields) {
    if (!updates) {
        return;
    } else if (Array.isArray(updates)) {
        for (var i = 0; i < updates.length; i++) {
            SELF.check$query(updates[i], main, collection, fields);
        }

    } else if (Utility.isJSONObject(updates)) {
        for (var k in updates) {
            if (k == "$query") {
                throw new Error("$query can not be encounter" + JSON.stringify(main) + ">>collection>>>" + collection + ">>fields>>>" + JSON.stringify(fields))
            } else {
                SELF.check$query(updates[k], main, collection, fields);
            }
        }
    }
}

exports.remove$Query = function (document, db, options) {
    return remove$QueryFromArray(db, document.updates, document.oldRecord, options.fields, options).then(
        function () {
            return handleFk(document.updates, document.oldRecord, document.collection, db, options.fields, options);
        }).then(function () {
            SELF.check$query(document.updates, document.updates, document.collection, options.fields);
        });
}

function remove$QueryFromArray(db, updates, oldData, fields, options) {
    if (!updates) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var newUpdates = updates.$set || updates.$unset || updates.$inc ? (updates.$set ? updates.$set : {}) : updates;
    if (!Utility.isJSONObject(newUpdates)) {
        throw new Error("Updates must be a JSONObject but found [ " + JSON.stringify(newUpdates) + " ] with db >>" + db.db.databaseName + ">>>oldData>>" + JSON.stringify(oldData) + ">>>fields>>" + JSON.stringify(fields));
    }
    var keys = Object.keys(newUpdates);
    return Utility.iterateArrayWithPromise(keys, function (index, key) {
        var fieldInfo = Utility.getField(key, fields);
        if (fieldInfo && fieldInfo.type === Constants.Admin.Fields.Type.OBJECT) {
            var old = oldData ? oldData[key] : {};
            if (fieldInfo.multiple) {
                var newFields = undefined;
                handleArray(db, newUpdates[key], old, fieldInfo.fields); // remove $query from array and then iterate the deliveries array with field def from delivery collection
                if (fieldInfo.query) {
                    return getFields(db, fieldInfo).then(function (fields) {
                        newFields = fields;
                        if (fieldInfo.fk) {
                            checkFkField(newFields, fieldInfo.fk, newUpdates);
                        }
                        var updatesArray = prepare(newUpdates[key]);
                        return Utility.iterateArrayWithPromise(updatesArray, function (index, row) {
                            var oldRow = getOldRow(row, old);
                            return  remove$QueryFromArray(db, row.row, oldRow, newFields, options);
                        })
                    });
                }
            } else {
                return remove$QueryFromArray(db, newUpdates[key], old, fieldInfo.fields);
            }
        }
    });
}
function getOldRow(row, old) {
    var oldRow = {};
    if (row && row.type !== "insert") {
        oldRow = getOld(row.row, old);
    }
    return oldRow;
}
function handleFk(updates, oldRecord, mainCollection, db, fields, options, pExp) {
    if (updates === undefined || !ModuleManager.isModuleRequired(options.$modules, {name:"DBRef"})) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var newUpdates = updates.$set || updates.$unset || updates.$inc ? (updates.$set ? updates.$set : {}) : updates;
    var keys = Object.keys(newUpdates);
    return Utility.iterateArrayWithPromise(keys, function (index, key) {
        var value = newUpdates[key];
        if (!value) {
            return;
        }
        var fieldInfo = Utility.getField(key, fields);
        if (!fieldInfo) {
            return;
        }
        var mainField = pExp ? pExp + "." + fieldInfo.field : fieldInfo.field;
        var old = oldRecord ? oldRecord[key] : {};
        if (fieldInfo.type === Constants.Admin.Fields.Type.OBJECT && fieldInfo.multiple === true) {
            var newFields = undefined;
            return getFields(db, fieldInfo).then(function (fields) {
                newFields = fields;
                var valArray = prepare(value);
                return Utility.iterateArrayWithPromise(valArray, function (index, row) {
                    var oldRow = getOldRow(row, old);
                    return handleFk(row.row, oldRow, mainCollection, db, newFields, options, mainField);
                });
            });
        } else if (fieldInfo.type === Constants.Admin.Fields.Type.OBJECT || fieldInfo.type === Constants.Admin.Fields.Type.CURRENCY || fieldInfo.type === Constants.Admin.Fields.Type.UNIT) {
            return handleFk(value, oldRecord ? oldRecord[key] : null, mainCollection, db, fieldInfo.fields, options, mainField);
        } else if (fieldInfo.type === Constants.Admin.Fields.Type.FK && fieldInfo.multiple === true) {
            var valArray = prepare(value);
            return Utility.iterateArrayWithPromise(valArray, function (index, row) {
                var oldRow = getOldRow(row, old);
                return DBRef.onValueChange(row.row, oldRow, db, {updatedFieldInfo:fieldInfo, $modules:options.$modules, $events:options.$events, collectionName:mainCollection, field:mainField});
            })
        } else if (fieldInfo.type === Constants.Admin.Fields.Type.FK) {
            return DBRef.onValueChange(value, old, db, {updatedFieldInfo:fieldInfo, $modules:options.$modules, $events:options.$events, collectionName:mainCollection, field:mainField});
        }
    })
}

function prepare(value) {
    var valArray = [];
    if (value && (value.$insert || value.$update || value.$delete)) {
        populateArray(value.$insert, valArray, "insert");
        populateArray(value.$update, valArray, "update");
        populateArray(value.$delete, valArray, "delete");
    } else {
        var length = value ? value.length : 0;
        for (var i = 0; i < length; i++) {
            valArray.push({row:value[i], type:"insert"})
        }
    }
    return valArray;
}

function iterateArray(db, updates, oldData, fields) {
    var length = updates ? updates.length : 0;
    for (var i = 0; i < length; i++) {
        if (updates[i].$query) {
            removeQuery(updates[i], oldData, updates);
        }
        var oldDataLength = oldData ? oldData.length : 0;
        for (var j = 0; j < oldDataLength; j++) {
            if (Utility.evaluateFilter({_id:updates[i]._id}, oldData[j])) {
                var newUpdates = updates[i].$set || updates[i].$unset || updates[i].$inc ? updates[i].$set : updates[i];
                remove$QueryFromArray(db, newUpdates, oldData[j], fields);
            }
        }
    }
}

function handleArray(db, updates, oldData, fields) {
    if (updates && (updates.$delete || updates.$update)) {
        if (updates.$update) {
            iterateArray(db, updates.$update, oldData, fields);
        }
        if (updates.$delete) {
            iterateArray(db, updates.$delete, oldData, fields);
        }
    }
}

function removeQuery(updatesObject, oldData, updatesArray) {
    var query = updatesObject.$query;
    var matched = false;
    for (var i = 0; i < oldData.length; i++) {
        if (Utility.evaluateFilter(query, oldData[i])) {
            if (matched) {
                var cloneObject = require("./Utility.js").deepClone(updatesObject);
                cloneObject._id = oldData[i]._id;
                updatesArray.push(cloneObject);
            } else {
                delete updatesObject.$query;
                updatesObject._id = oldData[i]._id;
                matched = true;
            }
        }
    }
    if (!matched) {
        var error = new Error("No record found corresponding  to this query[" + JSON.stringify(updatesObject.$query) + "] with oldData");
        error.detailMessage = "No record found corresponding  to this query[" + JSON.stringify(updatesObject.$query) + "] with oldData>>>>>>>>>" + JSON.stringify(oldData);
        throw error;
    }
}

function getOld(update, oldData) {
    var matched = false;
    var length = oldData ? oldData.length : 0;
    for (var i = 0; i < length; i++) {
        var filter = {}
        if (update.$query) {
            filter = update.$query;
        } else {
            filter._id = update._id;
        }
        if (Utility.evaluateFilter(filter, oldData[i])) {
            return oldData[i];
            matched = true;
            break;
        }
    }
    if (!matched && length > 0) {
        var error = new Error("Update  [" + JSON.stringify(update) + "] not matched with old data");
        error.detailMessage = "Update  [" + JSON.stringify(update) + "] not matched with old data[" + JSON.stringify(oldData) + "]";
        throw error;
    }
}

function populateArray(value, newValue, type) {
    var length = value ? value.length : 0;
    for (var i = 0; i < length; i++) {
        newValue.push({row:value[i], type:type});
    }
}


function getFields(db, fieldInfo) {
    var d = Q.defer();
    var fieldQuery = undefined;
    if (fieldInfo && fieldInfo.query) {
        fieldQuery = JSON.parse(fieldInfo.query);
    }

    if (fieldQuery && fieldQuery.$type == "child") {
        var subQuery = fieldQuery.$query;
        var collection = subQuery.$collection;
        db.collection(collection).then(
            function (collectionObject) {
                var fields = collectionObject.getValue("fields");
                d.resolve(fields);
            }).fail(function (err) {
                d.reject(err);
            });
    } else {
        var fields = fieldInfo ? fieldInfo.fields : [];
        d.resolve(fields);
    }
    return d.promise;
}

function checkFkField(fields, fkField, updates) {
    var fieldInfo = Utility.getField(fkField, fields);
    if (fieldInfo && fieldInfo.upsert === true) {
        throw new Error("Child Saving with upsert true is not allowed for field [ " + fkField + "]with updates" + JSON.stringify(updates));
    }
}