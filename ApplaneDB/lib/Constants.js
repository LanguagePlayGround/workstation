/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 8/4/14
 * Time: 10:59 AM
 * To change this template use File | Settings | File Templates.
 */

exports.EnvironmentVariables = {
    PORT:"PORT",
    CPUS:"CPUS",
    SERVER_START_UP:"SERVER_START_UP",
    BASE_URL:"BASE_URL",
    SERVER_NAME:"SERVER_NAME",
    PUBLIC:"PUBLIC",
    MONGO_URL:"URL",
    ES_URL:"ESURL",
    ADMIN_DB:"Admin.DB",
    ENSURE_DB:"ENSURE_DB",
    CACHE:"CACHE",
    ADMIN_USER:"Admin.USER_NAME",
    ADMIN_PASS:"Admin.PASSWORD",
    MONGOADMIN_DB:"MongoAdmin.DB",
    MONGOADMIN_USER:"MongoAdmin.USER_NAME",
    MONGOADMIN_PASS:"MongoAdmin.PASSWORD",
    NEW_RELIC:"NEW_RELIC",
    MAIL_USERNAME:"MailCredentials.USERNAME",
    MAIL_PASSWORD:"MailCredentials.MAIL_PASSWORD",
    MAIL_SERVICE:"MailCredentials.PASSWORD",
    MAIL_FROM:"MailCredentials.FROM",
    MAIL_FROMNAME:"MailCredentials.FROMNAME",
    MAIL_SENDGRID_USERNAME:"MailCredentials.SENDGRID_USERNAME",
    MAIL_SENDGRID_PASSWORD:"MailCredentials.SENDGRID_PASSWORD",
    AMAZON_SECRET_KEY:"MailCredentials.AMAZON_SECRET_KEY",
    AMAZON_ACCESS_KEY:"MailCredentials.AMAZON_ACCESS_KEY",
    AMAZON_REGION:"MailCredentials.AMAZON_REGION",
    MAIL_ERROR_USERNAME:"MailCredentials.ERROR_USERNAME",
    MAIL_ERROR_PASSWORD:"MailCredentials.ERROR_PASSWORD",
    SEND_ERROR_MAIL:"MailCredentials.SEND_ERROR_MAIL",
    SERVICE:"MailCredentials.SERVICE",
    PORTING_DATABASE:"PORTING_DATABASE",
    SERVICE_LOGS_ENABLED:"SERVICE_LOGS_ENABLED",
    USER_CACHE:"USER_CACHE",
    USER_CACHE_PORT:"USER_CACHE_PORT",
    USER_CACHE_HOSTNAME:"USER_CACHE_HOSTNAME",
    CACHE_TOKEN:"CACHE_TOKEN",
    LOG_DB:"LOG_DB",
    GOOGLE_CLIENT_ID:"GOOGLE_CLIENT_ID",
    GOOGLE_CLIENT_SECRET:"GOOGLE_CLIENT_SECRET",
    GOOGLE_CALLBACK_URL:"GOOGLE_CALLBACK_URL",
    FACEBOOK_APP_ID:"FACEBOOK_APP_ID",
    FACEBOOK_APP_SECRET:"FACEBOOK_APP_SECRET",
    FACEBOOK_CALLBACK_URL:"FACEBOOK_CALLBACK_URL",
    SERVER_PROFILING:"SERVER_PROFILING",
    LINKEDIN_CLIENT_ID:"LINKEDIN_CLIENT_ID",
    LINKEDIN_CLIENT_SECRET:"LINKEDIN_CLIENT_SECRET",
    LINKEDIN_CALLBACK_URL:"LINKEDIN_CALLBACK_URL"

};

exports.Cache = {
    JSON:"json",
    GZIP:"gzip"
};


exports.Query = {
    QUERY:"$query",
    COLLECTION:"$collection",
    _ID:"_id",
    FIELDS:"$fields",
    Fields:{
        TYPE:"$type",
        QUERY:"$query",
        FK:"$fk",
        OTHER_FK:"$otherfk",
        Other_fk:{"FK":"fk", "PARENT":"parent"},
        PARENT:"$parent",
        ENSURE:"$ensure"
    },
    FILTER:"$filter",
    Filter:{
        OR:"$or",
        AND:"$and",
        IN:"$in",
        GT:"$gt",
        LT:"$lt"
    },
    PARAMETERS:"$parameters",
    Parameters:{
        ROLE:"__role__"
    },
    CHILDS:"$childs",
    SORT:"$sort",
    GROUP:"$group",
    LIMIT:"$limit",
    SKIP:"$skip",
    UNWIND:"$unwind",
    RECURSION:"$recursion",
    Recursion:{
        LEVEL:"$level",
        ALIAS:"$alias",
        COUNTER:"$counter",
        ENSURE:"$ensure",
        ROLLUP:"$rollup",
        FILTER:"$filter",
        ROOT_FILTER:"$rootFilter",
        ENSURE_FILTER:"$ensureFilter",
        RESOLVED_FILTER_PARAMETER:"$resolvedFilterParameter",
        SORT:"$sort"
    },
    DATA:"$data",
    MODULES:"$modules",
    EVENTS:"$events",
    CONTEXT:"$context",
    $$REMOVED:"$$removed",
    $$RESOLVED:"$$resolved"
};

exports.Update = {
    COLLECTION:"$collection",

    INSERT:"$insert",
    UPDATE:"$update",
    Update:{
        SET:"$set",
        UNSET:"$unset",
        QUERY:"$query",
        INC:"$inc"

    },
    DELETE:"$delete",
    QUERY:"$query",
    UPSERT:"$upsert",
    Upsert:{
        QUERY:"$query",
        FIELDS:"$fields"
    }
};

exports.Admin = {
    DBS:"pl.dbs",
    Dbs:{
        DB:"db",
        ORG_NAME:"orgName",
        GLOBAL_DB:"globalDb",
        ADMIN_DB:"admindb",
        CODE:"code",
        DEVELOPMENT_RIGHT:"developmentRight",
        NOTIFICATION_ENABLED:"notificationEnabled",
        CRON_ENABLED:"cronEnabled",
        ENSURE_DEFAULT_COLLECTIONS:"ensureDefaultCollections",
        MOBILE_LOGIN_ENABLED:"mobileLoginEnabled",
        SMS_VERIFICATION_ENABLED:"smsVerificationEnabled",
        SIGNUP_ENABLED:"signupEnabled",
        EMAIL_LOGIN_ENABLED:"emailLoginEnabled",
        ENSURE_USER:"ensureUser",
        GLOBAL_USER_NAME:"globalUserName",
        GLOBAL_USER_EMAILID:"globalUserEmailid",
        GLOBAL_PASSWORD:"globalPassword",
        GLOBAL_USER_ADMIN:"globalUserAdmin",
        GUEST_USER_NAME:"guestUserName",
        SANDBOX_DB:"sandboxDb",
        SESSION_TIMEOUT:"sessionTimeout",
        AUTO_SYNCH:"autoSynch",
        SHORT_ICON:"shortIcon",
        LONG_ICON:"longIcon",
        TIMEZONE:"timezone",
        ALLOWED_SERVICES:"allowedServices",
        AllowedServices:{
            SERVICE:"service"
        },
        APPLICATIONS:"applications",
        Applications:{
            APPLICATION:"application"
        },
        REMOTE_URL:"remoteURL",
        REMOTE_PORT:"remotePort",
        REMOTE_PROCESS:"remoteProcess",
        REMOTE_ERROR:"remoteError",
        REMOTE_DBS:"remoteDbs",
        RemoteDbs:{
            INDEX:"index",
            DB:"db",
            DATE:"date",
            STATUS:"status"
        }
    },

    CONNECTIONS:"pl.connections",
    Conncetions:{
        TOKEN:"token",
        DB:"db",
        OAUTH_CODE:"oauthcode",
        OPTIONS:"options",
        LAST_UPDATED_ON:"lastUpdatedOn"
    },
    LOGS:"pl.logs",
    FUNCTION_LOGS:"pl.functionlogs",
    APP_LOCKS:"pl.applocks",
    LOCKS:"pl.locks",
    FILTERSPACE:"pl.filterspace",
    FilterSpace:{
        SPACE:"space"
    },
    USERS:"pl.users",
    Users:{
        USER_NAME:"username",
        PASSWORD:"password",
        FULL_NAME:"fullname",
        ADMIN:"admin",
        EMAIL_ID:"emailid",
        MOBILE_NO:"mobile_no",
        PHONE_NO:"phone_no",
        NO_OF_RECORDS:"no_of_records",
        CALENDER_ENABLED:"calenderenabled",
        ROLES:"roles",
        STATE:"state",
        ROLE:"role",
        STATUS:"status",
        Status:{
            ACTIVE:"active",
            DEACTIVE:"deactive"
        },
        SELECTED_APPLICATION:"selectedapplication",
        APPLICATION:"applications",
        MAIL_TRACK_ENABLED:"mailtrackenabled",
        MAIL_TRACK_START_DATE:"mailtrackstartdate",
        REFERRED_DB:"referredDB",
        MODULES:"modules",
        IMAGE:"image",
        APPLICATIONID:"applicationid",
        SETUPVIEWS:"setupViews",
        SETUPSTATUS:"setupStatus",
        VERIFICATION_CODE:"verificationCode",
        VERIFICATION_STATUS:"verificationStatus",
        DEVICE_ID:"device_id",
        ROLE_ID:"role_id",
        AUTHTYPE:"authType",
        GOOGLE_USER_ID:"google_user_id"

    },
    EMAILTRACKERS:"pl.emailtrackers",
    EmailTrackers:{
        FUNCTION:"function",
        STATUS:"status"
    },
    GMAIL_MESSAGES:"pl.gmailmessages",
    GmailMessages:{
        MESSAGE_ID:"messageid",
        USER:"user",
        User:{
            USERID:"userid",
            USERNAME:"username"
        }
    },
    FUNCTIONS:"pl.functions",
    Functions:{
        NAME:"name",
        SOURCE:"source",
        CODE:"code"
    },
    ROLES:"pl.roles",
    Roles:{
        TABLE:"pl.roles",
        ID:"id",
        ROLE:"role",
        DEFAULT:"default",
        PRIVILEGES:"privileges",
        GROUP:"group",
        PARENT_ROLE_ID:"parentroleid",
        APPLICATION_ID:"applicationid",
        Privileges:{
            PRIVILEGE_ID:"privilegeid",
            TYPE:"type",
            COLLECTION:"collection",
            FIELDS_AVAILABILITY:"fieldsAvailability",
            FIELD_INFOS:"fieldInfos",
            FieldInfos:{
                FIELD:"field"
            },

            FILTER_UI:"filterUI",
            FILTER_JSON:"filterJSON",
            FILTER_INFOS:"filterInfos",
            FilterInfos:{
                FIELD:"field",
                OPERATOR:"operator",
                VALUE:"value",
                LOGICAL_OPERATOR:"logicalOperator"
            },

            ACTIONS_AVAILABILITY:"actionsAvailability",
            ACTION_INFOS:"actionInfos",
            ActionInfos:{
                ACTION:"action",
                FILTER_JSON:"filterJSON"
            },

            VIEWS_AVAILABILITY:"viewsAvailability",
            VIEW_INFOS:"viewInfos",
            ViewInfos:{
                VIEW:"view"
            },

            RESOURCE:"resource",
            ACTIONS:"actions",
            Actions:{
                FIND:"find",
                Find:{
                    PRIMARY_FIELDS:"primaryFields"
                },
                INSERT:"insert",
                UPDATE:"update",
                REMOVE:"remove"
            },
            VIEWS:"views",

            OPERATION_INFOS:"operationInfos",
            OperationInfos:{
                TYPE:"type",
                PRIMARY_FIELDS:"primaryFields",
                FIELDS_AVAILABILITY:"fieldsAvailability",
                FIELD_INFOS:"fieldInfos",
                FieldInfos:{
                    FIELD:"field"
                },
                FILTER_UI:"filterUI",
                FILTER_JSON:"filterJSON",
                FILTER_INFOS:"filterInfos",
                FilterInfos:{
                    FIELD:"field",
                    OPERATOR:"operator",
                    VALUE:"value",
                    LOGICAL_OPERATOR:"logicalOperator"
                },
                FK_INFOS:"fkInfos",
                FkInfos:{
                    FIELD:"field",
                    PRIVILEGE_ID:"privilegeid"
                }
            },
            SHOW_RESULT_IN_JSON:"showResultInJSON",
            FILTER_NAME:"filterName",
            REGEX:"regex"
        },
        SPAN:"span",
        MENUS_AVAILABILITY:"menusAvailability",
        MENU_INFOS:"menuInfos",
        MenuInfos:{
            MENU:"menu"
        },
        CHILD_ROLES:"childRoles"
    },
    MENUS:"pl.menus",
    Menus:{
        LABEL:"label",
        INDEX:"index",
        VIEWID:"viewid",
        COLLECTION:"collection",
        PARENTMENU:"parentmenu",
        APPLICATION:"application",
        QVIEWS:"qviews",
        DEFAULT_QVIEW_ID:"defaultqview"
    },
    FORM_GROUPS:"pl.formgroups",
    FormGroups:{
        TITLE:"title",
        COLLECTION_ID:"collectionid"
    },
    ACTIONS:"pl.actions",
    Actions:{
        LABEL:"label",
        COLLECTION_ID:"collectionid"
    },
    APPLICATIONS:"pl.applications",
    Applications:{
        LABEL:"label",
        DB:"db",
        DEFAULT_MENU:"defaultmenu",
        MODULE_NAME:"moduleName",
        UNPUBLISH:"unpublished"
    },
    QVIEWCUSTOMIZATIONS:"pl.qviewcustomizations",
    QviewCustomizations:{
        LABEL:"LABEL",
        INDEX:"index",
        UI:"ui",
        FILTER:"filter"
    },
    QVIEWS:"pl.qviews",
    Qviews:{
        ID:"id",
        COLLECTION:"collection",
        MAIN_COLLECTION:"mainCollection",
        QFIELD:"qFields",
        QUERY_EVENT:"queryEvent",
        QField:{
            AVAILABILITY:"availability",
            INDEX:"index",
            INDEXFORM:"indexForm",
            VISIBILITY:"visibility",
            VISIBILITYFORM:"visibilityForm",
            FILTER:"filter",
            EDITABLE_WHEN:"editableWhen",
            WHEN:"when",
            WIDTH:"width"
        }
    },
    COLLECTIONS:"pl.collections",
    Collections:{
        COLLECTION:"collection",
        DB:"db",
        RESPONSIVE_COLUMNS:"responsiveColumns",
        FIELDS:"fields",
        GLOBAL:"global",
        HISTORY_ENABLED:"historyEnabled",
        HISTORY_FIELDS:"historyFields",
        USER_SORTING:"userSorting",
        PRIMARY_FIELD:"primaryField",
        REFERRED_FKS:"referredfks",
        INDEXES:"indexes",
        PARENT_COLLECTION:"parentCollection",
        LAST_MODIFIED_TIME:"lastmodifiedtime",
        STATUS:"status",
        EVENTS:"events",
        WORK_FLOW_EVENTS:"workflowevents",
        COMMENT_ENABLED:"commentEnabled",
        COMMENT_SOURCE:"comment_source",
        COMMENT_EVENT:"comment_event",
        COMMENT_DISPLAY_FIELD:"comment_displayField"
    },
    EVENTS:"pl.events",
    Events:{
        COLLECTION_ID:"collectionid",
        EVENT:"event",
        FUNCTION:"function",
        PRE:"pre",
        POST:"post",
        REQUIRE:"require",
        OPTIONS:"options",
        CLIENT:"client",
        SERVER:"server",
        REQUIRED_FIELDS:"requiredfields",
        REQUIRED_MODULES:"requiredmodules"
    },
    WORK_FLOW_EVENTS:"pl.workflowevents",
    WorkFlowEvents:{
        COLLECTION_ID:"collectionid",
        EVENT:"event",
        ACTION:"action",
        CONDITION:"condition",
        TRIGGER_EVENT:"triggerEvent",
        PARAMETERS:"parameters"
    },
    APPLICATION_ROLES:"pl.applicationroles",
    ApplicationRoles:{
        ROLE:"role",
        APPLICATION_ID:"applicationid"
    },
    ROLE_ROLES:"pl.roleroles",
    RoleRoles:{
        ROLE:"role",
        ROLE_ID:"roleid"
    },
    ACTION_ROLES:"pl.actionroles",
    ActionRoles:{
        ROLE:"role",
        ACTION_ID:"actionid",
        COLLECTION_ID:"collectionid"
    },
    STATUS:{
        UPDATED:"updated",
        COMMITED:"commited"
    },
    REFERRED_FKS:"pl.referredfks",
    /**  {collection:"persons",fields:[{_id:"cityid","field":"cityid","type":fk,collection:"cities","set":["city"]}]}
     */
    ReferredFks:{
        COLLECTION_ID:"collectionid", //persons
        FIELD:"field", //cityid
        SET:"set", //["city"]
        CASCADE:"cascade",
        REPLICATE:"replicate",
        REFERRED_COLLECTION_ID:"referredcollectionid", //cities
        REFERRED_FIELD_ID:"referredfieldid"               //cityid
    },
    FIELDS:"pl.fields",
    Fields:{
        FIELD:"field",
        TYPE:"type",
        Type:{
            STRING:"string",
            FK:"fk",
            OBJECT:"object",
            NUMBER:"number",
            DECIMAL:"decimal",
            BOOLEAN:"boolean",
            DATE:"date",
            JSON:"json",
            DURATION:"duration",
            CURRENCY:"currency",
            UNIT:"unit",
            FILE:"file",
            SEQUENCE:"sequence",
            SCHEDULE:"schedule",
            DATERANGE:"daterange",
            OBJECTID:"objectid"
        },
        MULTIPLE:"multiple",
        SET:"set", // Array of string
        DISPLAYFIELD:"displayField",
        SELFRECURSIVE:"selfRecursive",
        SelfRecursive:{
            ON:"on",
            OFF:"off"
        },
        PRIMARY:"primary",
        COLLECTION:"collection", // can be object or string
        MANDATORY:"mandatory",
        UPSERT:"upsert",
        ROLE_ID:"roleid",
        PARENT_FIELD_ID:"parentfieldid",
        COLLECTION_ID:"collectionid",
        FK:"fk",
        QUERY:"query",
        REFERREDVIEW:"referredView",
        RESPONSIVE_COLUMNS:"responsiveColumns",
        RECURSION:"recursion",
        CASCADE:"cascade",
        FILTERSPACE_ID:"filterspaceid",
        QVIEW:"qview",
        VISIBILITY_QVIEW:"visibilityQView",
        VISIBILITYFORM_QVIEW:"visibilityFormQView",
        INDEX_QVIEW:"indexQView",
        INDEXFORM_QVIEW:"indexFormQView",
        FILTER_QVIEW:"filterQView",
        EDITABLEWHEN_QVIEW:"editableWhenQView",
        WHEN_QVIEW:"whenQView",
        WIDTH_QVIEW:"widthQView",
        TO_LOWER_CASE:"toLowerCase",
        USE_LOWER_CASE:"useLowerCase",
        FILTER:"filter",
        EVENTS:"events",
        NON_PERSISTENT:"nonPersistent"
    },
    SERIES:"pl.series",
    Series:{
        SERIES:"series",
        COLLECTION:"collection",
        NUMBER:"number"
    },
    TEMPLATES:"pl.templates",
    Templates:{
        TEMPLATE:"template",
        TEMPLATE_TYPE:"templateType",
        TYPE:"type",
        Type:{
            SEND_MAIL:"sendMail",
            PRINT:"print"
        },
        QUERY:"query",
        FUNCTION:"function",
        ID:"id",
        SUBJECT:"subject",
        ATTACHMENTS:"attachments",
        FROM:"from",
        TO:"to",
        COLLECTION_ID:"collectionid"
    },
    COMMENTS:"pl.comments",
    Comments:{
        COLLECTION:"collection",
        SOURCE:"source",
        FK:"fk",
        Fk:{
            _ID:"_id",
            VALUE:"value"
        },
        PARTICIPANTS:"participants",
        Participants:{
            USERID:"userid",
            READ:"read"
        },
        TO:"to",
        FROM:"from",
        CC:"cc",
        COMMENT:"comment",
        ATTACHMENT:"attachment",
        WAITING_FOR_REPLY:"waitingForReply",
        WAITING_FOR_REPLY_BY:"waitingForReplyBy",
        REPLY_TO_ID:"replyToId"
    },
    CRONS:"pl.crons",
    Crons:{
        NAME:"name",
        SERVER_NAME:"serverName",
        STATUS:"status",
        Status:{
            ON:"On",
            OFF:"Off"
        },
        FUNCTION:"function",
        WHEN:"when",
        LAST_RUN_ON:"lastRunOn",
        PROCESSING:"processing",
        DBS:"dbs",
        Dbs:{
            DB:"db",
            STATUS:"status",
            FUNCTION:"function",
            TIMEZONE:"timezone"
        },
        TIMEZONE:"timezone",
        DBS_STATUS:"dbsStatus",
        REPEATS:"repeats",
        CREATED_ON:"createdOn",
        OWNER:"owner"
    },
    NOTIFICATIONS:"pl.notifications",
    Notifications:{
        ID:"id",
        VIEWID:"viewid",
        SERVER_NAME:"serverName",
        PROCESSING:"processing",
        LAST_RUN_ON:"lastRunOn",
        WHEN:"when",
        ROLES:"roles",
        FILTER:"filter",
        PARAMETERS:"parameters",
        SUBJECT:"subject",
        STATUS:"status",
        SKIP_MAIL:"skipMail",
        VIEW_INFO:"viewinfo",
        Status:{
            ON:"On",
            OFF:"Off"
        },
        DBS:"dbs",
        Dbs:{
            DB:"db",
            STATUS:"status"
        }
    },
    MAILSTATUS:"pl.mailstatus",
    USERFIELDCUSTOMIZATION:"pl.userfieldcustomizations",
    FIELDCUSTOMIZATION:"pl.fieldcustomizations",
    USER_NOTIFICATIONS:"pl.userNotifications",
    UserNotifications:{
        NOTIFICATIONID:"notificationid",
        STATUS:"status",
        USERID:"userid"
    },
    PROCESSES:"pl.processes",
    Processes:{
        USER:"user",
        NAME:"name",
        TOTAL:"total",
        PERCENTAGE:"percentage",
        STATUS:"status",
        ERROR:"error",
        DETAIL:"detail",
        Detail:{
            NAME:"name",
            STATUS:"status",
            ERROR:"error"
        }
    },
    QUERIES:"pl.queries",
    Queries:{
        ID:"id",
        QUERY:"query"
    },
    SERVICES:"pl.services",
    Services:{
        ID:"id",
        QUERY:"query",
        Query:{
            PROPERTIES:[ "filter", "$filter", "parameters", "$parameters", "fields", "$fields", "sort", "$sort", "limit", "$limit", "skip", "$skip", "group", "$group", "recursion", "$recursion"]
        },
        FUNCTION:"function",
        BATCH_QUERY:"batchquery",
        UPDATE:"update",
        Update:{
            PROPERTIES:["insert", "update", "delete", "$insert", "$update", "$delete"]
        },
        TYPE:"type"
    }
};


exports.Index = {
    INDEXES:"pl.indexes",
    Indexes:{
        NAME:"name",
        COLLECTION_ID:"collectionid",
        UNIQUE:"unique",
        MESSAGE:"message",
        BACKGROUND:"background",
        INDEXES:"indexes",
        EXPIRE_AFTER_SECONDS:"expireAfterSeconds",
        DROP_DUPS:"dropDups",
        SPARSE:"sparse"
    }
};


exports.MailService = {
    MAILCREDENTIALS:"pl.mailcredentials",
    Credential:{
        AMAZON_SECRET_KEY:"amazonsecretkey",
        AMAZON_ACCESS_KEY:"amazonaccesskey",
        AMAZON_REGION:"amazonregion",
        SENDGRID_USERNAME:"sendgridusername",
        SENDGRID_PASSWORD:"sendgridpassword",
        USER_NAME:"username",
        PASSWORD:"password",
        SERVICE:"service",
        TYPE:"type",
        FROM:"from",
        FROMNAME:"fromname"
    },
    Options:{
        FROM:"from",
        FROMNAME:"fromname",
        TO:"to",
        CC:"cc",
        BCC:"bcc",
        SUBJECT:"subject",
        TEXT:"text",
        HTML:"html",
        BODY:"body",
        TEMPLATE:"template",
        TEMPLATE_DATA:"data",
        ATTACHMENTS:"attachments",
        AttachmentOptions:{
            FILE_NAME:"fileName",
            CONTENTS:"contents",
            CONTENT_TYPE:"contentType",
            FILE_PATH:"filePath",
            STREAM_SOURCE:"streamSource",
            CID:"cid"
        },
        FILES:"files",
        Files:{
            FILE_NAME:"filename",
            CONTENT:"content",
            CONTENT_TYPE:"contentType"
        }

    }
};

exports.Trigger = {
    TRIGGERS:"triggers",
    Triggers:{
        FUNCTIONNAME:"functionName",
        OPERATIONS:"operations",
        WHEN:"when",
        REQUIREDFIELDS:"requiredfields",
        REQUIREDMODULES:"requiredmodules"
    }
}

exports.TRANSACTIONS = "pl.txs";

exports.Modules = {
    Udt:{
        Duration:{
            TIME:"time",
            UNIT:"unit",
            CONVERTEDVALUE:"convertedvalue",
            Unit:{
                HRS:"Hrs",
                DAYS:"Days",
                MINUTES:"Minutes"
            }
        },
        Currency:{
            AMOUNT:"amount",
            TYPE:"type",
            Type:{
                COLLECTION:"pl.currencies",
                CURRENCY:"currency"
            }
        },
        Unit:{
            QUANTITY:"quantity",
            UNIT:"unit",
            Unit:{
                COLLECTION:"pl.units",
                UNIT:"unit"
            }
        }, File:{
            KEY:"key",
            NAME:"name",
            URL:"url"
        }, Schedule:{
            STARTS_ON:"startsOn", //Schedule start Date.Date and time type column
            REPEATS:"repeats", // When Run Schedule means Minutely,Hourly,Daily...
            Repeats:{
                NONE:"None",
                MINUTELY:"Minutely",
                HOURLY:"Hourly",
                DAILY:"Daily",
                WEEKLY:"Weekly",
                MONTHLY:"Monthly",
                YEARLY:"Yearly"
            },
            REPEAT_EVERY:"repeatEvery", //Run Schedule After like frequency
            REPEAT_ON:"repeatOn", //Define days or week like sun,wed etc.
            NEXT_DUE_ON:"nextDueOn", //when to run schedule next
            SUMMARY:"summary",
            TIMEZONE:"timezone"
        }, DateRange:{
            TO:"to",
            FROM:"from"
        }
    },
    GoogleCalendarMappings:{
        SUMMARY:"summary",
        DESCRIPTION:"description",
        START:"start",
        END:"end",
        DURATION:"duration",
        OWNER:"owner",
        GOOGLE_CALENDAR_ID:"googleCalendarId",
        GOOGLE_CALENDER_SERVICE_FUNCTION:"GoogleApiServices.googleCalender"
    }

};


//exports.Collections = {
//    TABLE:"pl.collections",
//    COLLECTION:"collection", /*could not be changed*/
//    FIELDS:"fields",
//    Fields:{
//        FIELD:"field",
//        TYPE:"type",
//        Type:{
//            STRING:"string",
//            FK:"fk",
//            OBJECT:"object",
//            NUMBER:"number",
//            DECIMAL:"decimal",
//            BOOLEAN:"boolean",
//            DATE:"date"
//        },
//        MULTIPLE:"multiple",
//        PUSH:"push", // Array of string
//        COLLECTION:"collection", // can be object or string
//        MANDATORY:"mandatory",
//        UPSERT:"upsert",
//        PARENT_FIELD:"parentfield",
//        COLLECTIONID:"collectionid"
//
//    },
//    REFERRED_FKS:"referredfks"
//}

exports.ErrorCode = {
    USER_NOT_FOUND:{CODE:1, MESSAGE:"User Not Found."},
    CREDENTIAL_MISSMATCH:{CODE:3, MESSAGE:"Username/Password did not match."},
    USER_ALREADY_EXISTS:{CODE:29, MESSAGE:"User already exists"},
    ALREADY_IN_PROGRESS:{CODE:60, MESSAGE:"Someone is already in progress.Please try after sometime."},
    INVALID_DB_CODE:{CODE:30, MESSAGE:"Invalid db code"},
    MANDATORY_FIELDS:{CODE:31, MESSAGE:"Mandatory fields can not be left blank"},
    ONLY_ADMIN_CAN_ADD_USER:{CODE:32, MESSAGE:"Only admin can add user"},
    MAX_LEVEL_EVENTS:{CODE:33, MESSAGE:"More than 50 retries, Recursion level >>>>>"},
    NOT_CONNECTED:{CODE:35, MESSAGE:"Not connected"},
    PASSWORD_RESET:{CODE:36, MESSAGE:"Password Reset successfully"},
    VERIFICATION_PENDING:{CODE:40, MESSAGE:"User Verification Pending."},
    VERIFICATION:{CODE:41, MESSAGE:"User Verified successfully"},
    ACCOUNT_DEACTIVATED:{CODE:42, MESSAGE:"Account DeActivated."},
    UNIQUE_INDEX:{CODE:11000, MESSAGE:"Duplicate Index found."}
};


exports.FieldCustomizations = {
    TABLE:"pl.fieldcustomizations",
    FIELD_ID:"fieldid",
    COLLECTION_ID:"collectionid",
    QVIEW_ID:"qviewid",
    SOURCE_ID:"sourceid",
    LABEL:"label",
    INDEX_FORM:"indexForm",
    INDEX_GRID:"indexGrid",
    WIDTH:"width",
    VISIBILITY:"visibility",
    VISIBILITY_FORM:"visibilityForm",
    VISIBILITY_GRID:"visibilityGrid",
    MERGE_PROPERTIES:[
        "label", "indexForm", "indexGrid", "width", "visibility", "visibilityForm", "visibilityGrid"
    ]
}


exports.UserFieldCustomizations = {
    TABLE:"pl.userfieldcustomizations",
    USER_ID:"userid"
};

exports.ApplaneCustomers = {
    TABLE:"applaneCustomers",
    DB:"db",
    DELIVERYID:"deliveryid",
    EMPLOYEEID:"employeeid"
};

exports.CustomerTags = {
    TABLE:"customerTags",
    APPLICATION_TAGS:"applicationTags",
    MAIN_DB:"main_db",
    CLIENT_DB:"client_db"
};

exports.ContactSupports = {
    TABLE:"pl.contactSupports",
    SUBJECT:"subject",
    DESCRIPTION:"description",
    FILE:"file",
    ATTACHMENT:"attachment",
    TYPE:"task_type",
    APPLICATION_TAGS:"applicationTags",
    STATUS:"status",
    COMPLETED_DATE:"completeddate",
    OWNER_ID:"ownerid",
    TASK_PROGRESS:"task_progress",
    PROGRESS_DATE:"progressdate",
    WORK_DONE_DESCRIPTION:"workdonedescription",
    HRS_SPENT:"hrsspent",
    OWNER:"owner",
    SCOPE:"scope",
    Scope:{
        SELF:"Self",
        ORGANIZATION:"Organization"
    }
};

exports.USER_FIELDS = {username:1, emailid:1, roles:1, fullname:1, status:1, developer:1};

exports.WorkflowProcesses = {
    WORKFLOW_PROCESSES:"pl.workflowprocesses",
    WorkflowProcesses:{
        COLLECTION:"collection",
        FK:"fk",
        Fk:{
            _ID:"_id"
        },
        STATUS:"status"
    }
};

exports.WorkFlow = {
    WORKFLOW:"pl.workflow",
    WorkFlow:{
        SUBJECT:"subject",
        DETAIL:"detail",
        INITIATOR:"initiator",
        ACTION:"action",
        OWNER:"owner",
        COLLECTION:"collection",
        EVENT:"event",
        STATUS:"status",
        FK:"fk",
        Fk:{
            _ID:"_id"
        },
        APPROVER_ACTION:"approverAction",
        COMMENT:"comment",
        MAILOPTIONS:"mailoptions",
        MailOptions:{
            TO:"to",
            SUBJECT:"subject",
            CC:"cc",
            BODY:"body",
            FROM:"from"
        }
    }
};
