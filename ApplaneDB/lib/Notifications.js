/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 26/8/14
 * Time: 5:34 PM
 * To change this template use File | Settings | File Templates.
 */

var Utils = require("ApplaneCore/apputil/util.js");
var Constants = require("./Constants.js");
var Q = require("q");
var Config = require("../Config.js").config;
var Cron = require("./Cron.js");

exports.executeNotifications = function () {
    console.log("execute Notifications called...");
    setInterval(function () {
        var adminDB = undefined;
        var ApplaneDB = require("./DB.js");
        return ApplaneDB.getAdminDB().then(
            function (adb) {
                adminDB = adb;
                var dbFilter = {};
                dbFilter[Constants.Admin.Dbs.NOTIFICATION_ENABLED] = true;
                return adminDB.query({$collection: Constants.Admin.DBS, $filter: dbFilter});
            }).then(
            function (dbs) {
                var dbNames = [];
                for (var i = 0; i < dbs.result.length; i++) {
                    dbNames.push(dbs.result[i][Constants.Admin.Dbs.DB]);
                }
                if (dbNames.length > 0) {
                    return manageNotifications(dbNames, adminDB);
                }
            }).fail(
            function (err) {
                var options = {to: "sachin.bansal@daffodilsw.com", from: "developer@daffodilsw.com", subject: "Error in Notification"};
                var html = '';
                html += "<b>ERROR</b>" + err.message + "<br>";
                html += "<b>STACK</b>" + err.stack + "<br>";
                html += "<b>DATE</b>" + new Date() + "<br>";
                options.html = html;
                require("./MailService.js").sendFromAdmin(options);
            }).then(
            function () {
                adminDB = undefined;
            })
    }, 90000);
}

function manageNotifications(dbNames, db) {
    var query = {$collection: Constants.Admin.NOTIFICATIONS, $filter: {"when.nextDueOn": {$lte: new Date()}, serverName: Config.SERVER_NAME, processing: {$ne: true}}, $limit: 1, $sort: {_id: 1}};
    return db.query(query).then(
        function (result) {
            result = result.result;
            if (!result || result.length === 0) {
                return;
            }
            return manageNotification(result[0], dbNames, db);
        })
}

function manageNotification(notification, dbNames, db) {
    var error = undefined;
    var insert = {__createdon: new Date(), lock: {type: "Notification", name: notification.id}, db: db.db.databaseName};
    return db.mongoUpdate({$collection: Constants.Admin.APP_LOCKS, $insert: insert}).then(
        function () {
            require("./Notifications.js").executeNotification(notification, dbNames, db);
        }).fail(
        function (err) {
            error = err;
        }).then(
        function () {
            return db.mongoUpdate({$collection: Constants.Admin.APP_LOCKS, $delete: {db: db.db.databaseName, "lock.type": "Notification", "lock.name": notification.id}});
        }).then(function () {
            if (error) {
                throw error;
            }
        })
}


exports.executeNotification = function (notification, dbNames, db) {
    if (!notification[Constants.Admin.Notifications.ROLES] || notification[Constants.Admin.Notifications.ROLES].length === 0) {
        var d = Q.defer();
        d.resolve();
        return d.promise
    }
    var status = notification[Constants.Admin.Notifications.STATUS] || Constants.Admin.Notifications.Status.OFF;
    var statusWiseDbs = Cron.populateDBWithStatus(status, dbNames, notification[Constants.Admin.Notifications.DBS]);
    var startTime = new Date();
    var logId = undefined;
    var finalStatus = undefined;
    return db.mongoUpdate({$collection: "pl.logs", $insert: {type: "Notification", status: "In Progress", info: JSON.stringify({id: notification[Constants.Admin.Notifications.ID], viewid: notification[Constants.Admin.Notifications.VIEWID], statusWiseDbs: statusWiseDbs}), startTime: startTime, notificationid: {_id: notification._id}}}).then(
        function (update) {
            logId = update["pl.logs"].$insert[0]._id;
            return db.mongoUpdate({$collection: Constants.Admin.NOTIFICATIONS, $update: {$query: {_id: notification._id}, $set: {processing: true}}});
        }).then(
        function () {
            return Utils.iterateArrayWithPromise(statusWiseDbs, function (index, dbInfo) {
                var d1 = Q.defer();
                setImmediate(
                    function () {
                        var dbToConnect = undefined;
                        var dbStartTime = new Date();
                        var dbName = dbInfo.db;
                        var logInfo = {db: dbName};
                        var error = undefined;
                        db.connectUnauthorized(dbName).then(
                            function (dbc) {
                                dbToConnect = dbc;
                                return require("./Notifications.js").manageNotificationDbWise(notification, dbInfo, logInfo, dbToConnect);
                            }).fail(
                            function (err) {
                                finalStatus = "Failed";
                                error = err;
                            }).then(
                            function (skipDb) {
                                if (skipDb !== false) {
                                    return Cron.manageInnerLogs(logId, "Notification", logInfo, dbStartTime, error, db);
                                }
                            }).then(
                            function () {
                                dbToConnect.clean();
                                dbToConnect = undefined;
                            }).then(
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
            if (!notification.skipUpdateWhen) {
                return updateWhen(notification, db);
            }
        }).then(
        function () {
            return db.mongoUpdate({$collection: Constants.Admin.NOTIFICATIONS, $update: {$query: {_id: notification._id}, $unset: {processing: ""}}});
        }).then(
        function () {
            var endTime = new Date();
            return db.mongoUpdate({$collection: "pl.logs", $update: {$query: {_id: logId}, $set: {status: finalStatus || "Success", endTime: new Date(), totalTime: (endTime - startTime)}}});
        }).then(function () {
            return logId;
        })
}

exports.manageNotificationDbWise = function (notification, dbInfo, logInfo, db) {
    var notificationId = notification[Constants.Admin.Notifications.ID];
    var skipDb = false;
    var userIds = [];
    return db.query({$collection: "pl.userNotifications", $filter: {notificationid: notificationId}, $fields: {status: 1, userid: 1}}).then(
        function (userNotificationsResult) {
            var userNotifications = userNotificationsResult.result;
            for (var i = 0; i < userNotifications.length; i++) {
                var userNotification = userNotifications[i];
                if (userNotification.status !== dbInfo.status && userNotification.userid) {
                    userIds.push(userNotification.userid._id);
                }
            }
            if (dbInfo.status === Constants.Admin.Notifications.Status.OFF && userIds.length === 0) {
                skipDb = true;
                return;
            }
            var notificationRoles = notification[Constants.Admin.Notifications.ROLES];
            return db.invokeFunction("Porting.getRolesWithParentRoles", [notificationRoles]);
        }).then(
        function (rolesToExecute) {
            if (!rolesToExecute || rolesToExecute.length === 0) {
                return;
            }
            var userFilter = {emailid:{$exists:true}, "roles.role.id":{$in:rolesToExecute}};
            if (userIds.length > 0) {
                userFilter._id = dbInfo.status === Constants.Admin.Notifications.Status.OFF ? {$in: userIds} : {$nin: userIds};
            }
            if (notification.username) {
                userFilter.username = notification.username;
            }
            return sendNotifications(notification, userFilter, logInfo, db);
        }).then(function () {
            return !skipDb;
        })
}

function sendNotifications(notification, userFilter, logInfo, db) {
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
            var userQuery = {$collection: "pl.users", $fields: {username: 1, emailid: 1}, $filter: userFilter, $events: false, $modules: false};
            return db.query(userQuery)
        }).then(function (users) {
            users = users.result;
            logInfo.userCount = users.length;
            if (users.length === 0) {
                return;
            }
            logInfo.mailSentUserCount = 0;
            logInfo.mailSkipUserCount = 0;
            logInfo.mailSentTo = [];
            logInfo.mailSkipTo = [];
            var d = Q.defer();
            setImmediate(function () {
                var error = [];
                return Utils.iterateArrayWithPromise(users,
                    function (index, user) {
                        var dbToConnect = undefined;
                        return ApplaneDB.connectWithCode(Config.URL, dbName, dbCode, {username: user.username}).then(
                            function (dbc) {
                                dbToConnect = dbc;
                                return dbToConnect.invokeFunction("ExportViewService.getViewHTML", [
                                    {requestView: getViewParameters(notification)}
                                ])
                            }).then(
                            function (view) {
                                if (view.html) {
                                    return sendMail(view, notification, user, dbToConnect).then(function () {
                                        logInfo.mailSentUserCount = logInfo.mailSentUserCount + 1;
                                        logInfo.mailSentTo.push(user.username);
                                    });
                                } else {
                                    logInfo.mailSkipUserCount = logInfo.mailSkipUserCount + 1;
                                    logInfo.mailSkipTo.push(user.username);
                                }
                            }).fail(
                            function (err) {
                                error.push({user: user.username, error: JSON.stringify(Utils.getErrorInfo(err))});
                            }).then(
                            function () {
                                dbToConnect.clean();
                                dbToConnect = undefined;
                            })
                    }).then(
                    function () {
                        var errorLength = error.length;
                        logInfo.errorUserCount = errorLength;
                        if (errorLength === 0) {
                            d.resolve();
                        } else {
                            d.reject(error);
                        }
                    })
            })
            return d.promise;
        })
}

function sendMail(view, notification, user, dbToConnect) {
    return validateSubject(view, notification, dbToConnect).then(function (subject) {
        if (!notification.skipMail) {
            var options = {};
            options[Constants.MailService.Options.HTML] = view.html;
            options[Constants.MailService.Options.TO] = notification.mailTo || user.emailid;
            options[Constants.MailService.Options.SUBJECT] = subject;
            if (notification.mailTo) {
                options[Constants.MailService.Options.SUBJECT] = options[Constants.MailService.Options.SUBJECT] + " for " + user.emailid;
            }
            options.async = true;
            options.mailLogs = {success: true, error: true};
            options.mailLogType = "Notification";
            return dbToConnect.sendMail(options);
        }
    })
}

function getViewParameters(notification) {
    var notificationViewId = notification[Constants.Admin.Notifications.VIEWID];
    var viewParameters = {id: notificationViewId};
    var notificationFilter = notification[Constants.Admin.Notifications.FILTER];
    if (notificationFilter) {
        viewParameters.$filter = JSON.parse(notificationFilter);
    }
    var notificationParameters = notification[Constants.Admin.Notifications.PARAMETERS];
    if (notificationParameters) {
        viewParameters.$parameters = JSON.parse(notificationParameters);
    }
    var viewInfo = notification[Constants.Admin.Notifications.VIEW_INFO];
    if (viewInfo) {
        viewInfo = JSON.parse(viewInfo);
        for (var k in viewInfo) {
            viewParameters[k] = viewInfo[k];
        }
    }
    return viewParameters;
}

function validateSubject(view, notification, db) {
    var subject = JSON.parse(notification[Constants.Admin.Notifications.SUBJECT]);
    var template = subject.template;
    var parameters = subject.parameters;
    var p = require("../lib/modules/Function.js").populateFilter(parameters, undefined, db, {collection: view.view.viewOptions.collection});
    if (p) {
        return p.then(function () {
            return renderTemplate(view, template, parameters);
        })
    } else {
        var d = Q.defer();
        d.resolve(renderTemplate(view, template, parameters));
        return d.promise;
    }
}

function renderTemplate(view, template, parameters) {
    var ejsParams = {view: view.view};
    if (parameters) {
        ejsParams.parameters = parameters;
    }
    return require("ejs").render(template, ejsParams);
}

function updateWhen(notification, db) {
    var lastRunOn = new Date();
    var nextDueOn = require("../lib/modules/Schedule.js").getNextDueDate(notification[Constants.Admin.Notifications.WHEN], lastRunOn);
    return db.update({$collection: Constants.Admin.NOTIFICATIONS, $update: [
        {_id: notification._id, $set: {lastRunOn: lastRunOn, when: {$set: {nextDueOn: nextDueOn}}}}
    ]});
}

exports.onPreSave = function (document, db, options) {
    if (document.type === "delete") {
        return;
    }
    var subject = document.get(Constants.Admin.Notifications.SUBJECT);
    if (!subject) {
        throw new Error("please provide value of mandatory parameters [subject]");
    }
    subject = JSON.parse(subject);
    if (!subject.template) {
        throw new Error("Template must be defined in Subject [" + JSON.stringify(subject) + "]");
    }
    return validateRole(document, db);
}

function validateRole(document, db) {
    var updatedFields = document.getUpdatedFields();
    if (updatedFields && updatedFields.indexOf(Constants.Admin.Notifications.ROLES) !== -1) {
        var roles = document.get(Constants.Admin.Notifications.ROLES);
        if (roles && roles.length > 0) {
            return db.query({$collection: "pl.dbs", $filter: {notificationEnabled: true}}).then(function (result) {
                var dbs = result.result;
                return Utils.iterateArrayWithPromise(roles, function (index, role) {
                    var roleValid = false;
                    return Utils.iterateArrayWithPromise(dbs,
                        function (index, dbObj) {
                            if (roleValid) {
                                return;
                            }
                            var dbToConnect = undefined;
                            return db.connectUnauthorized(dbObj.db).then(
                                function (dbc) {
                                    dbToConnect = dbc;
                                    return dbToConnect.query({$collection: "pl.roles", $filter: {id: role}, $limit: 1});
                                }).then(
                                function (result) {
                                    if (result.result.length > 0) {
                                        roleValid = true;
                                        return;
                                    }
                                }).then(function () {
                                    dbToConnect.clean();
                                    dbToConnect = undefined;
                                })
                        }).then(function () {
                            if (!roleValid) {
                                throw new Error("Role [" + role + "] defined in roles [" + JSON.stringify(roles) + "] in notification [" + document.get(Constants.Admin.Notifications.ID) + "] does not exist.");
                            }
                        })
                })
            })
        }
    }
}