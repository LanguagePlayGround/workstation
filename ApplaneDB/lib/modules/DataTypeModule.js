/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 28/5/14
 * Time: 10:15 AM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");
var dataTypeModules = {};

exports.doQuery = function (query, collection, db) {
    var filter = query.$filter;
    if (!filter) {
        return;
    }
    var fieldInfos = collection.getValue("fieldInfos");
    if (!fieldInfos) {
        return;
    }
    var options = {};
    options.collectionName = collection.mongoCollection.collectionName;
    castFilter(filter, fieldInfos, options);
}

exports.onValue = function (event, document, collection, db, options) {
    var updatedFieldInfo = options.updatedFieldInfo;
    if (!updatedFieldInfo) {
        throw new Error("updatedFieldInfo must be available");
    }
    var value = undefined;
    var toSet = true;
    if (document.getDocuments(updatedFieldInfo.field) !== undefined) {
        value = document.getDocuments(updatedFieldInfo.field);
        toSet = false;
    } else {
        value = document.get(updatedFieldInfo.field);
    }
    if (value !== undefined && value !== null) {
        var dataType = getType(updatedFieldInfo.type);
        options.collectionName = collection.mongoCollection.collectionName;
        var castValue = dataType.cast(value, updatedFieldInfo.field, options);
        if (toSet) {
            if (document.isInInc(updatedFieldInfo.field)) {
                document.inc(updatedFieldInfo.field, castValue);
            } else {
                document.set(updatedFieldInfo.field, castValue);
            }
        }
    }
}

function castFilter(filter, fieldInfos, options) {
    var keys = Object.keys(filter);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var value = filter[key];
        if (value) {
            if (key === "$or" || key === "$and") {
                for (var j = 0; j < value.length; j++) {
                    castFilter(value[j], fieldInfos, options);
                }
            } else {
                var field = fieldInfos[key];
                if (field) {
                    options.updatedFieldInfo = field;
                    var type = field.type;
                    if (type && type !== "fk") {
                        var dataType = getType(type);
                        if (dataType) {
                            if (Utils.isJSONObject(value)) {
                                for (var innerKey in value) {
                                    if (innerKey === "$in" || innerKey === "$nin") {
                                        if (Array.isArray(value[innerKey])) {
                                            for (var j = 0; j < value[innerKey].length; j++) {
                                                value[innerKey][j] = dataType.cast(value[innerKey][j], key, options);
                                            }
                                        }
                                    } else if (innerKey === "$exists") {
                                        value[innerKey] = getType("boolean").cast(value[innerKey], key, options);
                                    } else if (innerKey === "$regex" && field.toLowerCase && value[innerKey]) {
                                        delete filter[key];
                                        filter[key + "_lower"] = {"$regex":value[innerKey].toString().toLowerCase()};
                                    } else {
                                        value[innerKey] = dataType.cast(value[innerKey], key, options);
                                    }
                                }
                            } else {
                                filter[key] = dataType.cast(value, key, options);
                            }
                        }
                    }
                }
            }
        }
    }
}

function getType(type) {
    if (type == "date") {
        return getModule("./datatypes/Date.js");
    }
    if (type == "boolean") {
        return getModule("./datatypes/Boolean.js");
    }
    if (type == "number") {
        return getModule("./datatypes/Number.js");
    }
    if (type == "integer") {
        return getModule("./datatypes/Integer.js");
    }
    if (type == "decimal") {
        return getModule("./datatypes/Decimal.js");
    }
    if (type == "string" || type === "sequence") {
        return getModule("./datatypes/String.js");
    }
    if (type == "json") {
        return getModule("./datatypes/Json.js");
    }
    if (type == "duration") {
        return getModule("./datatypes/Duration.js");
    }
    if (type == "objectid") {
        return getModule("./datatypes/ObjectId.js");
    }
    if (type == "emailid") {
        return getModule("./datatypes/EmailId.js");
    }
    if (type == "phonenumber") {
        return getModule("./datatypes/PhoneNumber.js");
    }
}

function getModule(path) {
    if (dataTypeModules[path]) {
        return dataTypeModules[path];
    } else {
        var module = require(path);
        dataTypeModules[path] = module;
        return module;
    }
}