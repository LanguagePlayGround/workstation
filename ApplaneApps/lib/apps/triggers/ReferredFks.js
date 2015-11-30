/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 23/4/14
 * Time: 5:06 PM
 * To change this template use File | Settings | File Templates.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("ApplaneDB/lib/Constants.js");
var Q = require("q");
var Utility = require("./Utility.js");

exports.onQuery = function (query) {
    if (!query.$filter) {
        throw new Error("filter is mandatory in query [" + JSON.stringify(query) + "]");
    }
    var queryFilter = query.$filter;
    if (!queryFilter._id && !queryFilter["collectionid"] && !queryFilter["collectionid._id"] && !queryFilter["collectionid.collection"] && !queryFilter["referredcollectionid"] && !queryFilter["referredcollectionid._id"] && !queryFilter["referredcollectionid.collection"]) {
        throw new Error("Either _id or collectionid or referredcollectionid is mandatory in filter for query [" + JSON.stringify(query) + "]");
    }
}

/**
 *  In referredFks,If changes in collection or any other properties related to collection like fields,actions etc. then referred fks saved in local db corresponds to that collection according to collectionid filter.
 *  In case of fetching data of referred collection,if there is collectionid filter,then no need to merge result ,same logic as for fields
 *  if there is filter in referredcollectionid,then need to merge data of those collection which was not changed.
 *
 */
exports.onResult = function (query, result, db, options) {
    var queryFilter = query.$filter;
    if (queryFilter._id) {
        return;
    } else if (queryFilter["collectionid"] || queryFilter["collectionid._id"] || queryFilter["collectionid.collection"]) {
        var localQuery = Utility.getlocalQuery(queryFilter, "pl.referredfks", "pl.collections", "collectionid");
        return Utility.populateResult(localQuery, result, db, options);
    } else if (queryFilter["referredcollectionid"] || queryFilter["referredcollectionid._id"] || queryFilter["referredcollectionid.collection"]) {
        return Utility.populateMergedResult(result, db, options);
    }
}

exports.onPostSave = function (document, db) {
    if (document.type === "delete") {
        return;
    }
    var setValues = document.get(Constants.Admin.ReferredFks.SET);
    var valuesToSet = {};
    var referredCollectionId = document.get(Constants.Admin.ReferredFks.REFERRED_COLLECTION_ID);
    var field = document.get(Constants.Admin.ReferredFks.FIELD);
    return getReferredCollectionFields(referredCollectionId, db).then(
        function (referredCollectionFields) {
            return Utils.iterateArrayWithPromise(setValues, function (index, setValue) {
                if (setValue.indexOf(".") > 0) {
                    var found = false;
                    for (var key in valuesToSet) {
                        if (setValue.indexOf(key + ".") == 0) {
                            var nextValue = setValue.substring(key.length + 1);
                            found = true;
                            if (nextValue !== "_id") {
                                valuesToSet[key].value = valuesToSet[key].value || [];
                                if (valuesToSet[key].value.indexOf(nextValue) === -1) {
                                    valuesToSet[key].value.push(nextValue);
                                }
                            }
                            break;
                        }
                    }
                    if (!found) {
                        populate(valuesToSet, setValue, field, referredCollectionFields);
                    }
                }
            })
        }).then(
        function () {
            if (Object.keys(valuesToSet).length > 0) {
                return insertReferredData(valuesToSet, document, db);
            }
        })
}

function getReferredCollectionFields(collectionId, db) {
    var query = {};
    query[Constants.Query.COLLECTION] = Constants.Admin.FIELDS;
    query[Constants.Query.FILTER] = {"collectionid._id":collectionId._id};
    return db.query(query).then(
        function (res) {
            return res.result;
        })
}

function insertReferredData(valuesToSet, document, db) {
    var referredFksData = [];
    for (var key in valuesToSet) {
        var value = valuesToSet[key];
        var referredFkData = {};
        referredFkData[Constants.Admin.ReferredFks.COLLECTION_ID] = document.get(Constants.Admin.ReferredFks.COLLECTION_ID);
        referredFkData[Constants.Admin.ReferredFks.FIELD] = value.field;
        if (value.value) {
            referredFkData[Constants.Admin.ReferredFks.SET] = value.value;
        }
        if (value.cascade !== undefined) {
            referredFkData[Constants.Admin.ReferredFks.CASCADE] = value.cascade;
        }
        referredFkData[Constants.Admin.ReferredFks.REPLICATE] = true;
        referredFkData[Constants.Admin.ReferredFks.REFERRED_COLLECTION_ID] = {$query:{collection:typeof value.collection == "string" ? value.collection : value.collection.collection}};
        referredFkData[Constants.Admin.ReferredFks.REFERRED_FIELD_ID] = document.get(Constants.Admin.ReferredFks.REFERRED_FIELD_ID);
        referredFksData.push(referredFkData);
    }
    return insertReferredFk(referredFksData, db);
}

function populate(valuesToSet, setValue, field, referredCollectionFields, pFieldExp, pFieldId) {
    var indexOf = setValue.indexOf(".");
    if (indexOf > 0) {
        var firstPart = setValue.substr(0, indexOf);
        var nextPart = setValue.substr(indexOf + 1);
        pFieldExp = pFieldExp ? pFieldExp + "." + firstPart : firstPart;
        for (var i = 0; i < referredCollectionFields.length; i++) {
            var referredCollectionField = referredCollectionFields[i];
            if (referredCollectionField[Constants.Admin.Fields.FIELD] == firstPart && isMatched(referredCollectionField, pFieldId)) {
                var type = referredCollectionField[Constants.Admin.Fields.TYPE];
                var multiple = referredCollectionField[Constants.Admin.Fields.MULTIPLE];
                if (type == Constants.Admin.Fields.Type.FK) {
                    field = field + "." + firstPart + (multiple ? ".$" : "");
                    var result = {field:field, collection:referredCollectionField[Constants.Admin.Fields.COLLECTION], cascade:referredCollectionField[Constants.Admin.Fields.CASCADE]};
                    if (nextPart !== "_id") {
                        result.value = [nextPart];
                    }
                    valuesToSet[pFieldExp] = result;
                } else if (type == Constants.Admin.Fields.Type.OBJECT) {
                    field = field + "." + firstPart + (multiple ? ".$" : "");
                    return populate(valuesToSet, nextPart, field, referredCollectionFields, pFieldExp, referredCollectionField._id);
                } else {
                    //Do nothing as dotted set field not support for other types or may be error.
                }
            }
        }
    }
}

function isMatched(field, pFieldId) {
    if ((!pFieldId && !field[Constants.Admin.Fields.PARENT_FIELD_ID]) || (pFieldId && field[Constants.Admin.Fields.PARENT_FIELD_ID] && field[Constants.Admin.Fields.PARENT_FIELD_ID]._id == pFieldId)) {
        return true;
    }
}

function populateFieldsMap(fields, fieldsMap) {
    if (fields) {
        for (var i = 0; i < fields.length; i++) {
            var field = fields[i];
            fieldsMap[field._id] = field;
            if (field.type !== "fk" && field.fields && field.fields.length > 0) {
                populateFieldsMap(field.fields, fieldsMap);
            }
        }
    }
}

exports.repopulateReferredFks = function (params, db) {
    var sTime = new Date();
    var collectionName = params.collection;
    if (collectionName === undefined) {
        throw new Error("Please provide value of mandatory parameters [collection] in repopulateReferredFks");
    }
    var fields = undefined;
    var referredFks = undefined;
    var fieldsMap = {};
    //$events false should be in case of fields and referredfks as fields and referredfks for updated collection saved here.
    //$events can not be false in update in referredfks as collections is not mandatory to be found in current db.

    //need to add other columns each time if have fk column in their inner field like currency,unit etc..
    return db.query({$collection:Constants.Admin.FIELDS, $filter:{"collectionid.collection":collectionName, __child__:{$in:[null, false]}, nonPersistent:{$in:[null, false]}, type:{$in:["fk", "object", "currency", "unit"]}, "parentfieldid":null}, "$recursion":{"parentfieldid":"_id", "$alias":"fields"}, $events:false}).then(
        function (fieldsResult) {
            fields = fieldsResult.result;
            populateFieldsMap(fields, fieldsMap);
            return db.query({$collection:"pl.referredfks", $filter:{"collectionid.collection":collectionName}, $events:false});
        }).then(
        function (referredFksResult) {
            referredFks = referredFksResult.result;
            var referredFksToRemove = getReferredFksToRemove(referredFks, fieldsMap);
            if (referredFksToRemove.length > 0) {
                return db.update({$collection:Constants.Admin.REFERRED_FKS, $delete:referredFksToRemove, $applock:false});
            }
        }).then(
        function () {
            var fieldKeys = Object.keys(fieldsMap);
            return Utils.iterateArrayWithPromise(fieldKeys, function (index, fieldKey) {
                var fieldInfo = fieldsMap[fieldKey];
                if (fieldInfo.type !== "fk") {
                    return;
                }
                var fieldReferredFks = [];
                for (var i = referredFks.length - 1; i >= 0; i--) {
                    var referredFk = referredFks[i];
                    var referredFieldId = referredFk[Constants.Admin.ReferredFks.REFERRED_FIELD_ID]._id;
                    if (Utils.deepEqual(fieldInfo._id, referredFieldId)) {
                        fieldReferredFks.push(referredFk);
                        referredFks.splice(i, 1);
                    }
                }
                return updateFieldReferredFk(fieldInfo, fieldsMap, fieldReferredFks, db);
            })
        }).then(function () {
            db.logMongoTime("RepopulateReferredFkCount", (new Date() - sTime), true);
        })
}

function updateFieldReferredFk(fieldInfo, fieldsMap, referredFks, db) {
    var referredFkToUpdate = populateReferredFksData(fieldInfo, fieldsMap);
    if (referredFks.length === 0) {
        return insertReferredFk(referredFkToUpdate, db);
    } else if (referredFks.length === 1) {
        var referredFk = referredFks[0];
        var referredFkId = referredFk._id;
        if (!Utils.deepEqual(referredFk.field, referredFkToUpdate.field) || !Utils.deepEqual(referredFk.cascade, referredFkToUpdate.cascade) || !Utils.deepEqual(referredFk.collectionid, referredFkToUpdate.collectionid) || !Utils.deepEqual(referredFk.set, referredFkToUpdate.set) || !Utils.deepEqual(referredFk.referredcollectionid.collection, referredFkToUpdate.referredcollectionid.$query.collection)) {
            return removeAndInsertInReferredFks([
                {_id:referredFkId}
            ], referredFkToUpdate, db);
        }
    } else if (referredFks.length > 1) {
        var referredFkIds = [];
        for (var i = 0; i < referredFks.length; i++) {
            referredFkIds.push({_id:referredFks[i]._id});
        }
        return removeAndInsertInReferredFks(referredFkIds, referredFkToUpdate, db);
    }
}

function removeAndInsertInReferredFks(referredFkIds, referredFkToUpdate, db) {
    return db.update({$collection:Constants.Admin.REFERRED_FKS, $delete:referredFkIds, $applock:false}).then(function () {
        return insertReferredFk(referredFkToUpdate, db);
    })
}

function insertReferredFk(referredFkUpdate, db) {
    var updates = {};
    updates[Constants.Update.COLLECTION] = Constants.Admin.REFERRED_FKS;
    updates[Constants.Update.INSERT] = referredFkUpdate;
    updates.$applock = false;
    return db.update(updates);
}

function populateReferredFksData(fieldInfo, fieldsMap) {
    var field = fieldInfo.field;
    if (fieldInfo.multiple) {
        field = field + ".$";
    }
    var referredField = populateReferredField(field, fieldInfo[Constants.Admin.Fields.PARENT_FIELD_ID], fieldsMap);
    var insert = {};
    insert[Constants.Admin.ReferredFks.COLLECTION_ID] = fieldInfo[Constants.Admin.Fields.COLLECTION_ID];
    insert[Constants.Admin.ReferredFks.FIELD] = referredField;
    if (fieldInfo[Constants.Admin.Fields.SET] && fieldInfo[Constants.Admin.Fields.SET].length > 0) {
        insert[Constants.Admin.ReferredFks.SET] = fieldInfo[Constants.Admin.Fields.SET];
    }
    if (fieldInfo[Constants.Admin.Fields.CASCADE] !== undefined) {
        insert[Constants.Admin.ReferredFks.CASCADE] = fieldInfo[Constants.Admin.Fields.CASCADE];
    }
    insert[Constants.Admin.ReferredFks.REFERRED_FIELD_ID] = {_id:fieldInfo._id, field:fieldInfo[Constants.Admin.Fields.FIELD]};
    insert[Constants.Admin.ReferredFks.REFERRED_COLLECTION_ID] = {$query:{collection:fieldInfo[Constants.Admin.Fields.COLLECTION]}};
    return insert;
}

function populateReferredField(field, parentFieldId, fieldsMap) {
    if (!parentFieldId) {
        return field;
    }
    var parentField = fieldsMap[parentFieldId._id];
    if (!parentField) {
        throw new Error("Parent Field [" + parentFieldId.field + "] does not exists for field [" + field + "]");
    }
    var newField = parentField[Constants.Admin.Fields.FIELD] + (parentField[Constants.Admin.Fields.MULTIPLE] ? ".$." : ".") + field;
    return populateReferredField(newField, parentField[Constants.Admin.Fields.PARENT_FIELD_ID], fieldsMap);
}

function getReferredFksToRemove(referredFks, fieldsMap) {
    var referredFksToRemove = [];
    for (var i = referredFks.length - 1; i >= 0; i--) {
        var referredFk = referredFks[i];
        var referredFieldId = referredFk[Constants.Admin.ReferredFks.REFERRED_FIELD_ID]._id;
        if (fieldsMap[referredFieldId] === undefined) {
            referredFksToRemove.push({_id:referredFk._id});
            referredFks.splice(i, 1);
        }
    }
    return referredFksToRemove;
}


