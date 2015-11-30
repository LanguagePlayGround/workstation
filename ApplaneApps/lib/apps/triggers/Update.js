var Constants = require("ApplaneDB/lib/Constants.js");
var Utility = require("ApplaneCore/apputil/util.js");
var AppsConstants = require("../Constants.js");
var BusinessLogicError = require("ApplaneError/lib/BusinessLogicError.js");

exports.onPreSave = function (document, db) {
    if (document.type == "delete") {
        return;
    }
    insertDefaultData(document);
    validateData(document);
}

function insertDefaultData(document) {
    if (document.type === "insert" && document.get("code") === undefined) {
        document.set("code", Utility.getUnique());
    }
}

function validateData(document) {
    var dbName = document.get(Constants.Admin.Dbs.DB);
    if (dbName.indexOf('.') > -1) {
        throw new Error(" Dot is not allowed in DB name. ");
    }
    if (document.type == "update") {
        var updatedFields = document.getUpdatedFields();
        if (updatedFields && updatedFields.indexOf("db") >= 0) {
            throw new BusinessLogicError("DB name can not be updated");
        }
    }
}

function ensureUser(user, emailid, password, admin, db) {
    if (!user) {
        return;
    }
    var query = {$collection:"pl.users", $filter:{username:user}, $modules:{"Role":0}};
    return db.query(query).then(function (result) {
        if (result.result.length === 0) {
            var insert = {username:user};
            if (emailid) {
                insert.emailid = emailid;
            }
            if (password) {
                insert.password = password;
            }
            if (admin) {
                insert.admin = admin;
                insert.developer = true;
            }
            return db.update({$collection:Constants.Admin.USERS, $insert:insert, $modules:{"Role":0}});
        }
    })
}

exports.onPostSave = function (document, db) {
    if (document.type == "delete") {
        return;
    }
    var localDb = undefined;
    var dbName = document.get(Constants.Admin.Dbs.DB);
    var guestUser = document.get(Constants.Admin.Dbs.GUEST_USER_NAME);
    var globalUser = document.get(Constants.Admin.Dbs.GLOBAL_USER_NAME);
    var globalUserEmailid = document.get(Constants.Admin.Dbs.GLOBAL_USER_EMAILID);
    var globalPassword = document.get(Constants.Admin.Dbs.GLOBAL_PASSWORD);
    var globalAdmin = document.get(Constants.Admin.Dbs.GLOBAL_USER_ADMIN);
    return db.connectUnauthorized(dbName, true).then(
        function (localDb1) {
            localDb = localDb1;
            return ensureUser(globalUser, globalUserEmailid, globalPassword, globalAdmin, localDb);
        }).then(
        function () {
            return ensureUser(guestUser, undefined, undefined, false, localDb);
        }).then(
        function () {
            return localDb.invokeFunction("Porting.ensureMetadataIndexes", [dbName]);
        }).then(
        function () {
            return ensureIndexesForApplications(document, localDb);
        }).then(
        function () {
            var ensureDefaultCollection = document.get(Constants.Admin.Dbs.ENSURE_DEFAULT_COLLECTIONS);
            if (ensureDefaultCollection && localDb.isGlobalDB()) {
                return createDefaultCollections(localDb);
            }
        }).then(
        function () {
            var insert = {};
            insert[Constants.Admin.Dbs.GUEST_USER_NAME] = guestUser;
            insert[Constants.Admin.Dbs.GLOBAL_USER_NAME] = globalUser;
            insert[Constants.Admin.Dbs.GLOBAL_USER_EMAILID] = globalUserEmailid;
            insert[Constants.Admin.Dbs.GLOBAL_PASSWORD] = globalPassword;
            insert[Constants.Admin.Dbs.GLOBAL_USER_ADMIN] = globalAdmin;
            return createSandBoxDB(document, insert, dbName, db);
        }).then(function () {
            var unsetValues = {};
            unsetValues[Constants.Admin.Dbs.GLOBAL_USER_EMAILID] = "";
            unsetValues[Constants.Admin.Dbs.GLOBAL_PASSWORD] = "";
            unsetValues[Constants.Admin.Dbs.GLOBAL_USER_ADMIN] = "";
            return db.update({$collection:Constants.Admin.DBS, $update:{_id:document.get("_id"), $unset:unsetValues}, $events:false, $modules:false});
        })
}

function ensureIndexesForApplications(document, localDb) {
    var updatedFields = document.getUpdatedFields();
    if (!updatedFields || updatedFields.indexOf("applications") === -1) {
        return;
    }
    var applicationDocuments = document.getDocuments("applications", ["insert", "update"]);
    if (!applicationDocuments || applicationDocuments.length === 0) {
        return;
    }
    var applications = [];
    for (var i = 0; i < applicationDocuments.length; i++) {
        var applicationDocument = applicationDocuments[i];
        var applicationId = applicationDocument.get("application");
        applications.push(applicationId);
    }
    return localDb.query({$collection:"pl.applications", $filter:{id:{$in:applications}}, $fields:{collections:1}}).then(function (appResult) {
        var collections = [];
        appResult = appResult.result;
        for (var i = 0; i < appResult.length; i++) {
            var appResultInfo = appResult[i];
            var appCollections = appResultInfo.collections;
            if (appCollections) {
                for (var j = 0; j < appCollections.length; j++) {
                    var appCollection = appCollections[j];
                    var appCollectionName = appCollection.collection;
                    if (collections.indexOf(appCollectionName) === -1) {
                        collections.push(appCollectionName);
                    }
                }
            }
        }
        if (collections.length === 0) {
            return;
        }
        return localDb.invokeFunction("Porting.ensureIndexes", [
            {db:document.get(Constants.Admin.Dbs.DB), collection:collections}
        ]);
    })
}

function createDefaultCollections(localDb) {
    var collectionArray = [
        {collection:Constants.Modules.Udt.Currency.Type.COLLECTION, fields:[
            {field:Constants.Modules.Udt.Currency.Type.CURRENCY, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Modules.Udt.Currency.Type.COLLECTION}}, primary:true}
        ]},
        {collection:Constants.Modules.Udt.Unit.Unit.COLLECTION, fields:[
            {field:Constants.Modules.Udt.Unit.Unit.UNIT, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Modules.Udt.Unit.Unit.COLLECTION}}, primary:true}
        ]},
        {collection:Constants.Admin.ROLES, fields:[
            {field:Constants.Admin.Roles.ID, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.ROLES}}, primary:true},
            {field:Constants.Admin.Roles.ROLE, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.ROLES}}, primary:true},
            {field:Constants.Admin.Roles.GROUP, type:Constants.Admin.Fields.Type.BOOLEAN, collectionid:{$query:{"collection":Constants.Admin.ROLES}}}
        ]},
        {collection:Constants.Admin.USERS, fields:[
            {field:Constants.Admin.Users.USER_NAME, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.USERS}}, primary:true},
            {field:Constants.Admin.Users.FULL_NAME, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.USERS}}, primary:true},
            {field:Constants.Admin.Users.EMAIL_ID, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.USERS}}, primary:true},
            {field:Constants.Admin.Users.MOBILE_NO, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.USERS}}, primary:true},
            {field:Constants.Admin.Users.PASSWORD, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.USERS}}},
            {field:Constants.Admin.Users.STATUS, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.USERS}}},
            {field:Constants.Admin.Users.ROLES, type:Constants.Admin.Fields.Type.OBJECT, collectionid:{$query:{"collection":Constants.Admin.USERS}}, multiple:true},
            {field:Constants.Admin.Users.ROLE, type:Constants.Admin.Fields.Type.FK, collectionid:{$query:{"collection":Constants.Admin.USERS}}, "parentfieldid":{$query:{"field":Constants.Admin.Users.ROLES, collectionid:{$query:{"collection":Constants.Admin.USERS}}}}, "collection":Constants.Admin.ROLES, set:["id", "role", "group"]},
            {field:Constants.Admin.Users.STATE, type:Constants.Admin.Fields.Type.OBJECT, collectionid:{$query:{"collection":Constants.Admin.USERS}}},
            {field:Constants.Admin.Users.SELECTED_APPLICATION, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.USERS}}, "parentfieldid":{$query:{"field":Constants.Admin.Users.STATE, collectionid:{$query:{"collection":Constants.Admin.USERS}}}}},
            {field:Constants.Admin.Users.APPLICATION, type:Constants.Admin.Fields.Type.JSON, collectionid:{$query:{"collection":Constants.Admin.USERS}}, "parentfieldid":{$query:{"field":Constants.Admin.Users.STATE, collectionid:{$query:{"collection":Constants.Admin.USERS}}}}},
            {field:Constants.Admin.Users.NO_OF_RECORDS, type:Constants.Admin.Fields.Type.NUMBER, collectionid:{$query:{"collection":Constants.Admin.USERS}}},
            {field:Constants.Admin.Users.CALENDER_ENABLED, type:Constants.Admin.Fields.Type.BOOLEAN, collectionid:{$query:{"collection":Constants.Admin.USERS}}},
            {field:Constants.Admin.Users.MAIL_TRACK_ENABLED, type:Constants.Admin.Fields.Type.BOOLEAN, collectionid:{$query:{"collection":Constants.Admin.USERS}}},
            {field:Constants.Admin.Users.MAIL_TRACK_START_DATE, type:Constants.Admin.Fields.Type.DATE, collectionid:{$query:{"collection":Constants.Admin.USERS}}},
            {field:Constants.Admin.Users.IMAGE, type:Constants.Admin.Fields.Type.FILE, collectionid:{$query:{"collection":Constants.Admin.USERS}}}
        ], events:[
            {
                function:"User.onPreSave",
                event:"onSave",
                pre:true,
                collectionid:{$query:{collection:"pl.users"}}
            },
            {
                function:"User.onPostSave",
                event:"onSave",
                post:true,
                collectionid:{$query:{collection:"pl.users"}}
            }
        ]},
        {collection:Constants.Admin.APPLICATIONS, fields:[
            {field:Constants.Admin.Applications.LABEL, type:Constants.Admin.Fields.Type.STRING, collectionid:{$query:{"collection":Constants.Admin.APPLICATIONS}}, primary:true}
        ]}
    ];
    return Utility.iterateArrayWithPromise(collectionArray, function (index, collection) {
        return checkforCollectionExistence(localDb, collection);
    })
}


function createSandBoxDB(document, insert, dbName, db) {
    var updatedFields = document.getUpdatedFields();
    if (updatedFields && updatedFields.indexOf(Constants.Admin.Dbs.SANDBOX_DB) >= 0) {
        var sandboxDb = document.get(Constants.Admin.Dbs.SANDBOX_DB);
        if (sandboxDb) {
            var dbQuery = {$collection:Constants.Admin.DBS, $filter:{}};
            dbQuery.$filter[Constants.Admin.Dbs.DB] = sandboxDb;
            return db.query(dbQuery).then(function (result) {
                if (result.result.length === 0) {
                    insert[Constants.Admin.Dbs.DB] = sandboxDb;
                    insert[Constants.Admin.Dbs.DEVELOPMENT_RIGHT] = true;
                    insert[Constants.Admin.Dbs.ADMIN_DB] = dbName;
                    insert[Constants.Admin.Dbs.GLOBAL_DB] = insert[Constants.Admin.Dbs.ADMIN_DB];
                    insert[Constants.Admin.Dbs.ENSURE_USER] = document.get(Constants.Admin.Dbs.ENSURE_USER);
                    insert[Constants.Admin.Dbs.AUTO_SYNCH] = document.get(Constants.Admin.Dbs.AUTO_SYNCH);
                    insert[Constants.Admin.Dbs.APPLICATIONS] = document.get(Constants.Admin.Dbs.APPLICATIONS);
                    insert[Constants.Admin.Dbs.ALLOWED_SERVICES] = document.get(Constants.Admin.Dbs.ALLOWED_SERVICES);
                    return db.update({$collection:Constants.Admin.DBS, $insert:insert})
                }
            })
        }
    }
}


function checkforCollectionExistence(localDb, collection) {
    return localDb.query({$collection:Constants.Admin.COLLECTIONS, $filter:{collection:collection.collection}, $events:false, $modules:false}).then(function (data) {
            if (data.result.length === 0) {
                var collectionInsert = {collection:collection.collection};
                var update = [
                    {$collection:Constants.Admin.COLLECTIONS, $insert:collectionInsert},
                    {$collection:Constants.Admin.FIELDS, $insert:collection.fields}
                ];
                if (collection.events) {
                    update.push({$collection:Constants.Admin.EVENTS, $insert:collection.events});
                }
                return localDb.update(update);
            } else {
                var localQuery = {$collection:Constants.Admin.FIELDS, $filter:{"collectionid._id":data.result[0]._id}, $events:false, $modules:false};
                var update = [];
                return localDb.query(localQuery).then(
                    function (fields) {
                        fields = fields.result;
                        var collectionFields = collection.fields;
                        var newInsertFields = [];
                        var newUpdateFields = [];
                        for (var i = 0; i < collectionFields.length; i++) {
                            var collectionField = collectionFields[i];
                            var existField = undefined;
                            for (var j = 0; j < fields.length; j++) {
                                var field = fields[j];
                                if (field.field === collectionField.field && ((!field.parentfieldid && !collectionField.parentfieldid) || ((field.parentfieldid && collectionField.parentfieldid)))) {
                                    existField = field;
                                    break;
                                }
                            }
                            if (existField === undefined) {
                                newInsertFields.push(collectionField);
                            } else {
                                var newUpdate = {_id:existField._id};
                                addUpdate(newUpdate, field, collectionField, "set");
                                addUpdate(newUpdate, field, collectionField, "type");
                                addUpdate(newUpdate, field, collectionField, "multiple");
                                addUpdate(newUpdate, field, collectionField, "primary");
                                if (Object.keys(newUpdate).length > 1) {
                                    newUpdateFields.push(newUpdate);
                                }
                            }
                        }
                        update.push({$collection:Constants.Admin.FIELDS, $insert:newInsertFields, $update:newUpdateFields});
                        if (collection.events) {
                            return localDb.query({$collection:Constants.Admin.EVENTS, $filter:{"collectionid._id":data.result[0]._id}, $events:false, $modules:false}).then(
                                function (events) {
                                    events = events.result;
                                    var collectionEvents = collection.events;
                                    var newEvents = [];
                                    for (var i = 0; i < collectionEvents.length; i++) {
                                        var collectionEvent = collectionEvents[i];
                                        var exists = false;
                                        for (var j = 0; j < events.length; j++) {
                                            var event = events[j];
                                            if (event.event === collectionEvent.event && event.function === collectionEvent.function) {
                                                exists = true;
                                                break;
                                            }
                                        }
                                        if (!exists) {
                                            newEvents.push(collectionEvent);
                                        }

                                    }
                                    if (newEvents.length > 0) {
                                        update.push({$collection:Constants.Admin.EVENTS, $insert:newEvents});
                                    }
                                })
                        }
                    }).then(function () {
                        return localDb.update(update);
                    })
            }
        }
    )
}

function addUpdate(update, field, collectionField, property) {
    var newValue = collectionField[property];
    var oldValue = field[property];
    if (!Utility.deepEqual(newValue, oldValue)) {
        if (newValue === undefined) {
            update.$unset = update.$unset || {};
            update.$unset[property] = "";
        } else {
            update.$set = update.$set || {};
            update.$set[property] = newValue;
        }
    }
}

exports.getDBApplications = function (query, result, db, options) {
    var dbName = query.$parameters.db;
    if (!dbName) {
        return;
    }
    var mainResult = result.result;
    mainResult.splice(0, mainResult.length);
    return db.connectUnauthorized(dbName).then(
        function (dbToConnect) {
            return dbToConnect.query({$collection:query.$collection, $fields:{id:1}});
        }).then(function (result) {
            var applications = result.result;
            if (applications.length > 0) {
                for (var i = 0; i < applications.length; i++) {
                    var application = applications[i];
                    mainResult.push(application.id);
                }
            }
        })
}


