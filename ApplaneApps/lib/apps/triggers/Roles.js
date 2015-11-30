/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 1/7/14
 * Time: 8:27 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("ApplaneDB/lib/Constants.js");
var Utility = require("./Utility.js");
var Utils = require("ApplaneCore/apputil/util.js");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError.js");

exports.onQuery = function (query, db, options) {
    //add role fields in query to get data merging as per role field.
    var queryFields = query.$fields;
    if (queryFields && Object.keys(queryFields).length > 0) {
        var fieldValue = queryFields[Object.keys(queryFields)[0]];
        if (fieldValue === 0) {
            delete queryFields.role;
            delete queryFields.id;
        } else {
            queryFields.role = 1;
            queryFields.id = 1;
        }
    }
}

exports.onResult = function (query, result, db, options) {
    return Utility.onMergeResult(query, result, options, db);
}

function validateCollectionInPrivilege(privileges, roleName) {
    if (privileges) {
        var privilegeCollections = {};
        for (var i = 0; i < privileges.length; i++) {
            var privilege = privileges[i];
            var collection = privilege.collection;
            if (privilegeCollections[collection]) {
                throw new BusinessLogicError("Duplicate collection [" + collection + "] is not allowed in role [" + roleName + "]");
            } else {
                privilegeCollections[collection] = 1;
            }
        }
    }
}

exports.onPostSave = function (document, db, options) {
    validateCollectionInPrivilege(document.get("privileges"), document.get("role"));
    return db.invokeFunction("Porting.removeUserCache", [
        {db: db.db.databaseName}
    ]).then(function () {
        if (document.type === "update") {
            return Utility.updateAppLock(document.getOld("role"), "pl.roles", db, options);
        }
    })

}

exports.onPreSave = function (document, db, options) {
    if (document.type === "delete") {
        throw new BusinessLogicError("Delete is not allowed in roles");
    }
    var role = document.get("role");
    if (!role) {
        throw new BusinessLogicError("Please provide value of mandatory parameters [role]");
    }
    if (document.type !== "delete" && !document.get("id")) {
        document.set("id", role);
    }
    var newRole = document.get("newRole");
    if (newRole) {
        var parentRoleId = document.get("parentroleid");
        if (!parentRoleId) {
            throw new BusinessLogicError("Please provide value of mandatory parameters [Parent Role] if newRole is true.");
        }
    }
    return Utility.validateData(document, "pl.roles", "role", db).then(
        function () {
            Utility.insertDefaultData(document, db);
            return validatePrivilege(document, db);
        }).then(
        function () {
            var updatedFields = document.getUpdatedFields() || [];
            if (updatedFields && updatedFields.indexOf("parentroleid") !== -1) {
                var parentRoleId = document.get("parentroleid");
                if (parentRoleId) {
                    //merge applicationid and group of parent role to current role.
                    return getParentRoleInfo(parentRoleId, db).then(function (parentRoleInfo) {
                        if (parentRoleInfo && parentRoleInfo.applicationid) {
                            document.set("applicationid", parentRoleInfo.applicationid);
                        } else {
                            document.set("applicationid");
                            document.unset("applicationid", "");
                        }
                        if (parentRoleInfo && parentRoleInfo.group) {
                            document.set("group", parentRoleInfo.group);
                        } else {
                            document.set("group");
                            document.unset("group", "");
                        }
                    })
                }
            }
        }).then(function () {
            if (document.type === "update") {
                return Utility.updateLocalData(document.get("_id"), document.getOld("role"), db, "pl.roles", options);
            }
        })
}

function getParentRoleInfo(parentRoleId, db) {
    if (parentRoleId) {
        return db.query({$collection: "pl.roles", $filter: {_id: parentRoleId._id}, $fields: {applicationid: 1, group: 1}}).then(function (result) {
            return  result.result[0];
        });
    } else {
        var d = require("q").defer();
        d.resolve();
        return d.promise;
    }
}

function validatePrivilege(document, db) {
    var updatedFields = document.getUpdatedFields() || [];
    if (document.type !== "insert" && updatedFields.indexOf("id") !== -1) {
        throw new BusinessLogicError("Update is not allowed in [ id ]")
    }
    var roleName = document.get("role");
    if (updatedFields.indexOf("privileges") !== -1) {
        var privileges = document.getDocuments("privileges") || [];
        var privilegeCollections = {};
        return Utils.iterateArrayWithoutPromise(privileges, function (index, privilegeDoc) {
            if (privilegeDoc.type === "delete" || privilegeDoc.type === "nochange") {
                return;
            }
            var privilegeType = privilegeDoc.get("type");
            var isSystem = privilegeDoc.get("__system__");
            // always unset system value from document.System is not used in saving.
            if (isSystem) {
                privilegeDoc.set("__system__");
                privilegeDoc.unset("__system__", "");
            }
            if (privilegeDoc.get("showResultInJSON")) {
                privilegeDoc.set("showResultInJSON");
                privilegeDoc.unset("showResultInJSON", "");
            }
            //for privilegeType,check updated in fields,user can change only in type and privilegeid.
            // if not system and change in field other than type/privelegeid then throw err,if change in type/privilegeid then update their privileges.Type is not updated.
            // if update is other field then whole privilege will be updated again all times also privilegeid in fk Infos is also updated each time when change in privilege.
            // fields other than type/privilegeid when system if defined for privilege type changed for fields/menus/qviews.
            if (privilegeType === "Privilege") {
                var privilegeId = privilegeDoc.get("privilegeid");
                if (!privilegeId) {
                    throw new BusinessLogicError("Please provide value of mandatory parameters [privilegeid] for type Privilege");
                }
                var privilegeUpdatedFields = privilegeDoc.getUpdatedFields();
                var newPrivilegeUpdatedFields = [];
                if (privilegeUpdatedFields) {
                    for (var i = 0; i < privilegeUpdatedFields.length; i++) {
                        var privilegeUpdatedField = privilegeUpdatedFields[i];
                        if (privilegeUpdatedField === "_id" || privilegeUpdatedField === "type" || privilegeUpdatedField === "privilegeid" || privilegeUpdatedField === "__system__" || privilegeUpdatedField === "showResultInJSON") {
                            continue;
                        } else {
                            newPrivilegeUpdatedFields.push(privilegeUpdatedField);
                        }
                    }
                }
                if (!isSystem && newPrivilegeUpdatedFields.length > 0) {
                    throw new BusinessLogicError("Privileges can not be updated with fields " + JSON.stringify(newPrivilegeUpdatedFields) + " if privilegeid [" + privilegeId.id + "] is defined.");
                } else {
                    // for case if update in privilegeid or system field
                    return db.query({$collection: "pl.rolePrivileges", $filter: {_id: privilegeId._id}}).then(function (result) {
                        var rolePrivilege = result.result[0];
                        if (rolePrivilege) {
                            for (var k in rolePrivilege) {
                                if (k !== "_id" && k !== "type") {
                                    privilegeDoc.set(k, rolePrivilege[k]);
                                }
                            }
                        }
                    })
                }
            } else {
                return require("./Roles.js").populatePrivilegeStr(privilegeDoc, roleName, privilegeDoc.get("collection"), db);
            }
        })
    }
}

exports.populatePrivilegeStr = function (doc, id, collection, db) {
    if (doc.type === "delete") {
        return;
    }
    if (doc.get("showResultInJSON")) {
        doc.set("showResultInJSON");
        doc.unset("showResultInJSON", "");
    }
    var resource = populateResource(doc);
    doc.set("resource", JSON.stringify(resource));
    var views = populateViews(doc);
    if (views) {
        views = JSON.stringify(views);
        doc.set("views", views);
    } else {
        doc.unset("views", "");
    }
    return populateActions(doc, db).then(function (actions) {
        if (actions && actions.length > 0) {
            actions = JSON.stringify(actions);
            doc.set("actions", actions);
        } else {
            throw new BusinessLogicError("Operation Infos is mandatory in [" + id + "] for collection [" + collection + "]");
        }
    })
}

function populateViews(document) {
    var views = undefined;
    var viewsAvailability = document.get("viewsAvailability");
    if (viewsAvailability) {
        var viewInfos = document.getDocuments("viewInfos");
        views = {};
        if (viewInfos && viewInfos.length > 0) {
            var viewValue = populateAvailabilityInfo(viewsAvailability);
            for (var i = 0; i < viewInfos.length; i++) {
                var viewDoc = viewInfos[i];
                if (viewDoc.type === "delete") {
                    continue;
                }
                var view = viewDoc.get("view");
                views[view] = viewValue;
            }
        }
    }
    return views;
}

function populateResource(document) {
    var type = document.get("type");
    var resource = {};
    if (type === "Default") {
        document.set("collection", "");
    }
    var collection = document.get("collection");
    if (collection === undefined) {
        throw new BusinessLogicError("Please provide value of mandatory parameters [collection] in privileges [" + JSON.stringify(document) + "]");
    }
    resource.collection = collection;
    if (type === "Regex") {
        document.set("regex", true);
    }

    var fields = populateFields(document);
    if (fields) {
        resource.fields = fields;
    }
    var actions = populateResourceActions(document);
    if (actions) {
        resource.actions = actions;
    }
    var filter = populateFilter(document);
    if (filter) {
        resource.filter = filter;
    }
    return resource;
}

function getOperationInfosMap(document) {
    var operationInfoMap = undefined;
    var operationInfos = document.getDocuments("operationInfos");
    if (operationInfos && operationInfos.length > 0) {
        for (var i = 0; i < operationInfos.length; i++) {
            var operationDoc = operationInfos[i];
            var operationType = operationDoc.get("type");
            if (operationDoc.type === "delete") {
                continue;
            }
            var operationSeq = operationDoc.get("sequence");
            operationInfoMap = operationInfoMap || {};
            operationInfoMap[operationType] = operationInfoMap[operationType] || [];
            operationInfoMap[operationType].push({document: operationDoc, sequence: operationSeq});
        }
    }
    return operationInfoMap;
}

function populateActions(document, db) {
    var actions = [];
    var operationInfoMap = getOperationInfosMap(document);
    var operationTypes = operationInfoMap ? Object.keys(operationInfoMap) : undefined;
    return Utils.iterateArrayWithPromise(operationTypes,
        function (index, operationType) {
            var operationDocValues = operationInfoMap[operationType];
            Utils.sort(operationDocValues, "asc", "sequence");
            if (operationType === "fk") {
                var innerDoc = operationDocValues[0].document;
                return getFkInfos(innerDoc, db).then(function (fkInfos) {
                    if (fkInfos) {
                        var actionObj = {};
                        actionObj[operationType] = fkInfos;
                        actions.push(actionObj);
                    }
                })
            } else {
                var action = undefined;
                if (operationDocValues.length === 1) {
                    action = {};
                    var innerDoc = operationDocValues[0].document;
                    getAction(innerDoc, action, operationType);
                } else {
                    action = [];
                    for (var i = 0; i < operationDocValues.length; i++) {
                        var operationDoc = operationDocValues[i].document;
                        var innerAction = {};
                        getAction(operationDoc, innerAction, operationType);
                        if (Object.keys(innerAction).length === 0) {
                            throw new BusinessLogicError("Please define field/filter availability if defined multiple operations of same type [" + operationType + "]");
                        }
                        action.push(innerAction);
                    }
                }
                if (Utils.isJSONObject(action) && Object.keys(action).length === 0) {
                    actions.push(operationType);
                } else {
                    var actionObj = {};
                    actionObj[operationType] = action;
                    actions.push(actionObj);
                }
            }
        }).then(function () {
            return actions;
        })
}

function getFkInfos(document, db) {
    var fkInfos = document.getDocuments("fkInfos");
    var fkInfosObj = {};
    return Utils.iterateArrayWithPromise(fkInfos,
        function (index, fkInfo) {
            var privilegeId = fkInfo.get("privilegeid");
            var field = fkInfo.get("field");
            if (privilegeId) {
                return db.query({$collection: "pl.rolePrivileges", $filter: {_id: privilegeId._id}, $fields: {id: 1, type: 1, privilegeid: 1, collection: 1, regex: 1, filterName: 1, resource: 1, actions: 1, views: 1}}).then(function (result) {
                    var privilege = result.result[0];
                    if (privilege) {
                        privilege[Constants.Admin.Roles.Privileges.RESOURCE] = JSON.parse(privilege[Constants.Admin.Roles.Privileges.RESOURCE]);
                        if (privilege[Constants.Admin.Roles.Privileges.ACTIONS]) {
                            privilege[Constants.Admin.Roles.Privileges.ACTIONS] = JSON.parse(privilege[Constants.Admin.Roles.Privileges.ACTIONS]);
                        }
                        if (privilege[Constants.Admin.Roles.Privileges.VIEWS] && typeof privilege[Constants.Admin.Roles.Privileges.VIEWS] === "string") {
                            privilege[Constants.Admin.Roles.Privileges.VIEWS] = JSON.parse(privilege[Constants.Admin.Roles.Privileges.VIEWS]);
                        }
                        fkInfosObj[field] = privilege;
                    }
                })
            }
        }).then(function () {
            if (Object.keys(fkInfosObj).length > 0) {
                return {fkFields: fkInfosObj};
            }
        })
}


function getAction(document, action, actionType) {
    var fields = populateFields(document);
    if (fields) {
        action.fields = fields;
    }
    var filter = populateFilter(document);
    if (filter) {
        action.filter = filter;
    }
    if (actionType === "find" && document.get("primaryFields")) {
        action.primaryFields = 1;
    }

}

function populateFilter(document) {
    var filter = undefined;
    var filterUI = document.get("filterUI");
    if (filterUI) {
        filter = {};
        if (filterUI === "json") {
            var filterJSON = document.get("filterJSON");
            if (filterJSON) {
                filter = JSON.parse(filterJSON);
            }
        } else if (filterUI === "grid") {
            var filterInfos = document.getDocuments("filterInfos");
            if (filterInfos && filterInfos.length > 0) {
                for (var i = 0; i < filterInfos.length; i++) {
                    var filterDoc = filterInfos[i];
                    if (filterDoc.type === "delete") {
                        continue;
                    }
                    var logicalOperator = filterDoc.get("logicalOperator");
                    if (logicalOperator && (logicalOperator === "AND" || logicalOperator === "OR")) {
                        var innerFilter = {};
                        getFilter(filterDoc, innerFilter);
                        if (logicalOperator === "AND") {
                            filter.$and = filter.$and || [];
                            filter.$and.push(innerFilter);
                        } else if (logicalOperator === "OR") {
                            filter.$or = filter.$or || [];
                            filter.$or.push(innerFilter);
                        }
                    } else {
                        getFilter(filterDoc, filter);
                    }
                }
            }
        }
    }

    return filter;
}

function getFilter(document, filter) {
    var field = document.get("field");
    var value = document.get("value");
    var operator = document.get("operator") || (value === "$$UserRoles" ? "$in" : "$eq");
    try {
        value = JSON.parse(value);
    } catch (e) {
    }
    if (operator === "$eq") {
        filter[field] = value;
    } else {
        var filterValue = {};
        filterValue[operator] = value;
        filter[field] = filterValue;
    }

}

function populateResourceActions(document) {
    var actions = undefined;
    var actionsAvailability = document.get("actionsAvailability");
    if (actionsAvailability) {
        var actionInfos = document.getDocuments("actionInfos");
        actions = {};
        if (actionInfos && actionInfos.length > 0) {
            var actionValue = populateAvailabilityInfo(actionsAvailability);
            for (var i = 0; i < actionInfos.length; i++) {
                var actionDoc = actionInfos[i];
                if (actionDoc.type === "delete") {
                    continue;
                }
                var action = actionDoc.get("action");
                var filterJSON = actionDoc.get("filterJSON");
                if (filterJSON) {
                    actions[action] = JSON.parse(filterJSON);
                } else {
                    actions[action] = actionValue;
                }
            }
        }
    }
    return actions;
}

function populateFields(document) {
    var fields = undefined;
    var fieldsAvailability = document.get("fieldsAvailability");
    if (fieldsAvailability) {
        var fieldInfos = document.getDocuments("fieldInfos");
        fields = {};
        if (fieldInfos && fieldInfos.length > 0) {
            var fieldValue = populateAvailabilityInfo(fieldsAvailability);
            for (var i = 0; i < fieldInfos.length; i++) {
                var fieldDoc = fieldInfos[i];
                if (fieldDoc.type === "delete") {
                    continue;
                }
                var field = fieldDoc.get("field");
                fields[field] = fieldValue;
            }
        }
    }
    return fields;
}

function populateAvailabilityInfo(availability) {
    return availability === "Include" ? 1 : 0;
}





