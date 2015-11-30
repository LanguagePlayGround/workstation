var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");
var Utility = require("../Utility.js");
var SELF = require("./Recursion.js");
var Q = require("q");

exports.doQuery = function (query) {
    if (!query[Constants.Query.RECURSION] || (query[Constants.Query.RECURSION][Constants.Query.Recursion.LEVEL] !== undefined && query[Constants.Query.RECURSION][Constants.Query.Recursion.LEVEL] < 1)) {
        return;
    }
    query[Constants.Query.RECURSION][Constants.Query.Recursion.COUNTER] = query[Constants.Query.RECURSION][Constants.Query.Recursion.COUNTER] || 0;
    if (query[Constants.Query.RECURSION][Constants.Query.Recursion.COUNTER] > 25) {
        throw new Error("Too Many Recursion levels found.");
    }
    generateRecursiveQuery(query);
}

exports.doResult = function (query, result, collection, db) {
    if (result.result.length == 0 || !query.$moduleInfo || !query.$moduleInfo.Recursion || !query.$moduleInfo.Recursion.recursion) {
        return;
    }
    var mainResult = result.result;
    var recursionInfo = query.$moduleInfo.Recursion;
    delete query.$moduleInfo.Recursion;
    var queryRecursion = recursionInfo.recursion;
    var alias = queryRecursion[Constants.Query.Recursion.ALIAS] || "children";
    var rootFilter = queryRecursion[Constants.Query.Recursion.ROOT_FILTER];
    if (rootFilter === false) {
        //populate data in recursive format.Require for left side filter on tasks for project and want to show data of project in recursive format without any root filter.
        //Currently rollup data in not supported here.
        mainResult = getManualRecursiveData(mainResult, recursionInfo.recursiveField, alias);
        result.result = mainResult;
        return SELF.rollupManualRecursiveData(mainResult, queryRecursion, alias, query, db);
    } else {
        return SELF.populateRollupData(mainResult, queryRecursion, alias, query, db);
    }
}

exports.rollupManualRecursiveData = function (result, recursion, alias, query, db) {
    var p = Utils.iterateArrayWithoutPromise(result,
        function (index, row) {
            if (row[alias] && row[alias].length > 0) {
                return SELF.rollupManualRecursiveData(row[alias], recursion, alias, query, db);
            }
        })
    if (Q.isPromise(p)) {
        return p.then(function () {
            return SELF.populateRollupData(result, recursion, alias, query, db);
        })
    } else {
        return SELF.populateRollupData(result, recursion, alias, query, db);
    }
}

function sortRecursiveData(result, sortInRecursion) {
    var sortKeys = sortInRecursion ? Object.keys(sortInRecursion) : undefined;
    if (sortKeys && sortKeys.length > 0) {
        if (sortKeys.length > 1) {
            throw new Error("Sort in recursion is defined only on single field.Sort Defined is [" + JSON.stringify(sortInRecursion) + "]");
        }
        var sortKey = sortKeys[0];
        var sortType = sortInRecursion[sortKey] === -1 ? "desc" : "asc";
        Utils.sort(result, sortType, sortKey);
    }
}

function getManualRecursiveData(result, recursiveField, alias) {
    var indexes = {};
    var newData = [];
    for (var i = 0; i < result.length; i++) {
        indexes[result[i]._id] = i
    }
    for (var i = 0; i < result.length; i++) {
        var record = result[i];
        var recursiveFieldValue = record[recursiveField];
        if (Array.isArray(recursiveFieldValue)) {
            for (var j = 0; j < recursiveFieldValue.length; j++) {
                addRecursiveData(newData, result, record, indexes, recursiveFieldValue[j], alias);
            }
        } else {
            addRecursiveData(newData, result, record, indexes, recursiveFieldValue, alias);
        }
    }
    return newData;
}

function addRecursiveData(newData, result, record, indexes, recursiveFieldValue, alias) {
    var recursiveFieldId = recursiveFieldValue ? recursiveFieldValue._id : undefined;
    var recursiveFieldIndex = recursiveFieldId ? indexes[recursiveFieldId] : undefined;
    if (recursiveFieldIndex === undefined) {
        if (Utils.isExists(newData, record, "_id") === undefined) {
            newData.push(record);
        }
    } else {
        var parentData = result[recursiveFieldIndex];
        parentData[alias] = parentData[alias] || [];
        parentData[alias].push(record);
    }
}

exports.repopulateRecursiveData = function (data, recursion, alias, memoryFilter) {
    var rollUp = recursion[Constants.Query.Recursion.ROLLUP];
    var ensureFilter = recursion[Constants.Query.Recursion.ENSURE_FILTER];
    var resolvedFilterParameter = recursion[Constants.Query.Recursion.RESOLVED_FILTER_PARAMETER] || "__validFilter";
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        if (rollUp && rollUp.length > 0) {
            rollupDataRowWise(row, rollUp, alias);
        }
        var removeRecord = resolveMemoryFilter(row, alias, memoryFilter, ensureFilter, resolvedFilterParameter);
        if (removeRecord) {
            data.splice(i, 1);
            i = i - 1;
        }
    }
    var sortInRecursion = recursion[Constants.Query.Recursion.SORT];
    sortRecursiveData(data, sortInRecursion);
}

exports.populateRollupData = function (result, recursion, alias, query, db) {
    populateRecursiveFieldsData(recursion, result);
    var rollupLog = undefined;
    if (db && db.logger) {
        rollupLog = db.logger.populateInitialLog("Roll Up data in recursion", {resultCount:result.length}, db, true);
    }
    var sTime = new Date();
    var memoryFilter = recursion[Constants.Query.Recursion.FILTER];
    if (memoryFilter) {
        return getResolvedMemoryFilter(memoryFilter, query, db).then(function (resolvedMemoryFilter) {
            SELF.repopulateRecursiveData(result, recursion, alias, resolvedMemoryFilter);
            db.logMongoTime("RollupRecursionCount", (new Date() - sTime), true);
            if (db.logger) {
                db.logger.populateFinalLog(db, rollupLog, true);
            }
        })
    } else {
        SELF.repopulateRecursiveData(result, recursion, alias, memoryFilter);
        if (db) {
            db.logMongoTime("RollupRecursionCount", (new Date() - sTime), true);
            if (db.logger) {
                db.logger.populateFinalLog(db, rollupLog, true);
            }
        }
    }
}

function getResolvedMemoryFilter(memoryFilter, query, db) {
    var newQuery = {$collection:query.$collection, $filter:memoryFilter, $modules:{Role:0}};
    newQuery.$requireResolveFilter = true;
    newQuery.$data = [];
    newQuery.$parameters = query.$parameters;
    return db.query(newQuery).then(function (result) {
        var resolvedFilter = result.resolvedFilter;
        Utils.convert_IdToObjectIdInFilter(resolvedFilter);
        return resolvedFilter;
    })
}

function resolveMemoryFilter(row, alias, memoryFilter, ensureFilter, resolvedFilterParameter) {
    if (memoryFilter && Object.keys(memoryFilter).length > 0) {
        var valid = Utils.evaluateFilter(memoryFilter, row);
        row[resolvedFilterParameter] = valid ? true : false;
        if (!valid && (ensureFilter || !row[alias] || row[alias].length === 0)) {
            return true;
        }
    }
}

function rollupDataRowWise(row, rollUp, alias) {
    for (var i = 0; i < rollUp.length; i++) {
        var rollupColumn = rollUp[i];
        var rollupColumnInfo = undefined;
        if (Utils.isJSONObject(rollupColumn)) {
            rollupColumn = Object.keys(rollUp[i])[0];
            rollupColumnInfo = rollUp[i][rollupColumn];
        }
        rollUpData(row, rollupColumn, rollupColumnInfo);
        var aliasValues = row[alias] || [];
        for (var k = 0; k < aliasValues.length; k++) {
            rollupChildrenData(row, aliasValues[k], rollupColumn, rollupColumnInfo);
        }
    }
}

function rollUpData(row, rollUpColumn, rollupColumnInfo) {
    var indexOf = rollUpColumn.indexOf(".");
    if (indexOf > 0) {
        var firstPart = rollUpColumn.substring(0, indexOf);
        var nextPart = rollUpColumn.substring(indexOf + 1);
        var data = row[firstPart];
        if (Array.isArray(data)) {
            for (var i = 0; i < data.length; i++) {
                rollUpData(data[i], nextPart, rollupColumnInfo);
            }
        } else if (Utils.isJSONObject(data)) {
            rollUpData(data, nextPart, rollupColumnInfo);
        }
    } else {
        var value = Utils.resolveValue(row, rollUpColumn);
        if (value !== undefined) {
            if (Utils.isJSONObject(value) && value.self !== undefined) {
                // Same Refrence used in case of root filter false.If person exist in two children,then it is already roll up by first one and in second time we found json to that value.
                // So need to roll up that value again by putting value.self corrensponds to that value.
                value = value.self;
            }
            Utils.putDottedValue(row, rollUpColumn, {self:rollupColumnInfo ? Utility.deepClone(value) : value, total:rollupColumnInfo ? Utility.deepClone(value) : value});
        }
    }
}

function rollupChildrenData(row, childRow, rollUpColumn, rollupColumnInfo) {
    var indexOf = rollUpColumn.indexOf(".");
    if (indexOf > 0) {
        var firstPart = rollUpColumn.substring(0, indexOf);
        var nextPart = rollUpColumn.substring(indexOf + 1);
        var childData = childRow[firstPart];
        if (childData) {
            if (Array.isArray(childData)) {
                row[firstPart] = row[firstPart] || [];
                for (var i = 0; i < childData.length; i++) {
                    var innerData = {_id:childData[i]._id};
                    var childDataExists = Utils.isExists(row[firstPart], childData[i], "_id");
                    if (childDataExists !== undefined) {
                        innerData = row[firstPart][childDataExists];
                    } else {
                        row[firstPart].push(innerData);
                    }
                    rollupChildrenData(innerData, childData[i], nextPart, rollupColumnInfo);
                }
            } else if (Utils.isJSONObject(childData)) {
                row[firstPart] = row[firstPart] || {};
                rollupChildrenData(row[firstPart], childData, nextPart, rollupColumnInfo);
            }
        }
    } else {
        var childRollUpValue = childRow[rollUpColumn];
        if (childRollUpValue) {
            var rollupValueSelf = childRollUpValue.self;
            var rollupValueChildren = childRollUpValue.children;
            var rowRollUpValue = row[rollUpColumn];
            var childrenValue = rowRollUpValue ? rowRollUpValue.children : undefined;
            if (rollupColumnInfo) {
                childrenValue = rollupInnerData(rollupColumnInfo, childrenValue, rollupValueSelf, rollupValueChildren);
            } else {
                if ((childrenValue && Utils.isJSONObject(childrenValue)) || (rollupValueSelf && Utils.isJSONObject(rollupValueSelf)) || (rollupValueChildren && Utils.isJSONObject(rollupValueChildren))) {
                    throw new Error("Rollup can be defined only number type column.Rollup Column [" + rollUpColumn + "]");
                }
                childrenValue = (childrenValue || 0) + (rollupValueSelf || 0) + (rollupValueChildren || 0);
            }
            if (childrenValue) {
                Utils.putDottedValue(row, rollUpColumn + ".children", childrenValue);
                var value = Utils.resolveValue(row, rollUpColumn);
                if (rollupColumnInfo) {
                    value.total = rollupInnerData(rollupColumnInfo, undefined, value.self, value.children);
                } else {
                    value.total = (value.self || 0) + value.children;
                }
            }
        }
    }
}

function rollupInnerData(rollupInfo, childValue, innerSelfValue, innerChildrenValue) {
    for (var exp in rollupInfo) {
        var innerValue = rollupInfo[exp];
        if (Utils.isJSONObject(innerValue)) {
            var innerValueKey = Object.keys(innerValue)[0];
            var innerValueToGet = innerValue[innerValueKey];
            if (innerValueToGet && typeof innerValueToGet === "string" && innerValueToGet.indexOf("$") === 0) {
                innerValueToGet = innerValueToGet.substring(1);
            }
            var valueToPut = undefined;
            var childVal = Utils.resolveValue(childValue, exp);
            var innerSelfVal = Utils.resolveValue(innerSelfValue, exp);
            var innerChildVal = Utils.resolveValue(innerChildrenValue, exp);
            if (innerValueKey === "$sum") {
                valueToPut = (childVal || 0) + (innerSelfVal || 0) + (innerChildVal || 0);
            } else if (innerValueKey === "$first") {
                valueToPut = childVal || innerSelfVal || innerChildVal;
            }
            if (valueToPut !== undefined) {
                childValue = childValue || {};
                childValue[exp] = valueToPut;
            }
        }
    }
    return childValue;
}

function addRecursiveFieldInQuery(query, recursiveField) {
    var fields = query.$fields;
    if (!fields || Object.keys(fields).length == 0) {
        return;
    }
    var include = undefined;
    for (var k in fields) {
        if (fields[k] === 0 || fields[k] === 1) {
            include = fields[k];
            break;
        }
    }
    if (include === undefined) {
        return;
    }
    for (var k in fields) {
        if (k.indexOf(recursiveField + ".") === 0) {
            delete fields[k];
        }
    }
    if (include && !fields[recursiveField]) {
        fields[recursiveField] = 1;
    } else if (!include && fields[recursiveField]) {
        delete fields[recursiveField];
    }
}

function generateRecursiveQuery(query) {
    query.$moduleInfo = query.$moduleInfo || {};
    query.$moduleInfo.Recursion = query.$moduleInfo.Recursion || {};
    query.$moduleInfo.Recursion.recursion = query[Constants.Query.RECURSION];
    delete query[Constants.Query.RECURSION];

    var queryRecursion = Utility.deepClone(query.$moduleInfo.Recursion.recursion);
    var rootFilter = queryRecursion[Constants.Query.Recursion.ROOT_FILTER];
    delete queryRecursion[Constants.Query.Recursion.ROOT_FILTER];
    var recursiveColumn = undefined;
    var recursiveColumnValue = undefined;
    for (var column in queryRecursion) {
        if (column.indexOf("$") !== 0) {
            recursiveColumn = column;
            recursiveColumnValue = queryRecursion[recursiveColumn];
            break;
        }
    }
    query.$moduleInfo.Recursion.recursiveField = recursiveColumn;
    query.$moduleInfo.Recursion.recursiveFieldValue = recursiveColumn;
    if (rootFilter === false) {
        // if root filter is false,then do not need to add subquery or validate recursion.Required for left side filter for projects on view to get all data without any root filter or filter on recursive field.
        addRecursiveFieldInQuery(query, recursiveColumn);
        return;
    }
    var queryFilter = Utility.deepClone(query[Constants.Query.FILTER]);
    if (!isRecursiveColumnFilter(queryFilter, recursiveColumn) && (!rootFilter || Object.keys(rootFilter).length === 0)) {
        throw new Error("Either rootFilter Or Filter on recursive column is mandatory.");
    }
    var childQuery = {};
    childQuery[Constants.Query.COLLECTION] = query[Constants.Query.COLLECTION];
    childQuery[Constants.Query.FIELDS] = Utility.deepClone(query[Constants.Query.FIELDS]);
    var childDataFilter = {};
    for (var exp in queryFilter) {
        if (exp.indexOf(recursiveColumn) !== 0) {
            childDataFilter[exp] = queryFilter[exp];
        }
    }
    childQuery[Constants.Query.FILTER] = childDataFilter;
    if (queryRecursion[Constants.Query.Recursion.LEVEL]) {
        queryRecursion[Constants.Query.Recursion.LEVEL] = queryRecursion[Constants.Query.Recursion.LEVEL] - 1;
    }
    queryRecursion[Constants.Query.Recursion.COUNTER] = queryRecursion[Constants.Query.Recursion.COUNTER] + 1;
    childQuery[Constants.Query.RECURSION] = queryRecursion;
    childQuery[Constants.Query.PARAMETERS] = query[Constants.Query.PARAMETERS];
    childQuery[Constants.Query.UNWIND] = query[Constants.Query.UNWIND];
    childQuery[Constants.Query.SORT] = query[Constants.Query.SORT];
    childQuery[Constants.Query.CHILDS] = query[Constants.Query.CHILDS];
    childQuery[Constants.Query.MODULES] = query[Constants.Query.MODULES];
    childQuery[Constants.Query.EVENTS] = query[Constants.Query.EVENTS];

    var childData = {};
    //always show recursionDataAlias data in array format..
    childData[Constants.Query.Fields.TYPE] = "n-rows";
    childData[Constants.Query.Fields.ENSURE] = queryRecursion[Constants.Query.Recursion.ENSURE];
    childData[Constants.Query.Fields.QUERY] = childQuery;
    childData[Constants.Query.Fields.FK] = recursiveColumn;
    childData[Constants.Query.Fields.PARENT] = recursiveColumnValue;
    query[Constants.Query.FIELDS] = query[Constants.Query.FIELDS] || {};
    query[Constants.Query.FIELDS][queryRecursion[Constants.Query.Recursion.ALIAS] || "children"] = childData;
    addRootFilter(rootFilter, query);
}

function addRootFilter(rootFilter, query) {
    if (rootFilter && Object.keys(rootFilter).length > 0) {
        if (query[Constants.Query.FILTER]) {
            query[Constants.Query.FILTER].$and = query[Constants.Query.FILTER].$and || [];
            query[Constants.Query.FILTER].$and.push(rootFilter);
        } else {
            query[Constants.Query.FILTER] = rootFilter;
        }
    }
}

function isRecursiveColumnFilter(queryFilter, recursiveColumn) {
    if (queryFilter) {
        for (var key in queryFilter) {
            if (key.indexOf(recursiveColumn) === 0) {
                return true;
            }
        }
    }
}

function populateRecursiveFieldsData(queryRecursion, result) {
    var recursiveFields = getRecursiveFields(queryRecursion);
    if (!recursiveFields || recursiveFields.length === 0) {
        return;
    }
    var alias = queryRecursion[Constants.Query.Recursion.ALIAS] || "children";
    for (var i = 0; i < recursiveFields.length; i++) {
        var recursiveField = recursiveFields[i];
        for (var j = 0; j < result.length; j++) {
            var row = result[j];
            var aliasValue = row[alias];
            if (recursiveField.property === "sum") {
                var sum = 0;
                var recursiveFieldValue = recursiveField.value;
                if (typeof recursiveFieldValue === "string" && recursiveFieldValue.indexOf("$") === 0) {
                    var fieldName = recursiveFieldValue.substring(1);
                    sum = populateSum(fieldName, aliasValue);
                } else {
                    sum = aliasValue ? aliasValue.length : 0;
                }
                if (sum > 0) {
                    row[recursiveField.field] = sum;
                }
            }
        }
    }
}

function populateSum(fieldName, aliasValue) {
    var sum = 0;
    var aliasValueLength = aliasValue ? aliasValue.length : 0;
    for (var i = 0; i < aliasValueLength; i++) {
        var row = aliasValue[i];
        var value = Utils.resolveValue(row, fieldName);
        sum += (value || 0);
    }
    return sum;
}

function getRecursiveFields(queryRecursion) {
    var keys = Object.keys(queryRecursion);
    var recursiveFields = [];
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = queryRecursion[key];
        if (Utils.isJSONObject(value)) {
            if (value.$sum !== undefined) {
                recursiveFields.push({field:key, property:"sum", value:value.$sum});
            }
        }
    }
    return recursiveFields;
}