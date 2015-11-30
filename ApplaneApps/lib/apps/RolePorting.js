var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");

exports.makeRoleMappings = function (db) {
    var roleMappings = [];
    var applicationQuery = {$collection: "pl.applications", $filter: {"roles": {$exists: true}}, $events: false, $modules: false};
    return db.query(applicationQuery).then(function (applicationData) {
        var applications = applicationData.result;
        return Utils.iterateArrayWithPromise(applications, function (index, application) {
            var roles = application.roles;
            var applicationid = {_id: application._id, label: application.label};
            for (var i = 0; i < roles.length; i++) {
                var roleMapping = roles[i];
                roleMapping.applicationid = applicationid;
                roleMappings.push(roleMapping);
            }

        })
    }).then(function () {
        var qviewQuery = {$collection: "pl.qviews", $filter: {"roles": {$exists: true}}, $events: false, $modules: false};
        return db.query(qviewQuery);
    }).then(function (qviewData) {
        var qViews = qviewData.result;
        return Utils.iterateArrayWithPromise(qViews, function (index, qview) {
            var qviewRoles = qview.roles;
            var qviewid = {_id: qview._id, id: qview.id};
            for (var i = 0; i < qviewRoles.length; i++) {
                var roleMapping = qviewRoles[i];
                roleMapping.qviewid = qviewid;
                roleMapping.collectionid = qview.collection;
                roleMappings.push(roleMapping);
            }
        })

    }).then(function () {
        var actionsQuery = {$collection: "pl.actions", $filter: {"roles": {$exists: true}}, $events: false, $modules: false};
        return db.query(actionsQuery);
    }).then(function (actionsData) {
        var actions = actionsData.result;
        return Utils.iterateArrayWithPromise(actions, function (index, action) {
            var actionRoles = action.roles;
            var actionid = {_id: action._id, id: action.id};
            for (var i = 0; i < actionRoles.length; i++) {
                var roleMapping = actionRoles[i];
                roleMapping.actionid = actionid;
                roleMapping.collectionid = action.collectionid;
                roleMappings.push(roleMapping);
            }
        })

    }).then(function () {
        var roleQuery = {$collection: "pl.roles", $filter: {"roles": {$exists: true}}, $events: false, $modules: false};
        return db.query(roleQuery)
    }).then(function (roleData) {
        var roles = roleData.result;
        return Utils.iterateArrayWithPromise(roles, function (index, role) {
            var innerRoles = role.roles;
            var roleid = {_id: role._id, role: role.role};
            for (var i = 0; i < innerRoles.length; i++) {
                var roleMapping = innerRoles[i];
                roleMapping.roleid = roleid;
                roleMappings.push(roleMapping);
            }
        })

    }).then(function () {
        var updates = {$collection: "pl.rolemappings", $insert: roleMappings, $events: false, $modules: false};
        return db.update(updates)
    });
}

exports.makeNewRoleMappings = function (db) {
    var applicationQuery = {$collection: "pl.applications", $filter: {"roles": {$exists: true}}, $events: false, $modules: false};
    return db.query(applicationQuery).then(function (applicationData) {
        var applications = applicationData.result;
        return Utils.iterateArrayWithPromise(applications, function (index, application) {
            var roles = application.roles;
            var applicationRoles = [];
            var applicationid = {_id: application._id, label: application.label};
            for (var i = 0; i < roles.length; i++) {
                var roleMapping = roles[i];
                roleMapping.applicationid = applicationid;
                applicationRoles.push(roleMapping);
            }
            return db.update({$collection: "pl.applicationroles", $insert: applicationRoles, $modules: false, $events: false});
        })
    }).then(function () {
        var actionsQuery = {$collection: "pl.actions", $filter: {"roles": {$exists: true}}, $events: false, $modules: false};
        return db.query(actionsQuery);
    }).then(function (actionsData) {
        var actions = actionsData.result;
        return Utils.iterateArrayWithPromise(actions, function (index, action) {
            var roles = action.roles;
            var actionRoles = [];
            var actionid = {_id: action._id, id: action.id, label: action.label};
            for (var i = 0; i < roles.length; i++) {
                var role = roles[i];
                role.actionid = actionid;
                role.collectionid = action.collectionid;
                actionRoles.push(role);
            }
            return db.update({$collection: "pl.actionroles", $insert: actionRoles, $modules: false, $events: false});
        })

    }).then(function () {
        var roleQuery = {$collection: "pl.roles", $filter: {"roles": {$exists: true}}, $events: false, $modules: false};
        return db.query(roleQuery)
    }).then(function (roleData) {
        var roles = roleData.result;
        return Utils.iterateArrayWithPromise(roles, function (index, role) {
            var innerRoles = role.roles;
            var roleRoles = [];
            var roleid = {_id: role._id, role: role.role};
            for (var i = 0; i < innerRoles.length; i++) {
                var roleMapping = innerRoles[i];
                roleMapping.roleid = roleid;
                roleRoles.push(roleMapping);
            }
            return db.update({$collection: "pl.roleroles", $insert: roleRoles, $modules: false, $events: false});
        })

    })
}

exports.portRoles = function (db) {
    return db.query({$collection: "pl.roles", $filter: {"privileges": {$exists: true}}, $events: false, $modules: false}).then(function (roles) {
        return Utils.iterateArrayWithPromise(roles, function (index, role) {
            var roleid = {_id: role._id, role: role.role};
            var privileges = role.privileges;
            return populateData("pl.privileges", undefined, privileges, roleid, db);
        })
    })
}


function populateData(collection, privilegeid, records, roleid, db) {
    return Utils.iterateArrayWithPromise(records, function (index, record) {
        var privilegeid = privilegeid ? privilegeid : undefined;
        var operationid = undefined;

        if (collection === "pl.privileges") {
            privilegeid = {_id: record._id, collection: record.collection};
        } else if (collection === "pl.privilegeOperations") {
            operationid = {_id: record._id, type: record.type};
        }

        record.roleid = roleid;

        var fieldInfos = record.fieldInfos;
        delete record.fieldInfos;
        var filterInfos = record.filterInfos;
        delete record.filterInfos;

        var actionInfos = record.actionInfos;
//        delete record.actionInfos;
        var viewInfos = record.viewInfos;
//        delete record.viewInfos;
        var operationInfos = record.operationInfos;
//        delete record.operationInfos;

        if (fieldInfos && fieldInfos.length > 0) {
            return populatePrivilegeData("pl.privilegeFields", fieldInfos, privilegeid, operationid, roleid, db)
        }
        if (filterInfos && filterInfos.length > 0) {
            return populatePrivilegeData("pl.privilegeFilters", filterInfos, privilegeid, operationid, roleid, db)
        }
        if (actionInfos && actionInfos.length > 0) {
            delete record.actionInfos;
            return populatePrivilegeData("pl.privilegeActions", actionInfos, privilegeid, operationid, roleid, db);
        }
        if (viewInfos && viewInfos.length > 0) {
            delete record.viewInfos;
            return populatePrivilegeData("pl.privilegeViews", viewInfos, privilegeid, operationid, roleid, db);
        }
        if (operationInfos && operationInfos.length > 0) {
            delete record.operationInfos;
            return populateData("pl.privilegeOperations", privilegeid, operationInfos, roleid, db);
        }

//        return db.update({$collection: collection, $insert: record, $events: false, $modules: false});
    }).then(function () {
        return db.update({$collection: collection, $insert: records, $events: false, $modules: false});
    })

}


function populatePrivilegeData(collectionName, infos, privilegeid, operationid, roleid, db) {
    for (var i = 0; i < infos.length; i++) {
        var info = infos[i];
        info.roleid = roleid;
        info.privilegeid = privilegeid;
        if (operationid != undefined) {
            info.operationid = operationid;
        }
    }
    return db.update({$collection: collectionName, $insert: infos, $events: false, $modules: false})
}

//function populatePrivileges(role, db) {
//    if (role.privileges && role.privileges.length > 0) {
//        var roleid = {_id: role._id, role: role.role};
//        var privileges = role.privileges;
//
//        return Utils.iterateArrayWithPromise(privileges, function (index, privilege) {
//            var privilegeid = {_id: privilege._id, collection: privilege.collection};
//
//            privilege.roleid = roleid;
//            var fieldInfos = privilege.fieldInfos;
//            delete privilege.fieldInfos;
//            var filterInfos = privilege.filterInfos;
//            delete privilege.filterInfos;
//            var actionInfos = privilege.actionInfos;
//            delete privilege.actionInfos;
//            var viewInfos = privilege.viewInfos;
//            delete privilege.viewInfos;
//            var operationInfos = privilege.operationInfos;
//            delete privilege.operationInfos;
//
//            if (fieldInfos && fieldInfos.length > 0) {
//                return populatePrivilegeData("pl.privilegeFields", fieldInfos, privilegeid, undefined, roleid, db)
//            }
//            if (filterInfos && filterInfos.length > 0) {
//                return populatePrivilegeData("pl.privilegeFilters", filterInfos, privilegeid, undefined, roleid, db)
//            }
//            if (actionInfos && actionInfos.length > 0) {
//                return populatePrivilegeData("pl.privilegeActions", actionInfos, privilegeid, undefined, roleid, db);
//            }
//            if (viewInfos && viewInfos.length > 0) {
//                return populatePrivilegeData("pl.privilegeViews", viewInfos, privilegeid, undefined, roleid, db);
//            }
//            if (operationInfos && operationInfos.length > 0) {
//                return populatePrivilegeOperations(operationInfos, roleid, db);
//            }
//        }).then(function () {
//            return db.update({$collection: "pl.privileges", $insert: privileges, $events: false, $modules: false});
//        })
//    } else {
//        var d = Q.defer();
//        d.resolve();
//        return d.promise;
//    }
//}
//
//
//function populatePrivilegeOperations(operationInfos, privilegeid, roleid, db) {
//    return Utils.iterateArrayWithPromise(operationInfos, function (index, operationInfo) {
//
//        var operationid = {_id: operationInfo._id, type: operationInfo.type};
//
//        var fieldInfos = operationInfo.fieldInfos;
//        delete operationInfo.fieldInfos;
//        var filterInfos = operationInfo.filterInfos;
//        delete operationInfo.filterInfos;
//
//        if (fieldInfos && fieldInfos.length > 0) {
//            return populatePrivilegeData("pl.privilegeFields", fieldInfos, privilegeid, operationid, roleid, db)
//        }
//        if (filterInfos && filterInfos.length > 0) {
//            return populatePrivilegeData("pl.privilegeFilters", filterInfos, privilegeid, operationid, roleid, db);
//        }
//    }).then(function () {
//        return db.update({$collection: "pl.privilegeOperations", $insert: operationInfos, $modules: false, $events: false});
//    })
//
//}


