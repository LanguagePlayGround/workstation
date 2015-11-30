/**
 * Created by Manjeet on 7/9/14.
 */

var Constants = require("../Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");


exports.doQuery = function (query, collection, db) {
    var fieldInfos = collection.getValue("UEFields");
    if (!fieldInfos) {
        return;
    }
    var queryFields = query.$fields || {};
    var keys = Object.keys(queryFields);
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var fieldInfo = fieldInfos[key];
        if (fieldInfo && fieldInfo.type === Constants.Admin.Fields.Type.OBJECT && fieldInfo.query) {
            var fieldQuery = JSON.parse(fieldInfo.query);
            if (fieldQuery.$type === "ue") {
                ensureFields(queryFields, fieldQuery.$fields);
                delete queryFields[key];
                if (fieldQuery.$function) {
                    query.$moduleInfo = query.$moduleInfo || {};
                    query.$moduleInfo.UEModule = query.$moduleInfo.UEModule || {}
                    query.$moduleInfo.UEModule[key] = fieldQuery.$function;
                }

            }
        }
    }
}

exports.doResult = function (query, result, collection, db) {
    if (result.result.length === 0 || !query.$moduleInfo || !query.$moduleInfo.UEModule) {
        return;
    }
    var UEModule = query.$moduleInfo.UEModule;
    delete query.$moduleInfo.UEModule
    var mainResult = result.result;
    var keys = Object.keys(UEModule);
    return Utils.iterateArrayWithPromise(keys,
        function (index, key) {
            var loadedFunction = db.loadFunction(UEModule[key]);
            if (Q.isPromise(loadedFunction)) {
                return loadedFunction.then(function (loadFunction) {
                    return executeLoadedFunction(loadFunction, mainResult, key, db);
                })
            } else {
                return executeLoadedFunction(loadedFunction, mainResult, key, db);
            }
        })
}

function executeLoadedFunction(loadedFunction, result, key, db) {
    if (loadedFunction) {
        return Utils.iterateArrayWithPromise(result, function (index, row) {
            var loadedFunctionResult = db.executeLoadedFunction(loadedFunction, [row], db);
            if (Q.isPromise(loadedFunctionResult)) {
                return loadedFunctionResult.then(function (value) {
                    row[key] = value;
                });
            } else {
                row[key] = loadedFunctionResult
            }
        })
    }
}

function ensureFields(queryFields, fieldsToEnsure) {
    fieldsToEnsure = fieldsToEnsure || {};
    if (queryFields) {
        for (var key in fieldsToEnsure) {
            var newKey = key + ".";
            var found = false;
            for (var k in queryFields) {
                if (k.indexOf(newKey) == 0) {
                    found = true;
                    break;
                }
            }
            if (!found) {
                queryFields[key] = 1;
            }

        }
    }
}