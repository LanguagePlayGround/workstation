var LIMIT = 50;

//http://127.0.0.1:5100/rest/invoke?function=Network.createNetwork&parameters=[{"name":"ApplaneFramework2"}]&token=543b70dc1296e598173764f0
exports.createNetwork = function (params, db, options) {
    var Constants = require("./Constants.js");
    var SELF = require("./Network.js");
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var groupName = params[Constants.Collections.Networks.NAME];
    var type = params[Constants.Collections.Networks.TYPE];
    var domain = params[Constants.Collections.Networks.DOMAIN];
    var image = params[Constants.Collections.Networks.IMAGE];
    if (groupName) {
        groupName = groupName.trim();
    }
    if ((!groupName) || groupName.length == 0) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.Networks.NAME + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }
    if (!domain) {
        var dbUserEmailID = db.user.emailid;
        var lastIndexOf = dbUserEmailID.lastIndexOf("@")
        domain = dbUserEmailID.substring(lastIndexOf);
    }
    var updates = {$collection:Constants.Collections.Networks.COLLECTION, $insert:{}}
    updates.$insert[Constants.Collections.Networks.NAME] = groupName;
    if (image) {
        updates.$insert[Constants.Collections.Networks.IMAGE] = image;
    }
    updates.$insert[Constants.Collections.Networks.CREATOR] = {_id:db.user._id};
    updates.$insert[Constants.Collections.Networks.CREATED_ON] = new Date();
    updates.$insert[Constants.Collections.Networks.LAST_ACTIVITY_ON] = new Date();
    updates.$insert[Constants.Collections.Networks.LAST_ACTIVITY] = db.user.fullname + " created group";
    updates.$insert[Constants.Collections.Networks.DOMAIN] = domain;
    var response = undefined;
    return db.update(updates).then(
        function (result) {
            response = result[Constants.Collections.Networks.COLLECTION].$insert[0];
            var memberParams = {};
            memberParams[Constants.Collections.NetworkMembers.NETWORK_ID] = response._id;
            memberParams[Constants.Collections.NetworkMembers.MEMBER_ID] = db.user._id;
            memberParams[Constants.Collections.NetworkMembers.ADMIN] = true;
            return ensureMember(memberParams, true, db, options);
        }).then(
        function () {
            if (type === Constants.Collections.Networks.Type.ORGANIZATION) {
                var memberParams = {};
                memberParams[Constants.Collections.NetworkMembers.NETWORK_ID] = response._id;
                memberParams[Constants.Collections.Networks.DOMAIN] = domain;
                return SELF.autoAddIntoNetworkMember(memberParams, db, options)
            }
        }).then(function () {
            return response;
        });
}

exports.autoAddIntoNetworkMember = function (params, db, options) {
    var SELF = require("./Network.js");
    var Utils = require("ApplaneCore/apputil/util.js");
    var Constants = require("./Constants.js");
    var domain = params[Constants.Collections.Networks.DOMAIN] + "$";
    var filter = {};
    filter[Constants.Collections.Users.EMAIL_ID] = {$regex:domain}
    return db.query({$collection:Constants.Collections.Users.COLLECTION, $fields:{"_id":1}, $filter:filter, $modules:false}).then(function (users) {
        return  Utils.iterateArrayWithPromise(users.result, function (index, user) {
            params[Constants.Collections.NetworkMembers.MEMBER_ID] = user["_id"];
            return SELF.addNetworkMember(params, db, options)
        })
    })

}

function ensureMember(params, admin, db, options) {

    var Constants = require("./Constants.js");
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var networkId = params[Constants.Collections.NetworkMembers.NETWORK_ID];
    var memberId = params[Constants.Collections.NetworkMembers.MEMBER_ID];
    if (!networkId) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.NetworkMembers.NETWORK_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS)
    }
    if (!memberId) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.NetworkMembers.MEMBER_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS)
    }

    if (params[Constants.Collections.NetworkMembers.STATUS] === undefined) {
        params[Constants.Collections.NetworkMembers.STATUS] = Constants.Collections.NetworkMembers.Status.ACTIVE;
    }


    var query = {$collection:Constants.Collections.NetworkMembers.COLLECTION, $fields:{_id:1}, $filter:{}};
    query.$filter[Constants.Collections.NetworkMembers.NETWORK_ID] = networkId;
    query.$filter[Constants.Collections.NetworkMembers.MEMBER_ID] = memberId;

    return db.query(query).then(function (result) {
            if (result.result.length > 0) {
                return result.result[0];
            } else {
                //insert new member
                var memberUpdates = {$collection:Constants.Collections.NetworkMembers.COLLECTION, $insert:{}}
                memberUpdates.$insert[Constants.Collections.NetworkMembers.NETWORK_ID] = {_id:networkId};
                memberUpdates.$insert[Constants.Collections.NetworkMembers.MEMBER_ID] = {_id:memberId};
                memberUpdates.$insert[Constants.Collections.NetworkMembers.STATUS] = params[Constants.Collections.NetworkMembers.STATUS];
                memberUpdates.$insert[Constants.Collections.NetworkMembers.ADMIN] = admin;
                memberUpdates.$insert[Constants.Collections.NetworkMembers.CREATOR] = {_id:db.user._id};
                memberUpdates.$insert[Constants.Collections.NetworkMembers.CREATED_ON] = new Date();
                return db.update(memberUpdates).then(function (memberUpdateResult) {
                    return memberUpdateResult[Constants.Collections.NetworkMembers.COLLECTION].$insert[0];
                });
            }
        }
    )

}

exports.addNetworkMember = function (params, db, options) {
    return ensureMember(params, false, db, options)
}

//http://127.0.0.1:5100/rest/invoke?function=Network.getNetworks&parameters=[{}]&token=5434b424cc8891801595db92
exports.getNetworks = function (params, db, options) {

    //get all networks of current user
    var Constants = require("./Constants.js");
    var Util = require("ApplaneCore/apputil/util.js");
    var memberId = db.user._id;
    var query = {$collection:Constants.Collections.NetworkMembers.COLLECTION, $fields:{}, $filter:{}};
    query.$fields[Constants.Collections.NetworkMembers.NETWORK_ID] = 1;
    query.$fields[Constants.Collections.NetworkMembers.ADMIN] = 1;
    query.$filter[Constants.Collections.NetworkMembers.MEMBER_ID] = memberId;
    query.$filter[Constants.Collections.NetworkMembers.STATUS] = Constants.Collections.NetworkMembers.Status.ACTIVE;
    if (params.skip !== undefined) {
        query.$skip = params.skip;
    }
    query.$limit = params.limit !== undefined ? params.limit : LIMIT;
    var hasNext = undefined;
    var nextCursor = (query.$skip || 0) + query.$limit;
    var userNetworks = undefined;
    return db.query(query).then(
        function (result) {
            userNetworks = result.result;
            if (result.dataInfo) {
                hasNext = result.dataInfo.hasNext;
            }
            var userNetworkCount = userNetworks ? userNetworks.length : 0;
            var networks = [];
            for (var i = 0; i < userNetworkCount; i++) {
                var userNetwork = userNetworks[i][Constants.Collections.NetworkMembers.NETWORK_ID];
                if (userNetwork) {
                    networks.push(userNetwork._id);
                }
            }
            var networkQuery = {$collection:Constants.Collections.Networks.COLLECTION, $filter:{_id:{$in:networks}}, $sort:{}};
            networkQuery.$sort[Constants.Collections.Networks.LAST_ACTIVITY_ON] = -1;


            return db.query(networkQuery);
        }).then(function (result) {
            var networks = result.result;
            var userNetworkCount = userNetworks ? userNetworks.length : 0;
            var networksCount = networks ? networks.length : 0;
            for (var i = 0; i < networksCount; i++) {
                for (var j = 0; j < userNetworkCount; j++) {
                    if (Util.deepEqual(networks[i]._id, userNetworks[j][Constants.Collections.NetworkMembers.NETWORK_ID]._id)) {
                        networks[i].admin = userNetworks[j][Constants.Collections.NetworkMembers.ADMIN];
                        break;
                    }
                }
            }
            return {result:networks, dataInfo:{hasNext:hasNext, skip:nextCursor}};
        }
    )


}

function sendSMS(phone, sms, db) {
    return db.invokeService({
        hostname:"sis.applane.com",
        path:'/escape/restgatewayei/sms/sendsms',
        port:80,
        method:"POST"

    }, {"org":5241, sms:sms, ph:phone})

}

function sendMail(email, subject, html, db) {
    var Constants = require("./Constants.js");
    var options = {to:email, from:"developer@daffodilsw.com", subject:subject, html:html};
    return require("ApplaneDB/lib/MailService.js").sendFromAdmin(options).fail(function (err) {
        var ErrorHandler = require("ApplaneDB/lib/ErrorHandler.js");
        return ErrorHandler.handleError(err, ErrorHandler.TYPE.MAIL_ERROR, db)
    })
}

function getUserName(userID, db) {
    var Constants = require("./Constants.js");
    var fields = {};
    fields[Constants.Collections.Users.FULL_NAME] = 1;
    var query = {$collection:Constants.Collections.Users.COLLECTION, $fields:fields, $filter:{"_id":userID}, $modules:false};
    return db.query(query).then(function (result) {
        if (result.result.length === 1) {
            return result.result[0][Constants.Collections.Users.FULL_NAME];
        }
    })
}

function getNetworkName(networkId, db) {
    var Constants = require("./Constants.js");
    var fields = {};
    fields[Constants.Collections.Networks.NAME] = 1;
    var query = {$collection:Constants.Collections.Networks.COLLECTION, $fields:fields, $filter:{"_id":networkId}};
    return db.query(query).then(function (result) {
        if (result.result.length === 1) {
            return result.result[0][Constants.Collections.Networks.NAME];
        }
    })
}

exports.inviteMembers = function (params, db, options) {
    var SELF = require("./Network.js");
    var Constants = require("./Constants.js");
    var Utils = require("ApplaneCore/apputil/util.js");
    var networkId = params[Constants.Collections.NetworkMembers.NETWORK_ID];
    var invitations = params.invitations ? params.invitations : [];
    var networkName = undefined;
    if (!networkId) {
        throw new Error("networkId is mandatory for inviting Members>>>>");
    }
    return  Utils.iterateArrayWithPromise(invitations, function (index, invitation) {
        if (!invitation[Constants.Collections.NetworkInvitations.EMAIL_ID] && !invitation[Constants.Collections.NetworkInvitations.PHONE_NO]) {
            throw new Error("email id or phone no. must be required in member invitation>>>>");
        }
        var filter = {"$or":[]};
        if (invitation[Constants.Collections.NetworkInvitations.EMAIL_ID]) {
            var emailid = {};
            emailid[Constants.Collections.NetworkInvitations.EMAIL_ID] = invitation[Constants.Collections.NetworkInvitations.EMAIL_ID];
            filter["$or"].push(emailid)
        }
        if (invitation[Constants.Collections.NetworkInvitations.PHONE_NO]) {
            var phone_no = {};
            phone_no[Constants.Collections.NetworkInvitations.PHONE_NO] = invitation[Constants.Collections.NetworkInvitations.PHONE_NO];
            filter["$or"].push(phone_no);
        }
        return db.query({$collection:Constants.Collections.Users.COLLECTION, $fields:{"_id":1}, $filter:filter, $modules:false}).then(function (user) {
            if (user.result.length === 1) {
                params[Constants.Collections.NetworkMembers.MEMBER_ID] = user.result[0]["_id"];
                return SELF.addNetworkMember(params, db, options).then(
                    function () {
                        return getNetworkName(networkId, db)
                    }).then(
                    function (netName) {
                        networkName = netName;
                        return getUserName(db.user._id, db)
                    }).then(function (userName) {
                        if (invitation[Constants.Collections.NetworkInvitations.EMAIL_ID]) {
                            var subject = invitation[Constants.Collections.NetworkInvitations.NAME] + ", " + userName + " have added you to his " + networkName + " family";
                            var html = " Hi " + invitation[Constants.Collections.NetworkInvitations.NAME] + ", " + userName + " have added you to his " + networkName + " family";
                            var email = invitation[Constants.Collections.NetworkInvitations.EMAIL_ID];
                            return sendMail(email, subject, html, db)
                        } else {
                            var phone = invitation[Constants.Collections.NetworkInvitations.PHONE_NO];
                            var sms = " Hi " + invitation[Constants.Collections.NetworkInvitations.NAME] + ", " + userName + " have added you to his " + networkName + " family";
                            return sendSMS(phone, sms, db);
                        }
                    })
            } else if (user.result.length > 1) {
                throw new Error("more than one user found with same email id or phone no>>>>" + JSON.stringify(filter.$or));
            } else {
                filter[Constants.Collections.NetworkMembers.NETWORK_ID] = networkId
                return addNetworkInvitation(filter, networkId, invitation, db).then(
                    function () {
                        return getNetworkName(networkId, db)
                    }).then(
                    function (netName) {
                        networkName = netName;
                        return getUserName(db.user._id, db)
                    }).then(function (userName) {
                        if (invitation[Constants.Collections.NetworkInvitations.EMAIL_ID]) {
                            var subject = invitation[Constants.Collections.NetworkInvitations.NAME] + ", " + userName + " is inviting you to join his " + networkName + " family";
                            var html = " Hi " + invitation[Constants.Collections.NetworkInvitations.NAME] + ", " + userName + " is inviting you to join his " + networkName + " family";
                            var email = invitation[Constants.Collections.NetworkInvitations.EMAIL_ID];
                            return sendMail(email, subject, html, db)
                        } else {
                            var phone = invitation[Constants.Collections.NetworkInvitations.PHONE_NO];
                            var sms = " Hi " + invitation[Constants.Collections.NetworkInvitations.NAME] + ", " + userName + " is inviting you to join his " + networkName + " family";
                            return sendSMS(phone, sms, db);
                        }
                    })
            }
        })
    })
}

function addNetworkInvitation(filter, networkId, invitation, db) {
    var Constants = require("./Constants.js");
    return db.query({$collection:Constants.Collections.NetworkInvitations.COLLECTION, $fields:{"_id":1}, $filter:filter}).then(function (networkInvitation) {
        if (networkInvitation.result.length === 0) {
            var insert = {};
            insert[Constants.Collections.NetworkInvitations.NETWORK_ID] = {_id:networkId};
            insert[Constants.Collections.NetworkInvitations.EMAIL_ID] = invitation[Constants.Collections.NetworkInvitations.EMAIL_ID];
            insert[Constants.Collections.NetworkInvitations.NAME] = invitation[Constants.Collections.NetworkInvitations.NAME]
            insert[Constants.Collections.NetworkInvitations.PHONE_NO] = invitation[Constants.Collections.NetworkInvitations.PHONE_NO]
            insert[Constants.Collections.NetworkInvitations.CREATED_ON] = new Date();
            insert[Constants.Collections.NetworkInvitations.CREATOR] = {_id:db.user._id};
            var updates = {$collection:Constants.Collections.NetworkInvitations.COLLECTION, $insert:insert};
            return db.update(updates)
        }
    })
}
//http://127.0.0.1:5100/rest/invoke?function=Network.getNetworkMembers&parameters=[{"networkid":"54391d1a77356bdc0f755d6f","skip":1,"limit":1}]&token=5434b424cc8891801595db92
exports.getNetworkMembers = function (params, db) {

    var Constants = require("./Constants.js");
    var ApplaneDBError = require("ApplaneDB/lib/ApplaneDBError.js");
    var networkId = params[Constants.Collections.NetworkMembers.NETWORK_ID];
    if (!networkId) {
        throw new ApplaneDBError(Constants.Codes.Messages.MANDATORY_FIELDS + "[" + Constants.Collections.UserLikes.NETWORK_ID + "]", Constants.Codes.Errors.MANDATORY_FIELDS);
    }
    var query = {$collection:Constants.Collections.NetworkMembers.COLLECTION, $filter:{}, $fields:{}};
    query.$filter[Constants.Collections.NetworkMembers.NETWORK_ID] = networkId;
    query.$filter[Constants.Collections.NetworkMembers.STATUS] = Constants.Collections.NetworkMembers.Status.ACTIVE;
    query.$fields[Constants.Collections.NetworkMembers.MEMBER_ID] = 1;
    query.$fields[Constants.Collections.NetworkMembers.ADMIN] = 1;
    query.$fields[Constants.Collections.NetworkMembers.CREATED_ON] = 1;
    if (params.skip !== undefined) {
        query.$skip = params.skip;
    }
    query.$limit = params.limit !== undefined ? params.limit : LIMIT;
    query.$sort = {_id:-1};
    var nextCursor = (query.$skip || 0) + query.$limit;
    return db.query(query).then(function (result) {
        result.dataInfo = result.dataInfo || {};
        result.dataInfo.skip = nextCursor;
        return result;
    })
}

exports.createMemberForOrganizationNetwork = function (params, db, options) {

    var Constants = require("./Constants.js");
    var Utils = require("ApplaneCore/apputil/util.js");
    var userEmailID = params[Constants.Collections.Users.EMAIL_ID];
    var userEmailID = params[Constants.Collections.Users.EMAIL_ID];
    if (!userEmailID) {
        return;
    }
    var lastIndexOf = userEmailID.lastIndexOf("@")
    if (lastIndexOf <= 0) {
        return;
    }
    var domain = userEmailID.substring(lastIndexOf + 1);
    var ignoreAbleDomains = ["gmail.com"];
    if (ignoreAbleDomains.indexOf(domain) >= 0) {
        return;
    }
    var fields = {};
    fields["_id"] = 1;
    var query = {$collection:Constants.Collections.Networks.COLLECTION, $fields:fields, $filter:{}};
    query.$filter[Constants.Collections.Networks.DOMAIN] = domain;
    query.$filter[Constants.Collections.Networks.TYPE] = Constants.Collections.Networks.Type.ORGANIZATION;

    var userQuery = {$collection:"pl.users", $fields:{_id:1}, $filter:{emailid:userEmailID}, $modules:false, $events:false}
    var userId = undefined;
    return db.query(userQuery).then(
        function (userInfo) {
            if (userInfo.result.length == 1) {
                userId = userInfo.result[0]._id;
                return db.query(query);
            }
        }).then(function (networks) {
            if (networks && networks.result.length > 0) {
                return  Utils.iterateArrayWithPromise(networks.result, function (index, network) {
                    var memberParams = {};
                    memberParams[Constants.Collections.NetworkMembers.NETWORK_ID] = network["_id"];
                    memberParams[Constants.Collections.NetworkMembers.MEMBER_ID] = userId;
                    return require("./Network.js").addNetworkMember(memberParams, db, options)
                })
            }
        })
}

exports.createMemberFromInvitations = function (params, db, options) {

    var Constants = require("./Constants.js");
    var Utils = require("ApplaneCore/apputil/util.js");
    var userEmailID = params[Constants.Collections.Users.EMAIL_ID];
    var userPhoneNo = params[Constants.Collections.Users.PHONE_NO];
    if (!userEmailID && !userPhoneNo) {
        return;
    }
    var filter = {"$or":[]};
    if (userEmailID) {
        var emailid = {};
        emailid[Constants.Collections.NetworkInvitations.EMAIL_ID] = userEmailID;
        filter["$or"].push(emailid)
    }
    if (userPhoneNo) {
        var phone_no = {};
        phone_no[Constants.Collections.NetworkInvitations.PHONE_NO] = userPhoneNo;
        filter["$or"].push(phone_no);
    }
    var fields = {};
    fields[Constants.Collections.NetworkInvitations.NETWORK_ID] = 1;
    fields[Constants.Collections.NetworkInvitations.CREATOR] = 1;
    return db.query({$collection:Constants.Collections.NetworkInvitations.COLLECTION, $fields:fields, $filter:filter}).then(
        function (networkInvitations) {
            return  Utils.iterateArrayWithPromise(networkInvitations.result, function (index, networkInvitation) {
                var memberParams = {};
                memberParams[Constants.Collections.NetworkMembers.NETWORK_ID] = networkInvitation[Constants.Collections.NetworkInvitations.NETWORK_ID]["_id"];
                memberParams[Constants.Collections.NetworkMembers.MEMBER_ID] = networkInvitation[Constants.Collections.NetworkInvitations.CREATOR]["_id"];
                return require("./Network.js").addNetworkMember(memberParams, db, options)
            })
        })


}

//http://127.0.0.1:5100/rest/invoke?function=Network.exitNetwork&parameters=[{"networkid":"5440972127ec56410a65ec0a"}]&token=543fd25af94aff211597b8d7
exports.exitNetwork = function (params, db, options) {
    var Constants = require("./Constants.js");
    var networkId = params[Constants.Collections.NetworkMembers.NETWORK_ID];
    var memberId = db.user._id;
    var admin = undefined;
    var query = {$collection:Constants.Collections.NetworkMembers.COLLECTION, $fields:{}, $filter:{}};
    query.$filter[Constants.Collections.NetworkMembers.NETWORK_ID] = networkId;
    query.$filter[Constants.Collections.NetworkMembers.MEMBER_ID] = memberId;
    query.$filter[Constants.Collections.NetworkMembers.STATUS] = Constants.Collections.NetworkMembers.Status.ACTIVE;
    query.$fields["_id"] = 1;
    query.$fields[Constants.Collections.NetworkMembers.ADMIN] = 1;
    //check in networkMembers, whether current user with given networkId with status- active exist or not, if yes-then update status to Exit   and admin to false;
    return db.query(query).then(
        function (result) {
            if (result.result.length === 1) {
                admin = result.result[0][Constants.Collections.NetworkMembers.ADMIN];
                var set = {};
                set[Constants.Collections.NetworkMembers.STATUS] = Constants.Collections.NetworkMembers.Status.EXIT;
                set[Constants.Collections.NetworkMembers.ADMIN] = false;
                var update = [
                    {$collection:Constants.Collections.NetworkMembers.COLLECTION, $update:[
                        {_id:result.result[0]["_id"], $set:set}
                    ]}
                ]
                return db.update(update)
            }
        }).then(
        function () {
            // if current user is admin, then check whether there is any other member whose status is active
            if (admin) {
                var query = {$collection:Constants.Collections.NetworkMembers.COLLECTION, $filter:{}, $limit:1};
                query.$filter[Constants.Collections.NetworkMembers.NETWORK_ID] = networkId;
                query.$filter[Constants.Collections.NetworkMembers.STATUS] = Constants.Collections.NetworkMembers.Status.ACTIVE;
                return db.query(query)
            }
        }).then(
        function (result) {
            //if there is any other active member available , then check whether there is any active member with admin true available
            if (result && result.result.length > 0) {
                var query = {$collection:Constants.Collections.NetworkMembers.COLLECTION, $fields:{"_id":1}, $filter:{}};
                query.$filter[Constants.Collections.NetworkMembers.NETWORK_ID] = networkId;
                query.$filter[Constants.Collections.NetworkMembers.STATUS] = Constants.Collections.NetworkMembers.Status.ACTIVE;
                query.$filter[Constants.Collections.NetworkMembers.ADMIN] = true;
                return db.query(query)
            }
        }).then(
        function (result) {
            // if no active with admin member found, then get first member in ascending order, whose status is active
            if (result && result.result.length === 0) {
                var query = {$collection:Constants.Collections.NetworkMembers.COLLECTION, $fields:{"_id":1}, $filter:{}, $sort:{"_id":1}, $limit:1};
                query.$filter[Constants.Collections.NetworkMembers.NETWORK_ID] = networkId;
                query.$filter[Constants.Collections.NetworkMembers.STATUS] = Constants.Collections.NetworkMembers.Status.ACTIVE;
                return db.query(query)
            }
        }).then(function (result) {
            //update that user admin to true
            if (result && result.result.length === 1) {
                var set = {};
                set[Constants.Collections.NetworkMembers.ADMIN] = true;
                var update = [
                    {$collection:Constants.Collections.NetworkMembers.COLLECTION, $update:[
                        {_id:result.result[0]["_id"], $set:set}
                    ]}
                ]
                return db.update(update)
            }
        })
}


