/***** move to app-helper.js to generate minified version for before commit*******/
var Util = {};

Util.ObjConstrunctor = {}.constructor;

var require = function (key) {
    if (key == "ApplaneCore/apputil/util.js") {
        return Util;
    } else if (key == "q") {
        return Q;
    } else if (key == "../../lib/ModuleManager.js") {
        return ModuleManager;
    } else if (key == "ApplaneDB/lib/EventManager.js") {
        return EventManager;
    } else if (key == "ApplaneDB/lib/Document.js") {
        return Document;
    } else if (key == "./DataModel.js") {
        return DataModel;
    } else if (key == "ApplaneDB/public/js/ViewUtility.js") {
        return ViewUtility;
    } else {
        alert("Not supported required>>>" + key)
    }
};
//var module = {};
//var exports = {};
//
//var EventManager = {};
Util.NOT_CONNECTED_MESSAGE = "Unable to connect. Check your internet connection."
Util.INVALID_TOKEN = "Not connected"
Util.UNEXPECTED_ERROR = "Something went wrong, but we're working to fix it as soon as we can. Thank you for your patience.";
Util.clone = function (value) {
    return angular.copy(value);
}
Util.isObject = function (obj) {

    if (obj === undefined || obj === null || obj === true || obj === false || Array.isArray(obj)) {
        return false;
    } else if (obj.constructor === Util.ObjConstrunctor) {
        return true;
    } else {
        return false;
    }
}
Util.isArray = function (value) {
    return angular.isArray(value);
}
Util.equals = function (value1, value2) {
    return angular.equals(value1, value2);
}

Util.getIndex = function (array, field, value) {
    if (!array || array.length == 0) {
        return undefined;
    }
    for (var i = 0; i < array.length; i++) {
        if (array[i][field] == value) {
            return i;
        }

    }
}

Util.sort = function (data, type, field) {
    if (!data || data.length == 0) {
        return;
    }
    if (!field) {
        if (!type || type == "asc") {
            data.sort(function (a, b) {
                return a - b
            });
        } else if (type == "desc") {
            data.sort(function (a, b) {
                return a - b
            });
            data.reverse();
        }
    } else {
        var fieldValueType = undefined;
        for (var i = 0; i < data.length; i++) {
            if (data[i][field]) {
                var fieldValue = data[i][field];
                fieldValueType = typeof fieldValue;
                if (fieldValueType === "object" && fieldValue instanceof Date) {
                    fieldValueType = "date";
                }
                break;
            }
        }
        if (fieldValueType) {
            if (!type || type == "asc") {
                data.sort(function (a, b) {
                    if (a[field] === undefined && b[field] === undefined)
                        return 0;
                    if (a[field] === undefined && b[field] !== undefined)
                        return -1;
                    if (a[field] !== undefined && b[field] === undefined)
                        return 1;
                    if (fieldValueType === "number") {
                        return a[field] - b[field];
                    } else if (fieldValueType === "string") {
                        var nameA = a[field].toLowerCase();
                        var nameB = b[field].toLowerCase();
                        if (nameA < nameB)
                            return -1
                        if (nameA > nameB)
                            return 1
                        return 0
                    } else if (fieldValueType === "date") {
                        var dateA = new Date(a[field]);
                        var dateB = new Date(b[field]);
                        return dateA - dateB;
                    }
                })
            } else if (type == "desc") {
                data.sort(function (a, b) {
                    if (a[field] === undefined && b[field] === undefined)
                        return 0;
                    if (a[field] === undefined && b[field] !== undefined)
                        return 1;
                    if (a[field] !== undefined && b[field] === undefined)
                        return -1;
                    if (fieldValueType === "number") {
                        return b[field] - a[field];
                    } else if (fieldValueType === "string") {
                        var nameA = a[field].toLowerCase();
                        var nameB = b[field].toLowerCase();
                        if (nameB < nameA)
                            return -1
                        if (nameB > nameA)
                            return 1
                        return 0
                    } else if (fieldValueType === "date") {
                        var dateA = new Date(a[field]);
                        var dateB = new Date(b[field])
                        return dateB - dateA;
                    }
                })
            }
        }
    }

}

Util.isJSONObject = function (value) {
    return Util.isObject(value)
}

Util.deepEqual = function (val1, val2) {
    return Util.equals(val1, val2);
}


Util.deepClone = function (value) {
    return angular.copy(value);

}


Util.iterateArrayWithPromise = function (array, task) {
    var Q = require("q");
    var D = Q.defer();

    var index = 0;

    var loop = function (index) {
        try {
            var onResolve = function () {
                index = index + 1;
                if (index == array.length) {
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

    if (!array || array.length == 0) {
        D.resolve();
    } else {
        loop(0);
    }

    return D.promise;

}

Util.iterateArrayWithoutPromise = function (array, task, reverse) {

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

Util.getUniqueTempId = function () {
    Util.nextUniqueTemp = Util.nextUniqueTemp || 0;
    Util.nextUniqueTemp = Util.nextUniqueTemp + 1;
    return Util.nextUniqueTemp + "__temp__";
}

Util.isTemp = function (_id) {
    if ((!_id) || (typeof _id == 'string' && _id.indexOf("__temp__") > 0)) {
        return true;
    }
}

Util.populate_IdInArray = function (updates) {
    if (!updates) {
        return;
    }
    for (var k in updates) {
        var value = updates[k];
        if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                if (Util.isJSONObject(value[i])) {
                    if (!(value[i]._id)) {
                        value[i]._id = Util.getUniqueTempId();
                    }
                    Util.populate_IdInArray(value[i]);
                } else {
                    break;
                }
            }
        } else if (Util.isJSONObject(value)) {
            Util.populate_IdInArray(value);
        }
    }
}


Util.isExists = function (array, value, key) {
    if (!array || !value) {
        return;
    }
    return Util.checkValue(array, value, key);
};


Util.checkValue = function (array, value, key) {
    for (var i = 0; i < array.length; i++) {
        var cExp;
        var exp;
        if (key && Util.isJSONObject(value)) {
            cExp = array[i][key];
            exp = value[key];
        } else {
            cExp = array[i];
            exp = value;
        }
        if (Util.deepEqual(cExp, exp)) {
            return i;
        }
    }
}

Util.putDottedValue = function (model, expression, value, populateTempId) {
    if (!model) {
        alert("Model does not exits for putting dotted value")
        return;
    }
    var lastDottedIndex = expression.lastIndexOf(".");
    if (lastDottedIndex >= 0) {
        var firstExpression = expression.substring(0, lastDottedIndex);
        expression = expression.substring(lastDottedIndex + 1);
        model = Util.resolveDot(model, firstExpression, true);
    }
    if (Array.isArray(model)) {
        if (model.length == 0) {
            var newObject = {}
            if (populateTempId) {
                newObject._id = Util.getUniqueTempId()
            }
            model.push(newObject);
        }
        var model = model[0];
        model[expression] = value;
    } else if (Util.isJSONObject(model)) {
        model[expression] = value;
    } else {
        throw new Error("Un supported model while putDottedValue>>>>" + JSON.stringify(model) + ">>>>expression>>>>" + expression + ">>value>>>>" + JSON.stringify(value));
    }


}

Util.resolveDottedValue = function (model, expression, confirm, confirmType) {
    return Util.resolveDot(model, expression, confirm, confirmType);
}

Util.resolveDot = function (model, expression, confirm, confirmType) {
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

        if ((model[exp] === undefined || model[exp] === null) && !confirm) {
            return;
        }
        if (model[exp] !== undefined && model[exp] !== null) {
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

/*Util.evaluateFilter = function (query, row) {
 if (query && row && query._id && row._id && query._id == row._id) {
 return true;
 } else {
 return false;
 }
 }*/

Util.evaluateFilter = function (filter, row) {
    var keys = Object.keys(filter);
    var keyLength = keys.length;
    var evaluated = false;
    for (var i = 0; i < keyLength; i++) {
        var key = keys[i];
        if (key === "$or" || key === "$and") {
            var value = filter[key];
            if (value) {
                for (var j = 0; j < value.length; j++) {
                    evaluated = Util.evaluateFilter(value[j], row);
                    if ((evaluated && key === "$or") || (!evaluated && key === "$and")) {
                        break;
                    }
                }
            } else {
                evaluated = true;
            }
        } else {
            if (Util.isJSONObject(filter[key])) {
                for (var opr in filter[key]) {
                    evaluated = evaluateExpression(key, opr, filter[key][opr], row);
                    if (!evaluated) {
                        break;
                    }
                }
            } else {
                evaluated = evaluateExpression(key, "$eq", filter[key], row);
            }
        }
        if (!evaluated) {
            break;
        }
    }
    return evaluated;
}

function evaluateExpression(column, operator, filterValue, row) {
    var columnValue = Util.resolveValue(row, column);
    if (operator == "$eq") {
        return ((columnValue === null || columnValue === undefined) && (filterValue === null || filterValue === undefined)) || Util.deepEqual(columnValue, filterValue);
    }
    return false;
}


Util.resolveValue = function (row, expression) {
    return Util.resolveDot(row, expression);
}

Util.getField = function (expression, fields) {
    if (fields && fields.length > 0) {
        var index = expression.indexOf(".");
        if (index !== -1) {
            var firstPart = expression.substr(0, index);
            var rest = expression.substr(index + 1);
            var firstPartField = getFieldDef(firstPart, fields);
            if (firstPartField) {
                return Util.getField(rest, firstPartField.fields);
            }
        } else {
            return getFieldDef(expression, fields);
        }
    }
}

Util.replaceDotToUnderscore = function (value) {
    if (value && value.indexOf(".") > 0) {
        return value.replace(/\./g, "_");
    } else {
        return value;
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

function setPlaneData(data, newData, alias) {
    if (data && data.length > 0) {
        for (var i = 0; i < data.length; i++) {
            var record = data[i];
            newData.push(record);
            if (record[alias] && record[alias].length > 0) {
                setPlaneData(record[alias], newData, alias)
            }
//            delete record[alias];   /* we cannot delete children's data as the same rederence used in grid */
        }
    }
}

Util.populateDataKeyMapping = function (data, dataModel) {
    dataModel.keyMapping = {};
    /* used to define the mapping with _id and index of data as this is used in dataRowIndex in pl-grid */
    if (data === undefined || dataModel === undefined || !(Array.isArray(data))) {
        return;
    }
    var _id = undefined;
    for (var i = 0; i < data.length; i++) {
        _id = data[i]._id;
        if (angular.isObject(_id)) {
            _id = JSON.stringify(_id);
        }
        if (dataModel.keyMapping[_id] !== undefined) {
            continue;
            /* if _id may not be present for reporting purpose*/
//            throw new Error("Duplicate _id is not allowed but found with key " + _id);
        }
        dataModel.keyMapping[_id] = i;

    }
};

Util.getDataMappingKey = function (entity, keyMapping) {
    if (entity == undefined || entity._id == undefined || keyMapping === undefined) {
        return undefined;
    } else {
        var _id = entity._id;
        if (angular.isObject(_id)) {
            _id = JSON.stringify(_id);
        }
        return keyMapping[_id];
    }
};

Util.validateData = function (data, query, metadata, dataModel) {
    var viewFields = metadata.viewFields;
    // if viewFields are provided then the data is of the viewField is treated as main data.(manjeet 13-01-2015)
    if (viewFields && viewFields.length > 0) {
        var viewField = viewFields[0];
        if (data && data.length > 1) {
            throw new Error("data length should be equal to 1 when viewFields are defined");
        }
        if (data && data.length > 0) {
            var _id = data[0]["_id"];
            var viewFieldData = data[0][viewField];
            metadata._id = _id;
            data.splice(0, (data.length));
            for (var i = 0; i < viewFieldData.length; i++) {
                data.push(viewFieldData[i]);
            }
        }
    }
    var alias = query && query.$recursion && query.$recursion.$alias ? query.$recursion.$alias : "children";
    ensure_IdInArray(data, alias);
    if (metadata.transformRecursionToLinear) {
        var newData = [];
        setPlaneData(data, newData, alias);
        /* used to moved all children at the top level data */
        dataModel.data = newData;
    }
    if (data && data.length > 0) {
        for (var i = 0; i < data.length; i++) {
            if (!data[i]._id) {
                data[i]._id = Util.getUniqueTempId();
            }
        }
    }
    if (!metadata.dataProcessedOnServer) {
        return ViewUtility.processDataForView(data, query, metadata);
    } else {
        metadata.dataProcessedOnServer = false;
    }
}

Util.setDateWithZeroTimezone = function (dateToSet) {
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

function ensure_IdInArray(data, alias) {
    for (var i = 0; i < data.length; i++) {
        var row = data[i];
        Util.populate_IdInArray(row);
        if (row[alias] && row[alias].length > 0) {
            ensure_IdInArray(row[alias], alias);
        }
    }
}

Util.INC_VALUE = 100;

function handleDown(array, sortField, srcIndex, targetIndex) {
    var updatedFields = [];
    var targetField = array[targetIndex];
    var targetFieldSortOrder = targetField[sortField];
    targetFieldSortOrder = targetFieldSortOrder;
    var sourceField = array[srcIndex];
    if (targetIndex == (array.length - 1)) {  /*is last*/
        sourceField[sortField] = targetFieldSortOrder + Util.INC_VALUE;
        updatedFields.push(sourceField);
    } else {
        var targetNextIndex = targetIndex + 1;
        var targetNextField = array[targetNextIndex];
        if (targetNextField.__systemcolumn__) {
            sourceField[sortField] = targetFieldSortOrder + Util.INC_VALUE;
            updatedFields.push(sourceField);
        } else {
            var targetNextFieldSortOrder = targetNextField[sortField];
            targetNextFieldSortOrder = targetNextFieldSortOrder;

            if (targetFieldSortOrder < targetNextFieldSortOrder) {
                var newValue = (targetFieldSortOrder + targetNextFieldSortOrder ) / 2;
                sourceField[sortField] = newValue;
                updatedFields.push(sourceField);

            } else if (targetFieldSortOrder > targetNextFieldSortOrder) {
                throw new Error("Target next index can never be less than target index")
            } else {
                var counter = 2;    //initial 2, one for it self and one more so that division will not be reach up to next higher value
                var higherValue = undefined;
                var lastIndex = undefined;
                for (var i = targetIndex + 1; i < array.length; i++) {
                    var iteratorField = array[i];
                    if (iteratorField.__systemcolumn__) {
                        break;
                    }
                    var iteratorFieldSortOrder = iteratorField[sortField];
                    iteratorFieldSortOrder = iteratorFieldSortOrder;
                    if (iteratorFieldSortOrder > targetFieldSortOrder) {
                        higherValue = iteratorFieldSortOrder;
                        lastIndex = i - 1;
                        break;
                    } else if (iteratorFieldSortOrder < targetFieldSortOrder) {
                        throw new Error("Target next index can never be less than target index")
                    } else {
                        lastIndex = i;
                        counter += 1;
                    }
                }
                if (higherValue == undefined) {
                    higherValue = targetFieldSortOrder + Util.INC_VALUE;
                }

                var difference = (higherValue - targetFieldSortOrder) / counter;
                var cumulativeDiff = difference + targetFieldSortOrder;
                sourceField[sortField] = cumulativeDiff;
                updatedFields.push(sourceField);
                for (var i = targetIndex + 1; i <= lastIndex; i++) {
                    cumulativeDiff += difference;
                    array[i][sortField] = cumulativeDiff;
                    updatedFields.push(array[i]);
                }
            }
        }

    }
    return updatedFields;
}

function handleUp(array, sortField, srcIndex, targetIndex) {
    var updatedFields = [];
    var targetField = array[targetIndex];
    var targetFieldSortOrder = targetField[sortField];
    targetFieldSortOrder = targetFieldSortOrder;
    var sourceField = array[srcIndex];
    if (targetIndex == 0) {  /*is first*/
        sourceField[sortField] = targetFieldSortOrder - Util.INC_VALUE;
        updatedFields.push(sourceField);
    } else {
        var targetPreviousIndex = targetIndex - 1;
        var targetPreviousField = array[targetPreviousIndex];
        if (targetPreviousField.__systemcolumn__) {
            sourceField[sortField] = targetFieldSortOrder - Util.INC_VALUE;
            updatedFields.push(sourceField);
        } else {
            var targetPreviousFieldSortOrder = targetPreviousField[sortField];
            targetPreviousFieldSortOrder = targetPreviousFieldSortOrder;

            if (targetFieldSortOrder > targetPreviousFieldSortOrder) {
                var newValue = (targetFieldSortOrder + targetPreviousFieldSortOrder ) / 2;
                sourceField[sortField] = newValue;
                updatedFields.push(sourceField);

            } else if (targetFieldSortOrder < targetPreviousFieldSortOrder) {
                throw new Error("Target previous index can never be greater than target index")
            } else {
                var counter = 2;    //initial 2, one for it self and one more so that division will not be reach up to next higher value
                var lowerValue = undefined;
                var lastIndex = undefined;
                for (var i = targetIndex - 1; i >= 0; i--) {
                    var iteratorField = array[i];
                    if (iteratorField.__systemcolumn__) {
                        break;
                    }
                    var iteratorFieldSortOrder = iteratorField[sortField];
                    iteratorFieldSortOrder = iteratorFieldSortOrder;
                    if (iteratorFieldSortOrder < targetFieldSortOrder) {
                        lowerValue = iteratorFieldSortOrder;
                        lastIndex = i + 1;
                        break;
                    } else if (iteratorFieldSortOrder > targetFieldSortOrder) {
                        throw new Error("Target previous index can never be greater than target index")
                    } else {
                        counter += 1;
                        lastIndex = i;
                    }
                }
                if (lowerValue == undefined) {
                    lowerValue = targetFieldSortOrder - Util.INC_VALUE;
                }
                var difference = (targetFieldSortOrder - lowerValue) / counter;
                var cumulativeDiff = targetFieldSortOrder - difference;
                sourceField[sortField] = cumulativeDiff;
                updatedFields.push(sourceField);
                for (var i = targetIndex - 1; i >= lastIndex; i--) {
                    cumulativeDiff -= difference;
                    array[i][sortField] = cumulativeDiff;
                    updatedFields.push(array[i]);
                }
            }
        }

    }
    return updatedFields;
}

Util.changeIndex = function (array, indexField, srcIndex, targetIndex) {
    if (!array || array.length < 2) {
        return;
    }
    if (srcIndex < 0 || srcIndex >= array.length || targetIndex < 0 || targetIndex >= array.length) {
        throw new Error("Index out of bound ");
    }
    if (srcIndex === targetIndex) {
        //both are same
        return;
    }
    var direction = "";
    if (srcIndex < targetIndex) {
        var result = handleDown(array, indexField, srcIndex, targetIndex);
        return result;
    } else {
        var result = handleUp(array, indexField, srcIndex, targetIndex);
        return result;
    }
}

Util.fkQuery = function (db, query, field, value, queryOptions) {
    function getFkData(query, options) {
        if (queryOptions && queryOptions.token) {
            options = options || {};
            options.token = queryOptions.token;
        }
        if (queryOptions && queryOptions.viewId) {
            options = options || {};
            options.viewId = queryOptions.viewId;
        }
        return db.query(query, options);
    }

    function verifyFkResult(query, key, newData) {
        var options = {};
        if (queryOptions && queryOptions.token) {
            options.token = queryOptions.token;
        }
        if (queryOptions && queryOptions.viewId) {
            options.viewId = queryOptions.viewId;
        }
        options.cache = false;
        db.query(query, options).then(function (queryResult) {
            var queryRes = queryResult && queryResult.response && queryResult.response.result ? queryResult.response.result : [];
            if (JSON.stringify(newData.response.result) !== JSON.stringify(queryRes)) {
                db.removeCache(key);
            }
        });
    }

    function filterFkData(result, field, value) {
        if (result && result.response && result.response.result.length > 0) {
            var data = result.response.result;
            var length = data.length;
            var newResult = [];
            if (value) {
                var lowerCaseValue = value.toLowerCase();
                for (var i = 0; i < length; i++) {
                    if (data[i][field] && data[i][field].toLowerCase().indexOf(lowerCaseValue) == 0) {
                        newResult.push(data[i]);
                    }
                }
            } else {
                newResult = data;
            }
            return {response: {result: newResult}};
        }
    }

    function prepareFkOptions(query, value, field, queryOptions, options) {
        var Q = require("q");
        var d = Q.defer();

        if (value && value.trim().length > 0) {
            query.$filter = query.$filter || {};
            value = formatValue(value);
            var filterValue = {"$regex": "^" + value + "", "$options": "i"};
            if (queryOptions.otherDisplayFields && queryOptions.otherDisplayFields.length > 0) {
                var orFilterArray = [];
                var filter = {};
                filter[field] = filterValue;
                orFilterArray.push(filter);
                for (var i = 0; i < queryOptions.otherDisplayFields.length; i++) {
                    var otherDisplayField = queryOptions.otherDisplayFields[i];
                    var otherDisplayFilter = {};
                    otherDisplayFilter[otherDisplayField] = filterValue;
                    orFilterArray.push(otherDisplayFilter);
                }
                delete queryOptions.otherDisplayFields;
                if (query.$filter.$or) {
                    query.$filter.$and = query.$filter.$and || [];
                    query.$filter.$and.push({$or: orFilterArray});
                } else {
                    query.$filter.$or = orFilterArray;
                }

            } else {
                query.$filter[field] = filterValue;
            }
            options.cache = false;
        } else {
            options.cache = true;
        }
        query.$filter && Object.keys(query.$filter).length > 0 ? options.cache = false : options.cache = true;
        if (queryOptions && (!queryOptions.cacheEnabled)) {
            options.cache = false;
        }
        d.resolve();
        return d.promise;
    }

    function formatValue(value) {
        if (value.indexOf('(') >= 0) {
            value = value.replace('(', '\\(');
        }
        if (value.indexOf(')') >= 0) {
            value = value.replace(')', '\\)');
        }
        return value;
    }

    var key = "Query-" + JSON.stringify(query);
    var options = {};
    return prepareFkOptions(query, value, field, queryOptions, options).then(
        function () {
            var result = db.getCache(key);
            return filterFkData(result, field, value);
        }).then(function (newData) {
            if (newData && newData.response.result.length > 0) {
                verifyFkResult(query, key, newData);
                return newData;
            } else {
                return getFkData(query, options);
            }
        });
}

Util.asyncIterator = function (array, task) {
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

function callTask(i, record, task) {
    var D = Q.defer();
    setTimeout(function () {
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
    }, 10);
    return D.promise;
}

Util.removeSpecialChar = function (inputString) {
    if (inputString) {
        var outputString = inputString.replace(/([~!@#$%^&*()_+=`{}\[\]\|\\:;'<>,.\/? ])+/g, '_').replace(/^(_)+|(_)+$/g, '');
        return outputString;
    }
}

Util.replaceDollarAndThis = function (data, changeTo) {
    if (data === true || data === false || data === null || data === undefined) {
        return data;
    }
    if (typeof data==="string" && data.indexOf("$$") < 0) {
        data = data.toString();
        changeTo = changeTo || "row.entity.";
        data = data.replace(/\$/g, changeTo).replace(/\'/g, "\"");
        data = data.replace(/this./g, changeTo).replace(/\'/g, "\"");
    }
    return data;
};