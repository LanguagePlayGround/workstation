var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");
var Q = require("q");

exports.doQuery = function (query, collection, db) {
    var p = ensureFields(query, db);
    if (Q.isPromise(p)) {
        return p.then(
            function () {
                return  handleFKColumns(query, collection);
            })
    } else {
        return handleFKColumns(query, collection);
    }
}

function handleFKColumns(query, collection) {
    var fkColumns = collection.getValue("fkFields") || {};
    var collectionName = collection.getValue("collection");
    if (query[Constants.Query.SORT]) {
        for (var exp in query[Constants.Query.SORT]) {
            ensureSorts(fkColumns, query, exp);
        }
    }
    if (Object.keys(fkColumns).length == 0) {
        return;
    }
    if (query[Constants.Query.FIELDS]) {
        var newQueryFields = {};
        for (var exp in query[Constants.Query.FIELDS]) {
            var fieldValue = query[Constants.Query.FIELDS][exp];
            populateSubQueryInField(newQueryFields, fkColumns, fieldValue, collectionName, query, exp, exp);
        }
        excludeRoleModulesIfRequired(newQueryFields, fkColumns);
        query[Constants.Query.FIELDS] = newQueryFields;
    }
    if (query[Constants.Query.FILTER]) {
        query[Constants.Query.FILTER] = populateFilter(query[Constants.Query.FILTER], query, fkColumns);
    }
}

exports.onValueChange = function (updates, oldRecord, db, options) {
    if (!updates) {
        return;
    }
    var updatedFieldInfo = options.updatedFieldInfo;
    if (!updatedFieldInfo || updatedFieldInfo.type != "fk") {
        throw new Error("updatedFieldInfo must be available and must be fk but found [" + JSON.stringify(updatedFieldInfo) + "]");
    }
    if (!updatedFieldInfo[Constants.Admin.Fields.COLLECTION]) {
        throw new Error("collection is mandatory in field [" + JSON.stringify(updatedFieldInfo) + "]");
    }
    if (!options.field || !options.collectionName) {
        throw new Error("field/collectionName is mandatory in options in onValueChange in DBRef Module.");
    }
    var collectionFieldExp = updatedFieldInfo[Constants.Admin.Fields.FIELD];
    if ((!updatedFieldInfo[Constants.Admin.Fields.UPSERT] || options.upsert) && updates.$set) {
        var message = "Fk Column value can not be updated if upsert is false in column [" + updatedFieldInfo.field + " ] of collection [ " + updatedFieldInfo.collection + " ]";
        var error = new Error(message);
        error.detailMessage = "Fk Column value can not be updated if upsert is false in column [" + JSON.stringify(updatedFieldInfo) + "]";
        throw error;
    }
    return getQueryResult(updatedFieldInfo, updates, oldRecord, db, options).then(
        function (data) {
            populateFieldDoc(updates, data);
        })
}

function excludeRoleModulesIfRequired(newQueryFields, fkColumns) {
    for (var fieldKey in newQueryFields) {
        if (fkColumns[fieldKey]) {
            var fieldValue = newQueryFields[fieldKey];
            if (fieldValue && Utils.isJSONObject(fieldValue) && fieldValue[Constants.Query.Fields.QUERY]) {
                var innerQuery = fieldValue[Constants.Query.Fields.QUERY];
                var innerQueryFields = innerQuery[Constants.Query.FIELDS];
                if (isExcludeModule(innerQueryFields, fkColumns[fieldKey])) {
                    excludeModuleInQuery(innerQuery, "Role");
                }
            }
        }
    }
}

function isExcludeModule(fields, fieldDef) {
    if (!fields) {
        return false;
    }
    var displayField = fieldDef.displayField;
    var setFields = fieldDef.set ? require("../Utility.js").deepClone(fieldDef.set) : [];
    setFields.push("_id");
    if (displayField && setFields.indexOf(displayField) === -1) {
        setFields.push(displayField);
    }
    var otherDisplayFields = fieldDef.otherDisplayFields;
    if (otherDisplayFields) {
        for (var i = 0; i < otherDisplayFields.length; i++) {
            var otherDisplayField = otherDisplayFields[i];
            if (setFields.indexOf(otherDisplayField) === -1) {
                setFields.push(otherDisplayField);
            }
        }
    }
    var innerFields = fieldDef.fields;
    if (innerFields) {
        for (var i = 0; i < innerFields.length; i++) {
            var innerField = innerFields[i];
            if (setFields.indexOf(innerField.field) === -1) {
                setFields.push(innerField.field);
            }
        }
    }
    for (var key in fields) {
        if (setFields.indexOf(key) === -1) {
            return false;
        }
    }
    return true;
}

function excludeModuleInQuery(query, module) {
    if (query[Constants.Query.MODULES] === undefined) {
        query[Constants.Query.MODULES] = {};
    }
    var queryModules = query[Constants.Query.MODULES];
    if (Utils.isJSONObject(queryModules)) {
        var moduleNames = Object.keys(queryModules);
        if (moduleNames.length === 0 || queryModules[moduleNames[0]] === 0) {
            queryModules[module] = 0;
        } else {
            delete queryModules[module];
            if (Object.keys(queryModules).length === 0) {
                query[Constants.Query.MODULES] = false;
            }
        }
    }
}

function populateFilter(filter, query, fkcolumns) {
    var newQueryFilter = {};
    for (var exp in  filter) {
        var filterValue = filter[exp];
        if (exp == Constants.Query.Filter.OR || exp == Constants.Query.Filter.AND) {
            if (!Array.isArray(filterValue)) {
                throw new Error("Filter value must be an Array in $or/$and Filter.");
            }
            var newOrFilterArray = [];
            for (var i = 0; i < filterValue.length; i++) {
                var newOrFilter = populateFilter(filterValue[i], query, fkcolumns);
                newOrFilterArray.push(newOrFilter);
            }
            newQueryFilter[exp] = newOrFilterArray;
        } else {
            if (fkcolumns[exp]) {
                if (Utils.isJSONObject(filterValue) && filterValue._id) {
                    filterValue = filterValue._id;
                }
                exp = exp + "._id";
            }
            populateSubQueryInFilter(newQueryFilter, fkcolumns, filterValue, query, exp, exp);
        }
    }
    return newQueryFilter;
}

function ensureFields(query, db) {
    var fields = query[Constants.Query.FIELDS];
    var fieldKeys = fields ? Object.keys(fields) : undefined;
    if (!fieldKeys || fieldKeys.length === 0) {
        return;
    }
    var subQueryFields = [];
    for (var i = 0; i < fieldKeys.length; i++) {
        var fieldKey = fieldKeys[i];
        var fieldValue = fields[fieldKey];
        var indexOf = fieldKey.indexOf(".");
        if (indexOf > 0) {
            var firstPart = fieldKey.substring(0, indexOf);
            var secondPart = fieldKey.substring(indexOf + 1);
            if (fields[firstPart]) {
                if (secondPart != "_id") {
                    throw new Error("Dotted Fields can not be defined if you want to get whole data.>>SecondPart>>" + secondPart + ">>firstPart>>>" + firstPart + ">>>fields>>>" + JSON.stringify(fields));
                } else {
                    delete fields[fieldKey];
                }
            }
        }
        if (Utils.isJSONObject(fieldValue) && fieldValue[Constants.Query.Fields.QUERY]) {
            subQueryFields.push(fieldValue);
        }
    }
    if (subQueryFields.length === 0) {
        return;
    }
    return Utils.iterateArrayWithPromise(subQueryFields,
        function (index, fieldValue) {
            fieldValue[Constants.Query.Fields.PARENT] = fieldValue[Constants.Query.Fields.PARENT] || "_id";
            var p = ensureFKColumn(fieldValue, Constants.Query.Fields.FK, fieldValue[Constants.Query.Fields.QUERY][Constants.Query.COLLECTION], db)
            if (Q.isPromise(p)) {
                return p.then(function () {
                    return ensureFKColumn(fieldValue, Constants.Query.Fields.PARENT, query[Constants.Query.COLLECTION], db);
                })
            } else {
                return ensureFKColumn(fieldValue, Constants.Query.Fields.PARENT, query[Constants.Query.COLLECTION], db);
            }

        })
}

function ensureFKColumn(fieldValue, property, collectionName, db) {
    var value = fieldValue[property];
    if (value && value !== "_id") {
        return db.collection(collectionName).then(
            function (collection) {
                var fkColumns = collection.getValue("fkFields") || {};
                if (fkColumns[value]) {
                    fieldValue[property] = value + "._id";
                }
            })
    }
}

function ensureSorts(fkColumns, query, exp, pExp) {
    var indexOf = exp.indexOf(".");
    if (indexOf > 0) {
        var firstPart = exp.substring(0, indexOf);
        var secondPart = exp.substring(indexOf + 1);
        pExp = pExp ? pExp + "." + firstPart : firstPart;
        if (fkColumns[firstPart]) {
            var fkColumnDef = fkColumns[firstPart];
            if (secondPart !== "_id" && (!fkColumnDef[Constants.Admin.Fields.SET] || fkColumnDef[Constants.Admin.Fields.SET].indexOf(secondPart) == -1)) {
                throw new Error("Sort [" + JSON.stringify(query[Constants.Query.SORT]) + "] defined on dotted column is not supported for another collection.[" + secondPart + "] must be the part of set fields in field [" + pExp + "]");
            }
        } else {
            ensureSorts(fkColumns, query, secondPart, pExp);
        }
    }
}

function populateSubQueryInField(newQueryFields, fkcolumns, fieldValue, collectionName, query, mainExp, exp, pExp) {
    var indexOf = exp.indexOf(".");
    if (indexOf > 0) {
        var firstPart = exp.substring(0, indexOf);
        var secondPart = exp.substring(indexOf + 1);
        pExp = pExp ? pExp + "." + firstPart : firstPart;
        if (fkcolumns[pExp]) {
            if (newQueryFields[pExp] && Utils.isJSONObject(newQueryFields[pExp]) && newQueryFields[pExp][Constants.Query.Fields.QUERY]) {
                newQueryFields[pExp][Constants.Query.Fields.QUERY][Constants.Query.FIELDS] = newQueryFields[pExp][Constants.Query.Fields.QUERY][Constants.Query.FIELDS] || {};
                newQueryFields[pExp][Constants.Query.Fields.QUERY][Constants.Query.FIELDS] [secondPart] = fieldValue;
            } else {
                var fkColumnDef = fkcolumns[pExp];
                var setFieldIndex = Utils.getSetFieldIndex(fkColumnDef, secondPart);
                if (setFieldIndex === undefined) {
                    var fkQueryFields = {};
                    for (var newFieldExp in newQueryFields) {
                        if (newFieldExp.indexOf(pExp + ".") == 0) {
                            fkQueryFields[newFieldExp.substring(pExp.length + 1)] = newQueryFields[newFieldExp];
                            delete newQueryFields[newFieldExp];
                        }
                    }
                    fkQueryFields[secondPart] = fieldValue;
                    var innerField = {};
                    innerField[Constants.Query.Fields.TYPE] = fkColumnDef[Constants.Admin.Fields.MULTIPLE] ? "n-rows" : "scalar";
                    var innerFieldQuery = {};
                    innerFieldQuery[Constants.Query.COLLECTION] = fkColumnDef[Constants.Admin.Collections.COLLECTION];
                    innerFieldQuery[Constants.Query.FIELDS] = fkQueryFields;
                    if (query[Constants.Query.EVENTS] === false) {
                        innerFieldQuery[Constants.Query.EVENTS] = false;
                    }
                    if (query[Constants.Query.MODULES] !== undefined) {
                        innerFieldQuery[Constants.Query.MODULES] = query[Constants.Query.MODULES];
                    }
                    if (fkColumnDef[Constants.Admin.Fields.ROLE_ID]) {
                        innerFieldQuery[Constants.Query.PARAMETERS] = {};
                        innerFieldQuery[Constants.Query.PARAMETERS][Constants.Query.Parameters.ROLE] = fkColumnDef[Constants.Admin.Fields.ROLE_ID][Constants.Admin.Roles.ID];
                    }
                    innerFieldQuery[Constants.Query.CONTEXT] = {referredField:pExp, referredCollection:collectionName};
                    innerField[Constants.Query.Fields.QUERY] = innerFieldQuery;
                    innerField[Constants.Query.Fields.FK] = "_id";
                    innerField[Constants.Query.Fields.PARENT] = firstPart + "._id";
                    newQueryFields[pExp] = innerField;
                    if (newQueryFields._id === undefined && fieldValue === 1) {
                        newQueryFields._id = 1;
                    }
                } else {
                    newQueryFields[mainExp] = fieldValue;
                }
            }
        } else {
            populateSubQueryInField(newQueryFields, fkcolumns, fieldValue, collectionName, query, mainExp, secondPart, pExp);
        }
    } else {
        newQueryFields[mainExp] = fieldValue;
    }
}

function populateSubQueryInFilter(newQueryFilter, fkcolumns, filterValue, query, mainExp, exp, pExp) {
    var indexOf = exp.indexOf(".");
    if (indexOf > 0) {
        var firstPart = exp.substring(0, indexOf);
        var secondPart = exp.substring(indexOf + 1);
        pExp = pExp ? pExp + "." + firstPart : firstPart;
        if (fkcolumns[pExp]) {
            if (newQueryFilter[pExp + "._id"] && Utils.isJSONObject(newQueryFilter[pExp + "._id"]) && newQueryFilter[pExp + "._id"][Constants.Query.Fields.QUERY]) {
                newQueryFilter[pExp + "._id"][Constants.Query.Fields.QUERY][Constants.Query.FILTER] = newQueryFilter[pExp + "._id"][Constants.Query.Fields.QUERY][Constants.Query.FILTER] || {};
                newQueryFilter[pExp + "._id"][Constants.Query.Fields.QUERY][Constants.Query.FILTER][secondPart] = filterValue;
            } else {
                var fkColumnDef = fkcolumns[pExp];
                var setFieldIndex = Utils.getSetFieldIndex(fkColumnDef, secondPart);
                if (setFieldIndex === undefined) {
                    var fkQueryFilter = {};
                    for (var newFieldExp in newQueryFilter) {
                        if (newFieldExp.indexOf(pExp + ".") == 0) {
                            fkQueryFilter[newFieldExp.substring(pExp.length + 1)] = newQueryFilter[newFieldExp];
                            delete newQueryFilter[newFieldExp];
                        }
                    }
                    fkQueryFilter[secondPart] = filterValue;
                    var innerField = {};
                    var innerFieldQuery = {};
                    innerFieldQuery[Constants.Query.COLLECTION] = fkColumnDef[Constants.Admin.Collections.COLLECTION];
                    innerFieldQuery[Constants.Query.FIELDS] = {_id:1};
                    innerFieldQuery[Constants.Query.FILTER] = fkQueryFilter;
                    if (query[Constants.Query.EVENTS] === false) {
                        innerFieldQuery[Constants.Query.EVENTS] = false;
                    }
                    if (query[Constants.Query.MODULES] !== undefined) {
                        innerFieldQuery[Constants.Query.MODULES] = query[Constants.Query.MODULES];
                    }
                    innerField[Constants.Query.Fields.QUERY] = innerFieldQuery;
                    newQueryFilter[pExp + "._id"] = innerField;
                } else {
                    newQueryFilter[mainExp] = filterValue;
                }
            }
        } else {
            populateSubQueryInFilter(newQueryFilter, fkcolumns, filterValue, query, mainExp, secondPart, pExp);
        }
    } else {
        newQueryFilter[mainExp] = filterValue;
    }
}

function populateUpdateFilter(updates, oldRecord) {
    if (updates.$query) {
        return updates.$query;
    }
    var filter = {};
    if (updates._id) {
        filter._id = updates._id;
    } else if (updates.$set && updates.$set._id) {
        filter._id = updates.$set._id;
    } else if (oldRecord && oldRecord._id) {
        filter._id = oldRecord._id;
    }
    return filter;
}

function getQueryResult(collectionField, updates, oldRecord, db, options) {
    var filter = populateUpdateFilter(updates, oldRecord);
    var innerCollection = undefined;
    return db.collection(collectionField[Constants.Admin.Fields.COLLECTION]).then(
        function (collectionObj) {
            innerCollection = collectionObj;
            var filterKeys = Object.keys(filter);
            return Utils.iterateArrayWithPromise(filterKeys,
                function (index, filterKey) {
                    var innerCollectionFields = innerCollection.getValue(Constants.Admin.Collections.FIELDS);
                    var innerCollectionField = undefined;
                    var innerUpdates = undefined;
                    var noOfFields = innerCollectionFields ? innerCollectionFields.length : 0;
                    for (var i = 0; i < noOfFields; i++) {
                        if (innerCollectionFields[i][Constants.Admin.Fields.FIELD] == filterKey && innerCollectionFields[i][Constants.Admin.Fields.TYPE] == Constants.Admin.Fields.Type.FK) {
                            innerCollectionField = innerCollectionFields[i];
                            innerUpdates = updates.$query[filterKey];
                            break;
                        }
                    }
                    if (!innerCollectionField) {
                        return;
                    }
                    return getQueryResult(innerCollectionField, innerUpdates, oldRecord, db, options).then(
                        function (data) {
                            filter[filterKey] = {_id:data._id};
                        })
                })
        }).then(
        function () {
            return populateResult(collectionField, updates, filter, innerCollection, db, options);
        })
}

function populateResult(collectionField, updates, filter, innerCollection, db, options) {
    var queryFields = {_id:1};
    if (collectionField[Constants.Admin.Fields.SET]) {
        for (var i = 0; i < collectionField[Constants.Admin.Fields.SET].length; i++) {
            queryFields[collectionField[Constants.Admin.Fields.SET][i]] = 1;
        }
    }
    var context = {referredField:options.field, referredCollection:options.collectionName};
    if (collectionField[Constants.Admin.Fields.UPSERT] || options.upsert) {
        delete updates.$query;
        delete updates._id;
        var upsertOptions = {w:1, $events:options[Constants.Query.EVENTS], $modules:options[Constants.Query.MODULES], $context:context};
        if (collectionField[Constants.Admin.Fields.ROLE_ID]) {
            upsertOptions[Constants.Query.PARAMETERS] = {};
            upsertOptions[Constants.Query.PARAMETERS][Constants.Query.Parameters.ROLE] = collectionField[Constants.Admin.Fields.ROLE_ID][Constants.Admin.Roles.ID];
        }
        var innerCollectionName = innerCollection.getValue(Constants.Admin.Collections.COLLECTION);
        return innerCollection.upsert(filter, updates, queryFields, upsertOptions).then(
            function (data) {
                if (!data || Object.keys(data).length == 0) {
                    throw new Error("Record can not be null from upsert in collection [" + innerCollectionName + "] with filter [" + JSON.stringify(filter) + "] and updates [" + JSON.stringify(updates) + "]for field [" + options.updatedFieldInfo.field + "]");
                }
                return data;
            })
    } else {
        if (!filter || Object.keys(filter).length == 0) {
            throw new Error("Query not defined for value [" + JSON.stringify(updates) + "] on field [" + collectionField.field + "] if upsert is false.");
        }
        var query = {};
        query[Constants.Query.COLLECTION] = collectionField[Constants.Admin.Fields.COLLECTION];
        query[Constants.Query.FIELDS] = queryFields;
        query[Constants.Query.FILTER] = filter;
        query[Constants.Query.LIMIT] = 2;
        if (options[Constants.Query.EVENTS] === false) {
            query[Constants.Query.EVENTS] = false;
        }
        if (options[Constants.Query.MODULES] !== undefined) {
            query[Constants.Query.MODULES] = options[Constants.Query.MODULES];
        }
        if (collectionField[Constants.Admin.Fields.ROLE_ID]) {
            query[Constants.Query.PARAMETERS] = {};
            query[Constants.Query.PARAMETERS][Constants.Query.Parameters.ROLE] = collectionField[Constants.Admin.Fields.ROLE_ID][Constants.Admin.Roles.ID];
        }
        query[Constants.Query.CONTEXT] = context;
        return db.query(query).then(
            function (data) {
                if (data.result.length == 0) {
                    var mainCollectionName = collectionField.collectionid ? collectionField.collectionid.collection : (options && options.query ? options.query.$collection : query.$collection);
                    var message = "Autosave is not allowed if upsert is false in column [  " + collectionField.field + " ] of collection [ " + mainCollectionName + " ]";
                    var error = new Error(message);
                    error.detailMessage = "Autosave is not allowed if upsert is false in column [ --  " + JSON.stringify(collectionField) + " -- ], Query [" + JSON.stringify(query) + "], Result [" + JSON.stringify(data.result) + "]" + "],Field Doc[" + JSON.stringify(updates) + "]";
                    throw error;
                    return;
                }
                if (data.result.length > 1) {
                    var mainCollectionName = collectionField.collectionid ? collectionField.collectionid.collection : (options && options.query ? options.query.$collection : query.$collection);
                    var message = " More than one result found for column [  " + collectionField.field + " ] of collection [ " + mainCollectionName + " ]";
                    var error = new Error(message);
                    error.detailMessage = "More than one result found for column [" + JSON.stringify(collectionField) + "], Query [" + JSON.stringify(query) + "], Result [" + JSON.stringify(data.result) + "]";
                    throw error;
                    return;
                }
                return data.result[0];
            });
    }
}

function populateFieldDoc(updates, data) {
    for (var exp in updates) {
        delete updates[exp];
    }
    for (var exp in data) {
        updates[exp] = data[exp];
    }
}