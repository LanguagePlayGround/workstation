exports.Collections = {
    Networks: {
        COLLECTION: "networks",
        NAME: "name",
        IMAGE: "image",
        TYPE: "type",
        Type: {
            ORGANIZATION: "Organization"
        },
        DOMAIN: "domain",
        CREATOR: "creator",
        CREATED_ON: "createdOn",
        LAST_ACTIVITY_ON: "lastActivityOn",
        LAST_ACTIVITY: "lastActivity",
        LAST_ACTIVITY_TYPE: "lastActivityType",
        LAST_ACTIVITY_BY: "lastActivityBy"
    },
    NetworkMembers: {
        COLLECTION: "networkMembers",
        NETWORK_ID: "networkid",
        MEMBER_ID: "memberid",
        ADMIN: "admin",
        CREATED_ON: "createdOn",
        CREATOR: "creator",
        STATUS: "status",
        Status: {
            ACTIVE: "active",
            DELETED: "deleted",
            EXIT: "exit"
        }

    },
    Suggestions: {
        COLLECTION: "suggestions",
        SUBJECT: "subject",
        CREATOR: "creator",
        CREATED_ON: "createdOn",
        IMAGE: "image",
        PHONE: "phone",
        WEB_URL: "webURL",
        TAGS: "tags"

    },
    NetworkSuggestions: {
        COLLECTION: "networkSuggestions",
        NETWORK_ID: "networkid",
        SUGGESTION_ID: "suggestionid",
        TOTAL_EMOTICON: "totalEmoticon",
        CREATOR: "creator",
        IMAGE: "image",
        CREATED_ON: "createdOn",
        TOTAL_LIKES: "totalLikes",
        TOTAL_COMMENTS: "totalComments",
        TOTAL_SUGGESTIONS: "totalSuggestions",
        LAST_ACTIVITY: "lastActivity",
        LAST_ACTIVITY_ON: "lastActivityOn",
        LAST_ACTIVITY_BY: "lastActivityBy",
        LAST_ACTIVITY_TYPE: "lastActivityType",
        USER_LIKE: "userLike", //transient not saved in database . Served by subquery on networkSuggestionLikes while get Suggestions query.
        SUGGESTION_DETAIL: "suggestionDetail" // parameter to get suggestion details
    },
    UserSuggestions: {
        COLLECTION: "userSuggestions",
        SUGGESTION_ID: "suggestionid",
        NETWORK_ID: "networkid",
        CREATOR: "creator",
        CREATED_ON: "createdOn",
        EMOTICON: "emoticon",
        SUGGESTION: "suggestion",
        LAST_ACTIVITY_ON: "lastActivityOn"
    },
    NetworkInvitations: {
        COLLECTION: "networkInvitations",
        NETWORK_ID: "networkid",
        CREATOR: "creator",
        CREATED_ON: "createdOn",
        EMAIL_ID: "emailid",
        PHONE_NO: "phone_no",
        NAME: "name"
    },
    UserLikes: {
        COLLECTION: "userLikes",
        NETWORK_ID: "networkid",
        SUGGESTION_ID: "suggestionid",
        CREATOR: "creator",
        CREATED_ON: "createdOn"
    },
    UserComments: {
        COLLECTION: "userComments",
        NETWORK_ID: "networkid",
        SUGGESTION_ID: "suggestionid",
        CREATOR: "creator",
        CREATED_ON: "createdOn",
        "COMMENT": "comment"
    },
    Users: {
        COLLECTION: "pl.users",
        NAME: "name",
        USER_NAME: "username",
        PASSWORD: "password",
        CONFIRM_PASSWORD: "confirmpassword",
        FULL_NAME: "fullname",
        IMAGE: "image",
        ADMIN: "admin",
        EMAIL_ID: "emailid",
        PHONE_NO: "phone_no",
        NOTIFICATION:"notificationEnabled",
        VERIFICATION_CODE: "verificationcode",
        FIMBRE_STATUS: "fimbreStatus",
        FimbreStatus: {
            PENDING: "Pending",
            VERIFIED: "Verified"
        }
    }, SuggestionTags: {
        COLLECTION: "suggestionTags",
        SUGGESTION_ID: "suggestionid",
        CREATOR: "creator",
        CREATED_ON: "createdOn",
        TAGID: "tagid"
    }, NetworkSuggestionTags: {
        COLLECTION: "networkSuggestionTags",
        NETWORK_ID: "networkid",
        SUGGESTION_ID: "suggestionid",
        CREATOR: "creator",
        CREATED_ON: "createdOn",
        TAGID: "tagid"
    },
    Tags: {
        COLLECTION: "tags",
        TAG: "tag",
        TAG_LOWER: "tag_lower",
        CREATOR: "creator",
        CREATED_ON: "createdOn"
    }

}

exports.Codes = {
    Messages: {
        MANDATORY_FIELDS: "Please provide value of mandatory fields "
    },
    Errors: {
        MANDATORY_FIELDS: 101
    }
}