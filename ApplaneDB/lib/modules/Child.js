/**
* Created with IntelliJ IDEA.
* User: daffodil
* Date: 24/4/14
* Time: 7:02 PM
* To change this template use File | Settings | File Templates.
*
*
*  Child Module Will remove child column data from Docuemnt and that child is reuired for Trigger Module
*  So Child Module will execute after Trigger  Modulein Update.
*  Also Child Module will execute in update like after DBRef/subQuery/Recursion/Group but before transaction module bcz we need to remove child data from saving.
*  Child Module executes in Query before DBRef/SubQuery/Recusrion Module because we need to add subquery of child to get child data before execute Query.
*  Child Module will add subquery in fields if child is defined in Query.
*  Recursion will be added in query if futhter childs are defined in child.
*
*
*
*/

var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");

exports.doQuery = function (query, collection, db) {
    var childFields = collection.getValue("childFields");
    if (!childFields) {
        return;
    }
    var queryFields = query[Constants.Query.FIELDS];
    var firstValue = undefined;
    for (var key in queryFields) {
        var value = queryFields[key];
        if (!Utils.isJSONObject(value)) {
            firstValue = value;
            break;
        }
    }
    var newQueryFields = {};
    for (var key in childFields) {
        var childField = childFields[key];
        var fieldQuery = JSON.parse(childField[Constants.Admin.Fields.QUERY]);
        populateChildFields(key, fieldQuery, queryFields, newQueryFields, firstValue);
    }
    if (Object.keys(newQueryFields).length > 0) {
        query[Constants.Query.FIELDS] = query[Constants.Query.FIELDS] || {};
        for (var exp in newQueryFields) {
            query[Constants.Query.FIELDS][exp] = newQueryFields[exp];
        }
    }
}

exports.onPreSave = function (event, document, collection, db, options) {
    var childFields = collection.getValue("childFields");
    if (!childFields) {
        return;
    }
    for (var key in childFields) {
        var collectionField = childFields[key];
        var fieldQuery = JSON.parse(collectionField[Constants.Admin.Fields.QUERY]);
        var collectionFieldType = collectionField[Constants.Admin.Fields.TYPE];
        if (collectionFieldType !== Constants.Admin.Fields.Type.OBJECT || !collectionField[Constants.Admin.Fields.MULTIPLE]) {
            throw new Error("Child Query defined only for Object type multiple column but column found [" + JSON.stringify(collectionField) + "]");
        }
        if (!fieldQuery[Constants.Query.Fields.QUERY]) {
            throw new Error("$query is mandatory in query [" + JSON.stringify(fieldQuery) + "] in field [" + JSON.stringify(collectionField) + "]");
        }
        if (!fieldQuery[Constants.Query.Fields.FK]) {
            throw new Error("$fk is mandatory in query [" + JSON.stringify(fieldQuery) + "] in field [" + JSON.stringify(collectionField) + "]");
        }
        var collectionFieldExp = collectionField[Constants.Admin.Fields.FIELD];
        var value = document.updates ? (document.updates[collectionFieldExp] || (document.updates.$set && document.updates.$set[collectionFieldExp]) || (document.updates.$unset && document.updates.$unset[collectionFieldExp] ? null : undefined)) : undefined;
        document.set(collectionFieldExp, undefined);
        document.unset(collectionFieldExp, undefined);
        document.setChild(collectionFieldExp, value);
    }
}

exports.onPostSave = function (event, document, collection, db, options) {
    var childFields = collection.getValue("childFields");
    if (!childFields) {
        return;
    }
    if (!document.get("_id")) {
        throw new Error("DocumentId not found in doc" + JSON.stringify(document));
    }
    var childDocument = document.child;
    if (!childDocument) {
        return;
    }
    document.set("child", undefined);
    for (var childKey in childDocument) {
        document.set(childKey, childDocument[childKey]);
    }
    var childFieldKeys = Object.keys(childFields);
    return Utils.iterateArrayWithPromise(childFieldKeys, function (index, childFieldKey) {
        var collectionField = childFields[childFieldKey];
        var fieldQuery = JSON.parse(collectionField[Constants.Admin.Fields.QUERY]);
        var childQuery = fieldQuery[Constants.Query.Fields.QUERY];
        var alias = collectionField[Constants.Admin.Fields.FIELD];
        var fkColumn = fieldQuery[Constants.Query.Fields.FK];
        var otherFkColumn = fieldQuery[Constants.Query.Fields.OTHER_FK];
        return db.collection(childQuery[Constants.Query.COLLECTION]).then(
            function (childCollection) {
                var aliasValue = childDocument[alias];
                if (aliasValue !== undefined) {
                    var collectionToPut = childCollection.options && childCollection.options[Constants.Admin.Collections.COLLECTION] ? childCollection.options : childCollection[Constants.Admin.Collections.COLLECTION];
                    if (Array.isArray(aliasValue)) {
                        /**
                         * In this Case,We need to override all values of Child.like Override Deliveries of orders.
                         * For this,Remove all records of child if exists.
                         */

                        return resolveOverrideChilds(aliasValue, document, collectionToPut, fkColumn, otherFkColumn, db, options);
                    } else if (Utils.isJSONObject(aliasValue)) {
                        return resolveChilds(aliasValue, aliasValue[Constants.Update.INSERT], document, collectionToPut, fkColumn, otherFkColumn, db, options);
                    } else if (aliasValue == null) {
                        /**
                         * If child values is set to null i.e. unset deliveries in childs of orders.
                         */
                        return  removeChildRecords(collectionToPut, document, fkColumn, db, options);
                    } else {
                        throw new Error("Alias Value must be Object [" + aliasValue + "] in for field [" + JSON.stringify(collectionField));
                    }
                }
            }
        )
    })
}


function addParentColumnId(document, value, fkColumn, otherFkColumns) {
    if (value) {
        var valueToUpdate = {};
        valueToUpdate[fkColumn] = {_id:document.get("_id")};
        if (otherFkColumns && otherFkColumns.length > 0) {
            for (var i = 0; i < otherFkColumns.length; i++) {
                var otherFkColumn = otherFkColumns[i];
                valueToUpdate[otherFkColumn[Constants.Query.Fields.Other_fk.FK]] = document.get(otherFkColumn[Constants.Query.Fields.Other_fk.PARENT]);
            }
        }
        if (Array.isArray(value)) {
            for (var i = 0; i < value.length; i++) {
                var row = value[i];
                for (var k in valueToUpdate) {
                    row[k] = valueToUpdate[k];
                }
            }
        } else {
            for (var k in valueToUpdate) {
                value[k] = valueToUpdate[k];
            }
        }
    }
}

function removeChildRecords(collectionToPut, document, fkColumn, db, options) {
    var filter = {};
    filter[fkColumn] = document.get("_id");
    var queryToRemoveData = {};
    queryToRemoveData[Constants.Update.COLLECTION] = collectionToPut;
    queryToRemoveData[Constants.Update.DELETE] = {$query:filter};
    if (options[Constants.Query.EVENTS] === false) {
        queryToRemoveData[Constants.Query.EVENTS] = false;
    }
    if (options[Constants.Query.MODULES] !== undefined) {
        queryToRemoveData[Constants.Query.MODULES] = options[Constants.Query.MODULES];
    }
    return db.update(queryToRemoveData);
}

function resolveOverrideChilds(aliasValue, document, collectionToPut, fkColumn, otherFkColumn, db, options) {
    return removeChildRecords(collectionToPut, document, fkColumn, db, options).then(
        function () {
            var childUpdateQuery = {$insert:aliasValue};
            return resolveChilds(childUpdateQuery, aliasValue, document, collectionToPut, fkColumn, otherFkColumn, db, options);
        })
}

function resolveChilds(childUpdateQuery, aliasValue, document, collectionToPut, fkColumn, otherFkColumn, db, options) {
    addParentColumnId(document, aliasValue, fkColumn, otherFkColumn);
    childUpdateQuery[Constants.Update.COLLECTION] = collectionToPut;
    if (options[Constants.Query.EVENTS] === false) {
        childUpdateQuery[Constants.Query.EVENTS] = false;
    }
    if (options[Constants.Query.MODULES] !== undefined) {
        childUpdateQuery[Constants.Query.MODULES] = options[Constants.Query.MODULES];
    }
    return db.update(childUpdateQuery);
}

function populateChildFields(collectionFieldExp, fieldQuery, queryFields, newQueryFields, firstValue) {
    var childQuery = fieldQuery[Constants.Query.Fields.QUERY];
    var fkColumn = fieldQuery[Constants.Query.Fields.FK];
    if (!queryFields || Object.keys(queryFields).length == 0) {
        addSubQuery(newQueryFields, collectionFieldExp, childQuery, fkColumn);
    } else {
        if (queryFields[collectionFieldExp] !== undefined) {
            var fieldValue = queryFields[collectionFieldExp];
            if (fieldValue == 1) {
                addSubQuery(newQueryFields, collectionFieldExp, childQuery, fkColumn);
//            } else if (fieldValue == 0) {
//                delete queryFields[collectionFieldExp];
            }
        } else {
            var aliases = [];
            for (var exp in queryFields) {
                var value = queryFields[exp];
                if (typeof value == "string" && value.indexOf("$") == 0 && collectionFieldExp === value.substring(1)) {
                    aliases.push(exp);
                }
            }
            if (aliases.length > 0) {
                for (var i = 0; i < aliases.length; i++) {
                    addSubQuery(newQueryFields, aliases[i], childQuery, fkColumn);

                }
            } else if (firstValue === 0) {
                addSubQuery(newQueryFields, collectionFieldExp, childQuery, fkColumn);
            }
        }
    }
}

function addSubQuery(newQueryFields, alias, innerQuery, fk) {
    /**
     * It will add subquery in fields and also need to create fields if no field is defined.
     */
    var subQuery = {};
    subQuery[Constants.Query.Fields.TYPE] = "n-rows";
    subQuery[Constants.Query.Fields.QUERY] = innerQuery;
    subQuery[Constants.Query.Fields.FK] = fk
    subQuery[Constants.Query.Fields.PARENT] = "_id";
    newQueryFields[alias] = subQuery;
}

