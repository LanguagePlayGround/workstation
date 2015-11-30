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
var CacheService = require("ApplaneDB/lib/CacheService.js");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError.js");

exports.onApplicationQuery = function (query, db, options) {
    //add label fields in query to get data merging as per label field.
    var queryFields = query.$fields;
    if (queryFields && Object.keys(queryFields).length > 0) {
        var fieldValue = queryFields[Object.keys(queryFields)[0]];
        if (fieldValue === 0) {
            delete queryFields.label;
            delete queryFields.id;
        } else {
            queryFields.label = 1;
            queryFields.id = 1;
        }
    }
}

exports.onResult = function (query, result, db, options) {
    return Utility.onMergeResult(query, result, options, db);
}

exports.onPreSave = function (document, db, options) {
    var collectionName = document.collection;
    if (document.type === "delete" && collectionName !== "pl.fieldcustomizations") {
        throw new BusinessLogicError("Delete is not allowed in " + Utility.getType(collectionName));
    }
    var fieldName = Utility.getField(collectionName);
    if ((document.type === "insert" || document.type === "update" ) && (document.collection === "pl.applications")) {
        var label = document.get("label");
        document.set("uri", Utility.getIndentifer(label));
        if (document.type === "insert" && !document.get("id")) {
            document.set("id", label);
        }
    }
    return Utility.validateData(document, collectionName, fieldName, db).then(
        function () {
            Utility.insertDefaultData(document, db);
            validateDoc(document, collectionName, fieldName);
            if (collectionName === "pl.rolePrivileges") {
                return require("./Roles.js").populatePrivilegeStr(document, fieldName, collectionName, db);
            }
        }).then(function () {
            if (document.type === "update") {
                return Utility.updateLocalData(document.get("_id"), document.getOld(fieldName), db, collectionName, options);
            }
        })
}

function validateService(document) {
    var type = document.get("type");
    if (type && !document.get(type)) {
        throw new BusinessLogicError(type + " is not provided for service [" + document.get("id") + "]");
    }
}

function validateDoc(document, collectionName, field) {
    if (document.type === "update" && (collectionName === "pl.collections" || collectionName === "pl.applications" || collectionName === "pl.rolePrivileges" || collectionName === "pl.services" || collectionName === "pl_applications"|| collectionName === "pl_views")) {
        var updatedFields = document.getUpdatedFields();
        if (updatedFields) {
            if (collectionName !== "pl.applications" && updatedFields.indexOf(field) !== -1) {
                throw new BusinessLogicError("Update is not allowed in [" + field + "] in collection[" + collectionName + "]");
            }
            if (collectionName === "pl.collections" && updatedFields.indexOf("parentCollection") !== -1) {
                throw new BusinessLogicError("Update is not allowed in [ Parent Collection ] in collection[" + collectionName + "]");
            } else if (collectionName === "pl.applications" && updatedFields.indexOf("id") !== -1) {
                throw new BusinessLogicError("Update is not allowed in [ id ] in collection[" + collectionName + "]");
            }
        }
    }
    if (collectionName === "pl.services") {
        validateService(document);
    }
}

exports.onPostSave = function (document, db, options) {
    var collectionName = document.collection;
    var fieldName = Utility.getField(collectionName);
    return updateRoles(document, collectionName, db).then(
        function () {
            if (collectionName === "pl.applications") {
                var updatedFields = document.getUpdatedFields();
                if (!updatedFields || updatedFields.indexOf("collections") === -1) {
                    return;
                }
                return db.invokeFunction("Porting.removeUserCache", [
                    {db: db.db.databaseName}
                ]).then(function () {
                    return ensureIndexesInCollections(document, db);
                })
            } else if (collectionName === "pl.functions") {
                var functionName = document.get("name") || document.getOld("name");
                return CacheService.clearFunctionCache(functionName, db);
            }
        }).then(
        function () {
            if (document.type === "insert" && collectionName === "pl.collections" && document.get("parentCollection")) {
                return Utility.copyCollectionDefinition(document, db, options);
            }
        }).then(
        function () {
            if (document.type === "update" && collectionName === "pl.rolePrivileges") {
                //on update in role privileges ,we need to update privilege defined in role also.
                return updateRolesPrivilege(document, db, options);
            }
        }).then(function () {
            if (document.type === "update") {
                return Utility.updateAppLock(document.getOld(fieldName), collectionName, db, options);
            }
        })
}


function updateRolesPrivilege(document, db, options) {
    var documentId = document.get("_id");
    var query = {$collection: "pl.roles", $unwind: ["privileges"], $filter: {"privileges.privilegeid": documentId}};
    return db.query(query).then(
        function (roles) {
            roles = roles.result;
            return updatePrivilegeInRole(roles, db);
        }).then(
        function () {
            query = {$collection: "pl.roles", $unwind: ["privileges", "privileges.operationInfos", "privileges.operationInfos.fkInfos"], $filter: {"privileges.operationInfos.fkInfos.privilegeid": documentId}};
            return db.query(query);
        }).then(
        function (roles) {
            roles = roles.result;
            return updatePrivilegeInRole(roles, db);
        })
}

function updatePrivilegeInRole(roles, db) {
    return Utils.iterateArrayWithoutPromise(roles, function (index, role) {
        return db.update({$collection: "pl.roles", $update: {_id: role._id, $set: {privileges: {$update: [
            {_id: role.privileges._id, $set: {__system__: true}}
        ]}}}})
    })
}

function ensureIndexesInCollections(document, db) {
    var collectionDocuments = document.getDocuments("collections", ["insert", "update"]);
    if (!collectionDocuments || collectionDocuments.length === 0) {
        return;
    }
    var collections = [];
    for (var i = 0; i < collectionDocuments.length; i++) {
        var collectionDocument = collectionDocuments[i];
        var collectionName = collectionDocument.get("collection");
        if (collections.indexOf(collectionName) === -1) {
            collections.push(collectionName);
        }
    }
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", $fields: {db: 1}, $filter: {"applications.application": document.get("id")}});
        }).then(function (dbResult) {
            dbResult = dbResult.result;
            return Utils.iterateArrayWithPromise(dbResult, function (index, dbInfo) {
                var dbName = dbInfo.db;
                return db.invokeFunction("Porting.ensureIndexes", [
                    {db: dbName, collection: collections}
                ]);
            })
        })
}

function updateRoles(document, collectionName, db) {
    if (collectionName !== "pl.applications" || document.type !== "insert") {
        var d = require("q").defer();
        d.resolve();
        return d.promise;
    }
    //add default role with defualt privileges when defined newRole:true and assign that role to user for particular application.
    var label = document.get("label");
    var newRole = document.get("newRole");
    var roleId = undefined;
    var defaultRole = getDefaultRole(document);
    var insert = [
        {$collection: "pl.roles", $insert: defaultRole, $applock: false}
    ];
    return db.update(insert).then(
        function (roleData) {
            roleId = roleData["pl.roles"].$insert[0]._id;
            if (!newRole) {
                return db.update({$collection: "pl.applications", $update: [
                    {_id: document.get("_id"), $set: {roles: {$insert: [
                        {role: {_id: roleId}}
                    ]}}}
                ], $applock: false});
            }
        }).then(
        function () {
            if (!newRole || document.get("addRoleToUser")) {
                var innerRole = {role: {_id: roleId}};
                if (newRole) {
                    innerRole.appid = document.get("id");
                }
                var userUpdate = {_id: db.user._id, $set: {roles: {$insert: [innerRole]}}}
                return db.update({$collection: "pl.users", $update: userUpdate, $applock: false, $modules: {"Role": 0}});
            }
        })
}

function getDefaultRole(document) {
    var appId = document.get("id");
    var appLabel = document.get("label");
    if (!document.get("newRole")) {
        return {role: appLabel, id: appId};
    }
    var role = {id: appId, role: appLabel, default: true, applicationid: appId};
    var group = document.get("group");
    if (group) {
        role.group = true;
    }
    role.privileges = {$insert: [
        {type: "Privilege", privilegeid: {$query: {id: "Metadata"}}},
        {type: "Privilege", privilegeid: {$query: {id: "User"}}},
        {type: "Privilege", privilegeid: {$query: {id: "Default"}}}
    ]};
    return role;
}

exports.executeResultForNavigation = function (query, result, db, options) {
    if (db.isGlobalDB()) {
        return;
    }
    var limit = query[Constants.Query.LIMIT];
    if (limit === undefined) {
        return;
    }
    var skip = query[Constants.Query.SKIP] || 0;
    delete query[Constants.Query.LIMIT];
    delete query[Constants.Query.SKIP];
    delete query[Constants.Query.EVENTS];
    return db.query(query).then(function (mergedResult) {
        var data = mergedResult.result;
        data.splice(0, skip);
        result.dataInfo = result.dataInfo || {};
        var dataLength = data.length;
        if (dataLength > limit) {
            data.splice(limit, (dataLength - limit));
            result.dataInfo.hasNext = true;
        } else {
            result.dataInfo.hasNext = false;
        }
        var mainResult = result.result;
        mainResult.splice(0, mainResult.length);
        mainResult.push.apply(mainResult, data);
    })
}
