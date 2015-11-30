var Constants = require(".././Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
var Q = require("q");

exports.onPostSave = function (document, db, options) {
    //define googleCalendarMappings in options, while defining events like {"googleCalendarMappings":{"summary":"task", "description":"description", "start":"duedate", "duration":"estimatedhrs", "owner":"ownerid"}}
    if (!options || !options.googleCalendarMappings) {
        return;
    }
    return doEntry(options.googleCalendarMappings, document, db, options).fail(function (err) {
        var ErrorHandler = require(".././ErrorHandler.js");
        var errorMessage = {"message": err.message || err, "stack": err.stack};
        return ErrorHandler.handleError(errorMessage, ErrorHandler.TYPE.GOOGLE_CALENDAR, db);
    })
};

function doEntry(googleCalendarMappings, document, db, options) {
    var collectionName = document.collection;
    var userId = undefined;
    if (document.type === "insert") {
        var ownerid = document.get(googleCalendarMappings[Constants.Modules.GoogleCalendarMappings.OWNER]);
        return getUserId(ownerid, db).then(function (userId1) {
            if (userId1) {
                userId = userId1;
                return getResource(googleCalendarMappings, document);
            }
        }).then(function (resource) {
            if (resource) {
                var docId = document.get(Constants.Query._ID);
                return insertEvent(docId, collectionName, resource, userId, db, options);
            }
        })
    } else if (document.type === "update") {
        // To check whether updated fields contain required fields(at least one) , if not no need to proceed..
        var updatedFields = document.getUpdatedFields();
        if (isUpdated(googleCalendarMappings, updatedFields)) {
            //NOW delete old , and insert new..
            //DELETING OLD
            var ownerid = document.getOld(googleCalendarMappings[Constants.Modules.GoogleCalendarMappings.OWNER]);
            return getUserId(ownerid, db).then(function (userId1) {
                if (userId1) {
                    var oldCalendarId = document.getOld(Constants.Modules.GoogleCalendarMappings.GOOGLE_CALENDAR_ID);
                    //in case of document.type = delete, resource not required, therefore no need to call getResource
                    return removeEvent(oldCalendarId, userId1, db, options);
                }
            }).then(function () {      //INSERTING INTO NEW
                var ownerid = document.get(googleCalendarMappings[Constants.Modules.GoogleCalendarMappings.OWNER]);
                return getUserId(ownerid, db)
            }).then(function (userId1) {
                if (userId1) {
                    userId = userId1;
                    return getResource(googleCalendarMappings, document);
                }
            }).then(function (resource) {
                if (resource) {
                    var docId = document.get(Constants.Query._ID);
                    return insertEvent(docId, collectionName, resource, userId, db, options);
                }
            })
        } else {
            var d = Q.defer();
            d.resolve();
            return d.promise;
        }
    } else if (document.type === "delete") {
        var ownerid = document.getOld(googleCalendarMappings[Constants.Modules.GoogleCalendarMappings.OWNER]);
        return getUserId(ownerid, db).then(function (userId1) {
            if (userId1) {
                var oldCalendarId = document.getOld(Constants.Modules.GoogleCalendarMappings.GOOGLE_CALENDAR_ID);
                //in case of document.type = delete, resource not required, therefore no need to call getResource
                return removeEvent(oldCalendarId, userId1, db, options);
            }
        })
    } else {
        var d = Q.defer();
        d.resolve();
        return d.promise;
    }
}

function isUpdated(googleCalendarMappings, updatedFields) {
    for (var key in googleCalendarMappings) {
        if (updatedFields.indexOf(googleCalendarMappings[key]) >= 0) {
            return true;
        }
    }
    return false;
}

function getResource(googleCalendarMappings, document) {
    var resource = undefined;
    var summaryExp = googleCalendarMappings[Constants.Modules.GoogleCalendarMappings.SUMMARY];
    var descriptionExp = googleCalendarMappings[Constants.Modules.GoogleCalendarMappings.DESCRIPTION];
    var startDateExp = googleCalendarMappings[Constants.Modules.GoogleCalendarMappings.START];
    var endDateExp = googleCalendarMappings[Constants.Modules.GoogleCalendarMappings.END];
    var durationExp = googleCalendarMappings[Constants.Modules.GoogleCalendarMappings.DURATION];

    if (!summaryExp || !startDateExp) {
        return;
    }

    var startDate = document.get(startDateExp);
    var summary = document.get(summaryExp);
    if (startDate && summary) {
        var endDate = findEndDate(startDate, endDateExp, durationExp, document);
        resource = {};
        resource[Constants.Modules.GoogleCalendarMappings.SUMMARY] = summary;
        resource[Constants.Modules.GoogleCalendarMappings.START] = {dateTime: startDate};
        resource[Constants.Modules.GoogleCalendarMappings.END] = {dateTime: endDate};
        if (descriptionExp) {
            var description = document.get(descriptionExp);
            if (description) {
                resource[Constants.Modules.GoogleCalendarMappings.DESCRIPTION] = description;
            }
        }
        return resource;

    } else {
        return;
    }
}

function getUserId(ownerid, db) {
    return db.query({$collection: "employees", $filter: {"_id": ownerid._id}, $fields: {"user_id": 1}}).then(function (employees) {
        if (employees && employees.result && employees.result.length > 0 && employees.result[0]["user_id"]) {
            var userId = employees.result[0]["user_id"]._id;
            return userId;
        }
    })
}

function insertEvent(docId, collectionName, resource, userId, db, options) {
    var params = [
        {"event": {"resource": resource},
            "type": "insert", "userId": userId
        }
    ];
    return db.invokeFunction(Constants.Modules.GoogleCalendarMappings.GOOGLE_CALENDER_SERVICE_FUNCTION, params, options).then(function (googleCalendarId) {
        if (googleCalendarId) {
            var setField = {};
            setField[Constants.Modules.GoogleCalendarMappings.GOOGLE_CALENDAR_ID] = googleCalendarId.id;
            return db.update({$collection: collectionName, $update: {"_id": docId, $set: setField}, $events: false, $modules: false});
        }
    })
}

function removeEvent(oldCalendarId, userId, db, options) {
    if (!oldCalendarId) {
        return;
    }
    var params = [
        {"event": { "eventId": oldCalendarId}, "type": "delete", "userId": userId}
    ];
    return db.invokeFunction(Constants.Modules.GoogleCalendarMappings.GOOGLE_CALENDER_SERVICE_FUNCTION, params, options).fail(function (err) {
        var errMessage = err.message || err;
        if (errMessage !== "Resource has been deleted") {
            throw err;
        }
    })
}

function findEndDate(startDate, endDateExp, durationExp, document) {
    if (endDateExp) {
        if (document.get(endDateExp)) {
            return document.get(endDateExp);
        } else {
            return new Date(startDate.getTime() + (10 * 60 * 1000));
        }
    } else if (durationExp) {
        if (document.get(durationExp)) {
            var newDoc = document.getDocuments(durationExp);
            if (newDoc) {
                var timeInMinutes = newDoc.get(Constants.Modules.Udt.Duration.CONVERTEDVALUE);
                return new Date(startDate.getTime() + (timeInMinutes * 60 * 1000));
            }
        } else {
            return new Date(startDate.getTime() + (10 * 60 * 1000));
        }
    } else {
        return new Date(startDate.getTime() + (10 * 60 * 1000));
    }
}