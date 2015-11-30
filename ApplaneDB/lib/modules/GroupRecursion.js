/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 7/11/14
 * Time: 5:58 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Recursion = require("./Recursion.js");
var QueryUtility = require("../QueryUtility.js");
var Q = require("q");

exports.doQuery = function (query, collection) {
    var queryGroup = query[Constants.Query.GROUP];
    if (!queryGroup) {
        return;
    }
    if (queryGroup.$recursion || query[Constants.Query.RECURSION]) {
        if (queryGroup.$recursion && query[Constants.Query.RECURSION]) {
            throw new Error("Recursion can be defined either in group or in mainQuery.Query Defined [" + JSON.stringify(query) + "]");
        }
        query.$moduleInfo = query.$moduleInfo || {};
        query.$moduleInfo.GroupRecursion = query.$moduleInfo.GroupRecursion || {};
        var collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
        var fieldInfos = collection.getValue("fieldInfos");
        if (query[Constants.Query.RECURSION]) {
            query.$moduleInfo.GroupRecursion.recursion = query[Constants.Query.RECURSION];
            delete query[Constants.Query.RECURSION];
        } else if (queryGroup.$recursion) {
            var recursionInGroup = queryGroup.$recursion;
            if (!recursionInGroup[Constants.Query.Recursion.ROOT_FILTER]) {
                throw new Error("Root Filter is mandatory in recursion defined in field.");
            }
            if (!recursionInGroup[Constants.Query.Recursion.ALIAS]) {
                throw new Error("Alias is mandatory in recursion defined in field.");
            }
            var groupRecursiveField = undefined;
            for (var key in recursionInGroup) {
                if (key.indexOf("$") !== 0 && key.lastIndexOf(".") > 0) {
                    var firstPart = key.substring(0, key.lastIndexOf("."));
                    var nextPart = key.substring(key.lastIndexOf(".") + 1);
                    var fieldDef = fieldInfos ? fieldInfos[firstPart] : undefined;
                    if (fieldDef && fieldDef.type === "fk" && fieldDef.collection !== collectionName) {
                        groupRecursiveField = fieldDef;
                        groupRecursiveField.mainField = firstPart;
                        recursionInGroup[nextPart] = recursionInGroup[key];
                        delete recursionInGroup[key];
                        break;
                    }
                }
            }
            if (!groupRecursiveField) {
                throw new Error("Group Fk field not found on which recursion is defined.[" + JSON.stringify(queryGroup) + "]");
            }
            var groupId = queryGroup._id;
            var recursiveField = groupRecursiveField.mainField;
            var replacedRecursiveField = Utils.replaceDotToUnderscore(recursiveField);
            if (Array.isArray(groupId)) {
                var lastGroup = groupId[groupId.length - 1];
                if (!lastGroup || (!lastGroup[recursiveField] && !lastGroup[replacedRecursiveField])) {
                    throw new Error("Group on recursive column is mandatory and must be selected in last.Group Defined [" + JSON.stringify(queryGroup) + "]");
                }
            } else if ((Utils.isJSONObject(groupId) && !groupId[recursiveField] && !groupId[replacedRecursiveField]) || (typeof groupId === "string" && groupId.substring(1) !== recursiveField)) {
                throw new Error("Group on recursive column is mandatory.Group Defined [" + JSON.stringify(queryGroup) + "]");
            }
            query.$moduleInfo.GroupRecursion.recursion = recursionInGroup;
            query.$moduleInfo.GroupRecursion.groupRecursiveField = groupRecursiveField;
            delete queryGroup.$recursion;
        }
    }
}

exports.doResult = function (query, result, collection, db, options) {
    if (result.result.length == 0 || !query.$moduleInfo || !query.$moduleInfo.GroupRecursion) {
        return;
    }
    var mainResult = result.result;
    var recursion = query.$moduleInfo.GroupRecursion.recursion;
    var groupRecursiveField = query.$moduleInfo.GroupRecursion.groupRecursiveField;
    delete query.$moduleInfo;
    var queryGroup = query[Constants.Query.GROUP];
    var groupLength = queryGroup ? (Array.isArray(queryGroup) ? queryGroup.length : 1) : 0;
    var alias = recursion[Constants.Query.Recursion.ALIAS] || "children";
    if (groupRecursiveField) {
        var recursionClone = Utils.deepClone(recursion);
        delete recursion[Constants.Query.Recursion.FILTER];
        delete recursion[Constants.Query.Recursion.SORT];
        delete recursion[Constants.Query.Recursion.ENSURE_FILTER];
        var recursiveQuery = {$collection:groupRecursiveField.collection};
        recursiveQuery[Constants.Query.RECURSION] = recursion;
        recursiveQuery[Constants.Query.FIELDS] = {_id:1};
        if (groupRecursiveField.displayField) {
            recursiveQuery[Constants.Query.FIELDS][groupRecursiveField.displayField] = 1;
        }
        if (groupRecursiveField.otherDisplayFields) {
            var otherDisplayFields = groupRecursiveField.otherDisplayFields;
            for (var i = 0; i < otherDisplayFields.length; i++) {
                recursiveQuery[Constants.Query.FIELDS][otherDisplayFields[i]] = 1;
            }
        }
        if (groupRecursiveField.fields && groupRecursiveField.fields.length > 0) {
            for (var i = 0; i < groupRecursiveField.fields.length; i++) {
                var innerField = groupRecursiveField.fields[i];
                if (innerField.field) {
                    recursiveQuery[Constants.Query.FIELDS][innerField.field] = 1;
                }
            }
        }
        if (query.runOnES) {
            recursiveQuery.runOnES = query.runOnES;
        }
        if (query.$cache) {
            recursiveQuery.$cache = query.$cache;
        }
        return db.query(recursiveQuery).then(function (recursiveResult) {
            var groupMergingLog = undefined;
            if (db.logger) {
                groupMergingLog = db.logger.populateInitialLog("group recursion merging", {"type":"group recursion merging"}, db, true);
            }
            recursiveResult = recursiveResult.result;
            var newRecursiveResult = [];
            var fieldToMatch = Utils.replaceDotToUnderscore(groupRecursiveField.mainField);
            manageRecursiveResult(newRecursiveResult, recursiveResult, recursiveQuery[Constants.Query.FIELDS], fieldToMatch, alias);
            var sTime = new Date();
            var promise = mergeGroupAndRecursionData(mainResult, newRecursiveResult, groupLength, fieldToMatch, recursionClone, alias, recursiveQuery, db);
            if (Q.isPromise(promise)) {
                return promise.then(function () {
                    db.logMongoTime("GroupRecursionMergeCount", (new Date() - sTime), true);
                    if (db.logger) {
                        db.logger.populateFinalLog(db, groupMergingLog, true);
                    }
                })
            } else {
                db.logMongoTime("GroupRecursionMergeCount", (new Date() - sTime), true);
                if (db.logger) {
                    db.logger.populateFinalLog(db, groupMergingLog, true);
                }
            }
        })
    } else {
        var recursiveData = [];
        populateRecursiveData(mainResult, groupLength, recursiveData);
        var recursiveQuery = QueryUtility.getReference(options.query);
        delete recursiveQuery[Constants.Query.GROUP];
        recursiveQuery[Constants.Query.DATA] = recursiveData;
        if (query.runOnES) {
            recursiveQuery.runOnES = query.runOnES;
        }
        if (query.$cache) {
            recursiveQuery.$cache = query.$cache;
        }
        return db.query(recursiveQuery).then(
            function () {
                return rollUpGroupData(mainResult, recursion, groupLength, alias, recursiveQuery, db);
            }).then(function () {
                populateTotalAsValueInGroup(mainResult, recursion[Constants.Query.Recursion.ROLLUP], groupLength);
            })
    }
}

function manageRecursiveResult(newRecursiveResult, recursiveResult, fields, fieldToMatch, alias) {
    for (var i = 0; i < recursiveResult.length; i++) {
        var row = recursiveResult[i];
        var newData = {_id:row._id};
        newData[fieldToMatch] = {};
        for (var k in fields) {
            newData[fieldToMatch][k] = row[k];
        }
        var aliasData = row[alias];
        if (aliasData) {
            newData[alias] = manageRecursiveResult([], aliasData, fields, fieldToMatch, alias);
        }
        newRecursiveResult.push(newData);
    }
    return newRecursiveResult;
}

function mergeGroupAndRecursionData(groupResult, recursionResult, groupCount, fieldToMatch, recursion, alias, query, db) {
    if (groupCount > 1) {
        return Utils.iterateArrayWithPromise(groupResult, function (index, groupRow) {
            var children = groupRow.children;
            if (children && children.length > 0) {
                return mergeGroupAndRecursionData(children, recursionResult, (groupCount - 1), fieldToMatch, recursion, alias, query, db);
            }
        })
    } else {
        var recursiveResultClone = Utils.deepClone(recursionResult);
        var groupResultMap = {};
        for (var i = 0; i < groupResult.length; i++) {
            var row = groupResult[i];
            var recursiveColumnId = row[fieldToMatch] ? row[fieldToMatch]._id : undefined;
            if (recursiveColumnId) {
                groupResultMap[recursiveColumnId] = row;
            }
        }
        mergeRecursiveData(groupResultMap, recursiveResultClone, fieldToMatch, alias);
        groupResultMap = undefined;
        groupResult.splice(0, groupResult.length);
        groupResult.push.apply(groupResult, recursiveResultClone);
        return Recursion.rollupManualRecursiveData(groupResult, recursion, alias, query, db);
    }
}

function mergeRecursiveData(groupResultMap, recursionResult, fieldToMatch, alias) {
    for (var i = 0; i < recursionResult.length; i++) {
        var data = recursionResult[i];
        var aliasData = data[alias];
        if (aliasData && aliasData.length > 0) {
            mergeRecursiveData(groupResultMap, aliasData, fieldToMatch, alias);
        }
        var value = groupResultMap[data._id];
        if (value) {
            for (var k in value) {
                if (k === "_id" || data[k] === undefined) {
                    data[k] = value[k];
                }
            }
        }
        if ((!aliasData || aliasData.length === 0) && !value) {
            recursionResult.splice(i, 1);
            i = i - 1;
        }
    }
}

function rollUpGroupData(result, recursion, groupCount, alias, query, db) {
    for (var i = 0; i < result.length; i++) {
        var row = result[i];
        if (groupCount > 1) {
            var children = row.children;
            if (children && children.length > 0) {
                rollUpGroupData(children, recursion, (groupCount - 1), alias, query, db);
            }
        }
    }
    return Recursion.populateRollupData(result, recursion, alias, query, db);
}


function populateRecursiveData(result, groupCount, recursiveData) {
    for (var i = 0; i < result.length; i++) {
        var children = result[i].children;                //children used for group data in children
        if (children && children.length > 0) {
            if (groupCount > 1) {
                populateRecursiveData(children, (groupCount - 1), recursiveData);
            } else {
                for (var j = 0; j < children.length; j++) {
                    recursiveData.push(children[j]);
                }
            }
        }
    }
}

function populateTotalAsValueInGroup(result, rollUp, groupCount) {
    if (rollUp && groupCount > 0) {
        for (var i = 0; i < result.length; i++) {
            var row = result[i];
            for (var j = 0; j < rollUp.length; j++) {
                var rollupColumn = rollUp[j];
                var exp = undefined;
                if (Utils.isJSONObject(rollupColumn)) {
                    exp = Object.keys(rollupColumn)[0];
                } else {
                    exp = rollupColumn;
                }
                var value = Utils.resolveValue(row, exp);
                if (value && value.total) {
                    Utils.putDottedValue(row, exp, value.total);
                }
                var children = row.children;
                if (children && children.length > 0) {
                    populateTotalAsValueInGroup(children, rollUp, (groupCount - 1));
                }
            }
        }
    }
}