var LIMIT = 50;
var SUGGESTION_LIMIT = 50;

//http://127.0.0.1:5100/rest/invoke?function=Suggestion.addSuggestion&parameters=[{"subject":"samsung","networkid":["54391d1a77356bdc0f755d6f"],"emoticon":1,"suggestion":"not worth to buy"}]&token=5438d6104c08dffc0c7528cb
exports.addSuggestion = function (params, db, options) {
    var Constants = require("./Constants.js");
    var SELF = require("./Suggestion.js");
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var Utils = require("ApplaneCore/apputil/util.js");
    var image = params[Constants.Collections.Suggestions.IMAGE];
    var subject = params[Constants.Collections.Suggestions.SUBJECT];

    var networks = params[Constants.Collections.NetworkSuggestions.NETWORK_ID];
    if (!networks || networks.length == 0) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.NetworkSuggestions.NETWORK_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }

    if (subject) {
        subject = subject.trim();
    }
    if (!subject) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.Suggestions.SUBJECT + "]", Constants.Codes.Errors.MANDATORY_FIELDS)
    }
    params[Constants.Collections.Suggestions.SUBJECT] = subject;

    var emoticon = params[Constants.Collections.UserSuggestions.EMOTICON];
    if (emoticon == undefined) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.UserSuggestions.EMOTICON + "]", Constants.Codes.Errors.MANDATORY_FIELDS)

    }

    var suggestion = params[Constants.Collections.UserSuggestions.SUGGESTION];
    if (suggestion) {
        suggestion = suggestion.trim();
    }
    if (!suggestion) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.UserSuggestions.SUGGESTION + "]", Constants.Codes.Errors.MANDATORY_FIELDS)
    }


    //checking that subject already exists or not
    return SELF.getSuggestionId(params, db, options).then(
        function (suggestionId) {
            params[Constants.Collections.NetworkSuggestions.SUGGESTION_ID] = suggestionId;
            //updating networkSuggestions
            var tags = params[Constants.Collections.Suggestions.TAGS] || [];
            return ensureSuggestionTags(tags, db, suggestionId);
        }).then(function (tagIds) {
            params["tagIds"] = tagIds;
            return SELF.addNetworkSuggestions(params, db, options);
        })
}

//http://127.0.0.1:5100/rest/invoke?function=Suggestion.addNetworkSuggestions&parameters=[{"suggestionid":"54391bd577356bdc0f755d54","networkid":["54365d451fcbccc416ce5217"],"emoticon":2,"suggestion":"besstttt"}]&token=543b70dc1296e598173764f0
// pass the parameter :: suggestionDetail:true to get suggestionDetail true
exports.addNetworkSuggestions = function (params, db, options) {
    var Constants = require("./Constants.js");
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var Utils = require("ApplaneCore/apputil/util.js");
    var SELF = require("./Suggestion.js");
    var networks = params[Constants.Collections.NetworkSuggestions.NETWORK_ID];
    if (networks && !Array.isArray(networks)) {
        networks = [networks]
    }
    if (!networks || networks.length == 0) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.NetworkSuggestions.NETWORK_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }

    var firstNetwork = networks[0];
    var suggestionId = params[Constants.Collections.NetworkSuggestions.SUGGESTION_ID];
    if (!suggestionId) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.NetworkSuggestions.SUGGESTION_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }

    var emoticon = params[Constants.Collections.UserSuggestions.EMOTICON];
    return Utils.iterateArrayWithPromise(networks,
        function (index, network) {
            return addNetworkSuggestionIfNotExist(network, suggestionId, db).then(
                function (result) {
                    params[Constants.Collections.NetworkSuggestions.NETWORK_ID] = network;
                    return ensureNetworkSuggestionTags(params, db);
                }).then(function () {
                    return SELF.addUserSuggestions(params, db, options);
                })
        }).then(
        function () {
            var suggestionId = params[Constants.Collections.NetworkSuggestions.SUGGESTION_ID];
            var query = {$collection:Constants.Collections.Suggestions.COLLECTION, $filter:{_id:suggestionId}};
            return db.query(query);
        }).then(function (result) {
            if (params[Constants.Collections.NetworkSuggestions.SUGGESTION_DETAIL] === true) {
                params[Constants.Collections.NetworkSuggestions.NETWORK_ID] = firstNetwork;
                return SELF.getSuggestionDetail(params, db, options);
            } else {
                return result.result[0];
            }
        })
}

//http://127.0.0.1:5100/rest/invoke?function=Suggestion.addComment&parameters=[{"networkid":"54391d1a77356bdc0f755d6f","comment":"first comment","suggestionid":"543a1bf7d19306dc11d4d871"}]&token=543b70dc1296e598173764f0
// pass the parameter :: suggestionDetail:true to get suggestionDetail true
exports.addComment = function (params, db, options) {
    var Constants = require("./Constants.js");
    var SELF = require("./Suggestion.js");
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var networkId = params[Constants.Collections.UserComments.NETWORK_ID];
    if (!networkId) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.UserComments.NETWORK_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }

    var suggestionId = params[Constants.Collections.UserComments.SUGGESTION_ID];
    if (!suggestionId) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.UserComments.SUGGESTION_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }

    var comment = params[Constants.Collections.UserComments.COMMENT];
    if (comment) {
        comment = comment.trim();
    }
    if ((!comment) || comment.length == 0) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.UserComments.COMMENT + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }

    var subject = undefined;
    return getSubjectFromSuggestionId(suggestionId, db).then(
        function (subject1) {
            subject = subject1;
            var userCommentsUpdates = {$collection:Constants.Collections.UserComments.COLLECTION, $insert:{}};
            userCommentsUpdates.$insert[Constants.Collections.UserComments.SUGGESTION_ID] = {_id:suggestionId};
            userCommentsUpdates.$insert[Constants.Collections.UserComments.NETWORK_ID] = {_id:networkId};
            userCommentsUpdates.$insert[Constants.Collections.UserComments.CREATOR] = {_id:db.user._id};
            userCommentsUpdates.$insert[Constants.Collections.UserComments.COMMENT] = comment;
            userCommentsUpdates.$insert[Constants.Collections.UserComments.CREATED_ON] = new Date();
            return db.update(userCommentsUpdates);
        }).then(
        function (result) {
            var networkSuggestionUpdates = {};
            networkSuggestionUpdates[Constants.Collections.Suggestions.SUBJECT] = subject;
            networkSuggestionUpdates[Constants.Collections.NetworkSuggestions.SUGGESTION_ID] = suggestionId;
            networkSuggestionUpdates[Constants.Collections.NetworkSuggestions.NETWORK_ID] = networkId;
            networkSuggestionUpdates[Constants.Collections.NetworkSuggestions.TOTAL_COMMENTS] = 1;
            networkSuggestionUpdates[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY] = comment;
            networkSuggestionUpdates[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_TYPE] = "comment";
            return SELF.updateLastActivityInNetworkSuggestion(networkSuggestionUpdates, db);
        }).then(function (result) {
            if (params[Constants.Collections.NetworkSuggestions.SUGGESTION_DETAIL] === true) {
                return SELF.getSuggestionDetail(params, db, options);
            } else {
                return result;
            }
        })

}

//http://127.0.0.1:5100/rest/invoke?function=Suggestion.likeSuggestion&parameters=[{"suggestionid":"543a1bf7d19306dc11d4d871","networkid":"54391d1a77356bdc0f755d6f"}]&token=543bc4021acec6601f05d593
// pass the parameter :: suggestionDetail:true to get suggestionDetail true
exports.likeSuggestion = function (params, db, options) {
    var Constants = require("./Constants.js");
    var SELF = require("./Suggestion.js");
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var networkId = params[Constants.Collections.UserLikes.NETWORK_ID];
    if (!networkId) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.UserLikes.NETWORK_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }
    var suggestionId = params[Constants.Collections.UserSuggestions.SUGGESTION_ID];
    if (!suggestionId) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.UserLikes.SUGGESTION_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }
    var likeAlready = false;
    return ensureUserLike(suggestionId, networkId, db).then(
        function (userLike) {
            if (userLike) {
                likeAlready = true;
                return;
            }
            params.like = true;
            return updateUserLikes(params, db);
        }).then(
        function () {
            if (likeAlready) {
                return;
            }
            return updateLastActivityForLike(params, db);
        }).then(function (result) {
            if (params[Constants.Collections.NetworkSuggestions.SUGGESTION_DETAIL] === true) {
                return SELF.getSuggestionDetail(params, db, options);
            } else {
                return result;
            }
        })
}

//http://127.0.0.1:5100/rest/invoke?function=Suggestion.unlikeSuggestion&parameters=[{"suggestionid":"543a1bf7d19306dc11d4d871","networkid":"54391d1a77356bdc0f755d6f"}]&token=543bc4021acec6601f05d593
// pass the parameter :: suggestionDetail:true to get suggestionDetail true
exports.unlikeSuggestion = function (params, db, options) {
    var Constants = require("./Constants.js");
    var SELF = require("./Suggestion.js");
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var networkId = params[Constants.Collections.UserLikes.NETWORK_ID];
    if (!networkId) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.UserLikes.NETWORK_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }
    var suggestionId = params[Constants.Collections.UserSuggestions.SUGGESTION_ID];
    if (!suggestionId) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.UserLikes.SUGGESTION_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }
    var unlikeAlready = false;
    return ensureUserLike(suggestionId, networkId, db).then(
        function (userLike) {
            if (!userLike) {
                unlikeAlready = true;
                return;
            }
            params.like = false;
            return updateUserUnLikes(userLike, db);
        }).then(
        function () {
            if (unlikeAlready) {
                return;
            }
            return updateLastActivityForLike(params, db);
        }).then(function (result) {
            if (params[Constants.Collections.NetworkSuggestions.SUGGESTION_DETAIL] === true) {
                return SELF.getSuggestionDetail(params, db, options);
            } else {
                return result;
            }
        })
}

//http://127.0.0.1:5100/rest/invoke?function=Suggestion.addUserSuggestions&parameters=[{"suggestionid":"54392d113fffb0181258d491","networkid":"54391d1a77356bdc0f755d6f","emoticon":3,"suggestion":"best phone ever ever"}]&token=543b70dc1296e598173764f0
exports.addUserSuggestions = function (params, db, options) {
    var Constants = require("./Constants.js");
    var SELF = require("./Suggestion.js");
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var networkId = params[Constants.Collections.UserSuggestions.NETWORK_ID];
    if (!networkId) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.UserSuggestions.NETWORK_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }
    var suggestionId = params[Constants.Collections.UserSuggestions.SUGGESTION_ID];
    if (!suggestionId) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.UserSuggestions.SUGGESTION_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }
    var newSuggestion = params[Constants.Collections.UserSuggestions.SUGGESTION];
    if (!newSuggestion) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.UserSuggestions.SUGGESTION + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }
    var newEmoticon = params[Constants.Collections.UserSuggestions.EMOTICON];
    var subject = params[Constants.Collections.Suggestions.SUBJECT];
    return getSubjectForSuggestion(subject, suggestionId, db).then(
        function (subjectName) {
            subject = subjectName;
            return ensureUserSuggestion(params, db);
        }).then(function (result) {
//            var emoticon = userSuggestion.result[0][Constants.Collections.UserSuggestions.EMOTICON];
            var suggestion = params[Constants.Collections.NetworkSuggestions.SUGGESTION_ID];

            var lastActivityParams = {}
            lastActivityParams[Constants.Collections.NetworkSuggestions.SUGGESTION_ID] = suggestionId;
            lastActivityParams[Constants.Collections.NetworkSuggestions.NETWORK_ID] = networkId;
            lastActivityParams[Constants.Collections.NetworkSuggestions.TOTAL_EMOTICON] = result.emoticon;
            lastActivityParams[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_TYPE] = "suggest";
            lastActivityParams[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY] = newSuggestion;
            lastActivityParams[Constants.Collections.Suggestions.SUBJECT] = subject;
            lastActivityParams.newSuggestion = result.newSuggestion;

            return SELF.updateLastActivityInNetworkSuggestion(lastActivityParams, db);

        })
}

function getSubjectForSuggestion(subject, suggestionId, db) {
    if (subject) {
        var d = require("q").defer();
        d.resolve(subject);
        return d.promise;
    }
    return getSubjectFromSuggestionId(suggestionId, db);
}


exports.updateLastActivityInNetworkSuggestion = function (params, db) {
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var SELF = require("./Suggestion.js");
    var Constants = require("./Constants.js");
    var Utils = require("ApplaneCore/apputil/util.js");
    var networkId = params[Constants.Collections.NetworkSuggestions.NETWORK_ID];
    var suggestionId = params[Constants.Collections.NetworkSuggestions.SUGGESTION_ID];
    var emoticon = params[Constants.Collections.NetworkSuggestions.TOTAL_EMOTICON];
    var totalLikes = params[Constants.Collections.NetworkSuggestions.TOTAL_LIKES];
    var totalComments = params[Constants.Collections.NetworkSuggestions.TOTAL_COMMENTS];
    var lastActivity = getLastActivityName(params, "networkSuggestion", undefined, db);
    var lastActivityType = params[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_TYPE];

    var networkSuggestionUpdates = {$set:{}};

    if (params.newSuggestion) {
        networkSuggestionUpdates.$inc = networkSuggestionUpdates.$inc || {};
        networkSuggestionUpdates.$inc[Constants.Collections.NetworkSuggestions.TOTAL_SUGGESTIONS] = 1;
    }
    if (emoticon !== undefined) {
        networkSuggestionUpdates.$inc = networkSuggestionUpdates.$inc || {};
        networkSuggestionUpdates.$inc[Constants.Collections.NetworkSuggestions.TOTAL_EMOTICON] = emoticon;
    }
    if (totalLikes !== undefined) {
        networkSuggestionUpdates.$inc = networkSuggestionUpdates.$inc || {};
        networkSuggestionUpdates.$inc[Constants.Collections.NetworkSuggestions.TOTAL_LIKES] = totalLikes;
    }
    if (totalComments !== undefined) {
        networkSuggestionUpdates.$inc = networkSuggestionUpdates.$inc || {};
        networkSuggestionUpdates.$inc[Constants.Collections.NetworkSuggestions.TOTAL_COMMENTS] = totalComments;
    }
    networkSuggestionUpdates.$set[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_ON] = new Date();
    networkSuggestionUpdates.$set[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_BY] = {_id:db.user._id};
    networkSuggestionUpdates.$set[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY] = lastActivity;
    networkSuggestionUpdates.$set[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_TYPE] = lastActivityType;

    var updates = {$collection:Constants.Collections.NetworkSuggestions.COLLECTION, $update:networkSuggestionUpdates};

    //get networksuggestionid on the basis of networkid and suggestionid
    var query = {$collection:Constants.Collections.NetworkSuggestions.COLLECTION, $fields:{_id:1}, $filter:{}};
    query.$filter[Constants.Collections.NetworkSuggestions.NETWORK_ID ] = networkId;
    query.$filter[Constants.Collections.NetworkSuggestions.SUGGESTION_ID ] = suggestionId;
    return db.query(query).then(function (result) {

        var networkSuggestionId = result.result[0]._id;
        networkSuggestionUpdates._id = networkSuggestionId;
        return db.update(updates).then(function (result) {
            return SELF.updateLastActivityInNetwork(params, db);
        })
    })
}

exports.updateLastActivityInNetwork = function (params, db) {

    var Constants = require("./Constants.js");
    var networkId = params[Constants.Collections.NetworkSuggestions.NETWORK_ID];
    var lastActivity = getLastActivityName(params, "network", undefined, db);
    var lastActivityType = params[Constants.Collections.Networks.LAST_ACTIVITY_TYPE];

    var updates = {$collection:Constants.Collections.Networks.COLLECTION, $update:{ $set:{}}};
    updates.$update._id = networkId;
    updates.$update.$set[Constants.Collections.Networks.LAST_ACTIVITY_ON] = new Date();
    updates.$update.$set[Constants.Collections.Networks.LAST_ACTIVITY_BY] = {_id:db.user._id};
    updates.$update.$set[Constants.Collections.Networks.LAST_ACTIVITY] = lastActivity;
    updates.$update.$set[Constants.Collections.Networks.LAST_ACTIVITY_TYPE] = lastActivityType;
    return db.update(updates).then(function () {
        sendNotifications(params, db.asyncDB())
    });
}


exports.getSuggestionId = function (params, db, options) {
    var Constants = require("./Constants.js");
    var query = {$collection:Constants.Collections.Suggestions.COLLECTION, $filter:{}, $fields:{_id:1}}
    query.$filter[Constants.Collections.Suggestions.SUBJECT] = params[Constants.Collections.Suggestions.SUBJECT];
    return db.query(query).then(function (result) {
        var data = result.result;
        if (data.length == 0) {
            //subject not found
            return ensureSuggestion(params, db);
        } else {
            return data[0]._id;
        }
    })

}

exports.updateLastActivity = function (params, db) {
    var Constants = require("./Constants.js");
    var SELF = require("./Suggestion.js");
    var networkId = params[Constants.Collections.UserLikes.NETWORK_ID];
    var suggestionId = params[Constants.Collections.UserSuggestions.SUGGESTION_ID];
    var subject = params[Constants.Collections.Suggestions.SUBJECT];
    var like = params.like;
    var lastActivityParams = {};
    if (like) {
        //case in which user likes a suggestion
        lastActivityParams[Constants.Collections.Suggestions.SUBJECT] = subject;
        lastActivityParams[Constants.Collections.NetworkSuggestions.TOTAL_LIKES] = 1;
        lastActivityParams[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY] = "like";
        lastActivityParams[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_TYPE] = "like";
    }
    else {
        //case in which user unlikes a suggestion
        lastActivityParams[Constants.Collections.Suggestions.SUBJECT] = subject;
        lastActivityParams[Constants.Collections.NetworkSuggestions.TOTAL_LIKES] = -1;
        lastActivityParams[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY] = "unlike";
        lastActivityParams[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_TYPE] = "unlike";
    }
    lastActivityParams[Constants.Collections.NetworkSuggestions.SUGGESTION_ID] = suggestionId;
    lastActivityParams[Constants.Collections.NetworkSuggestions.NETWORK_ID] = networkId;
    return SELF.updateLastActivityInNetworkSuggestion(lastActivityParams, db);

}

//http://127.0.0.1:5100/rest/invoke?function=Suggestion.getSuggestions&parameters=[{"networkid":"54391d1a77356bdc0f755d6f"}]&token=543bc4021acec6601f05d593
exports.getSuggestions = function (params, db) {

    var Constants = require("./Constants.js");
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var networkId = params[Constants.Collections.NetworkSuggestions.NETWORK_ID];
    if (!networkId) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.NetworkSuggestions.NETWORK_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }
    var query = {$collection:Constants.Collections.NetworkSuggestions.COLLECTION, $filter:{}, $fields:{}, $sort:{}};
    query.$filter[Constants.Collections.NetworkSuggestions.NETWORK_ID] = networkId;
    query.$fields[Constants.Collections.NetworkSuggestions.TOTAL_LIKES] = 1;
    query.$fields[Constants.Collections.NetworkSuggestions.TOTAL_COMMENTS] = 1;
    query.$fields[Constants.Collections.NetworkSuggestions.TOTAL_SUGGESTIONS] = 1;
    query.$fields[Constants.Collections.NetworkSuggestions.TOTAL_EMOTICON] = 1;
    query.$fields[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_ON] = 1;
    query.$fields[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_BY] = 1;
    query.$fields[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY] = 1;
    query.$fields[Constants.Collections.NetworkSuggestions.IMAGE] = 1;
    query.$fields[Constants.Collections.NetworkSuggestions.SUGGESTION_ID + "." + Constants.Collections.Suggestions.SUBJECT] = 1;
    query.$fields[Constants.Collections.NetworkSuggestions.SUGGESTION_ID + "." + Constants.Collections.Suggestions.IMAGE] = 1;
    var subqueryFilter = {};
    subqueryFilter[Constants.Collections.UserLikes.NETWORK_ID] = networkId;
    subqueryFilter[Constants.Collections.UserLikes.CREATOR] = db.user._id;
    query.$fields["userLikes"] = {"$query":{"$collection":Constants.Collections.UserLikes.COLLECTION, "$filter":subqueryFilter, "$fields":{_id:1}}, "$fk":"suggestionid._id", "$parent":"suggestionid._id"};
    query.$sort[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_ON] = -1;
    if (params.skip !== undefined) {
        query.$skip = params.skip;
    }
    query.$limit = params.limit !== undefined ? params.limit : SUGGESTION_LIMIT;
    var hasNext = undefined;
    var nextCursor = (query.$skip || 0) + query.$limit;
    return db.query(query).then(function (result) {
        result.dataInfo = result.dataInfo || {};
        result.dataInfo.skip = nextCursor;
        for (var i = 0; i < result.result.length; i++) {
            result.result[i][Constants.Collections.Suggestions.SUBJECT] = result.result[i][Constants.Collections.NetworkSuggestions.SUGGESTION_ID][Constants.Collections.Suggestions.SUBJECT];
            result.result[i][Constants.Collections.Suggestions.IMAGE] = result.result[i][Constants.Collections.NetworkSuggestions.SUGGESTION_ID][Constants.Collections.Suggestions.IMAGE];
            var totalSuggestions = result.result[i][Constants.Collections.NetworkSuggestions.TOTAL_SUGGESTIONS];
            var totalEmoticon = result.result[i][Constants.Collections.NetworkSuggestions.TOTAL_EMOTICON];
            if (totalEmoticon > 0 && totalSuggestions > 0) {
                result.result[i][Constants.Collections.Suggestions.EMOTICON] = Number(totalEmoticon / totalSuggestions).toFixed(0);
            }

            if (result.result[i]["userLikes"]) {
                result.result[i][Constants.Collections.NetworkSuggestions.USER_LIKE] = true;
            }
        }
        return result;
    })
}

//http://127.0.0.1:5100/rest/invoke?function=Suggestion.getLikes&parameters=[{"networkid":"54367917fda2a59812000052","suggestionid":"543f96d1045104361030af69"}]&token=543dfc19399a2af30ada9c4f
exports.getLikes = function (params, db, options) {
    var Constants = require("./Constants.js");
    var suggestionId = params[Constants.Collections.UserLikes.SUGGESTION_ID];
    var networkId = params[Constants.Collections.UserLikes.NETWORK_ID];
    var filter = {};
    filter[Constants.Collections.UserLikes.SUGGESTION_ID] = suggestionId;
    filter[Constants.Collections.UserLikes.NETWORK_ID] = networkId;
    var fields = {};
    fields[Constants.Collections.UserLikes.CREATOR + "." + Constants.Collections.Users.FULL_NAME] = 1;
    fields[Constants.Collections.UserLikes.CREATOR + "." + Constants.Collections.Users.IMAGE] = 1;
    fields[Constants.Collections.UserLikes.CREATED_ON] = 1;
    fields[Constants.Collections.UserLikes.NETWORK_ID] = 1;
    fields[Constants.Collections.UserLikes.SUGGESTION_ID] = 1;
    return db.query({$collection:Constants.Collections.UserLikes.COLLECTION, $fields:fields, $filter:filter})
}

//http://127.0.0.1:5100/rest/invoke?function=Suggestion.getComments&parameters=[{"networkid":"54367917fda2a59812000052","suggestionid":"543f96d1045104361030af69"}]&token=543dfc19399a2af30ada9c4f
exports.getComments = function (params, db, options) {
    var Constants = require("./Constants.js");
    var suggestionId = params[Constants.Collections.UserComments.SUGGESTION_ID];
    var networkId = params[Constants.Collections.UserComments.NETWORK_ID];
    var filter = {};
    filter[Constants.Collections.UserComments.SUGGESTION_ID] = suggestionId;
    filter[Constants.Collections.UserComments.NETWORK_ID] = networkId;
    var fields = {};
    fields[Constants.Collections.UserComments.COMMENT] = 1;
    fields[Constants.Collections.UserLikes.CREATOR + "." + Constants.Collections.Users.IMAGE] = 1;
    fields[Constants.Collections.UserLikes.CREATOR + "." + Constants.Collections.Users.FULL_NAME] = 1;
    fields[Constants.Collections.UserLikes.CREATED_ON] = 1;
    fields[Constants.Collections.UserLikes.NETWORK_ID] = 1;
    fields[Constants.Collections.UserLikes.SUGGESTION_ID] = 1;
    return db.query({$collection:Constants.Collections.UserComments.COLLECTION, $fields:fields, $filter:filter})
}

//http://127.0.0.1:5100/rest/invoke?function=Suggestion.getUserSuggestions&parameters=[{"networkid":"54367917fda2a59812000052","suggestionid":"543f96d1045104361030af69"}]&token=543dfc19399a2af30ada9c4f
exports.getUserSuggestions = function (params, db, options) {
    var Constants = require("./Constants.js");
    var suggestionId = params[Constants.Collections.UserSuggestions.SUGGESTION_ID];
    var networkId = params[Constants.Collections.UserSuggestions.NETWORK_ID];
    var filter = {};
    filter[Constants.Collections.UserSuggestions.SUGGESTION_ID] = suggestionId;
    filter[Constants.Collections.UserSuggestions.NETWORK_ID] = networkId;
    var fields = {};
    fields[Constants.Collections.UserSuggestions.EMOTICON] = 1;
    fields[Constants.Collections.UserSuggestions.SUGGESTION] = 1;
    fields[Constants.Collections.UserSuggestions.CREATOR + "." + Constants.Collections.Users.IMAGE] = 1;
    fields[Constants.Collections.UserSuggestions.CREATOR + "." + Constants.Collections.Users.FULL_NAME] = 1;
    fields[Constants.Collections.UserSuggestions.CREATED_ON] = 1;
    fields[Constants.Collections.UserSuggestions.NETWORK_ID] = 1;
    fields[Constants.Collections.UserSuggestions.SUGGESTION_ID] = 1;
    fields[Constants.Collections.UserSuggestions.LAST_ACTIVITY_ON] = 1;
    return db.query({$collection:Constants.Collections.UserSuggestions.COLLECTION, $fields:fields, $filter:filter});
}

//http://127.0.0.1:5100/rest/invoke?function=Suggestion.getUserSuggestions&parameters=[{"suggestionid":"543f96d1045104361030af69"}]&token=543dfc19399a2af30ada9c4f
exports.getSuggestionTags = function (params, db, options) {
    var Constants = require("./Constants.js");
    var suggestionId = params[Constants.Collections.UserSuggestions.SUGGESTION_ID];
    var filter = {};
    filter[Constants.Collections.SuggestionTags.SUGGESTION_ID] = suggestionId;
    var fields = {};
    fields[Constants.Collections.SuggestionTags.TAGID] = 1;
    fields[Constants.Collections.SuggestionTags.CREATOR + "." + Constants.Collections.Users.IMAGE] = 1;
    fields[Constants.Collections.SuggestionTags.CREATOR + "." + Constants.Collections.Users.FULL_NAME] = 1;
    fields[Constants.Collections.SuggestionTags.CREATED_ON] = 1;
    fields[Constants.Collections.SuggestionTags.SUGGESTION_ID] = 1;
    return db.query({$collection:Constants.Collections.SuggestionTags.COLLECTION, $fields:fields, $filter:filter});
}

//http://127.0.0.1:5100/rest/invoke?function=Suggestion.getUserSuggestions&parameters=[{"networkid":"54367917fda2a59812000052","suggestionid":"543f96d1045104361030af69"}]&token=543dfc19399a2af30ada9c4f
exports.getNetworkSuggestionTags = function (params, db, options) {
    var Constants = require("./Constants.js");
    var suggestionId = params[Constants.Collections.NetworkSuggestionTags.SUGGESTION_ID];
    var networkId = params[Constants.Collections.NetworkSuggestionTags.NETWORK_ID];
    var filter = {};
    filter[Constants.Collections.NetworkSuggestionTags.SUGGESTION_ID] = suggestionId;
    filter[Constants.Collections.NetworkSuggestionTags.NETWORK_ID] = networkId;
    var fields = {};
    fields[Constants.Collections.NetworkSuggestionTags.TAGID] = 1;
    fields[Constants.Collections.NetworkSuggestionTags.CREATOR + "." + Constants.Collections.Users.IMAGE] = 1;
    fields[Constants.Collections.NetworkSuggestionTags.CREATOR + "." + Constants.Collections.Users.FULL_NAME] = 1;
    fields[Constants.Collections.NetworkSuggestionTags.CREATED_ON] = 1;
    fields[Constants.Collections.NetworkSuggestionTags.SUGGESTION_ID] = 1;
    fields[Constants.Collections.NetworkSuggestionTags.NETWORK_ID] = 1;
    return db.query({$collection:Constants.Collections.NetworkSuggestionTags.COLLECTION, $fields:fields, $filter:filter});
}

//http://127.0.0.1:5100/rest/invoke?function=Suggestion.getSuggestionDetail&parameters=[{"networkid":"54367917fda2a59812000052","suggestionid":"543f96d1045104361030af69"}]&token=543dfc19399a2af30ada9c4f
exports.getSuggestionDetail = function (params, db, options) {
    var Constants = require("./Constants.js");
    var SELF = require("./Suggestion.js");
    var suggestionDetail = {};
    var suggestionId = params[Constants.Collections.UserComments.SUGGESTION_ID];
    var networkId = params[Constants.Collections.UserComments.NETWORK_ID];
    var filter = {};
    filter[Constants.Collections.NetworkSuggestions.SUGGESTION_ID] = suggestionId;
    filter[Constants.Collections.NetworkSuggestions.NETWORK_ID] = networkId;
    var fields = {};
    fields[Constants.Collections.NetworkSuggestions.COMMENT] = 1;
    fields[Constants.Collections.NetworkSuggestions.CREATOR + "." + Constants.Collections.Users.IMAGE] = 1;
    fields[Constants.Collections.NetworkSuggestions.CREATOR + "." + Constants.Collections.Users.FULL_NAME] = 1;
    fields[Constants.Collections.NetworkSuggestions.CREATED_ON] = 1;
    fields[Constants.Collections.NetworkSuggestions.TOTAL_LIKES] = 1;
    fields[Constants.Collections.NetworkSuggestions.TOTAL_COMMENTS] = 1;
    fields[Constants.Collections.NetworkSuggestions.TOTAL_SUGGESTIONS] = 1;
    fields[Constants.Collections.NetworkSuggestions.SUGGESTION_ID + "." + Constants.Collections.Suggestions.SUBJECT] = 1;
    fields[Constants.Collections.NetworkSuggestions.SUGGESTION_ID + "." + Constants.Collections.Suggestions.IMAGE] = 1;
    fields[Constants.Collections.NetworkSuggestions.NETWORK_ID] = 1;
    fields[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY] = 1;
    fields[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_BY] = 1;
    fields[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_ON] = 1;
    fields[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_TYPE] = 1;
    var subqueryFilter = {};
    subqueryFilter[Constants.Collections.UserLikes.NETWORK_ID] = networkId;
    subqueryFilter[Constants.Collections.UserLikes.CREATOR] = db.user._id;
    fields["userLikes"] = {"$query":{"$collection":Constants.Collections.UserLikes.COLLECTION, "$filter":subqueryFilter, "$fields":{_id:1}}, "$fk":"suggestionid._id", "$parent":"suggestionid._id"};
    return db.query({$collection:Constants.Collections.NetworkSuggestions.COLLECTION, $fields:fields, $filter:filter}).then(
        function (result) {
            if (result && result.result && result.result.length > 0) {
                var result = result.result[0];
                result[Constants.Collections.Suggestions.SUBJECT] = result[Constants.Collections.NetworkSuggestions.SUGGESTION_ID][Constants.Collections.Suggestions.SUBJECT];
                result[Constants.Collections.Suggestions.IMAGE] = result[Constants.Collections.NetworkSuggestions.SUGGESTION_ID][Constants.Collections.Suggestions.IMAGE];
                var totalSuggestions = result[Constants.Collections.NetworkSuggestions.TOTAL_SUGGESTIONS];
                var totalEmoticon = result[Constants.Collections.NetworkSuggestions.TOTAL_EMOTICON];
                if (totalEmoticon > 0 && totalSuggestions > 0) {
                    result[Constants.Collections.NetworkSuggestions.EMOTICON] = Number(totalEmoticon / totalSuggestions).toFixed(0);
                }
                if (result["userLikes"]) {
                    result[Constants.Collections.NetworkSuggestions.USER_LIKE] = true;
                }
                suggestionDetail = result;
            }
        }).then(
        function () {
            return SELF.getUserSuggestions(params, db, options);
        }).then(
        function (userSuggestions) {
            if (userSuggestions && userSuggestions.result && userSuggestions.result.length > 0) {
                var uSuggestions = [];
                for (var i = 0; i < userSuggestions.result.length; i++) {
                    var us = {};
                    us[Constants.Collections.UserSuggestions.CREATOR] = userSuggestions.result[i][Constants.Collections.UserSuggestions.CREATOR];
                    us[Constants.Collections.UserSuggestions.CREATED_ON] = userSuggestions.result[i][Constants.Collections.UserSuggestions.CREATED_ON];
                    us[Constants.Collections.UserSuggestions.SUGGESTION] = userSuggestions.result[i][Constants.Collections.UserSuggestions.SUGGESTION];
                    us[Constants.Collections.UserSuggestions.EMOTICON] = userSuggestions.result[i][Constants.Collections.UserSuggestions.EMOTICON];
                    us[Constants.Collections.UserSuggestions.LAST_ACTIVITY_ON] = userSuggestions.result[i][Constants.Collections.UserSuggestions.LAST_ACTIVITY_ON];
                    uSuggestions.push(us);
                }
                suggestionDetail["userSuggestions"] = uSuggestions;
            }
        }).then(
        function () {
            return SELF.getLikes(params, db, options);
        }).then(
        function (userLikes) {
            if (userLikes && userLikes.result && userLikes.result.length > 0) {
                var uLikes = [];
                for (var i = 0; i < userLikes.result.length; i++) {
                    var uk = {};
                    uk[Constants.Collections.UserLikes.CREATOR] = userLikes.result[i][Constants.Collections.UserLikes.CREATOR];
                    uk[Constants.Collections.UserLikes.CREATED_ON] = userLikes.result[i][Constants.Collections.UserLikes.CREATED_ON];
                    uLikes.push(uk);
                }
                suggestionDetail["userLikes"] = uLikes;
            }
        }).then(
        function () {
            return SELF.getComments(params, db, options);
        }).then(
        function (userComments) {
            if (userComments && userComments.result && userComments.result.length > 0) {
                var uComments = [];
                for (var i = 0; i < userComments.result.length; i++) {
                    var uc = {};
                    uc[Constants.Collections.UserComments.COMMENT] = userComments.result[i][Constants.Collections.UserComments.COMMENT];
                    uc[Constants.Collections.UserComments.CREATED_ON] = userComments.result[i][Constants.Collections.UserComments.CREATED_ON];
                    uc[Constants.Collections.UserComments.CREATOR] = userComments.result[i][Constants.Collections.UserComments.CREATOR];
                    uComments.push(uc)
                }
                suggestionDetail["userComments"] = uComments;
            }
        }).then(
        function () {
            return SELF.getSuggestionTags(params, db, options);
        }).then(
        function (suggestionTags) {
            if (suggestionTags && suggestionTags.result && suggestionTags.result.length > 0) {
                var sTags = [];
                for (var i = 0; i < suggestionTags.result.length; i++) {
                    var st = {};
                    st[Constants.Collections.SuggestionTags.COMMENT] = suggestionTags.result[i][Constants.Collections.SuggestionTags.COMMENT];
                    st[Constants.Collections.SuggestionTags.CREATED_ON] = suggestionTags.result[i][Constants.Collections.SuggestionTags.CREATED_ON];
                    st[Constants.Collections.SuggestionTags.CREATOR] = suggestionTags.result[i][Constants.Collections.SuggestionTags.CREATOR];
                    sTags.push(st)
                }
                suggestionDetail["suggestionTags"] = sTags;
            }
        }).then(
        function () {
            return SELF.getNetworkSuggestionTags(params, db, options);
        }).then(
        function (networkSuggestionTags) {
            if (networkSuggestionTags && networkSuggestionTags.result && networkSuggestionTags.result.length > 0) {
                var nsTags = [];
                for (var i = 0; i < networkSuggestionTags.result.length; i++) {
                    var nst = {};
                    nst[Constants.Collections.NetworkSuggestionTags.COMMENT] = networkSuggestionTags.result[i][Constants.Collections.NetworkSuggestionTags.COMMENT];
                    nst[Constants.Collections.NetworkSuggestionTags.CREATED_ON] = networkSuggestionTags.result[i][Constants.Collections.NetworkSuggestionTags.CREATED_ON];
                    nst[Constants.Collections.NetworkSuggestionTags.CREATOR] = networkSuggestionTags.result[i][Constants.Collections.NetworkSuggestionTags.CREATOR];
                    nsTags.push(nst)
                }
                suggestionDetail["networkSuggestionTags"] = nsTags;
            }
        }).then(function () {
            return {"suggestionDetail":suggestionDetail};
        });
}

function ensureSuggestionTags(tags, db, suggestionId) {
    var Utils = require("ApplaneCore/apputil/util.js");
    var Constants = require("./Constants.js");
    var tagIds = [];
    return Utils.iterateArrayWithPromise(tags,
        function (index, tag) {
            var upsert = {};
            upsert[ Constants.Collections.Tags.TAG] = tag;
            return db.update({$collection:Constants.Collections.Tags.COLLECTION, $upsert:{$query:upsert}}).then(function (result) {
                if (result && result[Constants.Collections.Tags.COLLECTION] && result[Constants.Collections.Tags.COLLECTION].$upsert && result[Constants.Collections.Tags.COLLECTION].$upsert.length > 0) {
                    var tagid = result[Constants.Collections.Tags.COLLECTION].$upsert[0]._id;
                    tagIds.push(tagid);
                    var upsert = {};
                    upsert[Constants.Collections.SuggestionTags.TAGID] = {_id:tagid};
                    upsert[Constants.Collections.SuggestionTags.SUGGESTION_ID] = {_id:suggestionId};
                    return db.update({$collection:Constants.Collections.SuggestionTags.COLLECTION, $upsert:{$query:upsert}});
                }
            });
        }).then(function () {
            return tagIds;
        })
}


function ensureNetworkSuggestionTags(params, db) {
    var Constants = require("./Constants.js");
    var Utils = require("ApplaneCore/apputil/util.js");
    var tagIds = params.tagIds || [];
    var suggestionId = params[Constants.Collections.NetworkSuggestions.SUGGESTION_ID];
    var networkId = params[Constants.Collections.NetworkSuggestions.NETWORK_ID]
    return Utils.iterateArrayWithPromise(tagIds, function (index, tagid) {
        var upsert = {};
        upsert[Constants.Collections.NetworkSuggestionTags.TAGID] = {_id:tagid};
        upsert[Constants.Collections.NetworkSuggestionTags.SUGGESTION_ID] = {_id:suggestionId};
        upsert[Constants.Collections.NetworkSuggestionTags.NETWORK_ID] = {_id:networkId};
        return db.update({"$collection":Constants.Collections.NetworkSuggestionTags.COLLECTION, $upsert:{$query:upsert}});
    })
}


function addNetworkSuggestionIfNotExist(networkId, suggestionId, db) {
    var Constants = require("./Constants.js");

    var query = {$collection:Constants.Collections.NetworkSuggestions.COLLECTION, $filter:{}, $fields:{_id:1}};
    query.$filter[Constants.Collections.NetworkSuggestions.NETWORK_ID] = networkId;
    query.$filter[Constants.Collections.NetworkSuggestions.SUGGESTION_ID] = suggestionId;

    return db.query(query).then(function (result) {
        if (result.result.length == 0) {
            //if network suggestion does not exist
            var networkSuggestionUpdates = {$collection:Constants.Collections.NetworkSuggestions.COLLECTION, $insert:{}};
            networkSuggestionUpdates.$insert[Constants.Collections.NetworkSuggestions.NETWORK_ID] = {_id:networkId};
            networkSuggestionUpdates.$insert[Constants.Collections.NetworkSuggestions.SUGGESTION_ID] = {_id:suggestionId};
            networkSuggestionUpdates.$insert[Constants.Collections.NetworkSuggestions.CREATOR] = {_id:db.user._id};
            networkSuggestionUpdates.$insert[Constants.Collections.NetworkSuggestions.CREATED_ON] = new Date();
            return db.update(networkSuggestionUpdates);
        }
    })
}


function ensureUserSuggestion(params, db) {

    var SELF = require("./Suggestion.js");
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var Constants = require("./Constants.js");
    var query = {$collection:Constants.Collections.UserSuggestions.COLLECTION, $filter:{}, $fields:{_id:1}};
    query.$filter[Constants.Collections.UserSuggestions.NETWORK_ID] = params[Constants.Collections.UserSuggestions.NETWORK_ID];
    query.$filter[Constants.Collections.UserSuggestions.SUGGESTION_ID] = params[Constants.Collections.UserSuggestions.SUGGESTION_ID];
    query.$filter[Constants.Collections.UserSuggestions.CREATOR] = db.user._id;

    query.$fields[Constants.Collections.UserSuggestions.EMOTICON] = 1;
    query.$fields[Constants.Collections.UserSuggestions.SUGGESTION] = 1;

    var newSuggestion = params[Constants.Collections.UserSuggestions.SUGGESTION];
    var suggestionId = params[Constants.Collections.UserSuggestions.SUGGESTION_ID];
    var newEmoticon = params[Constants.Collections.UserSuggestions.EMOTICON];
    return db.query(query).then(function (result) {
        //case in which suggestion does not exist in user suggestion
        if (result.result.length == 0) {
            //if user suggestion does not exist
            var userSuggestionAdd = {$collection:Constants.Collections.UserSuggestions.COLLECTION, $insert:{}};
            userSuggestionAdd.$insert[Constants.Collections.UserSuggestions.NETWORK_ID] = {"_id":params[Constants.Collections.UserSuggestions.NETWORK_ID]};
            userSuggestionAdd.$insert[Constants.Collections.UserSuggestions.SUGGESTION_ID] = {"_id":suggestionId};
            userSuggestionAdd.$insert[Constants.Collections.UserSuggestions.CREATOR] = {"_id":db.user._id};
            userSuggestionAdd.$insert[Constants.Collections.UserSuggestions.CREATED_ON] = new Date();
            userSuggestionAdd.$insert[Constants.Collections.UserSuggestions.LAST_ACTIVITY_ON] = new Date();
            userSuggestionAdd.$insert[Constants.Collections.UserSuggestions.SUGGESTION] = newSuggestion;
            userSuggestionAdd.$insert[Constants.Collections.UserSuggestions.EMOTICON] = newEmoticon;
            return db.update(userSuggestionAdd).then(function (result) {
                return {emoticon:newEmoticon, "newSuggestion":true};
            })
        } else {
            var oldEmoticon = result.result[0][Constants.Collections.UserSuggestions.EMOTICON];
            var _idOfUserSuggestion = result.result[0]._id;
            var userSuggestionUpdates = {$collection:Constants.Collections.UserSuggestions.COLLECTION, $filter:{}, $update:{"_id":_idOfUserSuggestion, $set:{}} };
            userSuggestionUpdates.$update.$set[Constants.Collections.UserSuggestions.LAST_ACTIVITY_ON] = new Date();
            userSuggestionUpdates.$update.$set[Constants.Collections.UserSuggestions.SUGGESTION] = newSuggestion;
            userSuggestionUpdates.$update.$set[Constants.Collections.UserSuggestions.EMOTICON] = newEmoticon;

            return db.update(userSuggestionUpdates).then(function (result) {
                var valueToReturn = {"newSuggestion":false};
                if (oldEmoticon !== newEmoticon) {
                    valueToReturn.emoticon = (newEmoticon - oldEmoticon);
                }
                return valueToReturn;
            })
        }
    })
}

function getLastActivityName(params, type, networkName, db) {
    var Constants = require("./Constants.js");
    var lastActivityType = params[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY_TYPE];
    var lastActivityName = "";
    if (lastActivityType == "suggest") {
        lastActivityName = db.user.fullname + " suggested " + params[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY];

    } else if (lastActivityType == "like") {
        lastActivityName = db.user.fullname + " liked";
    } else if (lastActivityType == "unlike") {
        lastActivityName = db.user.fullname + " unliked";
    } else if (lastActivityType == "comment") {
        lastActivityName = db.user.fullname + " commented " + params[Constants.Collections.NetworkSuggestions.LAST_ACTIVITY];

    }
    if (type == "network") {
        lastActivityName += " on " + params[Constants.Collections.Suggestions.SUBJECT];
    }
    if (networkName) {
        lastActivityName += " in " + networkName;
    }
    return lastActivityName;

}


function sendNotifications(params, asyncDB) {
    var messageToSend = undefined;
    asyncDB.query({$collection:"networks", $filter:{_id:params.networkid}, $fields:{name:1}}).then(
        function (networkResult) {
            var networkName = networkResult.result[0].name;
            messageToSend = getLastActivityName(params, "network", networkName, asyncDB);
            return asyncDB.query({$collection:"networkMembers", $filter:{networkid:params.networkid, memberid:{$ne:asyncDB.user._id}}})
        }).then(
        function (networkMembers) {
            networkMembers = networkMembers.result;

            var groupmemberIds = [];
            for (var i = 0; i < networkMembers.length; i++) {
                var memberId = networkMembers[i].memberid._id;
                groupmemberIds.push(memberId);
            }
            return groupmemberIds;
        }).then(
        function (groupmemberIds) {
            return asyncDB.query({$collection:"devices", $filter:{"userid":{$in:groupmemberIds}}, $fields:{id:1}});
        }).then(
        function (devices) {
            devices = devices.result;
            var deviceRegIds = [];
            for (var i = 0; i < devices.length; i++) {
                deviceRegIds.push(devices[i].id);
            }
            return deviceRegIds;
        }).then(
        function (deviceRegIds) {
            return sendNotificationsByGCM(deviceRegIds, messageToSend);
        }).fail(
        function (err) {
        }).then(function () {
            asyncDB.clean();
        })

}

function sendNotificationsByGCM(deviceRegIds, messageToSend) {
    var GCM = require('node-gcm');
    var message = new GCM.Message({
        data:{
            message:messageToSend
        }
    });
    var sender = new GCM.Sender("AIzaSyCSi6WhbF3z3S2GjMf-bGtE4t3SRMkx3m4");
    sender.send(message, deviceRegIds, 3, function (err, result) {
        if (err) {
            console.log(err);
        }
    });
}

function ensureSuggestion(params, db) {
    var Constants = require("./Constants.js");
    return   getImage(params[Constants.Collections.Suggestions.IMAGE], db).then(
        function (imageObject) {
            var updates = {$collection:Constants.Collections.Suggestions.COLLECTION, $insert:{}};
            updates.$insert[Constants.Collections.Suggestions.SUBJECT] = params[Constants.Collections.Suggestions.SUBJECT];
            updates.$insert[Constants.Collections.Suggestions.IMAGE] = imageObject;
            updates.$insert[Constants.Collections.Suggestions.CREATOR] = {_id:db.user._id};
            updates.$insert[Constants.Collections.Suggestions.CREATED_ON] = new Date();
            return db.update(updates);
        }).then(function (result) {
            return result[ Constants.Collections.Suggestions.COLLECTION].$insert[0]._id;
        })
}

function getImage(image, db) {
    if (typeof image === "string") {
        return db.invokeFunction("ImageLoader.downloadImage", [
            {url:image}
        ]);
    } else {
        var q = require("q");
        var d = q.defer();
        d.resolve(image);
        return d.promise;
    }
}

function updateUserLikes(params, db) {
    var Constants = require("./Constants.js");
    var networkId = params[Constants.Collections.UserLikes.NETWORK_ID];
    var suggestionId = params[Constants.Collections.UserSuggestions.SUGGESTION_ID];
    var userLikesUpdates = {$collection:Constants.Collections.UserLikes.COLLECTION, $insert:{}};
    userLikesUpdates.$insert[Constants.Collections.UserLikes.NETWORK_ID] = {_id:networkId};
    userLikesUpdates.$insert[Constants.Collections.UserLikes.SUGGESTION_ID] = {_id:suggestionId};
    userLikesUpdates.$insert[Constants.Collections.UserLikes.CREATOR] = {_id:db.user._id};
    userLikesUpdates.$insert[Constants.Collections.UserLikes.CREATED_ON] = new Date();
    return db.update(userLikesUpdates);
}

function updateUserUnLikes(likeId, db) {

    var Constants = require("./Constants.js");
    var userLikesUpdates = {$collection:Constants.Collections.UserLikes.COLLECTION, $delete:{_id:likeId}};
    return db.update(userLikesUpdates);
}


function updateLastActivityForLike(params, db) {
    var Constants = require("./Constants.js");
    var SELF = require("./Suggestion.js");
    var suggestionId = params[Constants.Collections.UserSuggestions.SUGGESTION_ID];
    return getSubjectFromSuggestionId(suggestionId, db).then(function (subject) {
        params[Constants.Collections.Suggestions.SUBJECT] = subject;
        return SELF.updateLastActivity(params, db);
    })
}

function ensureUserLike(suggestionId, networkId, db) {
    var Constants = require("./Constants.js");
    var query = {$collection:Constants.Collections.UserLikes.COLLECTION, $filter:{}}
    query.$filter[Constants.Collections.UserLikes.NETWORK_ID] = networkId;
    query.$filter[Constants.Collections.UserLikes.SUGGESTION_ID] = suggestionId;
    query.$filter[Constants.Collections.UserLikes.CREATOR] = db.user._id;
    return db.query(query).then(function (result) {
        if (result.result.length > 0) {
            return result.result[0]._id;
        }
    });
}

function getSubjectFromSuggestionId(suggestionId, db) {
    var Constants = require("./Constants.js");
    var getSubject = {$collection:Constants.Collections.Suggestions.COLLECTION, $filter:{_id:suggestionId}, $fields:{}};
    getSubject.$fields[Constants.Collections.Suggestions.SUBJECT] = 1;
    return db.query(getSubject).then(function (suggestion) {
        if (suggestion.result.length === 0) {
            throw new Error("Suggestion does not exists for SuggestionId [" + suggestionId + "]");
        }
        return suggestion.result[0][Constants.Collections.Suggestions.SUBJECT];
    });
}
