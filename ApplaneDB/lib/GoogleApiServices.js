/**
 * Created by ashu on 3/11/14.
 * MIME Types : http://en.wikipedia.org/wiki/Internet_media_type
 * Advance Search : https://support.google.com/mail/answer/7190?hl=en
 */
var Config = require("../Config.js").config;

exports.refreshOAuthToken = function (oauth2Client, refreshToken) {
    var d = require("q").defer();
    oauth2Client.refreshToken_(refreshToken, function (err, newTokens) {
        if (err) {
            d.reject(err);
            return;
        }
        oauth2Client.setCredentials(newTokens);
        d.resolve();
    });
    return d.promise;
};

exports.revokeOAuthToken = function (db, options) {
    var host = options && options.domain ? options.domain : "business.applane.com";
    return getOauthClient(host, db).then(function (oauth2Client) {
        var d = require("q").defer();
        oauth2Client.revokeCredentials(function (err, res) {
            if (err) {
                d.reject(err);
                return;
            }
            d.resolve();
        });
        return d.promise;
    }).then(function () {
        return db.update({$collection: "pl.users", $update: {_id: db.user._id, $unset: {googleRefreshToken: 1}}});
    });
};

function getOauthClient(host, db, user) {
    var OAuth2 = require("googleapis").auth.OAuth2;
    var oauth2Client = new OAuth2(Config.GOOGLE_CLIENT_ID, Config.GOOGLE_CLIENT_SECRET, "http://" + host + Config.GOOGLE_CALLBACK_URL);

    return getUserIfNotExist(db, user).then(function (usr) {
        var googleRefreshToken = usr["googleRefreshToken"];
        if (!googleRefreshToken) {
            throw new Error(" GoogleRefreshToken is undefined in for user " + usr.username || usr._id);
        } else {
            return require("./GoogleApiServices.js").refreshOAuthToken(oauth2Client, googleRefreshToken).then(function () {
                return oauth2Client;
            });
        }
    });
}

function getUserIfNotExist(db, user) {
    if (user) {
        var d = require("q").defer();
        d.resolve(user);
        return d.promise;
    } else {
        return db.query({$collection: "pl.users", $filter: {_id: db.user._id}, $fields: {googleRefreshToken: 1, username:1}}).then(function (data) {
            return data.result[0];
        });
    }

}


function insertEvent(calenderClient, calendarId, resource) {
    var d = require("q").defer();
    calenderClient.events.insert({calendarId: calendarId, resource: resource}, function (err, result) {
        if (err || result === null) {
            d.reject(err || result);
            return;
        }
        else {
            d.resolve(result);
        }
    });
    return d.promise;
}

function updateEvent(calenderClient, calendarId, resource, eventId) {
    var d = require("q").defer();
    calenderClient.events.update({calendarId: calendarId, eventId: eventId, resource: resource}, function (err, result) {
        if (err || result === null) {
            d.reject(err || result);
            return;
        }
        else {
            d.resolve(result);
        }
    });
    return d.promise;
}

function deleteEvent(calenderClient, calendarId, eventId) {
    var d = require("q").defer();
    calenderClient.events.delete({calendarId: calendarId, eventId: eventId}, function (err, result) {
        if (err || result === null) {
            d.reject(err);
            return;
        }
        d.resolve();
    });
    return d.promise;
}

function processEvent(calendarEvent, eventType, user, db, options) {
    if (eventType === "insert") {
        if (!calendarEvent.resource) {
            throw new Error(" resource is mandatory for CalendarEvent : Insert.");
        }
        if (!calendarEvent.resource.start || !calendarEvent.resource.end) {
            throw new Error(" Start & End is mandatory for resource in CalendarEvent : Insert.");
        }
    } else if (eventType === "delete") {
        if (!calendarEvent.eventId) {
            throw new Error(" eventId is mandatory for CalendarEvent : Delete.");
        }
    } else if (eventType === "update") {
        if (!calendarEvent.eventId || !calendarEvent.resource) {
            throw new Error(" eventId & resource are mandatory for  CalendarEvent : Update.");
        }
        if (!calendarEvent.resource.start || !calendarEvent.resource.end) {
            throw new Error(" Start & End is mandatory for resource in CalendarEvent : Update.");
        }
    } else {
        throw new Error(" This is not a valid calender event. Please rectify your calendarEvent : " + JSON.stringify(calendarEvent));
    }
    var calendarId = calendarEvent.id || 'primary';
    var host = options && options.domain ? options.domain : "business.applane.com";
    return getOauthClient(host, db, user).then(function (oauth2Client) {
        var calenderClient = require("googleapis").calendar({ version: 'v3', auth: oauth2Client });
        var resource = calendarEvent.resource;
        var eventId = calendarEvent.eventId;
        if (eventType === "insert") {
            return insertEvent(calenderClient, calendarId, resource);
        } else if (eventType === "update") {
            return updateEvent(calenderClient, calendarId, resource, eventId)
        } else if (eventType === "delete") {
            return deleteEvent(calenderClient, calendarId, eventId);
        } else {
            throw new Error(" Unsupported Event type : " + eventType);
        }
    });
}

exports.googleCalender = function (parameters, db, options) {
    var calendarEvent = parameters.event;
    var eventType = parameters.type;
    var userId = parameters.userId;
    if (!calendarEvent) {
        throw new Error(" calendarEvent is not defined for Google Calender Service.");
    }
    if (!eventType) {
        throw new Error("EventType is not defined for Google Calender Service");
    }
    if (!db) {
        throw new Error(" db is not defined for Google Calender Service");
    }
    if (!userId) {
        throw new Error(" user is not defined for Google Calender Service");
    }

    return db.query({$collection: "pl.users", $filter: {_id: userId}, $fields: {googleRefreshToken: 1, username: 1, calenderenabled: 1}}).then(function (users) {
        if (users && users.result && users.result.length > 0 && users.result[0]["calenderenabled"]) {
            return processEvent(calendarEvent, eventType, users.result[0], db, options);
        } else {
            return;
        }
    })
};


