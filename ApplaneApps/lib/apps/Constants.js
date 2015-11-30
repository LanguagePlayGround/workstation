var Constants = require("ApplaneDB/lib/Constants.js");
var SELF = require("./Constants.js");

/**
 * Query indexes
 * pl.fields - > collectionid._id   parentfieldid._id
 * db.pl.fields.ensureIndex({"collectionid._id":1,"parentfieldid._id":1},{name:"collectionid_parentfieldid"}) --> also check index on metadata tables
 * pl.collections - > collection
 * db.pl.collections.ensureIndex({collection:1},{name:"collection"}) --> Unique index on collectionname on admin db
 * pl.referredfks --> referredcollectionid._id
 *
 */

exports.Indexes = [
    {collection: Constants.Admin.SERVICES, indexes: [
        {indexes: {id: 1}, unique: true, name: "plservicesIndex", background: true}
    ]},
    {collection: Constants.Admin.DBS, indexes: [
        {indexes: {db: 1}, unique: true, name: "plDbsIndex", background: true},
        {indexes: {admindb: 1}, unique: true, name: "pladmindbindex", background: true, sparse: true}
    ]},
    {collection: Constants.Admin.CONNECTIONS, indexes: [
        {indexes: {lastUpdatedOn: 1}, name: "LastUpdatedOnIndex", background: true, expireAfterSeconds: 3600 * 24 * 7} ,
        {indexes: {token: 1}, name: "plConnectionsIndexToken", background: true}
    ]},
    {collection: Constants.Admin.FUNCTION_LOGS, indexes: [
        {indexes: {source: 1, db: 1}, name: "sourceIndex", background: true, unique: true}
    ]},
    {collection: Constants.Admin.LOGS, indexes: [
        {indexes: {startTime: 1}, name: "plLogsIndex", background: true, expireAfterSeconds: 3600 * 24 * 7},
        {indexes: {type: 1, status: 1}, name: "plLogsIndexType", background: true}
    ]},
    {collection: Constants.Admin.APP_LOCKS, indexes: [
        {indexes: {__createdOn: 1}, name: "applockscreatedOnIndex", background: true, expireAfterSeconds: 60 * 60},
        {indexes: {lock: 1, db: 1}, name: "applocksIndex", background: true, unique: true}
    ]},
    {collection: Constants.Admin.LOCKS, indexes: [
        {indexes: {lock: 1, db: 1}, name: "lockDbUniqueIndex", background: true, unique: true}
    ]},
    {collection: Constants.Admin.USERS, indexes: [
        {indexes: {username: 1}, unique: true, name: "UserNameIndex", background: true},
        {indexes: {emailid: 1}, unique: true, name: "userEmailidIndex", background: true, sparse: true},
        {indexes: {mobile_no: 1}, unique: true, name: "userMobileIndex", background: true, sparse: true}
    ]},
    {collection: Constants.Admin.FUNCTIONS, indexes: [
        {indexes: {name: 1}, unique: true, name: "plFunctionIndex", background: true}
    ]},
    {collection: Constants.Admin.ROLES, indexes: [
        {indexes: {id: 1}, unique: true, name: "plRolesIdIndex", background: true},
        {indexes: {role: 1}, unique: true, name: "plRolesIndex", background: true}
    ]},
    {collection: "pl.rolePrivileges", indexes: [
        {indexes: {id: 1}, unique: true, name: "plRolesPrivilegesIndex", background: true}
    ]},
    {collection: Constants.Admin.APPLICATIONS, indexes: [
        {indexes: {label: 1}, unique: true, name: "plApplicationIndex", background: true},
        {indexes: {id: 1}, unique: true, name: "plApplicationIdIndex", background: true}
    ]},
    {collection: Constants.Admin.MENUS, indexes: [
        {indexes: {"application._id": 1, "parentmenu._id": 1, label: 1}, unique: true, name: "plMenusIndex", background: true}
    ]},
    {collection: Constants.Admin.COLLECTIONS, indexes: [
        {indexes: {collection: 1}, unique: true, name: "plCollectionIndex", background: true},
        {indexes: {"parentCollection": 1, "doNotSynch": 1}, name: "plCollectionsDontSyncParentIndex", background: true}
    ]},
    {collection: Constants.Admin.FIELDS, indexes: [
        {indexes: {"collectionid._id": 1, "parentfieldid._id": 1, field: 1 }, unique: true, name: "plFieldsUniqueIndex", background: true},
        {indexes: {"collectionid._id": 1, __system__: 1}, name: "plFieldIndexViewFields", background: true},
        {indexes: {"field": "text", label: "text", "parentfieldid.field": "text"}, name: "plFieldFTSIndex", background: true},
        {indexes: {"collectionid.collection": 1}, name: "collectionid.collection", background: true}
    ]},
    {collection: Constants.Admin.ACTIONS, indexes: [
        {indexes: {"collectionid._id": 1, label: 1}, unique: true, name: "plActionsIndex", background: true}
    ]},
    {collection: Constants.Admin.FORM_GROUPS, indexes: [
        {indexes: {"collectionid._id": 1, title: 1}, unique: true, name: "plFormGroupsIndex", background: true}
    ]},
    {collection: Constants.Index.INDEXES, indexes: [
        {indexes: {"collectionid._id": 1, name: 1}, unique: true, name: "plIndexes", background: true}
    ]},
    {collection: Constants.Admin.QVIEWS, indexes: [
        {indexes: {"id": 1}, unique: true, name: "plQviewsUniqueIndex", background: true},
        {indexes: {"collection._id": 1}, name: "plQviewsIndex", background: true}
    ]},
    {collection: Constants.Admin.REFERRED_FKS, indexes: [
        {indexes: {"collectionid._id": 1}, name: "plReferredFksIndex", background: true},
        {indexes: {"referredcollectionid.collection": 1}, name: "plReferredFksReferrecCollectionIndex", background: true},
        {indexes: {"referredfieldid._id": 1}, name: "plReferredFksReferrecFieldIndex", background: true},
        {indexes: {"collectionid.collection": 1}, name: "collectionid.collection", background: true}
    ]},
    {collection: Constants.Admin.FILTERSPACE, indexes: [
        {indexes: {space: 1}, unique: true, name: "plFilterSpaceIndex", background: true}
    ]},
    {collection: Constants.Admin.EMAILTRACKERS, indexes: [
        {indexes: {function: 1}, unique: true, name: "EmailTrackersUnique", background: true}
    ]},
    {collection: Constants.Admin.CRONS, indexes: [
        {indexes: {name: 1}, unique: true, name: "plCronsUniqueIndex", background: true}
    ]},
    {collection: Constants.TRANSACTIONS, indexes: [
        {indexes: {txid: 1}, name: "plTransactionsIndex", background: true}
    ]},
    {collection: Constants.Admin.SERIES, indexes: [
        {indexes: {series: 1, collection: 1}, name: "plSeriesIndex", background: true, unique: true}
    ]},
    {collection: Constants.Admin.NOTIFICATIONS, indexes: [
        {indexes: {id: 1}, name: "notificationIndex", background: true, unique: true}
    ]},
    {collection: Constants.Admin.USER_NOTIFICATIONS, indexes: [
        {indexes: {notificationid: 1, "userid._id": 1}, name: "userNotoficationIndex", background: true, unique: true}
    ]},
    {collection: Constants.Admin.GMAIL_MESSAGES, indexes: [
        {indexes: {messageid: 1, "user.userid": 1}, name: "userMessageIndex", background: true, unique: true}
    ]},
    {collection: Constants.Admin.PROCESSES, indexes: [
        {indexes: {status: 1, "date": 1, "user._id": 1}, name: "processesIndex", background: true}
    ]},
    {collection: Constants.Admin.USERFIELDCUSTOMIZATION, indexes: [
        {indexes: {"userid._id": 1, "collectionid._id": 1}, name: "userid_collectionid", background: true}
    ]},
    {collection: Constants.Admin.MAILSTATUS, indexes: [
        {indexes: {date: 1}, name: "TTL_date", background: true, expireAfterSeconds: 3600 * 24 * 7}
    ]},
    {collection: Constants.Admin.FIELDCUSTOMIZATION, indexes: [
        {indexes: {"collectionid._id": 1}, name: "fieldCustmizeCollectionidIndex", background: true}
    ]},
    {collection: Constants.Admin.EVENTS, indexes: [
        {indexes: {"collectionid._id": 1}, name: "eventsCollectionidIndex", background: true}
    ]},
    {collection: Constants.Admin.QUERIES, indexes: [
        {indexes: {"id": 1}, name: "idIndex", background: true, unique: true}
    ]},
    {collection: "pl_applications", indexes: [
        {indexes: {"id": 1}, name: "idIndex", background: true, unique: true}
    ]},
    {collection: "pl_views", indexes: [
        {indexes: {"id": 1}, name: "idIndex", background: true, unique: true}
    ]}
];


exports.Applications = {
    TABLE: "pl.applications",
    LABEL: "label",
    DB: "db",
    ROLES: "roles",
    Roles: {
        ROLE: "role"
    }
}

exports.Menus = {
    TABLE: "pl.menus",
    LABEL: "label",
    COLLECTION: "collection",
    INDEX: "index",
    PARENT_MENU: "parentmenu",
    APPLICATION: "application",
    DEFAULT_QVIEW_ID: "defaultqview",
    QVIEWS: "qviews",
    QViews: {
        LABEL: "label",
        QVIEW: "qview",
        INDEX: "index"
    }
}

exports.Actions = {
    TABLE: "pl.actions",
    TYPE: "type",
    Type: {
        VIEW: "view",
        FILTER: "filter",
        INVOKE: "invoke",
        EXPORT: "export",
        Export: {
            EXPORT_TYPE: "exportType",
            ExportType: {
                EXCEL: "excel",
                PDF: "pdf"
            },
            EXPORT_SERVICE: "/rest/export"
        }
    },
    HYPER_REFERENCE: "href",
    LABEL: "label",
    COLLECTION: "collection",
    INDEX: "index",
    DEFAULT_QVIEW_ID: "defaultqview",
    QVIEWS: "qviews",
    QViews: {
        LABEL: "label",
        QVIEW: "qview",
        INDEX: "index"
    }
}

exports.Users = {
    STATE: "state",
    State: {
        SELECTED_APPLICATION: "selectedapplication", /*_id of application*/
        SELECTED_MENU: "selectedmenu" /*json object with */
    }
}

exports.Collections = {
    Fields: {
        LABEL: "label",
        SHOW_ON_TABLE: "showontable",
        SHOW_ON_PANEL: "showonpanel",
        DISPLAY_FIELDS: "displayfields"/*Required for fk*/
    }
}

exports.QViews = {
    TABLE: "pl.qviews",
    LABEL: "label",
    ID: "id",
    UI: "ui",
    COLLECTION: "collection", /*FK of collection*/
    MAIN_COLLECTION: "mainCollection",
    ACTIONS: "actions",
    QFIELDS: "qFields",
    HIDDEN: "hidden"
}

exports.ApplicationReferredCollections = [
    {collection: "pl.menus", filterfield: "application", "field": "label"}
];
exports.CollectionReferredCollections = [
    {collection: "pl.events", "filterfield": "collectionid"},
    {collection: "pl.workflowevents", "filterfield": "collectionid"},
    {collection: "pl.fields", "filterfield": "collectionid", field: "field", recursiveField: "parentfieldid", recursiveDataField: "fields"},
    {collection: "pl.formgroups", "filterfield": "collectionid", field: "title"},
    {collection: "pl.actions", "filterfield": "collectionid", field: "label"},
    {collection: "pl.referredfks", "filterfield": "collectionid"},
    {collection: "pl.indexes", "filterfield": "collectionid", field: "name"},
    {collection: "pl.templates", "filterfield": "collectionid"}
];

exports.CommitCollections = [
    {collection: "pl.functions", field: "name", type: "function"},
    {collection: "pl.filterspace", field: "space", type: "filterspace"},
    {collection: "pl.emailtrackers", field: "function", type: "emailtracker"},
    {collection: "pl.roles", field: "role", type: "role"},
    {collection: "pl.fieldcustomizations", field: "_id", type: "fieldCustomization"},
    {collection: "pl.qviewcustomizations", field: "_id", type: "qviewCustomization"},
    {collection: "pl.rolePrivileges", field: "id", type: "rolePrivileges"},
    {collection: "pl.qviews", field: "id", type: "qview"},
    {collection: "pl.services", field: "id", type: "service"},
    {collection: "pl_applications", field: "id", type: "pl_applications"},
    {collection: "pl_views", field: "id", type: "pl_views"},
    {collection: "pl.applications", field: "label", type: "application", referredCollections: SELF.ApplicationReferredCollections},
    {collection: "pl.collections", field: "collection", type: "collection", referredCollections: SELF.CollectionReferredCollections}
];

exports.VersionControl = {
    NODEMODULES: "/node_modules/",
    CLA: "pl.versioncontrolcla",
    SERVERS: "pl.versioncontrolservers",
    MODULES: "pl.versioncontrolmodules",
    LOGS: "pl.versioncontrollogs",
    LOCKS: "pl.versioncontrollocks",
    SERVICELOGS: "pl.servicelogs",
    Proxy: {
        PROXY: "pl.httpproxyurlmappings",
        HOSTNAME: "127.0.0.1",
        PORT: "80"
    },
    Functions: {
        RESTART: "Restart",
        STOP: "Stop",
        UPDATE: "Update",
        CREATESETUP: "CreateSetup",
        PUBLISH: "Publish"
    },
    Commands: {
        UPDATE: "moduleupdate",
        INSATLL: "moduleinstall",
        BRANCH: "updatebranch"
    }
};
