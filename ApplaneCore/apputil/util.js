var ApplaneCallback = require("./ApplaneCallback.js");
var ObjectID = require("mongodb").ObjectID;
var QueryConstants = require("ApplaneCore/nodejsapi/Constants.js");
var AppUtil = require("ApplaneCore/apputil/util");
var ObjConstrunctor = {}.constructor;
var APIConstants = require('ApplaneCore/nodejsapi/Constants.js');
var Q = require("q");

exports.isDotted = function (expression) {
    var dottedPattern = /\./;
    return (dottedPattern.test(expression));
}

exports.isEndWith_Id = function (expression) {
    var dottedPattern = /\._id$/;
    return (dottedPattern.test(expression));
}

exports.isNumber = function (expression) {
    return (new RegExp("^\[0-9]*$").test(expression));
}
exports.isObjectId = function (value) {
    return (value instanceof ObjectID);
}

exports.getObjectId = function (value) {
    return ObjectID(value);
}
exports.getUnique = function () {
    return new ObjectID().toString();
}
exports.getUniqueObjectId = function () {
    return new ObjectID();
}

exports.isTemp = function (id) {
    var dottedPattern = /.+(temp)$/;
    return (dottedPattern.test(id));
}

exports.getHashedToken = function () {
    return require("crypto").createHash('sha1').update(ObjectID().toString()).digest("hex");
};

exports.getEncriptedPassword = function (pass) {
    return require("crypto").createHash('sha256').update(pass).digest("hex");
};

exports.iterateArray = function (array, callback, task) {
    if (!callback || (typeof callback != 'function')) {
        throw new Error("callback not defined");
    }
    if (!task || (typeof task != 'function')) {
        throw new Error("task not defined");
    }
    try {
        if (array && array.length > 0) {
            var length = array.length;
            var index = -1;
            var arrayCallback = function (err, info) {
                try {
                    if (err) {
                        callback(err);
                        return;
                    }
                    index = index + 1;
                    if ((index == length) || (info && info.return)) {
                        callback(null, (info && info.data));
                    } else {
                        try {
                            task(array[index], arrayCallback, index);
                        } catch (e) {
                            callback(e);
                            return;
                        }
                    }
                } catch (e) {
                    callback(e);
                }
            };
            arrayCallback();
        } else {
            callback();
        }
    } catch (e) {
        callback(e);
    }
}


function callTask(i, record, task) {
    var D = Q.defer();
    setImmediate(function () {
        var retValue = task(i, record);
        if (Q.isPromise(retValue)) {
            retValue.then(
                function (val) {
                    D.resolve(val);
                }).fail(function (err) {
                    D.reject(err);
                });
        } else {
            D.resolve(retValue);
        }
    })
    return D.promise;
}

exports.asyncIterator = function (array, task) {
    var D = Q.defer();
    if (!array || array.length == 0) {
        D.resolve();
        return D.promise;
    }
    try {
        var p = [];
        var resolvedPromises = 0;
        var errors = [];

        var onResolve = function () {
            finalResolve();
        };

        var onReject = function (err) {
            var errDetail = {};
            errDetail.message = err.message;
            errDetail.stack = err.stack;
            errors.push(errDetail);
            finalResolve();
        };

        var finalResolve = function () {
            resolvedPromises = resolvedPromises + 1;
            if (resolvedPromises === array.length) {
                if (errors.length > 0) {
                    D.reject(new Error(errors.length > 1 ? JSON.stringify(errors) : JSON.stringify(errors[0])))
                } else {
                    D.resolve();
                }
            }
        };
        for (var i = 0; i < array.length; i++) {
            callTask(i, array[i], task).then(onResolve).fail(onReject);
        }
    } catch (e) {
        D.reject(e);
    }
    return D.promise;
};

exports.iterateArrayWithPromise = function (array, task) {
    return iterate(array, task, false);

}

exports.reverseIterator = function (array, task) {
    return iterate(array, task, true);

}

exports.iterateArrayWithoutPromise = function (array, task, reverse) {

    var length = array ? array.length : 0;
    if (length == 0) {
        return;
    }
    var index = reverse ? (length - 1) : 0;

    function loop(index) {
        try {
            var onResolve = function () {
                index = reverse ? (index - 1) : index + 1;
                if ((!reverse && index == array.length) || (reverse && index == -1)) {
                    return;
                } else {
                    return loop(index);
                }
            }
            try {
                var p = task(index, array[index]);
                if (Q.isPromise(p)) {
                    return p.then(onResolve)
                        .fail(function (err) {
                            throw err;
                        })
                } else {
                    return onResolve();
                }


            } catch (e) {
                throw e;
            }
        } catch (e) {
            throw e;
        }
    }

    return loop(index);

}


function iterate(array, task, reverse) {
    var D = Q.defer();
    var length = array ? array.length : 0;
    if (length == 0) {
        D.resolve();
        return D.promise;
    }
    var index = reverse ? (length - 1) : 0;

    function loop(index) {
        try {
            var onResolve = function () {
                index = reverse ? (index - 1) : index + 1;
                if ((!reverse && index == array.length) || (reverse && index == -1)) {
                    D.resolve();
                } else {
                    loop(index);
                }
            }
            try {
                var p = task(index, array[index]);
                if (!p) {
                    onResolve();
                    return;
                }
                p.then(onResolve)
                    .fail(function (err) {
                        D.reject(err);
                    })
            } catch (e) {
                D.reject(e);
            }
        } catch (e) {
            D.reject(e);
        }
    }

    loop(index);
    return D.promise;
}

exports.iterateArrayAsync = function (array, callback, task) {
    if (!callback || (typeof callback != 'function')) {
        throw new Error("callback not defined");
    }
    if (!task || (typeof task != 'function')) {
        throw new Error("task not defined");
    }
    try {
        if (array && array.length > 0) {
            var index = 0;
            var error = [];
            var arrayCallback = function (err) {
                if (err) {
                    error.push(err);
                }
                index = index + 1;
                if (index == array.length) {
                    callback(error.length == 0 ? undefined : error);
                }
            }
            array.forEach(function (arrayValue, arrayIndex) {
                setTimeout(function () {
                    try {
                        task(arrayValue, arrayCallback, arrayIndex);
                    } catch (e) {
                        arrayCallback(e);
                    }

                }, 10)
            })


        } else {
            callback();
        }
    } catch (e) {
        callback(e);
    }

}

exports.iterateArrayWithIndex = function (array, callback, task) {
    if (array && array.length > 0) {
        var length = array.length;
        var index = -1;
        var arrayCallback = ApplaneCallback(callback, function () {
            index = index + 1;
            if (index == length) {
                callback();
            } else {
                task(index, array[index], arrayCallback);
            }
        });
        arrayCallback();
    } else {
        callback();
    }
}

exports.capitalize = function (s) {
    return s[0].toUpperCase() + s.slice(1);
}

exports.parseDateValue = function (colDef, value) {
    if (value == undefined || value == null || value.toString().trim() == 0) {
        return null;
    }
    if (value instanceof Date) {
        return value;
    }
    var format = colDef.format;
    if (!format) {
        format = "yyyy-mm-dd";
    }
    var requiredDate;
    if (format == "dd/mm/yyyy") {
        var parts = value.split("/");
        requiredDate = new Date(parseInt(parts[2], 10),
                parseInt(parts[1], 10) - 1,
            parseInt(parts[0], 10));
    } else {
        requiredDate = new Date(value);
    }
    return requiredDate;

}

exports.isEmailId = function (inputTxt) {
    var email = /^\w+[.\w-]*\w+@\w+[.\w-]*\w+(\.\w{2,3})+$/;
    return new RegExp(email).test(inputTxt)
}

exports.isPhoneNumber = function (value) {
    var phoneNumber = /^\+{0,2}([\-\. ])?(\(?\d{0,3}\))?([\-\. ])?\(?\d{0,3}\)?([\-\. ])?\d{3}([\-\. ])?\d{4}/;
    return new RegExp(phoneNumber).test(value);
}

exports.isMobileNumber = function (value) {
    var mobile = /^(\+\d{1,3}[- ]?)?\d{10}$/;
    return new RegExp(mobile).test(value);
}
exports.resolveDot = function (operations, columns) {
    //collect dotted columns into one
    if (!operations) {
        return operations
    } else if (operations instanceof Array) {
        var operationCount = operations ? operations.length : 0;
        for (var i = 0; i < operationCount; i++) {
            operations[i] = this.resolveDot(operations[i], columns);
        }
        return operations
    } else if (operations instanceof Date) {
        return operations;
    } else if (this.isJSONObject(operations)) {
        var newOperation = {};
        for (var exp in operations) {
            //check if exp is a dotted expression
            var newColumns = undefined;
            if (exp == "$inc") {
                newOperation[exp] = operations[exp];
                continue;
            } else if (columns) {
                var newKeyColumn = AppUtil.getColumnObject(exp, columns)
                if (newKeyColumn) {
                    newColumns = newKeyColumn.columns;
                    if (newKeyColumn.type == "json") {
                        newOperation[exp] = operations[exp];
                        continue;
                    }
                }
            }
            var expressionValue = (operations[exp]);
            var resolvedVal = undefined;
            if (expressionValue && AppUtil.isJSONObject(expressionValue) && expressionValue.data && expressionValue.override) {
                resolvedVal = expressionValue;
            } else {
                resolvedVal = this.resolveDot(operations[exp], newColumns);
            }


            var dottedIndex = exp.indexOf(".");
            if (dottedIndex > 0) {
                var firstPart = exp.substring(0, dottedIndex);
                var secondPart = exp.substring(dottedIndex + 1);
                var firstPartValue = newOperation[firstPart];

                var newOtherColumns = undefined;
                if (newColumns) {
                    var newKeyColumn = AppUtil.getColumnObject(firstPart, newColumns)
                    if (newKeyColumn) {
                        newOtherColumns = newKeyColumn.columns;
                    }
                }

                if (!firstPartValue) {
                    //check if exists in old values
                    firstPartValue = operations[firstPart];
                }
                if (!firstPartValue) {
                    firstPartValue = {};
                } else if (!(firstPartValue instanceof Object)) {
                    var temp = {};
                    temp[QueryConstants.Query._ID] = firstPartValue;
                    firstPartValue = temp;

                }
                var secondPartValue = firstPartValue[secondPart];
                if (secondPartValue !== undefined) {
                    var isFirstJSON = this.isJSONObject(secondPartValue);
                    var isSecondJSON = this.isJSONObject(resolvedVal);
                    if (isFirstJSON || isSecondJSON) {
                        if (!isFirstJSON) {
                            secondPartValue = {_id: secondPartValue};
                        }
                        if (!isSecondJSON) {
                            resolvedVal = {_id: resolvedVal};
                        }

                        if (secondPartValue && resolvedVal) {
                            Object.keys(resolvedVal).forEach(function (k) {
                                secondPartValue[k] = resolvedVal[k];
                            })
                        }


                        firstPartValue[secondPart] = secondPartValue;

                    } else {
                        firstPartValue[secondPart] = resolvedVal;
                    }
                } else {
                    firstPartValue[secondPart] = resolvedVal;
                }


                newOperation[firstPart] = this.resolveDot(firstPartValue, newOtherColumns);
            } else {
                if (!newOperation[exp]) {
                    newOperation[exp] = resolvedVal;
                }
            }
        }
        return newOperation;
    } else {
        return operations;
    }
}

/**comment**/
exports.deepEqual = function (first, second) {
    if (first === second) {
        return true;
    } else if ((Array.isArray(first)) && (Array.isArray(second))) {
        var firstLength = first.length;
        var secondLength = second.length;
        if (firstLength !== secondLength) {
            return false;
        } else {
            for (var i = 0; i < firstLength; i++) {
                if (!AppUtil.deepEqual(first[i], second[i])) {
                    return false
                }
            }
            return true;
        }
    } else if ((typeof first === typeof second) && typeof first === "number" && isNaN(first) && isNaN(second)) {
        return true;
    } else if (first instanceof Date && second instanceof Date) {
        if (first.getTime() === second.getTime()) {
            return true;
        } else {
            return false;
        }

    } else if (first instanceof ObjectID && second instanceof ObjectID) {
        if (first.equals(second)) {
            return true;
        }
    }
    else if (AppUtil.isJSONObject(first) && AppUtil.isJSONObject(second)) {
        var firstKeys = Object.keys(first);
        var secondKeys = Object.keys(second);
        if (firstKeys.length !== secondKeys.length) {
            return false;
        } else {
            for (var i = 0; i < firstKeys.length; i++) {
                var keyName = firstKeys[i];
                if (!AppUtil.deepEqual(first[keyName], second[keyName])) {
                    return false;
                }
            }
            return true;
        }
    }
    else {
        return false;
    }
}


function checkValue(array, value, key) {
    for (var i = 0; i < array.length; i++) {
        var cExp;
        var exp;
        if (key && AppUtil.isJSONObject(value)) {
            cExp = array[i][key];
            exp = value[key];
        } else {
            cExp = array[i];
            exp = value;
        }
        if (AppUtil.deepEqual(cExp, exp)) {
            return i;
        }
    }
}

function checkAndPush(array, value, key) {
    if (checkValue(array, value, key) === undefined) {
        array.push(value);
    }
}

exports.pushIfNotExists = function (array, value, key) {
    if (!value) {
        return;
    }
    if (value instanceof Array) {
        for (var i = 0; i < value.length; i++) {
            checkAndPush(array, value[i], key);
        }
    } else {
        checkAndPush(array, value, key);
    }

};

exports.isExists = function (array, value, key) {
    if (!array || !value) {
        return;
    }
    return checkValue(array, value, key);
};

exports.isValueExists = function (array, key, value) {
    if (!array || !value || !key) {
        return;
    }
    for (var i = 0; i < array.length; i++) {
        if (AppUtil.deepEqual(array[i][key], value)) {
            return array[i];
        }
    }
};


exports.isJSONObject = function (obj) {
    if (obj === undefined || obj === null || obj === true || obj === false || typeof obj !== "object" || Array.isArray(obj)) {
        return false;
    } else if (obj.constructor === ObjConstrunctor) {
        return true;
    } else {
        return false;
    }

};


exports.resolveValue = function (data, expression) {
    if (!data || !expression) {
        return;
    }
    if (Array.isArray(data)) {
        var result = [];
        for (var i = 0; i < data.length; i++) {
            var row = data[i];
            var resolvedValue = AppUtil.resolveValue(row, expression);
            if (resolvedValue !== undefined) {
                if (Array.isArray(resolvedValue)) {
                    for (var j = 0; j < resolvedValue.length; j++) {
                        if (result.indexOf(resolvedValue[j]) == -1) {
                            result.push(resolvedValue[j]);
                        }
                    }
                } else {
                    if (result.indexOf(resolvedValue) == -1) {
                        result.push(resolvedValue);
                    }
                }
            }
        }
        return result;
    } else {
        if (data[expression] !== undefined) {
            return data[expression];
        }
        var indexOf = expression.indexOf(".");
        if (indexOf != -1) {
            var preExp = expression.substr(0, indexOf);
            var postExp = expression.substr(indexOf + 1);
            if (data[preExp]) {
                return AppUtil.resolveValue(data[preExp], postExp);
            }
        }
    }
}

exports.getStringHashCode = function (str) {
    return require('crypto').createHash('md5').update(str).digest('hex');
}
exports.deepClone = function (value, columns, processData) {
    var typeOfValue = typeof value;
    if (!value) {
        return value
    } else if (typeOfValue == "boolean") {
        return value;
    } else if (typeOfValue == "string") {
        return value;
    } else if (typeOfValue == "function") {
        return value;
    } else if (value instanceof Date) {
        return new Date(value);
    } else if (value instanceof Array) {
        var newValue = [];
        for (var i = 0; i < value.length; i++) {
            if (processData && AppUtil.isJSONObject(value[i])) {
                if (value[i].__type__ && value[i].__type__ == "delete") {
                    continue;
                }
            }
            newValue.push(AppUtil.deepClone(value[i], columns, processData));
        }
        return newValue;
    } else if (AppUtil.isJSONObject(value)) {

        if (processData && value.data && value.override) {
            return AppUtil.deepClone(value.data, columns, processData);
        }
        var newValue = {};
        var valueKeys = Object.keys(value);
        for (var i = 0; i < valueKeys.length; i++) {
            var key = valueKeys[i];
            var newKeyColumns = undefined;
            var newKeyValue = value[key];
            if (columns) {
                var newKeyColumn = AppUtil.getColumnObject(key, columns)
                if (newKeyColumn) {
                    if (newKeyColumn.type === "lookup" && newKeyValue && (!AppUtil.isJSONObject(newKeyValue) && !(newKeyValue instanceof Array) )) {
                        throw new Error("Lookup value must be either object or array but found >>>" + JSON.stringify(newKeyValue) + ">>>For>>>" + newKeyColumn.expression)
                    }
                    if (newKeyColumn.multiple && newKeyValue && !(newKeyValue instanceof Array)) {
                        if (AppUtil.isJSONObject(newKeyValue) && newKeyValue.override && newKeyValue.data) {
                            newKeyValue = newKeyValue.data;
                        } else {
                            throw new Error("Multiple value must be array but found >>>" + JSON.stringify(newKeyValue) + ">>>For>>>" + newKeyColumn.expression)
                        }


                    }
                    newKeyColumns = newKeyColumn.columns;
                }
            }
            newValue[key] = AppUtil.deepClone(newKeyValue, newKeyColumns, processData);
        }
        return newValue;
    } else {
        return value;
    }
}

exports.getColumnObject = function (expression, columns) {
    if (!expression || !columns) {
        return;
    }
    var index = expression.indexOf(".");
    if (index != -1) {
        var firstPart = expression.substr(0, index);
        var length = columns ? columns.length : 0;
        for (var i = 0; i < length; i++) {
            var column = columns[i];
            var columnExpression = column.expression;
            if (columnExpression == firstPart) {
                var secondPart = expression.substr(index + 1);
                return AppUtil.getColumnObject(secondPart, column.columns);
            }
        }
    } else {
        var length = columns ? columns.length : 0;
        for (var i = 0; i < length; i++) {
            var column = columns[i];
            if (column.expression == expression) {
                return column;
            }
        }
    }
}

exports.replaceValue = function (value, oldValue, newvalue) {
    if (!value || !oldValue || !newvalue) {
        return;
    } else if (Array.isArray(value)) {
        for (var i = 0; i < value.length; i++) {
            AppUtil.replaceValue(value[i], oldValue, newvalue);
        }
    } else if (AppUtil.isJSONObject(value)) {
        for (var key in value) {
            var keyValue = value[key];
            if (keyValue === oldValue) {
                value[key] = newvalue;
            } else if (typeof keyValue === "string") {
                var escapeChar = "{#" + oldValue + "#}"
                var escapeCharIndex = keyValue.indexOf(escapeChar);
                if (escapeCharIndex >= 0) {
                    keyValue = keyValue.replace(new RegExp(escapeChar, "g"), newvalue);
                    value[key] = keyValue;
                }
            } else if (keyValue && (Array.isArray(keyValue) || AppUtil.isJSONObject(keyValue))) {
                AppUtil.replaceValue(keyValue, oldValue, newvalue);
            }
        }
    } else {
        return;
    }
}

exports.getErrorFromArray = function (errorLogs, err) {
    if (err) {
        if (Array.isArray(err)) {
            for (var i = 0; i < err.length; i++) {
                AppUtil.getErrorFromArray(errorLogs, err[i]);

            }
        } else {
            errorLogs.push(err.stack);
        }
    }

}

exports.evaluateFilter = function (filter, row) {
    var keys = Object.keys(filter);
    var keyLength = keys.length;
    var evaluated = false;
    for (var i = 0; i < keyLength; i++) {
        var key = keys[i];
        if (key === "$or" || key === "$and") {
            var value = filter[key];
            if (value) {
                for (var j = 0; j < value.length; j++) {
                    evaluated = AppUtil.evaluateFilter(value[j], row);
                    if ((evaluated && key === "$or") || (!evaluated && key === "$and")) {
                        break;
                    }
                }
            } else {
                evaluated = true;
            }
        } else {
            if (AppUtil.isJSONObject(filter[key])) {
                for (var opr in filter[key]) {
                    evaluated = evaluateExpression(key, opr, filter[key][opr], row);
                    if (!evaluated) {
                        break;
                    }
                }
            } else {
                evaluated = evaluateExpression(key, APIConstants.Query.Filter.Operator.EQUAL, filter[key], row);
            }
        }
        if (!evaluated) {
            break;
        }
    }
    return evaluated;
}

function evaluateExpression(column, operator, filterValue, row) {
    var columnValue = AppUtil.resolveValue(row, column);
    if (Array.isArray(columnValue)) {
        if (operator == APIConstants.Query.Filter.Operator.EQUAL) {
            return AppUtil.isExists(columnValue, filterValue) !== undefined ? true : false;
        } else if (operator == APIConstants.Query.Filter.Operator.NE) {
            return AppUtil.isExists(columnValue, filterValue) === undefined ? true : false;
        } else if (operator == "$in") {
            var exist = false;
            for (var i = 0; i < filterValue.length; i++) {
                if (AppUtil.isExists(columnValue, filterValue[i]) !== undefined) {
                    exist = true;
                    break;
                }
            }
            return exist;
        }
    } else {
        if (operator == APIConstants.Query.Filter.Operator.EQUAL) {
            return ((columnValue === null || columnValue === undefined) && (filterValue === null || filterValue === undefined)) || AppUtil.deepEqual(columnValue, filterValue);
        } else if (operator == APIConstants.Query.Filter.Operator.NE) {
            if (((columnValue === null || columnValue === undefined) && (filterValue === null || filterValue === undefined))) {
                return false;
            } else {
                return !(AppUtil.deepEqual(columnValue, filterValue));
            }
        } else if (operator == "$in") {
            if (AppUtil.isExists(filterValue, columnValue) === undefined) {
                return false;
            } else {
                return true;
            }
        } else if (operator == APIConstants.Query.Filter.Operator.GT) {
            return (columnValue > filterValue);
        } else if (operator == APIConstants.Query.Filter.Operator.LT) {
            return (columnValue < filterValue);
        } else if (operator == APIConstants.Query.Filter.Operator.GTE) {
            return ((columnValue === null || columnValue === undefined) && (filterValue === null || filterValue === undefined)) || (columnValue >= filterValue);
        } else if (operator == APIConstants.Query.Filter.Operator.LTE) {
            return ((columnValue === null || columnValue === undefined) && (filterValue === null || filterValue === undefined)) || (columnValue <= filterValue);
        }
    }
    return false;
}

exports.sort = function (data, type, field) {
    if (!field) {
        if (!type || type == "asc") {
            data.sort();
        } else if (type == "desc") {
            data.sort();
            data.reverse();
        }
    } else {
        var fieldValueType = undefined;
        for (var i = 0; i < data.length; i++) {
            var fieldValue = AppUtil.resolveValue(data[i], field);
            if (fieldValue) {
                fieldValueType = typeof fieldValue;
                if (fieldValueType === "object" && fieldValue instanceof Date) {
                    fieldValueType = "date";
                }
                break;
            }
        }
        if (fieldValueType) {
            if (!type || type == "asc") {
                data.sort(function (first, second) {
                    var firstValue = AppUtil.resolveValue(first, field);
                    var secondValue = AppUtil.resolveValue(second, field);
                    if (firstValue === undefined && secondValue === undefined)
                        return 0;
                    if (firstValue === undefined && secondValue !== undefined)
                        return -1;
                    if (firstValue !== undefined && secondValue === undefined)
                        return 1;
                    if (fieldValueType === "number") {
                        return firstValue - secondValue;
                    } else if (fieldValueType === "string") {
                        var nameA = firstValue.toString().toLowerCase();
                        var nameB = secondValue.toString().toLowerCase();
                        if (nameA < nameB)
                            return -1
                        if (nameA > nameB)
                            return 1
                        return 0
                    } else if (fieldValueType === "date") {
                        var dateA = new Date(firstValue);
                        var dateB = new Date(secondValue);
                        return dateA - dateB;
                    }
                })
            } else if (type == "desc") {
                data.sort(function (first, second) {
                    var firstValue = AppUtil.resolveValue(first, field);
                    var secondValue = AppUtil.resolveValue(second, field);
                    if (firstValue === undefined && secondValue === undefined)
                        return 0;
                    if (firstValue === undefined && secondValue !== undefined)
                        return 1;
                    if (firstValue !== undefined && secondValue === undefined)
                        return -1;
                    if (fieldValueType === "number") {
                        return secondValue - firstValue;
                    } else if (fieldValueType === "string") {
                        var nameA = firstValue.toString().toLowerCase();
                        var nameB = secondValue.toString().toLowerCase();
                        if (nameB < nameA)
                            return -1
                        if (nameB > nameA)
                            return 1
                        return 0
                    } else if (fieldValueType === "date") {
                        var dateA = new Date(firstValue);
                        var dateB = new Date(secondValue);
                        return dateB - dateA;
                    }
                })
            }
        }
    }

}

exports.convert_IdToObjectId = function (updates) {
    if (!updates) {
        return;
    }
    for (var k in updates) {
        var value = updates[k];
        if (k == "_id") {
            if ((!(value instanceof ObjectID)) && typeof value == "string") {
                try {
                    updates[k] = ObjectID(value);
                } catch (e) {
                }
            }
        } else if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                if (AppUtil.isJSONObject(value[i])) {
                    AppUtil.convert_IdToObjectId(value[i]);
                } else {
                    //if first value is not of json obejct type then just break
                    break;
                }
            }
        } else if (AppUtil.isJSONObject(value)) {
            AppUtil.convert_IdToObjectId(value);
        }

    }

}

exports.populate_IdInArray = function (updates) {
    if (!updates) {
        return;
    }
    for (var k in updates) {

        var value = updates[k];
        if (k == "_id" && (typeof (value) == "string") && (value).indexOf("__temp__") >= 0) {
            updates[k] = AppUtil.getUniqueObjectId();
        }
        if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                if (AppUtil.isJSONObject(value[i])) {
                    if (!(value[i]._id) && !(value[i].$query)) {
                        value[i]._id = AppUtil.getUniqueObjectId();
                    } else if (value[i]._id && (typeof (value[i]._id) == "string") && (value[i]._id).indexOf("__temp__") >= 0) {
                        value[i]._id = AppUtil.getUniqueObjectId();
                    }
                    AppUtil.populate_IdInArray(value[i]);
                } else {
                    break;
                }
            }
        } else if (AppUtil.isJSONObject(value)) {
            AppUtil.populate_IdInArray(value);
        }
    }
}

exports.convert_IdToString = function (updates) {
    if (!updates || !AppUtil.isJSONObject(updates)) {
        return;
    }
    for (var k in updates) {

        var value = updates[k];
        if (k == "_id" && AppUtil.isObjectId(value)) {
            updates[k] = updates[k].toString();
        }
        if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                if (AppUtil.isJSONObject(value[i])) {
                    AppUtil.convert_IdToString(value[i]);
                } else {
                    break;
                }
            }
        } else if (AppUtil.isJSONObject(value)) {
            AppUtil.convert_IdToString(value);
        }
    }
}

exports.getIndex = function (array, field, value) {
    if (!array || array.length == 0) {
        return undefined;
    }
    for (var i = 0; i < array.length; i++) {
        if (array[i][field] == value) {
            return i;
        }

    }
}

exports.getUniqueTempId = function () {
    return new ObjectID().toString() + "__temp__";
}

exports.getField = function (expression, fields) {
    if (fields && fields.length > 0) {
        var index = expression.indexOf(".");
        if (index !== -1) {
            var firstPart = expression.substr(0, index);
            var rest = expression.substr(index + 1);
            var firstPartField = getFieldDef(firstPart, fields);
            if (firstPartField) {
                return AppUtil.getField(rest, firstPartField.fields);
            }
        } else {
            return getFieldDef(expression, fields);
        }
    }
}

function getFieldDef(expression, fields) {
    for (var i = 0; i < fields.length; i++) {
        var field = fields[i];
        if (field.field === expression) {
            return field;
        }
    }
}

exports.isInclude = function (fields) {
    for (var field in fields) {
        if (fields[field] === 0) {
            return false;
        } else {
            return true;
        }
    }
    return true;
}

exports.putDottedValue = function (model, expression, value) {
    if (!model) {
        alert("Model does not exits for putting dotted value")
        return;
    }
    var lastDottedIndex = expression.lastIndexOf(".");
    if (lastDottedIndex >= 0) {
        var firstExpression = expression.substring(0, lastDottedIndex);
        expression = expression.substring(lastDottedIndex + 1);
        model = AppUtil.resolveDottedValue(model, firstExpression, true);
    }
    model[expression] = value;

}

exports.resolveDottedValue = function (model, expression, confirm, confirmType) {
    if (!model) {
        return;
    }

    while (expression !== undefined) {
        var fieldIndex = expression.indexOf(".");
        var exp = expression;
        if (fieldIndex >= 0) {
            exp = expression.substring(0, fieldIndex);
            expression = expression.substring(fieldIndex + 1);
        } else {
            expression = undefined;
        }

        if (model[exp] === undefined && !confirm) {
            return;
        }
        if (model[exp] !== undefined) {
            model = model[exp];
        } else {
            if (expression) {
                model[exp] = {}
            } else {
                if (confirmType == 'array') {
                    model[exp] = [];
                } else {
                    model[exp] = {}
                }
            }
            model = model[exp];
        }

    }
    return model;
}

exports.replaceDotToUnderscore = function (value) {
    if (value && value.indexOf(".") > 0) {
        return value.replace(/\./g, "_");
    } else {
        return value;
    }
}
function getSpacesForJSON(level) {
    var str = "";
    level = level * 5;
    for (var i = 0; i < level; i++) {
        str += " ";
    }
    return str;
}
exports.iterateJSON = function (value, level) {
    if (!level) {
        level = 1;
    }
    var spaces = getSpacesForJSON(level);
    if (Array.isArray(value)) {
        if (value.length == 0) {
            console.log(spaces + " empty json array");
            return;
        }
        for (var i = 0; i < value.length; i++) {
            var valueOfKey = value[i];
            if (Array.isArray(valueOfKey)) {
                var newLevel = level + 1;
                console.log(spaces + ">>> Array value is JSON array>>>");
                AppUtil.iterateJSON(valueOfKey, newLevel);
            } else if (AppUtil.isJSONObject(valueOfKey)) {
                var newLevel = level + 1;
                console.log(spaces + ">>> Array value is JSON Object>>>");
                AppUtil.iterateJSON(valueOfKey, newLevel);
            } else {
                console.log(spaces + "[" + i + "]>>>type>>>" + (typeof valueOfKey) + ">>>value>>>> " + valueOfKey);
            }
        }
    } else if (AppUtil.isJSONObject(value)) {
        var keys = Object.keys(value);
        if (keys.length == 0) {
            console.log(spaces + " empty json object");
            return;
        }
        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var valueOfKey = value[key];
            if (Array.isArray(valueOfKey)) {
                var newLevel = level + 1;
                console.log(spaces + "" + key + ">>> JSON array>>>");
                AppUtil.iterateJSON(valueOfKey, newLevel);
            } else if (AppUtil.isJSONObject(valueOfKey)) {
                var newLevel = level + 1;
                console.log(spaces + "" + key + ">>> JSON Object>>>");
                AppUtil.iterateJSON(valueOfKey, newLevel);
            } else {
                console.log(spaces + "" + key + ">>>type>>>" + (typeof valueOfKey) + ">>>value>>>> " + valueOfKey);
            }
        }
    } else {
        console.log(spaces + "Value is neither array and nor json object its type is [" + (typeof value));
        return;
    }
}


exports.setDateWithZeroTimezone = function (dateToSet) {
    var utcDate = new Date("2014-01-10"); //to sove utc and curent time zone issue on end date like 1 sep, ...
    utcDate.setUTCFullYear(dateToSet.getFullYear());
    utcDate.setUTCMonth(dateToSet.getMonth());
    utcDate.setUTCDate(dateToSet.getDate());
    utcDate.setUTCHours(0);
    utcDate.setUTCMinutes(0);
    utcDate.setUTCSeconds(0);
    utcDate.setUTCMilliseconds(0);
    return utcDate;
}

exports.getErrorInfo = function (err) {
    if (err) {
        if (Array.isArray(err)) {
            for (var i = 0; i < err.length; i++) {
                var errObj = err[i];
                if (errObj instanceof Error) {
                    err[i] = {stack: err.stack, message: err.message, detailMessage: err.detailMessage, info: err.toString()};
                }
            }
            return err;
        } else if (err instanceof Error) {
            return {stack: err.stack, message: err.message, detailMessage: err.detailMessage, info: err.toString()};
        } else {
            return err;
        }
    }
}

exports.removeSpecialChar = function (inputString) {
    if (inputString) {
        var outputString = inputString.replace(/([~!@#$%^&*()_+=`{}\[\]\|\\:;'<>,.\/? ])+/g, '_').replace(/^(_)+|(_)+$/g, '');
        return outputString;
    }
}

function getNumberInTwoDigit(number) {
    return number < 10 ? "0" + number : "" + number;
}
exports.getDateString = function (date, zone) {
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var date = date.getDate();
    var dateString = year + "-" + getNumberInTwoDigit(month) + "-" + getNumberInTwoDigit(date) + "T00:00:00.000";
    if (zone) {
        dateString += getFormattedOffset(zone);
    }
    return dateString;

}

function getFormattedOffset(zone) {
    var indicator = zone > 0 ? "-" : "+";
    zone = zone < 0 ? zone * (-1) : zone;
    var minutes = zone % 60;
    var hrs = (zone - minutes) / 60;
    var hrsAsString = getNumberInTwoDigit(hrs);
    var minutesAsString = getNumberInTwoDigit(minutes);
    var formattedZone = indicator + hrsAsString + ":" + minutesAsString;
    return formattedZone;
}

exports.convert_IdToObjectIdInFilter = function (filter) {
    for (var key in filter) {
        var value = filter[key];
        if (key == "$or" || key == "$and") {
            for (var i = 0; i < value.length; i++) {
                AppUtil.convert_IdToObjectIdInFilter(value[i]);
            }
        } else {
            if (key == "_id" || AppUtil.isEndWith_Id(key)) {
                if (typeof value == "string") {
                    filter[key] = converValueInObjectId(value);
                } else if (AppUtil.isJSONObject(value)) {
                    for (var exp in value) {
                        var keyValue = value[exp];
                        if (exp === "$in" || exp === "$nin" || exp === "$all") {
                            if (!keyValue) {
                                throw new Error("Value for key [" + exp + "] in filter [" + JSON.stringify(filter) + "must be an Array.Value found is undefined");
                            }
                            for (var i = 0; i < keyValue.length; i++) {
                                keyValue[i] = converValueInObjectId(keyValue[i]);
                            }
                        } else if (exp === "$ne" || exp === "$gt" || exp === "$lt" || exp === "$gte" || exp === "$lte") {
                            value[exp] = converValueInObjectId(keyValue);
                        }
                    }
                }
            }
        }
    }
}

function converValueInObjectId(value) {
    if (!(value instanceof ObjectID) && typeof value == "string") {
        try {
            value = ObjectID(value);
        } catch (e) {
        }
    }
    return value;
}

exports.freeze = function (obj, options, rec) {
    if (Array.isArray(obj)) {
        if (rec || !options || !options.skipTop) {
            Object.freeze(obj);
        }
        for (var i = 0; i < obj.length; i++) {
            AppUtil.freeze(obj[i], options, true);
        }
    } else if (AppUtil.isJSONObject(obj)) {
        if (rec || !options || !options.skipTop) {
            Object.freeze(obj);
        }
        var skipKeys = options ? options.skipKeys : undefined;
        for (var k in obj) {
            if (!skipKeys || !skipKeys[k]) {
                AppUtil.freeze(obj[k], options, true);
            }
        }
    }
};

exports.getSetFieldIndex = function (fieldInfo, field) {
    if (!fieldInfo) {
        return;
    }
    if (field === "_id") {
        return 0;
    }
    var setFields = fieldInfo.set;
    var index = AppUtil.isExists(setFields, field);
    if (index === undefined) {
        var indexOf = field.lastIndexOf("._id");
        if (indexOf !== -1) {
            index = AppUtil.isExists(setFields, field.substring(0, indexOf));
        }
    }
    return index;
};

exports.replaceUnreadableCharacters = function (valueToReplace, replacedValue) {   //for validating in excel when validateInExcel property is true in field definition
    return valueToReplace.replace(new RegExp("[^\w\.\,!\"\"$%^&*\(\)-_+=::@ |~#':;{}]", "gi"), replacedValue);
}

exports.getDottedExpression = function (expression, options) {
    if (!options.parentFields || options.parentFields.length === 0) {
        return expression;
    }
    var parentFields = options.parentFields;
    var dottedExpression = "";
    dottedExpression += parentFields[0];
    for (var i = 1; i < parentFields.length; i++) {
        dottedExpression += "." + parentFields[i];
    }
    dottedExpression += "." + expression;
    return dottedExpression;
}

exports.getDataTypeErrorMessage = function (value, expression, options) {
    return ("Error while casting for expression [" + AppUtil.getDottedExpression(expression, options) + "] with value [" + value + "] for type [" + options.updatedFieldInfo.type + "] in collection [" + options.collectionName + "].");
}
