var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");

exports.doQuery = function (query, collection) {
    var queryGroup = query[Constants.Query.GROUP];
    if (!queryGroup) {
        return;
    }
    var fieldInfos = collection.getValue("fieldInfos");
    if (queryGroup.$fields !== undefined && queryGroup.$fields === false) {
        delete queryGroup.$fields;
        delete query[Constants.Query.FIELDS];
    } else if (Array.isArray(queryGroup) && queryGroup.length > 0 && queryGroup[0].$fields !== undefined && queryGroup[0].$fields === false) {
        for (var i = 0; i < queryGroup.length; i++) {
            delete queryGroup[i].$fields;
        }
        delete query[Constants.Query.FIELDS];
    } else if (query[Constants.Query.FIELDS]) {
        if (Array.isArray(queryGroup)) {
            throw new Error("Array of group is not supported if field is defined.Query [" + JSON.stringify(query) + "]");
        }
        var fields = query[Constants.Query.FIELDS];
        if (Object.keys(fields).length > 0) {
            populateChildren(fields, query);
        }
        delete query[Constants.Query.FIELDS];
    }
    if (Array.isArray(queryGroup)) {
        for (var i = 0; i < queryGroup.length; i++) {
            if (Array.isArray(queryGroup[i]._id)) {
                throw new Error("Array of _id is not supported in group Array.");
            }
        }
    } else {
        var groupId = queryGroup._id;
        if (Array.isArray(groupId)) {
            var groupArray = [];
            populateGroup(fieldInfos, groupId, query, groupArray);
            query[Constants.Query.GROUP] = groupArray;
        } else if (Utils.isJSONObject(groupId)) {
            for (var key in groupId) {
                if (isFkColumn(fieldInfos, groupId[key])) {
                    groupId[key] = groupId[key] + "._id";
                }
            }
        } else {
            if (isFkColumn(fieldInfos, groupId)) {
                query[Constants.Query.GROUP]._id = groupId + "._id";
            }
        }
    }
}

function populateGroup(fieldInfos, groupId, query, groupArray) {
    var groupIdLength = groupId.length;
    var idObject = {};
    for (var i = 0; i < groupId.length; i++) {
        var groupOn = groupId[i];
        var key = Object.keys(groupOn)[0];
        if (isFkColumn(fieldInfos, groupOn[key])) {
            idObject[key] = groupOn[key] + "._id";
        } else {
            idObject[key] = groupOn[key];
        }
    }
    query[Constants.Query.GROUP]._id = idObject;
    groupArray.push(query[Constants.Query.GROUP]);
    var prevGroup = groupArray[groupArray.length - 1];
    for (var i = 1; i < groupIdLength; i++) {
        var key = Object.keys(groupId[groupIdLength - i])[0];
        var nestedGroup = {};
        for (var exp in prevGroup) {
            if (exp == key) {
                continue;
            }
            if (exp == Constants.Query.FILTER || exp == Constants.Query.SORT) {
                nestedGroup[exp] = prevGroup[exp];
            } else if (exp == "children") {
                var children = {};
                children._id = "$_id." + key;
                children[key] = "$" + key;
                children.children = "$children";
                for (var prevGroupExp in prevGroup) {
                    var prevGroupVal = prevGroup[prevGroupExp]
                    if (prevGroupVal.$first || prevGroupVal.$sum || prevGroupVal.$min || prevGroupVal.$max || prevGroupVal.$avg || prevGroupVal.$addToSet) {
                        children[prevGroupExp] = "$" + prevGroupExp;
                    }
                }
                nestedGroup.children = {$push:children};
            } else if (exp == "_id") {
                var prevGroupId = prevGroup._id;
                var nestedGroupId = {};
                for (var exp in prevGroupId) {
                    if (exp != key) {
                        nestedGroupId[exp] = "$_id." + exp;
                    }
                }
                if (Object.keys(nestedGroupId).length == 1) {
                    nestedGroup._id = nestedGroupId[Object.keys(nestedGroupId)[0]];
                } else {
                    nestedGroup._id = nestedGroupId;
                }
            } else {
                var nestedGroupExpObj = {};
                var prevGroupKey = Object.keys(prevGroup[exp])[0];
                // $addToSet will be pushed as $first in next group, required for currency module, currency type is getting added by $addToSet
                if (prevGroupKey === "$addToSet") {
                    prevGroupKey = "$first";
                }
                nestedGroupExpObj[prevGroupKey] = "$" + exp;
                nestedGroup[exp] = nestedGroupExpObj;
            }
        }
        groupArray.push(nestedGroup);
        prevGroup = nestedGroup;
    }
}

function isFkColumn(fieldInfos, field) {
    if (!fieldInfos) {
        return false;
    }
    if (field && typeof field === "string") {
        var fieldDef = fieldInfos[field.substring(1)];
        if (fieldDef && fieldDef[Constants.Admin.Fields.TYPE] === Constants.Admin.Fields.Type.FK) {
            return true;
        }
    }
}

function populateChildren(fields, query) {
    var newField = {};
    newField._id = "$_id";
    for (var exp in fields) {
        var value = fields[exp];
        if (value) {
            if (typeof value === "string" && value.indexOf("$") === 0) {
                newField[Utils.replaceDotToUnderscore(exp)] = value;
            } else {
                newField[Utils.replaceDotToUnderscore(exp)] = "$" + exp;
            }
        }
    }
    var children = {$push:newField};
    query[Constants.Query.GROUP].children = children;
}