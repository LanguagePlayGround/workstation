/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 18/6/14
 */

/*Update Rule
 insert will be exactly same as update.
 filter in resource will be used for for find action.User need to define filter in json in insert/update/delete
 In Update,
 filter :{cost:{$lt:500}}
 So user can update only record whose amount is less than 500.Means user can change value fron 200 to 600.And after that update is not allowed in that record.But we do not restricted that user to change value 600 which is gt 500.

 1. if update is not defined in action, then do not update any thing
 2. actions  :["update"] -> can update anything
 2. actions  :["insert","update"], filter:{name:"rohit"} --> User can insert any record or update any record
 3. actions  :[{insert:{filter:{name:"rohit"}}},{update:{filter:{name:"rohit"}}}] --> only rohit can update/insert everything, other person can not update anything
 4. actions :[{update:{ fields:{name:1} } }]  -->  update is allowed by every one but only in field "name"
 5. actions :[{update:{ fields:{name:0} } }]  -->  update is allowed by everyone in every fields except "name"
 6. actions :[{update:{ fields:{isApproved:1},filter:{"employeeid.direct_reporting_to.user_id":"$$CurrentUser"} } }]  -->  update is allowed by only Team lead and can change only team isApproved field.
 7. actions :[{update:[{ fields:{username:0,password:0,emailid:0,roles:0,admin:0}},{fields:{password:1,roles:1,admin:1,emailid:1},filter:{_id:"$$CurrentuserAdmin"}}]}] -->> Username can not be updated by everyone and other fields like emailid,roles,admin,password can be changed by only Current User Admin.Other fields cabn change everyone
 8. actions :[{update:[{ fields:{username:0,password:0,emailid:0,roles:0,admin:0},filter:{_id:"$$CurrentUser"} },{fields:{password:1,roles:1,admin:1,emailid:1},filter:{_id:"$$CurrentuserAdmin"}}]}] -->> Only Current user can change their information excluding emailid,password etc.Current User Admin can change only password,admin,emailid,roles.No other person can not change any data
 9. actions: [{find:{fields:{name:0}}}] , resource:{collection:"xxx"} -->> can see all data with data other than name field
 10 actions: [{find:{fields:{name:0}}}] , resource:{collection:"attendance",filter:{"employeeid.userid":"$$CurrentUser"}}-->> can see all data with data other than name field,Filter will not be used here.it is mandatory to define filter in fields if something is defined in json in find.
 11 actions: [{find:{fields:{name:0},filter:{"employeeid.userid":"$$CurrentUser"}}}] , resource:{collection:"attendance",filter:{"employeeid.userid":"$$CurrentUser"}}-->> can see only current data and name fields data not shown.
 12 actions: ["find"],resource:{collection:"employees","fields:{name:1},$filter:{"employeeid.userid":"$$CurrentUser"}}  -->> can see only current user data with field name only
 13 actions: [{"find":{filter:{"employeeid.userid":"$$CurrentUser"}}}] resource:{collection:"employees","fields:{name:1}} ->> can view all data of current user ,fields will not used as it is not defined in find as filter is defined.
 14 actions: ["remove"],resource:{collection:"employees","filter":{userid:"$$CurrentUser"}} -->> can remove only current user data.Resource filter will be used
 15 actions: [{"remove":{filter:{}}}],resource:{collection:"employees","filter":{userid:"$$CurrentUser"}} -->> can remove all data.
 16 actions: [{"remove":{filter:{name:"Sachin"}}}],resource:{collection:"employees","filter":{userid:"$$CurrentUser"}} -->> can remove data where name:"Sachin"

 */

var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("../Constants.js");
var Q = require("q");
var Function = require("./Function.js");
var SELF = require("./Role.js");

exports.doQuery = function (query, collection, db) {
    var roleToQuery = SELF.getRoleToResolve(query[Constants.Query.PARAMETERS], db);
    var collectionName = (typeof query.$collection === "string") ? query.$collection : query.$collection.collection;
    var queryContext = getQueryContext(query, db);
    var collectionPrivilege = SELF.getPrivilege(db.userRoles, collectionName, roleToQuery, queryContext);
    if (!collectionPrivilege) {
        return;
    }
    return resolveQueryByRoles(query, collectionPrivilege, collection);
}

function getQueryContext(query, db) {
    if (db.getContext() && db.getContext().__role__) {
        return query[Constants.Query.CONTEXT];
    }
}

exports.getRoleToResolve = function (parameters, db) {
    var roleToResolve = undefined;
    var context = db.getContext();
    if (context && context.__role__) {
        roleToResolve = context.__role__;
    } else if (parameters && Utils.isJSONObject(parameters) && parameters[Constants.Query.Parameters.ROLE]) {
        roleToResolve = parameters[Constants.Query.Parameters.ROLE];
    }
    return roleToResolve;
}

function resolveQueryByRoles(query, collectionPrivilege, collection) {
    var findAction = getActionInfo(collectionPrivilege.actions, Constants.Admin.Roles.Privileges.Actions.FIND);
    if (findAction === undefined) {
        query.$data = [];
        return;
    }
    var resource = collectionPrivilege.resource;
    var findFilter = undefined;
    var findFields = undefined;
    if (findAction && Object.keys(findAction).length > 0) {
        findFilter = findAction.filter;
        if (findAction[Constants.Admin.Roles.Privileges.Actions.Find.PRIMARY_FIELDS]) {
            var primaryFields = {_id:1};
            populatePrimaryFields(collection.getValue("fields"), primaryFields);
            findFields = primaryFields;
        } else {
            findFields = findAction.fields;
        }
    } else {
        findFilter = resource.filter;
        findFields = resource.fields;
    }
    populateQueryFilter(query, findFilter);
    populateQueryFields(query, findFields);
}

function populateQueryFilter(query, findFilter) {
    if (findFilter && Object.keys(findFilter).length > 0) {
        findFilter = Utils.deepClone(findFilter);
        var queryFilter = query.$filter;
        if (!queryFilter || Object.keys(queryFilter).length == 0) {
            query.$filter = findFilter;
        } else {
            query.$filter.$and = query.$filter.$and || [];
            query.$filter.$and.push(findFilter);
        }
    }
}

function populateQueryFields(query, findFields) {
    if (findFields && Object.keys(findFields).length > 0) {
        findFields = Utils.deepClone(findFields);
        if (query.$group) {
            manageGroupQueryInRole(query, findFields);
        } else {
            query.$fields = mergeFields(query.$fields, findFields);
        }
        if (query[Constants.Query.GROUP] || query[Constants.Query.UNWIND]) {
            //fields must be in form of inclusion in case of unwind/group if excluded fields are defined due to role.
            var queryFields = query.$fields;
            if (queryFields && Object.keys(queryFields).length > 0 && !(Utils.isInclude(queryFields))) {
                throw new Error("Fields can not be excluded in group or unwind in Role.");
            }
        }
    }
}

function manageGroupQueryInRole(query, roleFields) {
    var queryGroup = query.$group;
    var collectionName = query.$collection;
    var include = Utils.isInclude(roleFields);
    validate_IdInGroup(collectionName, queryGroup._id, roleFields, include);
    manageOtherPropertiesInGroup(queryGroup, roleFields, include);
    var queryFields = query.$fields;
    if (queryFields && Object.keys(queryFields).length > 0) {
        if (Utils.isInclude(queryFields)) {
            if (include) {
                for (var k in queryFields) {
                    if (roleFields[k] === undefined) {
                        delete queryFields[k];
                    }
                }
            } else {
                for (var k in roleFields) {
                    delete queryFields[k];
                }
            }
        } else {
            //TODO work pending for exclude fields in query while group is defined.
        }
    }
}

function manageOtherPropertiesInGroup(queryGroup, roleFields, include) {
    if (Utils.isJSONObject(queryGroup)) {
        for (var key in queryGroup) {
            if (key !== "_id") {
                var remove = manageOtherPropertiesInGroup(queryGroup[key], roleFields, include);
                if (remove) {
                    delete queryGroup[key];
                }
            }
        }
        if (Object.keys(queryGroup).length === 0) {
            return true;
        }
    } else if (queryGroup && typeof queryGroup === "string") {
        for (var fieldKey in roleFields) {
            if ((include && queryGroup !== ("$" + fieldKey) && queryGroup.indexOf("$" + fieldKey + ".") !== 0) || (!include && (queryGroup === ("$" + fieldKey) || queryGroup.indexOf("$" + fieldKey + ".") === 0))) {
                return true;
            }
        }
    }
}

function validate_IdInGroup(collectionName, groupId, roleFields, include) {
    if (Array.isArray(groupId)) {
        for (var i = 0; i < groupId.length; i++) {
            validate_IdInGroup(collectionName, groupId[i], roleFields, include);
        }
    } else if (Utils.isJSONObject(groupId)) {
        for (var k in groupId) {
            validate_IdInGroup(collectionName, groupId[k], roleFields, include);
        }
    } else if (groupId && typeof groupId === "string") {
        for (var fieldKey in roleFields) {
            if (fieldKey !== "_id" && (include && groupId !== ("$" + fieldKey) && groupId.indexOf("$" + fieldKey + ".") !== 0) || (!include && (groupId === ("$" + fieldKey) || groupId.indexOf("$" + fieldKey + ".") === 0))) {
                throw new Error("Group by can not be defined on excluded Field [" + groupId + "] in collection [" + collectionName + "]");
            }
        }
    }
}

function mergeFields(queryFields, rolesFields) {
    if (!queryFields || Object.keys(queryFields).length == 0) {
        return rolesFields;
    } else {
        var includeRoleFields = Utils.isInclude(rolesFields);
        var includeQueryFields = Utils.isInclude(queryFields);

        if (includeRoleFields && includeQueryFields) {
            //  FinalFields are those common to Roles & Query.
            for (var queryField in queryFields) {
                if (rolesFields[queryField] === undefined) {
                    delete queryFields[queryField];
                }
            }
        } else if (includeRoleFields && !includeQueryFields) {
            //  FinalFields are Role - Query fields.
            for (var queryField in queryFields) {
                if (rolesFields[queryField] !== undefined) {
                    delete rolesFields[queryField];
                }
            }
            queryFields = rolesFields;
        } else if (!includeRoleFields && includeQueryFields) {
            //  FinalFields are Query - Role fields.
            for (var rolesField in rolesFields) {
                delete queryFields[rolesField];
            }
        } else if (!includeRoleFields && !includeQueryFields) {
            //  FinalFields are Query + Role fields.
            for (var rolesField in rolesFields) {
                queryFields[rolesField] = rolesFields[rolesField];
            }
        }
        if (Object.keys(queryFields).length === 0) {
            queryFields._id = 1;
        }
        return queryFields;
    }
}

exports.onPreSave = function (event, document, collection, db, options) {
    var collectionName = document.collection;
    var parameters = options ? options.$parameters : undefined;
    var roleToUpdate = SELF.getRoleToResolve(parameters, db);
    var collectionPrivilege = SELF.getPrivilege(db.userRoles, collectionName, roleToUpdate);
    if (!collectionPrivilege) {
        return;
    }
    var userResource = collectionPrivilege.resource;
    var userActions = collectionPrivilege.actions;
    if (!userActions) {
        var error = new Error("Does not have sufficient privileges to " + document.type + " record in collection [" + collectionName + "]");
        error.detailMessage = "With Document...." + JSON.stringify(document);
        throw error;
    }
    if (document.type === "insert" || document.type === "update") {
        return handleUpdateInUpdates(document, userActions, db, options);
    } else if (document.type === "delete") {
        return handleDeleteInUpdates(document, userActions, db, options);
    }
};

function addWarnings(document, restrictedFields, db) {
    var message = "Does not have sufficient privileges to " + document.type + " record in collection [" + document.collection + "]";
    if (restrictedFields) {
        message = message + " with fields " + JSON.stringify(restrictedFields);
    }
    db.addWarnings(message);
    var error = new Error(message);
    error.detailMessage = "With Document...." + JSON.stringify(document);
    throw error;
}

function handleDeleteInUpdates(document, actions, db, options) {
    var deleteAction = getActionInfo(actions, Constants.Admin.Roles.Privileges.Actions.REMOVE);
    if (deleteAction === undefined) {
        return addWarnings(document, undefined, db);
    }
    if (Array.isArray(deleteAction)) {
        throw new Error("Array is not supported in delete action [" + JSON.stringify(deleteAction) + "]");
    }
    if (Object.keys(deleteAction).length > 0 && deleteAction.fields) {
        throw new Error("Fields is not supported in delete action [" + JSON.stringify(deleteAction) + "]");
    }

    var deleteFilter = deleteAction.filter;
    if (!deleteFilter || Object.keys(deleteFilter).length === 0) {
        return;
    }
    return updateRecordAllowed(document, deleteFilter, db, options).then(function (allow) {
        if (!allow) {
            return addWarnings(document, undefined, db);
        }
    })
}

function handleUpdateInUpdates(document, actions, db, options) {
    var updateType = document.type === "insert" ? Constants.Admin.Roles.Privileges.Actions.INSERT : Constants.Admin.Roles.Privileges.Actions.UPDATE;
    var action = getActionInfo(actions, updateType);
    if (action === undefined) {
        return addWarnings(document, undefined, db);
    }
    var updatedFields = document.getUpdatedFields() || [];
    if (Array.isArray(action) && action.length > 1) {
        return Utils.iterateArrayWithPromise(action,
            function (index, actionObj) {
                if (updatedFields.length === 0) {
                    return;
                }
                var roleFilter = actionObj.filter;
                var roleFields = actionObj.fields;
                if (!roleFilter && !roleFields) {
                    updatedFields.splice(0, (updatedFields.length));
                }
                return resolveUpdate(document, updatedFields, roleFilter, roleFields, false, db, options);
            }).then(function () {
                if (updatedFields.length > 0) {
                    return addWarnings(document, updatedFields, db);
                }
            })
    } else {
        if (Array.isArray(action)) {
            action = action[0];
        }
        var roleFilter = undefined;
        var roleFields = undefined;
        if (action && Object.keys(action).length > 0) {
            roleFilter = action.filter;
            roleFields = action.fields;
        }
        if (!roleFilter && !roleFields) {
            return;
        }
        return resolveUpdate(document, updatedFields, roleFilter, roleFields, true, db, options).then(function () {
            if (updatedFields.length > 0) {
                return addWarnings(document, updatedFields, db);
            }
        })
    }
}

function resolveUpdate(document, updatedFields, updateFilter, roleFields, warningError, db, options) {
    return updateRecordAllowed(document, updateFilter, db, options).then(function (allow) {
        if (!allow) {
            return warningError ? addWarnings(document, undefined, db) : undefined;
        }
        if (!roleFields || Object.keys(roleFields).length === 0) {
            updatedFields.splice(0, (updatedFields.length));
            return;
        }
        var include = Utils.isInclude(roleFields);
        removeUpdateAllowedFields(document, updatedFields, updatedFields, roleFields, include);
    })

}

function removeUpdateAllowedFields(document, finalUpdatedFields, updatedFields, roleFields, include, pField) {
    var updatedFieldCount = updatedFields ? updatedFields.length : 0;
    if (updatedFieldCount === 0) {
        return;
    }
    for (var i = updatedFieldCount - 1; i >= 0; i--) {
        var updatedField = updatedFields[i];
        var fieldToCheck = pField ? pField + "." + updatedField : updatedField;
        if (updatedField === "_id") {
            spliceIfExist(finalUpdatedFields, fieldToCheck);
            continue;
        }
        if (roleFields[fieldToCheck] !== undefined) {
            if (include) {
                spliceIfExist(finalUpdatedFields, fieldToCheck);
            }
            continue;
        } else {
            if (!include) {
                spliceIfExist(finalUpdatedFields, fieldToCheck);
            }
        }
        var nestedDocs = document.getDocuments(updatedField, ["insert", "update", "delete"]);
        if (nestedDocs) {
            var nestedCheck = include ? false : true;
            if (include) {
                for (var key in roleFields) {
                    if (key.indexOf(fieldToCheck + ".") === 0) {
                        nestedCheck = true;
                        spliceIfExist(finalUpdatedFields, fieldToCheck);
                        break;
                    }
                }
            }
            if (!nestedCheck) {
                continue;
            }
            if (!Array.isArray(nestedDocs)) {
                nestedDocs = [nestedDocs];
            }
            for (var j = 0; j < nestedDocs.length; j++) {
                var nestedDoc = nestedDocs[j];
                var nestedUpdatedFields = nestedDoc.getUpdatedFields();
                if (nestedUpdatedFields) {
                    for (var k = 0; k < nestedUpdatedFields.length; k++) {
                        finalUpdatedFields.push(fieldToCheck + "." + nestedUpdatedFields[k]);
                    }
                }
                removeUpdateAllowedFields(nestedDoc, finalUpdatedFields, nestedUpdatedFields, roleFields, include, fieldToCheck);
            }
        }
    }
}

function spliceIfExist(values, valueToCheck) {
    var indexOf = values.indexOf(valueToCheck);
    if (indexOf !== undefined) {
        values.splice(indexOf, 1);
    }
}

function updateRecordAllowed(document, filter, db, options) {
    if (!filter || Object.keys(filter).length === 0) {
        var d = Q.defer();
        d.resolve(true);
        return d.promise;
    }
    var newFilter = {};
    if (document.type !== "insert") {
        newFilter._id = document.get("_id");
    }
    for (var k in filter) {
        newFilter[k] = filter[k];
    }
    var query = {$collection:document.collection, $filter:newFilter, $modules:{Role:0}};
    if (document.type === "insert") {
        query.$requireResolveFilter = true;
        query.$data = [document.convertToJSON()];
    }
    if (options.$parameters) {
        query.$parameters = options.$parameters;
    }
    return db.query(query).then(function (result) {
        if (document.type === "insert") {
            var data = result.result[0];
            var resolvedFilter = result.resolvedFilter;
            if (!resolvedFilter || (Object.keys(resolvedFilter).length === 0) || Utils.evaluateFilter(resolvedFilter, data)) {
                return true;
            } else {
                return false;
            }
        } else {
            return result.result.length === 0 ? false : true;
        }
    })
}

function getFkPrivilege(referredCollectionPrivilege, context) {
    var referredField = context.referredField;
    if (!referredCollectionPrivilege || !referredField) {
        return;
    }
    var actions = referredCollectionPrivilege.actions;
    var actionInfo = getActionInfo(actions, "fk");
    if (actionInfo) {
        var fkFields = actionInfo.fkFields;
        if (fkFields && fkFields[referredField]) {
            return fkFields[referredField];
        }
    }
}

exports.getPrivilege = function (roles, collectionName, roleId, context) {
    if (collectionName === undefined || !roles || Object.keys(roles).length === 0) {
        return;
    }
    if (roleId) {
        if (!roles.roles || !roles.roles[roleId]) {
            throw new Error("User does not rights to access from role [" + roleId + "] for collection [" + collectionName + "].User Roles found " + (roles.roles ? JSON.stringify(Object.keys(roles.roles)) : "[]"));
        }
    }
    var privileges = roles.privileges;
    if (privileges) {
        var value = undefined;
        //to check fk role only if role defined to get query.
        if (context && context.referredCollection && roleId) {
            var referredCollection = context.referredCollection;
            value = getPrivilegeValue(privileges[referredCollection], roleId);
            var fkPrivilege = getFkPrivilege(value, context);
            if (fkPrivilege) {
                return fkPrivilege;
            }
        }
        value = getPrivilegeValue(privileges[collectionName], roleId);
        if (value) {
            return value;
        }
        var regexCollections = roles.regexCollections;
        for (var key in regexCollections) {
            if (regexCollections[key].test(collectionName)) {
                value = getPrivilegeValue(privileges[key], roleId);
                if (value) {
                    return value;
                }
            }
        }
        value = getPrivilegeValue(privileges[""], roleId);
        return value;
    }
}

function getPrivilegeValue(privileges, roleId) {
    if (privileges) {
        if (roleId) {
            for (var i = 0; i < privileges.length; i++) {
                if (privileges[i].roleId === roleId) {
                    return privileges[i];
                }
            }
        } else {
            return privileges[0];
        }
    }
}

function resolveAsRole(records, roleInfo, field) {
    if (!records || records.length == 0 || !roleInfo || Object.keys(roleInfo).length == 0 || !field) {
        return;
    }
    var include = Utils.isInclude(roleInfo);
    for (var i = 0; i < records.length; i++) {
        var record = records[i];
        var fieldValue = record[field];
        if ((include && roleInfo[fieldValue] === undefined) || (!include && roleInfo[fieldValue] !== undefined)) {
            records.splice(i, 1);
            i = i - 1;
        }
    }
}

function getActionInfo(actions, actionName) {
    if (actions) {
        for (var i = 0; i < actions.length; i++) {
            var action = actions[i];
            if (typeof action === "string") {
                if (action === actionName) {
                    return {};
                }
            } else if (action[actionName]) {
                return action[actionName];
            }
        }
    }
}

function populateEditInMetadata(collectionPrivilege, viewOptions) {
    var insertAction = getActionInfo(collectionPrivilege.actions, Constants.Admin.Roles.Privileges.Actions.INSERT);
    var updateAction = getActionInfo(collectionPrivilege.actions, Constants.Admin.Roles.Privileges.Actions.UPDATE);
    var findAction = getActionInfo(collectionPrivilege.actions, Constants.Admin.Roles.Privileges.Actions.FIND);
    var resource = collectionPrivilege.resource;
    var resourceFields = resource.fields;
    var insertFields = insertAction && Object.keys(insertAction).length > 0 ? insertAction.fields : resourceFields;
    if (insertFields) {
        editFields(insertFields, "edit", viewOptions);
    }
    var updateFields = resourceFields;
    if (updateAction) {
        if (Utils.isJSONObject(updateAction)) {
            updateFields = updateAction.fields;
        } else if (Array.isArray(updateAction)) {
            updateFields = updateAction[0].fields;
        }
    }
    if (updateFields) {
        editFields(updateFields, "edit", viewOptions);
    }
    var roleQuery = {};
    var findFields = undefined;
    if (findAction && Object.keys(findAction).length > 0) {
        var primaryFields = undefined;
        if (findAction[Constants.Admin.Roles.Privileges.Actions.Find.PRIMARY_FIELDS]) {
            var primaryFields = {_id:1};
            populatePrimaryFields(viewOptions.fields, primaryFields);
            findFields = primaryFields;
        } else {
            findFields = findAction.fields;
        }
    } else {
        findFields = resource.fields;
    }
    populateQueryFields(roleQuery, findFields);
    editFields(roleQuery.$fields, "remove", viewOptions);
}

function populatePrimaryFields(fields, primaryFields, pField) {
    if (fields && fields.length > 0) {
        for (var i = 0; i < fields.length; i++) {
            var fieldInfo = fields[i];
            var field = pField ? pField + "." + fieldInfo.field : fieldInfo.field;
            if (fieldInfo[Constants.Admin.Fields.PRIMARY]) {
                primaryFields[field] = 1;
            } else if (fieldInfo.fields) {
                populatePrimaryFields(fieldInfo.fields, primaryFields, field);
            }
        }
    }
}

function editFields(fields, property, viewOptions) {
    if (fields && Object.keys(fields).length > 0) {
        var include = Utils.isInclude(fields);
        handlePropertiesInFields(fields, include, viewOptions.fields, property);
    }
}

function handlePropertiesInFields(actionFields, include, viewFields, property, pField) {
    if (!viewFields || viewFields.length === 0) {
        return;
    }
    for (var i = 0; i < viewFields.length; i++) {
        var viewFieldInfo = viewFields[i];
        var viewField = pField ? pField + "." + viewFieldInfo.field : viewFieldInfo.field;
        if ((include && actionFields[viewField] === undefined) || (!include && actionFields[viewField] !== undefined)) {
            if (property === "edit") {
                if (viewFieldInfo.type !== "object") {
                    viewFieldInfo.editableWhen = "false";
                }
            } else if (property === "remove") {
                viewFields.splice(i, 1);
                i = i - 1;
            }
            if (viewFieldInfo.fields) {
                handlePropertiesInFields(actionFields, include, viewFieldInfo.fields, property, viewField);
            }
        }
    }
}

function validateFromRole(value, roleId) {
    var roles = value.roles;
    if (!roleId || !roles || roles.length === 0) {
        return true;
    }
    for (var j = 0; j < roles.length; j++) {
        if (roles[j].role && roles[j].role.id === roleId) {
            return true;
        }
    }
}

function resolveActionsInMetadata(collectionPrivilege, roleId, viewOptions, viewParameters, db) {
    var viewActions = viewOptions.actions;
    if (viewActions && viewActions.length > 0) {
        for (var i = 0; i < viewActions.length; i++) {
            var viewAction = viewActions[i];
            viewAction.id = viewAction.id || viewAction.label;
            var valid = validateFromRole(viewAction, roleId);
            if (!valid) {
                viewActions.splice(i, 1);
                i = i - 1;
            }
        }
        var resourcePrivilege = collectionPrivilege.resource;
        var resourceActions = Utils.deepClone(resourcePrivilege.actions);
        if (!resourceActions || Object.keys(resourceActions).length === 0) {
            return;
        }
        var filterInResourceActions = undefined;
        for (var k in resourceActions) {
            if (Utils.isJSONObject(resourceActions[k])) {
                filterInResourceActions = filterInResourceActions || {};
                filterInResourceActions[k] = resourceActions[k];
                delete resourceActions[k];
            }
        }
        resolveAsRole(viewActions, resourceActions, "id");
        if (!filterInResourceActions) {
            return;
        }
        var keys = Object.keys(filterInResourceActions);
        return Utils.iterateArrayWithPromise(keys,
            function (index, key) {
                var value = filterInResourceActions[key];
                var filter = value.$filter;
                if (filter) {
                    return Function.populateFilter(filter, viewParameters, db, {collection:viewOptions.collection, $parameters:viewParameters}).then(function () {
                        if (Object.keys(filter).length === 0) {
                            var index = Utils.isExists(viewActions, {id:key}, "id");
                            if (index !== undefined) {
                                viewActions.splice(index, 1);
                            }
                        }
                    })
                }
            })
    }
}

function addRoleFieldInFields(collection, roles, viewOptions) {
    var collectionRoles = populateCollectionWiseRole(roles, collection, "view");
    if (collectionRoles && collectionRoles.length > 1) {
        viewOptions.actions = viewOptions.actions || [];
        viewOptions.actions.push({field:"__role__", "type":"filter", filterType:"string", label:"Role", options:collectionRoles, asParameter:true, ui:"autocomplete", visibilityFilter:"Always"});
        viewOptions.reloadViewOnFilterChange = true;
    }
}

function addDefaultRoleOptionsInFields(collectionPrivilege, roles, viewOptions) {
    var fields = viewOptions.fields;
    var roleFields = getRoleFields(collectionPrivilege);
    if (roleFields && roleFields.length > 0) {
        for (var i = 0; i < roleFields.length; i++) {
            var roleFieldName = roleFields[i];
            for (var j = 0; j < fields.length; j++) {
                var field = fields[j];
                if ((roleFieldName === field.field || roleFieldName === field.field + "._id") && field.type === "fk") {
                    var fkCollection = field.collection;
                    var defaultOptions = populateCollectionWiseRole(roles, fkCollection, "field", field.displayField);
                    if (defaultOptions.length > 0) {
                        field.defaultOptions = defaultOptions;
                        field.valueAsObject = true;
//                        field.asParameter = true;
                        viewOptions.reloadViewOnFilterChange = true;
                    }
                    break;
                }
            }
        }
    }
}

function populateCollectionWiseRole(roles, collection, type, displayField) {
    //TODO there may be populate roles for regex or "" collection.
    var collectionRoles = [];
    var collectionPrivileges = roles.privileges ? roles.privileges[collection] : undefined;
    if (collectionPrivileges) {
        for (var i = 0; i < collectionPrivileges.length; i++) {
            var privilege = collectionPrivileges[i];
            if (type === "field") {
                var filterName = privilege.filterName;
                if (filterName) {
                    var roleInfo = {};
                    roleInfo._id = privilege.role_id;
                    roleInfo.__role__ = privilege.roleId;
                    roleInfo.asParameter = true;
                    roleInfo[displayField] = filterName;
                    roleInfo.span = privilege.span;
                    collectionRoles.push(roleInfo);
                }
            } else if (type === "view") {
                var actions = privilege.actions;
                var findAction = getActionInfo(actions, "find");
                if (findAction && !(findAction[Constants.Admin.Roles.Privileges.Actions.Find.PRIMARY_FIELDS])) {
                    collectionRoles.push(privilege.roleId);
                }
            }
        }
    }
    return collectionRoles;
}

function getRoleFields(collectionPrivilege) {
    if (!collectionPrivilege) {
        return;
    }
    var resource = collectionPrivilege.resource;
    var filter = resource.filter;
    if (!filter) {
        return;
    }
    var roleFields = [];
    for (var key in filter) {
        var filterValue = filter[key];
        if (isUserRoleField(filterValue)) {
            roleFields.push(key);
        }
    }
    return roleFields;
}

function isUserRoleField(filterValue) {
    if (Utils.isJSONObject(filterValue) && filterValue.$in) {
        var innerValue = filterValue.$in;
        if (typeof innerValue === "string" && (innerValue === "$$UserRoles" || innerValue === "$$Functions.UserRoles" )) {
            return true;
        } else if (Utils.isJSONObject(innerValue)) {
            if (innerValue.$$UserRoles || innerValue["$$Functions.UserRoles"] || (innerValue.$function && innerValue.$function === "Functions.UserRoles")) {
                return true;
            }
        }
    }
}

exports.resolveApplicationsMenusAsRole = function (applications, userRoles) {
    if (!userRoles || Object.keys(userRoles).length === 0) {
        return;
    }
    for (var i = 0; i < applications.length; i++) {
        var application = applications[i];
        var appRole = application.$context ? application.$context.__role__ : undefined;
        var menus = application.menus;
        resolveMenusAsRole(menus, userRoles, appRole);
    }
}

function resolveMenusAsRole(menus, userRoles, appRole) {
    if (menus && menus.length > 0) {
        for (var i = 0; i < menus.length; i++) {
            var menu = menus[i];
            var collection = menu.collection;
            if (menu.menus && menu.menus.length > 0) {
                resolveMenusAsRole(menu.menus, userRoles, appRole);
            }
            var spliceMenu = false;

            if (appRole && userRoles.menus && userRoles.menus[appRole]) {
                //Required for override menus in new role below applications.
                var appRoleMenus = userRoles.menus[appRole];
                var menusAvailability = appRoleMenus.menusAvailability;
                var isExists = false;
                if (appRoleMenus.menuInfos) {
                    for (var j = 0; j < appRoleMenus.menuInfos.length; j++) {
                        var menuInfo = appRoleMenus.menuInfos[j];
                        if (Utils.deepEqual(menuInfo.menu._id, menu._id)) {
                            isExists = true;
                            break;
                        }
                    }
                }
                if ((menusAvailability === "Exclude" && isExists) || (menusAvailability === "Include" && !isExists)) {
                    spliceMenu = true;
                }
            } else {
                if (collection) {
                    var collectionPrivilege = SELF.getPrivilege(userRoles, collection, appRole);
                    if (collectionPrivilege) {
                        var findAction = getActionInfo(collectionPrivilege[Constants.Admin.Roles.Privileges.ACTIONS], "find");
                        var viewPrivileges = collectionPrivilege[Constants.Admin.Roles.Privileges.VIEWS];
                        if (findAction === undefined || findAction[Constants.Admin.Roles.Privileges.Actions.Find.PRIMARY_FIELDS] || (viewPrivileges && Object.keys(viewPrivileges).length === 0)) {
                            spliceMenu = true;
                        }
                    }
                }
            }
            // for case which do not have collection and also do not have child menus then do not need to show menus
            if (!spliceMenu && !collection && (!menu.menus || menu.menus.length === 0)) {
                spliceMenu = true;
            }
            if (spliceMenu) {
                menus.splice(i, 1);
                i = i - 1;
            }
        }
    }
}

exports.populateQviewsAsRole = function (userRoles, collection, qViews, db) {
    var roleToResolve = SELF.getRoleToResolve(undefined, db);
    var collectionPrivilege = SELF.getPrivilege(userRoles, collection, roleToResolve);
    if (collectionPrivilege && collectionPrivilege.views) {
        var viewsPrivilege = collectionPrivilege.views;
        if (qViews && Object.keys(viewsPrivilege).length === 0) {
            for (var i = 0; i < qViews.length; i++) {
                qViews.splice(i, 1);
                i = i - 1;
            }
        } else {
            resolveAsRole(qViews, viewsPrivilege, "id");
        }
    }
}

exports.manageRoleInMetadata = function (userRoles, viewOptions, viewParameters, db) {
    var collectionName = viewOptions.collection;
    var roleToResolve = SELF.getRoleToResolve(viewParameters, db);
    var collectionPrivilege = SELF.getPrivilege(userRoles, collectionName, roleToResolve);
    var roleId = collectionPrivilege ? collectionPrivilege.roleId : undefined;
    var mainCollectionName = viewOptions.mainCollection;
    var mainCollectionPrivilege = collectionPrivilege;
    if (mainCollectionName && collectionName !== mainCollectionName) {
        var mainCollectionPrivilege = SELF.getPrivilege(userRoles, mainCollectionName, roleToResolve);
    }
    if (mainCollectionPrivilege) {
        populateActionsInMetadata(mainCollectionPrivilege, viewOptions);
    }
    if (collectionPrivilege) {
        populateEditInMetadata(collectionPrivilege, viewOptions);
        // db.getContext() check due to __role__ field not need to be added in newRole
        //Case was in hitkarini for define filter in manage time table row action,__role__ filter is shown due to multiple roles and due to which reloadViewOnFilterChange set in filter and filter can not be applied.
        if ((!db.getContext() || !db.getContext().__role__) && viewOptions.fields && viewOptions.fields.length > 0) {
            addRoleFieldInFields(collectionName, userRoles, viewOptions);
            addDefaultRoleOptionsInFields(collectionPrivilege, userRoles, viewOptions);
        }
        return resolveActionsInMetadata(collectionPrivilege, roleId, viewOptions, viewParameters, db);
    }
}

function populateActionsInMetadata(collectionPrivilege, viewOptions) {
    var insertAction = getActionInfo(collectionPrivilege.actions, Constants.Admin.Roles.Privileges.Actions.INSERT);
    var updateAction = getActionInfo(collectionPrivilege.actions, Constants.Admin.Roles.Privileges.Actions.UPDATE);
    var deleteAction = getActionInfo(collectionPrivilege.actions, Constants.Admin.Roles.Privileges.Actions.REMOVE);
    if (insertAction === undefined) {
        viewOptions.insert = false;
    }
    if (updateAction === undefined) {
        viewOptions.edit = false;
    }
    if (deleteAction === undefined) {
        viewOptions.delete = false;
    }
}

exports.isFullRights = function (roles, collection, roleApplied) {
    var collectionPrivilege = SELF.getPrivilege(roles, collection, roleApplied);
    var fullRights = true;
    if (collectionPrivilege) {
        var resource = collectionPrivilege.resource;
        var findAction = getActionInfo(collectionPrivilege.actions, Constants.Admin.Roles.Privileges.Actions.FIND);
        if ((resource.filter && Object.keys(resource.filter).length > 0) || findAction === undefined || findAction[Constants.Admin.Roles.Privileges.Actions.Find.PRIMARY_FIELDS] || (findAction.filter && Object.keys(findAction.filter).length > 0)) {
            fullRights = false;
        }
    }
    return fullRights;
}

function mergePrivilegesForChildRoles(roles, newRoles, rolesExecuted) {
    for (var i = 0; i < newRoles.length; i++) {
        var newRole = newRoles[i];
        if (rolesExecuted.indexOf(newRole.id) === -1) {
            var innerRoles = newRole.roles;
            delete newRole.roles;
            rolesExecuted.push(newRole.id);
            if (innerRoles && innerRoles.length > 0) {
                for (var j = 0; j < innerRoles.length; j++) {
                    var innerRole = innerRoles[j].role;
                    var existIndex = Utils.isExists(roles, innerRole, "_id");
                    innerRoles[j] = roles[existIndex];
                }
                mergePrivilegesForChildRoles(roles, innerRoles, rolesExecuted);
                for (var j = 0; j < innerRoles.length; j++) {
                    var innerPrivileges = innerRoles[j].privileges;
                    if (innerPrivileges && innerPrivileges.length > 0) {
                        newRole.privileges = newRole.privileges || [];
                        mergePrivileges(newRole.privileges, innerPrivileges);
                    }
                }
            }
        }
    }
}

function mergePrivileges(rolePrivileges, innerRolePrivileges) {
    if (!innerRolePrivileges) {
        return;
    }
    var rolePrivilegesToAdd = [];
    for (var i = 0; i < innerRolePrivileges.length; i++) {
        var innerRolePrivilege = innerRolePrivileges[i];
        if (Utils.isExists(rolePrivileges, innerRolePrivilege, "collection") === undefined) {
            rolePrivilegesToAdd.push(Utils.deepClone(innerRolePrivilege));
        }
    }
    rolePrivileges.push.apply(rolePrivileges, rolePrivilegesToAdd);
}

exports.populateRoleInfosInUser = function (db) {
    var user = db.user;
    if (!user || !user.roles || user.roles.length == 0) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var userRoles = user.roles;
    delete user.roles;
    var roleIds = [];
    for (var i = 0; i < userRoles.length; i++) {
        var role = userRoles[i].role;
        if (role) {
            roleIds.push(role._id);
        }
    }
    var newRoles = [];
    return populateRoleInfos(roleIds, newRoles, db).then(function () {
        Utils.sort(newRoles, "desc", "span");
        mergePrivilegesForChildRoles(newRoles, newRoles, []);
        db.userRoles = repopulateUserRolesAsJSON(newRoles);
    })
}

function resolvePrivileges(rolePrivileges, finalPrivileges) {
    if (!rolePrivileges || rolePrivileges.length == 0) {
        return;
    }
    for (var i = 0; i < rolePrivileges.length; i++) {
        var rolePrivilege = rolePrivileges[i];
        if (Utils.isExists(finalPrivileges, rolePrivilege, "collection") === undefined) {
            rolePrivilege[Constants.Admin.Roles.Privileges.RESOURCE] = JSON.parse(rolePrivilege[Constants.Admin.Roles.Privileges.RESOURCE]);
            if (rolePrivilege[Constants.Admin.Roles.Privileges.ACTIONS]) {
                rolePrivilege[Constants.Admin.Roles.Privileges.ACTIONS] = JSON.parse(rolePrivilege[Constants.Admin.Roles.Privileges.ACTIONS]);
            }
            if (rolePrivilege[Constants.Admin.Roles.Privileges.VIEWS] && typeof rolePrivilege[Constants.Admin.Roles.Privileges.VIEWS] === "string") {
                rolePrivilege[Constants.Admin.Roles.Privileges.VIEWS] = JSON.parse(rolePrivilege[Constants.Admin.Roles.Privileges.VIEWS]);
            }
            finalPrivileges.push(rolePrivilege);
        }
    }
}

function populateRoleInfos(roleIds, newRoles, db) {
    var filter = {};
    filter._id = roleIds.length === 1 ? roleIds[0] : {$in:roleIds};
    var roleQuery = {
        $collection:"pl.roles",
        $fields:{"privileges.operationInfos":0, "privileges.filterInfos":0, "privileges.fieldInfos":0, "privileges.actionInfos":0, "privileges.viewInfos":0},
        $filter:filter
    };
    return db.query(roleQuery).then(function (roleInfos) {
        roleInfos = roleInfos.result;
        if (roleInfos.length === 0) {
            return;
        }
        var innerRolesArray = [];
        return Utils.iterateArrayWithPromise(roleInfos,
            function (index, roleInfosObj) {
                var innerRoles = roleInfosObj.roles;
                if (innerRoles && innerRoles.length > 0) {
                    innerRolesArray.push.apply(innerRolesArray, innerRoles);
                }
                var group = roleInfosObj.group;
                //user child roles for group type role.Group type role self will not be added in roleInfos.
                //add privileges in role only if it does not have childRoles.
                var finalPrivileges = [];
                var childRoles = roleInfosObj.childRoles;
                if (childRoles && childRoles.length > 0) {
                    innerRolesArray.push.apply(innerRolesArray, childRoles);
                } else {
                    resolvePrivileges(roleInfosObj[Constants.Admin.Roles.PRIVILEGES], finalPrivileges);
                    roleInfosObj[Constants.Admin.Roles.PRIVILEGES] = finalPrivileges;
                    newRoles.push(roleInfosObj);
                }
                var parentRoleId = roleInfosObj[Constants.Admin.Roles.PARENT_ROLE_ID];
                if (parentRoleId) {
                    return mergeParentData(parentRoleId._id, finalPrivileges, innerRolesArray, db);
                }
            }).then(function () {
                return populateInnerRoles(newRoles, innerRolesArray, db);
            })
    })
}

function mergeParentData(roleToQuery, finalPrivileges, innerRolesArray, db) {
    return db.query({
        $collection:"pl.roles",
        $fields:{"privileges.operationInfos":0, "privileges.filterInfos":0, "privileges.fieldInfos":0, "privileges.actionInfos":0, "privileges.viewInfos":0},
        $filter:{_id:roleToQuery}
    }).then(function (result) {
            var innerRole = result.result[0];
            var childRoles = innerRole[Constants.Admin.Roles.CHILD_ROLES];
            if (childRoles && childRoles.length > 0) {
                mergeInnerRoles(childRoles, innerRolesArray);
            } else if (finalPrivileges) {
                resolvePrivileges(innerRole[Constants.Admin.Roles.PRIVILEGES], finalPrivileges);
            }
            var parentRoleId = innerRole[Constants.Admin.Roles.PARENT_ROLE_ID];
            if (parentRoleId) {
                return mergeParentData(parentRoleId._id, finalPrivileges, innerRolesArray, db);
            }
        })
}

function mergeInnerRoles(rolesToMerge, rolesInMerge) {
    //Used to merge childroles for group type role and each child role must have appid for merging.without appid role will not be considered.
    if (!rolesToMerge) {
        return;
    }
    for (var i = 0; i < rolesToMerge.length; i++) {
        var roleToMerge = rolesToMerge[i];
        var appId = roleToMerge.appid;
        if (appId && Utils.isExists(rolesInMerge, roleToMerge, "appid") === undefined) {
            rolesInMerge.push(roleToMerge);
        }
    }
}

function populateInnerRoles(newRoles, innerRolesArray, db) {
    var innerRoleIds = [];
    for (var j = 0; j < innerRolesArray.length; j++) {
        var innerRole = innerRolesArray[j].role;
        if (innerRole && Utils.isExists(newRoles, innerRole, "_id") === undefined && Utils.isExists(innerRoleIds, innerRole._id) === undefined) {
            innerRoleIds.push(innerRole._id);
        }
    }
    if (innerRoleIds.length > 0) {
        return populateRoleInfos(innerRoleIds, newRoles, db);
    }
}

function repopulateUserRolesAsJSON(userRoles) {
    var userRolesMap = {};
    var roles = {};
    var privilegesMap = {};
    var regexCollections = {};
    var menus = {};
    for (var i = 0; i < userRoles.length; i++) {
        var userRole = userRoles[i];
        roles[userRole.id] = userRole._id;
        var privileges = userRole[Constants.Admin.Roles.PRIVILEGES];
        if (privileges && privileges.length > 0) {
            for (var j = 0; j < privileges.length; j++) {
                var privilege = privileges[j];
                var collection = privilege.collection;
                if (privilege.regex) {
                    regexCollections[collection] = new RegExp(collection);
                }
                privilege.role_id = userRole._id;
                privilege.roleId = userRole.id;
                privilege.roleLabel = userRole[Constants.Admin.Roles.ROLE];
                privilege.span = userRole.span;
                privilegesMap[collection] = privilegesMap[collection] || [];
                privilegesMap[collection].push(privilege);
            }
        }
        var menusAvailability = userRole[Constants.Admin.Roles.MENUS_AVAILABILITY];
        if (menusAvailability) {
            menus[userRole.id] = {menusAvailability:menusAvailability, menuInfos:userRole[Constants.Admin.Roles.MENU_INFOS]};
        }
    }
    if (Object.keys(roles).length > 0) {
        userRolesMap.roles = roles;
    }
    if (Object.keys(privilegesMap).length > 0) {
        userRolesMap.privileges = privilegesMap;
    }
    if (Object.keys(regexCollections).length > 0) {
        userRolesMap.regexCollections = regexCollections;
    }
    if (Object.keys(menus).length > 0) {
        userRolesMap.menus = menus;
    }
    return userRolesMap;
}

exports.resolveGroupRoles = function (roles, db) {
    //bcz currently supported for only defined one role of group type and resolved only if applicationid and role is defined which is required for new role.
    if (!roles || roles.length !== 1 || !roles[0].appid || !roles[0].role || !roles[0].role.group) {
        var d = Q.defer();
        d.resolve(roles);
        return d.promise;
    }
    var innerRoles = [];
    var roleToQuery = roles[0].role._id;
    return mergeParentData(roleToQuery, undefined, innerRoles, db).then(function () {
        return innerRoles;
    })
}

