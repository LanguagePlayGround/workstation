Constants = require("ApplaneDB/lib/Constants.js");
var Utils = require("ApplaneCore/apputil/util.js");
exports.onPreSave = function (document, db, options) {
    if ((document.get(Constants.Admin.Comments.REPLY_TO_ID)) !== undefined && document.type !== "delete") {
        var collection = document.get(Constants.Admin.Comments.COLLECTION);
        var fkDoc = document.getDocuments(Constants.Admin.Comments.FK);
        var _id = fkDoc.get("_id");
        var from = document.get(Constants.Admin.Comments.FROM);
        return db.query({$collection: Constants.Admin.COMMENTS, $filter: {"fk._id": _id, collection: collection}}).then(function (result) {
            if (result && result.result && result.result.length > 0) {
                var data = result.result;
                return Utils.iterateArrayWithPromise(data, function (index, row) {
                    var waitingForReply = row[Constants.Admin.Comments.WAITING_FOR_REPLY_BY];
                    if (waitingForReply !== undefined) {
                        var index = Utils.isExists(waitingForReply, from, "_id")
                        if (index >= 0) {
                            return db.update({$collection: Constants.Admin.COMMENTS, "$update": [
                                {_id: row._id, "$unset": {"waitingForReplyBy": ""}}
                            ]})
                        }
                    }
                });
            }
        }).then(function () {
                return insertParticipantDocs(document);
            }).then(function () {
                populateWaitingForReplyBy(document);
            });
    } else if (document.type !== "delete") {
        populateWaitingForReplyBy(document);
        insertParticipantDocs(document);
    }
}

function insertParticipantDocs(document, participants) {
    var participants = manageParticipants(document);
    for (var i = 0; i < participants.length; i++) {
        document.insertDocument("participants", participants[i]);
    }
}

function manageParticipants(document) {
    var participants = [];
    if (document) {
        var to = document.getDocuments(Constants.Admin.Comments.TO, ["insert", "update"]);
        var users = [];
        if (to) {
            for (var i = 0; i < to.length; i++) {
                populateInnerParticipants(to[i], participants, users, false);
            }
        }
        var from = document.getDocuments(Constants.Admin.Comments.FROM, ["insert", "update"]);
        if (from) {
            populateInnerParticipants(from, participants, users, true);
        }
        var CC = document.getDocuments(Constants.Admin.Comments.CC, ["insert", "update"]);
        if (CC) {
            for (var i = 0; i < CC.length; i++) {
                populateInnerParticipants(CC[i], participants, users, false);
            }
        }
    }
    return participants;
}

function populateInnerParticipants(doc, participants, users, read) {
    if (doc) {
        var participant = {};
        var userId = doc.get("_id");
        if (users.indexOf(userId.toString()) < 0) {
            users.push(userId.toString());
            participant[Constants.Admin.Comments.Participants.USERID] = {_id: userId, username: doc.get("username")};
            participant[Constants.Admin.Comments.Participants.READ] = read;
            participants.push(participant);
        }
    }
}

function populateWaitingForReplyBy(document) {
    if (document.get(Constants.Admin.Comments.WAITING_FOR_REPLY)) {
        var toDocs = document.getDocuments(Constants.Admin.Comments.TO, ["insert", "update"]);
        var toUsers = [];
        for (var i = 0; i < toDocs.length; i++) {
            toUsers.push({_id: toDocs[i].get("_id")});
        }
        document.set(Constants.Admin.Comments.WAITING_FOR_REPLY_BY, toUsers);
    }
}