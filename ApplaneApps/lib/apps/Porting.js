var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");
var Utility = require("./triggers/Utility.js");
var AppsConstants = require("./Constants.js");
var Moment = require("moment");
var Self = require("./Porting.js");

//for sixc only, need to remove  :Rohit 29-04-2015
exports.removeCollection = function (params, db) {
    return; //it was only for temp basis
    var d = Q.defer();
    var collection = params.collection;
    if (!collection) {
        throw new Error("Specify collection name");
    }
    var authToken = params.authToken;
    if (!authToken || authToken !== "abcd") {
        throw new Error("Not authorized to remove")
    }
    db.db.collection(collection).deleteMany({}, {w: 1}, function (err, result) {
        if (err) {
            d.reject(err)
        } else {
            d.resolve(result)
        }
    })

    return d.promise;

}
exports.portLineItems = function (db) {
    db.db.collection("voucher").find({}, {fields: {__history: 0}}).toArray(function (err, result) {
        if (err) {
            d.reject(err);
            return;
        }
        return Utils.iterateArrayWithPromise(result,
            function (index, voucher) {
                var voucherId = {_id: voucher._id};
                voucherId.voucher_date = voucher.voucher_date;
                voucherId.voucher_no = voucher.voucher_no;
                voucherId.voucher_type_id = voucher.voucher_type_id;
                voucherId.voucher_no_lower = voucher.voucher_no_lower;
                voucherId.source_id = voucher.source_id;
                voucherId.source_type = voucher.source_type;
                voucherId.location_id = voucher.location_id;
                voucherId.business_unit_id = voucher.business_unit_id;
                var voucherLineItems = voucher.voucher_line_item;
                if (voucherLineItems && voucherLineItems.length > 0) {
                    for (var i = 0; i < voucherLineItems.length; i++) {
                        voucherLineItems[i].voucher_id = voucherId;
                    }
                    return db.mongoUpdate({$collection: "voucherlineitems", $insert: voucherLineItems});
                }
            })
    })
}

exports.portDBData = function (params, db) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var adminDB = undefined;
    return ApplaneDB.getAdminDB().then(
        function (adb) {
            adminDB = adb;
            return adminDB.query({$collection: "pl.dbs"});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbInfo) {
                var valuesToSet = {};
                if (!dbInfo.code) {
                    valuesToSet.code = Utils.getUnique();
                }
                if (!dbInfo.globalUserName && dbInfo.guestUserName) {
                    valuesToSet.globalUserName = dbInfo.guestUserName;
                }
                if (Object.keys(valuesToSet).length > 0) {
                    return adminDB.mongoUpdate({$collection: "pl.dbs", $update: {$query: {_id: dbInfo._id}, $set: valuesToSet}});
                }
            })
        })
}

exports.getUserNotifications = function (params, db) {
    var notificationId = params.id;
    var notifications = undefined;
    var finalUserNotifications = [];
    var userRoles = undefined;
    var adminDb = undefined;
    return getUserDb(params.username, db).then(
        function (dbToConnect) {
            userRoles = dbToConnect.userRoles;
            if (!userRoles || !userRoles.roles) {
                return;
            }
            return db.getAdminDB();
        }).then(
        function (adb) {
            if (!userRoles || !userRoles.roles) {
                return;
            }
            adminDb = adb;
            return adminDb.query({$collection: "pl.dbs", $filter: {db: db.db.databaseName, notificationEnabled: true}});
        }).then(
        function (dbResult) {
            if (!userRoles || !userRoles.roles || !dbResult || dbResult.result.length === 0) {
                return;
            }
            var roleNames = Object.keys(userRoles.roles);
            var notificationFilter = {roles: {$in: roleNames}};
            if (notificationId) {
                notificationFilter.id = notificationId;
            }
            var notificationQuery = {$collection: "pl.notifications", $filter: notificationFilter, $sort: {id: 1}};
            return adminDb.query(notificationQuery);
        }).then(
        function (notificationsResult) {
            if (!notificationsResult || notificationsResult.result.length === 0) {
                return;
            }
            notifications = notificationsResult.result;
            var userNotificationFilter = {"userid": db.user._id};
            if (notificationId) {
                userNotificationFilter.notificationid = notificationId;
            }
            var userNotificationQuery = {$collection: "pl.userNotifications", $filter: userNotificationFilter, $fields: {notificationid: 1, status: 1}};
            return db.query(userNotificationQuery);
        }).then(
        function (userNotifications) {
            if (!notifications || notifications.length === 0) {
                return;
            }
            userNotifications = userNotifications.result;
            finalUserNotifications = populateUserNotifications(notifications, userNotifications, db.db.databaseName);
        }).then(function () {
            return finalUserNotifications;
        })
}

function populateUserNotifications(notifications, userNotifications, dbToGet) {
    var finalUserNotifications = [];
    for (var i = 0; i < notifications.length; i++) {
        var notification = notifications[i];
        var notificationId = notification.id;
        var index = Utils.isExists(userNotifications, {notificationid: notificationId}, "notificationid");
        if (index !== undefined) {
            finalUserNotifications.push({_id: notification._id, notificationid: notificationId, status: userNotifications[index].status});
            userNotifications.splice(index, 1);
            continue;
        }
        var dbWiseStatus = notification.dbs;
        var finalStatus = notification.status || "Off";
        if (dbWiseStatus && dbWiseStatus.length > 0) {
            for (var j = 0; j < dbWiseStatus.length; j++) {
                var dbName = dbWiseStatus[j].db;
                if (dbName && dbName === dbToGet && dbWiseStatus[j].status) {
                    finalStatus = dbWiseStatus[j].status;
                    break;
                }
            }
        }
        finalUserNotifications.push({_id: notification._id, notificationid: notificationId, status: finalStatus});
    }
    return finalUserNotifications;
}

exports.portDateData = function (document, db, options) {
    var parameters = options.parameters;
    var collection = parameters.collection;
    if (!collection) {
        throw new Error("Collection name not found..")
    }
    var field = parameters.field;
    if (!field) {
        throw new Error("Field not found")
    }

    if (!Array.isArray(field)) {
        throw new Error("Field should be array only");
    }
    if (field.length == 0) {
        throw new Error("Field length can not be zero");
    }

    if (field.length > 2) {
        throw new Error("Field length can not be greater than 3");
    }


    if (field.length == 1) {
        return handleSingleDateUpdate(document, field[0], collection, db, options);
    } else if (field.length == 2) {
        return handleOneArrayDateUpdate(document, field[0], field[1], collection, db, options)
    }
}
function handleSingleDateUpdate(document, field1, collection, db, options) {
    var fieldValue = document[field1];
    if ((!fieldValue) || !(fieldValue instanceof Date)) {
        return;
    }
    var utcHrs = fieldValue.getUTCHours();
    var utcMinutes = fieldValue.getUTCMinutes();

    if (utcHrs == 0) {
        return;
    }


    //we will change
    var newDate = getNextUTCDate(fieldValue);
    var updates = {$query: {_id: document._id}, $set: {}}
    updates.$set[field1] = newDate;

    return db.mongoUpdate({$collection: collection, $update: updates}).then(function () {
        return incLog(options.logid, "updates", db);
    })


}

function getNextUTCDate(date) {
    var newDate = new Date(date);

    newDate.setUTCHours(newDate.getUTCHours() + 5);
    newDate.setUTCMinutes(newDate.getUTCMinutes() + 30);
    newDate.setUTCHours(0);
    newDate.setUTCMinutes(0);
    newDate.setUTCSeconds(0);
    newDate.setUTCMilliseconds(0);
    return newDate;


}

function handleOneArrayDateUpdate(document, field1, field2, collection, db, options) {

    var fieldValue = document[field1]
    if (!fieldValue || !(Array.isArray(fieldValue))) {
        return;
    }
    var updates = {$query: {_id: document._id}, $set: {}}
    var updateRequired = false;
    for (var i = 0; i < fieldValue.length; i++) {
        var arrayRecord = fieldValue[i];
        var field2Value = arrayRecord[field2];
        if ((!field2Value) || !(field2Value instanceof Date)) {
            continue;
        }
        var utcHrs = field2Value.getUTCHours();
        var utcMinutes = field2Value.getUTCMinutes();

        if (utcHrs == 0) {
            continue;
        }

        updateRequired = true;
        var newDate = getNextUTCDate(field2Value);
        updates.$set[field1 + "." + i + "." + field2] = newDate;
    }

    if (updateRequired) {
        return db.mongoUpdate({$collection: collection, $update: updates}).then(function () {
            return incLog(options.logid, "updates", db);
        })

    }


}

function incLog(logId, field, db) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    return ApplaneDB.getLogDB().then(function (logDB) {
        var inc = {};
        inc[field] = 1;
        var update = {$collection: "pl.logs", $update: {$query: {_id: logId}, $inc: inc}};
        return logDB.mongoUpdate(update);
    })
}

function getNthSundayOfMonth(date, span, day) {
    console.log("my date pre.." + date);
    var myDate = new Date(date);
    myDate.setUTCDate(1);
    myDate.setUTCHours(0);
    myDate.setUTCMinutes(0);
    myDate.setUTCSeconds(0);
    myDate.setUTCMilliseconds(0);
    console.log("my date .." + myDate.toUTCString());
    var dayOfWeek = myDate.getUTCDay();
    var interValToAdd = 0;
    console.log("day of week..." + dayOfWeek)
    console.log("day ..." + day)
    if (day == dayOfWeek) {
        interValToAdd = 0;
    } else if (day > dayOfWeek) {
        interValToAdd = (day - dayOfWeek)
    } else {
        interValToAdd = (7 - dayOfWeek) + day
    }
    console.log("interval to add.." + interValToAdd)
    myDate.setUTCDate(1 + interValToAdd);
    console.log("Univeral Date string >>>>>" + myDate.toUTCString())


}

exports.timezone = function (params, db) {
    var date = new Date();

//    getNthSundayOfMonth(date, 1, 2)

    console.log(date);

    date.setDate(4)
    date.setMonth(9)
    date.setYear(2014)
    date.setHours(0);
    date.setMinutes(0);
    date.setSeconds(0);
    date.setMilliseconds(0);

    console.log("date as 4 oct >>>" + date);


    var oct3 = new Date("2014-10-04T06:00:00")
    console.log("Oct 4 as string: " + oct3);

    var utcDate = new Date();
    utcDate.setUTCDate(4);
    utcDate.setUTCMonth(9);
    utcDate.setUTCFullYear(2014);
    utcDate.setUTCHours(0);
    utcDate.setUTCMinutes(0);
    utcDate.setUTCSeconds(0);
//    utcDate.setUTCMilliseconds(0);


    console.log("utc date .." + utcDate);
    console.log("Universal utc datenow >>>" + utcDate.toUTCString())
    console.log("JSON >>>" + JSON.stringify(utcDate))

    console.log("utc day >>>" + utcDate.getUTCDay());
    console.log("utc date>>>" + utcDate.getUTCDate());
    console.log("simple date>>>" + utcDate.getDate());


    //to find back date
    var currentdate = new Date();
    console.log("currentdate>>>>" + currentdate);
    currentdate.setUTCDate(currentdate.getUTCDate() - 1);
    currentdate.setUTCHours(0);
    currentdate.setUTCMinutes(0);
    currentdate.setUTCSeconds(0);
    currentdate.setUTCMilliseconds(0);
    console.log("Now Back date is>>>>" + currentdate);
    console.log("Universal back date now >>>" + currentdate.toUTCString())


    var univerDate = currentdate.getUTCDate();

    //


    /**
     http://stackoverflow.com/questions/6117814/get-week-of-year-in-javascript-like-in-php

     */

//    console.log("utc date JSON.."+JSON.stringify(utcDate));


    var toReturn = []
    toReturn.push(date)
    toReturn.push(oct3)
    toReturn.push(utcDate);
    return universalTimeQuery(oct3, db)

}
function universalTimeQuery(utcDate, db) {
    return db.query({$collection: "mytaskss", $filter: {date: utcDate}})
}

exports.rohitDateFilter = function (params, db) {
    var passedDate = params.date;
    var dateInstance = new Date(passedDate);
    var clintDate = db.toClientTimezone(dateInstance);
    console.log("passed date>>" + passedDate)
    console.log("passed date as newDate>>" + new Date(passedDate));
//    console.log("Client time zone>>" + db.toClientTimezone(dateInstance));
    var timeInMs = clintDate.getTime();
    var zeroHrsDate = require("moment")(clintDate).startOf("day").toDate();
//    console.log("zeroHrsDate>>>>" + zeroHrsDate);
    var zeroHrsDateInMs = zeroHrsDate.getTime();
    var diff = timeInMs - zeroHrsDate;
    var actualTime = require("moment")(dateInstance).subtract("milliseconds", diff).toDate();
//    console.log("actualTime>>>>" + actualTime);
    var actualNextDate = require("moment")(actualTime).add("days", 1).toDate();

//    var eqFilter = {date:new Date(passedDate)};
    var eqFilter = {date: passedDate};
//    return db.query({$collection:"timezones", $filter:eqFilter}).then(function (data) {
//        console.log("data after function>>>" + JSON.stringify(data));
//        return data;
//    })
//    var currentDateFilter = {date:{$function:{"Functions.CurrentDateFilter":{date:"$date"}}}}
//    return db.query({$collection:"timezones", $filter:currentDateFilter, $parameters:{date:dateInstance}}).then(function (data) {
//        console.log("data after function>>>" + JSON.stringify(data));
//        return data;
//    })

    var currentDateFilter = {date: {$gte: actualTime, $lt: actualNextDate}};
    return db.query({$collection: "holiday_calendars", $filter: {_id: "53a42ebfa1901602005934a6"}, $parameters: {date: dateInstance}}).then(function (data) {
//        console.log("data>>>>>" + JSON.stringify(data));
        var days = data.result[0].days;
        for (var i = 0; i < days.length; i++) {
            console.log(days[i].description);
            console.log(days[i].date)

        }
        return data;
    })
}

exports.removeAppLocks = function (db) {
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(function (dbToPort) {
                    var d = Q.defer();
                    dbToPort.db.collection("pl.applocks").remove({}, {w: 1, multi: true}, function (err) {
                        if (err) {
                            d.reject(err);
                            return;
                        }
                        d.resolve();
                    })
                    return d.promise;
                })
            })
        })
}

exports.portFullName = function (db, options) {
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(function (dbToPort) {
                    var d = Q.defer();
                    dbToPort.db.collection("pl.users").find({fullname: {$exists: false}, username: {$exists: true}}, {fields: {username: 1}}).toArray(function (err, result) {
                        if (err) {
                            d.reject(err);
                            return;
                        }
                        return Utils.iterateArrayWithPromise(result,
                            function (index, row) {
                                var d1 = Q.defer();
                                dbToPort.db.collection("pl.users").update({_id: row._id}, {$set: {fullname: row.username}}, {w: 1}, function (err, result) {
                                    if (err) {
                                        d1.reject(err);
                                        return;
                                    }
                                    d1.resolve();
                                })
                                return d1.promise;
                            }).then(
                            function () {
                                d.resolve();
                            }).fail(function (err) {
                                d.reject(err);
                            })
                    })
                    return d.promise;
                })
            })
        })
}

exports.getRolesWithParentRoles = function (roles, db) {
    if (!roles || !(Array.isArray(roles)) || roles.length === 0) {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
    var rolesToGet = [];
    return db.query({$collection: "pl.roles", $fields: {id: 1}, $filter: {id: {$in: roles}}}).then(
        function (result) {
            if (result.result.length === 0) {
                return;
            }
            var roleIds = [];
            for (var i = 0; i < result.result.length; i++) {
                var role = result.result[i];
                roleIds.push(role._id);
                rolesToGet.push(role.id);
            }
            return populateRolesWithParentRoles(roleIds, rolesToGet, db);
        }).then(function () {
            Utils.sort(rolesToGet);
            return rolesToGet;
        })
}

function populateRolesWithParentRoles(roleIds, rolesToGet, db) {
    var filter = {};
    filter["roles.role"] = roleIds.length === 1 ? roleIds[0] : {$in: roleIds};
    return db.query({$collection: "pl.roles", $filter: filter, $fields: {id: 1}}).then(function (result) {
        if (result.result.length === 0) {
            return;
        }
        var newRoleIds = [];
        for (var i = 0; i < result.result.length; i++) {
            var role = result.result[i];
            var roleId = role.id;
            if (roleId && rolesToGet.indexOf(roleId) === -1) {
                newRoleIds.push(role._id);
                rolesToGet.push(roleId);
            }
        }
        if (newRoleIds.length > 0) {
            return populateRolesWithParentRoles(newRoleIds, rolesToGet, db);
        }
    })
}

function getUserDb(userName, db) {
    if (!userName) {
        var d = Q.defer();
        d.resolve(db);
        return d.promise;
    }
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var dbName = db.db.databaseName;
    var dbCode = undefined;
    return ApplaneDB.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", $filter: {db: dbName}, $fields: {code: 1}})
        }).then(
        function (result) {
            dbCode = result.result[0].code;
            if (!dbCode) {
                throw new Error("Code is not defined in db [" + dbName + "]");
            }
            var userQuery = {$collection: "pl.users", $fields: {username: 1, emailid: 1}, $filter: {username: userName}, $events: false, $modules: false};
            return db.query(userQuery);
        }).then(
        function (user) {
            user = user.result[0];
            if (!user) {
                throw new Error("User [" + userName + "] does not exists.");
            }
            var url = require("ApplaneDB/Config.js").config.URL;
            return require("ApplaneDB/lib/DB.js").connectWithCode(url, dbName, dbCode, {username: user.username});
        })
}

exports.getUserPrivileges = function (params, db, options) {
    if (!params.username) {
        throw new Error("Please provide value of mandatory parameters username");
    }
    var userRoles = undefined;
    return getUserDb(params.username, db).then(
        function (dbToConnect) {
            userRoles = dbToConnect.userRoles;
            return getCollections(params.collection, db);
        }).then(function (collections) {
            var userPrivileges = {};
            if (collections && collections.length > 0) {
                for (var i = 0; i < collections.length; i++) {
                    var collectionName = collections[i].collection;
                    var collectionPrivileges = userRoles.privileges && userRoles.privileges[collectionName] ? userRoles.privileges[collectionName] : [];
                    var blankCollectionPrivileges = userRoles.privileges && userRoles.privileges[""] ? userRoles.privileges[""] : [];
                    collectionPrivileges.push.apply(collectionPrivileges, blankCollectionPrivileges);
                    userPrivileges[collectionName] = params.all ? collectionPrivileges : collectionPrivileges[0];
                }
            }
            return userPrivileges;
        })
}

function getCollections(collection, db) {
    if (collection) {
        var newCollections = [];
        if (Array.isArray(collection)) {
            for (var i = 0; i < collection.length; i++) {
                newCollections.push({collection: collection[i]});
            }
        } else {
            newCollections.push({collection: collection});
        }
        return newCollections;
    } else {
        return db.query({$collection: "pl.collections", $fields: {collection: 1}, $sort: {collection: 1}, $filter: {collection: {$exists: true}}}).then(function (collections) {
            return collections.result;
        })
    }
}

exports.removeCache = function (dbName, db) {
    if (!dbName) {
        throw new Error("Please provide value of mandatory parameters dbname");
    }
    var dbToPort = undefined;
    return db.connectUnauthorized(dbName).then(
        function (dbt) {
            dbToPort = dbt;
            var d = Q.defer();
            dbToPort.db.collection("pl.collections").find({}, {fields: {collection: 1}}).toArray(function (err, collections) {
                if (err) {
                    d.reject(err);
                    return;
                }
                if (collections.length === 0) {
                    d.resolve();
                    return;
                }
                Utils.iterateArrayWithPromise(collections,
                    function (index, collection) {
                        return require("ApplaneDB/lib/CacheService.js").clearCache(collection.collection, dbToPort);
                    }).then(
                    function () {
                        d.resolve();
                    }).fail(function (err) {
                        d.reject(err);
                    })
            });
            return d.promise;
        }).then(function () {
            var d = Q.defer();
            dbToPort.db.collection("pl.functions").find({}, {fields: {name: 1}}).toArray(function (err, functions) {
                if (err) {
                    d.reject(err);
                    return;
                }
                if (functions.length === 0) {
                    d.resolve();
                    return;
                }
                Utils.iterateArrayWithPromise(functions,
                    function (index, functionInfo) {
                        return require("ApplaneDB/lib/CacheService.js").clearFunctionCache(functionInfo.name, dbToPort);
                    }).then(
                    function () {
                        d.resolve();
                    }).fail(function (err) {
                        d.reject(err);
                    })
            });
            return d.promise;
        })
};

exports.portMainCollectionInQviews = function (db, options) {
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(function (dbToPort) {
                    var d = Q.defer();
                    dbToPort.db.collection("pl.qviews").find({mainCollection: {$exists: false}}, {fields: {collection: 1}}).toArray(function (err, qviewsResult) {
                        if (err) {
                            d.reject(err);
                            return;
                        }
                        Utils.iterateArrayWithPromise(qviewsResult,
                            function (index, qviewData) {
                                var d1 = Q.defer();
                                dbToPort.db.collection("pl.qviews").update({_id: qviewData._id}, {$set: {mainCollection: qviewData.collection}}, {w: 1}, function (err) {
                                    if (err) {
                                        d1.reject(err);
                                        return;
                                    }
                                    d1.resolve();
                                })
                                return d1.promise;
                            }).then(
                            function () {
                                d.resolve();
                            }).fail(function (err) {
                                d.reject(err);
                            })
                    })
                    return d.promise;
                })
            })
        })
}

exports.portAvailableRolesInDB = function (db) {
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(function (dbToPort) {
                    var d = Q.defer();
                    dbToPort.db.collection("pl.users").aggregate([
                        {$unwind: "$roles"},
                        {$group: {_id: "$roles.role"}}
                    ], function (err, result) {
                        if (err) {
                            d.reject(err);
                            return;
                        }
                        return Utils.iterateArrayWithPromise(result,
                            function (index, roleInfo) {
                                var d1 = Q.defer();
                                var filter = {db: dbName.db, "roleid._id": roleInfo._id._id};
                                dbToPort.db.collection("pl.availableRoles").find(filter).toArray(function (err, result) {
                                    if (err) {
                                        d1.reject(err);
                                        return;
                                    }
                                    if (result.length > 0) {
                                        d1.resolve();
                                        return;
                                    }
                                    var insert = {db: dbName.db, roleid: roleInfo._id};
                                    dbToPort.db.collection("pl.availableRoles").insert(insert, function (err, result) {
                                        if (err) {
                                            d1.reject(err);
                                            return;
                                        }
                                        d1.resolve();
                                    })
                                })
                                return d1.promise;
                            }).then(
                            function () {
                                d.resolve();
                            }).fail(function (err) {
                                d.reject(err);
                            })
                    })
                    return d.promise;
                })
            })
        })
}

exports.portPrimaryInFields = function (db) {
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(function (dbToPort) {
                    var d = Q.defer();
                    dbToPort.db.collection("pl.collections").find({}, {fields: {collection: 1}}).toArray(function (err, collections) {
                        if (err) {
                            d.reject(err);
                            return;
                        }
                        return Utils.iterateArrayWithPromise(collections,
                            function (index, collection) {
                                var collectionName = collection.collection;
                                var d1 = Q.defer();
                                dbToPort.db.collection("pl.fields").find({type: "fk", collection: collectionName}, {fields: {displayField: 1, set: 1}}).toArray(function (err, fields) {
                                    if (err) {
                                        d1.reject(err);
                                        return;
                                    }
                                    if (fields.length === 0) {
                                        d1.resolve();
                                        return;
                                    }
                                    var newFields = [];
                                    for (var i = 0; i < fields.length; i++) {
                                        var displayField = fields[i].displayField;
                                        if (displayField && newFields.indexOf(displayField) === -1) {
                                            newFields.push(displayField);
                                        }
                                        var setFields = fields[i].set;
                                        if (setFields && setFields.length > 0) {
                                            for (var j = 0; j < setFields.length; j++) {
                                                if (newFields.indexOf(setFields[j]) === -1) {
                                                    newFields.push(setFields[j]);
                                                }
                                            }
                                        }
                                    }
                                    if (newFields.length === 0) {
                                        d1.resolve();
                                        return;
                                    }
                                    dbToPort.db.collection("pl.fields").update({field: {$in: newFields}, parentfieldid: {$exists: false}, system: {$ne: true}, "collectionid.collection": collectionName}, {$set: {primary: true}}, {w: 1, multi: true}, function (err, res) {
                                        if (err) {
                                            d1.reject(err);
                                            return;
                                        }
                                        return require("ApplaneDB/lib/CacheService.js").clearCache(collectionName, dbToPort).then(
                                            function () {
                                                d1.resolve();
                                            }).fail(function (err) {
                                                d1.reject(err);
                                            })
                                    })
                                })
                                return d1.promise;
                            }).then(
                            function () {
                                var globalCollections = [
                                    {"collection": "pl.roles", fields: ["role"]},
                                    {"collection": "pl.users", fields: ["username", "emailid"]}
                                ]
                                return Utils.iterateArrayWithPromise(globalCollections, function (index, globalCollection) {
                                    var d1 = Q.defer();
                                    dbToPort.db.collection("pl.fields").update({field: {$in: globalCollection.fields}, "collectionid.collection": globalCollection.collection}, {$set: {primary: true}}, {w: 1, multi: true}, function (err, res) {
                                        if (err) {
                                            d1.reject(err);
                                            return;
                                        }
                                        return require("ApplaneDB/lib/CacheService.js").clearCache(globalCollection.collection, dbToPort).then(
                                            function () {
                                                d1.resolve();
                                            }).fail(function (err) {
                                                d1.reject(err);
                                            })
                                    })
                                    return d1.promise;
                                })
                            }).then(
                            function () {
                                d.resolve();
                            }).fail(function () {
                                d.reject(err);
                            })
                    })
                    return d.promise;
                })
            })
        })
}

exports.portAccountGroupType = function (dbName, db) {
    if (!dbName) {
        throw new Error("Please provide value of mandatory parameters [dbname/collectionName]");
    }
    return db.connectUnauthorized(dbName).then(function (dbToPort) {
        var d = Q.defer();
        dbToPort.db.collection("accounts").find({account_group_type: {$exists: false}, group_type: "Account", parent_account_id: {$exists: true}}).toArray(function (err, result) {
            if (err) {
                d.reject(err);
                return;
            }
            return Utils.iterateArrayWithPromise(result,
                function (index, account) {
                    var d1 = Q.defer();
                    dbToPort.db.collection("accounts").findOne({_id: account.parent_account_id._id}, function (err, row) {
                        if (err) {
                            d1.reject(err);
                            return;
                        }
                        if (!row || !row.account_group_type) {
                            d1.resolve();
                            return;
                        }
                        dbToPort.db.collection("accounts").update({_id: account._id}, {$set: {account_group_type: row.account_group_type}}, {w: 1}, function (err, row) {
                            if (err) {
                                d1.reject(err);
                                return;
                            }
                            d1.resolve();
                        })
                    })
                    return d1.promise;
                }).then(
                function () {
                    d.resolve();
                }).fail(function (err) {
                    d.reject(err);
                })
        })
        return d.promise;
    })
}

exports.portAccountsFromTemp = function (dbName, db) {
    if (!dbName) {
        throw new Error("Please provide value of mandatory parameters [dbname]");
    }
    return db.connectUnauthorized(dbName).then(function (dbToPort) {
        var d = Q.defer();
        dbToPort.db.collection("accounts_temp").find({match: {$exists: false}}).toArray(function (err, result) {
            if (err) {
                d.reject(err);
                return;
            }
            return Utils.iterateArrayWithPromise(result,
                function (index, account) {
                    var d1 = Q.defer();
                    account.parent_account_id = account.account_group_id;
                    account.group_type = "Account";
                    delete account.account_group_id;
                    dbToPort.db.collection("accounts").insert(account, {w: 1}, function (err, insert) {
                        if (err) {
                            d1.reject(err);
                            return;
                        }
                        d1.resolve();
                    })
                    return d1.promise;
                }).then(
                function () {
                    d.resolve();
                }).fail(function (err) {
                    d.reject(err);
                })
        })
        return d.promise;
    })
}

exports.portAccountGroupsInAccount = function (dbName, db) {
    if (!dbName) {
        throw new Error("Please provide value of mandatory parameters [dbname]");
    }
    return db.connectUnauthorized(dbName).then(function (dbToPort) {
        var d = Q.defer();
        dbToPort.db.collection("accounts").update({}, {$unset: {status: "", totalcount: ""}, $set: {group_type: "Account"}}, {w: 1, multi: true}, function (err, res) {
            if (err) {
                d.reject(err);
                return;
            }
            dbToPort.db.collection("accounts").find().toArray(function (err, result) {
                if (err) {
                    d.reject(err);
                    return;
                }
                return Utils.iterateArrayWithPromise(result,
                    function (index, account) {
                        if (account.account_group_id) {
                            var d1 = Q.defer();
                            dbToPort.db.collection("accounts").update({_id: account._id}, {$set: {parent_account_id: account.account_group_id}, $unset: {account_group_id: ""}}, {w: 1}, function (err) {
                                if (err) {
                                    d1.reject(err);
                                    return;
                                }
                                d1.resolve();
                            })
                            return d1.promise;
                        }
                    }).then(
                    function () {
                        var d1 = Q.defer();
                        dbToPort.db.collection("account_group").find().toArray(function (err, accountGroups) {
                            if (err) {
                                d1.reject(err);
                                return;
                            }
                            if (accountGroups.length === 0) {
                                d.resolve();
                                return;
                            }
                            return Utils.iterateArrayWithPromise(accountGroups,
                                function (index, accountGroup) {
                                    var d11 = Q.defer();
                                    if (accountGroup.parent_account_group_id) {
                                        accountGroup.parent_account_id = accountGroup.parent_account_group_id;
                                    }
                                    accountGroup.group_type = "Account Group";
                                    delete accountGroup.parent_account_group_id;
                                    dbToPort.db.collection("accounts").insert(accountGroup, {w: 1}, function (err, res) {
                                        if (err) {
                                            d11.reject(err);
                                            return;
                                        }
                                        d11.resolve();
                                    })
                                    return d11.promise;
                                }).then(
                                function () {
                                    d1.resolve();
                                }).fail(function (err) {
                                    d1.reject(err);
                                })
                        })
                        return d1.promise;
                    }).then(
                    function () {
                        d.resolve();
                    }).fail(function (err) {
                        d.reject(err);
                    })
            })
        })
        return d.promise;
    })
}

exports.iterator = function (parameters, originalDB, options) {
    var db = originalDB.asyncDB();
    if (!parameters.query || !parameters.function) {
        throw new Error("Please provide value of mandatory parameters [function/query]");
    }
    if (!options || options.async === undefined) {
        throw new Error("Please provide async true/false in options");
    }
    var query = parameters.query;
    if (typeof query === "string") {
        query = JSON.parse(query);
    }
    if (query.$sort) {
        throw new Error("Sort can not be defined in query.Query Defined in iterator is [" + JSON.stringify(query) + "]");       //we will manual add $sort:{_id:1}  while porting
    }
    console.log("query>>>" + JSON.stringify(query));
    query.$sort = {_id: 1};
    options = options || {};
    options.parameters = Utils.deepClone(parameters);
    var logId = undefined;
    var logdb = undefined;
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            logdb = logDB;
            return logdb.mongoUpdate({$collection: "pl.logs", $insert: {type: "Iterator", status: "In Progress", startTime: new Date(), parameters: JSON.stringify(parameters)}});
        }).then(
        function (update) {
            logId = update["pl.logs"].$insert[0]._id;
            options.logid = logId;
            return db.loadFunction(parameters.function);
        }).then(
        function (loadedFunction) {
            query.$limit = query.$limit || 1000;
            return executeFunction(loadedFunction, db, query, logdb, logId, options);
        }).then(
        function () {
            return logdb.mongoUpdate({$collection: "pl.logs", $update: [
                {$query: {_id: logId}, $set: {status: "Done", endTime: new Date()}}
            ]});
        }).fail(function (err) {
            return logdb.mongoUpdate({$collection: "pl.logs", $update: [
                {$query: {_id: logId}, $set: {status: "Error", error: JSON.stringify(Utils.getErrorInfo(err)), endTime: new Date()}}
            ]});
        })
}

function executeFunction(loadedFunction, db, query, logdb, logId, options) {
    return db.query(query).then(function (result) {
        result = result.result;
        if (result.length > 0) {
            var last_id = result[result.length - 1]._id;
            return Utils.iterateArrayWithPromise(result,
                function (index, row) {
                    try {
                        var loadedFunctionResult = db.executeLoadedFunction(loadedFunction, [row], db, options);
                        if (Q.isPromise(loadedFunctionResult)) {
                            return loadedFunctionResult.fail(function (err) {
                                return manageError(err, logId, logdb);
                            })
                        }
                    } catch (err) {
                        return manageError(err, logId, logdb);
                    }
                }).then(
                function () {
                    return  logdb.mongoUpdate({$collection: "pl.logs", $update: [
                        {$query: {_id: logId}, $inc: {count: result.length}}
                    ]})
                }).then(function () {
                    delete query.$skip;
                    query.$filter = query.$filter || {};
                    query.$filter.$and = query.$filter.$and || [];
                    query.$filter.$and.push({_id: {$gt: last_id}})
                    return executeFunction(loadedFunction, db, query, logdb, logId, options);
                });
        }
    })
}


function manageError(err, logId, db) {
    var error = undefined;
    if (err instanceof Array) {
        error = JSON.stringify(err);
    } else {
        error = JSON.stringify(Utils.getErrorInfo(err));
    }
//    return db.mongoUpdate({$collection:"pl.logs", $update:[
//        {$query:{_id:logId}, $push:{logs:{$each:[
//            {status:"Failed", error:error, log:JSON.stringify(res)}
//        ]}}}
//    ]});

//    return db.mongoUpdate({$collection:"pl.logs", $update:[
//        {$query:{_id:logId}, $push:{logs:{$each:[
//            {status:"Failed", error:error, log:JSON.stringify(res)}
//        ]}}}
//    ]});

    return db.mongoUpdate({$collection: "pl.errorlogs", $insert: [
        {date: new Date(), error: error, logId: logId}
    ]});
}

//http://127.0.0.1:5100/rest/invoke?function=Porting.iterator&parameters=[{"dbName":"z", "query":{"$collection":"z"},"function":"Porting.copyCollection"}]&token=544de7f9a6b165e20dcf51bd
exports.copyCollection = function (document, db, options) {
    var parameters = options.parameters;
    var query = parameters.query;
    var dbName = parameters.dbName;
    var collectionName = query.$collection;
    if (!dbName || !collectionName) {
        throw new Error("Please provide value of mandatory parameters [dbname/collection]");
    }

    return  db.connectUnauthorized(dbName).then(function (dbToPort) {
        var d = Q.defer();
        dbToPort.db.collection(collectionName).insert(document, function (err, res) {
            if (err) {
                if (err.code !== 11000) {
                    d.reject(err)
                    return;
                }
            }
            d.resolve();
        })
        return d.promise;
    })
}

exports.deleteVouchersAndViPending = function (parameters, db) {
    var d = Q.defer();
    db.db.collection("voucher").find({"source_type_temp": parameters.source_type_temp}, {_id: 1, source_id: 1, source_type_temp: 1}).toArray(function (err, res) {
        if (err) {
            d.reject(err);
            return;
        }
        var sourceIds = [];
        for (var i = 0; i < res.length; i++) {
            if (res[i].source_id) {
                sourceIds.push(Utils.getObjectId(res[i].source_id.toString()));
            }
        }
        if (sourceIds.length == 0) {
            d.resolve("No Source id found.");
            return;
        }
        var removeFilter = {_id: {$in: sourceIds}};


        db.db.collection("vendor_invoices").find(removeFilter, {_id: 1}).toArray(function (err, vendorInvoices) {
            if (err) {
                d.reject(err);
                return;
            }

            if (!parameters.remove) {
                d.resolve({"sourceIdsCount": sourceIds.length, removeFilter: removeFilter, vendorInvoicesCount: vendorInvoices.length, vendorInvoices: vendorInvoices, voucherLength: res.length, vouchers: res});
                return;
            }

            db.db.collection("vendor_invoices").remove(removeFilter, {w: 1, multi: true}, function (err, deletedVendorInvoices) {
                if (err) {
                    d.reject(err);
                    return;
                }
                var toReturn = ({deletedvendor_invoices: deletedVendorInvoices});
                db.db.collection("voucher").remove({"source_type_temp": parameters.source_type_temp}, {w: 1, multi: true}, function (err, deletedVouchers) {
                    if (err) {
                        d.reject(err);
                        return;
                    }
                    toReturn.deletedVouchers = deletedVouchers;
                    d.resolve(toReturn);
                })

            })

        })

    })
    return d.promise;
}

exports.deleteVouchers = function (db) {
    var d = Q.defer();
    db.db.collection("vendor_invoices").find({"invoicetype": "Salary"}, {_id: 1}).toArray(function (err, res) {
        if (err) {
            d.reject(err);
            return;
        }
        var sourceIds = [];
        for (var i = 0; i < res.length; i++) {
            sourceIds.push(res[i]._id.toString());
        }
        if (sourceIds.length == 0) {
            d.resolve("No Source id found.");
            return;
        }
        db.db.collection("voucher").remove({source_id: {$in: sourceIds}}, {w: 1, multi: true}, function (err, res) {
            if (err) {
                d.reject(err);
                return;
            }
            d.resolve({"removeFilter": JSON.stringify({source_id: {$in: sourceIds}}), deletedRecord: res});
        })
    })
    return d.promise;
}

//exports.portMongoRelationships = function (params, originalDb) {
//    var d = Q.defer();
//
//    var source = {"child":[
//        {collection:"orders__orders", filter:{}}
//    ]}
//
//
//    var childIndex = params.child;
//    var collectionName = source.child[childIndex].collection;
//    var filter = source.child[childIndex].filter;
//
//    if (params.dateFilter) {
//        for (var k in params.dateFilter) {
//            filter[k] = {"$gte":new Date(params.dateFilter[k])};
//        }
//    }
//
//    var options = {skip:0, limit:200, sort:{_id:1}}
//    var db = originalDb.asyncDB();
//    var targetDBName = params.targetDB;
//    console.log("targetDBName>>>" + targetDBName);
//    db.connectUnauthorized(targetDBName).then(function (targetDB) {
//        mongoFetchRelation(db, targetDB, "torerocorp", collectionName, filter, options).then(
//            function () {
//                console.log(">>>>>port done>>>>>")
//            }).fail(function (err) {
//                console.log("errr>>>>" + err)
//            });
//        d.resolve("Applied");
//    })
//
//    return d.promise;
//
//}
//
//exports.portMongoTasks = function (params, originalDb) {
//    var d = Q.defer();
//
//    var source = {"child":[
//        {"collection":"deliveries__orders", "relatedcolumn":"order_id._id", "alias":"dlv_port", "parentcolumn":"_id"}
//    ], "alias":"orders", "mongo":true, "database":"torerocorp"}
//    var childIndex = params.child;
//    var collectionName = source.child[childIndex].collection;
//    var field = source.child[childIndex].relatedcolumn;
//    var parentField = source.child[childIndex].parentcolumn;
//    var options = {skip:0, limit:200, sort:{_id:1}}
//    if (childIndex > 1) {
//        options.limit = 4000;
//    }
//    var db = originalDb.asyncDB();
//    var targetDBName = params.targetDB;
//    console.log("targetDBName>>>" + targetDBName);
//    db.connectUnauthorized(targetDBName).then(function (targetDB) {
//        var Config = require("ApplaneDB/Config.js").config;
//        var url = Config.URL + "/" + targetDBName + "/";
//        mongoFetch(db, targetDB, "torerocorp", collectionName, field, parentField, options, url).then(function () {
//            console.log(">>>>>port done>>>>>")
//        });
//        d.resolve("Applied");
//    })
//
//    return d.promise;
//
//}
//
//function mongoFetch(db, targetDB, database, collection, field, parentField, options, url) {
//    console.log("database>>>" + database + ">>collection>>>>" + collection)
//    console.log("field>>>" + field)
//    console.log("parentField>>>" + parentField)
//    console.log("options>>>" + JSON.stringify(options))
//    var mongoData1 = undefined;
//    return db.tempMongoQuery(database, "orders__orders", {}, options, url).then(
//        function (mongoData) {
//            console.log("local data fetch>>" + JSON.stringify(mongoData));
//            if (!mongoData || mongoData.length == 0) {
//                return;
//            }
//            mongoData1 = mongoData;
//            var relationShips = [];
//            for (var i = 0; i < mongoData.length; i++) {
//                var val = mongoData[i][parentField];
//                if (val && parentField == "_id") {
//                    relationShips.push(val);
//                } else if (val && parentField == "entity_id" && val._id) {
//                    relationShips.push(val._id);
//                }
//
//            }
//            console.log("inside relationShips >> " + JSON.stringify(relationShips));
//            if (relationShips.length > 0) {
//                var filter = {}
//                filter[field] = {$in:relationShips};
//                var removeURL = "mongodb://173.255.119.199:27017/" + database + "/";
//                console.log("filter >> " + JSON.stringify(filter));
//                return db.tempMongoQuery(database, collection, filter, {}, removeURL)
//            }
//        }).then(
//        function (data) {
//            console.log("data fetched from mongo >> " + JSON.stringify(data));
//            if (data && data.length > 0) {
//                console.log("insreting...." + data.length)
//                return targetDB.mongoUpdate({$collection:collection, $insert:data})
//            }
//        }).then(function (inserts) {
//            console.log("insreting....done...")
//            if (mongoData1) {
//                options.skip = options.skip + options.limit;
//                return mongoFetch(db, targetDB, database, collection, field, parentField, options, url)
//            }
//        })
//}

exports.portMongoRelationships = function (params, originalDb) {
    var d = Q.defer();

    var source = {"child": [
        {collection: "relationships__crm", filter: {"assign_to_id._id": {"$in": ["7d189ee25c5b65946b8abea0d73432dc", "67fc8c75047b6c6201253b4d38733da6", "0d935fb9f5790934bab8445fefe5f86f", "b62b97eafbe6c2cc690ffa6c08bae021", "7b69c1e209828c8a0ad394c5d9ce9a9b"]}}},
        {collection: "employees__hris_basic", filter: {}}
    ]}


    var childIndex = params.child;
    var collectionName = source.child[childIndex].collection;
    var filter = source.child[childIndex].filter;

    if (params.dateFilter) {
        for (var k in params.dateFilter) {
            filter[k] = {"$gte": new Date(params.dateFilter[k])};
        }
    }

    var options = {skip: 0, limit: 200, sort: {_id: 1}}
    var db = originalDb.asyncDB();
    var targetDBName = params.targetDB;
    console.log("targetDBName>>>" + targetDBName);
    db.connectUnauthorized(targetDBName).then(function (targetDB) {
        mongoFetchRelation(db, targetDB, "daffodil", collectionName, filter, options).then(
            function () {
                console.log(">>>>>port done>>>>>")
            }).fail(function (err) {
                console.log("errr>>>>" + err)
            });
        d.resolve("Applied");
    })

    return d.promise;

}

exports.portMongoTasks = function (params, originalDb) {
    var d = Q.defer();

    var source = {"child": [
        {"collection": "tasks__taskmanager", "relatedcolumn": "relationship_id._id", "alias": "tasks_port", "parentcolumn": "_id"},
        {"collection": "communications__crm", "relatedcolumn": "relationship_id._id", "alias": "communications_port", "parentcolumn": "_id"},
        {"collection": "contact_detail__busuiness_partners", "relatedcolumn": "entity_id._id", "alias": "contact_detail_port", "parentcolumn": "entity_id"},
        {"collection": "location_details__busuiness_partners", "relatedcolumn": "entity_id._id", "alias": "location_details_port", "parentcolumn": "entity_id"},
        {"collection": "entities__busuiness_partners", "relatedcolumn": "_id", "alias": "entities__busuiness_partners", "parentcolumn": "entity_id"}
    ], "alias": "relationships", "mongo": true, "database": "daffodil"}
    var childIndex = params.child;
    var collectionName = source.child[childIndex].collection;
    var field = source.child[childIndex].relatedcolumn;
    var parentField = source.child[childIndex].parentcolumn;
    var options = {skip: 0, limit: 200, sort: {_id: 1}}
    if (childIndex > 1) {
        options.limit = 4000;
    }
    var db = originalDb.asyncDB();
    var targetDBName = params.targetDB;
    console.log("targetDBName>>>" + targetDBName);
    db.connectUnauthorized(targetDBName).then(function (targetDB) {
        var Config = require("ApplaneDB/Config.js").config;
        var url = Config.URL + "/" + targetDBName + "/";
        mongoFetch(db, targetDB, "daffodil", collectionName, field, parentField, options, url).then(function () {
            console.log(">>>>>port done>>>>>")
        });
        d.resolve("Applied");
    })

    return d.promise;

}

function mongoFetch(db, targetDB, database, collection, field, parentField, options, url) {
    console.log("database>>>" + database + ">>collection>>>>" + collection)
    console.log("field>>>" + field)
    console.log("parentField>>>" + parentField)
    console.log("options>>>" + JSON.stringify(options))
    var mongoData1 = undefined;
    return db.tempMongoQuery(database, "relationships__crm", {}, options, url).then(
        function (mongoData) {
            console.log("local data fetch>>")
            if (!mongoData || mongoData.length == 0) {
                return;
            }
            mongoData1 = mongoData;
            var relationShips = [];
            for (var i = 0; i < mongoData.length; i++) {
                var val = mongoData[i][parentField];
                if (val && parentField == "_id") {
                    relationShips.push(val);
                } else if (val && parentField == "entity_id" && val._id) {
                    relationShips.push(val._id);
                }

            }
            if (relationShips.length > 0) {
                var filter = {}
                filter[field] = {$in: relationShips};
                var removeURL = "mongodb://173.255.119.199:27017/" + database + "/";
                return db.tempMongoQuery(database, collection, filter, {}, removeURL)
            }
        }).then(
        function (data) {
            console.log("data fetched from mongo")
            if (data && data.length > 0) {
                console.log("insreting...." + data.length)
                return targetDB.mongoUpdate({$collection: collection, $insert: data})
            }
        }).then(function (inserts) {
            console.log("insreting....done...")
            if (mongoData1) {
                options.skip = options.skip + options.limit;
                return mongoFetch(db, targetDB, database, collection, field, parentField, options, url)
            }
        })
}

function mongoFetchRelation(db, targetDB, database, collection, filter, options) {
    console.log("database>>>" + database + ">>collection>>>>" + collection)
    console.log("filter>>>" + JSON.stringify(filter))
    console.log("options>>>" + JSON.stringify(options))
    var removeURL = "mongodb://173.255.119.199:27017/" + database + "/";
    return db.tempMongoQuery(database, collection, filter, options, removeURL).then(
        function (data) {
            if (data && data.length > 0) {
                console.log("insreting....")
                console.log("data>>>" + JSON.stringify(data));
                return targetDB.mongoUpdate({$collection: collection, $insert: data})
            }
        }).then(function (inserts) {
            console.log("insreting....done...")
            if (inserts) {
                options.skip = options.skip + 200;
                return mongoFetchRelation(db, targetDB, database, collection, filter, options)
            }
        })
}

exports.portAccounts = function (originalDb) {
    var db = originalDb.asyncDB();
    var collections = [
        {"collection": "products", "field": "asset_account_id"},
        {"collection": "products", "field": "Exportaccount_id"},
        {"collection": "products", "field": "Domesticaccount_id"},
        {"collection": "other_deductions", "field": "account_id"},
        {"collection": "other_additions_deletion_types", "field": "GLAccount"},
        {"collection": "deductions", "field": "glaccount"},
        {"collection": "taxes", "field": "account_id"},
        {"collection": "funds", "field": "glaccount"},
        {"collection": "salary_components", "field": "deductable_account_id"},
        {"collection": "entities", "field": "gl_account_id"},
        {"collection": "entities", "field": "service_tax_account"},
        {"collection": "entities", "field": "tds_account"},
        {"collection": "entities", "field": "vat_account"},
        {"collection": "payments", "field": "debit_account"},
        {"collection": "payments", "field": "interest_account"},
        {"collection": "invoices", "field": "service_tax_account"},
        {"collection": "invoices", "field": "vat_account"},
        {"collection": "receipts__orders", "field": "interest_account"},
        {"collection": "salary_components", "field": "payable_account_id"},
        {"collection": "payments", "field": "adjust_cenvet_account"},
        {"collection": "payments", "field": "credit_account"},
        {"collection": "payments", "field": "pay_extra_account"},
        {"collection": "vendor_invoices", "field": "sales_tax_account"},
        {"collection": "vendor_invoices", "field": "service_tax_account"},
        {"collection": "vendor_invoices", "field": "tds_account"},
        {"collection": "vendor_invoices", "field": "vat_account"},
        {"collection": "invoices", "field": "other_income_account_id"},
        {"collection": "invoices", "field": "tds_account"},
        {"collection": "fund_transfer", "field": "from_fund.glaccount"},
        {"collection": "fund_transfer", "field": "from_location.accountid"},
        {"collection": "payments", "field": "income_tax_lineitems.account_id"},
        {"collection": "invoices", "field": "invoice_details.vat_account"},
        {"collection": "payments", "field": "more_deductions.account_id"},
        {"collection": "payments", "field": "payment_detail.tds_account_id"},
        {"collection": "vendor_invoices", "field": "purchase.purchase_category"},
        {"collection": "vendor_invoices", "field": "purchase.sales_tax_account"},
        {"collection": "vendor_invoices", "field": "purchase.service_tax_account"},
        {"collection": "vendor_invoices", "field": "purchase.tds_account"},
        {"collection": "vendor_invoices", "field": "purchase.vat_account"},
        {"collection": "vendor_invoices", "field": "purchase.purchase_detail.Salary_Type"},
        {"collection": "vendor_invoices", "field": "purchase.purchase_detail.account_id"},
        {"collection": "receipts__orders", "field": "recipet_detail.service_tax_account"},
        {"collection": "receipts__orders", "field": "recipet_detail.tds_account"},
        {"collection": "taxes", "field": "taxes_sub_details.taxaccounts"},
        {"collection": "fund_transfer", "field": "to_fund.glaccount"},
        {"collection": "fund_transfer", "field": "to_location.accountid"},
        {"collection": "voucher", "field": "voucher_line_item.account_id"}
    ];

    return db.mongoUpdate({$collection: "pl.logs", $insert: {type: "PortAccounts", status: "In Progress", startTime: new Date()}}).then(function () {
        db.db.collection("accounts").find({}, {sort: {_id: -1}}).toArray(function (err, result) {
            if (err) {
                console.log("er>>>>" + err);
                return;
            }
            return Utils.iterateArrayWithPromise(result,
                function (index, row) {
                    var accountId = row._id;
                    return Utils.iterateArrayWithPromise(collections,
                        function (colIndex, collection) {
                            var filter = {};
                            filter[collection.field + "._id"] = accountId;
                            var d1 = Q.defer();
                            db.db.collection(collection.collection).find(filter).count(function (err, count) {
                                if (err) {
                                    d1.reject(err);
                                    return;
                                }
                                if (count === 0) {
                                    d1.resolve();
                                    return;
                                }
                                var status = [
                                    {collection: collection.collection, field: collection.field, count: count}
                                ];
                                db.db.collection("accounts").update({_id: accountId}, {$push: {status: {$each: status}}, $inc: {totalcount: count}}, {w: 1}, function (err, res) {
                                    if (err) {
                                        d1.reject(err);
                                        return;
                                    }
                                    d1.resolve();
                                })
                            })
                            return d1.promise;
                        }).then(function () {
                            return db.mongoUpdate({$collection: "pl.logs", $update: [
                                {$query: {status: "In Progress", type: "PortAccounts"}, $set: {info: {count: index}}}
                            ]});
                        })
                }).then(
                function () {
                    return db.mongoUpdate({$collection: "pl.logs", $update: [
                        {$query: {status: "In Progress", type: "PortAccounts"}, $set: {status: "Done", endTime: new Date()}}
                    ]});
                }).fail(
                function (err) {
                    var error = undefined;
                    if (err instanceof Array) {
                        error = JSON.stringify(err);
                    } else {
                        error = JSON.stringify(Utils.getErrorInfo(err));
                    }
                    return db.mongoUpdate({$collection: "pl.logs", $update: [
                        {$query: {status: "In Progress", type: "PortAccounts"}, $set: {status: "Failed", endTime: new Date(), error: error}}
                    ]});
                }).then(function () {
                    db.clean();
                })
        })
    })
}

exports.portEntities = function (originalDb) {
    var db = originalDb.asyncDB();
    var collections = [
        {"collection": "vendor_invoices", "field": "vendor" },
        {"collection": "vendor_invoices", "field": "debit_customer_id" },
        {"collection": "receipts__orders", "field": "credit_notes.vendor" },
        {"collection": "receipts__orders", "field": "entity_id" },
        {"collection": "purchase_orders", "field": "vendor" },
        {"collection": "inventory", "field": "vendor" },
        {"collection": "vendor_invoices", "field": "purchase.vendor" },
        {"collection": "contact_detail", "field": "entity_id" },
        {"collection": "relationships", "field": "entity_id" },
        {"collection": "communications", "field": "entity_id" },
        {"collection": "location_details", "field": "entity_id" },
        {"collection": "invoices", "field": "entity_id" },
        {"collection": "orders", "field": "entity_id" },
        {"collection": "deliveries", "field": "entity_id" },
        {"collection": "payments", "field": "payment_detail.vendor_id" },
        {"collection": "payments", "field": "vendor" },
        {"collection": "payments", "field": "debit_customer_id" }
    ];

    return db.mongoUpdate({$collection: "pl.logs", $insert: {type: "PortEntities", status: "In Progress", startTime: new Date()}}).then(
        function () {
            db.db.collection("entities").find({}, {sort: {_id: -1}}).toArray(function (err, result) {
                if (err) {
                    console.log("er>>>>" + err);
                    return;
                }
                return Utils.iterateArrayWithPromise(result,
                    function (index, row) {
                        var entityid = row._id;
                        return Utils.iterateArrayWithPromise(collections,
                            function (colIndex, collection) {
                                var filter = {};
                                filter[collection.field + "._id"] = entityid;
                                var d1 = Q.defer();
                                db.db.collection(collection.collection).count(filter, function (err, count) {
                                    if (err) {
                                        d1.reject(err);
                                        return;
                                    }
                                    if (count === 0) {
                                        d1.resolve();
                                        return;
                                    }
                                    var status = [
                                        {collection: collection.collection, field: collection.field, count: count}
                                    ];
                                    db.db.collection("entities").update({_id: entityid}, {$push: {status: {$each: status}}, $inc: {totalcount: count}}, {w: 1}, function (err, res) {
                                        if (err) {
                                            d1.reject(err);
                                            return;
                                        }
                                        d1.resolve();
                                    })
                                })
                                return d1.promise;
                            }).then(function () {
                                return db.mongoUpdate({$collection: "pl.logs", $update: [
                                    {$query: {status: "In Progress", type: "PortEntities"}, $set: {info: {count: index}}}
                                ]});
                            })
                    }).then(
                    function () {
                        return db.mongoUpdate({$collection: "pl.logs", $update: [
                            {$query: {status: "In Progress", type: "PortEntities"}, $set: {status: "Done", endTime: new Date()}}
                        ]});
                    }).fail(
                    function (err) {
                        var error = undefined;
                        if (err instanceof Array) {
                            error = JSON.stringify(err);
                        } else {
                            error = JSON.stringify(Utils.getErrorInfo(err));
                        }
                        return db.mongoUpdate({$collection: "pl.logs", $update: [
                            {$query: {status: "In Progress", type: "PortEntities"}, $set: {status: "Failed", endTime: new Date(), error: error}}
                        ]});
                    }).then(function () {
                        db.clean();
                    })
            })
        })
}

exports.ensureIndexes = function (params, db, options) {
    var dbName = params.db;
    var collection = params.collection;
    if (!dbName || !collection) {
        throw new Error("Please provide value of mandatory parameters [db/collection]");
    }
    if (!Array.isArray(collection)) {
        collection = [collection];
    }
    var collectionIndexes = [];
    var errors = [];
    return Utils.iterateArrayWithPromise(collection,
        function (index, collectionName) {
            return db.query({$collection: "pl.indexes", $filter: {"collectionid.collection": collectionName}, $fields: {__txs__: 0, __history: 0}}).then(function (result) {
                collectionIndexes.push({collection: collectionName, indexes: result.result});
            });
        }).then(
        function () {
            return db.connectUnauthorized(dbName);
        }).then(
        function (dbToEnsure) {
            return Utility.applyIndexes(collectionIndexes, true, dbToEnsure, errors).then(function () {
                if (errors.length > 0) {
                    throw new Error(JSON.stringify(errors));
                }
            })
        })
}

function isDbExists(dbName, db) {
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", $filter: {db: dbName}});
        }).then(function (result) {
            if (result.result.length > 0) {
                return true;
            }
        })
}

//beta.business.applane.com/rest/invoke?function=Porting.ensureMetadataIndexesInAll&token=xxxxxx

exports.ensureMetadataIndexesInAll = function (db) {
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return Utility.applyIndexes(AppsConstants.Indexes, false, dbToPort);
                    }).fail(function (err) {
                        //no need to do anything
                    })
            })
        })
}

exports.ensureMetadataIndexes = function (dbName, db) {
    if (!dbName) {
        throw new Error("Please provide value of mandatory parameters [DB]");
    }
    return isDbExists(dbName, db).then(
        function (dbExist) {
            if (!dbExist) {
                throw new Error("Db [" + dbName + "] in which you want to ensure Indexes does not exists.");
            }
            return db.connectUnauthorized(dbName);
        }).then(
        function (dbToEnsure) {
            return Utility.applyIndexes(AppsConstants.Indexes, false, dbToEnsure);
        })


}

exports.populateLowerCaseFields = function (params, originalDb) {
    var collection = params.collection;
    var field = params.field;
    if (!collection) {
        throw new Error("Please provide value of mandatory parameters Collection/Field");
    }
    if (field.indexOf(".") >= 0) {
        throw new Error("populateLowerCaseFields is not supported for dotted fields.");
        return;
    }
    var db = originalDb.asyncDB();
    return db.query({$collection: "pl.logs", $filter: {status: "In Progress", type: "LowerCaseFields"}}).then(
        function (logs) {
            if (logs.result.length > 0) {
                throw new Error("Population in lower Fields is already in progress for collection [" + collection + "]");
                return;
            }
        }).then(
        function () {
            return db.collection(collection);
        }).then(
        function (collectionObj) {
            var fields = collectionObj.getValue("fields");
            var fieldIndex = Utils.getIndex(fields, "field", field);
            if (!fieldIndex || fieldIndex < 0) {
                throw new Error("Field[" + field + "] not found in collection [" + collection + "]");
            }
            var fieldDef = fields[fieldIndex];
            if (fieldDef.type !== "string" && fieldDef.type !== "sequence") {
                throw new Error("Repopulate Set Fields is allowed only for fk type column but type found [" + fieldDef.type + "]");
            }
        }).then(function () {
            populateLowerCaseDataInBack(collection, field, db)
        });
}

function populateLowerCaseDataInBack(collection, field, db) {
    var createdBy = db.user ? db.user.username : undefined;
    return db.mongoUpdate({$collection: "pl.logs", $insert: {type: "LowerCaseFields", status: "In Progress", info: JSON.stringify({localdb: db.db.databaseName}), startTime: new Date(), username: createdBy}})
        .then(
        function () {
            return populateLCData(collection, field, 100, 0, db);
        }).then(
        function () {
            console.log("done........");
            return db.mongoUpdate({$collection: "pl.logs", $update: [
                {$query: {status: "In Progress", type: "LowerCaseFields"}, $set: {status: "Done", endTime: new Date()}}
            ]});
        }).fail(
        function (err) {
            var error = undefined;
            if (err instanceof Array) {
                error = JSON.stringify(err);
            } else {
                error = JSON.stringify(Utils.getErrorInfo(err));
            }
            return db.mongoUpdate({$collection: "pl.logs", $update: [
                {$query: {status: "In Progress", type: "LowerCaseFields"}, $set: {status: "Failed", error: error, endTime: new Date()}}
            ]});
        }).then(function () {
            db.clean();
        })
}

function populateLCData(collection, field, limit, cursor, db) {
    console.log("populateLCData>>>>>>>" + field + ">>>>cursor>>>>" + cursor);
    var d = Q.defer();
    db.db.collection(collection).find({}, {limit: limit, skip: cursor, sort: {_id: 1}}).toArray(function (err, result) {
        if (err) {
            d.reject(err);
            return;
        }
        if (result.length === 0) {
            d.resolve();
            return;
        }
        return Utils.iterateArrayWithPromise(result,
            function (index, row) {
                if (row[field]) {
                    var valueToSet = {};
                    valueToSet[field + "_lower"] = row[field].toString().toLowerCase();
                    var update = {$collection: collection, $update: [
                        {$query: {_id: row._id}, $set: valueToSet}
                    ]}
                    return db.mongoUpdate(update);
                }
            }).then(
            function () {
                cursor = cursor + limit;
                return populateLCData(collection, field, limit, cursor, db);
            }).then(
            function () {
                d.resolve();
            }).fail(function (err) {
                d.reject(err);
            })
    })
    return d.promise;
}

exports.repopulateSetFieldsAsync = function (params, db) {
    var asyncDB = db.asyncDB();
    var options = {processName: "SetFields"};
    asyncDB.createProcess(options).then(function (process) {
        setTimeout(function () {
            asyncDB.startProcess([params], "Porting.repopulateSetFieldsInProcess", options);
        }, 100);
    })
}

exports.repopulateSetFieldsInProcess = function (params, db, options) {
    return Self.repopulateMultipleSetFields(params.data, db, options);
}

exports.repopulateMultipleSetFields = function (params, db, options) {
    var dbs = params.dbs;
    var fields = params.fields;
    if (!dbs || !fields) {
        throw new Error("Please provide value of mandatory parameters dbs/fields");
    }
    var errorDbs = [];
    return Utils.iterateArrayWithPromise(dbs,function (index, dbName) {
        return Utils.iterateArrayWithPromise(fields, function (index, field) {
            params.db = dbName;
            params.field = field;
            return Self.repopulateSetFields(params, db, options).fail(function (err) {
                errorDbs.push({db: dbName, field: field});
            })
        });
    }).then(function () {
            if (errorDbs.length > 0) {
                throw new Error("Error Found for : " + JSON.stringify(errorDbs));
            }
        })
}

exports.repopulateSetFields = function (params, db, options) {
    if (!options || !options.processid) {
        throw new Error("Repopulate set Fields must be Async.");
    }
    var collection = params.collection;
    var field = params.field;
    var dbName = params.db;
    if (!collection || !field || !dbName) {
        throw new Error("Please provide value of mandatory parameters Collection/Field/Db");
    }
    var cursor = params.cursor || 0;
    var limit = params.limit || 500;
    var filter = params.filter;
    if (filter && typeof filter === "string") {
        filter = JSON.parse(filter);
    }
    var dbToConnect = undefined;
    var collectionObj = undefined;
    var fkFieldDef = undefined;
    var firstPart = undefined;
    var detailId = Utils.getUniqueObjectId();
    options.detailId = detailId;
    var finalError = undefined;
    return db.mongoUpdate({$collection: "pl.processes", $update: {$query: {_id: options.processid}, $push: {detail: {
        $each: [
            {_id: detailId, message: JSON.stringify({db: dbName, collection: collection, field: field}), status: "In Process", processed: 0}
        ]
    }}}}).then(function () {
        return db.connectUnauthorized(dbName)
    }).then(
        function (dbc) {
            dbToConnect = dbc;
            return dbToConnect.collection(collection);
        }).then(
        function (cObj) {
            collectionObj = cObj;
            var fieldInfos = collectionObj.getValue("fieldInfos");
            var indexOf = field.indexOf(".");
            if (indexOf !== -1) {
                firstPart = field.substring(0, indexOf);
                var nextPart = field.substring(indexOf + 1);
                if (nextPart.indexOf(".") >= 0) {
                    throw new Error("RepopulateSetFields is not supported for two dotted fields.");
                }
                var firstPartDef = fieldInfos ? fieldInfos[firstPart] : undefined;
                if (!firstPartDef) {
                    throw new Error("Field[" + firstPart + "] not found in collection [" + collection + "]");
                }
                if (firstPartDef.type !== "object" && !firstPartDef.multiple) {
                    throw new Error("Repopulate Set Fields is allowed only for object type and multiple column as first part but info found [" + JSON.stringify(firstPartDef) + "]");
                }
            }
            fkFieldDef = fieldInfos ? fieldInfos[field] : undefined;
            if (!fkFieldDef) {
                throw new Error("Field[" + field + "] not found in collection [" + collection + "]");
            }
            if (fkFieldDef.type !== "fk") {
                throw new Error("Repopulate Set Fields is allowed only for fk type column but type found [" + fkFieldDef.type + "]");
            }
        }).then(
        function () {
            return repopulateData(collection, field, firstPart, fkFieldDef, cursor, limit, filter, dbToConnect, db, options)
        }).fail(function (err) {
            finalError = JSON.stringify(Utils.getErrorInfo(err));
        }).then(function () {
            return db.update({$collection: "pl.processes", $update: {_id: options.processid, $set: {detail: {$update: [
                {_id: detailId, $set: {status: finalError ? "Error in set field" : "Success in set field", error: finalError}}
            ]}}}, $events: false, $modules: false});
        }).then(function () {
            if (finalError) {
                throw new Error(finalError);
            }
        })
}

function repopulateData(collection, field, firstPart, fkFieldDef, cursor, limit, filter, db, processDb, options) {
    var query = {$collection: collection, $events: false, $modules: false, $sort: {_id: 1}, $events: false};
    if (filter) {
        query.$filter = filter;
    } else {
        query.$limit = limit;
        query.$skip = cursor;
    }
    query.$fields = {};
    query.$fields[firstPart || field] = 1;
    return db.query(query).then(function (result) {
        result = result.result;
        if (result.length === 0) {
            return;
        }
        return Utils.iterateArrayWithPromise(result,
            function (index, row) {
                var value = row[firstPart || field];
                if (value) {
                    var valueToQuery = {_id: row._id};
                    if (firstPart) {
                        return Utils.iterateArrayWithPromise(value, function (index, innerRow) {
                            var nextPart = field.substring((firstPart.length) + 1);
                            var innerRowValue = innerRow[nextPart];
                            if (innerRowValue) {
                                valueToQuery[firstPart + "._id"] = innerRow._id;
                                return updateSetFieldData(innerRowValue, collection, firstPart, field, fkFieldDef, valueToQuery, db);
                            }
                        })
                    } else {
                        return updateSetFieldData(value, collection, firstPart, field, fkFieldDef, valueToQuery, db);
                    }
                }
            }).then(
            function () {
                return processDb.update({$collection: "pl.processes", $update: {_id: options.processid, $set: {detail: {$update: [
                    {_id: options.detailId, $inc: {processed: result.length }}
                ]}}}, $events: false, $modules: false});
            }).then(
            function () {
                if (!filter) {
                    cursor = cursor + limit;
                    return repopulateData(collection, field, firstPart, fkFieldDef, cursor, limit, filter, db, processDb, options);
                }
            })
    })
}

function updateSetFieldData(fieldValue, collection, firstPart, field, fkFieldDef, valueToQuery, db) {
    return getFkValue(fieldValue, collection, field, fkFieldDef, db).then(
        function (result) {
            if (result) {
//                console.log("value is going to set >>>" + JSON.stringify(result));
                var valueToSet = {};
                valueToSet[firstPart ? (firstPart + ".$" + field.substring(firstPart.length)) : field] = result;
                var update = {$collection: collection, $update: {$query: valueToQuery, $set: valueToSet}};
                return db.mongoUpdate(update);
            }
        })
}

function getFkValue(fieldValue, collection, field, fieldDef, db) {
    if (fieldDef.multiple) {
        var newFieldValue = undefined;
        return Utils.iterateArrayWithPromise(fieldValue,
            function (index, value) {
                return db.resolveFK(collection, field, {$query: {_id: value._id}}, {$modules: {Role: 0, Child: 0}}).then(function (result) {
                    if (result) {
                        newFieldValue = newFieldValue || [];
                        newFieldValue.push(result);
                    }
                });
            }).then(function () {
                return newFieldValue;
            })
    } else {
        return db.resolveFK(collection, field, {$query: {_id: fieldValue._id}}, {$modules: {Role: 0, Child: 0}});
    }
}

exports.portAdminReferredFks = function (originalDb) {
    var db = originalDb.asyncDB();
    return db.getGlobalDB().then(
        function (globalDB) {
            if (!globalDB) {
                return;
            }
            var d = Q.defer();
            db.db.collection("pl.fields").find().toArray(function (err, fields) {
                if (err) {
                    d.reject(err);
                    return;
                }
                if (fields.length === 0) {
                    d.resolve();
                    return;
                }
                var fieldIds = [];
                for (var i = 0; i < fields.length; i++) {
                    fieldIds.push(fields[i]._id);
                }
                globalDB.db.collection("pl.referredfks").find({"referredfieldid._id": {$in: fieldIds}}).toArray(function (err, referredFks) {
                    if (err) {
                        d.reject(err);
                        return;
                    }
                    if (referredFks.length === 0) {
                        d.resolve();
                        return;
                    }
                    db.db.collection("pl.referredfks__admin").remove({}, {w: 1, multi: true}, function () {
                        if (err) {
                            d.reject(err);
                            return;
                        }
                        db.db.collection("pl.referredfks__admin").insert(referredFks, {w: 1}, function (err, res) {
                            if (err) {
                                d.reject(err);
                                return;
                            }
                            d.resolve();
                        })
                    })
                })
            })
            return d.promise;
        })
}

exports.globalData = function (collection, db) {
    var d = Q.defer();
    db.getGlobalDB().then(
        function (globalDB) {
            db.db.collection(collection).find().toArray(function (err, result) {
                if (err) {
                    d.reject(err);
                    return;
                }
                if (result.length === 0) {
                    d.resolve();
                    return;
                }
                globalDB.db.collection(collection).insert(result, {w: 1}, function (err, res) {
                    if (err) {
                        d.reject(err);
                        return;
                    }
                    db.db.collection(collection).remove({}, {w: 1, multi: true}, function (err, res) {
                        if (err) {
                            d.reject(err);
                            return;
                        }
                        globalDB.db.collection("pl.collections").update({collection: collection}, {$set: {global: true}}, {w: 1}, function (err, res) {
                            if (err) {
                                d.reject(err);
                                return;
                            }
                            db.db.collection("pl.collections").update({collection: collection}, {$set: {global: true}}, {w: 1}, function (err, res) {
                                if (err) {
                                    d.reject(err);
                                    return;
                                }
                                d.resolve();
                            })
                        })
                    })
                })
            })
        }).fail(function (err) {
            d.reject(err);
        })
    return d.promise;
}

exports.portChildQuery = function (db) {
    var d = Q.defer();
    db.db.collection("pl.fields").find({"fk": {$exists: true}}, {fields: {fk: 1, query: 1}}).toArray(function (err, fields) {
        if (err) {
            d.reject(err);
            return;
        }
        Utils.asyncIterator(fields,
            function (index, field) {
                var d1 = Q.defer();
                db.db.collection("pl.fields").update({_id: field._id}, {$set: {query: JSON.stringify({$type: "child", $query: JSON.parse(field.query), $fk: field.fk})}, $unset: {fk: ""}}, {w: 1}, function (err, res) {
                    if (err) {
                        d1.reject(err);
                        return;
                    }
                    d1.resolve();
                })
                return d1.promise;
            }).then(
            function () {
                d.resolve();
            }).fail(function (e) {
                d.reject(e);
            })
    })
    return d.promise;
}

exports.portSourceDbInMapping = function (db) {
    var d = Q.defer();
    db.db.collection("pl.gaemappings").find({}, {fields: {database: 1, source: 1}}).toArray(function (err, records) {
        if (err) {
            d.reject(err);
            return;
        }
        Utils.asyncIterator(records,
            function (index, record) {
                var d1 = Q.defer();
                var source = JSON.parse(record.source);
                source.database = record.database;
                db.db.collection("pl.gaemappings").update({_id: record._id}, {$set: {source: JSON.stringify(source)}, $unset: {database: ""}}, {w: 1}, function (err, res) {
                    if (err) {
                        d1.reject(err);
                        return;
                    }
                    d1.resolve();
                })
                return d1.promise;
            }).then(
            function () {
                d.resolve();
            }).fail(function (e) {
                d.reject(e);
            })
    })
    return d.promise;
}

exports.populateView = function (params, service) {
    var view = {};
    view.id = params.view.id
    if (params.filter) {
        view.filter = {};
        for (var k in params) {
            view.filter[k] = params[k];
        }
    }
    if (params.populateV) {
        return service[params.populateViewKey](params.view.id, params.isConfigured).then(function (configOb) {
            return configOb[params.view.vid](params.view.name, params.view.params, params.filterValue)
        }).then(function (configured) {
                view.configured = configured;
                return view;
            })
    } else if (params.pviewid) {
        return service[params.type](params.id, params.idValue).then(function (conView) {
            view.configuredView = conView;
            return view;
        });
    }
}

exports.removeSubFields = function (db) {
    return removeFields(0, db);
}

function removeFields(cursor, db) {
    var portingComplete = false;
    return getFields(cursor, 100, db).then(
        function (result) {
            if (result.result.length == 0) {
                portingComplete = true;
            }
            return Utils.iterateArrayWithPromise(result.result, function (index, field) {
                return removeFieldIfDirty(field, db);
            })
        }).then(function () {
            if (!portingComplete) {
                return removeFields(cursor + 100, db);
            }
        })
}

function removeFieldIfDirty(field, db) {
    var parentField = field.parentfieldid;
    var collection = field.collection;
    var collectionid = field.collectionid;
    var removeField = false;
    if (!collectionid) {
        var d1 = Q.defer();
        removeField = true;
        d1.resolve(true);
        return d1.promise;
    }

    return db.query({$collection: "pl.collections", $filter: {_id: field.collectionid._id}}).then(
        function (result) {
            if (result.result.length == 0) {
                removeField = true;
            }
        }).then(
        function () {
            if (!removeField) {
                if (parentField) {
                    return db.query({$collection: "pl.fields", $filter: {_id: parentField._id}}).then(function (result) {
                        if (result.result.length == 0) {
                            removeField = true;
                        }
                    })
                }
            }
        }).then(
        function () {
            if (!removeField) {
                if (collection && field.type == "fk") {
                    return db.query({$collection: "pl.collections", $filter: {collection: collection}}).then(function (result) {
                        if (result.result.length == 0) {
                            removeField = true;
                        }
                    })
                }
            }
        }).then(
        function () {
            if (removeField) {
                return db.mongoUpdate({$collection: "pl.fields", $delete: {_id: field._id}})
            }
        })
}

exports.portReferredFksInDbs = function (db) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    ApplaneDB.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", $fields: {db: 1}, $sort: {db: 1}, $modules: false, $events: false});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                dbName = dbName.db;
                var dbToConnect = undefined;
                return db.connectUnauthorized(dbName).then(
                    function (dbc) {
                        dbToConnect = dbc;
                        return require("./Porting.js").portFields(dbToConnect);
                    }).then(
                    function () {
                        if (dbName !== "business") {
                            return require("./Porting.js").portAdminReferredFks(dbToConnect);
                        }
                    }).then(
                    function () {
                        dbToConnect.clean();
                        dbToConnect = undefined;
                    })
            })
        })
}


exports.portFields = function (db) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logDB = undefined;
    var logId = undefined;
    var errorArray = [];
    var updateRequired = true;
    return ApplaneDB.getLogDB().then(
        function (ldb) {
            logDB = ldb;
            return logDB.query({$collection: "pl.logs", $filter: {db: db.db.databaseName, status: "In Progress", type: "FieldPorting"}});
        }).then(
        function (result) {
            if (result.result.length > 0) {
                updateRequired = false;
                return;
            }
            return logDB.mongoUpdate({$collection: "pl.logs", $insert: {status: "In Progress", startTime: new Date(), db: db.db.databaseName, type: "FieldPorting"}});
        }).then(
        function (update) {
            if (!updateRequired) {
                return;
            }
            logId = update["pl.logs"].$insert[0]._id;
            return doPorting(logId, logDB, 0, 100, errorArray, db);
        }).then(function () {
            if (!updateRequired) {
                return;
            }
            return logDB.mongoUpdate({$collection: "pl.logs", $update: {$query: {_id: logId}, $set: {status: errorArray.length > 0 ? "Failed" : "Done", error: errorArray}}});
        })
}

function doPorting(logId, logDB, cursor, limit, errorArray, db) {
    var portingComplete = false;
    var lengthCount = 0;
    return getFields(cursor, limit, db).then(
        function (result) {
            lengthCount = result.result.length;
            if (lengthCount == 0) {
                portingComplete = true;
                return;
            }
            return Utils.iterateArrayWithPromise(result.result, function (index, field) {
                var toUpdates = {$collection: "pl.fields", $update: {_id: field._id, $set: {type: field.type}}, $applock: false};
                return db.update(toUpdates).fail(function (err) {
                    errorArray.push({err: err.stack});
                })
            });
        }).then(
        function () {
            return logDB.mongoUpdate({$collection: "pl.logs", $update: {$query: {_id: logId}, $inc: {count: lengthCount}}});
        }).then(function () {
            cursor = cursor + limit;
            if (!portingComplete) {
                return doPorting(logId, logDB, cursor, limit, errorArray, db);
            }
        })
}

function getFields(cursor, limit, db) {
    return db.query({$collection: "pl.fields", $filter: {collectionid: {$exists: true}}, $skip: cursor, $limit: limit, $sort: {_id: -1}, $events: false});
}

exports.manageTxs = function (params, db) {
    var dbName = params.dbname;
    var serverName = params.servername;
    var pid = params.processid;
    var time = params.time;
    var status = params.status;
    var adminDB = undefined;
    var dbIns = undefined;
    var result = [];
    var DBNAME = undefined;
    if (params.rollback && params.asGroup) {
        throw new Error("rollback and asGroup are not supported at the same time.");
    }
    return db.getAdminDB().then(function (adminDb1) {
        adminDB = adminDb1;
        var query = {};
        query.$collection = "pl.dbs";
        if (dbName) {
            query.$filter = {"db": dbName};
        }
        return adminDB.query(query).then(function (dbs) {
            return Utils.iterateArrayWithPromise(dbs.result,
                function (index, row) {
                    var obj = {};
                    obj.db = row.db;
                    DBNAME = row.db;
                    return db.connectUnauthorized(row.db, true).then(
                        function (dbInstance) {
                            dbIns = dbInstance;
                            var query = prepareQuery(serverName, time, status, pid, params.asGroup);
                            return dbIns.query(query);
                        }).then(function (data) {
                            if (params.asGroup) {
                                if (data.result && data.result.length > 0) {
                                    obj.data = data.result;
                                    result.push(obj);
                                }
                            } else if (params.get) {
                                var count = data && data.result ? data.result.length : 0;
                                obj.count = count;
                                if (count > 0) {
                                    result.push(obj);
                                }
                            } else if (params.rollback) {
                                if (data && data.result && data.result.length > 0) {
                                    return sendMail(data, "Transactions", DBNAME).then(function () {
                                        return rollback(dbIns, data, DBNAME);
                                    });
                                }
                            } else if (params.commit) {
                                if (data && data.result && data.result.length > 0) {
                                    return commit(dbIns, data, DBNAME);
                                }
                            } else {
                                throw new Error("Neither get nor rollback specified");
                            }
                        });
                }).then(function () {
                    return result;
                });
        });
    });
};

function commit(db, data, DBNAME) {
    var TransactionModule = require("ApplaneDB/lib/modules/TransactionModule.js");
    return Utils.iterateArrayWithPromise(data.result,
        function (index, row) {
            db.setTxid(row.txid);
            return TransactionModule.handleCommit(db);
        });
}

function rollback(db, data, DBNAME) {
    var errors = [];
    var TransactionModule = require("ApplaneDB/lib/modules/TransactionModule.js");
    return Utils.iterateArrayWithPromise(data.result,
        function (index, row) {
            db.setTxid(row.txid);
            var d = require("q").defer();
            TransactionModule.handleRollback(db, 0).then(
                function () {
                    d.resolve();
                }).fail(function (err) {
                    var errDetail = {};
                    errDetail.message = err.message;
                    errDetail.stack = err.stack;
                    errors.push(errDetail);
                    errors.push(errDetail);
                    d.resolve();
                });
            return d.promise;
        }).then(function () {
            if (errors.length > 0) {
                return sendMail(errors, "error", DBNAME);
            }
        });
}

function sendMail(data, label, DBNAME) {
    var Config = require("ApplaneDB/Config.js").config;
    if (Config.MailCredentials && Config.MailCredentials.SEND_ERROR_MAIL) {
        var options = {to: "rohit.bansal@daffodilsw.com", from: "developer@daffodilsw.com", subject: "Going to Rollback Transactions for " + DBNAME + " on " + new Date()};
        var html = '';
        html += "<b>" + label + " :  </b>" + JSON.stringify(data) + "<br>";
        html += "<b>Database  :  </b>" + DBNAME + "<br>";
        html += "<b>DATE :  </b>" + new Date() + "<br>";
        options.html = html;
        return require("ApplaneDB/lib/MailService.js").sendFromAdmin(options);
    } else {
        var d = require("q").defer();
        d.resolve();
        return d.promise;
    }
}

function prepareQuery(serverName, time, status, pid, asGroup) {
    var query = {};
    query.$collection = "pl.txs";
    var filter = {};
    if (serverName) {
        filter.serverName = serverName;
    }
    if (time) {
        var Moment = require("moment");
        filter.lastmodifiedtime = {$lt: Moment().subtract("minutes", time).toDate()};
    }
    if (status) {
        filter.status = status;
    } else {
        filter.status = {"$in": ["rollback", "pending"]}
    }
    if (pid) {
        filter.processid = pid;
    }
    query.$filter = filter;
    if (asGroup) {
        query.$group = {_id: {"serverName": "$serverName", "status": "$status"}, count: {$sum: 1}, minTime: {$min: "$lastmodifiedtime"}, maxTime: {$max: "$lastmodifiedtime"}};
    }
    return query;
}

exports.portMandatory = function (db) {
    var dbIns = undefined;
    return db.getAdminDB().then(
        function (adminDB) {
            return adminDB.query({"$collection": "pl.dbs"});
        }).then(function (dbs) {
            return Utils.iterateArrayWithPromise(dbs.result, function (index, row) {
                return db.connectUnauthorized(row.db).then(function (dbInstance) {
                    dbIns = dbInstance;
                    var d = Q.defer();
                    dbIns.db.collection("pl.fields").find({type: {$in: ["currency", "duration", "unit"]}}, {fields: {_id: 1}}).toArray(function (err, res) {
                        if (err) {
                            d.reject(err);
                            return;
                        }
                        if (res.length === 0) {
                            d.resolve();
                            return;
                        }
                        var ids = [];
                        for (var i = 0; i < res.length; i++) {
                            ids.push(res[i]._id);
                        }
                        dbIns.db.collection("pl.fields").update({"parentfieldid._id": {$in: ids}}, {$set: {mandatory: true}}, {w: 1, multi: true}, function (err, result) {
                            if (err) {
                                d.reject(err);
                                return;
                            }
                            d.resolve(result);
                        })
                    })
                    return d.promise;
                });
            });
        });
}

exports.importExcelData = function (params, db, options) {
    if (!options.processid) {
        throw new Error("Async must be true in import Data.");
    }
    var file = params.file;
    if (!file) {
        throw new Error("Kindly upload file to import.");
    }
    var fileKey = params.file.key;
    var mappings = params.mappings;
    if (!mappings) {
        throw new Error("Mappings in mandatory in parameters.");
    }
    if (!params.collection) {
        throw new Error("Collection is mandatory in parameters.");
    }
    if (params.txEnabled === undefined) {
        options.txEnabled = params.txEnabled;
    }
    options.successLogs = false;
    var parameters = [
        {fileKey: fileKey, mapping: mappings, collection: params.collection, fields: params.fields, mappingType: params.mappingType}
    ];
    return db.invokeFunction("ImportExcelService.portNewExcelData", parameters).then(
        function (result) {
            if (result && result.length > 5000) {
                throw new Error("Number of records in excel file exceeded 5000.");
            }
            options.params = params;
            return db.startProcess(result, "Porting.handleExcelDataPort", options);
        })
};

exports.importData = function (params, db, options) {
    if (!options.processid) {
        throw new Error("Async must be true in import Data.");
    }
    var file = params.file;
    if (!file) {
        throw new Error("Kindly upload file to import.");
    }
    var fileKey = params.file.key;
    var moduleName = params.module;
    var mappings = params.mappings;
    if (!mappings) {
        throw new Error("Mappings in mandatory in parameters.");
    }
    if (!params.jobName && !params.collection) {
        throw new Error("Either JobName or Collection is mandatory in parameters if jobName is not defined.");
    }
    if (params.txEnabled === undefined) {
        options.txEnabled = params.txEnabled;
    }
    options.successLogs = false;

    var parameters = [
        {fileKey: fileKey, mapping: mappings, moduleName: moduleName}
    ];
    return db.invokeFunction("ImportExcelService.portExcelData", parameters).then(
        function (result) {
            if (result && result.length > 5000) {
                throw new Error("Number of records in excel file exceeded 5000.");
            }
            options.params = params;
            return db.startProcess(result, "Porting.handleExcelDataPort", options);
        })
};

exports.handleExcelDataPort = function (parameters, db, options) {
    var row = parameters.data;
    var params = options.params;
    options.process = parameters.process;
    if (params.jobName) {
        return db.invokeFunction(params.jobName, [row], options);
    } else {
        return resolveOperation(row, params, db);
    }
}

function resolveOperation(result, params, db) {
    var collection = params.collection;
    var upsertFields = params.upsertFields;
    if (!upsertFields || upsertFields.length === 0) {
        return db.update({$collection: collection, $insert: result});
    } else {
        var upsertQuery = {};
        for (var i = 0; i < upsertFields.length; i++) {
            var upsertField = upsertFields[i];
            upsertQuery[upsertField] = result[upsertField];
            delete result[upsertField];
        }
        return db.update({$collection: collection, $upsert: {$query: upsertQuery, $set: result}});
    }
}

exports.reloadServer = function (param, db, options) {
    var name = param.name;
    if (!name) {
        throw new Error("Please provide value of mandatory parameter name.");
    }
    if (!param.module) {
        var indexOf = name.lastIndexOf(".js");
        if (indexOf === -1 || indexOf !== (name.length - 3)) {
            throw new Error("Name must ends with .js if module is not defined in parameters.");
        }
    }
    var indexOfConfig = name.lastIndexOf("Config.js");
    if (indexOfConfig > 0 && indexOfConfig === name.length - 9) {
        throw new Error("Cache of config cannot be cleared.");
    }
    var keys = [];
    if (param.module) {
        var requireJS = require("requirejs");
        var modules = requireJS.s.contexts._.defined;
        for (var key in modules) {
            if (key.indexOf(name) !== -1 && key.indexOf(param.module) !== -1) {
                keys.push(key);
                requireJS.undef(key);
            }
        }
    } else {
        var cache = require.cache;
        for (var key in cache) {
            if (key.indexOf(name) !== -1) {
                keys.push(key);
                delete cache[key];
            }
        }
    }
    return keys;
}


function populateMappingofSetFields(field, setFields, db) {
    var setFieldProperties = {};
    return getFieldsInfo(db, field.collection).then(
        function (referredFields) {
            if (referredFields && referredFields.result && referredFields.result.length > 0) {
                referredFields = referredFields.result;
                return Utils.iterateArrayWithPromise(setFields, function (index11, setfield) {
                    var index = Utils.isExists(referredFields, {"field": setfield}, "field");
                    if (index !== undefined) {
                        var fieldInfo = referredFields[index];
                        return populateMappingInner(fieldInfo, setFieldProperties, db);
                    }
                });
            }
        }).then(function () {
            return setFieldProperties;
        });
}

function populateMappingInner(field, properties, db) {
    if (field.type === "string") {
        properties[field.field] = {"type": "string", index: "not_analyzed"};
    } else if (field.type === "fk") {
        var setFields = field.set;
        if (setFields) {
            return populateMappingofSetFields(field, setFields, db).then(function (setFieldProperties) {
                properties[field.field] = {properties: setFieldProperties};
            });
        }
    } else if (field.type === "object" && field.multiple) {
        return populateMapping(field.fields, db).then(function (nestedProperties) {
            properties[field.field] = {"type": "nested", properties: nestedProperties};
        });
    } else if (field.type == "object") {
        return populateMapping(field.fields, db).then(function (nestedProperties) {
            if (Object.keys(nestedProperties).length > 0) {
                properties[field.field] = {"type": "object", properties: nestedProperties};
            }
        });
    }
}

function populateMapping(fields, db) {
    var properties = {};
    var length = fields ? fields.length : 0;
    return Utils.iterateArrayWithPromise(fields,
        function (index, field) {
            return populateMappingInner(field, properties, db);
        }).then(function () {
            return properties;
        });
}


function getFieldsInfo(db, collectionName) {
    return db.query({$collection: "pl.fields", $filter: {"collectionid.collection": collectionName, "parentfieldid": null}, "$recursion": {"parentfieldid": "_id", "$alias": "fields"}});
}


//127.0.0.1:5100/rest/invoke?function=Porting.portMappingInElasticSearch&parameters=[{"index":"daffodilsw","collection":"employees","url":"127.0.0.1:9200"}]&token=54d44428f1d02f6009132348
exports.portMappingInElasticSearch = function (params, db, options) {
    var ElasticSearchDB = require("ApplaneDB/lib/ElasticSearchDB.js");
    var edb = ElasticSearchDB.getEDB(params.url);
    var collectionName = params.collection;
    var index = params.index;
    var dbToPort = undefined;
    var body = {};
    return db.connectUnauthorized(index).then(
        function (dbToPort1) {
            dbToPort = dbToPort1;
            return getFieldsInfo(dbToPort, collectionName);
        }).then(
        function (result) {
            if (result && result.result && result.result.length > 0) {
                var fields = result.result;
                try {
                    return populateMapping(fields, dbToPort);
                } catch (e) {
                    console.log("Error in mapping.." + e.stack);
                }
            }
        }).then(function (properties) {
            body[collectionName] = {"properties": properties};
            if (collectionName === "relationships" && (properties.last_interaction)) {
                properties.last_interaction = {type: "string", index: "no"}
            } else if (collectionName === "relationships" && (properties.tags)) {
                properties.tags = {type: "string", index: "no"}
            } else if (collectionName === "communications" && (properties.description)) {
                properties.description = {type: "string", index: "no"}
            } else if (collectionName === "tasks" && (properties.description)) {
                properties.description = {type: "string", index: "no"}
            }
            if (collectionName === "entities" && (properties.last_interaction)) {
                properties.last_interaction = {type: "string", index: "no"}
            }
            else if (collectionName === "voucher" && (properties.voucher_no)) {
                properties.voucher_no = {type: "string", index: "no"}
            }
//            console.log("properties>>>>" + JSON.stringify(properties));
            return edb.putMapping({index: index, type: collectionName, body: body}).catch(function (err) {
                console.log("err in mapping after giving to edb..." + err)
            });
        }
    )
        ;
}


//127.0.0.1:5100/rest/invoke?function=Porting.iterator&parameters=[{"query":{"$collection":"employees"},"function":"Porting.portDataInElasticSearch"}]&options={"async":true,"index":"daffodilsw"}&token=54d44428f1d02f6009132348
exports.portDataInElasticSearch = function (doc, db, options) {
    var ElasticSearchDB = require("ApplaneDB/lib/ElasticSearchDB.js");
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var edb = ElasticSearchDB.getEDB(options.parameters.url);
//    var edb = new ElasticSearchDB("192.168.100.137:9200");
    var _id = doc._id.toString();
    var index = options.index || db.db.databaseName;
    var type = options.type || options.parameters.query.$collection;
    delete doc._id;
    if (doc.__txs__) {
        delete doc.__txs__;
    }
    if (type === "voucher" && doc.source_type) {
        if (Utils.isJSONObject(doc.source_type)) {
            doc.source_type = JSON.stringify(doc.source_type);
        }
    }
    if (type === "voucher" && doc.voucher_no) {
        if (Utils.isJSONObject(doc.voucher_no)) {
            doc.voucher_no = JSON.stringify(doc.voucher_no);
        }
    }
    if (type === "voucher" && doc.__history) {
        if (Utils.isJSONObject(doc.__history)) {
            doc.__history = JSON.stringify(doc.__history);
        }
    }
    if (type === "pl.historylogs" && doc.source_type) {
        if (Utils.isJSONObject(doc.source_type)) {
            doc.source_type = JSON.stringify(doc.source_type);
        }
    }
    if (type === "employee_daily_attendance" && doc.leave_type_id && doc.leave_type_id === "") {
        doc.leave_type_id = null;
    }
    var logDb = undefined;
    return ApplaneDB.getLogDB().then(function (logdb) {
        logDb = logdb;
        return edb.index({
            index: index,
            type: type,
            id: _id, //during insert it is necessary to write id instead of _id , _id will not be consider and elastic search automatic generate id(but in print we will get _id instead of id)
            body: doc
        }).catch(function (err) {
                console.log("err......" + JSON.stringify(err))
                return logDb.update({$collection: "elasticlogsError", $insert: [
                    {"index": options.index || db.db.databaseName, "type": type, err: err.message, dataid: _id}
                ]});
            });
    })
}


exports.mergeFkDataInProcess = function (result, db, options) {
    var parameters = result.data;
    if (!parameters.collection) {
        throw new Error("Please provide value of mandatory parameters collection in parameters.");
    }
    if (!parameters._id) {
        throw new Error("Please provide value of mandatory parameters _id");
    }
    if (!parameters.target) {
        throw new Error("Please provide value of mandatory parameters target");
    }
    var process = result.process;
    var collectionName = parameters.collection;
    var sourceid = parameters._id;
    var targetid = parameters.target;
    if (Utils.isJSONObject(targetid)) {
        targetid = targetid._id;
    }
    var deleteTarget = parameters.delete;
    var username = db.user ? db.user.username : undefined;
    var targetFieldValues = undefined;
    var logId = undefined;
    var finalStatus = {};
    var logDb = undefined;
    var DBConstants = require("ApplaneDB/lib/Constants.js");
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    return ApplaneDB.getLogDB().then(
        function (ldb) {
            logDb = ldb;
            return logDb.query({$collection: "pl.logs", $filter: {type: "MergeRecord", status: "In Progress"}});
        }).then(
        function (result) {
            if (result.result.length > 0) {
                throw new Error("Merging is already in process.Please try after sometime.");
            }
            return db.query({$collection: collectionName, $filter: {_id: sourceid}});
        }).then(
        function (sourceInfo) {
            var info = {source: sourceInfo.result[0], target: parameters.target};
            if (process) {
                process.message = JSON.stringify(info);
            }
            return logDb.mongoUpdate({$collection: "pl.logs", $insert: {type: "MergeRecord", status: "In Progress", db: db.db.databaseName, info: JSON.stringify(info), startTime: new Date(), username: username}});
        }).then(
        function (update) {
            logId = update["pl.logs"].$insert[0]._id;
            return db.query({$collection: collectionName, $filter: {_id: targetid}});
        }).then(
        function (data) {
            if (data.result.length === 0) {
                throw new Error(" Record not found for given targetid : " + targetid.toString() + " in collection : " + collectionName);
            }
            targetFieldValues = data.result[0];
            return db.query({$collection: "pl.referredfks", $filter: {"referredcollectionid.collection": collectionName}, $fields: {collectionid: 1, field: 1, set: 1}});
        }).then(
        function (referredFks) {
            referredFks = referredFks.result;
            return Utils.iterateArrayWithPromise(referredFks,
                function (index, referredFk) {
                    var referredFkSet = referredFk[DBConstants.Admin.ReferredFks.SET] || [];
                    referredFkSet.splice(0, 0, "_id");
                    var valueToSet = {};
                    var valueToUnset = {};
                    var referredField = referredFk[DBConstants.Admin.ReferredFks.FIELD];
                    for (var i = 0; i < referredFkSet.length; i++) {
                        var resolvedValues = Utils.resolveValue(targetFieldValues, referredFkSet[i]);
                        if (resolvedValues === null) {
                            valueToUnset[referredField + "." + referredFkSet[i]] = "";
                        } else {
                            valueToSet[referredField + "." + referredFkSet[i]] = resolvedValues;
                        }
                    }
                    if (Object.keys(valueToSet).length > 0 || Object.keys(valueToUnset).length > 0) {
                        var query = {};
                        query[referredField.replace(/\.\$/g, "") + "._id"] = Utils.getObjectId(sourceid);
                        var update = {};
                        update[DBConstants.Update.Update.QUERY] = query;
                        if (Object.keys(valueToSet).length > 0) {
                            update[DBConstants.Update.Update.SET] = valueToSet;
                        }
                        if (Object.keys(valueToUnset).length > 0) {
                            update[DBConstants.Update.Update.UNSET] = valueToUnset;
                        }
                        var updateQuery = {};
                        updateQuery[DBConstants.Query.COLLECTION] = referredFk[DBConstants.Admin.ReferredFks.COLLECTION_ID][DBConstants.Admin.Collections.COLLECTION];
                        updateQuery[DBConstants.Update.UPDATE] = [update];
                        return db.mongoUpdate(updateQuery, {w: 1, multi: true}).fail(function (err) {
                            finalStatus.status = "Failed";
                            var errorUpdate = {_id: Utils.getUniqueObjectId(), status: "Failed", error: JSON.stringify(Utils.getErrorInfo(err)), log: JSON.stringify(updateQuery)};
                            return logDb.mongoUpdate({$collection: "pl.logs", $update: [
                                {$query: {_id: logId}, $push: {logs: {$each: [errorUpdate]}}}
                            ]}).then(function () {
                                    if (options && options.processid) {
                                        return db.mongoUpdate({$collection: "pl.processes", $update: {$query: {_id: options.processid}, $push: {detail: {
                                            $each: [errorUpdate]
                                        }}}});
                                    }
                                })
                        });
                    }
                })
        }).then(
        function () {
            if (finalStatus.status && finalStatus.status === "Failed") {
                throw new Error("Failed in Some Records having logId [" + logId.toString() + "]");
            }
        }).then(
        function () {
            if (deleteTarget) {
                return db.update({$collection: collectionName, $delete: [
                    {_id: sourceid}
                ]});
            }
        }).then(
        function () {
            var finalUpdate = {$collection: "pl.logs", $update: [
                {$query: {_id: logId}, $set: {status: "Done", endTime: new Date()}}
            ]};
            return logDb.mongoUpdate(finalUpdate);
        })
        .fail(
        function (err) {
            return logDb.mongoUpdate({$collection: "pl.logs", $update: [
                {$query: {_id: logId}, $set: {status: "Failed", endTime: new Date(), error: JSON.stringify(Utils.getErrorInfo(err))}}
            ]}).then(function () {
                    throw err;
                })
        })
};

exports.mergeFkData = function (parameters, db, options) {
    if (!options.processid) {
        throw new Error("Async must be true in mergeFkData.");
    }
    return db.startProcess([parameters], "Porting.mergeFkDataInProcess", options);
};

exports.getModuleSequence = function (db, options) {
    var ModuleManager = require("ApplaneDB/lib/ModuleManager.js");
    return ModuleManager.getSequence("query");
}

exports.portUserSortingData = function (params, db, options) {
    var parameters = options.parameters;
    var field = parameters.field;
    var updates = {};
    updates.$collection = parameters.collection;
    var update = {};
    update.$query = {_id: params._id};
    var toSet = {};
    toSet[field] = new Date().getTime();
    update.$set = toSet;
    updates.$update = update;
    return db.mongoUpdate(updates);
}

exports.sendNotification = function (params, db) {
    var notificationId = params.id;
    var dbs = params.dbs || [db.db.databaseName];
    if (!notificationId) {
        throw new Error("Please provide value of mandatory parameters [id]");
    }
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var adminDB = undefined;
    return ApplaneDB.getAdminDB().then(
        function (adb) {
            adminDB = adb;
            return adminDB.query({$collection: "pl.notifications", $filter: {id: notificationId}});
        }).then(function (data) {
            data = data.result;
            if (data.length == 0) {
                throw new Error("Notification for id [" + notificationId + "]does not exists.");
            }
            var notification = data[0];
            notification.skipMail = params.skipMail !== undefined ? params.skipMail : true;
            if (params.username) {
                notification.username = params.username;
            }
            if (params.mailTo) {
                notification.mailTo = params.mailTo;
            }
            notification.skipUpdateWhen = params.skipUpdateWhen !== undefined ? params.skipUpdateWhen : true;
            require("ApplaneDB/lib/Notifications.js").executeNotification(notification, dbs, adminDB).then(
                function () {
                    console.log("Done..");
                }).fail(function (err) {
                    console.log("Error.." + err.stack);
                })
        })
}

exports.maintainEmailTrackerLogs = function (params, db) {
    return require("ApplaneDB/lib/DB").getLogDB().then(function (logDB) {
        return logDB.update({$collection: "emailSync", $insert: [params.mail]})
    })
}

exports.syncMails = function (params, db) {
    return require("ApplaneDB/lib/DB").getLogDB().then(function (logDB) {
        return logDB.update({$collection: "gmailSync", $insert: [params.mail]})
    })
};

exports.portRolesinAllDb = function (db) {
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(function (dbToPort) {
                    return require("./Porting").portRoles(dbToPort);
                })
            })
        })
}

exports.portRoles = function (db) {
    return db.query({$collection: "pl.roles", $events: false, $modules: false}).then(
        function (data) {
            var roles = data.result;
            if (!roles) {
                return;
            }
            return Utils.iterateArrayWithPromise(roles, function (index, role) {
                return ensurePrivileges(role, db);
            })
        })
}

function ensurePrivileges(role, db) {
    var privilegeUpdates = [];
    if (role.privileges && role.privileges.length > 0) {
        for (var j = 0; j < role.privileges.length; j++) {
            var privilege = role.privileges[j];
            var resource = JSON.parse(privilege.resource);
            var collection = resource.collection;
            var update = {_id: privilege._id};
            update.$set = {collection: collection};

            populateResourceFromPrivilege(resource, update);

            if (privilege.views != undefined) {
                populateViewsFromPrivilege(privilege, update);
            }
            if (privilege.actions != undefined) {
                populateActionsFromPrivilege(privilege, update);
            }

            privilegeUpdates.push(update);
        }
        var roleUpdates = {$collection: "pl.roles", $update: {"_id": role._id, $set: {privileges: {$update: privilegeUpdates}}}, $events: false, $modules: false};
        return db.update(roleUpdates);
    } else {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
}

function insertFilter(filter, actionToInsert) {
    actionToInsert.filterUI = "json";
    actionToInsert.filterJSON = JSON.stringify(filter);
}


function populateActionsFromPrivilege(privilege, update) {
    var actions = JSON.parse(privilege.actions);
    var operationInfos = [];
    var sequence = 0;
    for (var i = 0; i < actions.length; i++) {
        var action = actions[i];
        if (Utils.isJSONObject(action)) {
            var key = Object.keys(action)[0];
            if (!key) {
                continue;
            }
            var value = action[key];
            if (Array.isArray(value)) {
                for (var j = 0; j < value.length; j++) {
                    sequence = populateOperationInfo(operationInfos, key, value[j], sequence);
                }
            } else if (Utils.isJSONObject(value)) {
                sequence = populateOperationInfo(operationInfos, key, value, sequence);
            }

        } else {
            sequence = sequence + 1;
            operationInfos.push({type: action, sequence: sequence});
        }
    }
    update.$set.operationInfos = operationInfos;
}

function populateOperationInfo(operationInfos, key, value, sequence) {
    var actionToInsert = {};
    actionToInsert.type = key;
    sequence = sequence + 1;
    actionToInsert.sequence = sequence;
    if (key === "find" && value.primaryFields !== undefined) {
        actionToInsert.primaryFields = value.primaryFields ? true : false;
    }
    if (value.fields != undefined) {
        insertFields(value.fields, actionToInsert);
    }

    if (value.filter != undefined) {
        insertFilter(value.filter, actionToInsert);
    }
    operationInfos.push(actionToInsert);
    return sequence;
}

function populateViewsFromPrivilege(privilege, update) {
    var views = JSON.parse(privilege.views);
    var toInclude = Utils.isInclude(views);
    if (toInclude) {
        update.$set.viewsAvailability = "Include";
    } else {
        update.$set.viewsAvailability = "Exclude";
    }
    var viewInfos = [];
    for (var view in views) {
        var viewToInsert = {view: view};
        viewInfos.push(viewToInsert);
    }
    update.$set.viewInfos = viewInfos;
}

function insertFields(fields, actionToInsert) {
    var toInclude = Utils.isInclude(fields);
    if (toInclude) {
        actionToInsert.fieldsAvailability = "Include";
    } else {
        actionToInsert.fieldsAvailability = "Exclude";
    }
    var fieldInfos = [];
    for (var field in fields) {
        var fieldToInsert = {field: field};
        fieldInfos.push(fieldToInsert);
    }
    actionToInsert.fieldInfos = fieldInfos;

}

function populateResourceFromPrivilege(resource, update) {
    if (resource.fields != undefined) {
        var fieldsToSet = {};
        insertFields(resource.fields, fieldsToSet);
        for (var k in fieldsToSet) {
            update.$set[k] = fieldsToSet[k];
        }
    }
    if (resource.actions != undefined) {
        var actions = resource.actions;
        var actionInfos = [];
        for (var action in actions) {
            if (actions[action] === 1) {
                update.$set.actionsAvailability = "Include";
                break;
            } else {
                update.$set.actionsAvailability = "Exclude";
                break;
            }
        }
        for (var action in actions) {
            var actionToInsert = {action: action};
            if (Utils.isJSONObject(actions[action])) {
                actionToInsert.filterJSON = JSON.stringify(actions[action]);
            }
            actionInfos.push(actionToInsert);
        }
        update.$set.actionInfos = actionInfos;
    }

    if (resource.filter != undefined) {
        var filterValue = {};
        insertFilter(resource.filter, filterValue);
        for (var k in filterValue) {
            update.$set[k] = filterValue[k];
        }
    }
}


exports.portActions = function (db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logId = undefined;
    var logdb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            logdb = logDB;
            return logdb.mongoUpdate({$collection: "pl.logs", $insert: {type: "Action Parameters Porting", status: "In Progress", startTime: new Date()}});
        }).then(
        function (update) {
            logId = update["pl.logs"].$insert[0]._id;
            options.logid = logId;
            return db.getAdminDB();
        }).then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.actions", $events: false, $modules: false}).then(
                            function (data) {
                                var actions = data.result;
                                if (!actions) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(actions, function (index, action) {
                                    if (action.filter || action.parameters) {
                                        var update = {};
                                        if (Utils.isJSONObject(action.filter)) {
                                            update.filter = JSON.stringify(action.filter);
                                        }
                                        if (Utils.isJSONObject(action.parameters)) {
                                            update.parameters = JSON.stringify(action.parameters);
                                        }
                                        if (Object.keys(update).length > 0) {
                                            console.log("going to update>>>" + JSON.stringify({$collection: "pl.actions", $update: {$query: {_id: action._id}, $set: update}}));
                                            return dbToPort.mongoUpdate({$collection: "pl.actions", $update: {$query: {_id: action._id}, $set: update}});
                                        }
                                    }
                                })
                            })
                    }).then(
                    function () {
                        return logdb.mongoUpdate({$collection: "pl.logs", $update: [
                            {$query: {_id: logId}, $set: {status: "Done"}, $push: {"ported": {db: dbName.db}}}
                        ]});
                    }).fail(function (err) {
                        return logdb.mongoUpdate({$collection: "pl.logs", $update: [
                            {$query: {_id: logId}, $set: {status: "Error"}, $push: {"errors": {db: dbName.db, error: JSON.stringify(Utils.getErrorInfo(err))}}}
                        ]});
                    })
            })
        })
}

exports.portCollectionsEvents = function (db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logId = undefined;
    var logdb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            logdb = logDB;
            return logdb.mongoUpdate({$collection: "pl.logs", $insert: {type: "Collection Events Porting", status: "In Progress", startTime: new Date()}});
        }).then(
        function (update) {
            logId = update["pl.logs"].$insert[0]._id;
            options.logid = logId;
            return db.getAdminDB();
        }).then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                console.log("dbName.db>>" + dbName.db);
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.collections", $filter: {events: {$exists: true}}, $events: false, $modules: false}).then(
                            function (data) {
                                var collections = data.result;
                                if (!collections) {
                                    return;
                                }
                                console.log("collections count" + collections.length);
                                return Utils.iterateArrayWithPromise(collections, function (index, collection) {
                                    var collectionObj = {_id: collection._id, collection: collection.collection};
                                    var events = collection.events;
                                    for (var i = 0; i < events.length; i++) {
                                        var event = events[i];
                                        event.collectionid = collectionObj;
                                    }
                                    if (events.length > 0) {
                                        console.log("mongoUpdate>>>" + JSON.stringify({$collection: "pl.events", $insert: events}));
                                        return dbToPort.mongoUpdate({$collection: "pl.events", $insert: events});
                                    }
                                })
                            })
                    }).then(
                    function () {
                        return logdb.mongoUpdate({$collection: "pl.logs", $update: [
                            {$query: {_id: logId}, $set: {status: "Done"}, $push: {"ported": {db: dbName.db}}}
                        ]});
                    }).fail(function (err) {
                        return logdb.mongoUpdate({$collection: "pl.logs", $update: [
                            {$query: {_id: logId}, $set: {status: "Error"}, $push: {"errors": {db: dbName.db, error: JSON.stringify(Utils.getErrorInfo(err))}}}
                        ]});
                    })
            })
        })
}
exports.portCollectionsWorkFlowEvents = function (db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logId = undefined;
    var logdb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            logdb = logDB;
            return logdb.mongoUpdate({$collection: "pl.logs", $insert: {type: "Collection WorkFlowEvents Porting", status: "In Progress", startTime: new Date()}});
        }).then(
        function (update) {
            logId = update["pl.logs"].$insert[0]._id;
            options.logid = logId;
            return db.getAdminDB();
        }).then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                console.log("dbName.db>>" + dbName.db);
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.collections", $filter: {workflowevents: {$exists: true}}, $events: false, $modules: false}).then(
                            function (data) {
                                var collections = data.result;
                                if (!collections) {
                                    return;
                                }
                                console.log("collections count" + collections.length);
                                return Utils.iterateArrayWithPromise(collections, function (index, collection) {
                                    var collectionObj = {_id: collection._id, collection: collection.collection};
                                    var events = collection.workflowevents;
                                    for (var i = 0; i < events.length; i++) {
                                        var event = events[i];
                                        event.collectionid = collectionObj;
                                    }
                                    if (events.length > 0) {
                                        console.log("mongoUpdate>>>" + JSON.stringify({$collection: "pl.workflowevents", $insert: events}));
                                        return dbToPort.mongoUpdate({$collection: "pl.workflowevents", $insert: events});
                                    }
                                })
                            })
                    }).then(
                    function () {
                        return logdb.mongoUpdate({$collection: "pl.logs", $update: [
                            {$query: {_id: logId}, $set: {status: "Done"}, $push: {"ported": {db: dbName.db}}}
                        ]});
                    }).fail(function (err) {
                        return logdb.mongoUpdate({$collection: "pl.logs", $update: [
                            {$query: {_id: logId}, $set: {status: "Error"}, $push: {"errors": {db: dbName.db, error: JSON.stringify(Utils.getErrorInfo(err))}}}
                        ]});
                    })
            })
        })
}
exports.portCollectionsCommentEnabled = function (db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logId = undefined;
    var logdb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            logdb = logDB;
            return logdb.mongoUpdate({$collection: "pl.logs", $insert: {type: "Collection WorkFlowEvents Porting", status: "In Progress", startTime: new Date()}});
        }).then(
        function (update) {
            logId = update["pl.logs"].$insert[0]._id;
            options.logid = logId;
            return db.getAdminDB();
        }).then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                console.log("dbName.db>>" + dbName.db);
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.collections", $filter: {commentEnabled: {$exists: true}}, $events: false, $modules: false}).then(
                            function (data) {
                                var collections = data.result;
                                if (!collections) {
                                    return;
                                }
                                console.log("collections count" + collections.length);
                                return Utils.iterateArrayWithPromise(collections, function (index, collection) {
                                    var collectionObj = {_id: collection._id, collection: collection.collection};
                                    var commentEnabled = collection.commentEnabled;
                                    if (commentEnabled) {
                                        var update = {};
                                        update["commentEnabled"] = true;
                                        update["comment_displayField"] = commentEnabled.displayField;
                                        update["comment_source"] = commentEnabled.source;
                                        update["comment_event"] = commentEnabled.event;
                                        update["comment_to"] = commentEnabled.to;
                                        update["comment_from"] = commentEnabled.from;
                                        update["comment_cc"] = commentEnabled.cc;
                                        console.log("update>>>" + JSON.stringify({$collection: "pl.collections", $update: {$query: {_id: collection._id}, $set: update}}));
                                        return dbToPort.mongoUpdate({$collection: "pl.collections", $update: {$query: {_id: collection._id}, $set: update}});
                                    }
                                })
                            })
                    }).then(
                    function () {
                        return logdb.mongoUpdate({$collection: "pl.logs", $update: [
                            {$query: {_id: logId}, $set: {status: "Done"}, $push: {"ported": {db: dbName.db}}}
                        ]});
                    }).fail(function (err) {
                        return logdb.mongoUpdate({$collection: "pl.logs", $update: [
                            {$query: {_id: logId}, $set: {status: "Error"}, $push: {"errors": {db: dbName.db, error: JSON.stringify(Utils.getErrorInfo(err))}}}
                        ]});
                    })
            })
        })
}


exports.portRoleMappings = function (db) {
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(function (dbToPort) {
                    return require("./RolePorting").makeNewRoleMappings(dbToPort);
                })
            })
        })
}

exports.dropTestCase = function (parameters, db, options) {
    var testcases_sbDB = undefined;
    return db.connectUnauthorized("testcases", true).then(
        function (testcases) {
            if (testcases) {
                return testcases.dropDatabase();
            }
        }).then(
        function () {
            return db.connectUnauthorized("testcases_sb", true);
        }).then(
        function (testcases_sb) {
            if (testcases_sb) {
                return testcases_sb.dropDatabase();
            }
        }).then(
        function () {
            return db.query({$collection: "pl.dbs", $filter: {"db": "testcases_sb"}});
        }).then(
        function (result) {
            var dbs = result.result;
            if (dbs && dbs.length > 0) {
                return db.update({$collection: "pl.dbs", $delete: {_id: dbs[0]._id}})
            }
        }).then(
        function () {
            return db.query({$collection: "pl.dbs", $filter: {"db": "testcases"}});
        }).then(
        function (result) {
            var dbs = result.result;
            if (dbs && dbs.length > 0) {
                return db.update({$collection: "pl.dbs", $delete: {_id: dbs[0]._id}})
            }
        }).then(
        function () {
            return db.update({$collection: "pl.dbs", $insert: [
                {"db": "testcases", "sandboxDb": "testcases_sb", "ensureDefaultCollections": true, "guestUserName": "testcases", "globalUserName": "testcases", "globalPassword": "testcases", "globalUserAdmin": true}
            ]});
        }).then(
        function () {
            return db.query({$collection: "pl.dbs", $filter: {"db": "testcases_sb"}});
        }).then(
        function (result) {
            var dbs = result.result;
            if (dbs && dbs.length > 0) {
                return db.update({$collection: "pl.dbs", $update: {_id: dbs[0]._id, $set: {code: "testcasesdb"}}});
            }
        }).then(
        function () {
            return db.connectUnauthorized("testcases_sb");
        }).then(
        function (testcases_sb) {
            testcases_sbDB = testcases_sb;
            return testcases_sbDB.update({$collection: "pl.currencies", $insert: [
                {currency: "INR"},
                {currency: "USD"}
            ]})
        }).then(
        function () {
            if (parameters.functionToRegister) {
                return testcases_sbDB.update({$collection: "pl.functions", $insert: parameters.functionToRegister})
            }
        }).then(function () {
            if (parameters.function) {
                return testcases_sbDB.invokeFunction(parameters.function, parameters.functionParameters || [
                    {}
                ]);
            }
        })
};


exports.portMenuQviews = function (db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logdb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            logdb = logDB;
            return db.getAdminDB();
        }).then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                console.log(">>>>dbName.db>>>>" + dbName.db);
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.menus", "$events": false, "$modules": false}).then(
                            function (data) {
                                var menus = data.result;
                                if (!menus) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(menus, function (index, menu) {
                                    var collectionName = menu["collection"];
                                    if (!collectionName) {
                                        return;
                                    }
                                    var menuQviews = menu["qviews"];
                                    if (menuQviews && menuQviews.length > 0) {
                                        return;
                                    } else {
                                        return dbToPort.query({$collection: "pl.qviews", $filter: {"collection.collection": collectionName, "hidden": {"$ne": true}}}).then(function (qviewsData) {
                                            var qviews = qviewsData.result;
                                            if (!qviews) {
                                                return;
                                            }
                                            var newQviews = [];
                                            for (var i = 0; i < qviews.length; i++) {
                                                var qview = qviews[i];
                                                var label = qview.label || qview.id;
                                                newQviews.push({_id: qview._id, label: label, id: qview.id, collection: qview.collection.collection, ui: qview.ui, index: qview.index});
                                            }
                                            if (newQviews.length > 0) {
                                                return dbToPort.mongoUpdate({$collection: "pl.menus", "$update": {$query: {_id: menu._id}, $set: {"qviews": newQviews}}}).fail(function (err) {
                                                    console.log("err>>>>" + JSON.stringify(err));
                                                    return logdb.update({$collection: "pl.logs", $insert: {"err": err.message, "type": "MenuQviewsPorting", "db": dbName.db}});
                                                });
                                            }
                                        });
                                    }
                                });
                            })
                    }).fail(function (err) {
                        console.log("connect err..." + err);
                    })
            });
        })
}


exports.clearState = function (db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logdb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            logdb = logDB;
            return db.getAdminDB();
        }).then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                console.log(">>>>dbName.db>>>>" + dbName.db);
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.users", "$events": false, "$modules": false}).then(
                            function (data) {
                                var users = data.result;
                                if (!users) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(users, function (index, user) {
                                    return dbToPort.mongoUpdate({$collection: "pl.users", "$update": {$query: {_id: user._id}, $unset: {"state": 1, "viewstate": 1}}});
                                });
                            });
                    }).fail(function (err) {
                        console.log("connect err..." + err);
                    })
            });
        })
}


exports.updateIdsInMenuQviews = function (db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logdb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            logdb = logDB;
            return db.getAdminDB();
        }).then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                console.log(">>>>dbName.db>>>>" + dbName.db);
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.menus", "$events": false, "$modules": false}).then(
                            function (data) {
                                var menus = data.result;
                                if (!menus) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(menus, function (index, menu) {
                                    var qviews = menu.qviews;
                                    if (!qviews) {
                                        return;
                                    } else {
                                        var valuesToSet = {};
                                        for (var i = 0; i < qviews.length; i++) {
                                            valuesToSet["qviews." + i + "._id"] = Utils.getUniqueObjectId();
                                        }
                                        if (Object.keys(valuesToSet).length > 0) {
                                            return dbToPort.mongoUpdate({$collection: "pl.menus", "$update": {$query: {_id: menu._id}, $set: valuesToSet}});
                                        }
                                    }

                                });
                            });
                    }).fail(function (err) {
                        console.log("connect err..." + err);
                    })
            });
        })
}

exports.portQviewsUI = function (db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logdb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            logdb = logDB;
            return db.getAdminDB();
        }).then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                console.log(">>>>dbName.db>>>>" + dbName.db);
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.qviews", "$events": false, "$modules": false}).then(
                            function (data) {
                                var qviews = data.result;
                                if (!qviews) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(qviews, function (index, qview) {
                                    if (qview.ui === undefined || qview.ui === "" || qview.ui === null) {
                                        return dbToPort.mongoUpdate({$collection: "pl.qviews", "$update": {$query: {_id: qview._id}, $set: {ui: "grid"}}});
                                    }
                                });
                            });
                    }).fail(function (err) {
                        console.log("connect err..." + err);
                    })
            });
        })
}


exports.portQfieldsVisibility = function (db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logdb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            logdb = logDB;
            return db.getAdminDB();
        }).then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                console.log(">>>>dbName.db>>>>" + dbName.db);
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.qviews", "$events": false, "$modules": false}).then(
                            function (data) {
                                var qviews = data.result;
                                if (!qviews) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(qviews, function (index, qview) {
                                    if (qview.qFields && qview.qFields.length > 0) {
                                        var valuesToSet = {};
                                        for (var i = 0; i < qview.qFields.length; i++) {
                                            var qField = qview.qFields[i];
                                            if (qField.visibility !== undefined) {
                                                valuesToSet["qFields." + i + ".visibilityGrid"] = qField.visibility;
                                            }
                                            if (qField.index !== undefined) {
                                                valuesToSet["qFields." + i + ".indexGrid"] = qField.index;
                                            }
                                            if (qField.when !== undefined) {
                                                valuesToSet["qFields." + i + ".whenGrid"] = qField.when;
                                            }
                                        }
                                        valuesToSet.fieldAvailability = qview.qFields[0].availability;
                                        if (Object.keys(valuesToSet).length > 0) {
//                                            console.log("update>>>" + JSON.stringify({$collection:"pl.qviews", $update:{$query:{_id:qview._id}, $set:valuesToSet}}));
                                            return dbToPort.mongoUpdate({$collection: "pl.qviews", $update: {$query: {_id: qview._id}, $set: valuesToSet}});
                                        }
                                    }
                                });
                            });
                    }).fail(function (err) {
                        console.log("connect err..." + err);
                    })
            });
        })
}
//rest/invoke?function=Porting.clearViewState&parameters=[{"db":"samples_sb","username":"sample","viewstate":true,"state":true,"viewid":"student_sections"}]&token=XXXXXXXXX
exports.clearViewState = function (parameters, db, options) {
    var dbName = parameters.db;
    var username = parameters.username;
    var viewid = parameters.view_id;
    var state = parameters.state;
    var viewstate = parameters.viewstate;
    var dbToPort = undefined;
    return db.connectUnauthorized(dbName).then(
        function (dbToPort1) {
            dbToPort = dbToPort1;
            return getSelectedMenus(viewid, dbToPort);
        }).then(function (menus) {
            var valuesToUnset = {};
            if (menus && menus.result && menus.result.length > 0) {
                for (var i = 0; i < menus.result.length; i++) {
                    var qviews = menus.result[i].qviews;
                    if (qviews) {
                        valuesToUnset["viewstate." + qviews._id] = 1;
                    }
                }
            }
            if (viewstate) {
                if (Object.keys(valuesToUnset).length == 0) {
                    valuesToUnset["viewstate"] = 1;
                }
            }
            if (state) {
                valuesToUnset["state"] = 1;
            }
            if (Object.keys(valuesToUnset).length > 0) {
                return dbToPort.mongoUpdate({$collection: "pl.users", $update: [
                    {$query: {username: username}, $unset: valuesToUnset}
                ]});
            }
        });
}


function getSelectedMenus(viewid, db) {
    if (viewid) {
        return db.query({$collection: "pl.menus", $filter: {"qviews.id": viewid}, $unwind: ["qviews"], $modules: false, $events: false})
    } else {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
}

// 127.0.0.1:5100/rest/invoke?function=Porting.populateChildCollection&token=54b76d17256d2b6005c53738
exports.populateChildCollection = function (db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logdb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            logdb = logDB;
            return db.getAdminDB();
        }).then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.fields", "$events": false, "$modules": false}).then(
                            function (data) {
                                var fields = data.result;
                                if (!fields) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(fields, function (index, field) {
                                    if (field.type === "object" && field.multiple && field.query) {
                                        var query = JSON.parse(field.query);
                                        if (query.$type == "child") {
                                            var fieldQuery = query.$query;
                                            if (fieldQuery) {
                                                var childCollection = fieldQuery.$collection;
                                                return dbToPort.mongoUpdate({$collection: "pl.fields", $update: {$query: {_id: field._id}, $set: {childCollection: childCollection}}});
                                            }
                                        }
                                    }
                                });
                            });
                    }).fail(function (err) {
                        console.log("connect err..." + err);
                    })
            });
        })
}

exports.updateAllDBs = function (params, db, options) {
    return db.invokeFunction("NewPorting.iterateDB", [
        {function: "Porting.updateDB"}
    ], options);
}

exports.updateDB = function (params, db, options) {
    var dbName = db.db.databaseName;
    return db.getAdminDB().then(function (admindb) {
        return admindb.query({$collection: "pl.dbs", $fields: {_id: 1}, $filter: {db: dbName}, $events: false, $modules: false}).then(function (result) {
            return admindb.update({$collection: "pl.dbs", $update: {_id: result.result[0]._id, $unset: {dummy: ""}}});
        })
    })
}

//127.0.0.1:5100/rest/invoke?function=Porting.portQviewActions&token=54c08519d4b1c81c1192d09e
exports.portQviewActions = function (db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logdb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            logdb = logDB;
            return db.getAdminDB();
        }).then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                console.log("dbName>>>" + dbName.db);
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.actions", "$events": false, "$modules": false}).then(
                            function (data) {
                                var actions = data.result;
                                if (!actions) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(actions, function (index, action) {
                                    if (action.qviewids && action.qviewids.length > 0) {
                                        var actionQviews = action.qviewids;
                                        return Utils.iterateArrayWithPromise(actionQviews, function (index, actionQview) {
                                            var qviewid = actionQview.id;
                                            return dbToPort.query({$collection: "pl.qviews", $filter: {id: qviewid}, "$events": false, "$modules": false}).then(function (qviewData) {
                                                if (qviewData && qviewData.result && qviewData.result.length > 0) {
                                                    qviewData = qviewData.result[0];
                                                    var actionAvailability = qviewData.actionAvailability;
                                                    var valuesToSet = {};
                                                    var valuesToUnset = {};
                                                    if (actionAvailability === "Quick View") {
                                                        valuesToSet.actionAvailability = "available";
                                                    } else if (actionAvailability === "Collection") {
                                                        valuesToUnset.actionAvailability = 1;
                                                    }
                                                    var updateOperation = {};
                                                    if (Object.keys(valuesToSet).length > 0) {
                                                        updateOperation.$set = valuesToSet;
                                                    }
                                                    if (Object.keys(valuesToUnset).length > 0) {
                                                        updateOperation.$unset = valuesToUnset;
                                                    }
                                                    updateOperation.$push = {"qActions": {"qaction": {_id: action._id}, visibility: true}};
                                                    updateOperation.$query = {_id: qviewData._id};
                                                    return dbToPort.mongoUpdate({$collection: "pl.qviews", $update: updateOperation}).then(function () {
                                                        return dbToPort.mongoUpdate({$collection: "pl.actions", $update: {$query: {_id: action._id}, $set: {"visibility": false}}});
                                                    });
                                                }
                                            })
                                        })
                                    } else {
                                        return dbToPort.mongoUpdate({$collection: "pl.actions", $update: {$query: {_id: action._id}, $set: {"visibility": true}}});
                                    }
                                });
                            });
                    }).fail(function (err) {
                        console.log("connect err..." + err);
                    })
            });
        })
}
//127.0.0.1:5100/rest/invoke?function=Porting.removeCacheofAllDbs&token=54c08519d4b1c81c1192d09e
exports.removeCacheofAllDbs = function (db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        console.log("going to clear cache or dbName.db>>" + dbName.db);
                        return dbToPort.invokeFunction("Porting.removeCache", [dbName.db]);
                    }).fail(function (err) {
                        console.log("connect err..." + err);
                    })
            });
        })
}

//127.0.0.1:5100/rest/invoke?function=Porting.doEntryInEsPortingStatus&parameters=[{}]&token=54eab46e943e9d93128e68e1&options={"async":true}
exports.doEntryInEsPortingStatus = function (params, db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var d = Q.defer();
    return ApplaneDB.getLogDB().then(function (logDb) {
        db.db.collectionNames(function (err, collections) {
            if (err) {
                d.reject(err);
            } else {
                console.log("collection.........." + JSON.stringify(collections))
                return Utils.iterateArrayWithPromise(collections,
                    function (indexes, collection) {
                        var collectionName = collection.name;
                        var collectionIndex = collectionName.indexOf(".");
                        collectionName = collectionName.substring(collectionIndex + 1);
                        return db.query({$collection: collectionName, $group: {_id: null, count: {$sum: 1}}, $events: false })
                            .then(function (result) {
                                console.log("result...." + JSON.stringify(result) + "colelction?????" + collectionName)
                                if (result && result.result && result.result.length > 0) {
                                    var count = result.result[0].count;
                                    return logDb.update({$collection: "esportingstatus", $insert: {db: db.db.databaseName, collection: collectionName, toPort: count, status: "Pending"}})
                                }
                            });
                    }).then(function () {
                        d.resolve();
                    });
            }
        });
    })

    return d.promise;


}

//127.0.0.1:5100/rest/invoke?function=Porting.portAllCollectionsMappings&parameters=[{"index":"daffodilsw","type":"orders","url":"192.168.100.33:9200"}]&token=54ebff5f0942d9543e50dc70&options={"async":true}
exports.portAllCollectionsMappings = function (params, db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var index = params.index;
    var d = Q.defer();
    var logDb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logdb) {
            logDb = logdb;
            var logDbFilter = {};
            if (params.$filter) {
                logDbFilter = params.$filter;
            }
            logDbFilter.db = index;
            if (params.type) {
                logDbFilter.collection = params.type;
            }
            return logDb.query({$collection: "esportingstatus", $filter: logDbFilter});
        }).then(function (result) {
            if (result && result.result && result.result.length > 0) {
                console.log("total.." + result.result.length);
                return Utils.iterateArrayWithPromise(result.result,
                    function (indexes, record) {
                        console.log("porting index.." + indexes);
                        return portEachCollectionMapping(params, db, record.collection, index);
                    }).then(function () {
                        d.resolve();
                    })
            }
        })
    return d.promise;
}

//http:127.0.0.1:5100/rest/invoke?function=Porting.portAllCollections&parameters=[{"index":"daffodilsw","$filter":{"collection":"orders"},"dataFilter":{"_id":"548eec6e6de7962a1c99e62a"},"url":"192.168.100.33:9200"}]&token=54ebff5f0942d9543e50dc70&options={"async":true}
//http:127.0.0.1:5100/rest/invoke?function=Porting.portAllCollections&parameters=[{"index":"daffodilsw","type":"orders","url":"192.168.100.33:9200"}]&token=54ebff5f0942d9543e50dc70&options={"async":true}
exports.portAllCollections = function (params, db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var index = params.index;
    var d = Q.defer();
    var logDb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logdb) {
            logDb = logdb;
            var logDbFilter = {};
            if (params.$filter) {
                logDbFilter = params.$filter;
            }
            logDbFilter.db = index;
            if (params.type) {
                logDbFilter.collection = params.type;
            }
            return logDb.query({$collection: "esportingstatus", $filter: logDbFilter});
        }).then(function (result) {

            if (result && result.result && result.result.length > 0) {
                return Utils.iterateArrayWithPromise(result.result,
                    function (indexes, record) {
                        return portData(params, db, record.collection, index).then(function () {
                            return logDb.update({$collection: "esportingstatus", $update: {_id: record._id, $set: {status: "Ported"}}});
                        });
                    }).then(function () {
                        d.resolve();
                    })
            }
        })
    return d.promise;
}


function portData(params, db, collection, index) {
    var query = {"$collection": collection, $events: false, $modules: false};
    if (params.dataFilter) {
        query.$filter = params.dataFilter;
    }
    return db.invokeFunction("Porting.iterator", [
        {"url": params.url, "query": query, "function": "Porting.portDataInElasticSearch"}
    ], {"async": false});
}


function portEachCollectionMapping(params, db, collection, index) {
    return db.invokeFunction("Porting.portMappingInElasticSearch", [
        {"index": index, "collection": collection, "url": params.url}
    ])
}


exports.checkStatusInElasticSearch = function (params, db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var index = params.index;
    var d = Q.defer();
    var logDb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logdb) {
            logDb = logdb;
            return logDb.query({$collection: "esportingstatus", $filter: {db: index}});
        }).then(function (result) {
            if (result && result.result && result.result.length > 0) {
                var collectionRecords = result.result;
                return Utils.iterateArrayWithPromise(collectionRecords,
                    function (indexes, collectionRecord) {
                        var esquery = {$collection: collectionRecord.collection, runOnES: true, $group: {_id: null, count: {$sum: 1}}, $events: false};
                        return db.query(esquery).then(
                            function (queryResult) {
                                if (queryResult && queryResult.result && queryResult.result.length > 0) {
                                    var count = queryResult.result[0].count;
                                    if (count === collectionRecord.toPort) {
                                        return logDb.update({$collection: "esportingstatus", $update: {_id: collectionRecord._id, $set: {"status": "Done", "portedRecords": count}}});
                                    } else {
                                        return logDb.update({$collection: "esportingstatus", $update: {_id: collectionRecord._id, $set: {"portedRecords": count}}});
                                    }
                                }
                            }).fail(function (err) {
                                console.log("err>>>>" + err)
                            })
                    }).then(function () {
                        d.resolve();
                    });
            }
        })
    return d.promise;
}
//http:127.0.0.1:5100/rest/invoke?function=Porting.compareDataOfElasticSearch&parameters=[{"index":"daffodilsw","type":"relationships","dataFilter":{"_id":"54d82b4a8f1c96d7089ae825"},"url":"192.168.100.33:9200"}]&token=54ec475e71d26fdf542ac8fa&options={"async":true}
//http:127.0.0.1:5100/rest/invoke?function=Porting.compareDataOfElasticSearch&parameters=[{"index":"daffodilsw","type":"orders","url":"192.168.100.33:9200"}]&token=54ec475e71d26fdf542ac8fa&options={"async":true}
exports.compareDataOfElasticSearch = function (params, db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var index = params.index;
    var d = Q.defer();
    var logDb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logdb) {
            logDb = logdb;
            var logDbFilter = {};
            logDbFilter.db = index;
            if (params.type) {
                logDbFilter.collection = params.type;
            }
            return logDb.query({$collection: "esportingstatus", $filter: logDbFilter});
        }).then(function (result) {
            if (result && result.result && result.result.length > 0) {
                return Utils.iterateArrayWithPromise(result.result,
                    function (indexes, record) {
                        var mQuery = {"$collection": record.collection, $events: false, $modules: false};
                        if (params.dataFilter) {
                            mQuery.$filter = params.dataFilter;
                        }
                        return db.invokeFunction("Porting.iterator", [
                            {"url": params.url, "query": mQuery, "function": "Porting.compareData"}
                        ], {"async": false}).then(function () {
                                return logDb.update({$collection: "esportingstatus", $update: {_id: record._id, $set: {compared: true}}});
                            });
                    }).then(function () {
                        d.resolve();
                    })
            }
        })
    return d.promise;
}

exports.compareData = function (doc, db, options) {
    var collection = options.type || options.parameters.query.$collection;
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    if (doc.__txs__) {
        delete doc.__txs__;
    }
    if (doc.__history) {
        delete doc.__history;
    }
    doc = JSON.stringify(doc);
    doc = JSON.parse(doc);
    var logDb = undefined;
    return ApplaneDB.getLogDB().then(function (logdb) {
        logDb = logdb;
        var esQuery = {$collection: collection, runOnES: true, $filter: {_id: doc._id}, $events: false, $modules: false};
        return db.query(esQuery).then(function (queryResult) {
            if (queryResult && queryResult.result && queryResult.result.length > 0) {
                var result = queryResult.result[0];
                if (result.__history) {
                    delete result.__history;
                }
                if (result.__txs__) {
                    delete result.__txs__;
                }
                if (Utils.deepEqual(doc, result)) {
                    return logDb.update({$collection: "equalRecords", $insert: {collection: collection, db: db.db.databaseName, dataId: doc._id}})
                } else {
//                    console.log("else case>>>>")
//                    console.log("doc>>>>>" + JSON.stringify(doc));
//                    console.log("result>>>>>>" + JSON.stringify(result));
                    return logDb.update({$collection: "unEqualRecords", $insert: [
                        {db: db.db.databaseName, collection: collection, dataId: doc._id}
                    ]})
                }
            }
        })
    })
}


//http://127.0.0.1:5100/rest/invoke?function=Porting.removeUserCache&parameters=[{all:true,db:"dddd",username:"zzzzzz"}]&token=xxxxxx
//remove tokens from cache, one out of (all--it will clear complete cache) or (db) is mandatory
exports.removeUserCache = function (params) {
    if (!params || (!params.db && !params.all)) {
        throw new Error("Either all or db must be available..");
    }
    //if all is available in params then clear or reset complete cache. otherwise find Tokens to deleteFromCache
    if (params.all) {
        return require("ApplaneDB/lib/CacheService.js").removeUserConnection();
    } else {
        return deleteTokensFromCache(params);
    }
};

//find and delete Tokens From Cache
function deleteTokensFromCache(params) {
    var DBConstants = require("ApplaneDB/lib/Constants.js");
    //get pladmin instance to query on pl.connections to find Tokens
    return require("ApplaneDB/lib/DB").getAdminDB().then(
        function (admindb) {
            var filter = {};
            //db must be present, due to our requirement (either db or all must be present), so no need to apply check for this.
            filter[DBConstants.Admin.Conncetions.DB] = params.db;
            if (params.username) {
                filter[DBConstants.Admin.Conncetions.OPTIONS + "." + DBConstants.Admin.Users.USER_NAME] = params.username;
            }
            var query = {"$collection": DBConstants.Admin.CONNECTIONS, "$fields": {"token": 1}, "$filter": filter};
            return admindb.query(query);
        }).then(function (result) {

            if (result && result.result && result.result.length > 0) {
                var tokens = [];
                for (var i = 0; i < result.result.length; i++) {
                    tokens.push(result.result[i].token);
                }
                //call removeUserConnection to remove all tokens
                return require("ApplaneDB/lib/CacheService.js").removeUserConnection(tokens);
            }
        })
}


//http://127.0.0.1:5100/rest/invoke?function=Porting.getUserCache&parameters=[{}]&token=xxxxxxxx
// this function will give all available keys in cache.
exports.getUserCache = function () {
    return require("ApplaneDB/lib/CacheService.js").getUserCache();
}


exports.portPasswords = function (db, options) {
    var ApplaneDB = require("ApplaneDB/lib/DB.js");
    var logdb = undefined;
    return ApplaneDB.getLogDB().then(
        function (logDB) {
            logdb = logDB;
            return db.getAdminDB();
        }).then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", field: {db: 1}});
        }).then(function (dbs) {
            dbs = dbs.result;
            return Utils.iterateArrayWithPromise(dbs, function (index, dbName) {
//                console.log(">>>>dbName.db>>>>" + dbName.db);
                return db.connectUnauthorized(dbName.db).then(
                    function (dbToPort) {
                        return dbToPort.query({$collection: "pl.users", "$events": false, "$modules": false}).then(
                            function (data) {
                                var users = data.result;
                                if (!users) {
                                    return;
                                }
                                return Utils.iterateArrayWithPromise(users, function (index, user) {
                                    var pass = user.password;
                                    if (pass) {
                                        var enc_password = Utils.getEncriptedPassword(pass);
                                        return dbToPort.mongoUpdate({$collection: "pl.users", "$update": {$query: {_id: user._id}, $set: {enc_password: enc_password}}});
                                    }
                                });
                            });
                    }).fail(function (err) {
                        console.error("connect err..." + err);
                    })
            });
        })
};

exports.manageServerStartUp = function (params, admindb) {
    var adminDB = admindb;
    return handleTransactions(adminDB, params.pid).then(function () {
        return startRebootSafeServers(adminDB);
    });
};

function startRebootSafeServers(adminDB) {
    var Config = require("ApplaneDB/Config.js").config;
    if (Config.REBOOT_AUTOSTART_SERVERS) {
        return adminDB.query({$collection: "pl.versioncontrolservers", $filter: {autostart: true, serverType: {$in: "$$VersionControl.getDevelopmentServerType"}}, $fields: ({_id: 1})}).then(function (servers) {
            servers = servers.result;
            return Utils.iterateArrayWithPromise(servers, function (index, serverid) {
                return adminDB.invokeFunction("VersionControl.restartServer", [
                    {"restartserver": true, "_id": serverid._id, checkForProcess: true}
                ]);
            })
        });
    }
}

function handleTransactions(adminDB, pid) {
    var Config = require("ApplaneDB/Config.js").config;
    if (Config.SERVER_NAME) {
        return adminDB.invokeFunction("Porting.manageTxs", [
            {"rollback": true, "servername": Config.SERVER_NAME, processid: pid}
        ]);
    } else {
        throw new Error("Server Name is Mandatory to start the server ");
    }
}

//This function is used to handle processes for failed and pending process -- Rajit garg
exports.getProcessInfo = function (pendingProcesses, db) {
    var newPendingProcesses = undefined;
    //query on pl.processes to get pending processes
    return db.query({$collection: "pl.processes", $filter: {"user._id": db.user._id, "status": "In Progress", "date": "$$CurrentDateFilter"}}).then(
        function (newPendingProcesses1) {
            newPendingProcesses = newPendingProcesses1;
            //suppose we got process 2,4 to be in progress this time but initially we have process 1,2,3,4,5 to be in progress,, i.e. we have required to get detail of 1,3,5
            //suppose pendingProcesses = [1,2,3,4,5]
            //suppose newPendingProcesses = [2,4]
            //get detail of processes that are not in progress now
            var doneProcesses = [];
            if (pendingProcesses && pendingProcesses.result) {
                for (var i = 0; i < pendingProcesses.result.length; i++) {
                    var index = Utils.isExists(newPendingProcesses, pendingProcesses.result[i], "_id");
                    if (index === undefined) {
                        doneProcesses.push(pendingProcesses.result[i]);
                    }
                }
            }
            //now doneProcesses have [1,3,5]
            // now i have required to get detail of this done processes, whether they are done with error or completed
            if (doneProcesses && doneProcesses.length > 0) {
                return getFailedProcesses(doneProcesses, db);
            }
        }).then(function (failedProcesses) {
            var processInfo = {};
            if (newPendingProcesses && newPendingProcesses.result.length > 0) {
                processInfo["processes"] = newPendingProcesses
            }
            if (failedProcesses && failedProcesses.length > 0) {
                processInfo["failedProcesses"] = failedProcesses
            }
            return processInfo;
        });
};

function getFailedProcesses(doneProcesses, db) {
    var detailOfDoneProcesses = [];
    var filterIn = [];
    for (var i = 0; i < doneProcesses.length; i++) {
        filterIn.push(doneProcesses[i]._id);
    }
    var filter = { "_id": {$in: filterIn}};
    return db.query({$collection: "pl.processes", $filter: filter}).then(
        function (detailOfDoneProcesses1) {
            if (detailOfDoneProcesses1 && detailOfDoneProcesses1.result && detailOfDoneProcesses1.result.length > 0) {
                for (var i = 0; i < detailOfDoneProcesses1.result.length; i++) {
                    if (detailOfDoneProcesses1.result[i].status === "error") {
                        detailOfDoneProcesses.push(detailOfDoneProcesses1.result[i]);
                    }
                }
            }
        }).then(function () {
            return detailOfDoneProcesses;
        })
}

//this function query on pl.dbs using pladmin to get all db's required in case of remove cache link from ui using onQuery, post=true event
exports.getDbs = function (query, result, db) {
    query["$events"] = false;
    return db.getAdminDB().then(
        function (admindb) {
            return admindb.query(query);
        }).then(function (result1) {
            result.result = result1.result;
        })
};

//this function got dbname in parameters, work of this is to connect unauthorized with this db and query on pl.users as in query
exports.getUser = function (query, result, db) {
    if (query && query.$parameters && query.$parameters.db) {
        query["$events"] = false;
        var dbName = query.$parameters.db;
        return db.connectUnauthorized(dbName).then(
            function (unAuthDB) {
                return unAuthDB.query(query);
            }).then(function (result1) {
                result.result = result1.result;
            })
    }
};

//this function is used for multi functions in one within Other Function at UI -- Rajit garg
exports.otherFunctions = function (params, db, options) {
    var SELF = require("./Porting.js");
    if (!params || !params.functionName) {
        throw new Error("function Name not defined..");
    }
    var functionName = params.functionName;
    if (functionName === "Clear Cache") {
        return SELF.removeUserCache(params);
    } else if (functionName === "Clear View State") {
        return SELF.clearViewState(params, db, options);
    } else if (functionName === "Get User Role Previleges") {
        return db.connectUnauthorized(params.db).then(
            function (userdb) {
                return userdb.invokeFunction("Porting.getUserPrivileges", [params], options);
            }).then(function (response) {
                var result = {};
                result.data = JSON.stringify(response);
                result.useAsPreview = true;
                return result;
            })
    } else if (functionName === "Set Field") {
        return db.invokeFunction("Porting.repopulateSetFieldsAsync", [params], options);
    } else if (functionName === "Ensure Indexes") {
        params.db = params.db || params.dbname;
        return db.invokeFunction("Porting.ensureIndexes", [params], options);
    } else if (functionName === "Remove Collection") {
        return db.invokeFunction("NewPorting.removeCollection", [params], options);
    } else if (functionName === "Update Multiple Updated Fields") {
        return db.invokeFunction("NewPorting.portFieldDataForMultipleChange", [params], options);
    } else if (functionName === "Get Multiple Updated Fields") {
        return db.invokeFunction("NewPorting.populateMultipleChangeInFields", [params], options);
    }
};

//this function is used to insert client error in service logs
exports.insertClientErrorInServiceLogs = function (params, db, options) {
    if (!options || !options.serviceLogId) {
        //serviceLogId not present , no need to do anything
        return;
    }
    if (!params.error && !params.stack) {
        //error not present , no need to do anything
        return;
    }
    return require("ApplaneDB/lib/DB").getLogDB().then(function (logDB) {
        return logDB.update({$collection: "pl.servicelogs", $update: {"_id": options.serviceLogId, $set: params}});
    })
};

//127.0.0.1:5100/rest/invoke?function=Porting.populateQviewReference&parameters=[{}]&token=a99997992575a9535e94ce2166973c82a3305736
// is used to find where qviewid is used and the detail is populated in the collection
exports.populateQviewReference = function (params, db) {
    var dbToPort = undefined;
    var populatedData = undefined;
    return db.getAdminDB().then(
        function (adminDb) {
            return adminDb.query({$collection: "pl.dbs", $filter: {"db": db.db.databaseName}, $fields: {globalDb: 1}});
        }).then(
        function (result) {
            if (result && result.result && result.result.length > 0) {
                var dbName = result.result[0].globalDb;
                return db.connectUnauthorized(dbName);
            }
        }).then(
        function (dbToPort1) {
            dbToPort = dbToPort1;
            return dbToPort.query({$collection: "pl.qviews", $fields: {id: 1}});
        }).then(
        function (qviews) {
            if (qviews && qviews.result && qviews.result.length > 0) {
                //here we get detail of all qviewId, i.e. where it is used..
                return getQviewReferenceData(qviews.result, dbToPort);
            }
        }).then(
        function (populatedData1) {
            populatedData = populatedData1;
            return removeDataFromQviewReference(db);
        }).then(function () {
            if (populatedData && populatedData.length > 0) {
                var insert = [
                    {$collection: "qviewReferences", $insert: populatedData}
                ];
                return db.update(insert);
            }
        })
};

function removeDataFromQviewReference(db) {
    return db.query({$collection: "qviewReferences", $fields: {_id: 1}}).then(function (qviewReferences) {
        if (qviewReferences && qviewReferences.result && qviewReferences.result.length > 0) {
            var recordsToDelete = [];
            for (var i = 0; i < qviewReferences.result.length; i++) {
                recordsToDelete.push(qviewReferences.result[i]._id);
            }
            return db.mongoUpdate([
                {$collection: "qviewReferences", $delete: [
                    {_id: {$in: recordsToDelete}}
                ]}
            ]);
        }
    })
}

function getQviewReferenceData(qviews, db) {
    var populatedData = [];
    var applicationsInfo = [];
    //query on pl.applications
    return db.query({$collection: "pl.applications", $fields: {label: 1}, $events: false}).then(
        function (applications) {
            if (applications && applications.result && applications.result.length > 0) {
                for (var i = 0; i < applications.result.length; i++) {
                    applicationsInfo.push({"_id": applications.result[i]._id, "label": applications.result[i].label});
                }
            }
            //query on  pl.fields
            return db.query({$collection: "pl.fields", $filter: {"referredView": {"$exists": true} }, $fields: {collectionid: 1, "field": 1, "referredView": 1}, $events: false})
        }).then(
        function (fields) {
            return Utils.iterateArrayWithPromise(qviews,
                function (index, qview) {
                    //query on  pl.menus
                    var count = 0;
                    return db.query({$collection: "pl.menus", $filter: {"qviews.id": qview.id}, $fields: {label: 1, collection: 1, application: 1}, $events: false}).then(
                        function (menus) {
                            if (menus && menus.result && menus.result.length > 0) {
                                for (var i = 0; i < menus.result.length; i++) {
                                    var menu = menus.result[i];
                                    count = count + 1;
                                    var applicationIndex = Utils.isExists(applicationsInfo, menu.application, "_id");
                                    var applicationLabel = applicationsInfo[applicationIndex]["label"];
                                    populatedData.push({id: qview.id, type: "menu", "fk": {"_id": menu._id, label: menu.label}, "mainfk": {_id: menu.application._id, label: applicationLabel}, "collection": menu.collection})
                                }
                            }
                            if (fields && fields.result && fields.result.length > 0) {
                                for (var i = 0; i < fields.result.length; i++) {
                                    var field = fields.result[i];
                                    if (typeof field.referredView === "string") {
                                        field.referredView = JSON.parse(field.referredView);
                                    }
                                    if (field.referredView.id === qview.id) {
                                        count = count + 1;
                                        populatedData.push({id: qview.id, type: "field", "fk": {"_id": field._id, label: field.field}, "mainfk": {_id: field.collectionid._id, label: field.collectionid.collection}})
                                    }
                                }
                            }
                            ////query on  pl.qviews
                            var filter = {};
                            filter["$or"] = [
                                {"views.id": qview.id},
                                {"aggregates.id": qview.id}
                            ];
                            return db.query({$collection: "pl.qviews", $filter: filter, $fields: {collection: 1, label: 1}, $events: false})
                        }).then(
                        function (qviews) {
                            if (qviews && qviews.result && qviews.result.length > 0) {
                                for (var i = 0; i < qviews.result.length; i++) {
                                    var dashboardView = qviews.result[i];
                                    count = count + 1;
                                    populatedData.push({id: qview.id, type: "dashboard", "fk": {"_id": dashboardView._id, label: dashboardView.label}})
                                }
                            }
                            //query on  pl.notifications
                            return db.query({$collection: "pl.actions", $filter: {"qviews.id": qview.id}, $fields: {id: 1, collectionid: 1, label: 1}, $events: false})
                        }).then(
                        function (actions) {
                            if (actions && actions.result && actions.result.length > 0) {
                                for (var i = 0; i < actions.result.length; i++) {
                                    var action = actions.result[i];
                                    count = count + 1;
                                    populatedData.push({id: qview.id, type: "action", "fk": {"_id": action._id, label: action.label}, "mainfk": {_id: action.collectionid._id, label: action.collectionid.collection}})
                                }
                            }
                            return db.getAdminDB();
                        }).then(
                        function (adminDb) {
                            return adminDb.query({$collection: "pl.notifications", $filter: {"viewid": qview.id}, $fields: {id: 1}, $events: false})
                        }).then(
                        function (notifications) {
                            if (notifications && notifications.result && notifications.result.length > 0) {
                                for (var i = 0; i < notifications.result.length; i++) {
                                    var notification = notifications.result[i];
                                    count = count + 1;
                                    populatedData.push({id: qview.id, type: "notification", "fk": {"_id": notification._id, label: notification.id}})
                                }
                            }
                        }).then(function () {
                            var update = [
                                {$collection: "pl.qviews", $update: [
                                    {$query: {_id: qview._id}, $set: {noOfReferences: count}}
                                ]}
                            ];
                            return db.mongoUpdate(update)

                        })
                })
        }).then(function () {
            return populatedData;
        })
}

//is used to port tasks from old tasks to new_tasks -- Rajit garg    8/may/2015
//http://127.0.0.1:5100/rest/invoke?function=Porting.portTasks&parameters=[{}]&token=xxxxxxxxx
exports.portTasks = function (params, db) {
    var query = {"$sort": {"_id": -1}, "$collection": "tasks", "$limit": 500, "runOnES": false, "$filter": {"status": {"$in": ["New", "Work In Progress"]}}, "$fields": {"description": 1, "index": 1, "Priority.name": 1, "Priority._id": 1, "duedate": 1, "entity_id.name": 1, "entity_id._id": 1, "ownerid.official_emailid": 1, "ownerid._id": 1, "shedule_when": 1, "task": 1, "estimatedhrs": 1, "status": 1, "tag.name": 1, "tag._id": 1, "plan_id.name": 1, "plan_id._id": 1}, "$parameters": {}};
    return db.query(query).then(
        function (result) {
            if (result && result.result && result.result.length > 0) {
                var description = undefined;
                var insert = [];
                return Utils.iterateArrayWithPromise(result.result,
                    function (index, result) {
                        description = "";
                        if (result.description) {
                            description = result.description + ", ";
                        }
                        description += "owner: " + result.ownerid.official_emailid;
                        insert.push({"task": result.task, "owner_id": {"_id": "53a43d52ab06470200fdd720", "name": "Rohit Bansal"}, "status_real": "Draft", "new_date": new Date(), "project_name": {"_id": "552e20db54ec9fee1d6828a1", "project_name": "Apps Studio"}, "details": description, "list": {"_id": "554c7633e573510a126b1c2a", "name": "Later on"}, "status": "New"})
                    }).then(function () {
                        var update = {"$collection": "new_tasks", "$insert": insert, "$onValueProcessed": true};
                        return db.update(update)
                    })
            }
        })
};

//http://127.0.0.1:5100/rest/invoke?function=Porting.deleteRoadMapRole&parameters=[{}]&token=1c146a6210ced7c52a8e3b10e1f8e291403c29a3
//is used to remove roadmap role from all users of daffodilsw, require for roadmap job, for creating new user for daffodilsw also -- Rajit garg -- 25/may/2015
exports.deleteRoadMapRole = function (params, db) {
    var dbToPort = undefined;
    return  db.connectUnauthorized("daffodilsw").then(
        function (dbToPort1) {
            dbToPort = dbToPort1;
            var query = { "$collection": "pl.users", "$filter": {"roles.role.role": "Roadmap", "referredDB.db": "daffodilsw"}, "$fields": {"roles": 1}};
            return dbToPort.query(query)
        }).then(function (users) {
            if (users && users.result && users.result.length > 0) {
                return Utils.iterateArrayWithPromise(users.result,
                    function (index, user) {
                        var userRoles = user.roles;
                        var roadMapRoles = [];
                        for (var i = 0; i < userRoles.length; i++) {
                            var userRole = userRoles[i];
                            if (userRole.role && userRole.role.role === "Roadmap") {
                                roadMapRoles.push({_id: userRole._id});
                            }
                        }
                        var updates = {$collection: "pl.users", $update: {_id: user._id, $set: {roles: {$delete: roadMapRoles}}}};
                        return dbToPort.update(updates);
                    })
            }
        })
};

//127.0.0.1:5100/rest/invoke?function=Porting.sendMailTesting&parameters=[{"viewId":"task_composite_dashboard","toEmail":"ritesh.bansal@daffodilsw.com"}]&token=6dc9b87c0c62f301795e188cf5c4c4aec6d909ed
exports.sendMailTesting = function (params, db) {  //Ritesh
    if (!params || !params.id) {
        throw new Error("id is mandatory to send mail.");
    }
    return db.invokeFunction("ExportViewService.getViewHTML", [
            {requestView: params}
        ]).then(function (view) {
            var options = {};
            options.html = view.html;
            options.to = params.toEmail;
            options.subject = params.subject || "Report";
            return db.sendMail(options);
        })
}


