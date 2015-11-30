/**
 * Created by rajit on 22/1/15.
 */



var Constants = require("ApplaneDB/lib/Constants.js");
var Http = require("ApplaneDB/lib/Http.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require('q');



exports.getCurrentUserDB = function (params, db) {
    return db.query({$collection: "pl.users", $fields: {referredDB: 1}, $modules: false, $events: false, $filter: {_id: db.user._id}}).then(function (result) {
        if (result && result.result && result.result.length > 0 && result.result[0].referredDB) {
            return result.result[0].referredDB.db;
        }

    })

}

exports.getConnection = function (params, db, options) {
    //roles

    var daffodildb = undefined;
    var token = undefined;
    //connect unauthorised with daffodilsw
    return db.connectUnauthorized("daffodilsw").then(
        function (daffodilsw) {
            daffodildb = daffodilsw;
            //query on pl.users
            return getUser(daffodildb, db);
        }).then(
        function (user) {
            if (user && user.result && user.result.length > 0) {
                return getUpdatedUser(user.result[0], daffodildb, db);
            } else {
                return createUser(daffodildb, db)
            }
        }).then(
        function (username) {
            token = Utils.getUnique();
            return Http.saveConnection(token, daffodildb.db.databaseName, undefined, {username: username});
        }).then(
        function () {
            return Http.connectWithToken(token);
        }).then(function (result) {
            result.db = daffodildb.db.databaseName;
            return result;
        });

};

function getUpdatedUser(user, daffodildb, db) {
    var setField = {};
    //add referredDB if not already exist
    if (!user[Constants.Admin.Users.REFERRED_DB]) {
        setField[Constants.Admin.Users.REFERRED_DB] = {"db": db.db.databaseName, user: {_id: db.user._id, username: db.user.username,emailid:db.user.emailid}};
    }
    //add Roadmap ROLE if not already exist
    var availableRoles = user[Constants.Admin.Users.ROLES] || [];
    var found = undefined;
    var roleCount = availableRoles ? availableRoles.length : 0;
    for (var i = 0; i < roleCount; i++) {
        if (availableRoles[i] && availableRoles[i].role && availableRoles[i].role.id === "Roadmap") {
            found = true;
            break;
        }
    }
    if (!found) {
        var role = {};
        role[Constants.Admin.Users.ROLE] = {"$query": {id: "Roadmap"}};
        setField[Constants.Admin.Users.ROLES] = {};
        setField[Constants.Admin.Users.ROLES][Constants.Update.INSERT] = [role];
    }

    if (Object.keys(setField).length > 0) {
        return daffodildb.update({$collection: Constants.Admin.USERS, $update: {"_id": user["_id"], $set: setField}}).then(function () {
            return user[Constants.Admin.Users.USER_NAME];
        })
    } else {
        return user[Constants.Admin.Users.USER_NAME];
    }
}


function getUser(daffodildb, db) {
    //first apply filter acc. to    REFERRED_DB
    var referredDbFilter = {};
    referredDbFilter[Constants.Admin.Users.REFERRED_DB + "." + "db"] = db.db.databaseName;
    referredDbFilter[Constants.Admin.Users.REFERRED_DB + "." + "user" + "." + "_id"] = db.user._id;

    var filter = referredDbFilter;
    var fields = {};
    fields[Constants.Admin.Users.USER_NAME] = 1;
    /*fields[Constants.Admin.Users.MODULES] = 1;*/
    fields[Constants.Admin.Users.REFERRED_DB] = 1;
    fields[Constants.Admin.Users.ROLES] = 1;
    return daffodildb.query({$collection: Constants.Admin.USERS, $filter: filter, $fields: fields, $limit: 1})
}

function createUser(daffodildb, db) {
    var role = {};
    role[Constants.Admin.Users.ROLE] = {"$query": {id: "Roadmap"}};

    var insert = {};
    if (db.user.fullname) {
        insert[Constants.Admin.Users.FULL_NAME] = db.user.fullname;
    }

    insert[Constants.Admin.Users.USER_NAME] = db.user.username + "-" + db.db.databaseName;
    insert[Constants.Admin.Users.ROLES] = [role];
    insert[Constants.Admin.Users.REFERRED_DB] = {"db": db.db.databaseName, user: {_id: db.user._id, username: db.user.username,emailid:db.user.emailid}};
    return daffodildb.update({$collection: Constants.Admin.USERS, $insert: [insert]}).then(function (user) {
        return user[Constants.Admin.USERS][Constants.Update.INSERT][0][Constants.Admin.Users.USER_NAME];
    })
}

exports.getAvailableModules = function (parameters, db) {
    var filter = {};
    filter["_id"] = db.user._id;
    return db.query({$collection: Constants.Admin.USERS, $filter: filter}).then(function (users) {
        if (users && users.result && users.result.length > 0 && users.result[0][Constants.Admin.Users.MODULES] && users.result[0][Constants.Admin.Users.MODULES].length > 0) {
            var availableModules = users.result[0][Constants.Admin.Users.MODULES];
            var availableModulesIds = [];
            for (var i = 0; i < availableModules.length; i++) {
                availableModulesIds.push(availableModules[i]._id);
            }
            return availableModulesIds;
        } else {
            return [];
        }
    })
};

/*
 function getModulesIdsToBeDeleted(modulesToBeDeleted, modulesIds) {
 for (var i = 0; i < modulesToBeDeleted.length; i++) {
 var field = modulesToBeDeleted[i];
 modulesIds.push({_id: field._id});
 }
 return modulesIds;
 }

 function checkModulesToBeInserted(requiredModules, availableModules) {
 var modulesToBeInserted = [];
 for (var i = 0; i < requiredModules.length; i++) {
 var rm = requiredModules[i];
 var index = Utils.isExists(availableModules, rm, "_id");
 if (index === undefined) {
 modulesToBeInserted.push(rm)
 }

 }
 return modulesToBeInserted;
 }


 function checkModulesToBeDeleted(requiredModules, availableModules) {
 var modulesToBeDeleted = [];
 for (var i = 0; i < availableModules.length; i++) {
 var am = availableModules[i];
 var index = Utils.isExists(requiredModules, am, "_id");
 if (index === undefined) {
 modulesToBeDeleted.push(am)
 }

 }
 return modulesToBeDeleted;
 }
 */

/*exports.getConnection = function (params, db, options) {
 //roles
 var roles = db.userRoles && db.userRoles.roles ? db.userRoles.roles : undefined;
 var daffodildb = undefined;
 var token = undefined;
 var moduleNames = [];
 var modules = undefined;
 var availableRolesID = [];
 for (var key in roles) {
 availableRolesID.push(roles[key]);
 }
 var filter = {};
 filter[Constants.Admin.Users.ROLES + "." + Constants.Admin.Users.ROLE + "._id"] = {"$in":availableRolesID};


 var fields = {};
 fields["_id"] = 1;
 fields[Constants.Admin.Applications.LABEL] = 1;
 fields[Constants.Admin.Applications.MODULE_NAME] = 1;

 //query on pl.applications
 return db.query({$collection:Constants.Admin.APPLICATIONS, $filter:filter, $fields:fields}).then(
 function (applications) {
 if (applications && applications.result && applications.result.length > 0) {

 for (var i = 0; i < applications.result.length; i++) {
 if (applications.result[i][Constants.Admin.Applications.MODULE_NAME]) {
 moduleNames.push(applications.result[i][Constants.Admin.Applications.MODULE_NAME]);
 }

 }
 }

 //connect unauthorised with daffodilsw
 return db.connectUnauthorized("daffodilsw")
 }).then(
 function (daffodilsw) {
 daffodildb = daffodilsw;
 //query on modules
 var filter = {"$or":[
 {"name":{"$in":moduleNames}},
 {"public":true}
 ]};


 return daffodildb.query({$collection:"modules", $filter:filter})
 }).then(
 function (modules1) {
 modules = modules1;
 //query on pl.users

 return getUser(daffodildb, db);

 }).then(
 function (user) {
 if (user && user.result && user.result.length > 0) {
 return getUpdatedUser(modules.result, user.result[0], daffodildb, db);
 } else {
 return createUser(modules, daffodildb, db)
 }
 }).then(
 function (username) {
 token = Utils.getUnique();
 return Http.saveConnection(token, daffodildb.db.databaseName, undefined, {username:username});
 }).then(
 function () {
 return Http.connectWithToken(token);
 }).then(function (result) {
 result.db = daffodildb.db.databaseName;
 return result;
 });

 };*/
/*function getUpdatedUser(requiredModules, user, daffodildb, db) {
 //update modules
 var availableModules = user[Constants.Admin.Users.MODULES] || [];
 requiredModules = requiredModules || [];
 var modulesToBeInserted = checkModulesToBeInserted(requiredModules, availableModules);
 var modulesToBeDeleted = checkModulesToBeDeleted(requiredModules, availableModules);
 var setField = {};

 if (modulesToBeInserted.length > 0 || modulesToBeDeleted.length > 0) {
 setField[Constants.Admin.Users.MODULES] = {};

 if (modulesToBeInserted.length > 0) {
 //module to insert
 setField[Constants.Admin.Users.MODULES][Constants.Update.INSERT] = modulesToBeInserted;
 }
 var modulesIds = [];
 getModulesIdsToBeDeleted(modulesToBeDeleted, modulesIds);
 if (modulesIds.length > 0) {
 //module to delete
 setField[Constants.Admin.Users.MODULES][Constants.Update.DELETE] = modulesIds;
 }
 }

 //add referredDB if not already exist
 if (!user[Constants.Admin.Users.REFERRED_DB]) {
 setField[Constants.Admin.Users.REFERRED_DB] = {"db": db.db.databaseName, user: {_id: db.user._id, username: db.user.username}};
 }


 //add Roadmap ROLE if not already exist
 var availableRoles = user[Constants.Admin.Users.ROLES] || [];
 var found = undefined;

 var roleCount = availableRoles ? availableRoles.length : 0;
 for (var i = 0; i < roleCount; i++) {
 if (availableRoles[i] && availableRoles[i].role && availableRoles[i].role.id === "Roadmap") {
 found = true;
 break;
 }
 }

 if (!found) {
 var role = {};
 role[Constants.Admin.Users.ROLE] = {"$query": {id: "Roadmap"}};
 setField[Constants.Admin.Users.ROLES] = {};
 setField[Constants.Admin.Users.ROLES][Constants.Update.INSERT] = [role];
 }

 if (Object.keys(setField).length > 0) {
 return daffodildb.update({$collection: Constants.Admin.USERS, $update: {"_id": user["_id"], $set: setField}}).then(function () {
 return user[Constants.Admin.Users.USER_NAME];
 })
 } else {
 return user[Constants.Admin.Users.USER_NAME];
 }
 }*/
