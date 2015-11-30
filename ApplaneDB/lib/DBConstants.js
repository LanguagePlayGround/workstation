/**
 * Created with IntelliJ IDEA.
 * User: daffodil
 * Date: 3/9/14
 * Time: 1:25 PM
 * To change this template use File | Settings | File Templates.
 */

var Constants = require("./Constants.js");

var referredCollectionEvents = [
    {
        function: "ReferredCollectionEvents.onQuery",
        event: "onQuery",
        pre: true
    },
    {
        function: "ReferredCollectionEvents.onResult",
        event: "onQuery",
        post: true
    },
    {
        function: "ReferredCollectionEvents.onPreSave",
        event: "onSave",
        pre: true
    },
    {
        function: "Metadata.onPreSave",
        event: "onSave",
        pre: true
    },
    {
        function: "ReferredCollectionEvents.onPostSave",
        event: "onSave",
        post: true
    }
]
var mainCollectionEvents = [
    {
        function: "MainCollectionEvents.onResult",
        event: "onQuery",
        post: true
    },
    {
        function: "MainCollectionEvents.onPreSave",
        event: "onSave",
        pre: true

    },
    {
        function: "Metadata.onPreSave",
        event: "onSave",
        pre: true
    },
    {
        function: "MainCollectionEvents.onPostSave",
        event: "onSave",
        post: true
    }
]

var applicationEvents = [
    {
        function: "MainCollectionEvents.onApplicationQuery",
        event: "onQuery",
        pre: true
    }
];
applicationEvents.push.apply(applicationEvents, mainCollectionEvents);

var qviewCustomizationEvents = [
    {
        function: "QviewCustomizations.onPreSave",
        "event": "onSave",
        pre: true
    }
]
qviewCustomizationEvents.push.apply(qviewCustomizationEvents, mainCollectionEvents);

exports.globalCollections = {
    "pl_applications": {
        collection: "pl_applications", fields: [
            {field: "id", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: "menus", type: Constants.Admin.Fields.Type.STRING, json: true, mandatory: true}
        ], events: mainCollectionEvents},
    "pl_views": {
        collection: "pl_views", fields: [
            {field: "id", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: "struct", type: Constants.Admin.Fields.Type.STRING, json: true, mandatory: true}
        ], events: mainCollectionEvents},
    "pl.collections": {collection: Constants.Admin.COLLECTIONS, fields: [
        {field: Constants.Admin.Collections.COLLECTION, type: Constants.Admin.Fields.Type.STRING, mandatory: true, primary: true},
        {field: Constants.Admin.Collections.DB, type: Constants.Admin.Fields.Type.STRING},
        {field: Constants.Admin.Collections.GLOBAL, type: Constants.Admin.Fields.Type.BOOLEAN},
        {field: "doNotSynch", type: Constants.Admin.Fields.Type.BOOLEAN},
        {field: Constants.Admin.Collections.HISTORY_ENABLED, type: Constants.Admin.Fields.Type.BOOLEAN},
        {field: Constants.Admin.Collections.COMMENT_ENABLED, type: Constants.Admin.Fields.Type.BOOLEAN},
        {field: Constants.Admin.Collections.HISTORY_FIELDS, type: Constants.Admin.Fields.Type.STRING, json: true},
        {field: Constants.Admin.Collections.LAST_MODIFIED_TIME, type: Constants.Admin.Fields.Type.DATE},
        {field: Constants.Admin.Collections.USER_SORTING, type: Constants.Admin.Fields.Type.STRING, json: true},
        {field: Constants.Admin.Collections.RESPONSIVE_COLUMNS, type: Constants.Admin.Fields.Type.STRING, json: true}
    ], events: mainCollectionEvents},
    "pl.events": {
        collection: Constants.Admin.EVENTS, fields: [
            {field: Constants.Admin.Events.COLLECTION_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.COLLECTIONS, set: [Constants.Admin.Collections.COLLECTION], mandatory: true},
            {field: Constants.Admin.Events.EVENT, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: Constants.Admin.Events.FUNCTION, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: Constants.Admin.Events.PRE, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Admin.Events.POST, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Admin.Events.REQUIRE, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Events.OPTIONS, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Events.CLIENT, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Admin.Events.SERVER, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Admin.Events.REQUIRED_FIELDS, type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: Constants.Admin.Events.REQUIRED_MODULES, type: Constants.Admin.Fields.Type.STRING, json: true}
        ], events: [
            {
                function: "ReferredCollectionEvents.onQuery",
                event: "onQuery",
                pre: true
            },
            {
                function: "ReferredCollectionEvents.onResult",
                event: "onQuery",
                post: true
            },
            {
                function: "ReferredCollectionEvents.onPreSave",
                event: "onSave",
                pre: true
            },
            {
                function: "Metadata.onPreSave",
                event: "onSave",
                pre: true
            },
            {
                function: "ReferredCollectionEvents.onPostSave",
                event: "onSave",
                post: true
            },
            {
                function: "Events.onPreSave",
                event: "onSave",
                pre: true
            }
        ]
    },
    "pl.workflowevents": {
        collection: Constants.Admin.WORK_FLOW_EVENTS, fields: [
            {field: Constants.Admin.WorkFlowEvents.COLLECTION_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.COLLECTIONS, set: [Constants.Admin.Collections.COLLECTION], mandatory: true},
            {field: Constants.Admin.WorkFlowEvents.EVENT, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: Constants.Admin.WorkFlowEvents.ACTION, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.WorkFlowEvents.CONDITION, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.WorkFlowEvents.TRIGGER_EVENT, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.WorkFlowEvents.PARAMETERS, type: Constants.Admin.Fields.Type.STRING, json: true}
        ], events: [
            {
                function: "ReferredCollectionEvents.onQuery",
                event: "onQuery",
                pre: true
            },
            {
                function: "ReferredCollectionEvents.onResult",
                event: "onQuery",
                post: true
            },
            {
                function: "ReferredCollectionEvents.onPreSave",
                event: "onSave",
                pre: true
            },
            {
                function: "Metadata.onPreSave",
                event: "onSave",
                pre: true
            },
            {
                function: "ReferredCollectionEvents.onPostSave",
                event: "onSave",
                post: true
            } ,
            {
                function: "WorkFlowEvents.onPreSave",
                event: "onSave",
                post: true
            }
        ]
    },
    "pl.fields": {
        collection: Constants.Admin.FIELDS, fields: [
            {field: Constants.Admin.Fields.FIELD, type: Constants.Admin.Fields.Type.STRING, mandatory: true, primary: true},
            {field: Constants.Admin.Fields.TYPE, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: Constants.Admin.Fields.COLLECTION_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.COLLECTIONS, set: [Constants.Admin.Collections.COLLECTION], mandatory: true},
            {field: Constants.Admin.Fields.ROLE_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.ROLES, set: [Constants.Admin.Roles.ROLE]},
            {field: Constants.Admin.Fields.PARENT_FIELD_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.FIELDS, set: [Constants.Admin.Fields.FIELD]},
            {field: Constants.Admin.Fields.QUERY, type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: Constants.Admin.Fields.REFERREDVIEW, type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: Constants.Admin.Fields.RESPONSIVE_COLUMNS, type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: Constants.Admin.Fields.RECURSION, type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: Constants.Admin.Fields.FILTER, type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: Constants.Admin.Fields.CASCADE, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Admin.Fields.FILTERSPACE_ID, type: Constants.Admin.Fields.Type.FK, collection: Constants.Admin.FILTERSPACE},
            {field: Constants.Admin.Fields.EVENTS, type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: Constants.Admin.Fields.NON_PERSISTENT, type: Constants.Admin.Fields.Type.BOOLEAN}
        ], events: [
            {
                function: "Fields.onQuery",
                event: "onQuery",
                pre: true
            },
            {
                function: "Fields.onResult",
                event: "onQuery",
                post: true
            },
            {
                function: "Fields.onPreSave",
                event: "onSave",
                pre: true
            },
            {
                function: "Metadata.onPreSave",
                event: "onSave",
                pre: true
            },
            {
                function: "Fields.onPostSave",
                event: "onSave",
                post: true
            }
        ]
    },
    "pl.referredfks": {
        collection: Constants.Admin.REFERRED_FKS, fields: [
            {field: Constants.Admin.ReferredFks.COLLECTION_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.COLLECTIONS, set: [Constants.Admin.Collections.COLLECTION], mandatory: true},
            {field: Constants.Admin.ReferredFks.FIELD, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: Constants.Admin.ReferredFks.SET, type: Constants.Admin.Fields.Type.JSON, multiple: true},
            {field: Constants.Admin.ReferredFks.CASCADE, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Admin.ReferredFks.REPLICATE, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Admin.ReferredFks.REFERRED_COLLECTION_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.COLLECTIONS, set: [Constants.Admin.Collections.COLLECTION], mandatory: true},
            {field: Constants.Admin.ReferredFks.REFERRED_FIELD_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.FIELDS, set: [Constants.Admin.Fields.FIELD], mandatory: true}
        ], events: [
            {
                function: "ReferredFks.onQuery",
                event: "onQuery",
                pre: true
            },
            {
                function: "ReferredFks.onResult",
                event: "onQuery",
                post: true
            },
            {
                function: "ReferredFks.onPostSave",
                event: "onSave",
                post: true
            }
            //do not add metadata save events as referredfk is not part of changelogs.
        ]
    },
    "pl.roles": {
        collection: "pl.roles", fields: [
            {field: Constants.Admin.Roles.ID, type: Constants.Admin.Fields.Type.STRING, mandatory: true, primary: true},
            {field: Constants.Admin.Roles.ROLE, type: Constants.Admin.Fields.Type.STRING, mandatory: true, primary: true},
            {field: Constants.Admin.Roles.SPAN, type: Constants.Admin.Fields.Type.NUMBER},
            {field: "doNotSynch", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Admin.Roles.PARENT_ROLE_ID, type: Constants.Admin.Fields.Type.FK, collection: "pl.roles", set: ["id", "role"]},
            {field: Constants.Admin.Roles.GROUP, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Admin.Roles.DEFAULT, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Admin.Roles.APPLICATION_ID, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Roles.PRIVILEGES, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: Constants.Admin.Roles.Privileges.TYPE, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                {field: Constants.Admin.Roles.Privileges.PRIVILEGE_ID, type: Constants.Admin.Fields.Type.FK, collection: "pl.rolePrivileges", set: ["id"]},
                {field: Constants.Admin.Roles.Privileges.COLLECTION, type: Constants.Admin.Fields.Type.STRING},

                {field: Constants.Admin.Roles.Privileges.FIELDS_AVAILABILITY, type: Constants.Admin.Fields.Type.STRING},
                {field: Constants.Admin.Roles.Privileges.FIELD_INFOS, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                    {field: Constants.Admin.Roles.Privileges.FieldInfos.FIELD, type: Constants.Admin.Fields.Type.STRING, mandatory: true}
                ]} ,

                {field: Constants.Admin.Roles.Privileges.FILTER_UI, type: Constants.Admin.Fields.Type.STRING},
                {field: Constants.Admin.Roles.Privileges.FILTER_JSON, type: Constants.Admin.Fields.Type.STRING, json: true},
                {field: Constants.Admin.Roles.Privileges.FILTER_INFOS, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                    {field: Constants.Admin.Roles.Privileges.FilterInfos.FIELD, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                    {field: Constants.Admin.Roles.Privileges.FilterInfos.OPERATOR, type: Constants.Admin.Fields.Type.STRING},
                    {field: Constants.Admin.Roles.Privileges.FilterInfos.VALUE, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                    {field: Constants.Admin.Roles.Privileges.FilterInfos.LOGICAL_OPERATOR, type: Constants.Admin.Fields.Type.STRING}
                ]} ,

                {field: Constants.Admin.Roles.Privileges.ACTIONS_AVAILABILITY, type: Constants.Admin.Fields.Type.STRING},
                {field: Constants.Admin.Roles.Privileges.ACTION_INFOS, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                    {field: Constants.Admin.Roles.Privileges.ActionInfos.ACTION, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                    {field: Constants.Admin.Roles.Privileges.ActionInfos.FILTER_JSON, type: Constants.Admin.Fields.Type.STRING, json: true}
                ]} ,

                {field: Constants.Admin.Roles.Privileges.VIEWS_AVAILABILITY, type: Constants.Admin.Fields.Type.STRING},
                {field: Constants.Admin.Roles.Privileges.VIEW_INFOS, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                    {field: Constants.Admin.Roles.Privileges.ViewInfos.VIEW, type: Constants.Admin.Fields.Type.STRING, mandatory: true}
                ]} ,

                {field: Constants.Admin.Roles.Privileges.RESOURCE, type: Constants.Admin.Fields.Type.STRING, json: true},
                {field: Constants.Admin.Roles.Privileges.ACTIONS, type: Constants.Admin.Fields.Type.STRING, json: true},
                {field: Constants.Admin.Roles.Privileges.VIEWS, type: Constants.Admin.Fields.Type.STRING, json: true},

                {field: Constants.Admin.Roles.Privileges.OPERATION_INFOS, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, mandatory: true, fields: [
                    {field: Constants.Admin.Roles.Privileges.OperationInfos.TYPE, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                    {field: Constants.Admin.Roles.Privileges.OperationInfos.PRIMARY_FIELDS, type: Constants.Admin.Fields.Type.BOOLEAN},
                    {field: Constants.Admin.Roles.Privileges.OperationInfos.FIELDS_AVAILABILITY, type: Constants.Admin.Fields.Type.STRING},
                    {field: Constants.Admin.Roles.Privileges.OperationInfos.FIELD_INFOS, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                        {field: Constants.Admin.Roles.Privileges.OperationInfos.FieldInfos.FIELD, type: Constants.Admin.Fields.Type.STRING, mandatory: true}
                    ]},
                    {field: Constants.Admin.Roles.Privileges.OperationInfos.FILTER_UI, type: Constants.Admin.Fields.Type.STRING},
                    {field: Constants.Admin.Roles.Privileges.OperationInfos.FILTER_JSON, type: Constants.Admin.Fields.Type.STRING, json: true},
                    {field: Constants.Admin.Roles.Privileges.OperationInfos.FILTER_INFOS, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                        {field: Constants.Admin.Roles.Privileges.OperationInfos.FilterInfos.FIELD, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                        {field: Constants.Admin.Roles.Privileges.OperationInfos.FilterInfos.OPERATOR, type: Constants.Admin.Fields.Type.STRING},
                        {field: Constants.Admin.Roles.Privileges.OperationInfos.FilterInfos.VALUE, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                        {field: Constants.Admin.Roles.Privileges.OperationInfos.FilterInfos.LOGICAL_OPERATOR, type: Constants.Admin.Fields.Type.STRING}
                    ]},
                    {field: Constants.Admin.Roles.Privileges.OperationInfos.FK_INFOS, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                        {field: Constants.Admin.Roles.Privileges.OperationInfos.FkInfos.FIELD, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                        {field: Constants.Admin.Roles.Privileges.OperationInfos.FkInfos.PRIVILEGE_ID, type: Constants.Admin.Fields.Type.FK, mandatory: true, collection: "pl.rolePrivileges", set: ["id"]}
                    ]}
                ]},
                {field: Constants.Admin.Roles.Privileges.SHOW_RESULT_IN_JSON, type: Constants.Admin.Fields.Type.STRING},
                {field: Constants.Admin.Roles.Privileges.FILTER_NAME, type: Constants.Admin.Fields.Type.STRING},
                {field: Constants.Admin.Roles.Privileges.REGEX, type: Constants.Admin.Fields.Type.BOOLEAN}
            ]},
            {field: Constants.Admin.Roles.MENUS_AVAILABILITY, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Roles.MENU_INFOS, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: Constants.Admin.Roles.MenuInfos.MENU, type: Constants.Admin.Fields.Type.FK, mandatory: true, collection: "pl.menus", set: ["label"]}
            ]} ,
            {field: "roles", type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: "role", type: Constants.Admin.Fields.Type.FK, "collection": "pl.roles", set: ["id", "role"]}
            ]},
            {field: "childRoles", type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: "appid", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                {field: "role", type: Constants.Admin.Fields.Type.FK, "collection": "pl.roles", set: ["id", "role", "group"]}
            ]}
        ], events: [
            {
                function: "Roles.onResult",
                event: "onQuery",
                post: true
            },
            {
                function: "Roles.onPreSave",
                event: "onSave",
                pre: true
            },
            {
                function: "Metadata.onPreSave",
                event: "onSave",
                pre: true
            },
            {
                function: "Roles.onPostSave",
                event: "onSave",
                post: true
            },
            {
                function: "Roles.onQuery",
                event: "onQuery",
                pre: true
            }
        ]
    },
    "pl.rolePrivileges": {
        collection: "pl.rolePrivileges", fields: [
            {field: Constants.Admin.Roles.ID, type: Constants.Admin.Fields.Type.STRING, mandatory: true, primary: true},
            {field: Constants.Admin.Roles.Privileges.TYPE, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: Constants.Admin.Roles.Privileges.COLLECTION, type: Constants.Admin.Fields.Type.STRING},

            {field: Constants.Admin.Roles.Privileges.FIELDS_AVAILABILITY, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Roles.Privileges.FIELD_INFOS, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: Constants.Admin.Roles.Privileges.FieldInfos.FIELD, type: Constants.Admin.Fields.Type.STRING, mandatory: true}
            ]} ,

            {field: Constants.Admin.Roles.Privileges.FILTER_UI, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Roles.Privileges.FILTER_JSON, type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: Constants.Admin.Roles.Privileges.FILTER_INFOS, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: Constants.Admin.Roles.Privileges.FilterInfos.FIELD, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                {field: Constants.Admin.Roles.Privileges.FilterInfos.OPERATOR, type: Constants.Admin.Fields.Type.STRING},
                {field: Constants.Admin.Roles.Privileges.FilterInfos.VALUE, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                {field: Constants.Admin.Roles.Privileges.FilterInfos.LOGICAL_OPERATOR, type: Constants.Admin.Fields.Type.STRING}
            ]} ,

            {field: Constants.Admin.Roles.Privileges.ACTIONS_AVAILABILITY, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Roles.Privileges.ACTION_INFOS, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: Constants.Admin.Roles.Privileges.ActionInfos.ACTION, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                {field: Constants.Admin.Roles.Privileges.ActionInfos.FILTER_JSON, type: Constants.Admin.Fields.Type.STRING, json: true}
            ]} ,

            {field: Constants.Admin.Roles.Privileges.VIEWS_AVAILABILITY, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Roles.Privileges.VIEW_INFOS, type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: Constants.Admin.Roles.Privileges.ViewInfos.VIEW, type: Constants.Admin.Fields.Type.STRING, mandatory: true}
            ]} ,

            {field: Constants.Admin.Roles.Privileges.RESOURCE, type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: Constants.Admin.Roles.Privileges.ACTIONS, type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: Constants.Admin.Roles.Privileges.VIEWS, type: Constants.Admin.Fields.Type.STRING, json: true},

            {field: Constants.Admin.Roles.Privileges.OPERATION_INFOS, type: Constants.Admin.Fields.Type.STRING, fields: [
                {field: Constants.Admin.Roles.Privileges.OperationInfos.TYPE, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                {field: Constants.Admin.Roles.Privileges.OperationInfos.PRIMARY_FIELDS, type: Constants.Admin.Fields.Type.BOOLEAN},
                {field: Constants.Admin.Roles.Privileges.OperationInfos.FIELDS_AVAILABILITY, type: Constants.Admin.Fields.Type.STRING},
                {field: Constants.Admin.Roles.Privileges.OperationInfos.FIELD_INFOS, type: Constants.Admin.Fields.Type.STRING, fields: [
                    {field: Constants.Admin.Roles.Privileges.OperationInfos.FieldInfos.FIELD, type: Constants.Admin.Fields.Type.STRING, mandatory: true}
                ]},
                {field: Constants.Admin.Roles.Privileges.OperationInfos.FILTER_UI, type: Constants.Admin.Fields.Type.STRING},
                {field: Constants.Admin.Roles.Privileges.OperationInfos.FILTER_JSON, type: Constants.Admin.Fields.Type.STRING, json: true},
                {field: Constants.Admin.Roles.Privileges.OperationInfos.FILTER_INFOS, type: Constants.Admin.Fields.Type.STRING, fields: [
                    {field: Constants.Admin.Roles.Privileges.OperationInfos.FilterInfos.FIELD, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                    {field: Constants.Admin.Roles.Privileges.OperationInfos.FilterInfos.OPERATOR, type: Constants.Admin.Fields.Type.STRING},
                    {field: Constants.Admin.Roles.Privileges.OperationInfos.FilterInfos.VALUE, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                    {field: Constants.Admin.Roles.Privileges.OperationInfos.FilterInfos.LOGICAL_OPERATOR, type: Constants.Admin.Fields.Type.STRING}
                ]}
            ]},
            {field: Constants.Admin.Roles.Privileges.SHOW_RESULT_IN_JSON, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Roles.Privileges.FILTER_NAME, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Roles.Privileges.REGEX, type: Constants.Admin.Fields.Type.BOOLEAN}
        ], events: mainCollectionEvents
    },
    "pl.emailtrackers": {collection: "pl.emailtrackers", fields: [
        {field: "function", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
        {field: "status", type: Constants.Admin.Fields.Type.STRING}
    ], events: mainCollectionEvents
    },
    "pl.applications": {
        collection: "pl.applications", fields: [
            {field: "id", type: Constants.Admin.Fields.Type.STRING, mandatory: true, primary: true},
            {field: "label", type: Constants.Admin.Fields.Type.STRING, mandatory: true, primary: true},
            {field: "group", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "moduleName", type: Constants.Admin.Fields.Type.STRING},
            {field: "index", type: Constants.Admin.Fields.Type.NUMBER},
            {field: "db", type: Constants.Admin.Fields.Type.STRING},
            {field: "defaultmenu", type: Constants.Admin.Fields.Type.FK, "collection": "pl.menus", set: ["label"]},
            {field: "defaultRoleId", type: Constants.Admin.Fields.Type.FK, "collection": "pl.roles", set: ["id", "role"]},
            {field: "doNotSynch", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "unpublished", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "newRole", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "addRoleToUser", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "roles", type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: "role", type: Constants.Admin.Fields.Type.FK, "collection": "pl.roles", set: ["id", "role"], mandatory: true}
            ]},
            {field: "collections", type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: "collection", type: Constants.Admin.Fields.Type.STRING, mandatory: true}
            ]},
            {field: "childApplications", type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: "application", type: Constants.Admin.Fields.Type.FK, "collection": "pl.applications", set: ["id", "label"]}
            ]},
            {field: "setupViews", type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: "index", type: Constants.Admin.Fields.Type.NUMBER, mandatory: true},
                {field: "label", type: Constants.Admin.Fields.Type.STRING},
                {field: "view", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                {field: "limit", type: Constants.Admin.Fields.Type.NUMBER},
                {field: "ui", type: Constants.Admin.Fields.Type.STRING}
            ]}
        ], events: applicationEvents
    },
    "pl.menus": {
        collection: "pl.menus", fields: [
            {field: "label", type: Constants.Admin.Fields.Type.STRING, mandatory: true, primary: true},
            {field: "index", type: Constants.Admin.Fields.Type.DECIMAL},
            {field: "collection", type: Constants.Admin.Fields.Type.STRING},
            {field: "transform", type: Constants.Admin.Fields.Type.STRING},
            {field: "parentmenu", type: Constants.Admin.Fields.Type.FK, "collection": "pl.menus", set: ["label"]},
            {field: "application", type: Constants.Admin.Fields.Type.FK, "collection": "pl.applications", mandatory: true, set: ["id", Constants.Admin.Applications.LABEL]},
            {field: "defaultqview", type: Constants.Admin.Fields.Type.FK, "collection": "pl.qviews", set: ["id"]},
            {field: "qviews", type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: "index", type: Constants.Admin.Fields.Type.DECIMAL},
                {field: "collection", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                {field: "id", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                {field: "label", type: Constants.Admin.Fields.Type.STRING, mandatory: true}
            ]}
        ], events: [
            {
                function: "Menus.onQuery",
                event: "onQuery",
                pre: true
            },
            {
                function: "Menus.onResult",
                event: "onQuery",
                post: true
            },
            {
                function: "Menus.onPreSave",
                event: "onSave",
                pre: true
            },
            {
                function: "Metadata.onPreSave",
                event: "onSave",
                pre: true
            },
            {
                function: "Menus.onPostSave",
                event: "onSave",
                post: true
            }
        ]
    },
    "pl.qviewcustomizations": {
        "collection": "pl.qviewcustomizations", fields: [
            {field: "label", type: Constants.Admin.Fields.Type.STRING},
            {field: "index", type: Constants.Admin.Fields.Type.NUMBER},
            {field: "roleid", type: Constants.Admin.Fields.Type.FK, "collection": "pl.roles", set: ["id", "role"]},
            {field: "filter", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "recursion", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "group", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "sort", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "unwind", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "fetchCount", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "dashboardType", type: Constants.Admin.Fields.Type.STRING},
            {field: "ui", type: Constants.Admin.Fields.Type.STRING},
            {field: "queryEvent", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "updateMode", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "crossTabInfo", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "spanreport", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "aggregateSpan", type: Constants.Admin.Fields.Type.STRING, json: true}
        ], events: [
            {
                function: "MainCollectionEvents.onResult",
                event: "onQuery",
                post: true
            },
            {
                function: "MainCollectionEvents.onPreSave",
                event: "onSave",
                pre: true

            },
            {
                function: "Metadata.onPreSave",
                event: "onSave",
                pre: true
            },
            {
                function: "MainCollectionEvents.onPostSave",
                event: "onSave",
                post: true
            },
            {
                function: "QviewCustomizations.onPreSave",
                "event": "onSave",
                pre: true
            }
        ]
    },
    "pl.qviews": {
        collection: "pl.qviews", fields: [
            {field: "label", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: "id", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: "index", type: Constants.Admin.Fields.Type.NUMBER},
            {field: "collection", type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.COLLECTIONS, set: [Constants.Admin.Collections.COLLECTION], mandatory: true},
            {field: "mainCollection", type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.COLLECTIONS, set: [Constants.Admin.Collections.COLLECTION], mandatory: true},
            {field: "roleid", type: Constants.Admin.Fields.Type.FK, "collection": "pl.roles", set: ["id", "role"]},
            {field: "filter", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "recursion", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "group", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "sort", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "unwind", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "fetchCount", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "doNotSynch", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "dashboardType", type: Constants.Admin.Fields.Type.STRING},
            {field: "ui", type: Constants.Admin.Fields.Type.STRING},
            {field: "queryEvent", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "updateMode", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "crossTabInfo", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "spanreport", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "aggregateSpan", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "upsert", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "upsertFields", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "margin", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "qFields", type: "object", multiple: true, fields: [
                {field: "qfield", type: "fk", collection: "pl.fields"},
                {field: "availability", type: "string"},
                {field: "visibility", type: "boolean"},
                {field: "visibilityForm", type: "boolean"},
                {field: "index", type: "number"},
                {field: "indexForm", type: "number"},
                {field: "filter", type: "string", json: true},
                {field: "editableWhen", type: "string"}
            ]},
            {field: "views", type: "object", multiple: true, fields: [
                {field: "alias", type: "string", mandatory: true},
                {field: "id", type: "string", mandatory: true},
                {field: "collection", type: "string", mandatory: true},
                {field: "left", type: "string"} ,
                {field: "right", type: "string"},
                {field: "top", type: "string"},
                {field: "bottom", type: "string"},
                {field: "showAction", type: "boolean"},
                {field: "viewInfo", type: "string", json: true},
                {field: "parametermappings", type: "string", json: true}
            ]}
        ], events: [
            {
                function: "Qviews.onResult",
                event: "onQuery",
                post: true
            },
            {
                function: "Qviews.onPreSave",
                event: "onSave",
                pre: true
            },
            {
                function: "Metadata.onPreSave",
                event: "onSave",
                pre: true
            },
            {
                function: "Qviews.onPostSave",
                event: "onSave",
                post: true
            }
        ]
    },
    "pl.actions": {
        collection: "pl.actions", fields: [
            {field: "id", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: "label", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: "type", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: "onRow", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "onHeader", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "index", type: Constants.Admin.Fields.Type.DECIMAL},
            {field: "collection", type: Constants.Admin.Fields.Type.STRING},
            {field: "filter", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "parameters", type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: "roleid", type: Constants.Admin.Fields.Type.FK, "collection": "pl.roles", set: ["id", "role"]},
            {field: "ui", type: Constants.Admin.Fields.Type.STRING},
            {field: "filterType", type: Constants.Admin.Fields.Type.STRING},
            {field: "asParameter", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "field", type: Constants.Admin.Fields.Type.STRING},
            {field: "displayField", type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Actions.COLLECTION_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.COLLECTIONS, set: [Constants.Admin.Collections.COLLECTION], mandatory: true},
            {field: "templateId", type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.TEMPLATES, set: [Constants.Admin.Templates.ID]},
            {field: "preview", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "defaultquickview", type: Constants.Admin.Fields.Type.FK, "collection": "pl.qviews", set: ["id"]},
            {field: "qviews", type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: "collection", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                {field: "label", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                {field: "id", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                {field: "index", type: Constants.Admin.Fields.Type.DECIMAL},
                {field: "ui", type: Constants.Admin.Fields.Type.STRING}
            ]},
            {field: "fields", type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {"field": "filter", type: Constants.Admin.Fields.Type.STRING, json: true},
                {"field": "parameters", type: Constants.Admin.Fields.Type.STRING, json: true}
            ]},
            {field: "roles", type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: "role", type: Constants.Admin.Fields.Type.FK, "collection": "pl.roles", set: ["id", "role"], mandatory: true}
            ]},
            {field: "views", type: Constants.Admin.Fields.Type.OBJECT, multiple: true, fields: [
                {field: "alias", type: Constants.Admin.Fields.Type.STRING, mandatory: true},
                {field: "filterField", type: Constants.Admin.Fields.Type.STRING},
                {field: "asParameter", type: Constants.Admin.Fields.Type.BOOLEAN}
            ]},
            {field: "showFilterInLeft", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "recursion", type: Constants.Admin.Fields.Type.STRING, json: true}
        ], events: referredCollectionEvents
    },
    "pl.formgroups": {
        collection: "pl.formgroups", fields: [
            {field: "type", type: Constants.Admin.Fields.Type.STRING},
            {field: "noOfColumnsPerRow", type: Constants.Admin.Fields.Type.NUMBER},
            {field: "index", type: Constants.Admin.Fields.Type.NUMBER},
            {field: "title", type: Constants.Admin.Fields.Type.STRING},
            {field: "showTitle", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "separator", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: "showLabel", type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Admin.Fields.COLLECTION_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.COLLECTIONS, set: [Constants.Admin.Collections.COLLECTION], mandatory: true}
        ], events: referredCollectionEvents
    },
    "pl.functions": {
        collection: "pl.functions", fields: [
            {field: "doNotSynch", type: Constants.Admin.Fields.Type.BOOLEAN}
        ], events: mainCollectionEvents
    },
    "pl.indexes": {
        collection: Constants.Index.INDEXES, fields: [
            {field: Constants.Index.Indexes.NAME, type: Constants.Admin.Fields.Type.STRING, mandatory: true},
            {field: Constants.Index.Indexes.INDEXES, type: Constants.Admin.Fields.Type.STRING, mandatory: true, json: true},
            {field: Constants.Index.Indexes.COLLECTION_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.COLLECTIONS, set: [Constants.Admin.Collections.COLLECTION], mandatory: true},
            {field: Constants.Index.Indexes.UNIQUE, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Index.Indexes.MESSAGE, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Index.Indexes.BACKGROUND, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Index.Indexes.SPARSE, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Index.Indexes.DROP_DUPS, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.Index.Indexes.EXPIRE_AFTER_SECONDS, type: Constants.Admin.Fields.Type.NUMBER}
        ], events: referredCollectionEvents
    },
    "pl.filterspace": {
        collection: "pl.filterspace", fields: [
            {field: "space", type: "string"}
        ], events: mainCollectionEvents
    },
    "pl.templates": {collection: Constants.Admin.TEMPLATES, fields: [
        {field: Constants.Admin.Templates.TEMPLATE, type: Constants.Admin.Fields.Type.STRING, collectionid: {$query: {"collection": Constants.Admin.TEMPLATES}}} ,
        {field: Constants.Admin.Templates.TYPE, type: Constants.Admin.Fields.Type.STRING, collectionid: {$query: {"collection": Constants.Admin.TEMPLATES}}},
        {field: Constants.Admin.Templates.QUERY, type: Constants.Admin.Fields.Type.STRING, collectionid: {$query: {"collection": Constants.Admin.TEMPLATES}}},
        {field: Constants.Admin.Templates.FUNCTION, type: Constants.Admin.Fields.Type.STRING, collectionid: {$query: {"collection": Constants.Admin.TEMPLATES}}},
        {field: Constants.Admin.Templates.ID, type: Constants.Admin.Fields.Type.STRING, collectionid: {$query: {"collection": Constants.Admin.TEMPLATES}}},
        {field: Constants.Admin.Templates.SUBJECT, type: Constants.Admin.Fields.Type.STRING, collectionid: {$query: {"collection": Constants.Admin.TEMPLATES}}},
        {field: Constants.Admin.Templates.FROM, type: Constants.Admin.Fields.Type.STRING, collectionid: {$query: {"collection": Constants.Admin.TEMPLATES}}},
        {field: Constants.Admin.Templates.TO, type: Constants.Admin.Fields.Type.STRING, collectionid: {$query: {"collection": Constants.Admin.TEMPLATES}}},
        {field: Constants.Admin.Templates.COLLECTION_ID, type: Constants.Admin.Fields.Type.FK, mandatory: true, "collection": Constants.Admin.COLLECTIONS, set: [Constants.Admin.Collections.COLLECTION], collectionid: {$query: {"collection": Constants.Admin.TEMPLATES}}}
    ], events: [
        {
            function: "TemplateJob.onQuery",
            event: "onQuery",
            pre: true
        },
        {
            function: "TemplateJob.onResult",
            event: "onQuery",
            post: true
        },
        {
            function: "TemplateJob.onPreSave",
            event: "onSave",
            pre: true
        },
        {
            function: "Metadata.onPreSave",
            event: "onSave",
            pre: true
        },
        {
            function: "TemplateJob.onPostSave",
            event: "onSave",
            post: true
        }
    ]
    },
    "pl.fieldcustomizations": {
        collection: Constants.FieldCustomizations.TABLE, fields: [
            {field: Constants.FieldCustomizations.COLLECTION_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.COLLECTIONS, mandatory: true},
            {field: Constants.FieldCustomizations.FIELD_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.FIELDS, mandatory: true},
            {field: Constants.FieldCustomizations.QVIEW_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.QVIEWS},
            {field: Constants.FieldCustomizations.SOURCE_ID, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.FieldCustomizations.LABEL, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.FieldCustomizations.INDEX_FORM, type: Constants.Admin.Fields.Type.NUMBER},
            {field: Constants.FieldCustomizations.INDEX_GRID, type: Constants.Admin.Fields.Type.NUMBER},
            {field: Constants.FieldCustomizations.WIDTH, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.FieldCustomizations.VISIBILITY_FORM, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.FieldCustomizations.VISIBILITY_GRID, type: Constants.Admin.Fields.Type.BOOLEAN}
        ], events: mainCollectionEvents
    },
    "pl.asyncqueue": {collection: "pl.asyncqueue", fields: [
        {field: "txid", type: Constants.Admin.Fields.Type.STRING},
        {field: "operation", type: Constants.Admin.Fields.Type.STRING},
        {field: "status", type: Constants.Admin.Fields.Type.STRING}
    ]},
    "pl.dbs": {collection: Constants.Admin.DBS, fields: [
        {field: Constants.Admin.Dbs.DB, label: "DB", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: true, visibilityForm: true, ui: "text", type: "string", index: 1, sortable: true, filterable: true},
        {field: Constants.Admin.Dbs.ORG_NAME, label: "Org Name", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: true, visibilityForm: true, ui: "text", type: "string", index: 1, sortable: true, filterable: true},
        {field: Constants.Admin.Dbs.GLOBAL_DB, label: "Global DB", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: true, visibilityForm: true, ui: "autocomplete", type: "string", index: 2, collection: "pl.dbs", displayField: "db", filter: {"developmentRight": {$ne: true}}, sort: JSON.stringify({db: 1})},
        {field: Constants.Admin.Dbs.SANDBOX_DB, label: "Sandbox DB", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: true, visibilityForm: true, ui: "text", type: "string", index: 3},
        {field: Constants.Admin.Dbs.SESSION_TIMEOUT, label: "Session Timeout", type: Constants.Admin.Fields.Type.DURATION, visibilityGrid: true, visibilityForm: true, ui: "duration", index: 20},
        {field: Constants.Admin.Dbs.ADMIN_DB, editableWhen: "false", label: "Admin DB", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: false, visibilityForm: false, ui: "text", type: "string", index: 4},
        {field: Constants.Admin.Dbs.CODE, editableWhen: "false", label: "Code", type: Constants.Admin.Fields.Type.STRING, mandatory: true, visibilityGrid: false, visibilityForm: true, ui: "text", type: "string", index: 5},
        {field: Constants.Admin.Dbs.DEVELOPMENT_RIGHT, label: "Development Right", type: Constants.Admin.Fields.Type.BOOLEAN, visibilityGrid: false, visibilityForm: false, editableWhen: "false", ui: "checkbox", type: "boolean", width: "100px", index: 6},
        {field: Constants.Admin.Dbs.AUTO_SYNCH, label: "Auto Synch", type: Constants.Admin.Fields.Type.BOOLEAN, visibilityGrid: true, visibilityForm: true, ui: "checkbox", type: "boolean", width: "100px", index: 6},
        {field: Constants.Admin.Dbs.NOTIFICATION_ENABLED, label: "Notification Enabled", type: Constants.Admin.Fields.Type.BOOLEAN, visibilityGrid: true, visibilityForm: true, ui: "checkbox", type: "boolean", width: "100px", index: 7},
        {field: Constants.Admin.Dbs.CRON_ENABLED, label: "Cron Enabled", type: Constants.Admin.Fields.Type.BOOLEAN, visibilityGrid: true, visibilityForm: true, ui: "checkbox", type: "boolean", width: "100px", index: 8},
        {field: Constants.Admin.Dbs.MOBILE_LOGIN_ENABLED, label: "Mobile Login Enabled", type: Constants.Admin.Fields.Type.BOOLEAN, visibilityGrid: true, visibilityForm: true, ui: "checkbox", type: "boolean", width: "100px", index: 9},
        {field: Constants.Admin.Dbs.SMS_VERIFICATION_ENABLED, label: "SMS Verification Enabled", type: Constants.Admin.Fields.Type.BOOLEAN, visibilityGrid: true, visibilityForm: true, ui: "checkbox", type: "boolean", width: "100px", index: 9.5},
        {field: Constants.Admin.Dbs.SIGNUP_ENABLED, label: "Signup Enabled", type: Constants.Admin.Fields.Type.BOOLEAN, visibilityGrid: true, visibilityForm: true, ui: "checkbox", type: "boolean", width: "100px", index: 9.7},
        {field: Constants.Admin.Dbs.EMAIL_LOGIN_ENABLED, label: "Email Login Enabled", type: Constants.Admin.Fields.Type.BOOLEAN, visibilityGrid: true, visibilityForm: true, ui: "checkbox", type: "boolean", width: "100px", index: 10},
        {field: Constants.Admin.Dbs.ENSURE_USER, label: "Ensure User", type: Constants.Admin.Fields.Type.BOOLEAN, visibilityGrid: true, visibilityForm: true, ui: "checkbox", type: "boolean", width: "100px", index: 11},
        {field: Constants.Admin.Dbs.ENSURE_DEFAULT_COLLECTIONS, label: "Ensure Default Collection", type: Constants.Admin.Fields.Type.BOOLEAN, editableWhen: "(!$globalDb) || ($globalDb.length==0)", visibilityGrid: true, visibilityForm: true, ui: "checkbox", type: "boolean", width: "100px", index: 12},
        {field: Constants.Admin.Dbs.TIMEZONE, label: "Timezone", type: Constants.Admin.Fields.Type.NUMBER, visibilityGrid: true, visibilityForm: true, ui: "number", type: "number", index: 14},
        {field: Constants.Admin.Dbs.GUEST_USER_NAME, label: "Guest Username", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: true, visibilityForm: true, ui: "text", type: "string", index: 15, filterable: true},
        {field: Constants.Admin.Dbs.GLOBAL_USER_NAME, label: "Global Username", type: Constants.Admin.Fields.Type.STRING, mandatory: true, visibilityGrid: true, visibilityForm: true, ui: "text", type: "string", index: 16, filterable: true},
        {field: Constants.Admin.Dbs.GLOBAL_USER_EMAILID, label: "Global User Email", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: false, visibilityForm: true, ui: "text", type: "string", index: 17},
        {field: Constants.Admin.Dbs.GLOBAL_PASSWORD, label: "Global Password", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: false, visibilityForm: true, ui: "text", type: "string", index: 18},
        {field: Constants.Admin.Dbs.GLOBAL_USER_ADMIN, label: "Global User Admin", type: Constants.Admin.Fields.Type.BOOLEAN, visibilityGrid: false, visibilityForm: true, ui: "checkbox", type: "boolean", width: "100px", index: 19},
        {field: Constants.Admin.Dbs.SHORT_ICON, label: "Short Icon", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: true, visibilityForm: true, ui: "autocomplete", options: ["User", "Group", "Business", "Organization"], index: 20},
        {field: Constants.Admin.Dbs.LONG_ICON, label: "Long Icon", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: true, visibilityForm: true, ui: "autocomplete", options: ["User", "Group", "Business", "Organization"], index: 21},
        {field: Constants.Admin.Dbs.REMOTE_URL, label: "Remote Url", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: true, visibilityForm: true, ui: "text", type: "string", index: 22},
        {field: Constants.Admin.Dbs.REMOTE_PORT, label: "Remote Port", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: true, visibilityForm: true, ui: "text", type: "string", index: 23, when: "$remoteURL"},
        {field: Constants.Admin.Dbs.REMOTE_PROCESS, label: "Remote Process", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: false, visibilityForm: true, ui: "text", type: "string", width: "100px", index: 24, when: "$remoteURL", editableWhen: "false"},
        {field: Constants.Admin.Dbs.REMOTE_ERROR, label: "Remote Error", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: false, visibilityForm: true, ui: "text", type: "string", width: "100px", index: 25, when: "$remoteURL", editableWhen: "false"},
        {field: Constants.Admin.Dbs.ALLOWED_SERVICES, label: "Allowed Services", type: Constants.Admin.Fields.Type.OBJECT, visibilityGrid: false, visibilityForm: true, ui: "grid", multiple: true, fields: [
            {field: Constants.Admin.Dbs.AllowedServices.SERVICE, label: "Service", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: false, visibilityForm: true, ui: "text", mandatory: true}
        ]},
        {field: Constants.Admin.Dbs.APPLICATIONS, label: "Applications", type: Constants.Admin.Fields.Type.OBJECT, visibilityGrid: false, visibilityForm: true, ui: "grid", multiple: true, fields: [
            {field: Constants.Admin.Dbs.Applications.APPLICATION, label: "Application", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: false, visibilityForm: true, ui: "text", mandatory: true, ui: "autocomplete", collection: "pl.applications", parameters: {db: "$db"}, events: [
                {
                    function: "Update.getDBApplications",
                    event: "onQuery",
                    post: true
                }
            ]}
        ]},
        {field: Constants.Admin.Dbs.REMOTE_DBS, label: "Remote Dbs", type: Constants.Admin.Fields.Type.OBJECT, visibilityGrid: false, visibilityForm: true, ui: "grid", multiple: true, fields: [
            {field: Constants.Admin.Dbs.RemoteDbs.INDEX, label: "Index", type: Constants.Admin.Fields.Type.NUMBER, visibilityGrid: false, visibilityForm: true, ui: "number", mandatory: true},
            {field: Constants.Admin.Dbs.RemoteDbs.DB, label: "DB", type: Constants.Admin.Fields.Type.STRING, visibilityGrid: false, visibilityForm: true, ui: "text", mandatory: true},
            {field: Constants.Admin.Dbs.RemoteDbs.DATE, label: "Date", type: Constants.Admin.Fields.Type.DATE, visibilityGrid: false, visibilityForm: true, ui: "date", time: true},
            {field: Constants.Admin.Dbs.RemoteDbs.STATUS, label: "Status", type: Constants.Admin.Fields.Type.STATUS, visibilityGrid: false, visibilityForm: true, ui: "string"}
        ]}
    ], events: [
        {
            function: "Update.onPreSave",
            event: "onSave",
            pre: true
        },
        {
            function: "Update.onPostSave",
            event: "onSave",
            post: true
        }
    ], actions: [
        {visibility: true, "index": 10, "id": "updatealldbs", "label": "Update All DBs", "type": "invoke", "onHeader": true, "function": "Porting.updateAllDBs", async: true},
        {visibility: true, "index": 1000, "id": "synch", "label": "Synch", "type": "invoke", "onRow": true, "function": "Synch.synchDb", "async": true, "fields": [
            {"label": "Synch", "field": "synch", "type": "boolean", "ui": "checkbox"}
        ]},
        {visibility: true, "index": 1000, "id": "remoteSynch", "label": "Remote Synch", "type": "invoke", "onRow": true, "function": "RemoteDB.synchDB", "async": true, "fields": [
            {"label": "Synch", "field": "synch", "type": "boolean", "ui": "checkbox"}
        ]},
        {visibility: true, "index": 1000, "id": "portApplicationsAndEnsureIndexes", "label": "Port Applications and Ensure Indexes", "type": "invoke", "onRow": true, "function": "NewPorting.portApplicationsInDbs", "async": true, parameters: {db: "$db"}}
    ]
    },
    "pl.logs": {collection: "pl.logs", fields: [
        {field: "type", type: "string", visibility: true, label: "type"},
        {field: "db", type: "string", ui: "text", visibility: true, label: "DB", filterable: true},
        {field: "info", type: "string", visibility: true, label: "Info"},
        {field: "status", type: "string", visibility: true, label: "Status"},
        {field: "startTime", type: "date", visibility: true, label: "Start Time", ui: "date", time: true},
        {field: "endTime", type: "date", visibility: true, label: "End Time", ui: "date", time: true},
        {field: "totalTime", type: "string", visibility: true, label: "Total Time"},
        {field: "error", type: "string", visibility: true, label: "Error", ui: "json"},
        {field: "requestId", type: "string", visibility: true, label: "Requestid"},
        {field: "url", type: "string", visibility: true, label: "URL"},
        {field: "token", type: "string", visibility: true, label: "token"},
        {field: "missingTime", type: "number", visibility: true, label: "missingTime"},
        {field: "missingDetails", type: "string", visibility: true, label: "missingDetails", json: true},
        {field: "username", type: "string", visibility: true, label: "username", ui: "text", filterable: true},
        {field: "logs", type: "object", multiple: true, ui: "grid", visibilityForm: true, fields: [
            {field: "type", type: "string"},
            {field: "log", type: "string", visibilityForm: true, label: "Log"},
            {field: "logs", type: "string", visibilityForm: true, label: "Logs", ui: "json"},
            {field: "status", type: "string", visibilityForm: true, label: "Status"},
            {field: "startTime", type: "date", visibilityForm: true, label: "Start Time", ui: "date", time: true},
            {field: "endTime", type: "date", visibilityForm: true, label: "End Time", ui: "date", time: true},
            {field: "totalTime", type: "string", visibilityForm: true, label: "Total Time"},
            {field: "missingTime", type: "number", visibility: true, label: "missingTime"},
            {field: "missingDetails", type: "string", visibility: true, label: "missingDetails", json: true},
            {field: "error", type: "string", visibilityForm: true, label: "Error"}
        ]}
    ]},
    "pl.functionlogs": {collection: "pl.functionlogs", fields: [
        {field: "source", type: "string", visibility: true, label: "Source"},
        {field: "db", type: "string", visibility: true, label: "DB"},
        {field: "count", type: "number", visibility: true, label: "Count", ui: "number"},
        {field: "time", type: "number", visibility: true, label: "Time", ui: "number"}
    ]},
    "pl.mailcredentials": {collection: "pl.mailcredentials", fields: [
        {field: "username", type: "string"},
        {field: "password", type: "string"},
        {field: "type", type: "string"},
        {field: "from", type: "string"},
        {field: "fromname", type: "string"}
    ]},
    "pl.txs": {collection: "pl.txs", fields: []},
    "pl.connections": {collection: "pl.connections", fields: []},
    "pl.userConnections": {collection: "pl.userConnections", fields: [
        {field: "db", type: Constants.Admin.Fields.Type.STRING},
        {field: "token", type: Constants.Admin.Fields.Type.STRING, mandatory: true}
    ]},
    "pl.applocks": {collection: Constants.Admin.APP_LOCKS, fields: []},
    "pl.locks": {collection: Constants.Admin.LOCKS, fields: []},
    "pl.crons": {collection: Constants.Admin.CRONS, fields: [
        {field: Constants.Admin.Crons.NAME, type: Constants.Admin.Fields.Type.STRING, mandatory: true, primary: true, visibility: true, label: "Name"},
        {field: Constants.Admin.Crons.SERVER_NAME, type: Constants.Admin.Fields.Type.STRING, mandatory: true, visibility: true, label: "Server Name", ui: "autocomplete", options: ["cron_development", "local"], upsert: true},
        {field: Constants.Admin.Crons.STATUS, type: Constants.Admin.Fields.Type.STRING, visibility: true, label: "Status", ui: "autocomplete", options: ["Off", "On"], width: "50px"},
        {field: Constants.Admin.Crons.WHEN, type: Constants.Admin.Fields.Type.SCHEDULE, mandatory: true, visibility: true, label: "When", ui: "schedule"},
        {field: Constants.Admin.Crons.FUNCTION, type: Constants.Admin.Fields.Type.STRING, mandatory: true, visibility: true, label: "Function"},
        {field: Constants.Admin.Crons.LAST_RUN_ON, type: Constants.Admin.Fields.Type.DATE, visibility: true, label: "Last Run On", ui: "date", editableWhen: "false", time: true},
        {field: Constants.Admin.Crons.PROCESSING, type: Constants.Admin.Fields.Type.BOOLEAN, visibility: true, label: "Processing", ui: "checkbox", width: "50px"},
        {field: Constants.Admin.Crons.TIMEZONE, type: Constants.Admin.Fields.Type.STRING, visibility: true, label: "Timezone"},
        {field: Constants.Admin.Crons.DBS_STATUS, type: Constants.Admin.Fields.Type.STRING, visibility: true, label: "DBS Status"},
        {field: Constants.Admin.Crons.REPEATS, type: Constants.Admin.Fields.Type.STRING, visibility: true, label: "Repeats"},
        {field: Constants.Admin.Crons.CREATED_ON, type: Constants.Admin.Fields.Type.DATE, visibility: true, label: "Created On", ui: "date", time: true},
        {field: Constants.Admin.Crons.OWNER, type: Constants.Admin.Fields.Type.STRING, visibility: true, label: "Owner", ui: "autocomplete", options: ["Amit Singh", "Kapil Dalal", "Preeti Gulia", "Sushil Nagvan", "Shekhar Garg", "Dipendra Singh", "Praveen Goel", "Shubham Gupta"], width: "50px"},
        {field: Constants.Admin.Crons.DBS, type: Constants.Admin.Fields.Type.OBJECT, ui: "grid", visibilityForm: true, multiple: true, fields: [
            {field: Constants.Admin.Crons.Dbs.DB, type: Constants.Admin.Fields.Type.STRING, mandatory: true, visibilityForm: true, label: "DB", displayField: "db", collection: "pl.dbs", ui: "autocomplete"},
            {field: Constants.Admin.Crons.Dbs.STATUS, type: Constants.Admin.Fields.Type.STRING, visibilityForm: true, label: "Status", ui: "autocomplete", options: ["Off", "On"]},
            {field: Constants.Admin.Crons.Dbs.FUNCTION, type: Constants.Admin.Fields.Type.STRING, visibilityForm: true, label: "Function"},
            {field: Constants.Admin.Crons.Dbs.TIMEZONE, type: Constants.Admin.Fields.Type.STRING, visibilityForm: true, label: "Timezone"}
        ]}
    ], actions: [
        {visibility: true, id: "cronlogs", label: "Cron Logs", type: "view", onRow: true, collection: "pl.logs", defaultqview: {id: "pl.logs"}, filter: {"type": "Cron", "cronid._id": "$_id"}, parameters: {_id: "$_id"}}
    ]
    },
    "pl.notifications": {
        collection: Constants.Admin.NOTIFICATIONS, fields: [
            {field: Constants.Admin.Notifications.ID, type: Constants.Admin.Fields.Type.STRING, mandatory: true, primary: true, visibility: true, label: "Id"},
            {field: Constants.Admin.Notifications.VIEWID, type: Constants.Admin.Fields.Type.STRING, mandatory: true, primary: true, visibility: true, label: "View"},
            {field: Constants.Admin.Notifications.SERVER_NAME, type: Constants.Admin.Fields.Type.STRING, mandatory: true, visibilityForm: true, label: "Server Name", ui: "autocomplete", options: ["cron_development", "local"]},
            {field: Constants.Admin.Notifications.SUBJECT, type: Constants.Admin.Fields.Type.STRING, visibilityForm: true, label: "Subject", mandatory: true, json: true},
            {field: Constants.Admin.Notifications.WHEN, type: Constants.Admin.Fields.Type.SCHEDULE, mandatory: true, ui: "schedule", visibility: true, label: "When"},
            {field: Constants.Admin.Notifications.FILTER, type: Constants.Admin.Fields.Type.STRING, visibility: true, label: "Filter", json: true},
            {field: Constants.Admin.Notifications.PARAMETERS, type: Constants.Admin.Fields.Type.STRING, visibilityForm: true, label: "Parameters", json: true},
            {field: Constants.Admin.Notifications.VIEW_INFO, type: Constants.Admin.Fields.Type.STRING, visibilityForm: true, label: "View Info", json: true},
            {field: Constants.Admin.Notifications.ROLES, type: Constants.Admin.Fields.Type.STRING, multiple: true, visibility: true, label: "Roles", ui: "autocomplete", upsert: true, mandatory: true},
            {field: Constants.Admin.Notifications.STATUS, type: Constants.Admin.Fields.Type.STRING, visibility: true, label: "Status", ui: "autocomplete", options: ["Off", "On"], width: "50px"},
            {field: Constants.Admin.Notifications.LAST_RUN_ON, type: Constants.Admin.Fields.Type.DATE, visibility: true, label: "Last Run On", ui: "date", editableWhen: "false", time: true},
            {field: Constants.Admin.Notifications.PROCESSING, type: Constants.Admin.Fields.Type.BOOLEAN, visibility: true, label: "Processing", ui: "checkbox", width: "50px"},
            {field: Constants.Admin.Notifications.SKIP_MAIL, type: Constants.Admin.Fields.Type.BOOLEAN, visibility: true, label: "Skip Mail", ui: "checkbox", width: "50px"},
            {field: Constants.Admin.Notifications.DBS, type: Constants.Admin.Fields.Type.OBJECT, ui: "grid", visibilityForm: true, multiple: true, fields: [
                {field: Constants.Admin.Notifications.Dbs.DB, type: Constants.Admin.Fields.Type.STRING, mandatory: true, visibilityForm: true, label: "DB", displayField: "db", collection: "pl.dbs", ui: "autocomplete"},
                {field: Constants.Admin.Notifications.Dbs.STATUS, type: Constants.Admin.Fields.Type.STRING, visibilityForm: true, label: "Status", ui: "autocomplete", options: ["Off", "On"], mandatory: true}
            ]}
        ], actions: [
            {visibility: true, id: "Notificationlogs", label: "Notification Logs", type: "view", onRow: true, collection: "pl.logs", defaultqview: {id: "pl.logs"}, filter: {"type": "Notification", "notificationid._id": "$_id"}, parameters: {_id: "$_id"}}
        ], events: [
            {event: "onSave", pre: true, function: "Notifications.onPreSave"}
        ]
    },
    "pl.remoteSynchData": {
        collection: "pl.remoteSynchData", fields: [
            {field: "db", type: Constants.Admin.Fields.Type.STRING, visibility: true, label: "DB", filterable: true},
            {field: "date", type: Constants.Admin.Fields.Type.DATE, visibility: true, label: "Date", filterable: true},
            {field: "remoteURL", type: Constants.Admin.Fields.Type.STRING, visibility: true, label: "Remote Url", filterable: true},
            {field: "collection", type: Constants.Admin.Fields.Type.STRING, visibility: true, label: "Collection", filterable: true},
            {field: "value", type: Constants.Admin.Fields.Type.OBJECT, visibility: false, label: "Value", fields: [
                {field: "value", type: Constants.Admin.Fields.Type.STRING, visibility: true, label: "Value"}
            ]},
            {field: "update", type: Constants.Admin.Fields.Type.STRING, visibility: true, json: true, label: "Update"}
        ]
    },
    "pl.userNotifications": {
        collection: Constants.Admin.USER_NOTIFICATIONS, fields: [
            {field: Constants.Admin.UserNotifications.NOTIFICATIONID, type: Constants.Admin.Fields.Type.STRING, mandatory: true, primary: true, visibility: true, label: "Id"},
            {field: Constants.Admin.UserNotifications.STATUS, type: Constants.Admin.Fields.Type.STRING, visibility: true, label: "Status", ui: "autocomplete", options: ["Off", "On"], mandatory: true},
            {field: Constants.Admin.UserNotifications.USERID, type: Constants.Admin.Fields.Type.FK, mandatory: true, visibility: true, label: "User", collection: "pl.users", set: ["username"]}
        ]
    },
    "dummyUserNotifications": {
        collection: "dummyUserNotifications", fields: [
            {field: Constants.Admin.UserNotifications.NOTIFICATIONID, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.UserNotifications.STATUS, type: Constants.Admin.Fields.Type.STRING}
        ], events: [
            {event: "onQuery", post: true, function: "UserNotifications.onResult"},
            {event: "onSave", pre: true, function: "UserNotifications.onPreSave"}
        ]
    },
    "pl.series": {
        collection: Constants.Admin.SERIES, fields: [
            {field: Constants.Admin.Series.SERIES, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Series.COLLECTION, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Series.NUMBER, type: Constants.Admin.Fields.Type.NUMBER}
        ]
    },
    "pl.historylogs": {
        collection: "pl.historylogs"
    },
    "pl.userfieldcustomizations": {
        collection: Constants.UserFieldCustomizations.TABLE, fields: [
            {field: Constants.UserFieldCustomizations.USER_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.USERS},
            {field: Constants.FieldCustomizations.COLLECTION_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.COLLECTIONS, mandatory: true},
            {field: Constants.FieldCustomizations.QVIEW_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.QVIEWS},
            {field: Constants.FieldCustomizations.SOURCE_ID, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.FieldCustomizations.FIELD_ID, type: Constants.Admin.Fields.Type.FK, "collection": Constants.Admin.FIELDS, mandatory: true},
            {field: Constants.FieldCustomizations.LABEL, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.FieldCustomizations.INDEX_FORM, type: Constants.Admin.Fields.Type.NUMBER},
            {field: Constants.FieldCustomizations.INDEX_GRID, type: Constants.Admin.Fields.Type.NUMBER},
            {field: Constants.FieldCustomizations.WIDTH, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.FieldCustomizations.VISIBILITY_FORM, type: Constants.Admin.Fields.Type.BOOLEAN},
            {field: Constants.FieldCustomizations.VISIBILITY_GRID, type: Constants.Admin.Fields.Type.BOOLEAN}
        ]
    },
    "pl.gmailmessages": {collection: Constants.Admin.GMAIL_MESSAGES, fields: [
        {field: Constants.Admin.GmailMessages.MESSAGE_ID, type: Constants.Admin.Fields.Type.STRING, visibility: true, label: "MessageId"},
        {field: Constants.Admin.GmailMessages.USER, type: Constants.Admin.Fields.Type.OBJECT, ui: "grid", visibilityForm: true, fields: []}
    ]},
    "pl.versions": {
        collection: "pl.versions", fields: [
            {field: "date", type: "date"},
            {field: "version", type: "sequence"}
        ]
    }, "pl.queries": {
        collection: Constants.Admin.QUERIES, fields: [
            {field: Constants.Admin.Queries.ID, type: Constants.Admin.Fields.Type.STRING},
            {field: Constants.Admin.Queries.QUERY, type: Constants.Admin.Fields.Type.STRING, json: true}
        ]
    }, "pl.services": {
        collection: Constants.Admin.SERVICES, fields: [
            {field: Constants.Admin.Services.ID, type: Constants.Admin.Fields.Type.STRING, mandatory: true, visibility: true},
            {field: Constants.Admin.Services.TYPE, type: Constants.Admin.Fields.Type.STRING, visibility: true, mandatory: true},
            {field: Constants.Admin.Services.QUERY, visibility: true, type: Constants.Admin.Fields.Type.STRING, json: true},
            {field: Constants.Admin.Services.FUNCTION, visibility: true, type: Constants.Admin.Fields.Type.STRING}
        ], events: mainCollectionEvents
    }
};

exports.basicCollections = {
    "pl.users": {collection: Constants.Admin.USERS, events: [
        {
            function: "User.onPreSave",
            event: "onSave",
            pre: true
        },
        {
            function: "User.onPostSave",
            event: "onSave",
            post: true
        }
    ]}
};

exports.systemFunctions = {
    ReferredCollectionEvents: {name: "ReferredCollectionEvents", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    MainCollectionEvents: {name: "MainCollectionEvents", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    Fields: {name: "Fields", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    Menus: {name: "Menus", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    Actions: {name: "Actions", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    Qviews: {name: "Qviews", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    QviewCustomizations: {name: "QviewCustomizations", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    ReferredFks: {name: "ReferredFks", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    Metadata: {name: "Metadata", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    Roles: {name: "Roles", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    Crons: {name: "Crons", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    ImportExcelService: {name: "ImportExcelService", source: "ApplaneDB/lib", "type": "js"},
    Update: {name: "Update", source: "ApplaneApps/lib/apps/triggers", "type": "js"},
    Functions: {name: "Functions", source: "ApplaneDB/lib", type: "js"},
    Notifications: {name: "Notifications", source: "ApplaneDB/lib", type: "js"},
    UserNotifications: {name: "UserNotifications", source: "ApplaneDB/lib", type: "js"},
    SystemEvents: {name: "SystemEvents", source: "ApplaneFunctions/lib", type: "js"},
    AppSystemEvents: {name: "AppSystemEvents", source: "ApplaneFunctions/lib", type: "js"},
    Porting: {name: "Porting", source: "ApplaneApps/lib/apps", "type": "js"},
    HistoryLogs: {name: "HistoryLogs", source: "ApplaneDB/lib/modules", "type": "js"},
    NewPorting: {name: "NewPorting", source: "ApplaneApps/lib/apps", "type": "js"},
    VersionControl: {name: "VersionControl", source: "ApplaneApps/lib/apps", "type": "js"},
    TemplateJob: {name: "TemplateJob", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    ResolveTemplate: {name: "ResolveTemplate", source: "ApplaneApps/lib/apps", "type": "js"},
    User: {name: "User", source: "ApplaneApps/lib/apps", "type": "js"},
    Utility: {name: "Utility", source: "ApplaneApps/lib/apps/triggers", "type": "js"},
    Commit: {name: "Commit", source: "ApplaneApps/lib/apps", "type": "js"},
    Synch: {name: "Synch", source: "ApplaneApps/lib/apps", "type": "js"},
    RemoteDB: {name: "RemoteDB", source: "ApplaneApps/lib/apps", "type": "js"},
    getUserState: {name: "getUserState", source: "ApplaneApps/lib/apps/UserState.js"},
    GAEDataPorting: {name: "GAEDataPorting", source: "ApplaneApps/lib/apps", "type": "js"},
    ExportViewService: {name: "ExportViewService", source: "ApplaneDB/lib", "type": "js"},
    resumePorting: {name: "resumePorting", source: "ApplaneApps/lib/apps/GAEDataPorting.js"},
    view: {name: "view", source: "ApplaneApps/lib/apps", type: "js"},
    getMenuState: {name: "getMenuState", source: "ApplaneApps/lib/apps/UserState.js"},
    Processes: {name: "Processes", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    Comment: {name: "Comment", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    SaveUserState: {name: "SaveUserState", source: "ApplaneApps/lib/apps", "type": "js"},
    ImageLoader: {name: "ImageLoader", source: "ApplaneDB/lib", type: "js"},
    WorkFlow: {name: "WorkFlow", source: "ApplaneApps/lib/apps", "type": "js"},
    GoogleApiServices: {name: "GoogleApiServices", source: "ApplaneDB/lib", type: "js"},
    MailService: {name: "MailService", source: "ApplaneDB/lib", type: "js"},
    ProcessCache: {name: "ProcessCache", source: "ApplaneDB/lib/cache", type: "js"},
    MailTracker: {name: "MailTracker", source: "ApplaneDB/lib", type: "js"},
    RoadMap: {name: "RoadMap", source: "ApplaneApps/lib/apps/triggers", "type": "js"},
    Events: {name: "Events", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    WorkFlowEvents: {name: "WorkFlowEvents", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    SessionCron: {name: "SessionCron", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    PendingTransactionCron: {name: "PendingTransactionCron", source: "ApplaneApps/lib/apps/triggers", type: "js"},
    DataMining: {name: "DataMining", source: "ApplaneApps/lib/apps/triggers", type: "js"}
};
