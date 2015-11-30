var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");

exports.doQuery = function (query, collection, db) {
    var userSortingField = collection.getValue("userSorting");
    if (!userSortingField) {
        return;
    }
    var fieldInfos = collection.getValue("fieldInfos");
    if (!fieldInfos) {
        return;
    }
    var fieldDef = fieldInfos[userSortingField];
    if (fieldDef && fieldDef[Constants.Admin.Fields.TYPE] === Constants.Admin.Fields.Type.NUMBER) {
        var sort = query.$sort || {};
        var keys = Object.keys(sort);
        if (keys && keys.length > 0) {
            var lastSortValue = sort[keys[keys.length - 1]];
            sort[userSortingField] = lastSortValue;
            query.$sort = sort;
        }
    }
}


exports.onPreSave = function (event, document, collection, db, option) {
    var userSortingField = document.type === "insert" ? collection.getValue("userSorting") : undefined;
    if (!userSortingField) {
        return;
    }
    var fieldInfos = collection.getValue("fieldInfos");
    if (!fieldInfos) {
        return;
    }
    var fieldDef = fieldInfos[userSortingField];
    if (fieldDef && fieldDef[Constants.Admin.Fields.TYPE] === Constants.Admin.Fields.Type.NUMBER) {
        if (document.get(fieldDef[Constants.Admin.Fields.FIELD]) === undefined) {
            document.set(fieldDef[Constants.Admin.Fields.FIELD], new Date().getTime());
        }
    }
}