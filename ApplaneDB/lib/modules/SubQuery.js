var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");
var Q = require("q");

exports.doQuery = function (query, collection, db, options) {
    var subQueryFields = removeSubQueryFields(query);
    var resolvedFilterQuery = resolveFilterSubQuery(query[Constants.Query.FILTER], query, db, options);
    if (Q.isPromise(resolvedFilterQuery)) {
        return resolvedFilterQuery.then(function () {
            /*
             Rohit Bansal 11-03-2015
             We should not ignore subquery as case exists when data will come by group by and there is sub query column
             total_working_hrs : employee_id,working_hrs,date
             total_bills_hrs : employee_id, billed_hrs,date
             {$collection:"total_working_hrs",$fields:{total_billing_hrs:{$query:{$collection:"billing_hrs"},$fk:"employee_id",$parent:"$empoyee_id"}} $group:{_id:$employee_id,employee_id:{$first:"$employee_id"},totalworking_hrs:{$sum:$working_hrs},$fields:false}}
             if (query[Constants.Query.GROUP]) {
             //SubQuery does not understand result given by group by data.
             return;
             }*/
            if (!subQueryFields) {
                return;
            }
            return manageSort(query, subQueryFields, collection, db, options);
        })
    } else if (subQueryFields) {
        return manageSort(query, subQueryFields, collection, db, options);
    }
}

function manageSort(query, subQueryFields, collection, db, options) {
    var querySort = query[Constants.Query.SORT];
    if (!querySort) {
        return;
    }
    var fkColumns = collection.getValue("fkFields") || {};
    var sortOnSubQueryField = getSortOnSubQueryField(querySort, fkColumns, subQueryFields);
    if (!sortOnSubQueryField) {
        return;
    }
    var subQuerySortKeys = Object.keys(sortOnSubQueryField);
    if (subQuerySortKeys.length > 1) {
        throw new Error("Sorting is supported on only single subquery Field.Query defined is  [" + JSON.stringify(options.query) + "]");
    }
    if (Object.keys(querySort).length === 0) {
        delete query[Constants.Query.SORT];
    }
    var subQueryFieldKey = subQuerySortKeys[0];
    var subQueryFieldValue = subQueryFields[subQueryFieldKey];
    var subQuerySort = sortOnSubQueryField[subQueryFieldKey];
    if (subQueryFieldValue.$join && subQueryFieldValue.$join === "right") {
        if (options.query[Constants.Query.RECURSION]) {
            throw new Error("Recursion and $join in subQuery can not be combined together.Query defined [" + JSON.stringify(options.query) + "]");
        }
        return manageSortInSubQuery(subQuerySort, subQueryFieldKey, subQueryFieldValue, query, db, options);
    } else {
        //Work done for defined sort in main query.
        return manageSortInMainQuery(subQuerySort, query);
    }
}

function manageSortInSubQuery(subQuerySort, subQueryFieldKey, subQueryFieldValue, query, db, options) {
    var newSubQuerySort = {};
    var sortKey = Object.keys(subQuerySort)[0];
    var sortValue = subQuerySort[sortKey];
    var newSortKey = (sortKey === subQueryFieldKey) ? "" : sortKey.substring(subQueryFieldKey.length + 1);
    var subQueryFieldType = subQueryFieldValue.$type;
    if (subQueryFieldType && Utils.isJSONObject(subQueryFieldType) && subQueryFieldType.scalar) {
        var scalarField = subQueryFieldType.scalar;
        newSortKey = newSortKey ? scalarField + "." + newSortKey : scalarField;
    }
    if (!newSortKey) {
        throw new Error("Sort for subQuery does not defined proper.Query defined [" + JSON.stringify(options.query) + "]");
    }
    newSubQuerySort[newSortKey] = sortValue;
    return resolveSortInSubQuery(newSubQuerySort, subQueryFieldValue, query, db, options).then(function (result) {
        if (result) {
            query.$moduleInfo.SubQuery.data = query.$moduleInfo.SubQuery.data || {};
            query.$moduleInfo.SubQuery.data[subQueryFieldKey] = result;
        }
    });
}

function manageSortInMainQuery(subQuerySort, query) {
    query.$moduleInfo.SubQuery.sort = subQuerySort;
    query.$moduleInfo.SubQuery.skip = query[Constants.Query.SKIP];
    query.$moduleInfo.SubQuery.limit = query[Constants.Query.LIMIT];
    delete query[Constants.Query.SKIP];
    delete query[Constants.Query.LIMIT];
}

function getSortOnSubQueryField(querySort, fkColumns, subQueryFields) {
    var sortInSubQuery = undefined;
    var sortKeys = querySort ? Object.keys(querySort) : [];
    for (var subQueryFieldKey in subQueryFields) {
        for (var j = 0; j < sortKeys.length; j++) {
            var sortKey = sortKeys[j];
            if (sortKey === subQueryFieldKey || sortKey.indexOf(subQueryFieldKey + ".") === 0) {
                if (sortKey.indexOf(subQueryFieldKey + ".") === 0) {
                    //do not need to remove sort from query if sorting defined on fk fields which is defined as subquery due to get non set fields in query but sorted field is part of set field in fk field.
                    //Used for invoice having filter of customer,prifitcenter and error occurs -- sorting defined only on one subquery field which is not required for sorting on setField in fk.
                    var nextPart = sortKey.substring(subQueryFieldKey.length + 1);
                    var setFieldIndex = Utils.getSetFieldIndex(fkColumns[subQueryFieldKey], nextPart);
                    if (setFieldIndex !== undefined) {
                        continue;
                    }
                }
                sortInSubQuery = sortInSubQuery || {};
                var subQuerySort = {};
                subQuerySort[sortKey] = querySort[sortKey];
                sortInSubQuery[subQueryFieldKey] = subQuerySort;
                delete querySort[sortKey];
                break;
            }
        }
    }
    return sortInSubQuery;
}

function resolveSortInSubQuery(subQuerySort, subQueryFieldValue, query, db, options) {
    var sortToAdd = subQueryFieldValue.$query.$group || subQueryFieldValue.$query;
    if (sortToAdd.$sort) {
        for (var k in subQuerySort) {
            if (sortToAdd.$sort[k] === undefined) {
                sortToAdd.$sort[k] = subQuerySort[k];
            }
        }
    } else {
        sortToAdd.$sort = subQuerySort;
    }
    if (query.$limit !== undefined && subQueryFieldValue.$query.$limit === undefined) {
        subQueryFieldValue.$query.$limit = query.$limit;
        delete query.$limit;
    }
    if (query.$skip !== undefined && subQueryFieldValue.$query.$skip === undefined) {
        subQueryFieldValue.$query.$skip = query.$skip;
        delete query.$skip;
    }
    return resolveQueryIfFilter(query, db).then(
        function (filterResult) {
            filterResult = filterResult || {$exists:true};
            return resolveSubQuery(subQueryFieldValue, filterResult, undefined, query, db, options);
        }).then(function (result) {
            var data = result.result;
            var fkValues = [];
            for (var i = 0; i < data.length; i++) {
                var row = data[i];
                var fkValue = row[Utils.replaceDotToUnderscore(subQueryFieldValue.$fk)];
                if (fkValue) {
                    fkValues.push(fkValue);
                }
            }
            var newQueryFilter = {};
            newQueryFilter[subQueryFieldValue.$parent || "_id"] = fkValues.length === 1 ? fkValues[0] : {$in:fkValues};
            query.$filter = newQueryFilter;
            return result;
        })
}

function resolveQueryIfFilter(query, db) {
    if (!query.$filter) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var queryToExecute = {$collection:query.$collection, $fields:{_id:1}, $filter:query.$filter, $parameters:query.$parameters, $modules:{Role:0}};
    if (query.runOnES) {
        queryToExecute.runOnES = query.runOnES;
    }
    if (query.$cache) {
        queryToExecute.$cache = query.$cache;
    }
    return db.query(queryToExecute).then(function (data) {
        data = data.result;
        var filterResult = [];
        for (var i = 0; i < data.length; i++) {
            filterResult.push(data[i]._id);
        }
        return filterResult;
    })
}

function resolveSubQuery(fieldValue, filterValue, fieldData, query, db, options) {
    if (fieldData) {
        var d = Q.defer();
        d.resolve(fieldData);
        return d.promise;
    }
    var subQuery = populateSubQuery(fieldValue);
    if (filterValue) {
        var filterValueToPush = filterValue;
        if (Array.isArray(filterValue)) {
            filterValueToPush = filterValue.length === 1 ? filterValue[0] : {$in:filterValue};
        }
        var fkColumn = fieldValue[Constants.Query.Fields.FK];
        //to check value exist in filter for simple field or field with ._id to avoid $and.As In case of menu query,applicationid._id is not found in filter if we put applicationid filter in $and,then error occurs.
        var otherFieldToCheck = undefined;
        if (fkColumn.indexOf("._id") === (fkColumn.length - 4)) {
            otherFieldToCheck = fkColumn.substring(0, (fkColumn.length - 4));
        } else {
            otherFieldToCheck = fkColumn + "._id";
        }
        if (subQuery[Constants.Query.FILTER] && (subQuery[Constants.Query.FILTER][fkColumn] || subQuery[Constants.Query.FILTER][otherFieldToCheck])) {
            subQuery[Constants.Query.FILTER].$and = subQuery[Constants.Query.FILTER].$and || [];
            var andFilter = {};
            andFilter[fieldValue[Constants.Query.Fields.FK]] = filterValueToPush;
            subQuery[Constants.Query.FILTER].$and.push(andFilter);
        } else {
            subQuery[Constants.Query.FILTER] = subQuery[Constants.Query.FILTER] || {};
            subQuery[Constants.Query.FILTER][fkColumn] = filterValueToPush
        }
    }
    if (query[Constants.Query.EVENTS] === false) {
        subQuery[Constants.Query.EVENTS] = false;
    }
    if (query[Constants.Query.MODULES] !== undefined) {
        subQuery[Constants.Query.MODULES] = query[Constants.Query.MODULES];
    }
    if (query[Constants.Query.PARAMETERS] !== undefined) {
        subQuery[Constants.Query.PARAMETERS] = subQuery[Constants.Query.PARAMETERS] || {};
        for (var k in query[Constants.Query.PARAMETERS]) {
            if (subQuery[Constants.Query.PARAMETERS][k] === undefined) {
                subQuery[Constants.Query.PARAMETERS][k] = query[Constants.Query.PARAMETERS][k];
            }
        }
    }
    if (options && options.executionLevel) {
        options.executionLevel = options.executionLevel + 1;
    }
//    console.log("SubQuery>>>>>>>>>>>>>>>>>>>>" + JSON.stringify(subQuery));
    if (query.runOnES) {
        subQuery.runOnES = query.runOnES;
    }
    if (query.$cache) {
        subQuery.$cache = query.$cache;
    }
    return db.query(subQuery, options);
}

exports.doResult = function (query, result, collection, db, options) {
    if (result.result.length == 0 || !query.$moduleInfo || !query.$moduleInfo.SubQuery || !query.$moduleInfo.SubQuery.fields) {
        return;
    }
    var subQueryFields = query.$moduleInfo.SubQuery.fields;
    var subQueryData = query.$moduleInfo.SubQuery.data;
    var fieldKeys = Object.keys(subQueryFields);
    return Utils.iterateArrayWithPromise(fieldKeys,
        function (index, fieldKey) {
            var fieldValue = subQueryFields[fieldKey];
            var fieldData = subQueryData ? subQueryData[fieldKey] : undefined;
            var filterResult = undefined;
            if (!fieldData) {
                filterResult = [];
                populateFilterResult(filterResult, result.result, fieldKey, (fieldValue[Constants.Query.Fields.PARENT] || "_id"));
                if (filterResult.length == 0) {
                    return;
                }
            }
            return resolveSubQuery(fieldValue, filterResult, fieldData, query, db, options).then(
                function (subQueryResult) {
                    var subQueryData = subQueryResult.result;
                    if (subQueryData.length === 0) {
                        return;
                    }
                    var newSubQueryData = {};
                    var fkColumnAlias = fieldValue[Constants.Query.Fields.QUERY][Constants.Query.GROUP] ? Utils.replaceDotToUnderscore(fieldValue[Constants.Query.Fields.FK]) : fieldValue[Constants.Query.Fields.FK];
                    for (var j = 0; j < subQueryData.length; j++) {
                        var subQueryRow = subQueryData[j];
                        var fkColumnValue = Utils.resolveValue(subQueryRow, fkColumnAlias);
                        if (fkColumnValue) {
                            if (Array.isArray(fkColumnValue)) {
                                for (var i = 0; i < fkColumnValue.length; i++) {
                                    var fkColumnSingleValue = fkColumnValue[i];
                                    newSubQueryData[fkColumnSingleValue] = newSubQueryData[fkColumnSingleValue] || [];
                                    newSubQueryData[fkColumnSingleValue].push(subQueryRow);
                                }
                            } else {
                                newSubQueryData[fkColumnValue] = newSubQueryData[fkColumnValue] || [];
                                newSubQueryData[fkColumnValue].push(subQueryRow);
                            }
                        }
                        populateIdColumnValue(subQueryRow, fkColumnAlias);
                    }
                    if (Object.keys(newSubQueryData).length === 0) {
                        return;
                    }
                    var parentColumn = fieldValue[Constants.Query.Fields.PARENT] || "_id";
                    var type = fieldValue[Constants.Query.Fields.TYPE] || "scalar";
                    var ensureColumn = fieldValue[Constants.Query.Fields.ENSURE];
                    var sTime = new Date();
                    mergeResult(result.result, newSubQueryData, fieldKey, parentColumn, type, ensureColumn);
                    db.logMongoTime("SubQueryResultCount", (new Date() - sTime), true);
                    if (fieldData) {
                        if (subQueryResult.dataInfo.hasNext) {
                            result.dataInfo = result.dataInfo || {};
                            result.dataInfo.hasNext = subQueryResult.dataInfo.hasNext;
                        }
                        sortData(result.result, subQueryData, fieldValue.$fk, parentColumn);
                    }
                })
        }).then(
        function () {
            if (query.$moduleInfo.SubQuery.sort) {
                var sortInSubQuery = query.$moduleInfo.SubQuery.sort;
                var sortKeys = Object.keys(sortInSubQuery);
                var sortType = sortInSubQuery[sortKeys[0]] === -1 ? "desc" : "asc";
                Utils.sort(result.result, sortType, sortKeys[0]);
            }
            if (query.$moduleInfo.SubQuery.limit !== undefined) {
                manageResultByLimit(query, result);
            }
            delete query.$moduleInfo.SubQuery;
        })
}

function manageResultByLimit(query, result) {
    var data = result.result;
    var skip = query.$moduleInfo.SubQuery.skip || 0;
    data.splice(0, skip);
    var limit = query.$moduleInfo.SubQuery.limit || 0;
    var dataLength = data.length;
    if (dataLength > limit) {
        result.dataInfo = result.dataInfo || {};
        result.dataInfo.hasNext = true;
        data.splice(limit, (dataLength - limit));
    }
}

function sortData(result, subQueryResult, fkColumn, parentColumn) {
    fkColumn = Utils.replaceDotToUnderscore(fkColumn);
    var newResult = [];
    for (var i = 0; i < subQueryResult.length; i++) {
        for (var j = 0; j < result.length; j++) {
            var mainRow = result[j];
            if (Utils.deepEqual(Utils.resolveValue(mainRow, parentColumn), subQueryResult[i][fkColumn])) {
                newResult.push(mainRow);
                result.splice(j, 1);
                j = j - 1;
            }
        }
    }
    if (result.length > 0) {
        throw new Error("Result does not match proper with subQuery result.");
    }
    result.push.apply(result, newResult);
}

function resolveFilterSubQuery(filter, query, db, options) {
    var filterKeys = filter ? Object.keys(filter) : undefined;
    if (!filterKeys || filterKeys.length === 0) {
        return;
    }
    return Utils.iterateArrayWithPromise(filterKeys, function (index, filterKey) {
        if (filterKey == Constants.Query.Filter.OR || filterKey == Constants.Query.Filter.AND) {
            var filterValues = filter[filterKey];
            return Utils.iterateArrayWithPromise(filterValues, function (innerIndex, filterValue) {
                return resolveFilterSubQuery(filterValue, query, db, options);
            })
        } else {
            return populateFilterSubQuery(filter, filterKey, query, db, options);
        }
    })
}

function populateFilterSubQuery(filter, filterKey, query, db, options) {
    var filterValue = filter[filterKey];
    if (!Utils.isJSONObject(filterValue) || !filterValue[Constants.Query.Fields.QUERY]) {
        return;
    }
    var filterSubQuery = filterValue[Constants.Query.Fields.QUERY];
    if (filterSubQuery[Constants.Query.GROUP]) {
        throw new Error("Group is not allowed in filter subQuery.");
    }
    if (!filterSubQuery[Constants.Query.FIELDS]) {
        throw new Error("Field is mandatory in case of subquery in filter.");
    }
    if (Object.keys(filterSubQuery[Constants.Query.FIELDS]).length != 1) {
        new Error("One Field can be defined in fields in subquery defined in filter.");
    }
    if (query[Constants.Query.EVENTS] === false) {
        filterSubQuery[Constants.Query.EVENTS] = false;
    }
    if (query[Constants.Query.MODULES] !== undefined) {
        filterSubQuery[Constants.Query.MODULES] = query[Constants.Query.MODULES];
    }
    if (query[Constants.Query.PARAMETERS] !== undefined) {
        filterSubQuery[Constants.Query.PARAMETERS] = query[Constants.Query.PARAMETERS];
    }
    if (query.runOnES) {
        filterSubQuery.runOnES = query.runOnES;
    }
    if (query.$cache) {
        filterSubQuery.$cache = query.$cache;
    }
    var fieldColumn = Object.keys(filterSubQuery[Constants.Query.FIELDS])[0];
    if (options && options.executionLevel) {
        options.executionLevel = options.executionLevel + 1;
    }
    return db.query(filterSubQuery, options).then(
        function (filterQueryResult) {
            var filterData = [];
            var filterResultLength = filterQueryResult.result ? filterQueryResult.result.length : 0;
            for (var i = 0; i < filterResultLength; i++) {
                var row = filterQueryResult.result[i];
                //TODO if field column value is Array
                var fieldColumnValue = Utils.resolveValue(row, fieldColumn);
                if (fieldColumnValue) {
                    filterData.push(fieldColumnValue);
                }
            }
            filter[filterKey] = filterData.length == 1 ? filterData[0] : {$in:filterData};
        })
}

function removeSubQueryFields(query) {
    var fields = query[Constants.Query.FIELDS];
    var subQueryFields = undefined;
    var parentFields = {};
    for (var fieldKey in fields) {
        var fieldValue = fields[fieldKey];
        if (Utils.isJSONObject(fieldValue)) {
            if (fieldValue[Constants.Query.Fields.QUERY]) {
                if (!fieldValue[Constants.Query.Fields.FK]) {
                    throw new Error("fk is not defined in field [" + fieldValue + "]");
                }
                subQueryFields = subQueryFields || {};
                subQueryFields[fieldKey] = fields[fieldKey];
                delete fields[fieldKey];
            } else {
                throw new Error("If query is not defined can't define Object in field [" + JSON.stringify(fieldValue) + "]");
            }
            var parentColumn = fieldValue[Constants.Query.Fields.PARENT] || "_id";
            if (fieldKey.lastIndexOf(".") != -1) {
                parentColumn = fieldKey.substring(0, fieldKey.lastIndexOf(".")) + "." + parentColumn;
            }
            ensureColumnInFields(parentColumn, parentFields, fields);
        }
    }
    if (addField(fields)) {
        for (var key in parentFields) {
            fields[key] = parentFields[key];
        }
    }
    if (subQueryFields) {
        query.$moduleInfo = query.$moduleInfo || {};
        query.$moduleInfo.SubQuery = query.$moduleInfo.SubQuery || {};
        query.$moduleInfo.SubQuery.fields = subQueryFields;
        return subQueryFields;
    }
}

function addField(fields) {
    for (var exp in fields) {
        var fieldValue = fields[exp];
        if (fieldValue !== 0 && !Utils.isJSONObject(fieldValue)) {
            return true;
        }
    }
}

function ensureColumnInFields(columnName, fields, queryFields) {
    //TODO handling of adding column in fields,Error if dotted and without dotted expression already exists.
    if (columnName.length < 5 || queryFields[columnName.substring(0, columnName.length - 4)] === undefined) {
        fields[columnName] = 1;
    }
}

function populateIdColumnValue(subQueryRow, fkColumnAlias) {
    var subQueryRowId = subQueryRow._id;
    if (Array.isArray(subQueryRowId)) {
        throw new Error("Array is not supported in result [" + JSON.stringify(subQueryRowId) + "]");
    } else if (subQueryRowId instanceof Object) {
        var keys = Object.keys(subQueryRowId);
        if (keys.length == 1) {
            subQueryRow._id = subQueryRowId[keys[0]];
        } else {
            delete subQueryRowId[fkColumnAlias];
            var keysAfterRemove = Object.keys(subQueryRowId);
            if (keysAfterRemove.length == 1) {
                subQueryRow._id = subQueryRowId[keysAfterRemove[0]];
            }
        }
    }
}

function mergeResult(result, subQueryResult, fieldKey, parentColumn, type, ensureColumn) {
    for (var i = 0; i < result.length; i++) {
        var row = result[i];
        if (fieldKey.indexOf(".") != -1) {
            var fieldKeyResult = Utils.resolveValue(row, fieldKey.substring(0, fieldKey.indexOf(".")));
            if (!(Array.isArray(fieldKeyResult))) {
                fieldKeyResult = [fieldKeyResult];
            }
            mergeResult(fieldKeyResult, subQueryResult, fieldKey.substring(fieldKey.indexOf(".") + 1), parentColumn, type, ensureColumn);
        } else {
            var parentColumnValues = Utils.resolveValue(row, parentColumn);
            if (parentColumnValues) {
                if (!(Array.isArray(parentColumnValues))) {
                    parentColumnValues = [parentColumnValues];
                }
                var dataArray = [];
                mergeSubQueryResultInRow(dataArray, subQueryResult, parentColumnValues, type);
                if (dataArray.length > 0 || ensureColumn) {
                    if (Utils.isJSONObject(type)) {
                        var typeKey = Object.keys(type)[0];
                        var typeValue = type[typeKey];
                        if (typeKey === "scalar") {
                            row[fieldKey] = Utils.resolveValue(dataArray[0], typeValue);
                        } else if (typeKey === "n-columns") {
                            for (var j = 0; j < dataArray.length; j++) {
                                var dataRow = dataArray[j];
                                var valueField = Utils.resolveValue(dataRow, typeValue);
                                row[valueField] = dataRow;
                            }
                        } else {
                            throw new Error("unsupported type [" + typeKey + "]");
                        }
                    } else {
                        row[fieldKey] = (type == "scalar") ? (dataArray.length > 0 ? dataArray[0] : {}) : dataArray;
                    }
                }
            }
        }
    }
}

function mergeSubQueryResultInRow(dataArray, subQueryResult, parentColumnValues, type) {
    for (var i = 0; i < parentColumnValues.length; i++) {
        var parentValue = parentColumnValues[i];
        var mergeArray = subQueryResult[parentValue];
        if (mergeArray) {
            if (type === "scalar" || (typeof type === "object" && type.scalar)) {
                dataArray.push(mergeArray[0]);
                break;
            } else {
                dataArray.push.apply(dataArray, mergeArray);
            }
        }
    }
}

function populateSubQuery(fieldValue) {
    var subQuery = fieldValue[Constants.Query.Fields.QUERY];
    if (subQuery[Constants.Query.GROUP]) {
        var groupId = subQuery[Constants.Query.GROUP]._id;
        if (groupId) {
            if (Array.isArray(groupId)) {
                throw new Error("");
            }
            if (!(groupId instanceof Object)) {
                var groupColumn = groupId.substring(1);
                var newGroupId = {};
                newGroupId[Utils.replaceDotToUnderscore(groupColumn)] = groupId;
                groupId = newGroupId;
            }
            groupId[Utils.replaceDotToUnderscore(fieldValue[Constants.Query.Fields.FK])] = "$" + fieldValue[Constants.Query.Fields.FK];
        } else {
            groupId = "$" + fieldValue[Constants.Query.Fields.FK];
        }
        subQuery[Constants.Query.GROUP]._id = groupId;
        subQuery[Constants.Query.GROUP][Utils.replaceDotToUnderscore(fieldValue[Constants.Query.Fields.FK])] = {$first:"$" + fieldValue[Constants.Query.Fields.FK]};
//        fieldValue.$fk = Utils.replaceDotToUnderscore(fieldValue.$fk)
    }
    if (fieldValue[Constants.Query.Fields.FK] && fieldValue[Constants.Query.Fields.QUERY][Constants.Query.FIELDS] && Object.keys(fieldValue[Constants.Query.Fields.QUERY][Constants.Query.FIELDS]).length > 0) {
        var queryFields = fieldValue[Constants.Query.Fields.QUERY][Constants.Query.FIELDS];
        if (addField(queryFields)) {
            ensureColumnInFields(fieldValue[Constants.Query.Fields.FK], queryFields, queryFields);
        }
    }
    return subQuery;
}

function populateFilterResult(parentResult, result, fieldKey, parentColumn) {
    if (fieldKey.lastIndexOf(".") != -1) {
        parentColumn = fieldKey.substring(0, fieldKey.lastIndexOf(".")) + "." + parentColumn;
    }
    for (var i = 0; i < result.length; i++) {
        var row = result[i];
        var value = Utils.resolveValue(row, parentColumn);
        if (value) {
            if (Array.isArray(value)) {
                for (var j = 0; j < value.length; j++) {
                    if (parentResult.indexOf(value[j]) == -1) {
                        parentResult.push(value[j]);
                    }
                }
            } else {
                if (parentResult.indexOf(value) == -1) {
                    parentResult.push(value);
                }
            }
        }
    }
}