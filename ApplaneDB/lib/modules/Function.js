/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 17/4/14
 * Time: 12:39 PM
 * To change this template use File | Settings | File Templates.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");
var Self = require("./Function.js");
var Functions = require("../Functions.js");
var keys = ["$ne", "$in", "$nin", "$gt", "$gte", "$lt", "$lte", "$all","$near","$geometry", "coordinates"];
var Q = require("q");

exports.doQuery = function (query, collection, db) {
    if (!query[Constants.Query.FILTER]) {
        return;
    }
    var filter = query[Constants.Query.FILTER];
    var parameters = query[Constants.Query.PARAMETERS] || {};
    var collectionName = collection.getValue(Constants.Admin.Collections.COLLECTION);
    return Self.populateFilter(filter, parameters, db, {collection:collectionName, $parameters:parameters});
}

exports.populateFilter = function (filter, parameters, db, options) {
    parameters = parameters || {};
    options = options || {};
    options.filterInfo = options.filterInfo || {};
    if (!filter) {
        return;
    }
    resolveParametersInFilter(filter, parameters);
    return Self.resolveFilterAsFunction(filter, parameters, db, options);
}

function resolveParametersInFilter(filter, parameters) {
    for (var key in filter) {
        var filterValue = filter[key];
        if (filterValue) {
            if (key == Constants.Query.Filter.OR || key == Constants.Query.Filter.AND) {
                for (var i = 0; i < filterValue.length; i++) {
                    resolveParametersInFilter(filterValue[i], parameters);
                }
            } else {
                if (Utils.isJSONObject(filterValue)) {
                    for (var filterKey in filterValue) {
                        if (keys.indexOf(filterKey) !== -1) {
                            var innerValue = filterValue[filterKey];
                            if (Utils.isJSONObject(innerValue)) {
                                resolveParametersInFilter(innerValue, parameters);
                            } else if (typeof innerValue === "string" && innerValue.indexOf("$") == 0 && innerValue.indexOf("$$") !== 0) {
                                var parameterValue = Utils.resolveValue(parameters, innerValue.substring(1));
                                filterValue[filterKey] = parameterValue;
                            }
                        }
                    }
                } else if (typeof filterValue === "string" && filterValue.indexOf("$") == 0 && filterValue.indexOf("$$") !== 0) {
                    var parameterValue = Utils.resolveValue(parameters, filterValue.substring(1));
                    filter[key] = parameterValue;
                }
            }
        }
    }
}

exports.resolveFilterAsFunction = function (filter, parameters, db, options) {
    var filterKeys = undefined;
    try {
        filterKeys = filter ? Object.keys(filter) : [];
    } catch (e) {
        throw new Error(e.message + ".Filter found [" + JSON.stringify(filter) + "]");
    }
    var returnedResult = undefined;
    if (!filterKeys || filterKeys.length === 0) {
        return;
    }
    return Utils.iterateArrayWithPromise(filterKeys,
        function (index, filterKey) {
            var filterValue = filter[filterKey];
            if (!filterValue) {
                return;
            }
            if (filterKey.indexOf("$") === 0) {
                options.filterInfo.operator = filterKey;
                if (filterKey == Constants.Query.Filter.OR || filterKey == Constants.Query.Filter.AND) {
                    var innerResult = undefined;
                    return Utils.iterateArrayWithPromise(filterValue,
                        function (innerIndex, row) {
                            var value = Self.resolveFilterAsFunction(row, parameters, db, options);
                            if (Q.isPromise(value)) {
                                return value.then(function (result) {
                                    if (!innerResult && result === Constants.Query.$$RESOLVED) {
                                        innerResult = result;
                                    }
                                });
                            } else {
                                if (!innerResult && value === Constants.Query.$$RESOLVED) {
                                    innerResult = value;
                                }
                            }
                        }).then(function () {
                            for (var i = 0; i < filterValue.length; i++) {
                                if (Object.keys(filterValue[i]).length === 0) {
                                    if (filterKey === Constants.Query.Filter.OR && innerResult && innerResult === Constants.Query.$$RESOLVED) {
                                        delete filter[filterKey];
                                        returnedResult = innerResult;
                                        return;
                                    } else {
                                        filterValue.splice(i, 1);
                                        i = i - 1;
                                    }
                                }
                            }
                            if (filterValue.length === 0) {
                                delete filter[filterKey];
                                returnedResult = innerResult;
                                return;
                            }
                        })
                } else if (keys.indexOf(filterKey) !== -1) {
                    if (Array.isArray(filterValue)) {
                        //do nothing.Do not need to iterate for string type array.
                        return;
                    }
                    var value = resolveFilter(filter, filterKey, filterValue, parameters, db, options);
                    if (Q.isPromise(value)) {
                        return value.then(function (result) {
                            if (!returnedResult && result === Constants.Query.$$RESOLVED) {
                                returnedResult = result;
                            }
                        });
                    } else {
                        if (!returnedResult && value === Constants.Query.$$RESOLVED) {
                            returnedResult = value;
                        }
                    }
                }
            } else {
                if (!options.resolveFunctionParameters) {
                    options.filterInfo.key = filterKey;
                }
                var res = resolveFilter(filter, filterKey, filterValue, parameters, db, options);
                if (Q.isPromise(res)) {
                    return res.then(function (result) {
                        if (!returnedResult && result === Constants.Query.$$RESOLVED) {
                            returnedResult = result;
                        }
                    });
                } else {
                    if (!returnedResult && res === Constants.Query.$$RESOLVED) {
                        returnedResult = res;
                    }
                }
            }
        }).then(function () {
            return returnedResult;
        })
}

function resolveFilter(filter, filterKey, filterValue, parameters, db, options) {
    options.filterInfo.value = filterValue;
    if (Utils.isJSONObject(filterValue) && Object.keys(filterValue).length > 0) {
        var filterValueKey = Object.keys(filterValue)[0];
        if (filterValueKey === "$function" || filterValueKey.indexOf("$$") === 0) {
            var functionName = undefined;
            var functionParams = undefined;
            var functionValue = filterValue[filterValueKey];
            if (filterValueKey === "$function") {
                if (Utils.isJSONObject(functionValue)) {
                    functionName = Object.keys(functionValue)[0];
                    functionParams = functionValue[functionName];
                } else {
                    functionName = functionValue;
                }
            } else if (filterValueKey.indexOf("$$") === 0) {
                functionName = filterValueKey.substring(2);
                functionParams = functionValue;
            }
            return resolveFunction(filter, filterKey, functionName, functionParams, parameters, db, options);
        } else {
            var value = Self.resolveFilterAsFunction(filterValue, parameters, db, options);
            if (Q.isPromise(value)) {
                return value.then(function (result) {
                    if (Object.keys(filterValue).length === 0) {
                        delete filter[filterKey];
                        return result;
                    }
                });
            } else {
                if (Object.keys(filterValue).length === 0) {
                    delete filter[filterKey];
                    return value;
                }
            }
        }
    } else if (typeof filterValue == "string" && filterValue.indexOf("$$") === 0) {
        var functionName = filterValue.substring(2);
        return resolveFunction(filter, filterKey, functionName, undefined, parameters, db, options);
    }
}

function resolveFunction(filter, filterKey, functionName, functionParams, parameters, db, options) {
    functionParams = functionParams || {};
    if (!functionName) {
        throw new Error("Function name not defined.");
    }
    if (Functions[functionName]) {
        functionName = "Functions." + functionName;
    }
    options.resolveFunctionParameters = true;
    var value = Self.populateFilter(functionParams, parameters, db, options);
    if (Q.isPromise(value)) {
        return value.then(function () {
            return executeFunction(functionName, filter, filterKey, functionParams, db, options);
        })
    } else {
        return executeFunction(functionName, filter, filterKey, functionParams, db, options);
    }
}

function executeFunction(functionName, filter, filterKey, functionParams, db, options) {
    delete options.resolveFunctionParameters;
    return db.invokeFunction(functionName, [functionParams], options).then(
        function (result) {
            if (result === Constants.Query.$$REMOVED || result === Constants.Query.$$RESOLVED) {
                delete filter[filterKey];
                return result;
            } else {
                filter[filterKey] = result;
            }
        })
}

