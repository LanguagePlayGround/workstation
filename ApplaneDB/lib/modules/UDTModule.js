var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");

exports.doQuery = function (query, collection, db) {
    if (query[Constants.Query.GROUP] === undefined) {
        return;
    }
    var group = query[Constants.Query.GROUP];
    query.$moduleInfo = query.$moduleInfo || {};
    query.$moduleInfo.UDTModule = query.$moduleInfo.UDTModule || {};
    query.$moduleInfo.UDTModule.group = require("../Utility.js").deepClone(group);
    var fieldInfos = collection.getValue("fieldInfos");
    if (!fieldInfos) {
        return;
    }
    if (Utils.isJSONObject(group)) {
        group = [group];
    }
    var map = {};
    for (var i = 0; i < group.length; i++) {
        handleEachGroup(group[i], fieldInfos, map);
    }
}

exports.doResult = function (query, result, collection) {
    if (!query.$moduleInfo || !query.$moduleInfo.UDTModule || !query.$moduleInfo.UDTModule.group) {
        return;
    }

    var fieldInfos = collection.getValue("fieldInfos");
    if (!fieldInfos) {
        return;
    }
    var group = query.$moduleInfo.UDTModule.group;
    if (Utils.isJSONObject(group)) {
        group = [group];
    }
    modifyResult(group, result.result, fieldInfos);
    delete query.$moduleInfo.UDTModule;
}

function updateAggregateExpression(fieldInfo, aggregateExpression, key, innerKey, group) {
    if (fieldInfo && fieldInfo.type === Constants.Admin.Fields.Type.DURATION) {
        group[key][innerKey] = "$" + aggregateExpression + "." + Constants.Modules.Udt.Duration.CONVERTEDVALUE;
        if (innerKey === "$sum" || innerKey === "$avg") {
            manageSortInGroup(group, key, Constants.Modules.Udt.Duration.CONVERTEDVALUE);
        }
    } else if (fieldInfo && fieldInfo.type === Constants.Admin.Fields.Type.CURRENCY) {
        group[key][innerKey] = "$" + aggregateExpression + "." + Constants.Modules.Udt.Currency.AMOUNT;
        // $addToSet is used in place of $first because in some cases the first record does not hold the value of amount type so we use $addToSet which returns array of unique values.
//        group[key + "_type"] = {"$first":"$" + aggregateExpression + "." + Constants.Modules.Udt.Currency.TYPE};
        group[key + "_type"] = {"$addToSet": "$" + aggregateExpression + "." + Constants.Modules.Udt.Currency.TYPE};
        if (innerKey === "$sum" || innerKey === "$avg") {
            manageSortInGroup(group, key, Constants.Modules.Udt.Currency.AMOUNT);
        }
    }
}

function manageSortInGroup(group, exp, udtField) {
    var groupSort = group.$sort;
    if (groupSort) {
        var newGroupSort = {};
        for (var k in groupSort) {
            var sortValue = groupSort[k];
            if (k === exp + "." + udtField) {
                newGroupSort[exp] = sortValue;
            } else {
                newGroupSort[k] = sortValue;
            }
        }
        group.$sort = newGroupSort;
    }
}

function modifyResult(group, result, fieldInfos) {
    for (var i = 0; i < group.length; i++) {
        for (var key in group[i]) {
            if (Utils.isJSONObject(group[i][key])) {
                for (var innerKey in group[i][key]) {
                    if (innerKey === "$sum" || innerKey === "$avg" || innerKey === "$first" || innerKey === "$addToSet") {
                        var aggregateExpression = group[i][key][innerKey];
                        if (typeof aggregateExpression === Constants.Admin.Fields.Type.STRING) {
                            var index = aggregateExpression.indexOf("$");
                            if (index !== undefined) {
                                aggregateExpression = aggregateExpression.substr(index + 1);
                                var fieldInfo = fieldInfos[aggregateExpression];
                                var targetPath = [];
                                if (fieldInfo && (fieldInfo.type === Constants.Admin.Fields.Type.DURATION || fieldInfo.type === Constants.Admin.Fields.Type.CURRENCY)) {
                                    targetPath.push({field: key, type: "object"});
                                    updateResult(group, i, key, targetPath);
                                    var targetPathClone = require("../Utility.js").deepClone(targetPath);
                                    for (var j = 0; j < result.length; j++) {
                                        var row = result[j];
                                        updateResultFinal(row, targetPathClone, fieldInfo);
                                        if (row.children && row.children.length > 0) {
                                            modifyResult(group, row.children, fieldInfos);
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }
}

function updateResultFinal(result, targetPath, fieldInfo) {
    var length = targetPath.length;
    for (var k = length - 1; k >= 0; k--) {
        var field = targetPath[k].field;
        var type = targetPath[k].type;
        if (type === "array") {
            var clone = require("../Utility.js").deepClone(targetPath);
            if (k === clone.length - 1) {
                clone.splice(k, 1);
            }
            var resultLength = result[field] ? result[field].length : 0;
            for (var i = 0; i < resultLength; i++) {
                updateResultFinal(result[field][i], clone, fieldInfo);
            }
        } else if (type === "object") {
            var value = result[field];
            if (value !== undefined && !Utils.isJSONObject(value) && fieldInfo.type === Constants.Admin.Fields.Type.DURATION) {
                value = {"time": value / 60, unit: Constants.Modules.Udt.Duration.Unit.HRS};
                result[field] = value;
            } else if (value !== undefined && !Utils.isJSONObject(value) && fieldInfo.type === "currency") {
                var type = result[field + "_type"];
                // $addToSet return the value of different type of currencies
                if (Array.isArray(type)) {
                    if (type.length > 0) {
                        type = type[0];
                    } else {
                        type = undefined;
                    }
                }
                delete result[field + "_type"];
                var object = {};
                object.amount = value;
                if (type) {
                    object.type = type;
                }
                result[field] = object;

            }
        }
    }
}

function checkInObject(groupKey, toFind, previousFieldsArray, targetPath) {
    for (var k in groupKey) {
        if (Utils.isJSONObject(groupKey[k])) {
            previousFieldsArray.push(k)
            checkInObject(groupKey[k], toFind, previousFieldsArray, targetPath);
        } else {
            if (Utils.deepEqual(groupKey[k], toFind)) {
                if (k === "$sum" || k === "$avg" || k === "$first" || k === "$addToSet") {
                    var last = targetPath[targetPath.length - 1];
                    last.field = previousFieldsArray[0];
                } else {
                    var last = targetPath[targetPath.length - 1];
                    last.field = k;
                    targetPath.push({field: previousFieldsArray[0], type: "array"});
                }
            }
        }
    }
}

function checkNextImmedaiteGroup(group, toFind, targetPath) {
    for (var k in group) {
        if (Utils.isJSONObject(group[k])) {
            checkInObject(group[k], toFind, [k], targetPath);
        }
    }
}

function updateResult(group, index, toFind, targetPath) {
    var length = targetPath.length;
    index = index + 1;
    checkNextImmedaiteGroup(group[index], "$" + toFind, targetPath);
    index = index + 1;
    if (group[index] !== undefined) {
        checkNextImmedaiteGroup(group[index], "$" + targetPath[targetPath.length - 1].field, targetPath);
    }
}

function handleEachGroup(group, fieldInfos, map) {
    for (var key in group) {
        if (Utils.isJSONObject(group[key])) {
            for (var innerKey in group[key]) {
                if (innerKey === "$sum" || innerKey === "$avg" || innerKey === "$first") {
                    var aggregateExpression = group[key][innerKey];
                    if (typeof aggregateExpression === Constants.Admin.Fields.Type.STRING) {
                        var index = aggregateExpression.indexOf("$");
                        if (index === 0) {
                            aggregateExpression = aggregateExpression.substr(index + 1);
                            var fieldInfo = fieldInfos[aggregateExpression];
                            if (fieldInfo && (fieldInfo.type === Constants.Admin.Fields.Type.DURATION || fieldInfo.type === Constants.Admin.Fields.Type.CURRENCY) && map[aggregateExpression] === undefined) {
                                updateAggregateExpression(fieldInfo, aggregateExpression, key, innerKey, group);
                                map[aggregateExpression] = 1;
                            }
                        }
                    }
                }

            }
        }
    }
}




