/**
 *
 *   recursion  --> used for group by in fk column (use case invoices, recursive group by on account_owner) : By Sachin Bansal 15-11-2014
 *
 * */
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require('q');
var Constants = require("ApplaneDB/lib/Constants.js");
var Utility = require("./Utility.js");
var CacheService = require("ApplaneDB/lib/CacheService.js");

exports.onPreSave = function (document, db, options) {
    var indexValue = document.get("index");
    if (indexValue === undefined || indexValue === null) {
        document.set("index", 0);
    }
    indexValue = document.get("indexGrid");
    if (indexValue === undefined || indexValue === null) {
        document.set("indexGrid", 0);
    }
    indexValue = document.get("indexForm");
    if (indexValue === undefined || indexValue === null) {
        document.set("indexForm", 0);
    }
    var updatedFields = document.getUpdatedFields();
    if (updatedFields && updatedFields.length > 0 && updatedFields.indexOf("mandatory") >= 0) {
        document.set("uiMandatory", document.get("mandatory"));
    }

    var collection = document.type === "delete" ? document.getOld("collectionid") : document.get("collectionid");
    return validateUpdateInFieldOrType(document, db, options).then(
        function () {
//            if (document.type === "delete" && document.getOld("parentCollection") && document.getOld("mainTableId")) {
//                throw new Error("Field can not be deleted in fields in db [" + db.db.databaseName + "] which is created in parent Collection having document [" + JSON.stringify(document) + "]");
//            }
        }).then(
        function () {
            return validateField(document, db);
        }).then(
        function () {
            return Utility.updateLocalData(collection._id, collection.collection, db, "pl.collections", options);
        }).then(function () {
            // when a field of type object and multiple and query is defined and query.$type === child then we set the childCollection property in the field.
            return setChildCollection(document);
        }).then(function () {
            //  update the collection data with newly set fields ....
            if (document.type === "update" && updatedFields && updatedFields.indexOf("set") >= 0) {
                return getDottedField(document.get("field"), document.get("parentfieldid"), db).then(function (dottedField) {
                    var setFieldParams = {collection: collection.collection, dbs: [db.db.databaseName], fields: [dottedField]};
                    return db.invokeFunction("Porting.repopulateSetFieldsAsync", [setFieldParams])
                })
            }
        })
}

function getDottedField(field, parentField, db) {
    if (parentField) {
        return db.query({$collection: "pl.fields", $fields: {field: 1, parentfieldid: 1}, $filter: {_id: parentField._id}}).then(function (result) {
            var record = result.result[0];
            return getDottedField((record.field + "." + field), record.parentfieldid, db);
        })
    } else {
        var d = Q.defer();
        d.resolve(field);
        return d.promise;
    }

}

function validateUpdateInFieldOrType(document, db, options) {
    var updatedFields = document.getUpdatedFields();
    if (db.isGlobalDB() || document.type !== "update" || !updatedFields || updatedFields.length === 0) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var updateField = false;
    var updateType = false;
    if (updatedFields.indexOf(Constants.Admin.Fields.FIELD) !== -1) {
        updateField = true;
    }
    if (updatedFields.indexOf(Constants.Admin.Fields.TYPE) !== -1) {
        var newType = document.get(Constants.Admin.Fields.TYPE);
        var oldType = document.getOld(Constants.Admin.Fields.TYPE);
        if (newType !== oldType && (newType === "currency" || newType === "duration" || newType === "unit" || oldType === "currency" || oldType === "duration" || oldType === "unit")) {
            updateType = true;
        }
    }
    if (!updateField && !updateType) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    return db.getAdminDB().then(function (adminDB) {
        return adminDB.query({$collection: "pl.dbs", $fields: {admindb: 1}, $filter: {db: db.db.databaseName}, $events: false, $modules: false}).then(function (result) {
            var commitDB = result.result[0].admindb;
            return getFieldCreatedDB(document.get("_id"), db).then(function (fieldCreatedDB) {
                var fieldCreatedDBName = fieldCreatedDB.db.databaseName;
                if (fieldCreatedDBName === db.db.databaseName || (commitDB && fieldCreatedDBName === commitDB)) {
                    return;
                }
                if (updateField) {
                    throw new Error("Field can not be updated in fields in db [" + db.db.databaseName + "] which is created in db [" + fieldCreatedDBName + "] having document [" + JSON.stringify(document) + "]");
                }
                if (updateType) {
                    throw new Error("Type can not be updated in fields in db [" + db.db.databaseName + "] which is created in db [" + fieldCreatedDBName + "]for [currency/duration/unit] having document [" + JSON.stringify(document) + "]");
                }
            })
        })
    })
}

function getFieldCreatedDB(fieldId, db) {
    var globalDB = undefined;
    return db.getGlobalDB().then(
        function (gdb) {
            globalDB = gdb;
            if (globalDB) {
                return getFieldCreatedDB(fieldId, globalDB);
            }
        }).then(function (createdDB) {
            if (createdDB) {
                return createdDB;
            } else {
                return db.query({$collection: "pl.fields", $filter: {_id: fieldId}, $events: false, $modules: false}).then(function (result) {
                    if (result.result.length > 0) {
                        return db;
                    }
                })
            }
        })
}

function setChildCollection(document) {
    var type = document.get(Constants.Admin.Fields.TYPE);
    var multiple = document.get(Constants.Admin.Fields.MULTIPLE);
    var query = document.get(Constants.Admin.Fields.QUERY);
    if (document.type === "insert") {
        if (type == Constants.Admin.Fields.Type.OBJECT && multiple && query) {
            if (typeof query === "string") {
                query = JSON.parse(query);
            }
            if (query.$type === "child") {
                var childQuery = query.$query;
                var childCollection = childQuery.$collection;
                document.set("childCollection", childCollection);
            }
        }
    } else if (document.type === "update") {
        if (type === Constants.Admin.Fields.Type.OBJECT && multiple) {
            var oldQuery = document.getOld(Constants.Admin.Fields.QUERY);
            var newQuery = document.get(Constants.Admin.Fields.QUERY);
            if (oldQuery && typeof oldQuery === "string") {
                oldQuery = JSON.parse(oldQuery);
            }
            if (newQuery && typeof newQuery === "string") {
                newQuery = JSON.parse(newQuery);
            }
            if (oldQuery && oldQuery.$type === "child" && newQuery && newQuery.$type === "child") {
                var oldCollectionName = oldQuery.$query && oldQuery.$query.$collection ? oldQuery.$query.$collection : undefined;
                var newCollectionName = newQuery.$query && newQuery.$query.$collection ? newQuery.$query.$collection : undefined;
                if (oldCollectionName !== newCollectionName && newCollectionName) {
                    document.set("childCollection", newCollectionName);
                }
            }
        }
    }
}

function validateSetField(set, fieldToValidate, referredCollectionFields, prevPartWithId, db) {
    var indexOf = fieldToValidate.indexOf(".");
    if (indexOf >= 0) {
        var firstPart = fieldToValidate.substring(0, indexOf);
        var nextPart = fieldToValidate.substring(indexOf + 1);
        var fieldDef = Utils.getField(firstPart, referredCollectionFields);
        if (fieldDef) {
            if (fieldDef.type === "object") {
                throw new Error("Object type column [" + firstPart + "] can not be defined in set fields.SetFields defined " + JSON.stringify(set));
            } else if (fieldDef.type === "fk") {
                return validateCollection(db, fieldDef.collection).then(
                    function (collectionInfo) {
                        if (collectionInfo.result.length > 0) {
                            return getFields(db, collectionInfo.result[0]._id);
                        }
                    }).then(function (fields) {
                        return validateSetField(set, nextPart, fields, prevPartWithId, db);
                    })
            }
        } else {
            throw new Error("FieldInfo not found for field [" + firstPart + "] which is defined in setField " + JSON.stringify(set));
        }
    } else {
        if (prevPartWithId) {
            var fieldDef = Utils.getField(fieldToValidate, referredCollectionFields);
            if (fieldDef) {
                if (fieldDef.type === "fk" && Utils.isExists(set, prevPartWithId) === undefined) {
                    throw new Error("field [" + prevPartWithId + "] must be defined in set field if fk column.SetFields defined " + JSON.stringify(set));
                } else if (fieldDef.type === "object") {
                    throw new Error("Object type column can not be defined in set fields.SetFields defined " + JSON.stringify(set));
                }
            } else {
                throw new Error("FieldInfo not found for field [" + fieldToValidate + "] which is defined in setField " + JSON.stringify(set));
            }
        }
    }
}

function validateField(document, db) {
    if (document.type === "delete") {
        return;
    }
    if (!document.get(Constants.Admin.Fields.COLLECTION_ID)) {
        throw new Error("Collection id not found in Field saving >>>>" + JSON.stringify(document));
    }
    var type = document.get(Constants.Admin.Fields.TYPE);
    if (!type) {
        throw new Error("Type not found in Field saving >>>>" + JSON.stringify(document));
    }
    var field = document.get("field");
    if (!field || !field.trim()) {
        throw new Error("field not found in Field saving >>>>" + JSON.stringify(document));
    }
    if (field.indexOf(" ") !== -1) {
        field = field.trim();
        if (field.indexOf(" ") !== -1) {
            throw new Error("Blank space is not allowed in field [" + field + "] in collection [" + document.get("collectionid").collection + "]");
        } else {
            document.set("field", field);
        }
    }
    var toLowerCase = document.get(Constants.Admin.Fields.TO_LOWER_CASE);
    if (toLowerCase) {
        if (type !== Constants.Admin.Fields.Type.STRING && type !== Constants.Admin.Fields.Type.SEQUENCE) {
            var collectionName = document.get(Constants.Admin.Fields.COLLECTION);
            throw new Error("To Lower Case cannot be defined for column  type [" + type + "] in [" + collectionName + "] ");
        }
    }

    if (type === Constants.Admin.Fields.Type.FK) {
        var collectionName = document.get(Constants.Admin.Fields.COLLECTION);
        var fieldsToCheck = [];
        if (collectionName === undefined) {
            throw new Error("Collection not found for field [" + field + "] of type FK");
        }
        var referredCollectionFields = [];
        return validateCollection(db, collectionName).then(
            function (collectionData) {
                if (collectionData.result.length === 1) {
                    var collectionId = collectionData.result[0]._id;
                    return getFields(db, collectionId).then(function (fields) {
                        referredCollectionFields = fields;
                        var displayField = document.get("displayField");
                        if (displayField) {
                            if (fieldsToCheck.indexOf(displayField) === -1) {
                                fieldsToCheck.push(displayField);
                            }
                        }

                        var set = document.updates.set || [];
                        return Utils.iterateArrayWithPromise(set, function (index, fieldToSet) {
                            fieldsToCheck.push(fieldToSet);
                            var lastIndexOfDot = fieldToSet.lastIndexOf(".");
                            var fieldToValidate = lastIndexOfDot === -1 ? fieldToSet : fieldToSet.substring(0, lastIndexOfDot);
                            var prevPartWithId = fieldToValidate === fieldToSet ? undefined : fieldToValidate + "._id";
                            return validateSetField(set, fieldToValidate, referredCollectionFields, prevPartWithId, db);
                        })
                    })
                } else {
                    throw (new Error("None or more than one result found for collection[" + collectionName + "] for column of type FK [" + JSON.stringify(document) + "]"));
                }
            }).then(function () {
                return  Utils.iterateArrayWithPromise(fieldsToCheck, function (index, fieldToCheck) {
                    var indexOfDot = fieldToCheck.indexOf(".");
                    if (indexOfDot !== -1) {
                        return validateDottedFields(db, collectionName, referredCollectionFields, fieldToCheck);
                    } else {
                        return validateSimpleField(collectionName, referredCollectionFields, fieldToCheck);
                    }
                })
            });
    } else if (document.get("ui") === "radio") {
        var radioOptions = document.get("radioOptions");
        if (!radioOptions || radioOptions.length === 0) {
            throw new Error("Radio Options is mandatory when ui is radio.");
        }
    } else {
        if (document.get(Constants.Admin.Fields.QUERY)) {
            var query = document.get(Constants.Admin.Fields.QUERY);
            var afterParsing = undefined;
            afterParsing = JSON.parse(query);
            if (afterParsing.$sort) {
                throw new Error("$sort can not defined in Query.Field defined [" + JSON.stringify(document) + "]");
            }
            var queryType = afterParsing.$type;
            if (type !== Constants.Admin.Fields.Type.OBJECT) {
                throw new Error("Field [" + field + "] must be object when query id defined>>>>" + JSON.stringify(document));
            }
            if (type === Constants.Admin.Fields.Type.OBJECT) {
                var multiple = document.get(Constants.Admin.Fields.MULTIPLE);
                if ((!multiple) && queryType == "child") {
                    throw new Error("multiple must be true for [" + field + "] when query is defined in collection [" + document.get("collectionid").collection + "]");
                }
            } else {
                throw new Error("field [" + field + "] must be object when query is defined");
            }
        } else if (document.get("ui") === "grid" || document.get("uiGrid") === "grid" || document.get("uiForm") === "grid") {
            if (type === (Constants.Admin.Fields.Type.OBJECT)) {
                if (!document.get(Constants.Admin.Fields.MULTIPLE)) {
                    throw new Error("Multiple must be true for field [" + field + "] in collection [" + document.get("collectionid").collection + "]");
                }
            } else {
                throw new Error("field [" + field + "] must be object");
            }
        } else if (type === Constants.Admin.Fields.Type.SEQUENCE) {
            var parentfieldid = document.get(Constants.Admin.Fields.PARENT_FIELD_ID);
            if (parentfieldid !== undefined) {
                throw new Error("Sequence Type Field [" + document.get(Constants.Admin.Fields.FIELD) + "] must not have any parentfieldid  [ " + parentfieldid[Constants.Admin.Fields.FIELD] + " ]")
            }
            var collectionId = document.get(Constants.Admin.Fields.COLLECTION_ID);
            var query = {};
            query[Constants.Query.COLLECTION] = "pl.fields";
            var filter = {};
            filter[Constants.Admin.Fields.COLLECTION_ID] = collectionId;
            filter[Constants.Admin.Fields.TYPE] = "sequence";
            query[Constants.Query.FILTER] = filter;
            return  db.query(query).then(function (data) {
                if (data && data.result && data.result.length > 1) {
                    throw new Error("More than one Sequence Type field cannot be defined in a collection" + ">>doc>>>" + JSON.stringify(document));
                }
            });
        }
    }
}

function validateCollection(db, collection) {
    var query = {};
    query[Constants.Query.COLLECTION] = "pl.collections";
    var filter = {};
    filter[Constants.Admin.Fields.COLLECTION] = collection;
    query[Constants.Query.FILTER] = filter;
    return db.query(query);
}

function validateDottedFields(db, collectionName, fields, fieldToCheck) {
    var dotIndex = fieldToCheck.indexOf(".");
    var firstPart = fieldToCheck.substring(0, dotIndex);
    var fieldDef = Utils.getField(firstPart, fields);
    if (!fieldDef || (fieldDef.type !== Constants.Admin.Fields.Type.OBJECT && fieldDef.type !== Constants.Admin.Fields.Type.FK)) {
        throw new Error("Field [" + fieldToCheck + "] not found in collection [" + collectionName + "]");
    }
    var secondPart = fieldToCheck.substring(dotIndex + 1);
    if (fieldDef.type == Constants.Admin.Fields.Type.OBJECT) {
        if (secondPart.indexOf(".") !== -1) {
            return validateDottedFields(db, collectionName, fieldDef.fields, secondPart);
        } else {
            return validateSimpleField(collectionName, fieldDef.fields, secondPart);
        }
    } else if (fieldDef.type === Constants.Admin.Fields.Type.FK) {
        var fkCollectionName = fieldDef[Constants.Admin.Fields.COLLECTION];
        return validateCollection(db, fkCollectionName).then(
            function (collectionData) {
                var collectionId = collectionData.result[0]._id;
                return getFields(db, collectionId);
            }).then(function (fkCollectionFields) {
                if (secondPart.indexOf(".") !== -1) {
                    return validateDottedFields(db, fkCollectionName, fkCollectionFields, secondPart);
                } else {
                    return validateSimpleField(fkCollectionName, fkCollectionFields, secondPart);
                }
            })
    }
}

function validateSimpleField(collectionName, fields, fieldToCheck) {
    if (fieldToCheck === "_id") {
        return;
    }
    if (Utils.isExists(fields, {field: fieldToCheck}, "field") === undefined) {
        throw new Error("field [" + fieldToCheck + "] not found in collection [" + collectionName + "]");
    }
}

function getFields(db, collectionId) {
    var query = {};
    query[Constants.Query.COLLECTION] = "pl.fields";
    var filter = {};
    filter[Constants.Admin.Fields.COLLECTION_ID] = collectionId;
    filter[Constants.Admin.Fields.PARENT_FIELD_ID] = null;
    var recursion = {};
    recursion[Constants.Admin.Fields.PARENT_FIELD_ID] = "_id";
    recursion[Constants.Query.Recursion.ALIAS] = "fields";
    query[Constants.Query.FILTER] = filter;
    query[Constants.Query.RECURSION] = recursion;
    return db.query(query).then(function (result) {
        return result.result;
    });
}

exports.onPostSave = function (document, db, options) {
    var collection = document.type === "delete" ? document.getOld("collectionid") : document.get("collectionid");
    return CacheService.clearCache(collection._id, db, true).then(
        function () {
            return deleteChildFields(collection._id, document, db);
        }).then(
        function () {
            if (!document.get("__child__") && !document.get("nonPersistent") && (document.get(Constants.Admin.Fields.TYPE) === Constants.Admin.Fields.Type.FK || document.getOld(Constants.Admin.Fields.TYPE) === Constants.Admin.Fields.Type.FK)) {
                return require("./ReferredFks.js").repopulateReferredFks({collection: collection.collection}, db);
            }
        }).then(
        function () {
            return addUDTColumns(document, db);
        }).then(
        function () {
            // when a field of type object and multiple and query is defined and query.$type is child
            //then we save  the child fields defined in the query  or all the fields if no fields are defined.
            // if the child fields contains another child field then we pass a variable  __child__ to stop the job and also not to populate the referred fks.
            return populateChildFields(document, db, options);
        }).then(
        function () {
            if (document.type === "update") {
                // when the field exp changes change the parentfieldid.field in its child fields.
                return changeChildFieldExp(document, db, options);
            }
        }).then(
        function () {
            return Utility.updateAppLock(collection.collection, "pl.collections", db, options);
        })
}

function changeChildFieldExp(document, db, options) {
    var _id = document.get("_id");
    var collectionDoc = document.getDocuments("collectionid");
    var updatedFields = document.getUpdatedFields();
    if (updatedFields.indexOf("field") >= 0) {
        return db.query({$collection: "pl.fields", $filter: {"parentfieldid._id": _id, "collectionid._id": collectionDoc.get("_id")}}).then(function (childFields) {
            if (childFields && childFields.result && childFields.result.length > 0) {
                var updates = [];
                for (var i = 0; i < childFields.result.length; i++) {
                    var field = childFields.result[i];
                    updates.push({_id: field._id, $set: {"parentfieldid": {_id: _id, field: document.get("field")}}});
                }
                if (updates && updates.length > 0) {
                    return db.update({$collection: "pl.fields", $update: updates, $applock: false});
                }
            }
        });
    }
}

function populateChildFields(document, db, options) {
    var type = document.get(Constants.Admin.Fields.TYPE);
    var multiple = document.get(Constants.Admin.Fields.MULTIPLE);
    if (document.type === "insert") {
        var query = document.get(Constants.Admin.Fields.QUERY);
        var collectionid = document.get(Constants.Admin.Fields.COLLECTION_ID);
        var isChild = document.get("__child__");
        if (type == Constants.Admin.Fields.Type.OBJECT && multiple && query && !(isChild)) {
            if (typeof query === "string") {
                query = JSON.parse(query);
            }
            if (query.$type === "child") {
                return populateChildFieldInner(document.get("_id"), db);
            }
        }
    } else if (document.type === "update") {
        // if the query.$type changes from child to any other then we have to remove the columns already present and if the new type is child the we populate the child fields
        // if the collection name inside the query field is changed then we  delete the fields of oldCollection and sync the fields according to new collection.
        var docid = document.get("_id");
        var collectionid = document.get(Constants.Admin.Fields.COLLECTION_ID);
        if (type === Constants.Admin.Fields.Type.OBJECT && multiple) {
            var oldQuery = document.getOld(Constants.Admin.Fields.QUERY);
            var newQuery = document.get(Constants.Admin.Fields.QUERY);
            if (oldQuery && typeof oldQuery === "string") {
                oldQuery = JSON.parse(oldQuery);
            }
            if (newQuery && typeof newQuery === "string") {
                newQuery = JSON.parse(newQuery);
            }
            var oldType = oldQuery ? oldQuery.$type : undefined;
            var newType = newQuery ? newQuery.$type : undefined;
            if ((oldType === "child" && newType !== "child") || (oldType !== "child" && newType === "child")) {
                return db.update({$collection: Constants.Admin.FIELDS, $delete: {$query: {"collectionid._id": collectionid._id, parentfieldid: docid}}, $applock: false}).then(function () {
                    if (newType === "child") {
                        return populateChildFieldInner(docid, db);
                    }
                });
            } else if (oldQuery && oldQuery.$type === "child" && newQuery && newQuery.$type === "child") {
                var oldCollectionName = oldQuery.$query && oldQuery.$query.$collection ? oldQuery.$query.$collection : undefined;
                var newCollectionName = newQuery.$query && newQuery.$query.$collection ? newQuery.$query.$collection : undefined;
                if (oldCollectionName !== newCollectionName) {
                    return db.update({$collection: Constants.Admin.FIELDS, $delete: {$query: {"collectionid._id": collectionid._id, parentfieldid: docid}}, $applock: false}).then(
                        function () {
                            return populateChildFieldInner(docid, db);
                        })
                }
            }
        }
    }
}

function populateChildFieldInner(_id, db) {
    return db.query({$collection: Constants.Admin.FIELDS, $filter: {  "_id": _id}}).then(function (data) {
        if (data && data.result && data.result.length > 0) {
            // synch child fields handles the synching work by matching the fields already present with the required fields
            // and if a field is required and is not present then it is inserted
            // and if a field is not required and is present then it is deleted.
            return synchChildFieldsInner(data.result[0], db, false);
        }
    })
}

// From the action provided on collection to synch the child fields
exports.synchChild = function (parameters, db, options) {
    var collectionName = parameters.collection;
    if (collectionName) {
        return db.query({$collection: Constants.Admin.FIELDS, $filter: {"collectionid.collection": collectionName, "parentfieldid": null}, "$recursion": {"parentfieldid": "_id", "$alias": "fields"}}).then(function (childFields) {
            if (childFields && childFields.result && childFields.result.length > 0) {
                return synchChildFields(childFields.result, db);
            }
        });
    }

    function synchChildFields(childFields, db) {
        return Utils.iterateArrayWithPromise(childFields, function (index, childField) {
            if (childField.childCollection !== undefined) {
                return synchChildFieldsInner(childField, db, true);
            } else if (childField.fields && childField.fields.length > 0) {
                return synchChildFields(childField.fields, db);
            }
        })
    }
}

function synchChildFieldsInner(childField, db, applock) {
    // we have to sync a field i.e we have to compare the required columns with the existing columns and do insert/delete and we will not update  and __system__ columns are populated by the job itself.
    var query = childField.query;
    var requiredChildFields = undefined;
    var fieldsToBeInserted = [];
    var fieldsToBeDeleted = [];
    if (typeof query === "string") {
        query = JSON.parse(query);
    }
    var childQuery = query.$query;
    return db.query({$collection: Constants.Admin.FIELDS, $filter: {"parentfieldid": null, "collectionid.collection": childQuery.$collection}, $recursion: {"parentfieldid": "_id", $alias: "fields"}}).then(
        function (childFieldsResult) {
            if (childFieldsResult && childFieldsResult.result && childFieldsResult.result.length > 0) {
                childFieldsResult = childFieldsResult.result;
            }
            requiredChildFields = childFieldsResult;
            if (childQuery.$fields && Object.keys(childQuery.$fields).length > 0) {
                requiredChildFields = populateNewChildFields(childQuery, childFieldsResult);
            }
            if (requiredChildFields && requiredChildFields.length > 0) {
                return checkChildFieldsToBeInserted(requiredChildFields, childField.fields, fieldsToBeInserted);
            }
        }).then(
        function () {
            if (requiredChildFields && requiredChildFields.length > 0) {
                return checkChildFieldsToBeDeleted(requiredChildFields, childField.fields, fieldsToBeDeleted);
            }
        }).then(
        function () {
            var newFields = [];
            // modifychildfieldproperties will modify the visibility,visibilityGrid and visibilityForm properties according to the childField which we are synching.
            modifyChildFieldProperties(fieldsToBeInserted, childField.collectionid, childField.field, childField.field, childField.visibility, childField.visibilityForm, childField.visibilityGrid, false, newFields);
            if (newFields.length > 0) {
                return db.update({$collection: Constants.Admin.FIELDS, $insert: newFields, $applock: applock});
            }
        }).then(function () {
            var newFields = [];
            populateFieldsIdsToBeDeleted(fieldsToBeDeleted, newFields);
            if (newFields.length > 0) {
                return db.update({$collection: Constants.Admin.FIELDS, $delete: newFields, $applock: applock});
            }
        });

    function populateFieldsIdsToBeDeleted(fieldsToBeDeleted, newFields) {
        for (var i = 0; i < fieldsToBeDeleted.length; i++) {
            var field = fieldsToBeDeleted[i];
            newFields.push({_id: field._id});
        }
        return newFields;
    }

    function checkChildFieldsToBeDeleted(requiredChildFields, existingChildFields, fieldsToBeDeleted) {
        return Utils.iterateArrayWithPromise(existingChildFields, function (index, existingChildField) {
            var index = Utils.isExists(requiredChildFields, existingChildField, "field");
            if (index !== undefined) {
                if (existingChildField.fields && existingChildField.fields.length > 0) {
                    return checkChildFieldsToBeDeleted(requiredChildFields[index].fields, existingChildField.fields, fieldsToBeDeleted);
                }
            } else {
                fieldsToBeDeleted.push(existingChildField);
            }

        });
    }

    function checkChildFieldsToBeInserted(requiredChildFields, existingChildFields, fieldsToBeInserted, parentExp) {
        return Utils.iterateArrayWithPromise(requiredChildFields, function (index, requiredChildField) {
            var index = Utils.isExists(existingChildFields, requiredChildField, "field");
            if (index !== undefined) {
                if (requiredChildField.fields && requiredChildField.fields.length > 0) {
                    return checkChildFieldsToBeInserted(requiredChildField.fields, existingChildFields[index].fields, fieldsToBeInserted, requiredChildField.field);
                }
            } else {
                if (parentExp) {
                    requiredChildField.parentExp = parentExp;
                }
                fieldsToBeInserted.push(requiredChildField);
            }
        })
    }

    function modifyChildFieldProperties(childFieldsResult, collectionid, childFieldExp, parentFieldExp, visibility, visibilityForm, visibilityGrid, ischild, newFields) {
        for (var i = 0; i < childFieldsResult.length; i++) {
            var childField = childFieldsResult[i];
            if (childField.__system__) {
                continue;
            }
            childField.collectionid = collectionid;
            childField.visibility = visibility;
            childField.visibilityForm = visibilityForm;
            childField.visibilityGrid = visibilityGrid;
            delete childField._id;
            delete childField.ftsEnable;
            delete childField.filterable;
            delete childField.sortable;
            delete childField.groupable;
            delete childField.aggregatable;
            if (childField.parentExp) {
                childField.parentfieldid = {$query: {"field": childField.parentExp, collectionid: collectionid}};
//                delete childField.parentExp;
            } else {
                childField.parentfieldid = {$query: {"field": parentFieldExp, collectionid: collectionid }};
                // isChild is used for case : accountid field exists with parent voucher_line_itmes and we are trying to insert in voucherlineitems
                // to add the parentfieldid in filter
                if (ischild) {
                    childField.parentfieldid.$query.parentfieldid = {$query: {"field": childFieldExp, collectionid: collectionid}};
                }
            }

            childField.__child__ = true;
            newFields.push(childField);
            var innerChildFields = childField.fields;
            delete childField.fields;
            if (innerChildFields && innerChildFields.length > 0) {
                modifyChildFieldProperties(innerChildFields, collectionid, childField.parentExp ? childField.parentExp : childFieldExp, childField.field, visibility, visibilityForm, visibilityGrid, true, newFields);
            }
        }
    }

    function populateNewChildFields(childQuery, fieldsResult) {
        var childQueryFields = childQuery.$fields;
        for (var key in childQueryFields) {
            if (childQueryFields[key] !== 1) {
                throw new Error("Field [" + key + "] with value [" + JSON.stringify(childQueryFields[key]) + "] is not supported in child Query [" + JSON.stringify(childQuery) + "]");
            }
            var dotIndex = key.indexOf(".");
            if (dotIndex >= 0) {
                throw new Error(" Dotted Field [" + key + "] is not supported in child Query [" + JSON.stringify(childQuery) + "]");
            }
        }

        var newFields = [];
        for (var key in childQueryFields) {
            if (fieldsResult && fieldsResult.length > 0) {
                var fieldToPut = Utils.getField(key, fieldsResult);
                if (fieldToPut) {
                    if (!(Utils.getField(key, newFields))) {
                        newFields.push(fieldToPut);
                    }
                }
            }
        }
        return newFields;
    }
}

function deleteChildFields(collectionId, document, db) {
    if (document.type === "delete") {
        var deleteQuery = {"parentfieldid._id": document.get("_id"), "collectionid._id": collectionId};
        return db.update({$collection: "pl.fields", $delete: [
            {$query: deleteQuery}
        ], $applock: false});
    }
}

function addUDTColumns(document, db) {
    if (document.type === "insert") {
        var type = document.get(Constants.Admin.Fields.TYPE);
        if (isHaveSubField(type)) {
            return addSubFields(document, db);
        }
    } else if (document.type === "update") {
        var updatedFields = document.getUpdatedFields();
        if (updatedFields && updatedFields.indexOf("type") >= 0) {
            var oldType = document.getOld(Constants.Admin.Fields.TYPE);
            var type = document.get(Constants.Admin.Fields.TYPE);
            if (isHaveSubField(oldType) && isHaveSubField(type)) {
                return removeSubFields(document, db).then(function () {
                    return addSubFields(document, db);
                });
            } else if (!isHaveSubField(oldType) && isHaveSubField(type)) {
                return addSubFields(document, db);
            } else if (isHaveSubField(oldType) && !isHaveSubField(type)) {
                return removeSubFields(document, db);
            }
        }
    }
}

function addSubFields(doc, db) {
    var type = doc.get(Constants.Admin.Fields.TYPE);
    var fields = getSubFields(doc, type);
    var updates = {$collection: "pl.fields", $insert: fields, $applock: false};
    return db.update(updates);
}

function getSubFields(doc, type) {
    var collectionId = doc.get(Constants.Admin.Fields.COLLECTION_ID);
    var docId = doc.get("_id");
    if (type === Constants.Admin.Fields.Type.CURRENCY) {
        return [
            {field: Constants.Modules.Udt.Currency.AMOUNT, type: Constants.Admin.Fields.Type.DECIMAL, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}, mandatory: true},
            {field: Constants.Modules.Udt.Currency.TYPE, type: Constants.Admin.Fields.Type.FK, set: [Constants.Modules.Udt.Currency.Type.CURRENCY], upsert: true, collection: Constants.Modules.Udt.Currency.Type.COLLECTION, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}, mandatory: true}
        ]
    } else if (type === Constants.Admin.Fields.Type.DURATION) {
        return [
            {field: Constants.Modules.Udt.Duration.TIME, type: Constants.Admin.Fields.Type.DECIMAL, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}, mandatory: true},
            {field: Constants.Modules.Udt.Duration.UNIT, type: Constants.Admin.Fields.Type.STRING, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}, mandatory: true},
            {field: Constants.Modules.Udt.Duration.CONVERTEDVALUE, type: Constants.Admin.Fields.Type.NUMBER, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}, mandatory: true}
        ]
    } else if (type === Constants.Admin.Fields.Type.UNIT) {
        return [
            {field: Constants.Modules.Udt.Unit.QUANTITY, type: Constants.Admin.Fields.Type.DECIMAL, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}, mandatory: true},
            {field: Constants.Modules.Udt.Unit.UNIT, type: Constants.Admin.Fields.Type.FK, set: [Constants.Modules.Udt.Unit.Unit.UNIT], upsert: true, collection: Constants.Modules.Udt.Unit.Unit.COLLECTION, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}, mandatory: true}
        ]
    } else if (type === Constants.Admin.Fields.Type.FILE) {
        return [
            {field: Constants.Modules.Udt.File.KEY, type: Constants.Admin.Fields.Type.STRING, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}},
            {field: Constants.Modules.Udt.File.NAME, type: Constants.Admin.Fields.Type.STRING, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}},
            {field: Constants.Modules.Udt.File.URL, type: Constants.Admin.Fields.Type.STRING, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}}
        ]
    } else if (type === Constants.Admin.Fields.Type.SCHEDULE) {
        return [
            {field: Constants.Modules.Udt.Schedule.STARTS_ON, type: Constants.Admin.Fields.Type.DATE, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}},
            {field: Constants.Modules.Udt.Schedule.REPEATS, type: Constants.Admin.Fields.Type.STRING, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}},
            {field: Constants.Modules.Udt.Schedule.REPEAT_EVERY, type: Constants.Admin.Fields.Type.STRING, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}},
            {field: Constants.Modules.Udt.Schedule.REPEAT_ON, type: Constants.Admin.Fields.Type.STRING, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}, multiple: true},
            {field: Constants.Modules.Udt.Schedule.NEXT_DUE_ON, type: Constants.Admin.Fields.Type.DATE, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}},
            {field: Constants.Modules.Udt.Schedule.SUMMARY, type: Constants.Admin.Fields.Type.STRING, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}},
            {field: Constants.Modules.Udt.Schedule.TIMEZONE, type: Constants.Admin.Fields.Type.STRING, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}}
        ]
    } else if (type === Constants.Admin.Fields.Type.DATERANGE) {
        return [
            {field: Constants.Modules.Udt.DateRange.TO, type: Constants.Admin.Fields.Type.DATE, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}},
            {field: Constants.Modules.Udt.DateRange.FROM, type: Constants.Admin.Fields.Type.DATE, __system__: true, collectionid: collectionId, parentfieldid: {_id: docId}}
        ]
    } else {
        return undefined;
    }
}

function isHaveSubField(type) {
    if (type === Constants.Admin.Fields.Type.CURRENCY || type === Constants.Admin.Fields.Type.DURATION || type === Constants.Admin.Fields.Type.UNIT || type === Constants.Admin.Fields.Type.FILE || type === Constants.Admin.Fields.Type.SCHEDULE || type === Constants.Admin.Fields.Type.DATERANGE) {
        return true;
    } else {
        return false;
    }
}

function removeSubFields(doc, db) {
    var filter = {};
    var collectionId = doc.getOld(Constants.Admin.Fields.COLLECTION_ID);
    filter[Constants.Admin.Fields.COLLECTION_ID + "._id"] = collectionId._id;
    filter[Constants.Admin.Fields.PARENT_FIELD_ID + "._id"] = doc.getOld("_id");
    return db.update({$collection: "pl.fields", $delete: {$query: filter}, $applock: false})
}

// function to add fields to customization or to qviews form the collection fields.
exports.addFields = function (params, db, options) {
    if (params.addToCustomization) {   //add in customization view
        var sourceid = params.sourceid;   //sourceid (_id saved in the menu level)
        var selectedFields = params._id;
        var length = selectedFields ? selectedFields.length : 0;
        for (var i = 0; i < length; i++) {
            selectedFields[i] = Utils.getObjectId(selectedFields[i]);
        }
        var selectedFieldsClone = Utils.deepClone(selectedFields);
        return populateParentFields(selectedFields, selectedFieldsClone, db).then(
            function () {
                return db.update({$collection: "pl.qviewcustomizations", $upsert: {$query: {_id: sourceid}}});  //insert the view collection so every duplicate can be handled
            }).then(
            function () {
                return db.query({$collection: "pl.qviewcustomizations", $filter: {_id: sourceid}});
            }).then(function (customizationData) {
                if (customizationData && customizationData.result && customizationData.result.length > 0) {
                    customizationData = customizationData.result[0];
                    var qFields = customizationData.qFields || [];
                    var fieldsToBeInserted = [];
                    for (var i = 0; i < selectedFieldsClone.length; i++) {
                        var selectedField = selectedFieldsClone[i];
                        var found = false;
                        for (var j = 0; j < qFields.length; j++) {
                            if (Utils.deepEqual(qFields[j].qfield._id, selectedField)) {
                                found = true;
                            }
                        }
                        if (!found) {
                            fieldsToBeInserted.push({qfield: {_id: selectedField}});
                        }
                    }
                    if (fieldsToBeInserted.length > 0) {
                        return db.update({$collection: "pl.qviewcustomizations", $update: {_id: customizationData._id, $set: {qFields: {$insert: fieldsToBeInserted}}}});
                    }
                }
            });

    } else if (params.addToQview) {    // add in qviews
        var viewid = params.view__id;
        var selectedFields = params._id;
        var length = selectedFields ? selectedFields.length : 0;
        for (var i = 0; i < length; i++) {
            selectedFields[i] = Utils.getObjectId(selectedFields[i]);  //only the fk is saved in selected fields
        }
        var selectedFieldsClone = Utils.deepClone(selectedFields);
        return populateParentFields(selectedFields, selectedFieldsClone, db).then(   //all fields parent must we in the qview
            function () {
                return db.query({$collection: "pl.qviews", $filter: {id: viewid}});   // check whether field is already saved in qFields
            }).then(function (qviewsData) {
                if (qviewsData && qviewsData.result && qviewsData.result.length > 0) {
                    qviewsData = qviewsData.result[0];
                    var qFields = qviewsData.qFields || [];
                    var fieldsToBeInserted = [];
                    for (var i = 0; i < selectedFieldsClone.length; i++) {
                        var selectedField = selectedFieldsClone[i];
                        var found = false;
                        for (var j = 0; j < qFields.length; j++) {
                            if (Utils.deepEqual(qFields[j].qfield._id, selectedField)) {
                                found = true;
                            }
                        }
                        if (!found) {
                            fieldsToBeInserted.push({qfield: {_id: selectedField}});
                        }
                    }
                    if (fieldsToBeInserted.length > 0) {
                        return db.update({$collection: "pl.qviews", $update: {_id: qviewsData._id, $set: {qFields: {$insert: fieldsToBeInserted}}}});
                    }
                }
            })
    }
}

function populateParentFields(selectedFieldIds, selectedFieldsClone, db) {
    return Utils.iterateArrayWithPromise(selectedFieldIds, function (index, fieldid) {
        return db.query({$collection: "pl.fields", "$filter": {_id: fieldid}, $fields: {"parentfieldid": 1}}).then(function (data) {
            if (data && data.result && data.result.length > 0) {
                if (data.result[0].parentfieldid && data.result[0].parentfieldid._id) {
                    var parentfieldid = data.result[0].parentfieldid;
                    var index = Utils.isExists(selectedFieldsClone, parentfieldid._id);
                    if (index === undefined) {
                        selectedFieldsClone.push(parentfieldid._id);
                    }
                    return populateParentFields([parentfieldid._id], selectedFieldsClone, db);
                }
            }
        });
    });
}

// to populate the indicators to show that these fields are included in customization of qviews.
exports.populateCustomizationIndicators = function (query, result, db, options) {
    var parameters = query.$parameters || {};
    var sourceid = parameters.sourceid;
    var viewid = parameters.viewid;
    return db.query({$collection: "pl.qviewcustomizations", "$filter": {_id: sourceid}}).then(
        function (customizationData) {
            if (customizationData && customizationData.result && customizationData.result.length > 0) {
                var qFields = customizationData.result[0].qFields;
                if (qFields && qFields.length > 0) {
                    populateIndicator(qFields, result.result, "customizationEnabled");
                }
            }
            return db.query({"$collection": "pl.qviews", "$filter": {id: viewid}});
        }).then(function (qviewData) {
            if (qviewData && qviewData.result && qviewData.result.length > 0) {
                var qFields = qviewData.result[0].qFields;
                if (qFields && qFields.length > 0) {
                    populateIndicator(qFields, result.result, "qviewEnabled");
                }
            }
        })

//    return populateQViewFields(query, result, options, db)
}

function populateIndicator(qFields, allFields, expression) {
    for (var i = 0; i < qFields.length; i++) {
        var qField = qFields[i];
        var index = Utils.isExists(allFields, qField.qfield, "_id");
        if (index !== undefined) {
            var fieldInfo = allFields[index];
            fieldInfo[expression] = true;
        }
    }
}

exports.onResult = function (query, result, db, options) {
    var queryFilter = query.$filter;
    var localQuery = Utility.getlocalQuery(queryFilter, "pl.fields", "pl.collections", "collectionid");
    return Utility.populateResult(localQuery, result, db, options);
}

function populateQViewFields(query, result, options, db) {
    var viewId = query.$parameters ? query.$parameters.view_id : undefined;
    if (viewId) {
        return db.query({$collection: Constants.Admin.QVIEWS, $filter: {_id: viewId}}).then(function (data) {
            var qFields = data.result && data.result.length > 0 ? data.result[0].qFields : [];
            qFields = qFields || [];
            for (var i = 0; i < qFields.length; i++) {
                var index = Utils.isExists(result.result, qFields[i].qfield, "_id");
                if (index !== undefined) {
                    result.result[index][Constants.Admin.Fields.QVIEW] = qFields[i][Constants.Admin.Qviews.QField.AVAILABILITY];
                    result.result[index][Constants.Admin.Fields.VISIBILITY_QVIEW] = qFields[i][Constants.Admin.Qviews.QField.VISIBILITY];
                    result.result[index][Constants.Admin.Fields.VISIBILITYFORM_QVIEW] = qFields[i][Constants.Admin.Qviews.QField.VISIBILITYFORM];
                    result.result[index][Constants.Admin.Fields.INDEX_QVIEW] = qFields[i][Constants.Admin.Qviews.QField.INDEX];
                    result.result[index][Constants.Admin.Fields.INDEXFORM_QVIEW] = qFields[i][Constants.Admin.Qviews.QField.INDEXFORM];
                    result.result[index][Constants.Admin.Fields.FILTER_QVIEW] = qFields[i][Constants.Admin.Qviews.QField.FILTER];
                    result.result[index][Constants.Admin.Fields.EDITABLEWHEN_QVIEW] = qFields[i][Constants.Admin.Qviews.QField.EDITABLE_WHEN];
                    result.result[index][Constants.Admin.Fields.WHEN_QVIEW] = qFields[i][Constants.Admin.Qviews.QField.WHEN];
                    result.result[index][Constants.Admin.Fields.WIDTH_QVIEW] = qFields[i][Constants.Admin.Qviews.QField.WIDTH];
                }
            }
        })
    }
}

exports.onQuery = function (query) {
    Utility.checkFilterInQuery(query, "collectionid");
}

function mergeCustomizationsInternally(customizations, fields, viewId, sourceid, customizationExistence) {
    if (!fields || fields.length == 0 || !customizations || Object.keys(customizations).length === 0) {
        return;
    }
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.fields) {
            mergeCustomizationsInternally(customizations, field.fields, viewId, sourceid, customizationExistence);
        }
        var customizationValues = customizations[field._id];
        if (customizationValues) {
            var propertyPriorities = {};
            for (var k = 0; k < customizationValues.length; k++) {
                var customizationValue = customizationValues[k];
                var customizationSourceId = customizationValue[Constants.FieldCustomizations.SOURCE_ID];
                var customizationQViewId = customizationValue[Constants.FieldCustomizations.QVIEW_ID];
                if ((customizationSourceId && customizationSourceId !== sourceid) || (customizationQViewId && !Utils.deepEqual(customizationQViewId._id, viewId))) {
                    continue;
                }
                if (!customizationExistence.collectionLevelCustomization && !customizationQViewId && !customizationSourceId) {
                    customizationExistence.collectionLevelCustomization = true;
                }
                if (!customizationExistence.qviewLevelCustomization && customizationQViewId) {
                    customizationExistence.qviewLevelCustomization = true;
                }
                if (!customizationExistence.viewLevelCustomization && customizationSourceId) {
                    customizationExistence.viewLevelCustomization = true;
                }
                for (var j = 0; j < Constants.FieldCustomizations.MERGE_PROPERTIES.length; j++) {
                    var property = Constants.FieldCustomizations.MERGE_PROPERTIES[j];
                    if (customizationValue[property] !== undefined) {
                        var propertyKey = customizationSourceId ? 3 : (customizationQViewId ? 2 : 1);
                        if (propertyPriorities[property] === undefined || (propertyPriorities[property] < propertyKey)) {
                            field[property] = customizationValue[property];
                            propertyPriorities[property] = propertyKey;
                        }
                    }
                }
            }
        }
    }
}

function getRecursiveFieldCustomization(collectionId, customizationDBs, db) {
    var customizations = undefined;
    return db.query({$collection: Constants.FieldCustomizations.TABLE, $events: false, $filter: {"collectionid": collectionId}}).then(
        function (result) {
            var fieldCustomizations = result.result;
            if (fieldCustomizations.length > 0) {
                customizationDBs.push(db.db.databaseName);
                customizations = populateCustomizationMap(fieldCustomizations);
            }
        }).then(
        function () {
            return db.getGlobalDB();
        }).then(
        function (globalDB) {
            if (globalDB) {
                return getRecursiveFieldCustomization(collectionId, customizationDBs, globalDB);
            }
        }).then(function (globalDBCustomizations) {
            var toReturn = undefined;
            if (!globalDBCustomizations) {
                toReturn = customizations;
            } else if (!customizations) {
                toReturn = globalDBCustomizations;
            } else {
                //merge global and customizations
                for (var key in customizations) {
                    var customizationValues = customizations[key];
                    if (globalDBCustomizations[key] !== undefined) {
                        var globalCustomizationValues = globalDBCustomizations[key];
                        for (var i = 0; i < customizationValues.length; i++) {
                            var customizationValue = customizationValues[i];
                            var globalCustomizationIndex = Utils.isExists(globalCustomizationValues, customizationValue, "_id");
                            if (globalCustomizationIndex >= 0) {
                                var globalCustomization = globalCustomizationValues[globalCustomizationIndex];
                                //merge customization into global customization
                                for (var j = 0; j < Constants.FieldCustomizations.MERGE_PROPERTIES.length; j++) {
                                    var property = Constants.FieldCustomizations.MERGE_PROPERTIES[j];
                                    if (customizationValue[property] !== undefined) {
                                        globalCustomization[property] = customizationValue[property];
                                    }
                                }
                            } else {
                                globalCustomizationValues.push(customizationValue);
                            }
                        }
                    } else {
                        globalDBCustomizations[key] = customizationValues;
                    }
                }
                toReturn = globalDBCustomizations;
            }
            return toReturn
        });
}

exports.mergeFieldCustomizations = function (fields, collectionId, viewOptions, db) {
    if (!collectionId || !fields || fields.length == 0) {
        return;
    }
    var customizationExistence = {};
    var customizationDBs = [];
    return getRecursiveFieldCustomization(collectionId, customizationDBs, db).then(
        function (recursiveCustomizations) {
            return mergeCustomizationsInternally(recursiveCustomizations, fields, viewOptions._id, viewOptions.sourceid, customizationExistence);
        }).then(function () {
            if (customizationDBs.length > 0) {
                viewOptions["fieldCustomizationDatabases"] = customizationDBs;
            }
            for (var k in customizationExistence) {
                viewOptions[k] = customizationExistence[k];
            }
        })
}

exports.mergeUserFieldCustomizations = function (fields, collectionId, viewOptions, db) {
    if (!db.user || !collectionId || !fields || fields.length == 0) {
        return;
    }
    var customizationExistence = {};
    return db.query({$collection: Constants.UserFieldCustomizations.TABLE, $filter: {"collectionid": collectionId, userid: db.user._id}}).then(
        function (result) {
            var customizations = populateCustomizationMap(result.result);
            return mergeCustomizationsInternally(customizations, fields, viewOptions._id, viewOptions.sourceid, customizationExistence);
        }).then(function () {
            if (Object.keys(customizationExistence).length > 0) {
                viewOptions.userLevelCustomization = true;
            }
        })
}

function populateCustomizationMap(customizations) {
    var customizationMap = {};
    for (var i = 0; i < customizations.length; i++) {
        var customization = customizations[i];
        var fieldId = customization[Constants.FieldCustomizations.FIELD_ID]._id;
        customizationMap[fieldId] = customizationMap[fieldId] || [];
        customizationMap[fieldId].push(customization);
    }
    return customizationMap;
}

exports.postQuery = function (query, result, db, options) {
    var resultFields = result.result;
    if (resultFields.length === 0) {
        return;
    }
    var newFields = [];
    return  getCollection(query.$filter, db).then(
        function (collectionName) {
            return db.collection(collectionName);
        }).then(
        function (collectionObj) {
            var collectionFields = collectionObj.getValue("fields");
            return Utils.iterateArrayWithPromise(resultFields, function (index, resultField) {
                var exists = Utils.isExists(collectionFields, resultField, "_id");
                if (exists === undefined) {
                    return;
                }
                newFields.push(resultField);
                var fieldInfo = collectionFields[exists];
                addDottedFields(resultField.field, newFields, fieldInfo, Object.keys(resultField));
            })
        }).then(function () {
            resultFields.splice(0, (resultFields.length));
            resultFields.push.apply(resultFields, newFields);
        })
}

function addDottedFields(exp, newFields, fieldInfo, keys) {
    var innerFields = fieldInfo.fields;
    if (innerFields && innerFields.length > 0) {
        for (var i = 0; i < innerFields.length; i++) {
            var innerFieldInfo = innerFields[i];
            var innerField = {};
            for (var j = 0; j < keys.length; j++) {
                var key = keys[j];
                innerField[key] = innerFieldInfo[key];
            }
            innerField.field = exp + "." + innerField.field;
            newFields.push(innerField);
            addDottedFields(innerField.field, newFields, innerFieldInfo, keys);
        }
    }
}

function getCollection(filter, db) {
    if (filter["collectionid.collection"] != undefined) {
        var d = require("q").defer();
        d.resolve(filter["collectionid.collection"]);
        return d.promise;
    } else {
        var collectionId = filter["collectionid._id"] || filter["collectionid"];
        if (Utils.isJSONObject(collectionId) && collectionId._id) {
            collectionId = collectionId._id;
        }
        var query = {$collection: "pl.collections", $filter: {_id: collectionId}, $fields: {"collection": 1}};
        return db.query(query).then(function (result) {
            return result.result[0].collection;
        })
    }
}

exports.populateDrillDownView = function (parameters, db, options) {
    var collectionName = parameters.collection;
    var drillDownFields = [];
    var filterableFields = [];
    var fields = [];
    if (collectionName) {
        return db.collection(collectionName).then(
            function (collection) {
                fields = collection.getValue("fields");
                removeSystemFields(fields);
                populateDrillDownFields(fields, drillDownFields, "drillDownEnabled");
                populateDrillDownFields(fields, filterableFields, "filterable");
            }).then(
            function () {
                if (drillDownFields.length > 0) {
                    return createViewIfNotExists(collectionName, collectionName + "__drilldown", "grid", db);
                }
            }).then(
            function () {
                if (drillDownFields.length > 0) {
                    return createViewIfNotExists(collectionName, collectionName + "__drilldowndashboard", "dashboard", db);
                }
            }).then(
            function (viewInfo) {
                if (viewInfo) {
                    var nestedViews = [];
                    for (var i = 0; i < drillDownFields.length; i++) {
                        var fieldInfo = drillDownFields[i];
                        populateDashboardViews(fieldInfo, nestedViews, collectionName);
                    }
                    if (viewInfo && viewInfo.views && viewInfo.views.length > 0) {
                        var viewsTobeInserted = [];
                        populateViewsToBeInserted(nestedViews, viewInfo.views, viewsTobeInserted);
                        if (viewsTobeInserted.length > 0) {
                            return db.update({$collection: "pl.qviews", "$update": {"_id": viewInfo._id, $set: {"views": {"$insert": viewsTobeInserted}}}});
                        }
                    } else {
                        if (nestedViews.length > 0) {
                            return db.update({$collection: "pl.qviews", "$update": {"_id": viewInfo._id, $set: {"views": {"$insert": nestedViews}}}});
                        }
                    }
                }
            }).then(
            function () {
                return db.query({$collection: "pl.qviews", "$filter": {"id": collectionName + "__drilldowndashboard"}});
            }).then(function (qviewInfo) {
                if (qviewInfo && qviewInfo.result && qviewInfo.result.length > 0) {
                    qviewInfo = qviewInfo.result[0];
                    var nestedViews = qviewInfo.views;
                    return Utils.iterateArrayWithPromise(nestedViews, function (index, nestedView) {
                        var nestedViewid = nestedView._id;
                        return customizeEachNestedView(nestedView, drillDownFields, filterableFields, fields, db);
                    });
                }
            });
    }
}

function customizeEachNestedView(nestedView, drillDownFields, filterableFields, fields, db) {
    return db.update({$collection: "pl.qviewcustomizations", $upsert: {$query: {_id: nestedView._id}}}).then(
        function () {
            return db.query({$collection: "pl.qviewcustomizations", $filter: {_id: nestedView._id}});
        }).then(function (customizationData) {
            if (customizationData && customizationData.result && customizationData.result.length > 0) {
                customizationData = customizationData.result[0];
                if (!customizationData.qFields) {
                    var qFields = [];
                    var group = {};
                    var indexOfDrillDownField = Utils.isExists(drillDownFields, {"field": nestedView.alias}, "field");
                    if (indexOfDrillDownField !== undefined) {
                        var drillDownField = drillDownFields[indexOfDrillDownField];
                        var qfield1 = {"qfield": {"_id": drillDownField._id}, "visibilityGrid": true, "width": "0px", indexGrid: 1, index: 1}
                        var unwind = undefined;
                        if (drillDownField.drillDownUnwind) {
                            unwind = [drillDownField.drillDownUnwind];
                        }
                        group._id = {};
                        group.$fields = false;
                        if (drillDownField.parentFieldExp) {
                            populateDottedFields(drillDownField.parentFieldExp, qFields, fields);
                            var parentFieldExp = drillDownField.parentFieldExp;
                            parentFieldExp = parentFieldExp + "." + drillDownField.field;
                            var replacedExp = Utils.replaceDotToUnderscore(parentFieldExp);
                            qfield1.alias = replacedExp;
                            group._id[replacedExp] = "$" + parentFieldExp;
                            group[replacedExp] = {"$first": "$" + parentFieldExp};
                        } else {
                            group._id[drillDownField.field] = "$" + drillDownField.field;
                            group[drillDownField.field] = {"$first": "$" + drillDownField.field};
                        }
                        qFields.push(qfield1);
                        //work for the valueColumn
                        var valueColumn = drillDownField.drillDownValue;
                        var valueField = Utils.getField(valueColumn, fields);
                        if (valueField !== undefined) {
                            group.$sort = {};
                            var qfield2 = {qfield: {_id: valueField._id}, "visibilityGrid": true, "width": "200px", indexGrid: 2, index: 2};
                            if (valueColumn.indexOf(".") !== -1) {
                                var replacedExp = Utils.replaceDotToUnderscore(valueColumn);
                                group[replacedExp] = {"$sum": "$" + valueColumn};
                                qfield2.alias = replacedExp;
                            } else {
                                group[valueColumn] = {"$sum": "$" + valueColumn};
                            }
                            group.$sort[valueColumn] = -1;
                            qFields.push(qfield2);
                            populateDottedFields(valueColumn, qFields, fields);
                        }
                    }
                    var filter = {};
                    for (var i = 0; i < filterableFields.length; i++) {
                        var field = filterableFields[i];
                        var parentfieldid = field.parentFieldExp ? field.parentFieldExp + "." + field.field : field.field;
                        filter[parentfieldid] = {"$$whenDefined": {"key": "$" + parentfieldid}};
                    }
                    if (qFields.length > 0) {
                        return db.update({$collection: "pl.qviewcustomizations", "$update": {_id: customizationData._id, $set: {"filter": JSON.stringify(filter), "unwind": JSON.stringify(unwind), "group": JSON.stringify(group), "qFields": qFields}}});
                    }
                }
            }
        })
}

function createViewIfNotExists(collectionName, viewid, ui, db) {
    return db.query({$collection: "pl.qviews", $filter: {id: viewid}}).then(function (result) {
        if (result && result.result && result.result.length > 0) {
            return result.result[0];
        } else {
            var viewInfo = {
                "id": viewid,
                "collection": {"$query": {"collection": collectionName}},
                "mainCollection": {"$query": {"collection": collectionName}}
            };
            if (ui === "dashboard") {
                viewInfo.label = collectionName.toString() + " Dashboard";
                viewInfo.dashboardType = "AdvanceDashboard";
                viewInfo.executeOnClient = true;
                viewInfo.runAsBatchQuery = true;
                viewInfo.ui = "dashboard";
                viewInfo.reloadViewOnFilterChange = true;
                viewInfo.navigation = false;
                viewInfo.dashboardLayout = "2 Columns";
            } else {
                viewInfo.label = collectionName.toString() + " DrillDown";
                viewInfo.ui = "grid";
                viewInfo.navigation = true;
                viewInfo.autoWidthColumn = true;
                viewInfo.fieldAvailability = "available";
            }
            return db.update({$collection: "pl.qviews", $insert: viewInfo}).then(function (result) {
                if (result && result["pl.qviews"] && result["pl.qviews"].$insert && result["pl.qviews"].$insert.length > 0) {
                    return result["pl.qviews"].$insert[0];
                }
            });
        }
    });
}

function populateDashboardViews(fieldInfo, nestedViews, collectionName) {
    var nestedView = {};
    nestedView.alias = fieldInfo.field;
    nestedView.collection = collectionName;
    nestedView.id = collectionName + "__drilldown";
    nestedView.name = fieldInfo.label;
    nestedView.queryGroup = fieldInfo.label;
    nestedViews.push(nestedView);
}

function populateDrillDownFields(fields, drillDownFields, exp, parentFieldExp) {
    var noOfFields = fields ? fields.length : 0;
    for (var i = 0; i < noOfFields; i++) {
        var field = fields[i];
        if (field.parentfieldid === undefined) {
            parentFieldExp = undefined;
        }
        if (field[exp]) {
            if (parentFieldExp) {
                field.parentFieldExp = parentFieldExp;
            }
            drillDownFields.push(field);
        }
        if (field.fields && field.fields.length > 0) {
            parentFieldExp = parentFieldExp ? parentFieldExp + "." + field.field : field.field;
            populateDrillDownFields(field.fields, drillDownFields, exp, parentFieldExp);
        }
    }
}

function populateViewsToBeInserted(nestedViews, views, viewsTobeInserted) {
    for (var i = 0; i < nestedViews.length; i++) {
        var nestedView = nestedViews[i];
        var index = Utils.isExists(views, nestedView, "alias");
        if (index === undefined) {
            viewsTobeInserted.push(nestedView);
        }
    }
}

function removeSystemFields(fields) {
    for (var i = fields.length - 1; i >= 0; i--) {
        var row = fields[i];
        if (row.__system__) {   //__system__ fields should not be available
            fields.splice(i, 1);
            continue;
        }
        if (row.fields) {
            removeSystemFields(row.fields);
        }
    }
}

function populateDottedFields(parentFieldExp, qFields, fields) {
    var dotIndex = parentFieldExp.indexOf(".")
    if (dotIndex >= 0) {
        var firstPart = parentFieldExp.substring(0, dotIndex);
        var fieldInfo = Utils.getField(firstPart, fields);
        if (fieldInfo) {
            var indexOfExistingQfield = Utils.isExists(qFields, {qfield: {_id: fieldInfo._id}}, "qfield");
            if (indexOfExistingQfield === undefined) {
                qFields.push({qfield: {_id: fieldInfo._id}, visibility: false, visibilityGrid: false, visibilityForm: false});
            }
        }
        var restPart = parentFieldExp.substring(dotIndex + 1);
        if (restPart.indexOf(".") >= 0) {
            populateDottedFields(restPart, qFields, fieldInfo ? fieldInfo.fields : []);
        } else {
            var fieldInfo = Utils.getField(restPart, fieldInfo ? fieldInfo.fields : []);
            if (fieldInfo) {
                var indexOfExistingQfield = Utils.isExists(qFields, {qfield: {_id: fieldInfo._id}}, "qfield");
                if (indexOfExistingQfield === undefined) {
                    qFields.push({qfield: {_id: fieldInfo._id}, visibility: false, visibilityGrid: false, visibilityForm: false});
                }
            }
        }
    }
}
