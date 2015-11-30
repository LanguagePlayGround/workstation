/**
 * Created by ashu on 11/12/14.
 */

var Constants = require("./Constants.js");
var Utility = require("ApplaneCore/apputil/util.js");

exports.trackEmail = function (db, options) {
    return trackLeadsEmails({}, db, options)
};

exports.emailTrackingService = function (params, db, options) {
    return trackLeadsEmails(params, db, options)
};

function trackLeadsEmails(params, db, options) {
    var ErrorHandler = require("./ErrorHandler.js");
    return db.query({"$collection": Constants.Admin.EMAILTRACKERS}).then(
        function (data) {
            var emailTrackers = data.result;
            if (emailTrackers.length === 0) {
                return;
            }
            return Utility.iterateArrayWithPromise(emailTrackers, function (index, emailTrackerFunction) {
                return db.query({$collection: Constants.Admin.USERS, $filter: {mailtrackenabled: true, googleRefreshToken: {$exists: true}}, $fields: {mailtrackstartdate: 1, googleRefreshToken: 1, username: 1}, $modules: {"Role": 0}, $events: false}).then(function (users) {
                    return Utility.iterateArrayWithPromise(users.result, function (index, user) {
                        var startDate = user[Constants.Admin.Users.MAIL_TRACK_START_DATE] || new Date();
                        var filter = "newer:" + (require("moment")(startDate).format("YYYY/MM/DD"));
                        var readMailEvent = {userId: "me", maxResults: 100, q: filter};
                        return readMail(readMailEvent, user, db, options).then(function (mails) {
                            return Utility.iterateArrayWithPromise(mails, function (index, mail) {
                                var parameters = {mail: mail};
                                if (mail.participants && mail.participants.length > 0) {
                                    var functionToInvoke = params.function || emailTrackerFunction[Constants.Admin.EmailTrackers.FUNCTION];
                                    return db.invokeFunction(functionToInvoke, [parameters]).fail(function (err) {
                                        return ErrorHandler.handleError({"message": err.message || err, "parameters": JSON.stringify(parameters), "stack": err.stack}, ErrorHandler.TYPE.EMAIL_TRACKER, db, {user: user});
                                    })
                                } else {
                                    // do not find participent in case of chat where to/cc not found.Also do not manage currentUser as participant.
                                }

                            })
                        }).then(function () {
                            return db.update([
                                {$collection: Constants.Admin.USERS, $update: [
                                    {_id: user["_id"], $set: {mailtrackstartdate: new Date()}}
                                ], $modules: {"Role": 0}, $events: false}
                            ]);
                        }).fail(function (err) {
                            var errorMessage = {"message": err.message || err, "parameters": JSON.stringify({"username": user.username, "database": db.db.databaseName}), "stack": err.stack};
                            return ErrorHandler.handleError(errorMessage, ErrorHandler.TYPE.EMAIL_TRACKER, db, {user: user});
                        })
                    });
                });
            });
        })
}

function readMail(readMailEvent, user, db, options) {
    var host = options && options.domain ? options.domain : "business.applane.com";
    var OAuth2 = require("googleapis").auth.OAuth2;
    var Config = require("../Config.js").config;
    var oauth2Client = new OAuth2(Config.GOOGLE_CLIENT_ID, Config.GOOGLE_CLIENT_SECRET, "http://" + host + Config.GOOGLE_CALLBACK_URL);
    var googleRefreshToken = user.googleRefreshToken;
    var messages = [];
    return require("./GoogleApiServices.js").refreshOAuthToken(oauth2Client, googleRefreshToken).then(function () {
        var gmailClient = require("googleapis").gmail({ version: 'v1', auth: oauth2Client });
        return retreiveMessages(gmailClient, readMailEvent, messages, user, db);
    }).then(function () {
        return decodeMessages(messages, user);
    }).then(function (decodedMsgs) {
        messages = undefined;
        return decodedMsgs;
    })
}

function retreiveMessages(gmailClient, readMailEvent, messages, user, db) {
    var d = require("q").defer();
    gmailClient.users.messages.list(readMailEvent, function (err, result) {
        if (err) {
            d.reject(err);
            return;
        }
        getMail(gmailClient, result, user, db).then(function (mailMessages) {
            messages.push.apply(messages, mailMessages);
            if (result.nextPageToken) {
                readMailEvent.pageToken = result.nextPageToken;
                return retreiveMessages(gmailClient, readMailEvent, messages, user, db);
            }
        }).then(function () {
            d.resolve();
        }).fail(function (err) {
            d.reject(err);
        });
    });
    return d.promise;
}

function getMail(gmailClient, result, user, db) {
    var messages = [];
    return Utility.iterateArrayWithPromise(result.messages, function (i, val) {
        var msgListItemId = val.id;
        return db.update({$collection: Constants.Admin.GMAIL_MESSAGES, $insert: {messageid: msgListItemId, user: {username: user.username, userid: user._id}}}).then(function () {
            var getMsgEvent = {userId: "me", id: msgListItemId};
            var d = require("q").defer();
            gmailClient.users.messages.get(getMsgEvent, function (err, res) {
                if (err) {
                    d.reject(err);
                    return;
                }
                messages.push(res);
                d.resolve(res);
            });
            return d.promise;
        }).fail(function (err) {
            if (err.code === 11000) {
                // skip err in case of message already read.
            } else {
                throw err;
            }
        })
    }).then(function () {
        return messages;
    });
}

function decodeMessages(messages, user) {
    var decodedMsgs = [];
    for (var i = 0; i < messages.length; i++) {
        var msg = messages[i];
        var newMsg = {};
        if (msg.snippet) {
            newMsg.label = msg.snippet;
        }
        if (msg.id) {
            newMsg.messageId = msg.id;
        }
        if (msg.threadId) {
            newMsg.threadId = msg.threadId;
        }
        if (msg.payload) {
            var payload = msg.payload;
            if (payload.headers) {
                newMsg.head = extractHeaders(payload.headers);
            }
            var bodyDetail = {body: ""};
            extractBody(payload, bodyDetail);
            newMsg.body = bodyDetail.body;
            reformatMessage(newMsg, user);
        }
        decodedMsgs.push(newMsg);
    }
    return decodedMsgs;
}

function reformatMessage(msg, user) {
    var head = msg.head;
    if (head && head.date) {
        msg.date = new Date(head.date);
        delete head.date;
    }
    if (head && head.to) {
        head.to = getIdArray(head.to);
    }
    if (head && head.cc) {
        head.cc = getIdArray(head.cc);
    }
    if (head && head.from) {
        head.from = [getFormattedEmailId(head.from)];
    }
    if (user) {
        msg.user = {_id: user._id, username: user.username};
    }
    if (head && msg.user && msg.user.username) {
        msg.participants = [];
        populateParticipants(head, msg.user.username, msg.participants);
    }
}

function extractHeaders(payloadHeaders) {
    var headers = {};
    for (var i = 0; i < payloadHeaders.length; i++) {
        var header = payloadHeaders[i];
        if (header.name == "Date") {
            headers.date = header.value;
        }
        if (header.name == "Subject") {
            headers.subject = header.value;
        }
        if (header.name == "From") {
            headers.from = header.value;
        }
        if (header.name == "To") {
            headers.to = header.value;
        }
        if (header.name == "Cc") {
            headers.cc = header.value;
        }
        // handle Others headers if necessary
    }
    return headers;
}

function extractBody(payload, bodyDetail) {
    if (payload.parts) {
        var parts = payload.parts;
        var process = false;
        return Utility.iterateArrayWithPromise(parts, function (index, part) {
            var multiPart = part.parts;
            if (multiPart || !process) {
                return extractBody(part, bodyDetail).then(function () {
                    if (!multiPart) {
                        process = true;
                    }
                })
            }
        });
    } else {
        var skipTypes = ["image/jpeg", "image/png", "image/gif", "application/zip", "application/x-javascript", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "application/vnd.android.package-archive", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"];
        var d = require("q").defer();
        if (payload.body && payload.body.size > 0) {
            if ((payload.mimeType == "text/plain" || payload.mimeType == "text/html")) {
                bodyDetail.body = decodeBase64(payload.body);
            } else if (skipTypes.indexOf(payload.mimeType) > -1) {
                // skipping types defined in skipTypes
            } else {
                console.error("unhandled mimetype : " + payload.mimeType + " when !payload.parts for payload  >> " + JSON.stringify(payload));
            }
        }
        d.resolve();
        return d.promise;
    }
}

function decodeBase64(body) {
    return body.data ? new Buffer(body.data, "base64").toString("utf8") : "";
}


function populateParticipants(head, username, participants) {
    if (head.from) {
        populateParticipantsInner(head.from, username, participants);
    }
    if (head.to) {
        populateParticipantsInner(head.to, username, participants);
    }
    if (head.cc) {
        populateParticipantsInner(head.cc, username, participants);
    }
}

function populateParticipantsInner(array, username, participants) {
    for (var i = 0; i < array.length; i++) {
        if (array[i] !== username && participants.indexOf(username) === -1) {
            participants.push(array[i]);
        }
    }
}

function getIdArray(string) {
    string = string.split(",");
    for (var i = 0; i < string.length; i++) {
        string[i] = getFormattedEmailId(string[i])
    }
    return string;
}

function getFormattedEmailId(id) {
    if (id.indexOf('<') >= 0 && id.indexOf('>') >= 0) {
        id = id.substring((id.indexOf('<') + 1), id.indexOf('>'));
    }
    return id;
}

